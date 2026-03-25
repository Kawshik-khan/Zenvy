import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Basic connectivity test
    const userCount = await prisma.user.count();
    return NextResponse.json({ 
      status: "success", 
      message: "Connected to Supabase successfully!",
      database: "PostgreSQL",
      userCount 
    });
  } catch (error) {
    console.error("Health Check Failed:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to connect to the database.",
      error: String(error)
    }, { status: 500 });
  }
}
