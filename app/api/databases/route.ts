import { NextResponse } from "next/server";
import { listDatabases } from "@/lib/gcloud";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const databases = await listDatabases(projectId);
    return NextResponse.json({ databases });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to list databases",
      },
      { status: 500 }
    );
  }
}

