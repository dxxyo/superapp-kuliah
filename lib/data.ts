export type Hari = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu" | "TBD";

export type ClassItem = {
  id: string;
  hari: Hari;
  mulai: string | null; // "HH:MM" 24h, Asia/Jakarta
  selesai: string | null;
  mk: string;
  sks: number;
  dosen: string;
  tipe: string; // "Online (Kelas Besar)" | "Offline" | "TBD"
  ruang: string;
  note: string;
  materiLink: string;
};

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  dueDate: string | null; // ISO date string, optional
  relatedClassId: string | null;
  createdAt: string;
};

export const DAY_ORDER: Hari[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu", "TBD"];

export const DAY_TO_RRULE: Record<string, string> = {
  Senin: "MO",
  Selasa: "TU",
  Rabu: "WE",
  Kamis: "TH",
  Jumat: "FR",
  Sabtu: "SA",
  Minggu: "SU",
};

export const SEED_CLASSES: ClassItem[] = [
  {
    id: "c1",
    hari: "Selasa",
    mulai: "10:30",
    selesai: "12:10",
    mk: "Pendidikan Agama",
    sks: 2,
    dosen: "Suhaidi, M.PdI. / Dr. Mukhrij Sidqy, MA.",
    tipe: "Online (Kelas Besar)",
    ruang: "-",
    note: "",
    materiLink: "",
  },
  {
    id: "c2",
    hari: "Rabu",
    mulai: "13:00",
    selesai: "16:20",
    mk: "Kalkulus I",
    sks: 4,
    dosen: "Fathin Muhammad M. / Fakhri Akbar A.",
    tipe: "Offline",
    ruang: "FT. LIMO. L.305",
    note: "",
    materiLink: "",
  },
  {
    id: "c3",
    hari: "Kamis",
    mulai: "13:00",
    selesai: "15:30",
    mk: "Teori Bangunan Kapal",
    sks: 3,
    dosen: "Purwo Joko Suranto",
    tipe: "Offline",
    ruang: "FT. LIMO. L.305",
    note: "",
    materiLink: "",
  },
  {
    id: "c4",
    hari: "Kamis",
    mulai: "15:30",
    selesai: "18:00",
    mk: "Menggambar Teknik",
    sks: 3,
    dosen: "-",
    tipe: "Offline",
    ruang: "FT. LIMO. L.304",
    note: "Jangan lupa bawa perlengkapan gambar",
    materiLink: "",
  },
  {
    id: "c5",
    hari: "Jumat",
    mulai: "07:10",
    selesai: "10:30",
    mk: "Fisika 1 + Praktikum",
    sks: 4,
    dosen: "Tatik Juwariyah",
    tipe: "Offline",
    ruang: "FT. LIMO. L.303",
    note: "Bersamaan dengan sesi praktikum",
    materiLink: "",
  },
  {
    id: "c6",
    hari: "TBD",
    mulai: null,
    selesai: null,
    mk: "Pancasila",
    sks: 2,
    dosen: "Hairunnisa BR. Sagala / Brigjen Pol. Darmawan",
    tipe: "TBD",
    ruang: "TBD",
    note: "Menunggu pembaruan sistem akademik",
    materiLink: "",
  },
];
