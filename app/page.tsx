"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClassItem, DAY_ORDER } from "@/lib/data";
import { enablePushNotifications, isPushEnabled } from "@/lib/push-client";

const DAY_INDEX: Record<string, number> = {
  Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 0,
};
const TODAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c1.6-3.6 4.6-5.4 7.5-5.4s5.9 1.8 7.5 5.4" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 21V7l8-4 8 4v14" /><path d="M9 21v-6h6v6" />
    </svg>
  );
}

export default function HomePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>("Senin");
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);
  const [notifStatus, setNotifStatus] = useState<"idle" | "checking" | "enabled" | "working">("idle");

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data: ClassItem[]) => {
        setClasses(data);
        const today = TODAY_NAMES[new Date().getDay()];
        const hasToday = data.some((c) => c.hari === today);
        setActiveDay(hasToday ? today : data[0]?.hari || "Senin");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    isPushEnabled().then((on) => setNotifStatus(on ? "enabled" : "idle"));
  }, []);

  const today = TODAY_NAMES[new Date().getDay()];
  const totalSks = classes.reduce((a, c) => a + c.sks, 0);
  const hariAktif = new Set(classes.filter((c) => c.hari !== "TBD").map((c) => c.hari)).size;
  const tbdCount = classes.filter((c) => c.hari === "TBD").length;

  const nextClass = useMemo(() => {
    const now = new Date();
    const scheduled = classes.filter((c) => c.mulai);
    let best: { c: ClassItem; dt: Date } | null = null;
    let bestDiff = Infinity;
    for (let add = 0; add < 8; add++) {
      const targetDow = (now.getDay() + add) % 7;
      for (const c of scheduled) {
        if (DAY_INDEX[c.hari] !== targetDow) continue;
        const [h, m] = c.mulai!.split(":").map(Number);
        const dt = new Date(now);
        dt.setDate(now.getDate() + add);
        dt.setHours(h, m, 0, 0);
        const diff = dt.getTime() - now.getTime();
        if (diff >= -60000 && diff < bestDiff) { bestDiff = diff; best = { c, dt }; }
      }
      if (best) break;
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, tick]);

  const dayList = useMemo(() => {
    let list = classes.filter((c) => c.hari === activeDay);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => (c.mk + c.dosen + c.ruang).toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.mulai || "99:99").localeCompare(b.mulai || "99:99"));
  }, [classes, activeDay, query]);

  function buildSummary() {
    const lines = ["*Jadwal Kuliah Kelas A — Semester 1*", ""];
    DAY_ORDER.filter((d) => d !== "TBD").forEach((d) => {
      const list = classes.filter((c) => c.hari === d);
      if (!list.length) return;
      lines.push(`*${d}*`);
      list.forEach((c) => lines.push(`• ${c.mulai}-${c.selesai} ${c.mk} (${c.sks} SKS) — ${c.ruang}`));
      lines.push("");
    });
    const tbd = classes.filter((c) => c.hari === "TBD");
    if (tbd.length) {
      lines.push("*Menunggu jadwal*");
      tbd.forEach((c) => lines.push(`• ${c.mk} (${c.sks} SKS) — jadwal menyusul`));
    }
    return lines.join("\n");
  }

  async function handleEnableNotif() {
    setNotifStatus("working");
    const res = await enablePushNotifications();
    if (res === "enabled") setNotifStatus("enabled");
    else {
      setNotifStatus("idle");
      if (res === "unsupported") alert("Browser ini tidak mendukung notifikasi push. Coba buka dengan Chrome di Android.");
      if (res === "denied") alert("Izin notifikasi ditolak. Aktifkan lewat pengaturan browser jika ingin mengaktifkan lagi.");
      if (res === "error") alert("Gagal mengaktifkan notifikasi. Coba lagi nanti.");
    }
  }

  if (loading) {
    return <div className="wrap"><p>Memuat jadwal…</p></div>;
  }

  return (
    <>
      <div className="wrap app-ui">
        <header className="app-header">
          <div className="eyebrow">LEMBAR JADWAL — TEKNIK</div>
          <h1 className="title">Jadwal Kuliah Kelas A</h1>
          <div className="subtitle">Semester 1 · superapp jadwal, notes, materi, dan reminder kuliah</div>
          <div className="stampbar">
            <div className="stamp"><b>{totalSks}</b><span>Total SKS</span></div>
            <div className="stamp"><b>{classes.length}</b><span>Mata Kuliah</span></div>
            <div className="stamp"><b>{hariAktif}</b><span>Hari Aktif</span></div>
            <div className="stamp"><b>{tbdCount}</b><span>Menunggu TBD</span></div>
          </div>

          <div className="nextup">
            <div>
              <div className="label">Kelas berikutnya</div>
              <div className="course">{nextClass ? nextClass.c.mk : "Tidak ada jadwal tetap"}</div>
              <div className="meta">
                {nextClass ? `${nextClass.c.hari}, ${nextClass.c.mulai}–${nextClass.c.selesai} · ${nextClass.c.ruang}` : "Hanya Pancasila (TBD) yang tersisa"}
              </div>
            </div>
            <div className="countdown">
              {nextClass ? countdownLabel(nextClass.dt) : "—"}
            </div>
          </div>
        </header>

        <div className="toolbar">
          <input className="search" placeholder="Cari mata kuliah, dosen, atau ruangan…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="tabs">
          {DAY_ORDER.map((d) => (
            <button key={d} className={`tab ${d === activeDay ? "active" : ""} ${d === today ? "today" : ""}`} onClick={() => setActiveDay(d)}>
              {d}<span className="dot" />
            </button>
          ))}
        </div>

        <div className="timeline">
          {dayList.length === 0 ? (
            <div className="empty-day">{query ? "Tidak ada hasil untuk pencarian ini." : "Tidak ada kelas pada hari ini — bebas!"}</div>
          ) : (
            dayList.map((c) => (
              <div className="card" key={c.id}>
                <div className="card-top">
                  <div className="time"><ClockIcon /> {c.mulai ? `${c.mulai} – ${c.selesai}` : "Jadwal menyusul"}</div>
                  <div className="sks-seal"><b>{c.sks}</b><span>SKS</span></div>
                </div>
                <div className="course-name">{c.mk}</div>
                <div className="row"><PersonIcon /><span>{c.dosen}</span></div>
                <div className="row"><PinIcon /><span>{c.ruang}</span></div>
                <span className={`tag ${c.tipe === "Online (Kelas Besar)" ? "online" : c.tipe === "TBD" ? "tbd" : ""}`}>{c.tipe}</span>
                {c.note && <div className="note">⚠ {c.note}</div>}
                {c.materiLink && (
                  <div className="materi-link">
                    📎 <a href={c.materiLink} target="_blank" rel="noopener noreferrer">Buka materi</a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="summary-title">Semua hari</div>
        <div className="weekgrid">
          {DAY_ORDER.map((d) => {
            const list = classes.filter((c) => c.hari === d);
            return (
              <div className="daycell" key={d} onClick={() => { setActiveDay(d); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <div className="d">{d}</div>
                <div className="c">{list.length ? list.map((c) => c.mk).join(", ") : "Tidak ada kelas"}</div>
              </div>
            );
          })}
        </div>

        <div className="sharebar">
          <a className="btn primary" href={`https://wa.me/?text=${encodeURIComponent(buildSummary())}`} target="_blank" rel="noopener noreferrer">
            ↗ Bagikan ke WhatsApp
          </a>
          <button className="btn" onClick={() => navigator.clipboard.writeText(buildSummary())}>⧉ Salin ringkasan</button>
          <a className="btn" href="/api/calendar.ics">📅 Export ke Google Calendar</a>
          <button className="btn" onClick={() => window.print()}>🖶 Cetak / simpan PDF</button>
          <button className="btn" onClick={handleEnableNotif} disabled={notifStatus === "enabled" || notifStatus === "working"}>
            {notifStatus === "enabled" ? "🔔 Notifikasi aktif" : notifStatus === "working" ? "Mengaktifkan…" : "🔔 Aktifkan notifikasi"}
          </button>
        </div>

        <footer className="app-footer">
          Kelas A · Semester 1 — <Link href="/admin">Login admin</Link>
        </footer>
      </div>

      {/* Print-only clean table, shown via @media print */}
      <div className="print-table">
        <h1>Jadwal Kuliah Kelas A — Semester 1</h1>
        <div className="p-sub">Total {totalSks} SKS · {classes.length} mata kuliah · dicetak {new Date().toLocaleDateString("id-ID")}</div>
        <table>
          <thead>
            <tr>
              <th>Hari</th><th>Waktu</th><th>Mata Kuliah</th><th>SKS</th><th>Dosen</th><th>Tipe</th><th>Ruangan</th><th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {DAY_ORDER.flatMap((d) => classes.filter((c) => c.hari === d)).map((c) => (
              <tr key={c.id}>
                <td>{c.hari}</td>
                <td>{c.mulai ? `${c.mulai}-${c.selesai}` : "-"}</td>
                <td>{c.mk}</td>
                <td>{c.sks}</td>
                <td>{c.dosen}</td>
                <td>{c.tipe}</td>
                <td>{c.ruang}</td>
                <td>{c.note}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3}>Total</td><td>{totalSks}</td><td colSpan={4}></td></tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

function countdownLabel(dt: Date): string {
  const diff = Math.max(0, dt.getTime() - Date.now());
  if (diff < 60000) return "Sekarang";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}j ${m}m lagi`;
}
