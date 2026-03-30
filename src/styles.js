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
.hi-item{display:flex;align-items:center;gap:10px;margin-bottom:10px} .hicon{font-size:18px;flex-shrink:0} .hname{font-size:12px;color:var(--ink2);width:80px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hdots{display:flex;gap:3px}
.hdot{width:23px;height:23px;border-radius:7px;cursor:pointer;border:1.5px solid var(--border);background:var(--paper2);display:flex;align-items:center;justify-content:center;font-size:13px;color:transparent;transition:all .15s;-webkit-tap-highlight-color:transparent}
.hdot.on{background:var(--gl);border-color:var(--gold);color:var(--gold)} .hdot:active{transform:scale(.9)}
.dlbls{display:flex;gap:5px;justify-content:flex-end;margin-bottom:8px} .dlbl{width:23px;text-align:center;font-family:'DM Mono',monospace;font-size:8px;color:var(--ink3)}
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
export default S;
