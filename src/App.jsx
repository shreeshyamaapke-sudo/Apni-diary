import { useState, useEffect, useRef, useCallback } from "react";

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
  { emoji: "😰", label: "Anxious" }, { emoji: "🔥", label: "Excited" },
];
const HABITS = [
  { id: "morning", label: "Subah ki routine", icon: "🌅" },
  { id: "exercise", label: "Exercise / Yoga", icon: "🧘" },
  { id: "read", label: "Padhna / Seekhna", icon: "📚" },
  { id: "water", label: "8 glass paani", icon: "💧" },
  { id: "gratitude", label: "Gratitude", icon: "🙏" },
  { id: "noscreen", label: "Sone se pehle no screen", icon: "📵" },
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
    headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d.content?.find(b => b.type === "text")?.text || "";
}

const S = `
:root { --paper:#faf6ef; --paper2:#f4ede0; --ink:#1e140a; --ink2:#4a3520; --ink3:#8a7055; --gold:#b8730a; --gold2:#d4920e; --gl:#fef3d0; --gb:#e8c870; --sage:#4a7a5a; --card:#fffdf8; --border:#e0d4bc; --sh:0 2px 16px rgba(80,50,10,0.07); }
*{box-sizing:border-box;margin:0;padding:0} html{height:100%;background:var(--paper)} body{height:100%;font-family:'Lora',Georgia,serif} #root{height:100%}
.app{display:flex;flex-direction:column;height:100dvh;max-width:430px;margin:0 auto;background:var(--paper);color:var(--ink);overflow:hidden;position:relative}
.app::before{content:'';position:fixed;inset:0;max-width:430px;margin:0 auto;background-image:repeating-linear-gradient(transparent,transparent 31px,rgba(180,140,80,0.07) 31px,rgba(180,140,80,0.07) 32px);pointer-events:none;z-index:0}
.hdr{flex-shrink:0;z-index:10;background:linear-gradient(180deg,#fffdf8 0%,rgba(255,253,248,0.95) 100%);border-bottom:1px solid var(--border);padding:14px 18px 12px;position:relative}
.hdr-row{display:flex;align-items:center;justify-content:space-between}
.hdr-date{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase;margin-bottom:3px}
.hdr-title{font-family:'Playfair Display',serif;font-size:22px;font-style:italic;font-weight:400;color:var(--ink)}
.hdr-title span{color:var(--gold)}
.streak-pill{display:flex;flex-direction:column;align-items:center;background:var(--gl);border:1.5px solid var(--gb);border-radius:12px;padding:6px 12px}
.streak-fire{font-size:20px;line-height:1} .streak-num{font-family:'DM Mono',monospace;font-size:11px;color:var(--gold);font-weight:500} .streak-lbl{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3);letter-spacing:1px;text-transform:uppercase}
.body{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;position:relative;z-index:1}
.nav{flex-shrink:0;z-index:10;background:rgba(255,253,248,0.97);backdrop-filter:blur(20px);border-top:1px solid var(--border);display:flex;justify-content:space-around;align-items:stretch;padding:6px 0 max(14px,env(safe-area-inset-bottom))}
.nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink3);padding:6px 4px;border-radius:10px;transition:all .2s;-webkit-tap-highlight-color:transparent}
.nb.on{color:var(--gold)} .nb.on .ni-wrap{background:var(--gl);border-color:var(--gb)}
.ni-wrap{width:40px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1.5px solid transparent;transition:all .2s;margin-bottom:1px} .ni{font-size:18px}
.pad{padding:16px 16px 28px}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:13px;box-shadow:var(--sh);position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--gold2),transparent);opacity:0;transition:opacity .3s}
.card.hi::before{opacity:1}
.lbl{font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:10px}
.sec-title{font-family:'Playfair Display',serif;font-size:20px;font-style:italic;color:var(--ink);margin-bottom:2px} .sec-sub{font-size:12px;color:var(--ink3);margin-bottom:16px;font-style:italic}
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
.btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold2));color:white;border:none;border-radius:12px;padding:13px 20px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1.5px;cursor:pointer;transition:all .2s;text-transform:uppercase;-webkit-tap-highlight-color:transparent;display:inline-flex;align-items:center;gap:8px}
.btn-gold:active{transform:scale(.98)} .btn-gold:disabled{opacity:.5}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--ink2);border-radius:12px;padding:12px 18px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all .2s;-webkit-tap-highlight-color:transparent}
.btn-ghost:active{background:var(--gl);border-color:var(--gb);color:var(--gold)} .btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.sbadge{display:inline-flex;align-items:center;gap:6px;background:#e8f5ea;border:1px solid #a8d8b0;border-radius:8px;padding:5px 11px;font-family:'DM Mono',monospace;font-size:10px;color:var(--sage);margin-top:10px;animation:popIn .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes popIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.srow{display:flex;gap:10px;margin-bottom:14px}
.sb{flex:1;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 10px;text-align:center;box-shadow:var(--sh)}
.sn{font-family:'Playfair Display',serif;font-size:28px;color:var(--gold);line-height:1} .sl{font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3);letter-spacing:1px;margin-top:4px;text-transform:uppercase}
.hi-item{display:flex;align-items:center;gap:10px;margin-bottom:10px} .hicon{font-size:18px;flex-shrink:0} .hname{font-size:14px;color:var(--ink2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hdots{display:flex;gap:5px}
.hdot{width:28px;height:28px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);background:var(--paper2);display:flex;align-items:center;justify-content:center;font-size:13px;color:transparent;transition:all .15s;-webkit-tap-highlight-color:transparent}
.hdot.on{background:var(--gl);border-color:var(--gold);color:var(--gold)} .hdot:active{transform:scale(.9)}
.dlbls{display:flex;gap:5px;justify-content:flex-end;margin-bottom:8px} .dlbl{width:28px;text-align:center;font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3)}
.gc{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:13px;box-shadow:var(--sh)}
.gtlbl{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase;margin-bottom:14px}
.gf{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
.gk{font-family:'DM Mono',monospace;font-size:9px;color:var(--gold);letter-spacing:1px;text-transform:uppercase;padding-top:10px;min-width:28px}
.ginp{flex:1;background:var(--paper2);border:1.5px solid var(--border);border-radius:10px;padding:9px 13px;color:var(--ink);font-family:'Lora',serif;font-size:14px;outline:none;transition:all .2s;line-height:1.5;-webkit-appearance:none}
.ginp:focus{border-color:var(--gb);background:white} .ginp::placeholder{color:var(--ink3);font-style:italic}
.calw{padding:14px 16px 28px}
.calhdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.calmth{font-family:'Playfair Display',serif;font-size:20px;font-style:italic;color:var(--ink)}
.calnv{background:var(--paper2);border:1.5px solid var(--border);border-radius:9px;width:34px;height:34px;cursor:pointer;font-size:18px;color:var(--ink2);display:flex;align-items:center;justify-content:center;transition:all .2s;-webkit-tap-highlight-color:transparent}
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

export default function App() {
  const TODAYKEY = getTodayKey();
  const week7 = getWeek7();
  const quote = getDayQuote();
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
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selDay, setSelDay] = useState(null);
  const [entries, setEntries] = useState({});
  const [toast, setToast] = useState("");
  const msgsRef = useRef(null);

  // Load saved data on mount
  useEffect(() => {
    (async () => {
      const data = await sGet("entries") || {};
      setEntries(data);
      const today = data[TODAYKEY];
      if (today) {
        setMood(today.mood || "");
        setGrats(today.grats || ["","",""]);
        setHl(today.hl || "");
        setJText(today.jText || "");
        setSaved(true);
      }
      const habitData = await sGet("habits") || {};
      setHabits(habitData);
      const goalData = await sGet("goals");
      if (goalData) setGoals(goalData);
      // Calculate streak
      let s = 0;
      const d = new Date();
      while (true) {
        const k = d.toISOString().split("T")[0];
        if (data[k]) { s++; d.setDate(d.getDate() - 1); } else break;
      }
      setStreak(s);
    })();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [chat]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function saveToday() {
    const data = await sGet("entries") || {};
    data[TODAYKEY] = { mood, grats, hl, jText, savedAt: Date.now() };
    await sSet("entries", data);
    setEntries({ ...data });
    setSaved(true);
    let s = 0;
    const d = new Date();
    while (true) {
      const k = d.toISOString().split("T")[0];
      if (data[k]) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    setStreak(s);
    showToast("✓ Aaj ki diary save ho gayi!");
  }

  async function getPrompt() {
    setAiLoad(true);
    setAiPrompt("");
    setApiErr("");
    try {
      const context = `Mood: ${mood || "not set"}, Highlight: ${hl || "none"}, Journal: ${jText.slice(0, 200) || "none"}`;
      const p = await askClaude(
        [{ role: "user", content: `Based on this diary context, give me ONE deep reflective journaling prompt in Hinglish (mix of Hindi and English). Keep it short and meaningful. Context: ${context}` }],
        "You are a thoughtful journaling coach. Give exactly one short, meaningful prompt. No preamble, no numbering."
      );
      setAiPrompt(p);
    } catch (e) {
      setApiErr(e.message);
    }
    setAiLoad(false);
  }

  async function getInsight() {
    setInsLoad(true);
    setInsight("");
    setApiErr("");
    try {
      const context = `Mood: ${mood || "not set"}\nGratitude: ${grats.filter(Boolean).join(", ") || "none"}\nHighlight: ${hl || "none"}\nJournal: ${jText || "none"}`;
      const ins = await askClaude(
        [{ role: "user", content: `Give me a warm, personal insight about my day in Hinglish. Be empathetic and supportive. Context:\n${context}` }],
        "You are a warm personal diary coach. Give a concise, meaningful insight in 3-4 sentences in Hinglish."
      );
      setInsight(ins);
    } catch (e) {
      setApiErr(e.message);
    }
    setInsLoad(false);
  }

  async function toggleHabit(id, dateKey) {
    const key = `${id}__${dateKey}`;
    const next = { ...habits, [key]: !habits[key] };
    setHabits(next);
    await sSet("habits", next);
  }

  async function saveGoals() {
    await sSet("goals", goals);
    showToast("Goals save ho gaye! 🎯");
  }

  async function sendChat() {
    const txt = chatIn.trim();
    if (!txt || chatLoad) return;
    setChatIn("");
    const newChat = [...chat, { role: "me", text: txt }];
    setChat(newChat);
    setChatLoad(true);
    try {
      const msgs = newChat.map(m => ({
        role: m.role === "me" ? "user" : "assistant",
        content: m.text,
      }));
      const reply = await askClaude(
        msgs,
        "You are Apni Diary's empathetic Hinglish life coach. Be warm, supportive, and insightful. Keep responses concise and conversational. Use a mix of Hindi and English naturally."
      );
      setChat(c => [...c, { role: "ai", text: reply }]);
    } catch (e) {
      setApiErr(e.message);
      setChat(c => [...c, { role: "ai", text: "Kuch error aayi. Thodi der baad try karo 🙏" }]);
    }
    setChatLoad(false);
  }

  function handleChatKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  }

  const calDays = useCallback(() => {
    const first = new Date(calYear, calMonth, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    return { offset, total };
  }, [calYear, calMonth]);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelDay(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelDay(null);
  }

  const { offset, total } = calDays();
  const selKey = selDay ? fmtDateKey(calYear, calMonth, selDay) : null;
  const selEntry = selKey ? entries[selKey] : null;

  const QUICK_PROMPTS = [
    "Aaj sabse bada challenge kya tha?",
    "Kya cheez mujhe aaj khush karti hai?",
    "Kal ke liye ek intention?",
    "Aaj kya seekha maine?",
  ];

  return (
    <>
      <style>{S}</style>
      {toast && <div className="toast">{toast}</div>}
      <div className="app">

        {/* Header */}
        <div className="hdr">
          <div className="hdr-row">
            <div>
              <div className="hdr-date">{todayFull()}</div>
              <div className="hdr-title">Apni <span>Diary</span></div>
            </div>
            <div className="streak-pill">
              <div className="streak-fire">🔥</div>
              <div className="streak-num">{streak}</div>
              <div className="streak-lbl">Streak</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="body">

          {/* ── TODAY TAB ── */}
          {tab === "today" && (
            <div className="pad fade">
              {/* Daily Quote */}
              <div className="qcard">
                <span className="qmark">"</span>
                <div className="qtxt">{quote.text}</div>
                <div className="qauthor">{quote.author}</div>
              </div>

              {/* Mood */}
              <div className="card hi">
                <div className="lbl">Aaj ka mood</div>
                <div className="mgrid">
                  {MOODS.map(m => (
                    <button key={m.label} className={`mbtn${mood === m.label ? " sel" : ""}`} onClick={() => setMood(m.label)}>
                      <span className="memoji">{m.emoji}</span>
                      <span className="mlbl">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gratitude */}
              <div className="card">
                <div className="lbl">3 cheezein jinke liye shukriya</div>
                {grats.map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <span className="gnum">{i + 1}.</span>
                    <input
                      className="gi"
                      placeholder={["Aaj ek choti khushi...", "Koi insaan jisne help ki...", "Apne andar jo achha dekha..."][i]}
                      value={g}
                      onChange={e => { const n = [...grats]; n[i] = e.target.value; setGrats(n); }}
                    />
                  </div>
                ))}
              </div>

              {/* Highlight */}
              <div className="card">
                <div className="lbl">Aaj ka highlight</div>
                <input className="gi" placeholder="Aaj ka sabse yaadgaar pal..." value={hl} onChange={e => setHl(e.target.value)} />
              </div>

              {/* Journal */}
              <div className="card">
                <div className="lbl">Dil ki baat</div>
                <textarea
                  className="jta"
                  rows={6}
                  placeholder="Jo mann mein hai, yahan likh do..."
                  value={jText}
                  onChange={e => setJText(e.target.value)}
                />
                <div className="btn-row">
                  <button className="btn-gold" onClick={saveToday}>📖 Save</button>
                  {KEY && (
                    <button className="btn-ghost" onClick={getPrompt} disabled={aiLoad}>
                      {aiLoad ? "Soch raha hoon..." : "✨ Prompt"}
                    </button>
                  )}
                  {KEY && (
                    <button className="btn-ghost" onClick={getInsight} disabled={insLoad}>
                      {insLoad ? "..." : "💡 Insight"}
                    </button>
                  )}
                </div>
                {saved && <span className="sbadge">✓ Saved</span>}
              </div>

              {/* AI Prompt */}
              {aiPrompt && (
                <div className="tprompt fade">
                  <div className="lbl">✨ Aaj ka prompt</div>
                  <div className="tptxt">{aiPrompt}</div>
                </div>
              )}

              {/* Insight */}
              {insight && (
                <div className="ins fade">
                  <div className="lbl">💡 Insight</div>
                  <p>{insight}</p>
                </div>
              )}

              {/* API Errors */}
              {apiErr && apiErr === "NO_KEY" && (
                <div className="errb fade">
                  <div className="lbl">API Key Missing</div>
                  <p>Please set <code>VITE_ANTHROPIC_KEY</code> in your <code>.env</code> file to enable AI features.</p>
                </div>
              )}
              {apiErr && apiErr !== "NO_KEY" && (
                <div className="errb fade">
                  <div className="lbl">Error</div>
                  <p>{apiErr}</p>
                </div>
              )}
            </div>
          )}

          {/* ── HABITS TAB ── */}
          {tab === "habits" && (
            <div className="pad fade">
              <div className="sec-title">Aadatein</div>
              <div className="sec-sub">Chhoti aadatein, bada asar</div>

              <div className="srow">
                <div className="sb">
                  <div className="sn">{streak}</div>
                  <div className="sl">Day Streak</div>
                </div>
                <div className="sb">
                  <div className="sn">{Object.keys(entries).length}</div>
                  <div className="sl">Total Days</div>
                </div>
                <div className="sb">
                  <div className="sn">{HABITS.filter(h => habits[`${h.id}__${TODAYKEY}`]).length}/{HABITS.length}</div>
                  <div className="sl">Today</div>
                </div>
              </div>

              <div className="card">
                <div className="dlbls">
                  {week7.map(k => {
                    const dayIdx = new Date(k + "T12:00:00").getDay();
                    return <div key={k} className="dlbl">{WEEK_DAYS[dayIdx === 0 ? 6 : dayIdx - 1]}</div>;
                  })}
                </div>
                {HABITS.map(h => (
                  <div key={h.id} className="hi-item">
                    <span className="hicon">{h.icon}</span>
                    <span className="hname">{h.label}</span>
                    <div className="hdots">
                      {week7.map(dk => (
                        <button
                          key={dk}
                          className={`hdot${habits[`${h.id}__${dk}`] ? " on" : ""}`}
                          onClick={() => toggleHabit(h.id, dk)}
                        >✓</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CALENDAR TAB ── */}
          {tab === "calendar" && (
            <div className="calw fade">
              <div className="calhdr">
                <button className="calnv" onClick={prevMonth}>‹</button>
                <div className="calmth">{MONTHS[calMonth]} {calYear}</div>
                <button className="calnv" onClick={nextMonth}>›</button>
              </div>
              <div className="cgrid">
                {WEEK_DAYS.map(d => <div key={d} className="cdn">{d}</div>)}
                {Array(offset).fill(null).map((_, i) => <div key={"empty" + i} />)}
                {Array(total).fill(null).map((_, i) => {
                  const day = i + 1;
                  const key = fmtDateKey(calYear, calMonth, day);
                  const hasEntry = !!entries[key];
                  const isToday = key === TODAYKEY;
                  const isSel = selDay === day;
                  return (
                    <button
                      key={day}
                      className={`cc${hasEntry ? " he" : ""}${isToday ? " td" : ""}${isSel ? " sel" : ""}`}
                      onClick={() => setSelDay(isSel ? null : day)}
                    >
                      {day}
                      {hasEntry && !isToday && <span className="edot" />}
                    </button>
                  );
                })}
              </div>

              {selDay && (
                <div className="ev fade">
                  <div className="evdate">{readableDate(selKey)}</div>
                  {selEntry ? (
                    <>
                      {selEntry.mood && (
                        <div className="evmood">
                          {MOODS.find(m => m.label === selEntry.mood)?.emoji} {selEntry.mood}
                        </div>
                      )}
                      {selEntry.grats?.some(Boolean) && (
                        <div className="evs">
                          <div className="evsl">Gratitude</div>
                          {selEntry.grats.filter(Boolean).map((g, i) => (
                            <div key={i} className="evg">• {g}</div>
                          ))}
                        </div>
                      )}
                      {selEntry.hl && (
                        <div className="evs">
                          <div className="evsl">Highlight</div>
                          <div className="evtxt">{selEntry.hl}</div>
                        </div>
                      )}
                      {selEntry.jText && (
                        <div className="evs">
                          <div className="evsl">Journal</div>
                          <div className="evtxt">{selEntry.jText}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: "var(--ink3)", fontStyle: "italic", fontSize: 14 }}>
                      Is din koi entry nahi hai.
                    </div>
                  )}
                  <span className="evc" onClick={() => setSelDay(null)}>✕ Band Karo</span>
                </div>
              )}
            </div>
          )}

          {/* ── GOALS TAB ── */}
          {tab === "goals" && (
            <div className="pad fade">
              <div className="sec-title">Mere Sapne</div>
              <div className="sec-sub">Apne goals ko likho — woh sach hote hain</div>
              {goals.map((g, i) => (
                <div key={i} className="gc">
                  <div className="gtlbl">{g.type}</div>
                  <div className="gf">
                    <span className="gk">Kya</span>
                    <input
                      className="ginp"
                      placeholder="Goal kya hai?"
                      value={g.what}
                      onChange={e => { const n = [...goals]; n[i] = { ...n[i], what: e.target.value }; setGoals(n); }}
                    />
                  </div>
                  <div className="gf">
                    <span className="gk">Kyun</span>
                    <input
                      className="ginp"
                      placeholder="Yeh kyun zaroori hai?"
                      value={g.why}
                      onChange={e => { const n = [...goals]; n[i] = { ...n[i], why: e.target.value }; setGoals(n); }}
                    />
                  </div>
                  <div className="gf">
                    <span className="gk">Kaise</span>
                    <input
                      className="ginp"
                      placeholder="Pehla kadam kya hoga?"
                      value={g.how}
                      onChange={e => { const n = [...goals]; n[i] = { ...n[i], how: e.target.value }; setGoals(n); }}
                    />
                  </div>
                </div>
              ))}
              <button className="btn-gold" onClick={saveGoals}>💾 Goals Save Karo</button>
            </div>
          )}

          {/* ── CHAT TAB ── */}
          {tab === "chat" && (
            <div className="cshell fade">
              <div className="chdr">
                <div className="sec-title">Baat Karo</div>
                <div className="sec-sub" style={{ marginBottom: 0 }}>Apna dil kholo — main yahan hoon</div>
              </div>
              <div className="cmsgs" ref={msgsRef}>
                {chat.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    <div className="mwho">{m.role === "ai" ? "Diary Coach" : "Tum"}</div>
                    <div className="mbub">{m.text}</div>
                  </div>
                ))}
                {chatLoad && (
                  <div className="msg ai">
                    <div className="mwho">Diary Coach</div>
                    <div className="mbub da"><span>•</span><span>•</span><span>•</span></div>
                  </div>
                )}
              </div>
              <div className="ciw">
                {chat.length <= 1 && (
                  <div className="qcs">
                    {QUICK_PROMPTS.map(q => (
                      <button key={q} className="qc" onClick={() => setChatIn(q)}>{q}</button>
                    ))}
                  </div>
                )}
                {!KEY && (
                  <div className="errb" style={{ marginBottom: 8 }}>
                    <div className="lbl">API Key Needed</div>
                    <p>Add <code>VITE_ANTHROPIC_KEY</code> to your <code>.env</code> to enable chat.</p>
                  </div>
                )}
                <div className="crow">
                  <textarea
                    className="cta"
                    rows={1}
                    placeholder="Yahan likho..."
                    value={chatIn}
                    onChange={e => setChatIn(e.target.value)}
                    onKeyDown={handleChatKey}
                  />
                  <button className="csnd" onClick={sendChat} disabled={!chatIn.trim() || chatLoad || !KEY}>➤</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Nav */}
        <nav className="nav">
          {[
            { id: "today",    icon: "📖", label: "Aaj" },
            { id: "habits",   icon: "🌱", label: "Aadatein" },
            { id: "calendar", icon: "📅", label: "Calendar" },
            { id: "goals",    icon: "🎯", label: "Goals" },
            { id: "chat",     icon: "💬", label: "Baat Karo" },
          ].map(n => (
            <button key={n.id} className={`nb${tab === n.id ? " on" : ""}`} onClick={() => setTab(n.id)}>
              <div className="ni-wrap"><span className="ni">{n.icon}</span></div>
              {n.label}
            </button>
          ))}
        </nav>

      </div>
    </>
  );
}
