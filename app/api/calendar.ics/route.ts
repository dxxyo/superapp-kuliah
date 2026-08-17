import { NextResponse } from "next/server";
import { getClasses } from "@/lib/kv";
import { DAY_TO_RRULE } from "@/lib/data";

const DAY_INDEX: Record<string, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Returns the next occurrence (today or later) of `targetDow`, as a UTC instant
// for the given Jakarta local HH:MM (Jakarta = UTC+7, no DST).
function nextOccurrenceUtc(targetDow: number, hh: number, mm: number): Date {
  const now = new Date();
  const todayUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // Jakarta "today" weekday
  const jakartaNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const jakartaDow = jakartaNow.getUTCDay();
  let addDays = (targetDow - jakartaDow + 7) % 7;

  const candidate = new Date(
    todayUtcMidnight.getTime() + addDays * 86400000 + (hh * 60 + mm) * 60000 - 7 * 60 * 60 * 1000
  );
  if (candidate.getTime() < now.getTime() && addDays === 0) {
    candidate.setUTCDate(candidate.getUTCDate() + 7);
  }
  return candidate;
}

function toIcsUtc(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export async function GET() {
  const classes = await getClasses();
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jadwal Kuliah Kelas A//Superapp//ID",
    "CALSCALE:GREGORIAN",
  ];

  for (const c of classes) {
    if (!c.mulai || !c.selesai || c.hari === "TBD") continue;
    const dow = DAY_INDEX[c.hari];
    const [sh, sm] = c.mulai.split(":").map(Number);
    const [eh, em] = c.selesai.split(":").map(Number);

    const dtStart = nextOccurrenceUtc(dow, sh, sm);
    const dtEnd = nextOccurrenceUtc(dow, eh, em);
    const byday = DAY_TO_RRULE[c.hari];

    const descParts = [`Dosen: ${c.dosen}`, `SKS: ${c.sks}`];
    if (c.note) descParts.push(`Catatan: ${c.note}`);
    if (c.materiLink) descParts.push(`Materi: ${c.materiLink}`);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${c.id}@jadwal-kelas-a`,
      `DTSTAMP:${toIcsUtc(now)}`,
      `DTSTART:${toIcsUtc(dtStart)}`,
      `DTEND:${toIcsUtc(dtEnd)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
      `SUMMARY:${escapeIcs(c.mk)}`,
      `LOCATION:${escapeIcs(c.ruang)}`,
      `DESCRIPTION:${escapeIcs(descParts.join(" | "))}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="jadwal-kelas-a.ics"',
    },
  });
}
