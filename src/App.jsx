import { useState, useEffect, useRef, useCallback } from "react";

const KEY = import.meta.env.VITE_ANTHROPIC_KEY || "";

const QUOTES = [
  { text: "Jo tum aaj ho, woh kal ke tumhare choices ka result hai.", author: "\u2014 Swami Vivekananda" },
  { text: "Likho. Kyunki jo dil mein hai, woh kagaz pe aake halka ho jaata hai.", author: "\u2014 Rumi" },
  { text: "Ek chota kadam bhi sahi disha mein ek kadam hai.", author: "\u2014 Mahatma Gandhi" },
  { text: "Khud ko jaano \u2014 yahi sabse badi seekh hai.", author: "\u2014 Chanakya" },
  { text: "Zindagi woh nahi jo hoti hai, zindagi woh hai jo tum use banaate ho.", author: "\u2014 Paulo Coelho" },
  { text: "Roz ek page likho. Saalon baad woh tumhari sabse badi daulat hogi.", author: "\u2014 Anne Frank" },
  { text: "Mushkilaat tumhe todti nahi \u2014 woh tumhe banati hain.", author: "\u2014 APJ Abdul Kalam" },
  { text: "Jo andar hai woh bahar aata hai. Isliye andar ko saaf rakho.", author: "\u2014 Kabir" },
];
const MOODS = [
  { emoji: "\ud83c\udf1f", label: "Grateful" }, { emoji: "\ud83d\ude0a", label: "Happy" },
  { emoji: "\ud83d\ude0c", label: "Peaceful" }, { emoji: "\ud83d\udcaa", label: "Motivated" },
  { emoji: "\ud83c\udf00", label: "Confused" }, { emoji: "\ud83d\ude14", label: "Sad" },
  { emoji: "\ud83d\ude24", label: "Stressed" }, { emoji: "\ud83d\ude34", label: "Tired" },
  { emoji: "\ud83d\ude30", label: "Anxious" }, { emoji: "\ud83d\udd25", label: "Excited" },
];
const HABITS = [
  { id: "morning", label: "Subah ki routine", icon: "\ud83c\udf05" },
  { id: "exercise", label: "Exercise / Yoga", icon: "\ud83e\uddd8" },
  { id: "read", label: "Padhna / Seekhna", icon: "\ud83d\udcda" },
  { id: "water", label: "8 glass paani", icon: "\ud83d\udca7" },
  { id: "gratitude", label: "Gratitude", icon: "\ud83d\ude4f" },
  { id: "noscreen", label: "Sone se pehle no screen", icon: "\ud83d\udcf5" },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEK_DAYS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function getTodayKey() { return new Date().toISOString().split("T")[0]; }
function getWeek7() {
  const keys = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); keys.push(d.toISOString().split("T")[0]); }
  return keys;
}
function fmtDateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function readableDate(key) { try { return new Date(key+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); } catch { return key; } }
function todayFull() { return new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
function getDayQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }

async function sGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
async function sSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
}

async function askClaude(messages, system) {
  if (!KEY) throw new Error("NO_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01", "anthrop
