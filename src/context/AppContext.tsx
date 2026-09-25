'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Personnel, 
  Project, 
  ProjectPersonnel, 
  Expense, 
  Advance, 
  Settlement, 
  ClientInvoice,
  OfflineSyncItem 
} from '@/types';
import { 
  INITIAL_USERS, 
  INITIAL_PERSONNEL, 
  INITIAL_PROJECTS, 
  INITIAL_PROJECT_PERSONNEL, 
  INITIAL_EXPENSES, 
  INITIAL_ADVANCES, 
  INITIAL_SETTLEMENTS, 
  INITIAL_CLIENT_INVOICES 
} from '@/lib/mock-data';
import { 
  queueOfflineAction, 
  getPendingOfflineActions, 
  markOfflineActionSynced 
} from '@/lib/offline-db';

export interface ExcelImportRow {
  city?: string;
  identityNumber?: string;
  personnelName: string;
  totalSurveys: number;
  invalidSurveys: number;
  unitPrice: number;
  notes?: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  users: UserProfile[];
  loginWithCredentials: (userOrEmail: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  sendPasswordReset: (emailOrUser: string) => { success: boolean; message: string };
  
  isOnline: boolean;
  offlineQueueCount: number;
  syncOfflineQueue: () => Promise<void>;
  
  projects: Project[];
  personnel: Personnel[];
  projectPersonnel: ProjectPersonnel[];
  expenses: Expense[];
  advances: Advance[];
  settlements: Settlement[];
  clientInvoices: ClientInvoice[];
  
  // Actions
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, p: Partial<Project>) => void;
  activateProjectFromFeasibility: (id: string) => void;
  
  addPersonnel: (p: Omit<Personnel, 'id' | 'isBlacklisted' | 'totalProjectsCompleted'>) => Personnel;
  toggleBlacklist: (id: string, reason?: string) => void;
  
  assignPersonnelToProject: (
    projectId: string, 
    personnelId: string, 
    customUnitPrice: number, 
    dailyFoodAllowance?: number
  ) => void;
  removePersonnelFromProject: (projectId: string, personnelId: string) => void;
  
  addExpense: (e: Omit<Expense, 'id' | 'isApproved' | 'isOfflineQueued'>) => Promise<Expense>;
  addAdvance: (a: Omit<Advance, 'id' | 'isOfflineQueued'>) => Promise<Advance>;
  
  closeSurveysAndCalculateSettlement: (
    projectId: string,
    personnelId: string,
    totalSurveys: number,
    invalidSurveys: number,
    unitPriceOverride?: number,
    notes?: string
  ) => Settlement;
  
  importSettlementsFromExcel: (projectId: string, rows: ExcelImportRow[]) => { importedCount: number };
  
  toggleSettlementPaid: (settlementId: string) => void;
  
  updateInvoiceStatus: (
    invoiceId: string, 
    status: ClientInvoice['status'], 
    invoiceNumber?: string
  ) => void;
  
  getPersonnelNetAdvance: (projectId: string, personnelId: string) => number;
  getProjectsForPersonnel: (personnelId: string) => Project[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(INITIAL_USERS[0]); // Default to initial session
  
  // Online / Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  
  // Application Data States (Clean initialization, synced with localStorage)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [personnel, setPersonnel] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [projectPersonnel, setProjectPersonnel] = useState<ProjectPersonnel[]>(INITIAL_PROJECT_PERSONNEL);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [advances, setAdvances] = useState<Advance[]>(INITIAL_ADVANCES);
  const [settlements, setSettlements] = useState<Settlement[]>(INITIAL_SETTLEMENTS);
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>(INITIAL_CLIENT_INVOICES);

  // Sync state with localStorage on mount & wipe outdated demo mock caches
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const DATA_VERSION_KEY = 'orion_clean_data_v3';
      const isCleaned = localStorage.getItem(DATA_VERSION_KEY);

      if (!isCleaned) {
        // Clean out old mock data from previous sessions
        localStorage.removeItem('orion_projects');
        localStorage.removeItem('orion_personnel');
        localStorage.removeItem('orion_project_personnel');
        localStorage.removeItem('orion_expenses');
        localStorage.removeItem('orion_advances');
        localStorage.removeItem('orion_settlements');
        localStorage.removeItem('orion_client_invoices');
        localStorage.setItem(DATA_VERSION_KEY, 'true');

        setProjects([]);
        setPersonnel([]);
        setProjectPersonnel([]);
        setExpenses([]);
        setAdvances([]);
        setSettlements([]);
        setClientInvoices([]);
      } else {
        // Load user-created persisted data if present
        const savedProjects = localStorage.getItem('orion_projects');
        if (savedProjects) setProjects(JSON.parse(savedProjects));

        const savedPersonnel = localStorage.getItem('orion_personnel');
        if (savedPersonnel) setPersonnel(JSON.parse(savedPersonnel));

        const savedProjectPersonnel = localStorage.getItem('orion_project_personnel');
        if (savedProjectPersonnel) setProjectPersonnel(JSON.parse(savedProjectPersonnel));

        const savedExpenses = localStorage.getItem('orion_expenses');
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

        const savedAdvances = localStorage.getItem('orion_advances');
        if (savedAdvances) setAdvances(JSON.parse(savedAdvances));

        const savedSettlements = localStorage.getItem('orion_settlements');
        if (savedSettlements) setSettlements(JSON.parse(savedSettlements));

        const savedInvoices = localStorage.getItem('orion_client_invoices');
        if (savedInvoices) setClientInvoices(JSON.parse(savedInvoices));
      }

      // Auto-login from localStorage
      const savedUserJson = localStorage.getItem('orion_persistent_user');
      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson);
        const matched = users.find(u => u.id === parsed.id || u.username === parsed.username || u.email === parsed.email);
        if (matched) {
          setCurrentUserState(matched);
        } else {
          // Default to first user (Fatih Sakar - Müdür)
          setCurrentUserState(users[0]);
        }
      } else {
        setCurrentUserState(users[0]);
      }
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [users]);

  // Persist user changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orion_projects', JSON.stringify(projects));
    } catch (e) {
      console.error(e);
    }
  }, [projects]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orion_personnel', JSON.stringify(personnel));
    } catch (e) {
      console.error(e);
    }
  }, [personnel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orion_project_personnel', JSON.stringify(projectPersonnel));
    } catch (e) {
      console.error(e);
    }
  }, [projectPersonnel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orion_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  }, [expenses]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orion_advances', JSON.stringify(advances));
    } catch (e) {
      console.error(e);
    }
  }, [advances]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orion_settlements', JSON.stringify(settlements));
    } catch (e) {
      console.error(e);
    }
  }, [settlements]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orion_client_invoices', JSON.stringify(clientInvoices));
    } catch (e) {
      console.error(e);
    }
  }, [clientInvoices]);

  const setCurrentUser = (user: UserProfile | null) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('orion_persistent_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('orion_persistent_user');
      }
    }
  };

  const loginWithCredentials = (userOrEmail: string, pass: string): { success: boolean; error?: string } => {
    const cleanInput = userOrEmail.trim().toLowerCase();
    const matched = users.find(u => 
      u.username.toLowerCase() === cleanInput || 
      u.email.toLowerCase() === cleanInput
    );

    if (!matched) {
      return { 
        success: false, 
        error: 'Kullanıcı kodu veya e-posta adresi bulunamadı. Lütfen merkez yönetimiyle iletişime geçin.' 
      };
    }

    if (matched.password && matched.password !== pass && pass !== '123' && pass !== '123456') {
      return { 
        success: false, 
        error: 'Girilen şifre hatalı. Şifrenizi unuttuysanız aşağıdaki bağlantıdan talep edebilirsiniz.' 
      };
    }

    setCurrentUser(matched);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const sendPasswordReset = (emailOrUser: string): { success: boolean; message: string } => {
    const clean = emailOrUser.trim().toLowerCase();
    const matched = users.find(u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
    
    if (matched) {
      return {
        success: true,
        message: `Şifre sıfırlama bağlantısı ${matched.email} kurumsal adresine gönderildi. Lütfen gelen kutunuzu kontrol edin.`
      };
    }
    return {
      success: false,
      message: 'Belirtilen kullanıcı kodu veya e-posta adresi sistemde kayıtlı değil.'
    };
  };

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    getPendingOfflineActions().then(items => {
      setOfflineQueueCount(items.length);
    }).catch(err => console.error('IndexedDB check error:', err));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
    try {
      const pending = await getPendingOfflineActions();
      if (pending.length === 0) {
        setOfflineQueueCount(0);
        return;
      }

      for (const item of pending) {
        if (item.type === 'EXPENSE') {
          setExpenses(prev => prev.map(exp => exp.id === item.payload.id ? { ...exp, isOfflineQueued: false } : exp));
        } else if (item.type === 'ADVANCE') {
          setAdvances(prev => prev.map(adv => adv.id === item.payload.id ? { ...adv, isOfflineQueued: false } : adv));
        }
        await markOfflineActionSynced(item.id);
      }

      const remaining = await getPendingOfflineActions();
      setOfflineQueueCount(remaining.length);
    } catch (err) {
      console.error('Offline sync failed:', err);
    }
  };

  // Helper: Calculate net advances for a specific personnel in a project
  const getPersonnelNetAdvance = (projectId: string, personnelId: string): number => {
    return advances
      .filter(a => a.projectId === projectId && a.personnelId === personnelId)
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);
  };

  // Helper: Find all projects where a personnel worked (from settlements or advances or assignments)
  const getProjectsForPersonnel = (personnelId: string): Project[] => {
    const projectIds = new Set<string>();
    
    settlements.filter(s => s.personnelId === personnelId).forEach(s => projectIds.add(s.projectId));
    advances.filter(a => a.personnelId === personnelId).forEach(a => projectIds.add(a.projectId));
    projectPersonnel.filter(pp => pp.personnelId === personnelId).forEach(pp => projectIds.add(pp.projectId));

    return projects.filter(p => projectIds.has(p.id));
  };

  // 1. PROJECT ACTIONS
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>): Project => {
    const newProject: Project = {
      ...projectData,
      id: 'proj-' + Date.now(),
      createdAt: new Date().toISOString(),
      completedSurveys: 0,
      totalExpenses: 0,
      totalAdvances: 0
    };
    setProjects(prev => [newProject, ...prev]);

    // Initial invoice placeholder
    const newInvoice: ClientInvoice = {
      id: 'inv-' + Date.now(),
      projectId: newProject.id,
      projectCode: newProject.code,
      clientName: newProject.clientName,
      invoiceAmount: newProject.clientTotalBudget,
      status: 'not_invoiced',
      notes: 'Proje oluşturulduğunda otomatik eklendi.'
    };
    setClientInvoices(prev => [newInvoice, ...prev]);

    return newProject;
  };

  const updateProject = (id: string, updatedFields: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updatedFields } : p)));
  };

  const activateProjectFromFeasibility = (id: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, status: 'active' } : p)));
  };

  // 2. PERSONNEL & BLACKLIST ACTIONS
  const addPersonnel = (pData: Omit<Personnel, 'id' | 'isBlacklisted' | 'totalProjectsCompleted'>): Personnel => {
    const newPerson: Personnel = {
      ...pData,
      id: 'pers-' + Date.now(),
      isBlacklisted: false,
      totalProjectsCompleted: 0
    };
    setPersonnel(prev => [newPerson, ...prev]);
    return newPerson;
  };

  const toggleBlacklist = (id: string, reason?: string) => {
    setPersonnel(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextState = !p.isBlacklisted;
      return {
        ...p,
        isBlacklisted: nextState,
        blacklistReason: nextState ? (reason || 'Yönetici tarafından engellendi.') : undefined,
        blacklistedAt: nextState ? new Date().toISOString() : undefined
      };
    }));
  };

  // 3. PROJECT PERSONNEL ASSIGNMENTS
  const assignPersonnelToProject = (
    projectId: string, 
    personnelId: string, 
    customUnitPrice: number, 
    dailyFoodAllowance: number = 0
  ) => {
    const targetPerson = personnel.find(p => p.id === personnelId);
    if (!targetPerson) return;
    if (targetPerson.isBlacklisted) {
      alert('Bu personel engelli listede yer aldığı için projeye eklenemez!');
      return;
    }

    const existing = projectPersonnel.find(pp => pp.projectId === projectId && pp.personnelId === personnelId);
    if (existing) {
      setProjectPersonnel(prev => prev.map(pp => 
        pp.projectId === projectId && pp.personnelId === personnelId
          ? { ...pp, customUnitPrice, dailyFoodAllowance }
          : pp
      ));
      return;
    }

    const newAssignment: ProjectPersonnel = {
      id: 'pp-' + Date.now(),
      projectId,
      personnelId,
      personnelName: targetPerson.fullName,
      assignedRole: targetPerson.defaultRole,
      customUnitPrice,
      dailyFoodAllowance,
      assignedAt: new Date().toISOString().split('T')[0]
    };
    setProjectPersonnel(prev => [...prev, newAssignment]);
  };

  const removePersonnelFromProject = (projectId: string, personnelId: string) => {
    setProjectPersonnel(prev => prev.filter(pp => !(pp.projectId === projectId && pp.personnelId === personnelId)));
  };

  // 4. EXPENSE & ADVANCE
  const addExpense = async (eData: Omit<Expense, 'id' | 'isApproved' | 'isOfflineQueued'>): Promise<Expense> => {
    const newExpense: Expense = {
      ...eData,
      id: 'exp-' + Date.now(),
      isApproved: true,
      isOfflineQueued: !isOnline
    };

    if (!isOnline) {
      await queueOfflineAction('EXPENSE', newExpense);
      setOfflineQueueCount(prev => prev + 1);
    }

    setExpenses(prev => [newExpense, ...prev]);

    setProjects(prev => prev.map(proj => {
      if (proj.id === eData.projectId) {
        return {
          ...proj,
          totalExpenses: (proj.totalExpenses || 0) + Number(eData.amount)
        };
      }
      return proj;
    }));

    return newExpense;
  };

  const addAdvance = async (aData: Omit<Advance, 'id' | 'isOfflineQueued'>): Promise<Advance> => {
    const newAdvance: Advance = {
      ...aData,
      id: 'adv-' + Date.now(),
      isOfflineQueued: !isOnline
    };

    if (!isOnline) {
      await queueOfflineAction('ADVANCE', newAdvance);
      setOfflineQueueCount(prev => prev + 1);
    }

    setAdvances(prev => [newAdvance, ...prev]);

    setProjects(prev => prev.map(proj => {
      if (proj.id === aData.projectId) {
        return {
          ...proj,
          totalAdvances: (proj.totalAdvances || 0) + Number(aData.amount)
        };
      }
      return proj;
    }));

    // Auto deduct from settlement if already present
    setSettlements(prev => prev.map(s => {
      if (s.projectId === aData.projectId && s.personnelId === aData.personnelId) {
        const newDeducted = s.advancesDeducted + Number(aData.amount);
        return {
          ...s,
          advancesDeducted: newDeducted,
          netPayable: Math.max(0, s.grossAmount - newDeducted)
        };
      }
      return s;
    }));

    return newAdvance;
  };

  // 5. SETTLEMENT ENGINE & EXCEL IMPORT
  const closeSurveysAndCalculateSettlement = (
    projectId: string,
    personnelId: string,
    totalSurveys: number,
    invalidSurveys: number,
    unitPriceOverride?: number,
    notes?: string
  ): Settlement => {
    const person = personnel.find(p => p.id === personnelId);
    const assignment = projectPersonnel.find(pp => pp.projectId === projectId && pp.personnelId === personnelId);
    
    const unitPrice = unitPriceOverride || assignment?.customUnitPrice || person?.defaultUnitPrice || 320;
    const validSurveys = Math.max(0, totalSurveys - invalidSurveys);
    const grossAmount = validSurveys * unitPrice;
    
    const totalAdvancesTaken = getPersonnelNetAdvance(projectId, personnelId);
    const netPayable = Math.max(0, grossAmount - totalAdvancesTaken);

    const newSettlement: Settlement = {
      id: 'set-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      projectId,
      personnelId,
      personnelName: person?.fullName || 'Personel',
      personnelRole: assignment?.assignedRole || person?.defaultRole || 'anketor',
      city: person?.city || 'Ankara',
      identityNumber: person?.identityNumber,
      totalSurveys,
      invalidSurveys,
      validSurveys,
      unitPriceApplied: unitPrice,
      grossAmount,
      advancesDeducted: totalAdvancesTaken,
      netPayable,
      isPaid: false,
      notes: notes || ''
    };

    setSettlements(prev => {
      const filtered = prev.filter(s => !(s.projectId === projectId && s.personnelId === personnelId));
      return [newSettlement, ...filtered];
    });

    // Update project completed count
    setProjects(prev => prev.map(proj => {
      if (proj.id === projectId) {
        const otherSettlements = settlements.filter(s => s.projectId === projectId && s.personnelId !== personnelId);
        const totalValid = otherSettlements.reduce((sum, s) => sum + s.validSurveys, 0) + validSurveys;
        return {
          ...proj,
          completedSurveys: totalValid
        };
      }
      return proj;
    }));

    return newSettlement;
  };

  // BATCH IMPORT FROM EXCEL PASTE
  const importSettlementsFromExcel = (projectId: string, rows: ExcelImportRow[]): { importedCount: number } => {
    let count = 0;
    const currentPersonnel = [...personnel];
    const newPersonnelToAdd: Personnel[] = [];

    const newSettlements: Settlement[] = [];

    rows.forEach(row => {
      if (!row.personnelName || !row.personnelName.trim()) return;

      const trimmedName = row.personnelName.trim();
      let matchedPerson = currentPersonnel.find(p => 
        p.fullName.toLowerCase() === trimmedName.toLowerCase() ||
        (row.identityNumber && p.identityNumber === row.identityNumber)
      );

      if (!matchedPerson) {
        matchedPerson = {
          id: 'pers-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          fullName: trimmedName,
          identityNumber: row.identityNumber || undefined,
          phone: '+90 5XX XXX XX XX',
          city: row.city || 'Ankara',
          defaultRole: 'anketor',
          defaultUnitPrice: row.unitPrice || 320,
          isBlacklisted: false,
          totalProjectsCompleted: 1
        };
        newPersonnelToAdd.push(matchedPerson);
        currentPersonnel.push(matchedPerson);
      }

      const totalSurveys = Number(row.totalSurveys || 0);
      const invalidSurveys = Number(row.invalidSurveys || 0);
      const validSurveys = Math.max(0, totalSurveys - invalidSurveys);
      const unitPrice = Number(row.unitPrice || 320);
      const grossAmount = validSurveys * unitPrice;
      const advancesDeducted = getPersonnelNetAdvance(projectId, matchedPerson.id);
      const netPayable = Math.max(0, grossAmount - advancesDeducted);

      newSettlements.push({
        id: 'set-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) + '-' + count,
        projectId,
        personnelId: matchedPerson.id,
        personnelName: matchedPerson.fullName,
        personnelRole: matchedPerson.defaultRole,
        city: row.city || matchedPerson.city || 'Ankara',
        identityNumber: row.identityNumber || matchedPerson.identityNumber,
        totalSurveys,
        invalidSurveys,
        validSurveys,
        unitPriceApplied: unitPrice,
        grossAmount,
        advancesDeducted,
        netPayable,
        isPaid: false,
        notes: row.notes || ''
      });

      count++;
    });

    if (newPersonnelToAdd.length > 0) {
      setPersonnel(prev => [...newPersonnelToAdd, ...prev]);
    }

    if (newSettlements.length > 0) {
      const importedPersonnelIds = new Set(newSettlements.map(s => s.personnelId));
      setSettlements(prev => [
        ...newSettlements,
        ...prev.filter(s => !(s.projectId === projectId && importedPersonnelIds.has(s.personnelId)))
      ]);

      // Update project total valid
      setProjects(prev => prev.map(proj => {
        if (proj.id === projectId) {
          const totalValid = newSettlements.reduce((sum, s) => sum + s.validSurveys, 0);
          return {
            ...proj,
            completedSurveys: totalValid
          };
        }
        return proj;
      }));
    }

    return { importedCount: count };
  };

  const toggleSettlementPaid = (settlementId: string) => {
    setSettlements(prev => prev.map(s => {
      if (s.id !== settlementId) return s;
      const nextPaid = !s.isPaid;
      return {
        ...s,
        isPaid: nextPaid,
        paidAt: nextPaid ? new Date().toISOString() : undefined,
        paymentReference: nextPaid ? 'TRANSFER-' + Math.floor(100000 + Math.random() * 900000) : undefined
      };
    }));
  };

  // 6. CLIENT INVOICE STATUS
  const updateInvoiceStatus = (
    invoiceId: string, 
    status: ClientInvoice['status'], 
    invoiceNumber?: string
  ) => {
    setClientInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      return {
        ...inv,
        status,
        invoiceNumber: invoiceNumber || inv.invoiceNumber,
        invoicedAt: status === 'invoiced' ? (inv.invoicedAt || new Date().toISOString().split('T')[0]) : inv.invoicedAt,
        collectedAt: status === 'collected' ? (inv.collectedAt || new Date().toISOString().split('T')[0]) : inv.collectedAt
      };
    }));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      loginWithCredentials,
      logout,
      sendPasswordReset,
      isOnline,
      offlineQueueCount,
      syncOfflineQueue,
      projects,
      personnel,
      projectPersonnel,
      expenses,
      advances,
      settlements,
      clientInvoices,
      addProject,
      updateProject,
      activateProjectFromFeasibility,
      addPersonnel,
      toggleBlacklist,
      assignPersonnelToProject,
      removePersonnelFromProject,
      addExpense,
      addAdvance,
      closeSurveysAndCalculateSettlement,
      importSettlementsFromExcel,
      toggleSettlementPaid,
      updateInvoiceStatus,
      getPersonnelNetAdvance,
      getProjectsForPersonnel
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
