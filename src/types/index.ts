export type UserRole = 'admin' | 'spv' | 'accountant';

export type ProjectType = 'saha' | 'nokta' | 'studyo' | 'gizli_musteri' | 'diger';

export type BusinessModel = 'model_a_macro' | 'model_b_micro';

export type ProjectStatus = 'draft' | 'feasibility' | 'active' | 'completed' | 'cancelled';

export type PersonnelRole = 'anketor' | 'gozlemci' | 'gizli_musteri' | 'cevirici' | 'girisci' | 'telefon_kontrolcu';

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

export interface ProjectNoteItem {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  noteDate?: string;
  relatedPersonnelName?: string;
  tag?: 'vardiya' | 'yedek' | 'genel' | 'saha';
  createdAt: string;
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
  createdById?: string;
  createdByName?: string; // e.g. Fatih Sakar, Kazım Şenol, Emrah Gündeyer
  createdAt?: string;
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
  observerUnitPrice?: number;
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
  clientUnitPrice: number; // Müşteriden anket başı alınan fiyat (Bize Geliş)
  clientTotalBudget: number; // targetSurveys * clientUnitPrice
  
  // İl Bazlı Fiyatlandırmalar & Çalışılan İller
  cityPricing?: CityPricing[];
  cities?: string[];
  
  // Rol Bazlı Fiyatlandırma
  defaultPersonnelRate: number; // Standart Anketör Birim Fiyatı (TL)
  observerUnitPrice?: number; // Gözlemci / Denetmen Birim Fiyatı (TL)
  
  // Model A (İller / Dış İller)
  subcontractorName?: string;
  subcontractorUnitPrice?: number;
  
  // Model B (İstanbul Ekip / Öz Ekip)
  assignedSpvId?: string;
  assignedSpvName?: string;
  dailyOverheadRate: number; // e.g. 2000 TL / day
  
  // Feasibility Metrics
  simulatedCost?: number;
  simulatedNetMargin?: number;
  simulatedMarginPercent?: number;
  
  notes?: string;
  notesList?: ProjectNoteItem[];
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  
  // Archive / Hide status
  isArchived?: boolean;
  archivedAt?: string;
  
  // Aggregated live stats
  completedSurveys?: number;
  totalExpenses?: number;
  totalAdvances?: number;
}

export type FieldStatus = 'started' | 'delayed' | 'ongoing' | 'completed' | 'paused';

export interface DailyFieldWorker {
  id: string;
  personnelId?: string;
  personnelName: string;
  onBehalfOf?: string; // Şu kişi şunun adına çalıştı (örn: "Mehmet Kaya adına")
  dailyWage: number; // Günlük yevmiye / ücret (TL)
  surveysCompleted?: number; // Bugün yaptığı anket sayısı
  role?: string; // Anketör, Gözlemci, Yedek vb.
  notes?: string;
}

export interface DailyFieldReport {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle?: string;
  reportDate: string; // YYYY-MM-DD
  locations: string; // Bugün anket yapılan noktalar (örn: "Kadıköy Rıhtım, Moda Sahil, Altıyol")
  status: FieldStatus;
  statusReason?: string; // Şundan dolayı saha başlayamadı veya gecikti açıklaması
  actualStartDate?: string; // Saha bu tarihte başladı
  workers: DailyFieldWorker[]; // Çalışan kişiler, adına çalışanlar ve günlük ücretleri
  totalDailyWage: number; // Günlük toplam anketör maliyeti
  totalDailySurveys: number; // Bugün sahada toplanan toplam anket
  notes?: string; // Genel saha notu / bugün neler yapıldı
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PhoneControlRecord {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle?: string;
  controllerId?: string;
  controllerName: string; // TK'cı adı
  controlDate: string; // YYYY-MM-DD
  dailyWage: number; // TK'cı günlük ücreti (Örn: 1000 TL, 1500 TL)
  totalCalled: number; // Kaç kişi / anket arandı
  totalApproved: number; // Kaç kişiden okey / onay alındı
  totalRejected: number; // Red / İptal sayısı
  totalUnreachable?: number; // Ulaşılamadı / Cevapsız
  approvalRate?: number; // Yüzde okey oranı
  notes?: string; // Notlar (Örn: '12 nolu anketörde tutarsızlık var')
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

export interface OfflineSyncItem {
  id: string;
  type: 'EXPENSE' | 'ADVANCE' | 'SURVEY_COUNT' | 'BATCH_SETTLEMENTS' | 'DAILY_REPORT' | 'PHONE_CONTROL';
  payload: any;
  timestamp: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

