import { Redis } from "@upstash/redis";
import { ClassItem, TodoItem, SEED_CLASSES } from "./data";

// Works with any Vercel Marketplace Redis integration (Upstash, etc.) - it exposes
// KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL / _TOKEN) automatically
// as environment variables once you add the integration to your Vercel project.
const kv = new Redis({
  url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

const CLASSES_KEY = "jadwal:classes";
const TODOS_KEY = "jadwal:todos";
const SUBS_KEY = "push:subscriptions";
const NOTIFIED_PREFIX = "push:notified:"; // + classId:YYYY-MM-DD

export async function getClasses(): Promise<ClassItem[]> {
  const data = await kv.get<ClassItem[]>(CLASSES_KEY);
  if (!data) {
    await kv.set(CLASSES_KEY, SEED_CLASSES);
    return SEED_CLASSES;
  }
  return data;
}

export async function saveClasses(classes: ClassItem[]): Promise<void> {
  await kv.set(CLASSES_KEY, classes);
}

export async function getTodos(): Promise<TodoItem[]> {
  const data = await kv.get<TodoItem[]>(TODOS_KEY);
  return data || [];
}

export async function saveTodos(todos: TodoItem[]): Promise<void> {
  await kv.set(TODOS_KEY, todos);
}

// ---- push subscriptions (stored as a hash: id -> JSON subscription) ----
export async function addSubscription(id: string, subscription: unknown): Promise<void> {
  await kv.hset(SUBS_KEY, { [id]: JSON.stringify(subscription) });
}

export async function removeSubscription(id: string): Promise<void> {
  await kv.hdel(SUBS_KEY, id);
}

export async function getAllSubscriptions(): Promise<Record<string, string>> {
  const data = await kv.hgetall<Record<string, string>>(SUBS_KEY);
  return data || {};
}

// ---- dedupe reminders so cron (every 10 min) doesn't spam the same class twice ----
export async function wasNotified(classId: string, dateStr: string): Promise<boolean> {
  const val = await kv.get(NOTIFIED_PREFIX + classId + ":" + dateStr);
  return !!val;
}

export async function markNotified(classId: string, dateStr: string): Promise<void> {
  // expires after 20 hours, no need to keep forever
  await kv.set(NOTIFIED_PREFIX + classId + ":" + dateStr, "1", { ex: 60 * 60 * 20 });
}
