import { NextResponse } from "next/server";
import { getGcloudStatus, isGcloudInstalled } from "@/lib/gcloud";

export async function GET() {
  try {
    const installed = isGcloudInstalled();
    
    if (!installed) {
      return NextResponse.json({
        installed: false,
        authenticated: false,
      });
    }

    const status = await getGcloudStatus();
    
    return NextResponse.json({
      installed: true,
      ...status,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to check authentication status",
      },
      { status: 500 }
    );
  }
}

