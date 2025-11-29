import { NextResponse } from "next/server";
import { listProjects } from "@/lib/gcloud";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to list projects",
      },
      { status: 500 }
    );
  }
}

