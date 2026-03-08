import { NextRequest, NextResponse } from "next/server";
import { usersDB } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await usersDB.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = await usersDB.create({
    name: body.name,
    phone: body.phone,
    fbLink: body.fbLink || "",
  });
  return NextResponse.json(user, { status: 201 });
}
