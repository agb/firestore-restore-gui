import { NextResponse } from "next/server";
import { listBackups } from "@/lib/gcloud";

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

    const backups = await listBackups(projectId);
    return NextResponse.json({ backups });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to list backups",
      },
      { status: 500 }
    );
  }
}

