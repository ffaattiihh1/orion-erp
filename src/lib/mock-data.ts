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
    email: 'admin@orion.com',
    fullName: 'Burak Yılmaz',
    role: 'admin',
    phone: '+90 532 100 20 30',
  },
  {
    id: 'user-spv-1',
    email: 'ahmet.spv@orion.com',
    fullName: 'Ahmet Demir (SPV)',
    role: 'spv',
    phone: '+90 533 200 40 50',
  },
  {
    id: 'user-spv-2',
    email: 'murat.spv@orion.com',
    fullName: 'Murat Çelik (SPV)',
    role: 'spv',
    phone: '+90 535 300 60 70',
  }
];

export const INITIAL_PERSONNEL: Personnel[] = [
  {
    id: 'pers-1',
    fullName: 'Selin Aksoy',
    identityNumber: '28475930218',
    phone: '+90 541 333 44 55',
    city: 'İstanbul',
    defaultRole: 'anketor',
    defaultUnitPrice: 180,
    isBlacklisted: false,
    totalProjectsCompleted: 14,
    notes: 'Hızlı ve titiz çalışan kıdemli anketör.'
  },
  {
    id: 'pers-2',
    fullName: 'Kemal Öztürk',
    identityNumber: '19482049281',
    phone: '+90 538 444 55 66',
    city: 'İstanbul',
    defaultRole: 'anketor',
    defaultUnitPrice: 180,
    isBlacklisted: false,
    totalProjectsCompleted: 9,
    notes: 'Avrupa yakası saha deneyimli.'
  },
  {
    id: 'pers-3',
    fullName: 'Canan Kaya',
    identityNumber: '39201948271',
    phone: '+90 532 555 66 77',
    city: 'İstanbul',
    defaultRole: 'gizli_musteri',
    defaultUnitPrice: 220, // Uzman fiyat
    isBlacklisted: false,
    totalProjectsCompleted: 22,
    notes: 'Lüks perakende ve otomotiv gizli müşteri uzmanı.'
  },
  {
    id: 'pers-4',
    fullName: 'Berke Tan',
    identityNumber: '48392019482',
    phone: '+90 545 666 77 88',
    city: 'Kocaeli',
    defaultRole: 'anketor',
    defaultUnitPrice: 180,
    isBlacklisted: false,
    totalProjectsCompleted: 6
  },
  {
    id: 'pers-5',
    fullName: 'Zeynep Çetin',
    identityNumber: '50294819283',
    phone: '+90 536 777 88 99',
    city: 'İstanbul',
    defaultRole: 'cevirici',
    defaultUnitPrice: 250,
    isBlacklisted: false,
    totalProjectsCompleted: 18,
    notes: 'Simültane ve simultane deşifre tecrübesi.'
  },
  {
    id: 'pers-6',
    fullName: 'Mehmet Eren',
    identityNumber: '11029384756',
    phone: '+90 543 888 99 00',
    city: 'İstanbul',
    defaultRole: 'girisci',
    defaultUnitPrice: 160,
    isBlacklisted: false,
    totalProjectsCompleted: 11
  },
  {
    id: 'pers-blacklisted-1',
    fullName: 'Emre Koç (KARA LİSTE)',
    identityNumber: '30294857162',
    phone: '+90 530 111 22 33',
    city: 'İstanbul',
    defaultRole: 'anketor',
    defaultUnitPrice: 180,
    isBlacklisted: true,
    blacklistReason: 'Kadıköy AVM sahasında mükerrer ve sahte telefon numaralı anket girişi tespit edildi. Saha denetim kurulu kararı ile süresiz men edilmiştir.',
    blacklistedAt: '2026-08-14T10:30:00Z',
    notes: 'Kesinlikle hiçbir yeni projeye atanmamalı.'
  }
];

export const INITIAL_PROJECTS: Project[] = [
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
    assignedSpvId: 'user-spv-1',
    assignedSpvName: 'Ahmet Demir (SPV)',
    dailyOverheadRate: 2000,
    defaultPersonnelRate: 180,
    simulatedCost: 194000,
    simulatedNetMargin: 110000,
    simulatedMarginPercent: 36.18,
    notes: 'İstanbul Anadolu & Avrupa yakası 10 büyük AVM ve zincir market çevresi saha çalışması.',
    createdAt: '2026-09-08T09:00:00Z',
    completedSurveys: 520,
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
    subcontractorUnitPrice: 210, // 1200 * 210 = 252,000 TL Taşeron Hakedişi -> Brüt kâr 132,000 TL
    dailyOverheadRate: 0,
    defaultPersonnelRate: 0,
    simulatedCost: 252000,
    simulatedNetMargin: 132000,
    simulatedMarginPercent: 34.38,
    notes: 'Dış il projesi. Taşeron tek fatura kesecek. Detay masraf/avans tutulmayacak.',
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
    assignedSpvId: 'user-spv-2',
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
  },
  {
    id: 'proj-4',
    code: 'ORION-2026-004',
    clientName: 'ERA Research',
    title: 'Özel Banka Şube Hizmet Kalitesi Gizli Müşteri Denetimi',
    projectType: 'gizli_musteri',
    businessModel: 'model_b_micro',
    status: 'feasibility', // FİZİBİLİTE SİMÜLATÖRÜNDE
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    targetSurveys: 400,
    clientUnitPrice: 650,
    clientTotalBudget: 260000,
    assignedSpvId: 'user-spv-1',
    assignedSpvName: 'Ahmet Demir (SPV)',
    dailyOverheadRate: 2000,
    defaultPersonnelRate: 250,
    simulatedCost: 160000,
    simulatedNetMargin: 100000,
    simulatedMarginPercent: 38.46,
    notes: 'Simülasyon onayı bekliyor. Şube başı gizli müşteri ziyareti ve ses kaydı kontrolü.',
    createdAt: '2026-09-24T16:00:00Z',
    completedSurveys: 0,
    totalExpenses: 0,
    totalAdvances: 0
  }
];

export const INITIAL_PROJECT_PERSONNEL: ProjectPersonnel[] = [
  {
    id: 'pp-1',
    projectId: 'proj-1',
    personnelId: 'pers-1',
    personnelName: 'Selin Aksoy',
    assignedRole: 'anketor',
    customUnitPrice: 200, // OVERRIDE (Standart 180 yerine 200)
    dailyFoodAllowance: 150,
    assignedAt: '2026-09-10'
  },
  {
    id: 'pp-2',
    projectId: 'proj-1',
    personnelId: 'pers-2',
    personnelName: 'Kemal Öztürk',
    assignedRole: 'anketor',
    customUnitPrice: 180, // Standart
    dailyFoodAllowance: 150,
    assignedAt: '2026-09-10'
  },
  {
    id: 'pp-3',
    projectId: 'proj-1',
    personnelId: 'pers-4',
    personnelName: 'Berke Tan',
    assignedRole: 'anketor',
    customUnitPrice: 180,
    dailyFoodAllowance: 150,
    assignedAt: '2026-09-11'
  },
  {
    id: 'pp-4',
    projectId: 'proj-3',
    personnelId: 'pers-3',
    personnelName: 'Canan Kaya',
    assignedRole: 'gizli_musteri',
    customUnitPrice: 240, // OVERRIDE
    dailyFoodAllowance: 200,
    assignedAt: '2026-09-20'
  },
  {
    id: 'pp-5',
    projectId: 'proj-3',
    personnelId: 'pers-5',
    personnelName: 'Zeynep Çetin',
    assignedRole: 'cevirici',
    customUnitPrice: 260, // OVERRIDE
    dailyFoodAllowance: 200,
    assignedAt: '2026-09-20'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    projectId: 'proj-1',
    projectCode: 'ORION-2026-001',
    createdBySpvId: 'user-spv-1',
    spvName: 'Ahmet Demir (SPV)',
    category: 'yakit',
    amount: 1450,
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    description: 'Saha aracı dizel yakıt dolumu (Opet Ataşehir)',
    isApproved: true,
    expenseDate: '2026-09-12'
  },
  {
    id: 'exp-2',
    projectId: 'proj-1',
    projectCode: 'ORION-2026-001',
    createdBySpvId: 'user-spv-1',
    spvName: 'Ahmet Demir (SPV)',
    category: 'yemek',
    amount: 980,
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=400&q=80',
    description: 'Anketör saha ekibi toplu öğle yemeği fişi',
    isApproved: true,
    expenseDate: '2026-09-14'
  },
  {
    id: 'exp-3',
    projectId: 'proj-1',
    projectCode: 'ORION-2026-001',
    createdBySpvId: 'user-spv-1',
    spvName: 'Ahmet Demir (SPV)',
    category: 'kargo',
    amount: 320,
    receiptImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    description: 'Fiziksel anket formları ve hediyelik promosyon kargo bedeli (Yurtiçi Kargo)',
    isApproved: true,
    expenseDate: '2026-09-16'
  },
  {
    id: 'exp-4',
    projectId: 'proj-3',
    projectCode: 'ORION-2026-003',
    createdBySpvId: 'user-spv-2',
    spvName: 'Murat Çelik (SPV)',
    category: 'yemek',
    amount: 1200,
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    description: 'Stüdyo odak grup katılımcı ikramları ve kahve molası',
    isApproved: true,
    expenseDate: '2026-09-21'
  }
];

export const INITIAL_ADVANCES: Advance[] = [
  {
    id: 'adv-1',
    projectId: 'proj-1',
    projectCode: 'ORION-2026-001',
    personnelId: 'pers-1',
    personnelName: 'Selin Aksoy',
    issuedBySpvId: 'user-spv-1',
    spvName: 'Ahmet Demir (SPV)',
    amount: 1500,
    paymentMethod: 'nakit',
    note: 'Saha başlangıcı acil nakit avans elden teslim edildi.',
    issuedAt: '2026-09-11T10:00:00Z'
  },
  {
    id: 'adv-2',
    projectId: 'proj-1',
    projectCode: 'ORION-2026-001',
    personnelId: 'pers-2',
    personnelName: 'Kemal Öztürk',
    issuedBySpvId: 'user-spv-1',
    spvName: 'Ahmet Demir (SPV)',
    amount: 800,
    paymentMethod: 'nakit',
    note: 'Yol ve saha avansı.',
    issuedAt: '2026-09-13T14:30:00Z'
  },
  {
    id: 'adv-3',
    projectId: 'proj-1',
    projectCode: 'ORION-2026-001',
    personnelId: 'pers-1',
    personnelName: 'Selin Aksoy',
    issuedBySpvId: 'user-spv-1',
    spvName: 'Ahmet Demir (SPV)',
    amount: 700,
    paymentMethod: 'havale',
    note: 'Hafta sonu saha avansı IBAN transferi.',
    issuedAt: '2026-09-18T16:00:00Z'
  }
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'set-1',
    projectId: 'proj-1',
    personnelId: 'pers-1',
    personnelName: 'Selin Aksoy',
    personnelRole: 'anketor',
    totalSurveys: 190,
    invalidSurveys: 8,
    validSurveys: 182, // 190 - 8
    unitPriceApplied: 200, // Override Fiyat
    grossAmount: 36400, // 182 * 200
    advancesDeducted: 2200, // (1500 + 700)
    netPayable: 34200, // 36400 - 2200
    isPaid: true,
    paidAt: '2026-09-24T15:00:00Z',
    paymentReference: 'VAKIF-TR892019482910'
  },
  {
    id: 'set-2',
    projectId: 'proj-1',
    personnelId: 'pers-2',
    personnelName: 'Kemal Öztürk',
    personnelRole: 'anketor',
    totalSurveys: 140,
    invalidSurveys: 5,
    validSurveys: 135,
    unitPriceApplied: 180,
    grossAmount: 24300,
    advancesDeducted: 800,
    netPayable: 23500,
    isPaid: false
  },
  {
    id: 'set-3',
    projectId: 'proj-1',
    personnelId: 'pers-4',
    personnelName: 'Berke Tan',
    personnelRole: 'anketor',
    totalSurveys: 110,
    invalidSurveys: 4,
    validSurveys: 106,
    unitPriceApplied: 180,
    grossAmount: 19080,
    advancesDeducted: 0,
    netPayable: 19080,
    isPaid: false
  }
];

export const INITIAL_CLIENT_INVOICES: ClientInvoice[] = [
  {
    id: 'inv-1',
    projectId: 'proj-1',
    projectCode: 'ORION-2026-001',
    clientName: 'Ipsos Türkiye',
    invoiceNumber: 'IPS-2026-0941',
    invoiceAmount: 304000,
    status: 'invoiced',
    invoicedAt: '2026-09-22',
    notes: '30 gün vadeli e-arşiv fatura gönderildi.'
  },
  {
    id: 'inv-2',
    projectId: 'proj-2',
    projectCode: 'ORION-2026-002',
    clientName: 'GfK Araştırma',
    invoiceNumber: 'GFK-2026-0418',
    invoiceAmount: 384000,
    status: 'collected',
    invoicedAt: '2026-09-15',
    collectedAt: '2026-09-23',
    notes: 'Erken ödeme ile banka hesabımıza geçti.'
  },
  {
    id: 'inv-3',
    projectId: 'proj-3',
    projectCode: 'ORION-2026-003',
    clientName: 'NielsenIQ',
    invoiceAmount: 132000,
    status: 'not_invoiced',
    notes: 'Saha bitiminde son anket sayısı teyidiyle kesilecek.'
  }
];
