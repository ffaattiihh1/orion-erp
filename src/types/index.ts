export type UserRole = 'admin' | 'spv' | 'accountant';

export type ProjectType = 'saha' | 'studyo' | 'gizli_musteri' | 'diger';

export type BusinessModel = 'model_a_macro' | 'model_b_micro';

export type ProjectStatus = 'draft' | 'feasibility' | 'active' | 'completed' | 'cancelled';

export type PersonnelRole = 'anketor' | 'gozlemci' | 'gizli_musteri' | 'cevirici' | 'girisci';

export type ExpenseCategory = 'yakit' | 'yemek' | 'konaklama' | 'kargo' | 'diger';

export type InvoiceStatus = 'not_invoiced' | 'invoiced' | 'collected';

export interface UserProfile {
  id: string;
  username: string; // e.g. fatih.sakar
  email: string; // e.g. fatihsakar@orionarastirma.com
  fullName: string;
  role: UserRole;
  password?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Personnel {
  id: string;
  fullName: string;
  identityNumber?: string;
  phone: string;
  city: string;
  defaultRole: PersonnelRole;
  defaultUnitPrice: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistedAt?: string;
  notes?: string;
  totalProjectsCompleted?: number;
}

export interface ProjectPersonnel {
  id: string;
  projectId: string;
  personnelId: string;
  personnelName: string;
  assignedRole: PersonnelRole;
  customUnitPrice: number; // Override price (e.g. 220 TL vs standard 180 TL)
  dailyFoodAllowance?: number;
  assignedAt: string;
}

export interface Expense {
  id: string;
  projectId: string;
  projectCode: string;
  createdBySpvId: string;
  spvName: string;
  category: ExpenseCategory;
  amount: number;
  receiptImageUrl?: string;
  description: string;
  isApproved: boolean;
  expenseDate: string;
  isOfflineQueued?: boolean;
}

export interface Advance {
  id: string;
  projectId: string;
  projectCode: string;
  personnelId: string;
  personnelName: string;
  issuedBySpvId: string;
  spvName: string;
  amount: number;
  paymentMethod: 'nakit' | 'havale';
  note?: string;
  issuedAt: string;
  isOfflineQueued?: boolean;
}

export interface Settlement {
  id: string;
  projectId: string;
  personnelId: string;
  personnelName: string;
  personnelRole: PersonnelRole;
  city?: string;
  identityNumber?: string;
  totalSurveys: number;
  invalidSurveys: number;
  validSurveys: number; // totalSurveys - invalidSurveys
  unitPriceApplied: number;
  grossAmount: number; // validSurveys * unitPriceApplied
  advancesDeducted: number;
  netPayable: number; // grossAmount - advancesDeducted
  isPaid: boolean;
  paidAt?: string;
  paymentReference?: string;
  notes?: string;
}

export interface ClientInvoice {
  id: string;
  projectId: string;
  projectCode: string;
  clientName: string;
  invoiceNumber?: string;
  invoiceAmount: number;
  status: InvoiceStatus;
  invoicedAt?: string;
  collectedAt?: string;
  notes?: string;
}

export interface CityPricing {
  city: string;
  unitPrice: number;
  targetSurveys?: number;
}

export interface Project {
  id: string;
  code: string;
  clientName: string;
  title: string;
  projectType: ProjectType;
  businessModel: BusinessModel; // Model A (İller) or Model B (İstanbul Ekip)
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  
  targetSurveys: number;
  clientUnitPrice: number;
  clientTotalBudget: number; // targetSurveys * clientUnitPrice
  
  // İl Bazlı Fiyatlandırmalar & Çalışılan İller
  cityPricing?: CityPricing[];
  cities?: string[];
  
  // Model A (İller / Dış İller)
  subcontractorName?: string;
  subcontractorUnitPrice?: number;
  
  // Model B (İstanbul Ekip / Öz Ekip)
  assignedSpvId?: string;
  assignedSpvName?: string;
  dailyOverheadRate: number; // e.g. 2000 TL / day
  defaultPersonnelRate: number; // e.g. 180 TL
  
  // Feasibility Metrics
  simulatedCost?: number;
  simulatedNetMargin?: number;
  simulatedMarginPercent?: number;
  
  notes?: string;
  createdAt: string;
  
  // Aggregated live stats
  completedSurveys?: number;
  totalExpenses?: number;
  totalAdvances?: number;
}

export interface OfflineSyncItem {
  id: string;
  type: 'EXPENSE' | 'ADVANCE' | 'SURVEY_COUNT' | 'BATCH_SETTLEMENTS';
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}
