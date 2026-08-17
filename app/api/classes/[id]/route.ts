import { NextRequest, NextResponse } from "next/server";
import { getClasses, saveClasses } from "@/lib/kv";
import { isAuthed } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const classes = await getClasses();
  const idx = classes.findIndex((c) => c.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });

  classes[idx] = { ...classes[idx], ...body, id: classes[idx].id };
  await saveClasses(classes);
  return NextResponse.json(classes[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const classes = await getClasses();
  const filtered = classes.filter((c) => c.id !== params.id);
  if (filtered.length === classes.length) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }
  await saveClasses(filtered);
  return NextResponse.json({ ok: true });
}
