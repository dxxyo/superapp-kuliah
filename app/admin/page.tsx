"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClassItem, TodoItem, DAY_ORDER } from "@/lib/data";

const EMPTY_FORM: Partial<ClassItem> = {
  hari: "Senin", mulai: "", selesai: "", mk: "", sks: 2, dosen: "", tipe: "Offline", ruang: "", note: "", materiLink: "",
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [form, setForm] = useState<Partial<ClassItem>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTodo, setNewTodo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setAuthed(d.authed));
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed]);

  function loadAll() {
    fetch("/api/classes").then((r) => r.json()).then(setClasses);
    fetch("/api/todos").then((r) => r.json()).then(setTodos);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoggingIn(false);
    if (res.ok) setAuthed(true);
    else {
      const d = await res.json().catch(() => ({}));
      setLoginError(d.error || "Gagal login");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
  }

  function startEdit(c: ClassItem) {
    setEditingId(c.id);
    setForm({ ...c });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submitClass(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, sks: Number(form.sks) || 0 };
    const res = editingId
      ? await fetch(`/api/classes/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) {
      resetForm();
      loadAll();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Gagal menyimpan");
    }
  }

  async function deleteClass(id: string) {
    if (!confirm("Hapus mata kuliah ini dari jadwal?")) return;
    await fetch(`/api/classes/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    loadAll();
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: newTodo }) });
    setNewTodo("");
    loadAll();
  }

  async function toggleTodo(t: TodoItem) {
    await fetch(`/api/todos/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !t.done }) });
    loadAll();
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    loadAll();
  }

  if (authed === null) {
    return <div className="wrap"><p>Memeriksa sesi…</p></div>;
  }

  if (!authed) {
    return (
      <div className="wrap">
        <form className="login-box" onSubmit={handleLogin}>
          <h1>Login Admin</h1>
          <p className="subtitle" style={{ margin: 0 }}>Jadwal Kuliah Kelas A</p>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </div>
          {loginError && <div className="error-text">{loginError}</div>}
          <button className="btn primary" style={{ marginTop: 16, width: "100%", justifyContent: "center" }} disabled={loggingIn}>
            {loggingIn ? "Memeriksa…" : "Masuk"}
          </button>
          <div style={{ marginTop: 14, fontSize: 12 }}><Link href="/">← Kembali ke jadwal</Link></div>
        </form>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="app-header">
        <div className="eyebrow">PANEL ADMIN</div>
        <h1 className="title" style={{ fontSize: 26 }}>Kelola Jadwal Kelas A</h1>
        <div className="subtitle">CRUD jadwal, notes, link materi, dan todo list</div>
        <div className="toolbar" style={{ marginTop: 0 }}>
          <Link className="btn" href="/">← Lihat jadwal publik</Link>
          <button className="btn danger" onClick={handleLogout}>Keluar</button>
        </div>
      </header>

      <div className="admin-grid two-col">
        {/* ---- Class form ---- */}
        <div className="panel">
          <h2>{editingId ? "Edit mata kuliah" : "Tambah mata kuliah"}</h2>
          <form onSubmit={submitClass}>
            <div className="form-grid">
              <div className="field">
                <label>Hari</label>
                <select value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value as any })}>
                  {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>SKS</label>
                <input type="number" min={0} value={form.sks ?? 0} onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>Jam mulai</label>
                <input type="time" value={form.mulai || ""} onChange={(e) => setForm({ ...form, mulai: e.target.value })} />
              </div>
              <div className="field">
                <label>Jam selesai</label>
                <input type="time" value={form.selesai || ""} onChange={(e) => setForm({ ...form, selesai: e.target.value })} />
              </div>
              <div className="field full">
                <label>Mata kuliah</label>
                <input value={form.mk || ""} onChange={(e) => setForm({ ...form, mk: e.target.value })} required />
              </div>
              <div className="field full">
                <label>Dosen pengajar</label>
                <input value={form.dosen || ""} onChange={(e) => setForm({ ...form, dosen: e.target.value })} />
              </div>
              <div className="field">
                <label>Tipe kelas</label>
                <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
                  <option>Offline</option>
                  <option>Online (Kelas Besar)</option>
                  <option>Online</option>
                  <option>TBD</option>
                </select>
              </div>
              <div className="field">
                <label>Ruangan</label>
                <input value={form.ruang || ""} onChange={(e) => setForm({ ...form, ruang: e.target.value })} />
              </div>
              <div className="field full">
                <label>Link materi</label>
                <input placeholder="https://…" value={form.materiLink || ""} onChange={(e) => setForm({ ...form, materiLink: e.target.value })} />
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea rows={2} value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>
            <div className="toolbar">
              <button className="btn primary" disabled={saving}>{saving ? "Menyimpan…" : editingId ? "Simpan perubahan" : "Tambah kelas"}</button>
              {editingId && <button type="button" className="btn" onClick={resetForm}>Batal</button>}
            </div>
          </form>
        </div>

        {/* ---- Todo list ---- */}
        <div className="panel">
          <h2>Todo list</h2>
          <form onSubmit={addTodo} className="toolbar" style={{ marginTop: 0 }}>
            <input className="search" placeholder="Tambah tugas / to-do…" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
            <button className="btn primary">Tambah</button>
          </form>
          <div style={{ marginTop: 14 }}>
            {todos.length === 0 && <div className="empty-day">Belum ada todo.</div>}
            {todos.map((t) => (
              <div key={t.id} className={`todo-item ${t.done ? "done" : ""}`}>
                <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t)} />
                <span style={{ flex: 1 }}>{t.text}</span>
                <button className="btn small danger" onClick={() => deleteTodo(t.id)}>Hapus</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Class list ---- */}
      <div className="summary-title">Semua mata kuliah</div>
      <div style={{ marginTop: 14 }}>
        {DAY_ORDER.map((d) => {
          const list = classes.filter((c) => c.hari === d);
          if (!list.length) return null;
          return (
            <div key={d} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "var(--paper-dim)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{d}</div>
              {list.map((c) => (
                <div className="admin-row" key={c.id}>
                  <div className="info">
                    <b>{c.mk}</b> — {c.mulai ? `${c.mulai}-${c.selesai}` : "jadwal TBD"} · {c.sks} SKS · {c.ruang}
                    {c.note && <div style={{ color: "var(--amber)", marginTop: 2 }}>⚠ {c.note}</div>}
                    {c.materiLink && <div style={{ marginTop: 2 }}>📎 {c.materiLink}</div>}
                  </div>
                  <div className="actions">
                    <button className="btn small" onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn small danger" onClick={() => deleteClass(c.id)}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
