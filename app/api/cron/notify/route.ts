import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getClasses } from "@/lib/kv";
import { getAllSubscriptions, removeSubscription, wasNotified, markNotified } from "@/lib/kv";

const DAY_INDEX: Record<string, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

// Reminder window: notify once when a class starts in 25-35 minutes (cron runs every 10 min)
const WINDOW_MIN_MS = 25 * 60 * 1000;
const WINDOW_MAX_MS = 35 * 60 * 1000;

function nowInJakarta(): { dow: number; hhmm: string; dateStr: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    dow: dowMap[map.weekday],
    hhmm: `${map.hour}:${map.minute}`,
    dateStr: `${map.year}-${map.month}-${map.day}`,
  };
}

export async function GET(req: NextRequest) {
  // Vercel automatically sends this header on its own cron invocations when CRON_SECRET is set.
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys belum diset" }, { status: 500 });
  }
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT_EMAIL || "admin@example.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { dow, dateStr } = nowInJakarta();
  const now = new Date();
  const classes = await getClasses();

  const due = [];
  for (const c of classes) {
    if (!c.mulai) continue;
    const [h, m] = c.mulai.split(":").map(Number);
    // Build the class start instant today, in Jakarta offset (+7, no DST)
    const classDow = DAY_INDEX[c.hari];
    if (classDow !== dow) continue;

    const jakartaOffsetMs = 7 * 60 * 60 * 1000;
    const startOfTodayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const classInstant = new Date(startOfTodayUtc.getTime() + (h * 60 + m) * 60 * 1000 - jakartaOffsetMs);
    const diff = classInstant.getTime() - now.getTime();

    if (diff >= WINDOW_MIN_MS && diff <= WINDOW_MAX_MS) {
      if (!(await wasNotified(c.id, dateStr))) {
        due.push(c);
      }
    }
  }

  if (due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const subs = await getAllSubscriptions();
  let sent = 0;

  for (const c of due) {
    const payload = JSON.stringify({
      title: `${c.mk} mulai 30 menit lagi`,
      body: `${c.mulai}–${c.selesai} · ${c.ruang}${c.note ? " · " + c.note : ""}`,
      url: "/",
    });

    for (const [id, subJson] of Object.entries(subs)) {
      try {
        const sub = JSON.parse(subJson);
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await removeSubscription(id);
        }
      }
    }
    await markNotified(c.id, dateStr);
  }

  return NextResponse.json({ ok: true, sent, classes: due.map((c) => c.mk) });
}
