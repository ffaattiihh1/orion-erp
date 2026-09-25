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
    id: 'user-admin-fatih',
    username: 'fatih.sakar',
    email: 'fatihsakar@orionarastirma.com',
    fullName: 'Fatih Sakar',
    role: 'admin',
    password: '123',
    phone: '+90 533 500 60 70',
  },
  {
    id: 'user-spv-emrah',
    username: 'emrah.gundeyer',
    email: 'emrahgundeyer@orionarastirma.com',
    fullName: 'Emrah Gündeyer',
    role: 'spv',
    password: '123',
    phone: '+90 535 400 50 60',
  },
  {
    id: 'user-admin-kazim',
    username: 'kazim.senol',
    email: 'kazimsenol@orionarastirma.com',
    fullName: 'Kazım Şenol',
    role: 'admin',
    password: '123',
    phone: '+90 532 200 30 40',
  }
];

// Clean state for user's fresh manual testing
export const INITIAL_PERSONNEL: Personnel[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_PROJECT_PERSONNEL: ProjectPersonnel[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_ADVANCES: Advance[] = [];

export const INITIAL_SETTLEMENTS: Settlement[] = [];

export const INITIAL_CLIENT_INVOICES: ClientInvoice[] = [];
