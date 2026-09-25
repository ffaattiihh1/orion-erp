import { 
  UserProfile, 
  Personnel, 
  Project, 
  ProjectPersonnel, 
  Expense, 
  Advance, 
  Settlement, 
  ClientInvoice 
} from '@/types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    username: 'burak.yilmaz',
    email: 'admin@orionarastirma.com',
    fullName: 'Burak Yılmaz (Müdür / Merkez)',
    role: 'admin',
    password: '123',
    phone: '+90 532 100 20 30',
  },
  {
    id: 'user-spv-fatih',
    username: 'fatih.sakar',
    email: 'fatihsakar@orionarastirma.com',
    fullName: 'Fatih Sakar (SPV)',
    role: 'spv',
    password: '123',
    phone: '+90 533 500 60 70',
  },
  {
    id: 'user-spv-murat',
    username: 'murat.celik',
    email: 'murat.celik@orionarastirma.com',
    fullName: 'Murat Çelik (SPV)',
    role: 'spv',
    password: '123',
    phone: '+90 535 300 60 70',
  }
];

export const INITIAL_PERSONNEL: Personnel[] = [
  {
    id: 'pers-hacer',
    fullName: 'HACER KARA',
    identityNumber: '6851974',
    phone: '+90 542 111 22 33',
    city: 'Ankara',
    defaultRole: 'anketor',
    defaultUnitPrice: 320,
    isBlacklisted: false,
    totalProjectsCompleted: 8,
    notes: 'Ankara saha deneyimli kıdemli anketör.'
  },
  {
    id: 'pers-ali',
    fullName: 'ALİ ACAR',
    identityNumber: '3705002',
    phone: '+90 533 222 33 44',
    city: 'Ankara',
    defaultRole: 'anketor',
    defaultUnitPrice: 320,
    isBlacklisted: false,
    totalProjectsCompleted: 5,
    notes: 'Merkez ilçe saha çalışması.'
  },
  {
    id: 'pers-deniz',
    fullName: 'DENİZ DERİN',
    identityNumber: '1101596',
    phone: '+90 535 333 44 55',
    city: 'Ankara',
    defaultRole: 'anketor',
    defaultUnitPrice: 320,
    isBlacklisted: false,
    totalProjectsCompleted: 12
  },
  {
    id: 'pers-hasan',
    fullName: 'HASAN TAŞ',
    identityNumber: '1272877',
    phone: '+90 544 444 55 66',
    city: 'Ankara',
    defaultRole: 'anketor',
    defaultUnitPrice: 320,
    isBlacklisted: false,
    totalProjectsCompleted: 6
  },
  {
    id: 'pers-cihan',
    fullName: 'CİHAN YILMAZ',
    identityNumber: '2392087',
    phone: '+90 538 555 66 77',
    city: 'Ankara',
    defaultRole: 'anketor',
    defaultUnitPrice: 320,
    isBlacklisted: false,
    totalProjectsCompleted: 9
  },
  {
    id: 'pers-ayla',
    fullName: 'AYLA AKAT',
    identityNumber: '4147286',
    phone: '+90 532 666 77 88',
    city: 'Ankara',
    defaultRole: 'anketor',
    defaultUnitPrice: 320,
    isBlacklisted: false,
    totalProjectsCompleted: 7
  },
  {
    id: 'pers-selin',
    fullName: 'Selin Aksoy',
    identityNumber: '28475930218',
    phone: '+90 541 333 44 55',
    city: 'İstanbul',
    defaultRole: 'anketor',
    defaultUnitPrice: 200,
    isBlacklisted: false,
    totalProjectsCompleted: 14,
    notes: 'Hızlı ve titiz çalışan kıdemli anketör.'
  },
  {
    id: 'pers-kemal',
    fullName: 'Kemal Öztürk',
    identityNumber: '19482049281',
    phone: '+90 538 444 55 66',
    city: 'İstanbul',
    defaultRole: 'anketor',
    defaultUnitPrice: 180,
    isBlacklisted: false,
    totalProjectsCompleted: 9
  },
  {
    id: 'pers-canan',
    fullName: 'Canan Kaya',
    identityNumber: '39201948271',
    phone: '+90 532 555 66 77',
    city: 'İstanbul',
    defaultRole: 'gizli_musteri',
    defaultUnitPrice: 250,
    isBlacklisted: false,
    totalProjectsCompleted: 22
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-ankara-01',
    code: 'ORION-2026-005',
    clientName: 'Ipsos Türkiye',
    title: 'Ankara İl Geneli Tüketici Saha Araştırması',
    projectType: 'saha',
    businessModel: 'model_b_micro',
    status: 'active',
    startDate: '2026-09-15',
    endDate: '2026-10-15',
    targetSurveys: 500,
    clientUnitPrice: 450,
    clientTotalBudget: 225000,
    assignedSpvId: 'user-spv-fatih',
    assignedSpvName: 'Fatih Sakar (SPV)',
    dailyOverheadRate: 2000,
    defaultPersonnelRate: 320,
    simulatedCost: 160000,
    simulatedNetMargin: 65000,
    simulatedMarginPercent: 28.89,
    notes: 'Ankara merkez ilçeler hanehalkı saha araştırması. Fatih Sakar koordinasyonunda.',
    createdAt: '2026-09-14T09:00:00Z',
    completedSurveys: 35,
    totalExpenses: 2850,
    totalAdvances: 3200
  },
  {
    id: 'proj-1',
    code: 'ORION-2026-001',
    clientName: 'Ipsos Türkiye',
    title: 'Süpermarket Tüketici Satın Alma & Memnuniyet Araştırması',
    projectType: 'saha',
    businessModel: 'model_b_micro',
    status: 'active',
    startDate: '2026-09-10',
    endDate: '2026-10-05',
    targetSurveys: 800,
    clientUnitPrice: 380,
    clientTotalBudget: 304000,
    assignedSpvId: 'user-spv-fatih',
    assignedSpvName: 'Fatih Sakar (SPV)',
    dailyOverheadRate: 2000,
    defaultPersonnelRate: 180,
    simulatedCost: 194000,
    simulatedNetMargin: 110000,
    simulatedMarginPercent: 36.18,
    notes: 'İstanbul Anadolu & Avrupa yakası 10 büyük AVM ve zincir market çevresi saha çalışması.',
    createdAt: '2026-09-08T09:00:00Z',
    completedSurveys: 423,
    totalExpenses: 8450,
    totalAdvances: 16200
  },
  {
    id: 'proj-2',
    code: 'ORION-2026-002',
    clientName: 'GfK Araştırma',
    title: 'İzmir & Ege Bölgesi Perakende Fiyat ve Tanzim Denetimi',
    projectType: 'saha',
    businessModel: 'model_a_macro', // TAŞERON
    status: 'active',
    startDate: '2026-09-15',
    endDate: '2026-10-10',
    targetSurveys: 1200,
    clientUnitPrice: 320,
    clientTotalBudget: 384000,
    subcontractorName: 'Ege Saha Araştırma Ltd. Şti.',
    subcontractorUnitPrice: 210,
    dailyOverheadRate: 0,
    defaultPersonnelRate: 0,
    simulatedCost: 252000,
    simulatedNetMargin: 132000,
    simulatedMarginPercent: 34.38,
    notes: 'Dış il projesi. Taşeron tek fatura kesecek.',
    createdAt: '2026-09-12T14:00:00Z',
    completedSurveys: 740,
    totalExpenses: 0,
    totalAdvances: 0
  },
  {
    id: 'proj-3',
    code: 'ORION-2026-003',
    clientName: 'NielsenIQ',
    title: 'Yeni Nesil İçecek Ambalaj Tadım & Odak Grup (Stüdyo)',
    projectType: 'studyo',
    businessModel: 'model_b_micro',
    status: 'active',
    startDate: '2026-09-20',
    endDate: '2026-10-02',
    targetSurveys: 240,
    clientUnitPrice: 550,
    clientTotalBudget: 132000,
    assignedSpvId: 'user-spv-murat',
    assignedSpvName: 'Murat Çelik (SPV)',
    dailyOverheadRate: 2500,
    defaultPersonnelRate: 220,
    simulatedCost: 82000,
    simulatedNetMargin: 50000,
    simulatedMarginPercent: 37.88,
    notes: 'Levent stüdyomuzda 6 gün boyunca tadım ve çeviri seansları.',
    createdAt: '2026-09-18T11:00:00Z',
    completedSurveys: 160,
    totalExpenses: 4200,
    totalAdvances: 5500
  }
];

export const INITIAL_PROJECT_PERSONNEL: ProjectPersonnel[] = [
  {
    id: 'pp-hacer',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-hacer',
    personnelName: 'HACER KARA',
    assignedRole: 'anketor',
    customUnitPrice: 320,
    assignedAt: '2026-09-15'
  },
  {
    id: 'pp-ali',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-ali',
    personnelName: 'ALİ ACAR',
    assignedRole: 'anketor',
    customUnitPrice: 320,
    assignedAt: '2026-09-15'
  },
  {
    id: 'pp-deniz',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-deniz',
    personnelName: 'DENİZ DERİN',
    assignedRole: 'anketor',
    customUnitPrice: 320,
    assignedAt: '2026-09-15'
  },
  {
    id: 'pp-hasan',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-hasan',
    personnelName: 'HASAN TAŞ',
    assignedRole: 'anketor',
    customUnitPrice: 320,
    assignedAt: '2026-09-15'
  },
  {
    id: 'pp-cihan',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-cihan',
    personnelName: 'CİHAN YILMAZ',
    assignedRole: 'anketor',
    customUnitPrice: 320,
    assignedAt: '2026-09-15'
  },
  {
    id: 'pp-ayla',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-ayla',
    personnelName: 'AYLA AKAT',
    assignedRole: 'anketor',
    customUnitPrice: 320,
    assignedAt: '2026-09-15'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-ankara-1',
    projectId: 'proj-ankara-01',
    projectCode: 'ORION-2026-005',
    createdBySpvId: 'user-spv-fatih',
    spvName: 'Fatih Sakar (SPV)',
    category: 'yakit',
    amount: 1450,
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    description: 'Ankara Kızılay-Çankaya saha aracı mazot fişi',
    isApproved: true,
    expenseDate: '2026-09-18'
  },
  {
    id: 'exp-ankara-2',
    projectId: 'proj-ankara-01',
    projectCode: 'ORION-2026-005',
    createdBySpvId: 'user-spv-fatih',
    spvName: 'Fatih Sakar (SPV)',
    category: 'yemek',
    amount: 1400,
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=400&q=80',
    description: 'Saha anketör ekibi öğle yemeği',
    isApproved: true,
    expenseDate: '2026-09-20'
  }
];

export const INITIAL_ADVANCES: Advance[] = [
  {
    id: 'adv-ankara-1',
    projectId: 'proj-ankara-01',
    projectCode: 'ORION-2026-005',
    personnelId: 'pers-hacer',
    personnelName: 'HACER KARA',
    issuedBySpvId: 'user-spv-fatih',
    spvName: 'Fatih Sakar (SPV)',
    amount: 500,
    paymentMethod: 'nakit',
    note: 'Saha yol avansı',
    issuedAt: '2026-09-16T10:00:00Z'
  },
  {
    id: 'adv-ankara-2',
    projectId: 'proj-ankara-01',
    projectCode: 'ORION-2026-005',
    personnelId: 'pers-ali',
    personnelName: 'ALİ ACAR',
    issuedBySpvId: 'user-spv-fatih',
    spvName: 'Fatih Sakar (SPV)',
    amount: 400,
    paymentMethod: 'nakit',
    note: 'Elden teslim avans',
    issuedAt: '2026-09-17T11:30:00Z'
  }
];

// Matches the exact table format from user's image!
export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'set-ankara-1',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-hacer',
    personnelName: 'HACER KARA',
    personnelRole: 'anketor',
    city: 'Ankara',
    identityNumber: '6851974',
    totalSurveys: 7,
    invalidSurveys: 0,
    validSurveys: 7,
    unitPriceApplied: 320,
    grossAmount: 2240, // 7 * 320
    advancesDeducted: 500,
    netPayable: 1740, // 2240 - 500
    isPaid: true,
    paidAt: '2026-09-24T14:00:00Z',
    paymentReference: 'VAKIF-ANK-1029',
    notes: 'Tamamlandı'
  },
  {
    id: 'set-ankara-2',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-ali',
    personnelName: 'ALİ ACAR',
    personnelRole: 'anketor',
    city: 'Ankara',
    identityNumber: '3705002',
    totalSurveys: 5,
    invalidSurveys: 0,
    validSurveys: 5,
    unitPriceApplied: 320,
    grossAmount: 1600, // 5 * 320
    advancesDeducted: 400,
    netPayable: 1200, // 1600 - 400
    isPaid: false,
    notes: ''
  },
  {
    id: 'set-ankara-3',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-deniz',
    personnelName: 'DENİZ DERİN',
    personnelRole: 'anketor',
    city: 'Ankara',
    identityNumber: '1101596',
    totalSurveys: 6,
    invalidSurveys: 1,
    validSurveys: 5, // 6 - 1
    unitPriceApplied: 320,
    grossAmount: 1600, // 5 * 320
    advancesDeducted: 0,
    netPayable: 1600,
    isPaid: false,
    notes: '1 mükerrer anket iptal edildi'
  },
  {
    id: 'set-ankara-4',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-hasan',
    personnelName: 'HASAN TAŞ',
    personnelRole: 'anketor',
    city: 'Ankara',
    identityNumber: '1272877',
    totalSurveys: 7,
    invalidSurveys: 0,
    validSurveys: 7,
    unitPriceApplied: 320,
    grossAmount: 2240,
    advancesDeducted: 0,
    netPayable: 2240,
    isPaid: true,
    paidAt: '2026-09-24T15:00:00Z',
    notes: ''
  },
  {
    id: 'set-ankara-5',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-cihan',
    personnelName: 'CİHAN YILMAZ',
    personnelRole: 'anketor',
    city: 'Ankara',
    identityNumber: '2392087',
    totalSurveys: 6,
    invalidSurveys: 0,
    validSurveys: 6,
    unitPriceApplied: 320,
    grossAmount: 1920,
    advancesDeducted: 0,
    netPayable: 1920,
    isPaid: false,
    notes: ''
  },
  {
    id: 'set-ankara-6',
    projectId: 'proj-ankara-01',
    personnelId: 'pers-ayla',
    personnelName: 'AYLA AKAT',
    personnelRole: 'anketor',
    city: 'Ankara',
    identityNumber: '4147286',
    totalSurveys: 6,
    invalidSurveys: 0,
    validSurveys: 6,
    unitPriceApplied: 320,
    grossAmount: 1920,
    advancesDeducted: 0,
    netPayable: 1920,
    isPaid: false,
    notes: ''
  }
];

export const INITIAL_CLIENT_INVOICES: ClientInvoice[] = [
  {
    id: 'inv-ankara-1',
    projectId: 'proj-ankara-01',
    projectCode: 'ORION-2026-005',
    clientName: 'Ipsos Türkiye',
    invoiceNumber: 'IPS-2026-1044',
    invoiceAmount: 225000,
    status: 'invoiced',
    invoicedAt: '2026-09-24',
    notes: 'Ankara saha hakediş faturası kesildi.'
  }
];
