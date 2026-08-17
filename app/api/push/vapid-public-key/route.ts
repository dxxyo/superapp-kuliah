import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json({ error: "VAPID_PUBLIC_KEY belum diset" }, { status: 500 });
  }
  return new NextResponse(key, { headers: { "Content-Type": "text/plain" } });
}
