import fs from 'fs';
import path from 'path';
import { 
  Project, 
  Personnel, 
  ProjectPersonnel, 
  Expense, 
  Advance, 
  Settlement, 
  ClientInvoice, 
  UserProfile 
} from '@/types';

export interface DatabaseSchema {
  projects: Project[];
  personnel: Personnel[];
  projectPersonnel: ProjectPersonnel[];
  expenses: Expense[];
  advances: Advance[];
  settlements: Settlement[];
  clientInvoices: ClientInvoice[];
  users?: UserProfile[];
  lastUpdated: string;
  version: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const INITIAL_DB: DatabaseSchema = {
  projects: [],
  personnel: [],
  projectPersonnel: [],
  expenses: [],
  advances: [],
  settlements: [],
  clientInvoices: [],
  lastUpdated: new Date().toISOString(),
  version: 1
};

function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDatabase(): DatabaseSchema {
  try {
    ensureDataDirExists();
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      projects: parsed.projects || [],
      personnel: parsed.personnel || [],
      projectPersonnel: parsed.projectPersonnel || [],
      expenses: parsed.expenses || [],
      advances: parsed.advances || [],
      settlements: parsed.settlements || [],
      clientInvoices: parsed.clientInvoices || [],
      users: parsed.users,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      version: parsed.version || 1
    };
  } catch (error) {
    console.error('Error reading database file:', error);
    return INITIAL_DB;
  }
}

export function writeDatabase(data: Partial<DatabaseSchema>): DatabaseSchema {
  try {
    ensureDataDirExists();
    const current = readDatabase();
    const updated: DatabaseSchema = {
      projects: data.projects !== undefined ? data.projects : current.projects,
      personnel: data.personnel !== undefined ? data.personnel : current.personnel,
      projectPersonnel: data.projectPersonnel !== undefined ? data.projectPersonnel : current.projectPersonnel,
      expenses: data.expenses !== undefined ? data.expenses : current.expenses,
      advances: data.advances !== undefined ? data.advances : current.advances,
      settlements: data.settlements !== undefined ? data.settlements : current.settlements,
      clientInvoices: data.clientInvoices !== undefined ? data.clientInvoices : current.clientInvoices,
      users: data.users !== undefined ? data.users : current.users,
      lastUpdated: new Date().toISOString(),
      version: (current.version || 1) + 1
    };

    // Atomic write via temp file
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    return updated;
  } catch (error) {
    console.error('Error writing database file:', error);
    throw error;
  }
}
