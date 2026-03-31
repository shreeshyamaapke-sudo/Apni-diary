import { useState, useEffect, useRef } from "react";

const KEY = import.meta.env.VITE_ANTHROPIC_KEY || "";

const QUOTES = [
  { text: "Jo tum aaj ho, woh kal ke tumhare choices ka result hai.", author: "— Swami Vivekananda" },
  { text: "Likho. Kyunki jo dil mein hai, woh kagaz pe aake halka ho jaata hai.", author: "— Rumi" },
  { text: "Ek chota kadam bhi sahi disha mein ek kadam hai.", author: "— Mahatma Gandhi" },
  { text: "Khud ko jaano — yahi sabse badi seekh hai.", author: "— Chanakya" },
  { text: "Zindagi woh nahi jo hoti hai, zindagi woh hai jo tum use banaate ho.", author: "— Paulo Coelho" },
  { text: "Roz ek page likho. Saalon baad woh tumhari sabse badi daulat hogi.", author: "— Anne Frank" },
  { text: "Mushkilaat tumhe todti nahi — woh tumhe banati hain.", author: "— APJ Abdul Kalam" },
  { text: "Jo andar hai woh bahar aata hai. Isliye andar ko saaf rakho.", author: "— Kabir" },
];

const MOODS = [
  { emoji: "🌟", label: "Grateful" }, { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Peaceful" }, { emoji: "💪", label: "Motivated" },
  { emoji: "🌀", label: "Confused" }, { emoji: "😔", label: "Sad" },
  { emoji: "😤", label: "Stressed" }, { emoji: "😴", label: "Tired" },
  { emoji: "😰", label: "Anxious" },  { emoji: "🔥", label: "Excited" },
];

const HABITS = [
  { id: "morning",   label: "Subah ki routine",        icon: "🌅" },
  { id: "exercise",  label: "Exercise / Yoga",          icon: "🧘" },
  { id: "read",      label: "Padhna / Seekhna",         icon: "📚" },
  { id: "water",     label: "8 glass paani",            icon: "💧" },
  { id: "gratitude", label: "Gratitude",                icon: "🙏" },
  { id: "noscreen",  label: "Sone se pehle no screen",  icon: "📵" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getTodayKey() { return new Date().toISOString().split("T")[0]; }
function fmtKey(y,m,d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function readableDate(key) {
  try { return new Date(key+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); } catch { return key; }
}
function todayFull() {
  return new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}
function getDayQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }

// days in a month
function daysInMonth(y,m) { return new Date(y,m+1,0).getDate(); }

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
    headers: { "Content-Type":"application/json","x-api-key":KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message||`HTTP ${res.status}`); }
  const d = await res.json();
  return d.content?.find(b=>b.type==="text")?.text || "";
}

// ── value cycling: undefined → "done" → "skip" → undefined
function nextVal(v) { if (!v) return "done"; if (v==="done") return "skip"; return undefined; }

// ══════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════
const S = `
:root {
  --paper:#faf6ef; --paper2:#f4ede0; --ink:#1e140a; --ink2:#4a3520; --ink3:#8a7055;
  --gold:#b8730a; --gold2:#d4920e; --gl:#fef3d0; --gb:#e8c870;
  --sage:#4a7a5a; --rose:#c0504a; --card:#fffdf8; --border:#e0d4bc;
  --sh:0 2px 16px rgba(80,50,10,0.07);
  --done:#22c55e; --skip:#ef4444; --done-bg:#dcfce7; --skip-bg:#fee2e2;
}
*{box-sizing:border-box;margin:0;padding:0}
html{height:100%;background:var(--paper)} body{height:100%;font-family:'Lora',Georgia,serif} #root{height:100%}

.app{display:flex;flex-direction:column;height:100dvh;max-width:430px;margin:0 auto;background:var(--paper);color:var(--ink);overflow:hidden}
.app::before{content:'';position:fixed;inset:0;max-width:430px;margin:0 auto;background-image:repeating-linear-gradient(transparent,transparent 31px,rgba(180,140,80,0.07) 31px,rgba(180,140,80,0.07) 32px);pointer-events:none;z-index:0}

/* HEADER */
.hdr{flex-shrink:0;z-index:10;background:linear-gradient(180deg,#fffdf8 0%,rgba(255,253,248,0.95) 100%);border-bottom:1px solid var(--border);padding:14px 18px 12px}
.hdr-row{display:flex;align-items:center;justify-content:space-between}
.hdr-date{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase;margin-bottom:3px}
.hdr-title{font-family:'Playfair Display',serif;font-size:22px;font-style:italic;font-weight:400;color:var(--ink)}
.hdr-title span{color:var(--gold)}
.streak-pill{display:flex;flex-direction:column;align-items:center;background:var(--gl);border:1.5px solid var(--gb);border-radius:12px;padding:6px 12px}
.streak-fire{font-size:20px;line-height:1} .streak-num{font-family:'DM Mono',monospace;font-size:11px;color:var(--gold);font-weight:500} .streak-lbl{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3);letter-spacing:1px;text-transform:uppercase}

/* BODY */
.body{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;position:relative;z-index:1}

/* NAV */
.nav{flex-shrink:0;z-index:10;background:rgba(255,253,248,0.97);backdrop-filter:blur(20px);border-top:1px solid var(--border);display:flex;justify-content:space-around;align-items:stretch;padding:6px 0 max(14px,env(safe-area-inset-bottom))}
.nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink3);padding:6px 4px;border-radius:10px;transition:all .2s;-webkit-tap-highlight-color:transparent}
.nb.on{color:var(--gold)} .nb.on .ni-wrap{background:var(--gl);border-color:var(--gb)}
.ni-wrap{width:40px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1.5px solid transparent;transition:all .2s;margin-bottom:1px} .ni{font-size:18px}

/* COMMON */
.pad{padding:16px 16px 28px}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:13px;box-shadow:var(--sh);position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--gold2),transparent);opacity:0;transition:opacity .3s}
.card.hi::before{opacity:1}
.lbl{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:10px}
.sec-title{font-family:'Playfair Display',serif;font-size:20px;font-style:italic;color:var(--ink);margin-bottom:2px}
.sec-sub{font-size:12px;color:var(--ink3);margin-bottom:16px;font-style:italic}
.srow{display:flex;gap:10px;margin-bottom:14px}
.sb{flex:1;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 10px;text-align:center;box-shadow:var(--sh)}
.sn{font-family:'Playfair Display',serif;font-size:28px;color:var(--gold);line-height:1} .sl{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3);letter-spacing:1px;margin-top:4px;text-transform:uppercase}

/* BUTTONS */
.btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold2));color:white;border:none;border-radius:12px;padding:13px 20px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1.5px;cursor:pointer;transition:all .2s;text-transform:uppercase;-webkit-tap-highlight-color:transparent;display:inline-flex;align-items:center;gap:8px}
.btn-gold:active{transform:scale(.98)} .btn-gold:disabled{opacity:.5}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--ink2);border-radius:12px;padding:12px 18px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all .2s;-webkit-tap-highlight-color:transparent}
.btn-ghost:active{background:var(--gl);border-color:var(--gb);color:var(--gold)}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.sbadge{display:inline-flex;align-items:center;gap:6px;background:#e8f5ea;border:1px solid #a8d8b0;border-radius:8px;padding:5px 11px;font-family:'DM Mono',monospace;font-size:10px;color:var(--sage);margin-top:10px;animation:popIn .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes popIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}

/* TODAY tab */
.qcard{background:linear-gradient(135deg,var(--gl),#fffbf0);border:1px solid var(--gb);border-radius:16px;padding:18px;margin-bottom:13px}
.qmark{font-size:48px;line-height:.6;color:var(--gb);font-family:Georgia,serif;margin-bottom:6px;display:block}
.qtxt{font-family:'Playfair Display',serif;font-size:15px;font-style:italic;color:var(--ink2);line-height:1.65;margin-bottom:8px}
.qauthor{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);letter-spacing:1px}
.mgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.mbtn{display:flex;flex-direction:column;align-items:center;gap:4px;background:var(--paper2);border:1.5px solid var(--border);border-radius:12px;padding:10px 4px;cursor:pointer;transition:all .2s;-webkit-tap-highlight-color:transparent}
.mbtn:active{transform:scale(.95)} .mbtn.sel{border-color:var(--gold);background:var(--gl)}
.memoji{font-size:22px} .mlbl{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3);text-align:center} .mbtn.sel .mlbl{color:var(--gold)}
.gi{width:100%;background:var(--paper2);border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--ink);font-family:'Lora',serif;font-size:15px;outline:none;transition:all .2s;line-height:1.5;margin-bottom:8px;-webkit-appearance:none}
.gi:focus{border-color:var(--gb);background:white;box-shadow:0 0 0 3px rgba(184,115,10,.08)} .gi::placeholder{color:var(--ink3);font-style:italic}
.gnum{font-family:'DM Mono',monospace;font-size:11px;color:var(--gold);margin-right:8px}
.jta{width:100%;background:var(--paper2);border:1.5px solid var(--border);border-radius:12px;padding:14px;color:var(--ink);font-family:'Lora',serif;font-size:16px;line-height:1.85;resize:none;outline:none;transition:all .2s;min-height:140px;background-image:repeating-linear-gradient(transparent,transparent 31px,rgba(180,140,80,.1) 31px,rgba(180,140,80,.1) 32px);background-size:100% 32px;-webkit-appearance:none}
.jta:focus{border-color:var(--gb);background-color:white;box-shadow:0 0 0 3px rgba(184,115,10,.07)} .jta::placeholder{color:var(--ink3);font-style:italic}
.tprompt{background:linear-gradient(135deg,var(--gl),#fffbf2);border:1.5px solid var(--gb);border-radius:16px;padding:18px;margin-bottom:13px}
.tprompt .lbl{color:var(--gold)} .tptxt{font-family:'Playfair Display',serif;font-size:17px;font-style:italic;color:var(--ink);line-height:1.6;margin-bottom:12px}
.ins{background:linear-gradient(135deg,#f0f9f0,#e8f5ea);border:1.5px solid #a8d8b0;border-radius:14px;padding:16px;margin-top:12px}
.ins .lbl{color:var(--sage)} .ins p{font-size:14px;color:#1a3a22;line-height:1.75}

/* ════════════════════════════════
   MONTHLY HABIT TRACKER
════════════════════════════════ */
.ht-wrap{padding:14px 0 28px}
.ht-header{padding:0 16px;margin-bottom:4px}
.ht-month-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.ht-month{font-family:'Playfair Display',serif;font-size:20px;font-style:italic;color:var(--ink)}
.ht-nav{background:var(--paper2);border:1.5px solid var(--border);border-radius:9px;width:34px;height:34px;cursor:pointer;font-size:18px;color:var(--ink2);display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}
.ht-nav:active{background:var(--gl);border-color:var(--gb);color:var(--gold)}

/* Legend */
.ht-legend{display:flex;align-items:center;gap:12px;padding:0 16px 12px;flex-wrap:wrap}
.ht-leg-item{display:flex;align-items:center;gap:5px;font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3)}
.ht-leg-dot{width:18px;height:18px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}

/* Scrollable grid */
.ht-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px}
.ht-scroll::-webkit-scrollbar{height:3px}
.ht-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

.ht-table{min-width:max-content;padding:0 16px}
/* header row: habit name col + day cols */
.ht-row{display:flex;align-items:center;gap:4px;margin-bottom:4px}
.ht-habit-col{width:110px;flex-shrink:0;display:flex;align-items:center;gap:6px;padding-right:6px}
.ht-habit-icon{font-size:14px;flex-shrink:0}
.ht-habit-name{font-size:11px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;font-family:'Lora',serif}
.ht-day-head{width:28px;flex-shrink:0;text-align:center;font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);padding:4px 0}
.ht-day-head.today-col{color:var(--gold);font-weight:700}

/* cells */
.ht-cell{width:28px;height:28px;flex-shrink:0;border-radius:7px;border:1.5px solid var(--border);background:var(--paper2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;transition:all .15s;-webkit-tap-highlight-color:transparent;color:transparent}
.ht-cell:active{transform:scale(.88)}
.ht-cell.done{background:var(--done-bg);border-color:var(--done);color:var(--done)}
.ht-cell.skip{background:var(--skip-bg);border-color:var(--skip);color:var(--skip)}
.ht-cell.today-col{border-color:var(--gold);border-width:2px}
.ht-cell.future{opacity:.35;cursor:default}

/* Stats bar */
.ht-stats{display:flex;gap:8px;padding:10px 16px 0;overflow-x:auto}
.ht-stat{flex-shrink:0;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 14px;text-align:center;min-width:80px;box-shadow:var(--sh)}
.ht-stat-n{font-family:'Playfair Display',serif;font-size:22px;color:var(--gold);line-height:1}
.ht-stat-l{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3);letter-spacing:1px;margin-top:3px;text-transform:uppercase}

/* ── GRAPH ── */
.graph-wrap{margin:14px 16px 0;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:var(--sh)}
.graph-title{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}
.graph-area{position:relative;height:100px;overflow:hidden}
.graph-svg{width:100%;height:100%;overflow:visible}
.graph-ylab{font-family:'DM Mono',monospace;font-size:8px;fill:var(--ink3)}
.graph-line{fill:none;stroke:var(--gold);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.graph-fill{fill:url(#gfill);opacity:.3}
.graph-dot{fill:var(--gold);cursor:pointer}
.graph-dot.skip-day{fill:var(--skip)}
.graph-x-labels{display:flex;justify-content:space-between;margin-top:4px;padding:0 2px}
.graph-x-lbl{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3)}

/* motivation */
.ht-quote{background:linear-gradient(135deg,var(--gl),#fffbf2);border:1.5px solid var(--gb);border-radius:14px;padding:16px;margin:14px 16px 0}
.ht-quote .lbl{color:var(--gold);margin-bottom:8px}
.ht-quote p{font-family:'Playfair Display',serif;font-size:14px;font-style:italic;color:var(--ink);line-height:1.65}

/* CALENDAR */
.calw{padding:14px 16px 28px}
.calhdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.calmth{font-family:'Playfair Display',serif;font-size:20px;font-style:italic;color:var(--ink)}
.calnv{background:var(--paper2);border:1.5px solid var(--border);border-radius:9px;width:34px;height:34px;cursor:pointer;font-size:18px;color:var(--ink2);display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}
.calnv:active{background:var(--gl);border-color:var(--gb);color:var(--gold)}
.cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cdn{text-align:center;font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);letter-spacing:1px;padding:4px 0 6px;text-transform:uppercase}
.cc{aspect-ratio:1;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;border:1.5px solid transparent;font-family:'DM Mono',monospace;font-size:13px;color:var(--ink2);background:transparent;gap:3px;padding:0;transition:all .18s;-webkit-tap-highlight-color:transparent}
.cc:active{transform:scale(.92)} .cc.he{background:var(--gl);border-color:var(--gb);color:var(--gold)} .cc.td{background:var(--gold)!important;color:white!important;border-color:var(--gold)!important;font-weight:600} .cc.om{opacity:.28} .cc.sel{box-shadow:0 0 0 2.5px var(--gold),0 0 0 5px rgba(184,115,10,.15)}
.edot{width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0} .cc.td .edot{background:rgba(255,255,255,.7)}
.ev{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;margin-top:13px;box-shadow:var(--sh);animation:slideUp .25s ease}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.evdate{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
.evmood{display:inline-flex;align-items:center;background:var(--gl);border:1px solid var(--gb);border-radius:20px;padding:4px 12px;font-size:13px;color:var(--gold);margin-bottom:12px}
.evs{margin-bottom:14px} .evsl{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
.evtxt{font-size:15px;color:var(--ink);line-height:1.85;white-space:pre-wrap} .evg{font-size:14px;color:var(--ink2);margin-bottom:4px}
.evc{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);letter-spacing:1px;cursor:pointer;text-transform:uppercase;margin-top:14px;display:inline-block;border-bottom:1px dashed var(--border);-webkit-tap-highlight-color:transparent}

/* GOALS */
.gc{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:13px;box-shadow:var(--sh)}
.gtlbl{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase;margin-bottom:14px}
.gf{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
.gk{font-family:'DM Mono',monospace;font-size:9px;color:var(--gold);letter-spacing:1px;text-transform:uppercase;padding-top:10px;min-width:28px}
.ginp{flex:1;background:var(--paper2);border:1.5px solid var(--border);border-radius:10px;padding:9px 13px;color:var(--ink);font-family:'Lora',serif;font-size:14px;outline:none;transition:all .2s;line-height:1.5;-webkit-appearance:none}
.ginp:focus{border-color:var(--gb);background:white} .ginp::placeholder{color:var(--ink3);font-style:italic}

/* COACH */
.cshell{display:flex;flex-direction:column;height:100%;overflow:hidden}
.chdr{flex-shrink:0;padding:16px 16px 0}
.cmsgs{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}
.ciw{flex-shrink:0;padding:10px 16px max(14px,env(safe-area-inset-bottom));border-top:1px solid var(--border);background:rgba(255,253,248,.98)}
.msg{max-width:88%} .msg.ai{align-self:flex-start} .msg.me{align-self:flex-end}
.mwho{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3);letter-spacing:1px;margin-bottom:4px;text-transform:uppercase}
.mbub{padding:12px 15px;border-radius:16px;font-size:15px;line-height:1.65}
.msg.ai .mbub{background:var(--paper2);border:1.5px solid var(--border);color:var(--ink);border-radius:4px 16px 16px 16px}
.msg.me .mbub{background:var(--gl);border:1.5px solid var(--gb);color:var(--ink);border-radius:16px 4px 16px 16px}
.crow{display:flex;gap:8px;align-items:flex-end}
.cta{flex:1;background:var(--paper2);border:1.5px solid var(--border);border-radius:14px;padding:12px 14px;color:var(--ink);font-family:'Lora',serif;font-size:16px;outline:none;resize:none;line-height:1.5;max-height:100px;transition:border-color .2s;-webkit-appearance:none}
.cta:focus{border-color:var(--gb);background:white} .cta::placeholder{color:var(--ink3);font-style:italic}
.csnd{background:var(--gold);border:none;color:white;border-radius:12px;min-width:46px;height:46px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;-webkit-tap-highlight-color:transparent}
.csnd:disabled{opacity:.5} .csnd:active{transform:scale(.94)}
.qcs{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
.qc{background:var(--paper2);border:1.5px solid var(--border);color:var(--ink2);border-radius:20px;padding:7px 12px;font-size:13px;cursor:pointer;font-family:'Lora',serif;-webkit-tap-highlight-color:transparent}
.qc:active{background:var(--gl);border-color:var(--gb);color:var(--gold)}

/* MISC */
.errb{background:#fff5f5;border:1.5px solid #f0b8b8;border-radius:14px;padding:16px;margin-bottom:14px}
.errb .lbl{color:#b04040;margin-bottom:8px} .errb p{font-size:13px;color:#6a2020;line-height:1.7;margin-bottom:6px}
.errb code{background:#ffe8e8;padding:2px 6px;border-radius:4px;font-size:12px;color:#b04040;font-family:'DM Mono',monospace}
.toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:var(--gold);color:white;padding:10px 22px;border-radius:20px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;z-index:999;box-shadow:0 4px 24px rgba(184,115,10,.4);animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);white-space:nowrap}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px) scale(.9)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.thnk{display:flex;align-items:center;gap:8px;color:var(--ink3);font-size:13px;font-style:italic}
.da span{display:inline-block;color:var(--gold);animation:bl 1.4s infinite both}
.da span:nth-child(2){animation-delay:.2s} .da span:nth-child(3){animation-delay:.4s}
@keyframes bl{0%,80%,100%{opacity:0}40%{opacity:1}}
.fade{animation:fu .28s ease} @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
`;

// ══════════════════════════════════════════════
//  HABIT GRAPH COMPONENT
// ══════════════════════════════════════════════
function HabitGraph({ habits, year, month }) {
  const days = daysInMonth(year, month);
  const todayD = new Date().getDate();
  const todayM = new Date().getMonth();
  const todayY = new Date().getFullYear();
  const isCurrentMonth = year === todayY && month === todayM;

  // Build daily score array
  const scores = [];
  for (let d = 1; d <= days; d++) {
    const key = fmtKey(year, month, d);
    const isPast = !isCurrentMonth || d <= todayD;
    if (!isPast) { scores.push(null); continue; }
    let done = 0, skip = 0;
    HABITS.forEach(h => {
      const v = habits[`${h.id}|${key}`];
      if (v === "done") done++;
      else if (v === "skip") skip++;
    });
    scores.push({ done, skip, pct: Math.round((done / HABITS.length) * 100) });
  }

  const filledScores = scores.filter(s => s !== null);
  if (filledScores.length === 0) return (
    <div className="graph-wrap">
      <div className="graph-title">📊 Daily Score Graph</div>
      <div style={{textAlign:"center",color:"var(--ink3)",fontSize:"13px",fontStyle:"italic",padding:"20px 0"}}>
        Pehle habits tick karo — graph yahan dikhega ✨
      </div>
    </div>
  );

  const W = 280, H = 80, PAD_L = 28, PAD_R = 8;
  const plotW = W - PAD_L - PAD_R;
  const filledDays = scores.map((s,i) => s !== null ? i+1 : null).filter(Boolean);

  const getX = (d) => PAD_L + ((d - 1) / (days - 1)) * plotW;
  const getY = (pct) => H - (pct / 100) * H;

  const pointsArr = filledDays.map(d => ({ d, s: scores[d-1] }));
  const polyPoints = pointsArr.map(({d,s}) => `${getX(d)},${getY(s.pct)}`).join(" ");
  const fillPoints = [
    `${getX(filledDays[0])},${H}`,
    ...pointsArr.map(({d,s}) => `${getX(d)},${getY(s.pct)}`),
    `${getX(filledDays[filledDays.length-1])},${H}`
  ].join(" ");

  // X-axis labels: show day 1, 7, 14, 21, 28 and last
  const xLabels = [1,7,14,21,28,days].filter(d => d <= days);

  const avgPct = Math.round(filledScores.reduce((a,s)=>a+s.pct,0)/filledScores.length);

  return (
    <div className="graph-wrap">
      <div className="graph-title">📊 Daily Score Graph — Avg: {avgPct}%</div>
      <div className="graph-area">
        <svg viewBox={`0 0 ${W} ${H}`} className="graph-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8730a" stopOpacity=".6"/>
              <stop offset="100%" stopColor="#b8730a" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Y grid lines */}
          {[0,25,50,75,100].map(pct => (
            <g key={pct}>
              <line x1={PAD_L} y1={getY(pct)} x2={W-PAD_R} y2={getY(pct)} stroke="#e0d4bc" strokeWidth=".8" strokeDasharray="3,3"/>
              <text x={PAD_L-3} y={getY(pct)+3} className="graph-ylab" textAnchor="end" fontSize="7">{pct}%</text>
            </g>
          ))}
          {/* Fill */}
          {pointsArr.length > 1 && <polygon points={fillPoints} className="graph-fill"/>}
          {/* Line */}
          {pointsArr.length > 1 && <polyline points={polyPoints} className="graph-line"/>}
          {/* Dots */}
          {pointsArr.map(({d,s}) => (
            <circle key={d} cx={getX(d)} cy={getY(s.pct)} r="3.5"
              className={`graph-dot ${s.pct < 50 ? "skip-day":""}`}/>
          ))}
        </svg>
      </div>
      <div className="graph-x-labels">
        {xLabels.map(d => <span key={d} className="graph-x-lbl">{d}</span>)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════
export default function App() {
  const TODAYKEY = getTodayKey();
  const quote = getDayQuote();
  const now = new Date();

  const [tab, setTab] = useState("today");
  const [mood, setMood] = useState("");
  const [grats, setGrats] = useState(["","",""]);
  const [hl, setHl] = useState("");
  const [jText, setJText] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoad, setAiLoad] = useState(false);
  const [insight, setInsight] = useState("");
  const [insLoad, setInsLoad] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [habits, setHabits] = useState({});
  const [goals, setGoals] = useState([
    {type:"Personal 🌱",what:"",why:"",how:""},
    {type:"Financial 💰",what:"",why:"",how:""},
    {type:"Professional 🚀",what:"",why:"",how:""},
  ]);
  const [chat, setChat] = useState([{role:"ai",text:"Namaste 🙏 Main tumhara personal clarity coach hoon. Koi dar, emotional struggle, stress ho — khul ke batao. Kya chal raha hai aaj?"}]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [eDates, setEDates] = useState({});
  const [calY, setCalY] = useState(now.getFullYear());
  const [calM, setCalM] = useState(now.getMonth());
  const [selDay, setSelDay] = useState(null);
  const [selEntry, setSelEntry] = useState(null);
  const [toast, setToast] = useState("");

  // Habit tracker month
  const [htY, setHtY] = useState(now.getFullYear());
  const [htM, setHtM] = useState(now.getMonth());

  const chatEnd = useRef(null);
  const chatTa = useRef(null);

  useEffect(() => {
    (async () => {
      const h = await sGet("md-habits"); if (h) setHabits(h);
      const g = await sGet("md-goals"); if (g) setGoals(g);
      const t = await sGet(`md-entry-${TODAYKEY}`);
      if (t) { setMood(t.mood||""); setGrats(t.grats||["","",""]); setHl(t.hl||""); setJText(t.text||""); setSaved(true); }
      const idx = await sGet("md-index")||{};
      setEDates(idx);
      let s=0; const d=new Date();
      while(true){const k=d.toISOString().split("T")[0];if(idx[k]){s++;d.setDate(d.getDate()-1);}else break;}
      setStreak(s); setTotal(Object.keys(idx).length);
    })();
  }, []);

  useEffect(() => { if(tab==="coach") chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chat,tab]);

  const showToast = m => { setToast(m); setTimeout(()=>setToast(""),2600); };
  const handleErr = e => { setApiErr(e.message==="NO_KEY"?".env mein VITE_ANTHROPIC_KEY add karo":`Error: ${e.message}`); };

  const saveEntry = async () => {
    const filled = grats.filter(g=>g.trim()).length;
    if(!mood&&filled===0&&!jText.trim()){showToast("Kuch toh likho pehle... 😊");return;}
    const ok = await sSet(`md-entry-${TODAYKEY}`,{date:TODAYKEY,mood,grats,hl,text:jText,ts:Date.now()});
    if(ok){
      const idx=await sGet("md-index")||{}; idx[TODAYKEY]=true; await sSet("md-index",idx);
      setEDates({...idx}); setSaved(true);
      let s=0;const d=new Date();
      while(true){const k=d.toISOString().split("T")[0];if(idx[k]){s++;d.setDate(d.getDate()-1);}else break;}
      setStreak(s); setTotal(Object.keys(idx).length);
      showToast("✦ Saved! Kal phir milenge 🌟");
    } else showToast("Save fail hua");
  };

  const getPrompt = async () => {
    setAiLoad(true); setApiErr("");
    try {
      const txt = await askClaude([{role:"user",content:`Aaj: ${todayFull()}. Mood: ${mood||"pata nahi"}. Ek deep journaling question do. Hinglish. 1-2 sentences.`}],"Tu ek wise journaling mentor hai. Sirf ek impactful question.");
      setAiPrompt(txt.trim());
    } catch(e){handleErr(e);}
    setAiLoad(false);
  };

  const getInsight = async () => {
    const all=[mood?`Mood: ${mood}`:"",grats.filter(g=>g.trim()).map((g,i)=>`Gratitude ${i+1}: ${g}`).join("\n"),hl?`Highlight: ${hl}`:"",jText.trim()?`Journal: ${jText}`:""].filter(Boolean).join("\n\n");
    if(!all){showToast("Pehle kuch toh likho...");return;}
    setInsLoad(true); setApiErr("");
    try {
      const txt = await askClaude([{role:"user",content:`Meri diary:\n\n${all}\n\nEk warm reflection do.`}],"Tu ek wise life coach hai. 1 observation, 1 appreciation, 1 next step. Hinglish. Max 7 lines.");
      setInsight(txt);
    } catch(e){handleErr(e);}
    setInsLoad(false);
  };

  // ── Habit toggle: undefined → done → skip → undefined ──
  const toggleHabit = async (hId, dayKey) => {
    const k = `${hId}|${dayKey}`;
    const cur = habits[k];
    const nxt = nextVal(cur);
    const nh = { ...habits };
    if (nxt) nh[k] = nxt; else delete nh[k];
    setHabits(nh); await sSet("md-habits", nh);
  };

  const updGoal = async (i,f,v) => {
    const ng=goals.map((g,j)=>j===i?{...g,[f]:v}:g); setGoals(ng); await sSet("md-goals",ng);
  };

  const sendChat = async () => {
    if(!chatIn.trim()||chatLoad)return;
    const msg=chatIn.trim(); setChatIn(""); setApiErr("");
    const nc=[...chat,{role:"user",text:msg}]; setChat(nc); setChatLoad(true);
    try {
      const history=nc.slice(-12).map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
      const txt=await askClaude(history,"Tu ek compassionate emotional coach hai. Desi Indian context. CBT + practical wisdom. Hinglish. Short 4-6 lines. Actionable. Never judge.");
      setChat(prev=>[...prev,{role:"ai",text:txt}]);
    } catch(e){handleErr(e);setChat(prev=>[...prev,{role:"ai",text:"API key check karo."}]);}
    setChatLoad(false);
  };

  // Calendar
  const buildCal = (y,m) => {
    const first=new Date(y,m,1).getDay(); const adj=(first+6)%7; const days=new Date(y,m+1,0).getDate();
    const cells=[];
    for(let i=0;i<adj;i++){const d=new Date(y,m,1-adj+i);cells.push({day:d.getDate(),key:fmtKey(d.getFullYear(),d.getMonth(),d.getDate()),other:true});}
    for(let d=1;d<=days;d++)cells.push({day:d,key:fmtKey(y,m,d),other:false});
    const rem=42-cells.length;
    for(let i=1;i<=rem;i++){const d=new Date(y,m+1,i);cells.push({day:d.getDate(),key:fmtKey(d.getFullYear(),d.getMonth(),d.getDate()),other:true});}
    return cells;
  };
  const pickDay = async cell => {
    setSelDay(cell.key); setSelEntry(null);
    if(eDates[cell.key]){const e=await sGet(`md-entry-${cell.key}`);setSelEntry(e);}
  };
  const calCells=buildCal(calY,calM);

  // Habit tracker computed values
  const htDays = daysInMonth(htY, htM);
  const todayDate = now.getDate();
  const isHtCurrentMonth = htY === now.getFullYear() && htM === now.getMonth();

  // Monthly stats
  let monthDone=0, monthSkip=0, monthTotal=0;
  for(let d=1; d<=htDays; d++){
    const isPast = !isHtCurrentMonth || d <= todayDate;
    if(!isPast) continue;
    HABITS.forEach(h=>{
      const v=habits[`${h.id}|${fmtKey(htY,htM,d)}`];
      if(v==="done") monthDone++;
      else if(v==="skip") monthSkip++;
      monthTotal++;
    });
  }
  const monthPct = monthTotal ? Math.round((monthDone/monthTotal)*100) : 0;

  // Today's habit completion
  let todayHDone=0, todayHSkip=0;
  HABITS.forEach(h=>{
    const v=habits[`${h.id}|${TODAYKEY}`];
    if(v==="done") todayHDone++;
    else if(v==="skip") todayHSkip++;
  });

  return (
    <>
      <style>{S}</style>
      <div className="app">
        {toast&&<div className="toast">{toast}</div>}

        {tab!=="coach"&&(
          <div className="hdr">
            <div className="hdr-row">
              <div><div className="hdr-date">{todayFull()}</div><div className="hdr-title">Meri <span>Diary</span> ✦</div></div>
              <div className="streak-pill">
                <span className="streak-fire">{streak>0?"🔥":"✦"}</span>
                <span className="streak-num">{streak}</span>
                <span className="streak-lbl">Streak</span>
              </div>
            </div>
          </div>
        )}

        {tab!=="coach"&&(
          <div className="body">
            {apiErr&&<div style={{padding:"12px 16px 0"}}><div className="errb fade"><div className="lbl">⚠ API Setup</div><p>Vercel → Environment Variables mein add karo:</p><p><code>VITE_ANTHROPIC_KEY=sk-ant-...</code></p></div></div>}

            {/* ── TODAY ── */}
            {tab==="today"&&(
              <div className="pad fade">
                <div className="qcard"><span className="qmark">"</span><div className="qtxt">{quote.text}</div><div className="qauthor">{quote.author}</div></div>
                <div className="srow">
                  <div className="sb"><div className="sn">{total}</div><div className="sl">Entries</div></div>
                  <div className="sb"><div className="sn">{streak>0?"🔥":""}{streak}</div><div className="sl">Streak</div></div>
                  <div className="sb"><div className="sn">{todayHDone}/{HABITS.length}</div><div className="sl">Habits ✓</div></div>
                </div>
                <div className="card">
                  <div className="lbl">Aaj kaisa feel ho raha hai?</div>
                  <div className="mgrid">
                    {MOODS.map(m=><button key={m.label} className={`mbtn ${mood===m.label?"sel":""}`} onClick={()=>setMood(m.label)}><span className="memoji">{m.emoji}</span><span className="mlbl">{m.label}</span></button>)}
                  </div>
                </div>
                <div className="card hi">
                  <div className="lbl">🙏 Aaj ke 3 shukrana</div>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{display:"flex",alignItems:"center"}}>
                      <span className="gnum">{i+1}.</span>
                      <input className="gi" placeholder={i===0?"Main shukargujar hoon...":i===1?"Ek aur cheez jo achi lagi...":"Aur ek chhoti si khushi..."} value={grats[i]} onChange={e=>{const g=[...grats];g[i]=e.target.value;setGrats(g);}} style={{flex:1}}/>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="lbl">✨ Aaj ka ek highlight</div>
                  <input className="gi" placeholder="Aaj ki ek achi cheez jo yaad rahegi..." value={hl} onChange={e=>setHl(e.target.value)} style={{marginBottom:0}}/>
                </div>
                <div className="tprompt">
                  <div className="lbl">✦ Aaj ka deep question</div>
                  {aiLoad&&<div className="thnk">Soch raha hoon <div className="da"><span>.</span><span>.</span><span>.</span></div></div>}
                  {aiPrompt&&!aiLoad&&<div className="tptxt" onClick={()=>setJText(t=>t+(t?"\n\n":"")+aiPrompt+"\n")}>{aiPrompt}<div style={{fontSize:"11px",color:"var(--ink3)",fontFamily:"DM Mono,monospace",marginTop:"8px",letterSpacing:"1px"}}>TAP TO USE IN JOURNAL ↓</div></div>}
                  {!aiPrompt&&!aiLoad&&<p style={{fontSize:"14px",color:"var(--ink3)",fontStyle:"italic",marginBottom:"12px"}}>Ek personalized question generate karo...</p>}
                  <button className="btn-ghost" onClick={getPrompt} disabled={aiLoad} style={{fontSize:"11px",padding:"9px 14px"}}>✦ Generate Question</button>
                </div>
                <div className="card">
                  <div className="lbl">📖 Aaj ka journal</div>
                  <textarea className="jta" placeholder={"Yahan likho... jo dil mein aaye.\n\nKoi judge nahi karta."} value={jText} onChange={e=>setJText(e.target.value)} rows={7}/>
                  {saved&&<div className="sbadge">☁️ Saved</div>}
                  <div className="btn-row">
                    <button className="btn-gold" onClick={saveEntry}>☁️ Save Entry</button>
                    <button className="btn-ghost" onClick={getInsight} disabled={insLoad}>{insLoad?"Padh raha hoon...":"🔍 AI Reflection"}</button>
                  </div>
                  {insight&&<div className="ins"><div className="lbl">✦ AI Reflection</div><p>{insight}</p></div>}
                </div>
              </div>
            )}

            {/* ── CALENDAR ── */}
            {tab==="calendar"&&(
              <div className="calw fade">
                <div className="calhdr">
                  <button className="calnv" onClick={()=>{if(calM===0){setCalM(11);setCalY(y=>y-1);}else setCalM(m=>m-1);setSelDay(null);}}>‹</button>
                  <div className="calmth">{MONTHS[calM]} {calY}</div>
                  <button className="calnv" onClick={()=>{if(calM===11){setCalM(0);setCalY(y=>y+1);}else setCalM(m=>m+1);setSelDay(null);}}>›</button>
                </div>
                <div className="card" style={{padding:"13px"}}>
                  <div className="cgrid" style={{marginBottom:"8px"}}>{["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=><div key={d} className="cdn">{d}</div>)}</div>
                  <div className="cgrid">
                    {calCells.map((cell,i)=>(
                      <button key={i} onClick={()=>pickDay(cell)} className={`cc ${eDates[cell.key]?"he":""} ${cell.key===TODAYKEY?"td":""} ${cell.other?"om":""} ${selDay===cell.key?"sel":""}`}>
                        <span>{cell.day}</span>{eDates[cell.key]&&<div className="edot"/>}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:"14px",alignItems:"center",marginBottom:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:13,height:13,borderRadius:4,background:"var(--gl)",border:"1.5px solid var(--gb)"}}/><span style={{fontSize:"11px",color:"var(--ink3)",fontFamily:"DM Mono"}}>Entry hai</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:13,height:13,borderRadius:4,background:"var(--gold)"}}/><span style={{fontSize:"11px",color:"var(--ink3)",fontFamily:"DM Mono"}}>Aaj</span></div>
                  <span style={{fontSize:"11px",color:"var(--ink3)",fontFamily:"DM Mono",marginLeft:"auto"}}>{total} entries ☁️</span>
                </div>
                {selDay?(
                  <div className="ev">
                    <div className="evdate">{readableDate(selDay)}</div>
                    {selEntry?(
                      <>
                        {selEntry.mood&&<div className="evmood">{MOODS.find(m=>m.label===selEntry.mood)?.emoji} {selEntry.mood}</div>}
                        {selEntry.grats?.some(g=>g.trim())&&<div className="evs"><div className="evsl">🙏 Shukrana</div>{selEntry.grats.filter(g=>g.trim()).map((g,i)=><div key={i} className="evg">{i+1}. {g}</div>)}</div>}
                        {selEntry.hl&&<div className="evs"><div className="evsl">✨ Highlight</div><div className="evtxt" style={{fontSize:"14px"}}>{selEntry.hl}</div></div>}
                        {selEntry.text&&<div className="evs"><div className="evsl">📖 Journal</div><div className="evtxt">{selEntry.text}</div></div>}
                      </>
                    ):<div style={{color:"var(--ink3)",fontSize:"14px",fontStyle:"italic",textAlign:"center",padding:"20px"}}>Is din koi entry nahi thi 🌿</div>}
                    <div className="evc" onClick={()=>{setSelDay(null);setSelEntry(null);}}>× Band karo</div>
                  </div>
                ):(
                  <div className="card" style={{background:"var(--gl)",border:"1.5px solid var(--gb)"}}>
                    <div className="lbl" style={{color:"var(--gold)"}}>Kisi bhi din pe tap karo 👆</div>
                    <p style={{fontSize:"14px",color:"var(--ink2)",lineHeight:1.75}}>Golden dot wale din mein diary entry hai — tap karo aur woh din phir se jiyo. ✦</p>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════
                HABITS — MONTHLY TRACKER
            ══════════════════════════════════════ */}
            {tab==="habits"&&(
              <div className="ht-wrap fade">
                <div className="ht-header">
                  <div className="ht-month-row">
                    <button className="ht-nav" onClick={()=>{if(htM===0){setHtM(11);setHtY(y=>y-1);}else setHtM(m=>m-1);}}>‹</button>
                    <div className="ht-month">{MONTHS[htM]} {htY}</div>
                    <button className="ht-nav" onClick={()=>{if(htM===11){setHtM(0);setHtY(y=>y+1);}else setHtM(m=>m+1);}}>›</button>
                  </div>

                  {/* Legend */}
                  <div className="ht-legend">
                    <div className="ht-leg-item"><div className="ht-leg-dot" style={{background:"var(--done-bg)",border:"1.5px solid var(--done)",color:"var(--done)"}}>✓</div> Kiya</div>
                    <div className="ht-leg-item"><div className="ht-leg-dot" style={{background:"var(--skip-bg)",border:"1.5px solid var(--skip)",color:"var(--skip)"}}>✗</div> Nahi kiya</div>
                    <div className="ht-leg-item"><div className="ht-leg-dot" style={{background:"var(--paper2)",border:"1.5px solid var(--border)"}}></div> Baaki hai</div>
                  </div>
                </div>

                {/* Scrollable grid */}
                <div className="ht-scroll">
                  <div className="ht-table">
                    {/* Header row: day numbers */}
                    <div className="ht-row">
                      <div className="ht-habit-col" style={{visibility:"hidden"}}>x</div>
                      {Array.from({length:htDays},(_,i)=>i+1).map(d=>{
                        const isToday = isHtCurrentMonth && d===todayDate;
                        return <div key={d} className={`ht-day-head ${isToday?"today-col":""}`}>{d}</div>;
                      })}
                    </div>

                    {/* Habit rows */}
                    {HABITS.map(h=>(
                      <div key={h.id} className="ht-row">
                        <div className="ht-habit-col">
                          <span className="ht-habit-icon">{h.icon}</span>
                          <span className="ht-habit-name">{h.label}</span>
                        </div>
                        {Array.from({length:htDays},(_,i)=>i+1).map(d=>{
                          const dayKey = fmtKey(htY,htM,d);
                          const isFuture = isHtCurrentMonth && d > todayDate;
                          const isToday = isHtCurrentMonth && d===todayDate;
                          const val = habits[`${h.id}|${dayKey}`];
                          return (
                            <div
                              key={d}
                              className={`ht-cell ${val||""} ${isToday?"today-col":""} ${isFuture?"future":""}`}
                              onClick={()=>{ if(!isFuture) toggleHabit(h.id, dayKey); }}
                            >
                              {val==="done"?"✓":val==="skip"?"✗":""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Month stats */}
                <div className="ht-stats">
                  <div className="ht-stat"><div className="ht-stat-n">{monthPct}%</div><div className="ht-stat-l">Month Score</div></div>
                  <div className="ht-stat"><div className="ht-stat-n">{monthDone}</div><div className="ht-stat-l">✓ Done</div></div>
                  <div className="ht-stat"><div className="ht-stat-n">{monthSkip}</div><div className="ht-stat-l">✗ Skipped</div></div>
                  <div className="ht-stat"><div className="ht-stat-n">{streak}🔥</div><div className="ht-stat-l">Streak</div></div>
                </div>

                {/* Graph */}
                <HabitGraph habits={habits} year={htY} month={htM}/>

                {/* Motivation */}
                <div className="ht-quote">
                  <div className="lbl">James Clear kehte hain</div>
                  <p>"You don't rise to the level of your goals. You fall to the level of your systems."</p>
                </div>
              </div>
            )}

            {/* ── GOALS ── */}
            {tab==="goals"&&(
              <div className="pad fade">
                <div className="sec-title">Life Blueprint</div>
                <div className="sec-sub">What · Why · How method</div>
                {goals.map((g,idx)=>(
                  <div key={idx} className="gc">
                    <div className="gtlbl">{g.type} Goal</div>
                    {["what","why","how"].map(f=>(
                      <div key={f} className="gf">
                        <div className="gk">{f.toUpperCase()}</div>
                        <input className="ginp" placeholder={f==="what"?"Mujhe kya achieve karna hai...":f==="why"?"Kyun zaroori hai...":"Kaise karunga..."} value={g[f]} onChange={e=>updGoal(idx,f,e.target.value)}/>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="card" style={{background:"var(--gl)",border:"1.5px solid var(--gb)"}}>
                  <div className="lbl" style={{color:"var(--gold)"}}>Harvard Research</div>
                  <p style={{fontSize:"14px",color:"var(--ink2)",lineHeight:1.75}}>Jo log goals <b style={{color:"var(--gold)"}}>likhte hain</b>, woh <b style={{color:"var(--gold)"}}>42% zyada</b> achieve karte hain.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COACH ── */}
        {tab==="coach"&&(
          <div className="cshell fade" style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div className="chdr">
              <div className="sec-title" style={{marginBottom:"2px"}}>Emotional Coach</div>
              <div className="sec-sub">Dar, anxiety, confusion — sab sunuunga 🙏</div>
              {apiErr&&<div className="errb"><div className="lbl">⚠ API Setup</div><p>{apiErr}</p></div>}
            </div>
            <div className="cmsgs">
              {chat.map((m,i)=>(
                <div key={i} className={`msg ${m.role==="ai"?"ai":"me"}`}>
                  <div className="mwho">{m.role==="ai"?"✦ Coach":"Tum"}</div>
                  <div className="mbub">{m.text}</div>
                </div>
              ))}
              {chatLoad&&<div className="msg ai"><div className="mwho">✦ Coach</div><div className="mbub"><div className="thnk"><div className="da"><span>.</span><span>.</span><span>.</span></div></div></div></div>}
              <div ref={chatEnd}/>
            </div>
            <div className="ciw">
              <div className="crow">
                <textarea ref={chatTa} className="cta" placeholder="Jo feel ho raha hai, yahan likho..." value={chatIn} rows={1}
                  onChange={e=>{setChatIn(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
                  onFocus={()=>setTimeout(()=>chatTa.current?.scrollIntoView({behavior:"smooth",block:"end"}),300)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}}/>
                <button className="csnd" onClick={sendChat} disabled={chatLoad}>→</button>
              </div>
              <div className="qcs">
                {["Mujhe dar lagta hai","Main stressed hoon","Motivate karo","Negative thoughts","Ek aadat todna hai"].map(q=>(
                  <button key={q} className="qc" onClick={()=>{setChatIn(q);chatTa.current?.focus();}}>{q}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NAV */}
        <nav className="nav">
          {[{id:"today",icon:"📖",label:"Today"},{id:"calendar",icon:"📅",label:"Calendar"},{id:"habits",icon:"✅",label:"Habits"},{id:"goals",icon:"🎯",label:"Goals"},{id:"coach",icon:"💬",label:"Coach"}].map(n=>(
            <button key={n.id} className={`nb ${tab===n.id?"on":""}`} onClick={()=>setTab(n.id)}>
              <div className="ni-wrap"><span className="ni">{n.icon}</span></div>{n.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
