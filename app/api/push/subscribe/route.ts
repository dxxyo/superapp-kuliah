import { NextRequest, NextResponse } from "next/server";
import { addSubscription, removeSubscription } from "@/lib/kv";
import crypto from "crypto";

// Anyone visiting the public schedule can opt in to reminders for themselves -
// this does not require admin auth, it's a personal notification preference.
export async function POST(req: NextRequest) {
  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Subscription tidak valid" }, { status: 400 });
  }
  const id = crypto.createHash("sha256").update(subscription.endpoint).digest("hex");
  await addSubscription(id, subscription);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "endpoint wajib diisi" }, { status: 400 });
  const id = crypto.createHash("sha256").update(endpoint).digest("hex");
  await removeSubscription(id);
  return NextResponse.json({ ok: true });
}
