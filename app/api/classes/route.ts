import { NextRequest, NextResponse } from "next/server";
import { getClasses, saveClasses } from "@/lib/kv";
import { isAuthed } from "@/lib/auth";
import { randomUUID } from "crypto";
import { ClassItem } from "@/lib/data";

export async function GET() {
  const classes = await getClasses();
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.mk || !body.hari) {
    return NextResponse.json({ error: "Mata kuliah dan hari wajib diisi" }, { status: 400 });
  }

  const classes = await getClasses();
  const newItem: ClassItem = {
    id: randomUUID(),
    hari: body.hari,
    mulai: body.mulai || null,
    selesai: body.selesai || null,
    mk: body.mk,
    sks: Number(body.sks) || 0,
    dosen: body.dosen || "-",
    tipe: body.tipe || "Offline",
    ruang: body.ruang || "-",
    note: body.note || "",
    materiLink: body.materiLink || "",
  };
  classes.push(newItem);
  await saveClasses(classes);
  return NextResponse.json(newItem, { status: 201 });
}
