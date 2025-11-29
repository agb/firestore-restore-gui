import { NextResponse } from "next/server";
import { startRestore } from "@/lib/gcloud";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { backupPath, projectId, databaseId } = body;

    if (!backupPath || !projectId || !databaseId) {
      return NextResponse.json(
        { error: "backupPath, projectId, and databaseId are required" },
        { status: 400 }
      );
    }

    const operation = await startRestore(backupPath, projectId, databaseId);
    return NextResponse.json({ operation });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to start restore",
      },
      { status: 500 }
    );
  }
}

