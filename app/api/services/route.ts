import { NextRequest, NextResponse } from "next/server";
import { servicesDB } from "@/lib/db";

export async function GET() {
  return NextResponse.json(servicesDB.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const service = servicesDB.create({
    name: body.name,
    type: body.type || "other",
    icon: body.icon || "📦",
  });
  return NextResponse.json(service, { status: 201 });
}
