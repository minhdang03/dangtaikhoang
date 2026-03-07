import { NextRequest, NextResponse } from "next/server";
import { settingsDB } from "@/lib/db";

export async function GET() {
  const settings = settingsDB.get();
  // Don't expose admin password
  const { adminPassword: _, ...safe } = settings;
  return NextResponse.json(safe);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const updated = settingsDB.update(body);
  const { adminPassword: _, ...safe } = updated;
  return NextResponse.json(safe);
}
