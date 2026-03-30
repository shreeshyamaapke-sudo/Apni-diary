import { useState, useEffect, useRef, useCallback } from "react";
import S from "./styles.js";
import { QUOTES, MOODS, HABITS, MONTHS, WEEK_DAYS, QUICK_PROMPTS } from "./constants.js";
import { getTodayKey, getWeek7, fmtDateKey, readableDate, todayFull, getDayQuote, sGet, sSet, askAI } from "./utils.js";

const KEY = import.meta.env.VITE_GROQ_KEY || "";

export default function App() {
  const TODAYKEY = getTodayKey();
  const week7 = getWeek7();
  const quote = getDayQuote(QUOTES);
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

  useEffect(() => {
    (async () => {
      const data = await sGet("entries") || {};
      setEntries(data);
      const today = data[TODAYKEY];
      if (today) { setMood(today.mood||""); setGrats(today.grats||["","",""]); setHl(today.hl||""); setJText(today.jText||""); setSaved(true); }
      const habitData = await sGet("habits") || {};
      setHabits(habitData);
      const goalData = await sGet("goals");
      if (goalData) setGoals(goalData);
      let s = 0; const d = new Date();
      while (true) { const k = d.toISOString().split("T")[0]; if (data[k]) { s++; d.setDate(d.getDate()-1); } else break; }
      setStreak(s);
    })();
  }, []);

  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [chat]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  async function saveToday() {
    const data = await sGet("entries") || {};
    data[TODAYKEY] = { mood, grats, hl, jText, savedAt: Date.now() };
    await sSet("entries", data); setEntries({...data}); setSaved(true);
    let s = 0; const d = new Date();
    while (true) { const k = d.toISOString().split("T")[0]; if (data[k]) { s++; d.setDate(d.getDate()-1); } else break; }
    setStreak(s); showToast("✓ Aaj ki diary save ho gayi!");
  }

  async function getPrompt() {
    setAiLoad(true); setAiPrompt(""); setApiErr("");
    try {
      const ctx = `Mood: ${mood||"not set"}, Highlight: ${hl||"none"}, Journal: ${jText.slice(0,200)||"none"}`;
      const p = await askAI(KEY,[{role:"user",content:`Based on this diary context, give me ONE deep reflective journaling prompt in Hinglish. Short and meaningful. Context: ${ctx}`}],"You are a thoughtful journaling coach. Give exactly one short prompt. No preamble.");
      setAiPrompt(p);
    } catch(e) { setApiErr(e.message); }
    setAiLoad(false);
  }

  async function getInsight() {
    setInsLoad(true); setInsight(""); setApiErr("");
    try {
      const ctx = `Mood: ${mood||"not set"}\nGratitude: ${grats.filter(Boolean).join(", ")||"none"}\nHighlight: ${hl||"none"}\nJournal: ${jText||"none"}`;
      const ins = await askAI(KEY,[{role:"user",content:`Give me a warm personal insight about my day in Hinglish. Be empathetic. Context:\n${ctx}`}],"You are a warm diary coach. Give a concise insight in 3-4 sentences in Hinglish.");
      setInsight(ins);
    } catch(e) { setApiErr(e.message); }
    setInsLoad(false);
  }

  async function toggleHabit(id, dateKey) {
    const k = `${id}__${dateKey}`; const next = {...habits,[k]:!habits[k]};
    setHabits(next); await sSet("habits", next);
  }

  async function saveGoals() { await sSet("goals", goals); showToast("Goals save ho gaye! 🎯"); }

  async function sendChat() {
    const txt = chatIn.trim(); if (!txt||chatLoad) return;
    setChatIn(""); const newChat = [...chat,{role:"me",text:txt}]; setChat(newChat); setChatLoad(true);
    try {
      const msgs = newChat.map(m => ({role:m.role==="me"?"user":"assistant",content:m.text}));
      const reply = await askAI(KEY, msgs, "You are Apni Diary's empathetic Hinglish life coach. Be warm, supportive, concise and conversational.");
      setChat(c => [...c,{role:"ai",text:reply}]);
    } catch(e) { setApiErr(e.message); setChat(c => [...c,{role:"ai",text:`Error: ${e.message}`}]); }
    setChatLoad(false);
  }

  function handleChatKey(e) { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendChat(); } }

  const calDays = useCallback(() => {
    const first = new Date(calYear,calMonth,1).getDay();
    return {offset:first===0?6:first-1, total:new Date(calYear,calMonth+1,0).getDate()};
  }, [calYear,calMonth]);

  function prevMonth() { if (calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); setSelDay(null); }
  function nextMonth() { if (calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); setSelDay(null); }

  const {offset,total} = calDays();
  const selKey = selDay ? fmtDateKey(calYear,calMonth,selDay) : null;
  const selEntry = selKey ? entries[selKey] : null;

  return (
    <>
      <style>{S}</style>
      {toast && <div className="toast">{toast}</div>}
      <div className="app">
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

        <div className="body">
          {tab==="today" && (
            <div className="pad fade">
              <div className="qcard">
                <span className="qmark">"</span>
                <div className="qtxt">{quote.text}</div>
                <div className="qauthor">{quote.author}</div>
              </div>
              <div className="card hi">
                <div className="lbl">Aaj ka mood</div>
                <div className="mgrid">
                  {MOODS.map(m => (
                    <button key={m.label} className={`mbtn${mood===m.label?" sel":""}`} onClick={()=>setMood(m.label)}>
                      <span className="memoji">{m.emoji}</span><span className="mlbl">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="lbl">3 cheezein jinke liye shukriya</div>
                {grats.map((g,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center"}}>
                    <span className="gnum">{i+1}.</span>
                    <input className="gi" placeholder={["Aaj ek choti khushi...","Koi insaan jisne help ki...","Apne andar jo achha dekha..."][i]} value={g} onChange={e=>{const n=[...grats];n[i]=e.target.value;setGrats(n);}}/>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="lbl">Aaj ka highlight</div>
                <input className="gi" placeholder="Aaj ka sabse yaadgaar pal..." value={hl} onChange={e=>setHl(e.target.value)}/>
              </div>
              <div className="card">
                <div className="lbl">Dil ki baat</div>
                <textarea className="jta" rows={6} placeholder="Jo mann mein hai, yahan likh do..." value={jText} onChange={e=>setJText(e.target.value)}/>
                <div className="btn-row">
                  <button className="btn-gold" onClick={saveToday}>📖 Save</button>
                  {KEY && <button className="btn-ghost" onClick={getPrompt} disabled={aiLoad}>{aiLoad?"Soch raha hoon...":"✨ Prompt"}</button>}
                  {KEY && <button className="btn-ghost" onClick={getInsight} disabled={insLoad}>{insLoad?"...":"💡 Insight"}</button>}
                </div>
                {saved && <span className="sbadge">✓ Saved</span>}
              </div>
              {aiPrompt && <div className="tprompt fade"><div className="lbl">✨ Aaj ka prompt</div><div className="tptxt">{aiPrompt}</div></div>}
              {insight && <div className="ins fade"><div className="lbl">💡 Insight</div><p>{insight}</p></div>}
              {apiErr && <div className="errb fade"><div className="lbl">Error</div><p>{apiErr==="NO_KEY"?"VITE_GEMINI_KEY set karo Vercel mein":apiErr}</p></div>}
            </div>
          )}

          {tab==="habits" && (
            <div className="pad fade">
              <div className="sec-title">Aadatein</div>
              <div className="sec-sub">Chhoti aadatein, bada asar</div>
              <div className="srow">
                <div className="sb"><div className="sn">{streak}</div><div className="sl">Day Streak</div></div>
                <div className="sb"><div className="sn">{Object.keys(entries).length}</div><div className="sl">Total Days</div></div>
                <div className="sb"><div className="sn">{HABITS.filter(h=>habits[`${h.id}__${TODAYKEY}`]).length}/{HABITS.length}</div><div className="sl">Today</div></div>
              </div>
              <div className="card">
                <div className="dlbls">
                  {week7.map(k=>{const di=new Date(k+"T12:00:00").getDay();return <div key={k} className="dlbl">{WEEK_DAYS[di===0?6:di-1]}</div>;})}
                </div>
                {HABITS.map(h => (
                  <div key={h.id} className="hi-item">
                    <span className="hicon">{h.icon}</span>
                    <span className="hname">{h.label}</span>
                    <div className="hdots">
                      {week7.map(dk=><button key={dk} className={`hdot${habits[`${h.id}__${dk}`]?" on":""}`} onClick={()=>toggleHabit(h.id,dk)}>✓</button>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="calendar" && (
            <div className="calw fade">
              <div className="calhdr">
                <button className="calnv" onClick={prevMonth}>‹</button>
                <div className="calmth">{MONTHS[calMonth]} {calYear}</div>
                <button className="calnv" onClick={nextMonth}>›</button>
              </div>
              <div className="cgrid">
                {WEEK_DAYS.map(d=><div key={d} className="cdn">{d}</div>)}
                {Array(offset).fill(null).map((_,i)=><div key={"e"+i}/>)}
                {Array(total).fill(null).map((_,i)=>{
                  const day=i+1,key=fmtDateKey(calYear,calMonth,day),hasEntry=!!entries[key],isToday=key===TODAYKEY,isSel=selDay===day;
                  return <button key={day} className={`cc${hasEntry?" he":""}${isToday?" td":""}${isSel?" sel":""}`} onClick={()=>setSelDay(isSel?null:day)}>{day}{hasEntry&&!isToday&&<span className="edot"/>}</button>;
                })}
              </div>
              {selDay && (
                <div className="ev fade">
                  <div className="evdate">{readableDate(selKey)}</div>
                  {selEntry ? (<>
                    {selEntry.mood&&<div className="evmood">{MOODS.find(m=>m.label===selEntry.mood)?.emoji} {selEntry.mood}</div>}
                    {selEntry.grats?.some(Boolean)&&<div className="evs"><div className="evsl">Gratitude</div>{selEntry.grats.filter(Boolean).map((g,i)=><div key={i} className="evg">• {g}</div>)}</div>}
                    {selEntry.hl&&<div className="evs"><div className="evsl">Highlight</div><div className="evtxt">{selEntry.hl}</div></div>}
                    {selEntry.jText&&<div className="evs"><div className="evsl">Journal</div><div className="evtxt">{selEntry.jText}</div></div>}
                  </>):<div style={{color:"var(--ink3)",fontStyle:"italic",fontSize:14}}>Is din koi entry nahi hai.</div>}
                  <span className="evc" onClick={()=>setSelDay(null)}>✕ Band Karo</span>
                </div>
              )}
            </div>
          )}

          {tab==="goals" && (
            <div className="pad fade">
              <div className="sec-title">Mere Sapne</div>
              <div className="sec-sub">Apne goals ko likho — woh sach hote hain</div>
              {goals.map((g,i)=>(
                <div key={i} className="gc">
                  <div className="gtlbl">{g.type}</div>
                  <div className="gf"><span className="gk">Kya</span><input className="ginp" placeholder="Goal kya hai?" value={g.what} onChange={e=>{const n=[...goals];n[i]={...n[i],what:e.target.value};setGoals(n);}}/></div>
                  <div className="gf"><span className="gk">Kyun</span><input className="ginp" placeholder="Yeh kyun zaroori hai?" value={g.why} onChange={e=>{const n=[...goals];n[i]={...n[i],why:e.target.value};setGoals(n);}}/></div>
                  <div className="gf"><span className="gk">Kaise</span><input className="ginp" placeholder="Pehla kadam kya hoga?" value={g.how} onChange={e=>{const n=[...goals];n[i]={...n[i],how:e.target.value};setGoals(n);}}/></div>
                </div>
              ))}
              <button className="btn-gold" onClick={saveGoals}>💾 Goals Save Karo</button>
            </div>
          )}

          {tab==="chat" && (
            <div className="cshell fade">
              <div className="chdr">
                <div className="sec-title">Baat Karo</div>
                <div className="sec-sub" style={{marginBottom:0}}>Apna dil kholo — main yahan hoon</div>
              </div>
              <div className="cmsgs" ref={msgsRef}>
                {chat.map((m,i)=>(
                  <div key={i} className={`msg ${m.role}`}>
                    <div className="mwho">{m.role==="ai"?"Diary Coach":"Tum"}</div>
                    <div className="mbub">{m.text}</div>
                  </div>
                ))}
                {chatLoad&&<div className="msg ai"><div className="mwho">Diary Coach</div><div className="mbub da"><span>•</span><span>•</span><span>•</span></div></div>}
              </div>
              <div className="ciw">
                {chat.length<=1&&<div className="qcs">{QUICK_PROMPTS.map(q=><button key={q} className="qc" onClick={()=>setChatIn(q)}>{q}</button>)}</div>}
                {!KEY&&<div className="errb" style={{marginBottom:8}}><div className="lbl">API Key Needed</div><p>Add <code>VITE_GEMINI_KEY</code> to Vercel Environment Variables.</p></div>}
                <div className="crow">
                  <textarea className="cta" rows={1} placeholder="Yahan likho..." value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={handleChatKey}/>
                  <button className="csnd" onClick={sendChat} disabled={!chatIn.trim()||chatLoad||!KEY}>➤</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="nav">
          {[{id:"today",icon:"📖",label:"Aaj"},{id:"habits",icon:"🌱",label:"Aadatein"},{id:"calendar",icon:"📅",label:"Calendar"},{id:"goals",icon:"🎯",label:"Goals"},{id:"chat",icon:"💬",label:"Baat Karo"}].map(n=>(
            <button key={n.id} className={`nb${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
              <div className="ni-wrap"><span className="ni">{n.icon}</span></div>{n.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
                                                                           }
