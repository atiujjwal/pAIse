import { NextResponse } from "next/server";
import { getGoogleAuthURL } from "@/src/lib/google";

export async function GET() {
  return NextResponse.redirect(getGoogleAuthURL());
}
