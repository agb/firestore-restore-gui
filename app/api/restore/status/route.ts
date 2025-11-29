import { NextResponse } from "next/server";
import { getRestoreStatus } from "@/lib/gcloud";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const operationName = searchParams.get("operationName");
    const projectId = searchParams.get("projectId");
    const databaseId = searchParams.get("databaseId");

    if (!operationName || !projectId || !databaseId) {
      return NextResponse.json(
        { error: "operationName, projectId, and databaseId are required" },
        { status: 400 }
      );
    }

    const status = await getRestoreStatus(operationName, projectId, databaseId);
    return NextResponse.json({ status });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to get restore status",
      },
      { status: 500 }
    );
  }
}

