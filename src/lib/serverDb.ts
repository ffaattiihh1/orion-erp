import fs from 'fs';
import path from 'path';
import os from 'os';
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

// Global in-memory storage fallback for serverless / lambda
declare global {
  var __ORION_GLOBAL_DB__: DatabaseSchema | undefined;
}

const PRIMARY_DATA_DIR = path.join(process.cwd(), 'data');
const PRIMARY_DB_FILE = path.join(PRIMARY_DATA_DIR, 'database.json');

const FALLBACK_DATA_DIR = os.tmpdir();
const FALLBACK_DB_FILE = path.join(FALLBACK_DATA_DIR, 'orion_database.json');

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

function getDbFilePath(): string {
  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    return PRIMARY_DB_FILE;
  } catch {
    return FALLBACK_DB_FILE;
  }
}

export function readDatabase(): DatabaseSchema {
  // Check in-memory global first
  if (globalThis.__ORION_GLOBAL_DB__) {
    return globalThis.__ORION_GLOBAL_DB__;
  }

  const filePath = getDbFilePath();
  try {
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      } catch {}
      globalThis.__ORION_GLOBAL_DB__ = INITIAL_DB;
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const db: DatabaseSchema = {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      personnel: Array.isArray(parsed.personnel) ? parsed.personnel : [],
      projectPersonnel: Array.isArray(parsed.projectPersonnel) ? parsed.projectPersonnel : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      advances: Array.isArray(parsed.advances) ? parsed.advances : [],
      settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
      clientInvoices: Array.isArray(parsed.clientInvoices) ? parsed.clientInvoices : [],
      users: parsed.users,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      version: parsed.version || 1
    };
    globalThis.__ORION_GLOBAL_DB__ = db;
    return db;
  } catch (error) {
    console.warn('Fallback to initial DB:', error);
    globalThis.__ORION_GLOBAL_DB__ = INITIAL_DB;
    return INITIAL_DB;
  }
}

export function writeDatabase(data: Partial<DatabaseSchema>): DatabaseSchema {
  try {
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

    // Save to global in-memory
    globalThis.__ORION_GLOBAL_DB__ = updated;

    // Try saving to disk
    const filePath = getDbFilePath();
    try {
      const tempFile = `${filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
      fs.renameSync(tempFile, filePath);
    } catch {
      try {
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
      } catch {}
    }

    return updated;
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}
