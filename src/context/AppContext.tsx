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

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  users: UserProfile[];
  
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
    invalidSurveys: number
  ) => Settlement;
  toggleSettlementPaid: (settlementId: string) => void;
  
  updateInvoiceStatus: (
    invoiceId: string, 
    status: ClientInvoice['status'], 
    invoiceNumber?: string
  ) => void;
  
  getPersonnelNetAdvance: (projectId: string, personnelId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Current logged in user (Default to admin for immediate convenience, can be switched or logged out)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_USERS[0]);
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  
  // Online / Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  
  // Application Data States (persisted to localStorage if available)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [personnel, setPersonnel] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [projectPersonnel, setProjectPersonnel] = useState<ProjectPersonnel[]>(INITIAL_PROJECT_PERSONNEL);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [advances, setAdvances] = useState<Advance[]>(INITIAL_ADVANCES);
  const [settlements, setSettlements] = useState<Settlement[]>(INITIAL_SETTLEMENTS);
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>(INITIAL_CLIENT_INVOICES);

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

    // Initial check for pending items in IndexedDB
    getPendingOfflineActions().then(items => {
      setOfflineQueueCount(items.length);
    }).catch(err => console.error('IndexedDB check error:', err));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync offline queue to main state
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

    // Also create initial invoice placeholder
    const newInvoice: ClientInvoice = {
      id: 'inv-' + Date.now(),
      projectId: newProject.id,
      projectCode: newProject.code,
      clientName: newProject.clientName,
      invoiceAmount: newProject.clientTotalBudget,
      status: 'not_invoiced',
      notes: 'Proje oluşturulduğunda otomatik taslak eklendi.'
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
        blacklistReason: nextState ? (reason || 'Yönetici tarafından kara listeye alındı.') : undefined,
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
      alert('Bu personel kara listede yer aldığı için yeni projeye eklenemez!');
      return;
    }

    // Check if already assigned
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

  // 4. EXPENSE & ADVANCE (WITH OFFLINE-FIRST CAPABILITY)
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

    // Update project total expenses
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

    // Update project total advances
    setProjects(prev => prev.map(proj => {
      if (proj.id === aData.projectId) {
        return {
          ...proj,
          totalAdvances: (proj.totalAdvances || 0) + Number(aData.amount)
        };
      }
      return proj;
    }));

    // If an existing settlement draft exists for this person in this project, auto update advancesDeducted
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

  // 5. SETTLEMENT & FINANCIAL ENGINE
  const closeSurveysAndCalculateSettlement = (
    projectId: string,
    personnelId: string,
    totalSurveys: number,
    invalidSurveys: number
  ): Settlement => {
    const person = personnel.find(p => p.id === personnelId);
    const assignment = projectPersonnel.find(pp => pp.projectId === projectId && pp.personnelId === personnelId);
    
    // Custom overridden price or default
    const unitPrice = assignment?.customUnitPrice || person?.defaultUnitPrice || 180;
    const validSurveys = Math.max(0, totalSurveys - invalidSurveys);
    const grossAmount = validSurveys * unitPrice;
    
    // Total advances taken by this personnel in this project
    const totalAdvancesTaken = getPersonnelNetAdvance(projectId, personnelId);
    const netPayable = Math.max(0, grossAmount - totalAdvancesTaken);

    const newSettlement: Settlement = {
      id: 'set-' + Date.now(),
      projectId,
      personnelId,
      personnelName: person?.fullName || 'Bilinmeyen Personel',
      personnelRole: assignment?.assignedRole || person?.defaultRole || 'anketor',
      totalSurveys,
      invalidSurveys,
      validSurveys,
      unitPriceApplied: unitPrice,
      grossAmount,
      advancesDeducted: totalAdvancesTaken,
      netPayable,
      isPaid: false
    };

    setSettlements(prev => {
      const filtered = prev.filter(s => !(s.projectId === projectId && s.personnelId === personnelId));
      return [newSettlement, ...filtered];
    });

    // Update project completed surveys
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
      toggleSettlementPaid,
      updateInvoiceStatus,
      getPersonnelNetAdvance
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
