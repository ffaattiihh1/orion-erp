import Dexie, { type Table } from 'dexie';
import { OfflineSyncItem } from '@/types';

export class OrionOfflineDB extends Dexie {
  syncQueue!: Table<OfflineSyncItem, string>;

  constructor() {
    super('OrionSahaErpDB');
    this.version(1).stores({
      syncQueue: 'id, type, timestamp, status'
    });
  }
}

export const offlineDb = typeof window !== 'undefined' ? new OrionOfflineDB() : null;

export async function queueOfflineAction(type: OfflineSyncItem['type'], payload: any): Promise<OfflineSyncItem> {
  const item: OfflineSyncItem = {
    id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
    type,
    payload,
    timestamp: Date.now(),
    status: 'PENDING'
  };

  if (offlineDb) {
    await offlineDb.syncQueue.add(item);
  }
  return item;
}

export async function getPendingOfflineActions(): Promise<OfflineSyncItem[]> {
  if (!offlineDb) return [];
  return await offlineDb.syncQueue.where('status').equals('PENDING').toArray();
}

export async function markOfflineActionSynced(id: string): Promise<void> {
  if (!offlineDb) return;
  await offlineDb.syncQueue.update(id, { status: 'SYNCED' });
}

export async function clearSyncedOfflineActions(): Promise<void> {
  if (!offlineDb) return;
  await offlineDb.syncQueue.where('status').equals('SYNCED').delete();
}
