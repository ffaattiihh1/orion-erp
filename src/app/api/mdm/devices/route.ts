import { NextResponse } from 'next/server';
import { amapi, requireAdmin, requireEnterprise, errorResponse } from '@/lib/mdm';
import type { MdmDevice } from '@/types';

interface RawDevice {
  name: string;
  state?: string;
  appliedState?: string;
  enrollmentTokenData?: string;
  enrollmentTime?: string;
  lastStatusReportTime?: string;
  lastPolicySyncTime?: string;
  policyCompliant?: boolean;
  nonComplianceDetails?: { settingName?: string; nonComplianceReason?: string; packageName?: string }[];
  hardwareInfo?: { brand?: string; model?: string; serialNumber?: string };
  networkInfo?: { imei?: string };
  softwareInfo?: { androidVersion?: string; securityPatchLevel?: string };
  powerManagementEvents?: { eventType?: string; createTime?: string; batteryLevel?: number }[];
}

function labelOf(d: RawDevice): string | undefined {
  try { return JSON.parse(d.enrollmentTokenData || '{}').label || undefined; } catch { return undefined; }
}

function toDevice(d: RawDevice): MdmDevice {
  const battery = (d.powerManagementEvents || [])
    .filter(e => e.eventType === 'BATTERY_LEVEL_COLLECTED' && typeof e.batteryLevel === 'number')
    .sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))[0];
  return {
    name: d.name,
    label: labelOf(d),
    state: d.appliedState || d.state || 'UNKNOWN',
    brand: d.hardwareInfo?.brand,
    model: d.hardwareInfo?.model,
    serialNumber: d.hardwareInfo?.serialNumber,
    imei: d.networkInfo?.imei,
    androidVersion: d.softwareInfo?.androidVersion,
    securityPatchLevel: d.softwareInfo?.securityPatchLevel,
    enrolledAt: d.enrollmentTime,
    lastSeenAt: [d.lastStatusReportTime, d.lastPolicySyncTime].filter(Boolean).sort().pop(),
    batteryLevel: battery?.batteryLevel,
    batteryAt: battery?.createTime,
    policyCompliant: d.policyCompliant !== false,
    nonCompliance: (d.nonComplianceDetails || []).map(n =>
      [n.settingName, n.packageName, n.nonComplianceReason].filter(Boolean).join(' · ')),
  };
}

export async function GET() {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  try {
    const { enterprise } = await requireEnterprise();
    const devices: MdmDevice[] = [];
    let pageToken: string | undefined;
    do {
      const page = await amapi<{ devices?: RawDevice[]; nextPageToken?: string }>(`${enterprise}/devices`, {
        query: { pageSize: '100', pageToken },
      });
      (page.devices || []).forEach(d => { if (d.state !== 'DELETED') devices.push(toDevice(d)); });
      pageToken = page.nextPageToken;
    } while (pageToken);
    devices.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name, 'tr', { numeric: true }));
    return NextResponse.json({ success: true, devices, fetchedAt: new Date().toISOString() });
  } catch (e) { return errorResponse(e); }
}
