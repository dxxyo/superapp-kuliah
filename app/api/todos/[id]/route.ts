import { NextRequest, NextResponse } from "next/server";
import { getTodos, saveTodos } from "@/lib/kv";
import { isAuthed } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const todos = await getTodos();
  const idx = todos.findIndex((t) => t.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Todo tidak ditemukan" }, { status: 404 });

  todos[idx] = { ...todos[idx], ...body, id: todos[idx].id };
  await saveTodos(todos);
  return NextResponse.json(todos[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const todos = await getTodos();
  const filtered = todos.filter((t) => t.id !== params.id);
  if (filtered.length === todos.length) {
    return NextResponse.json({ error: "Todo tidak ditemukan" }, { status: 404 });
  }
  await saveTodos(filtered);
  return NextResponse.json({ ok: true });
}
