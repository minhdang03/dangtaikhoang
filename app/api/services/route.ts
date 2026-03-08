import { NextRequest, NextResponse } from "next/server";
import { servicesDB } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await servicesDB.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const service = await servicesDB.create({
    name: body.name,
    type: body.type || "other",
    icon: body.icon || "📦",
  });
  return NextResponse.json(service, { status: 201 });
}
