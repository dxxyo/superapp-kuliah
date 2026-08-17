# Jadwal Kuliah Kelas A — Superapp

Superapp jadwal kuliah: jadwal interaktif, login admin, CRUD jadwal/notes/link materi,
todo list, notifikasi push ke Android, export ke Google Calendar, dan cetak PDF rapi.

## 1. Deploy ke Vercel

1. Push folder ini ke GitHub (repo baru).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo tadi. Vercel otomatis
   mendeteksi ini project Next.js, tidak perlu ubah setting build.
3. **Jangan langsung klik Deploy** — isi environment variables dulu di langkah 2 & 3 di bawah,
   supaya login admin dan database langsung jalan begitu deploy pertama selesai.

## 2. Pasang database (Redis)

Data jadwal/notes/todo perlu disimpan permanen (Vercel tidak punya penyimpanan file yang persisten).

1. Di dashboard project Vercel → tab **Storage** → **Create Database** → pilih **Redis**
   (disediakan oleh Upstash lewat Vercel Marketplace, ada free tier).
2. Setelah dibuat, klik **Connect Project** ke project ini. Vercel otomatis menambahkan
   env var `KV_REST_API_URL` dan `KV_REST_API_TOKEN` — kamu tidak perlu isi manual.

## 3. Isi environment variables

Di **Settings → Environment Variables**, tambahkan (contoh lengkap ada di `.env.example`):

| Variable | Isi dengan |
|---|---|
| `ADMIN_PASSWORD` | Password admin pilihanmu |
| `ADMIN_SECRET` | String acak panjang (buat sendiri, misal dari [passwordsgenerator.net](https://passwordsgenerator.net)) |
| `VAPID_PUBLIC_KEY` | Sudah ada key siap pakai di `.env.example`, atau generate baru: `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Pasangan dari key di atas |
| `VAPID_SUBJECT_EMAIL` | Email kamu (syarat protokol Web Push) |
| `CRON_SECRET` | String acak lain — Vercel otomatis mengirim ini saat menjalankan cron |

> ⚠️ Key di `.env.example` sudah pernah dibuat lewat chat ini, jadi sebaiknya generate ulang
> `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` sendiri sebelum dipakai serius (`npx web-push generate-vapid-keys`).

Setelah semua env var terisi → klik **Deploy**.

## 4. Jalankan reminder otomatis (cron)

File `vercel.json` sudah mendaftarkan cron yang cek jadwal **setiap 10 menit** dan mengirim
notifikasi ke HP yang sudah mengaktifkan notifikasi, 30 menit sebelum kelas mulai.
Cron ini otomatis aktif begitu project ter-deploy — tidak perlu setting tambahan.

(Catatan: cron Vercel di paket Hobby/gratis kadang dibatasi jadwal minimum tertentu.
Kalau `*/10 * * * *` ditolak, ubah ke `0 * * * *` di `vercel.json`, yang artinya cek tiap jam.)

## 5. Cara pakai

- **Semua orang** buka `https://nama-project-kamu.vercel.app` untuk lihat jadwal, cari kelas,
  export ke Google Calendar, cetak PDF, atau bagikan ke WhatsApp grup kelas.
- **Aktifkan notifikasi**: klik tombol "🔔 Aktifkan notifikasi" di HP Android (pakai Chrome).
  Untuk notifikasi paling stabil, tambahkan ke homescreen dulu (menu Chrome → *Add to Home screen*),
  baru buka dari ikon itu dan aktifkan notifikasinya.
- **Admin**: buka `/admin`, login pakai `ADMIN_PASSWORD`. Dari situ bisa tambah/edit/hapus
  mata kuliah, ubah notes & link materi, dan kelola todo list. Perubahan langsung tampil
  di jadwal publik untuk semua orang.
- **Export ke Google Calendar**: tombol "📅 Export ke Google Calendar" mengunduh file `.ics`
  berisi semua kelas (berulang tiap minggu). Buka Google Calendar di web/HP → Settings →
  **Import & export** → **Import** → pilih file `.ics` itu.
- **Cetak PDF**: tombol "🖶 Cetak / simpan PDF" membuka dialog print browser dengan tampilan
  tabel bersih (bukan tampilan kartu warna-warni), lalu pilih **Save as PDF**.

## 6. Development lokal (opsional)

```bash
npm install
cp .env.example .env.local   # lalu isi datanya
npm run dev
```

Buka `http://localhost:3000`.
