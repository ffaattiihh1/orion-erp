import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, DatabaseSchema } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({ success: true, data: db });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to read database' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Support full state save or partial collection save
    const updated = writeDatabase(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to write database' },
      { status: 500 }
    );
  }
}
