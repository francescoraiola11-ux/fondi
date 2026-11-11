/* =====================================================================
   FONDI · PANNELLO AMMINISTRATORE
   Accesso riservato a chi ha un documento admin/<UID> su Firestore (vedi ACCOUNT.md).
   Le regole di firestore.rules bloccano comunque chi non è amministratore.
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const GIORNO = 864e5, GIORNI_PROVA = 7;
const tsMs = t => (t ? (t.toMillis ? t.toMillis() : +new Date(t)) : null);
const fData = ms => (ms ? new Date(ms).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "—");
const fRel = ms => {
  if (!ms) return "—";
  const g = Math.floor((Date.now() - ms) / GIORNO);
  return g <= 0 ? "oggi" : g === 1 ? "ieri" : g < 30 ? `${g} giorni fa` : fData(ms);
};
function toast(msg) {
  const t = $("toast"); t.innerHTML = `<span>${esc(msg)}</span>`; t.classList.add("show");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 2800);
}
document.documentElement.dataset.theme = "auto";

if (!window.FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey) {
  $("adm").innerHTML = `<div class="card adm-box"><h2>Firebase non configurato</h2><p class="hint" style="margin:0">Compila <b>firebase-config.js</b> seguendo ACCOUNT.md, poi ricarica.</p></div>`;
  throw new Error("Firebase non configurato");
}
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth(), db = firebase.firestore(), FV = firebase.firestore.FieldValue;
auth.languageCode = "it";

let UTENTI = [], FILTRO = { q: "", stato: "tutti" }, ADMIN = null;

/* --- stato Pro di un utente --- */
function statoPro(u) {
  const r = u.proRegalo, fine = r && tsMs(r.fino), l = u.licenza;
  if (r && (!fine || fine > Date.now())) return { k: "regalo", t: `🎁 Regalo${fine ? " fino al " + fData(fine) : " · per sempre"}` };
  if (l && l.key && l.ok && (!l.scade || l.scade > Date.now())) return { k: "paga", t: "✦ Abbonato" };
  if (u.provaInizio && Date.now() - u.provaInizio < GIORNI_PROVA * GIORNO) return { k: "prova", t: "Prova in corso" };
  if (l && l.key && !l.ok) return { k: "ko", t: l.motivo || "Licenza non valida" };
  return { k: "free", t: "Gratis" };
}

/* --- accesso --- */
function schermataAccesso() {
  $("adm").innerHTML = `<div class="card adm-box">
    <div class="acc-head"><div class="logo-mark">€</div><h2>Pannello amministratore</h2><p class="muted">Accedi con il tuo account amministratore.</p></div>
    <button class="btn acc-google" id="aGoogle">Continua con Google</button>
    <div class="acc-or"><span>oppure con email</span></div>
    <form id="aForm" class="acc-form">
      <label class="f">Email<input name="email" type="email" required autocomplete="email"></label>
      <label class="f">Password<input name="pass" type="password" required autocomplete="current-password"></label>
      <button class="btn primary" type="submit">Accedi</button>
    </form>
    <p class="acc-privacy"><a class="link" href="./">← Torna a Fondi</a></p></div>`;
  $("aGoogle").onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => toast(e.code === "auth/popup-closed-by-user" ? "Accesso annullato" : "Errore: " + e.code));
  $("aForm").onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    auth.signInWithEmailAndPassword(f.email.value.trim(), f.pass.value).catch(err => toast(["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(err.code) ? "Email o password non corrette" : "Errore: " + err.code));
  };
}

function nonAdmin(u) {
  $("adm").innerHTML = `<div class="card adm-box"><h2>🛡️ Non sei ancora amministratore</h2>
    <p class="muted" style="margin-top:0">Sei connesso come <b>${esc(u.email)}</b>. Il tuo UID è:</p>
    <code class="uid" id="uid">${esc(u.uid)}</code>
    <div class="btn-row" style="margin-bottom:16px"><button class="btn sm primary" id="cpUid">Copia UID</button><button class="btn sm" id="esci">Esci</button></div>
    <p class="small" style="margin:0 0 6px"><b>Per diventare amministratore</b> (una volta sola):</p>
    <ol class="small" style="margin:0">
      <li>Apri la Console Firebase → <b>Firestore Database</b> → <b>Dati</b></li>
      <li><b>Avvia raccolta</b> → ID raccolta: <code>admin</code></li>
      <li>ID documento: incolla il tuo UID · aggiungi un campo <code>ruolo</code> = <code>admin</code> · Salva</li>
      <li>Ricarica questa pagina</li>
    </ol></div>`;
  $("cpUid").onclick = () => navigator.clipboard.writeText(u.uid).then(() => toast("UID copiato"));
  $("esci").onclick = () => auth.signOut();
}

auth.onAuthStateChanged(async u => {
  if (!u) return schermataAccesso();
  let ok = false;
  try { ok = (await db.collection("admin").doc(u.uid).get()).exists; } catch (e) { ok = false; }
  if (!ok) return nonAdmin(u);
  ADMIN = u;
  await carica();
});

/* --- dati --- */
async function carica() {
  try {
    const snap = await db.collection("utenti").get();
    UTENTI = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .map(u => ({ ...u, creatoMs: tsMs(u.creato), accessoMs: tsMs(u.ultimoAccesso) }))
      .sort((a, b) => (b.creatoMs || 0) - (a.creatoMs || 0));
    disegna();
  } catch (e) {
    console.error(e);
    $("adm").innerHTML = `<div class="card adm-box"><h2>Errore</h2><p class="hint" style="margin:0">Non riesco a leggere gli utenti (${esc(e.code || e.message)}). Hai pubblicato le regole di firestore.rules?</p></div>`;
  }
}

function statistiche() {
  const ora = Date.now(), st = UTENTI.map(statoPro);
  const n = k => st.filter(s => s.k === k).length;
  const mesi = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const k = d.getFullYear() * 12 + d.getMonth();
    mesi.push({ etichetta: d.toLocaleDateString("it-IT", { month: "short" }), n: UTENTI.filter(u => u.creatoMs && (new Date(u.creatoMs).getFullYear() * 12 + new Date(u.creatoMs).getMonth()) === k).length });
  }
  return {
    totali: UTENTI.length,
    nuovi30: UTENTI.filter(u => u.creatoMs && ora - u.creatoMs < 30 * GIORNO).length,
    attivi7: UTENTI.filter(u => u.accessoMs && ora - u.accessoMs < 7 * GIORNO).length,
    attivi30: UTENTI.filter(u => u.accessoMs && ora - u.accessoMs < 30 * GIORNO).length,
    paganti: n("paga"), regali: n("regalo"), prova: n("prova"),
    mesi,
  };
}

function disegna() {
  const s = statistiche(), max = Math.max(1, ...s.mesi.map(m => m.n));
  const conv = s.totali ? Math.round(s.paganti / s.totali * 100) : 0;
  $("adm").innerHTML = `
    <div class="adm-top"><div class="logo-mark">€</div>
      <div class="flex"><h1>Pannello amministratore</h1><span class="muted small">${esc(ADMIN.email)}</span></div>
      <div class="btn-row"><button class="btn sm" id="ricarica">↻ Aggiorna</button><button class="btn sm" id="csv">Esporta CSV</button><a class="btn sm" href="./">Apri Fondi</a><button class="btn sm ghost" id="esci">Esci</button></div></div>
    <div class="stat-strip" style="margin-bottom:18px">
      <div class="stat"><small>Utenti registrati</small><b>${s.totali}</b><span>+${s.nuovi30} negli ultimi 30 giorni</span></div>
      <div class="stat"><small>Attivi</small><b>${s.attivi7}</b><span>ultimi 7 giorni · ${s.attivi30} in 30 giorni</span></div>
      <div class="stat"><small>Abbonati Pro</small><b>${s.paganti}</b><span>${conv}% degli utenti</span></div>
      <div class="stat"><small>Pro in regalo</small><b>${s.regali}</b><span>${s.prova} in prova gratuita</span></div>
    </div>
    <div class="card" style="margin-bottom:18px"><div class="card-head"><h2>Nuovi iscritti per mese</h2><span class="muted">ultimi 12 mesi</span></div>
      <div class="chart-bars">${s.mesi.map(m => `<div title="${m.n} iscritti"><b>${m.n || ""}</b><i style="height:${m.n / max * 100}%"></i>${esc(m.etichetta)}</div>`).join("")}</div></div>
    <div class="card"><div class="card-head"><h2>Utenti</h2><span class="muted" id="conta"></span></div>
      <div class="adm-tools">
        <input id="q" placeholder="Cerca per nome o email" value="${esc(FILTRO.q)}">
        <select id="fStato">${[["tutti", "Tutti"], ["paga", "Abbonati"], ["regalo", "Pro in regalo"], ["prova", "In prova"], ["free", "Gratis"], ["ko", "Licenza non valida"]].map(([v, t]) => `<option value="${v}"${FILTRO.stato === v ? " selected" : ""}>${t}</option>`).join("")}</select>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Utente</th><th>Accesso con</th><th>Iscritto</th><th>Ultimo accesso</th><th>Stato</th><th>Regala Pro</th></tr></thead><tbody id="righe"></tbody></table></div></div>`;
  $("ricarica").onclick = carica;
  $("esci").onclick = () => auth.signOut();
  $("csv").onclick = esportaCsv;
  $("q").oninput = e => { FILTRO.q = e.target.value; righe(); };
  $("fStato").onchange = e => { FILTRO.stato = e.target.value; righe(); };
  righe();
}

function filtrati() {
  const q = FILTRO.q.trim().toLowerCase();
  return UTENTI.filter(u => (!q || `${u.nome || ""} ${u.email || ""}`.toLowerCase().includes(q)) && (FILTRO.stato === "tutti" || statoPro(u).k === FILTRO.stato));
}

function righe() {
  const lista = filtrati();
  $("conta").textContent = `${lista.length} di ${UTENTI.length}`;
  $("righe").innerHTML = lista.length ? lista.map(u => {
    const st = statoPro(u), haRegalo = !!u.proRegalo;
    return `<tr>
      <td class="who"><b>${esc(u.nome || "—")}</b><span>${esc(u.email || u.id)}</span></td>
      <td>${u.provider === "google.com" ? "Google" : u.provider === "password" ? "Email" : esc(u.provider || "—")}</td>
      <td>${fData(u.creatoMs)}</td>
      <td>${fRel(u.accessoMs)}</td>
      <td><span class="st ${st.k}">${esc(st.t)}</span></td>
      <td><select class="sm" data-uid="${esc(u.id)}">
        <option value="">${haRegalo ? "Modifica…" : "Scegli…"}</option>
        <option value="30">1 mese</option><option value="90">3 mesi</option><option value="365">1 anno</option><option value="0">Per sempre</option>
        ${haRegalo ? `<option value="togli">Togli il regalo</option>` : ""}
      </select></td></tr>`;
  }).join("") : `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">Nessun utente</td></tr>`;
  $("righe").querySelectorAll("select[data-uid]").forEach(sel => sel.onchange = () => regala(sel.dataset.uid, sel.value, sel));
}

async function regala(uid, v, sel) {
  if (!v) return;
  const u = UTENTI.find(x => x.id === uid);
  sel.disabled = true;
  try {
    const ref = db.collection("utenti").doc(uid);
    if (v === "togli") {
      await ref.update({ proRegalo: FV.delete() });
      delete u.proRegalo;
      toast(`Regalo tolto a ${u.email}`);
    } else {
      const giorni = +v, fino = giorni ? firebase.firestore.Timestamp.fromMillis(Date.now() + giorni * GIORNO) : null;
      const proRegalo = { fino, da: ADMIN.email, il: FV.serverTimestamp() };
      await ref.update({ proRegalo });
      u.proRegalo = { ...proRegalo, fino };
      toast(`Pro regalato a ${u.email}${giorni ? ` per ${giorni} giorni` : " per sempre"} 🎁`);
    }
    disegna();
  } catch (e) { console.error(e); toast("Non riuscito: " + (e.code || e.message)); sel.disabled = false; sel.value = ""; }
}

function esportaCsv() {
  const col = ["nome", "email", "accesso con", "iscritto", "ultimo accesso", "stato"];
  const q = x => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const righe = filtrati().map(u => [u.nome, u.email, u.provider, u.creatoMs ? new Date(u.creatoMs).toISOString().slice(0, 10) : "", u.accessoMs ? new Date(u.accessoMs).toISOString().slice(0, 10) : "", statoPro(u).t].map(q).join(";"));
  const blob = new Blob(["﻿" + [col.map(q).join(";"), ...righe].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `fondi-utenti-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}
