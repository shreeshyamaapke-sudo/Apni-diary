export function getTodayKey() { return new Date().toISOString().split("T")[0]; }
export function getWeek7() {
  const keys = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); keys.push(d.toISOString().split("T")[0]); }
  return keys;
}
export function fmtDateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
export function readableDate(key) { try { return new Date(key+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); } catch { return key; } }
export function todayFull() { return new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
export function getDayQuote(QUOTES) { return QUOTES[new Date().getDate() % QUOTES.length]; }
export async function sGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
export async function sSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
}
export async function askAI(KEY, messages, system) {
  if (!KEY) throw new Error("NO_KEY");
  const geminiMsgs = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  if (system) {
    geminiMsgs.unshift({ role: "user", parts: [{ text: system }] });
    geminiMsgs.splice(1, 0, { role: "model", parts: [{ text: "Understood." }] });
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: geminiMsgs }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
