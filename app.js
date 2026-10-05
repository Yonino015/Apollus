
function localEvents(){
  try { return JSON.parse(localStorage.getItem("apollus_events") || "[]"); }
  catch { return []; }
}
function saveLocalEvent(e){
  const all=localEvents(); all.push(e);
  localStorage.setItem("apollus_events", JSON.stringify(all.slice(-100)));
}


let events=[];
let selected=null;
let sessionId=null;

const API_BASE = (window.APOLLUS_API_BASE || "").replace(/\/$/,"");

async function api(url,opts={}){
  const target = API_BASE + url;
  try{
    const r=await fetch(target,{headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});
    if(!r.ok) throw new Error("HTTP "+r.status);
    return await r.json();
  }catch(err){
    // GitHub Pages can still show the UI and demo mode when no backend is configured.
    if(url === "/api/status") return {ok:true,version:"0.9",platform:"GitHub Pages",mistralConfigured:false,events:0,chats:0,localOnly:true};
    if(url === "/api/events") return JSON.parse(localStorage.getItem("apollus_events") || "[]").reverse();
    if(url === "/api/processes") return [];
    if(url === "/api/files") return [];
    throw err;
  }
}

async function init(){
  const s=await api("/api/status");
  document.getElementById("status").textContent=s.mistralConfigured?"● Mistral connected":"● Local mode";
  await loadEvents();
}

async function loadEvents(){
  events=await api("/api/events");
  const box=document.getElementById("events");
  if(!events.length){
    box.innerHTML=`<div class="empty"><p>Inga händelser ännu.</p><button onclick="createDemo()">Create demo event</button></div>`;
    return;
  }
  box.innerHTML=events.map(e=>`
    <div class="event ${selected?.id===e.id?"active":""}" onclick="selectEvent('${e.id}')">
      <span class="sev ${e.severity||"low"}">${e.severity||"low"}</span>
      <strong>${escapeHtml(e.title)}</strong>
      <span>${new Date(e.timestamp).toLocaleString()}</span>
    </div>`).join("");
}

async function selectEvent(id){
  selected=events.find(e=>e.id===id);
  sessionId="chat_"+Date.now();
  document.getElementById("caseTitle").textContent=selected.title;
  document.getElementById("caseDetails").textContent=selected.details||"No details supplied.";
  document.getElementById("riskPill").textContent=(selected.severity||"low").toUpperCase()+" RISK";
  document.getElementById("riskPill").className="pill "+(selected.severity||"low");
  document.getElementById("analysis").classList.add("hidden");
  document.getElementById("analysis").textContent="";
  document.getElementById("chat").innerHTML=`<div class="empty"><div class="big">🔎</div><h3>Investigating: ${escapeHtml(selected.title)}</h3><p>Ställ en fråga om just den här händelsen.</p></div>`;
  await loadEvents();
}

async function analyzeCase(){
  if(!selected){alert("Välj en security event först.");return;}
  const box=document.getElementById("analysis");
  box.classList.remove("hidden"); box.textContent="Apollus analyserar...";
  const r=await api("/api/analyze",{method:"POST",body:JSON.stringify({event:selected,text:"Investigate this event in depth."})});
  box.textContent=r.answer;
}

async function sendChat(ev){
  ev.preventDefault();
  if(!selected){alert("Välj en security event först.");return;}
  const input=document.getElementById("message");
  const message=input.value.trim(); if(!message)return;
  const chat=document.getElementById("chat");
  if(chat.querySelector(".empty")) chat.innerHTML="";
  chat.insertAdjacentHTML("beforeend",msgHtml("user",message));
  input.value="";
  chat.scrollTop=chat.scrollHeight;
  const r=await api("/api/chat",{method:"POST",body:JSON.stringify({message,event:selected,sessionId})});
  sessionId=r.sessionId;
  chat.insertAdjacentHTML("beforeend",msgHtml("ai",r.answer||"No response."));
  chat.scrollTop=chat.scrollHeight;
}

async function createDemo(){
  const e={
    id:"evt_"+Date.now(),
    timestamp:new Date().toISOString(),
    type:"ai_agent",source:"demo",title:"AI agent proposed a suspicious command",
    details:"The coding agent proposed a PowerShell command after receiving instructions that attempted to override an earlier safety rule. No command was executed by Apollus.",
    severity:"high"
  };
  try{
    const remote=API_BASE ? await api("/api/events",{method:"POST",body:JSON.stringify(e)}) : null;
    if(remote) { await loadEvents(); selectEvent(remote.id); return; }
  }catch{}
  saveLocalEvent(e);
  await loadEvents(); selectEvent(e.id);
}

function newInvestigation(){
  selected=null; sessionId=null;
  document.getElementById("caseTitle").textContent="Välj något att undersöka";
  document.getElementById("caseDetails").textContent="Apollus visar händelsens data här.";
  document.getElementById("riskPill").textContent="NO CASE";
  document.getElementById("chat").innerHTML=`<div class="empty"><div class="big">🔎</div><h3>Investigate Chat</h3><p>Välj en händelse till vänster eller skapa en demo-händelse.</p></div>`;
}

function msgHtml(role,text){
  return `<div class="msg ${role}"><div class="label">${role==="user"?"YOU":"APOLLUS INVESTIGATOR"}</div>${escapeHtml(text)}</div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
init();
