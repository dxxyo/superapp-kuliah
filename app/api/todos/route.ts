import { NextRequest, NextResponse } from "next/server";
import { getTodos, saveTodos } from "@/lib/kv";
import { isAuthed } from "@/lib/auth";
import { randomUUID } from "crypto";
import { TodoItem } from "@/lib/data";

export async function GET() {
  const todos = await getTodos();
  return NextResponse.json(todos);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.text) return NextResponse.json({ error: "Isi todo wajib diisi" }, { status: 400 });

  const todos = await getTodos();
  const newItem: TodoItem = {
    id: randomUUID(),
    text: body.text,
    done: false,
    dueDate: body.dueDate || null,
    relatedClassId: body.relatedClassId || null,
    createdAt: new Date().toISOString(),
  };
  todos.push(newItem);
  await saveTodos(todos);
  return NextResponse.json(newItem, { status: 201 });
}
