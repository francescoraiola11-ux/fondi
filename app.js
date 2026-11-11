"use strict";
/* =====================================================================
   Fondi · gestore della finanza personale (offline, dati nel browser)
   ===================================================================== */

/* ---------------- Utilità ---------------- */
const $ = id => document.getElementById(id);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const somma = a => a.reduce((x, y) => x + y, 0);
const arrot = n => Math.round(n * 100) / 100;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const euro = n => (n || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const money = n => `<span class="money">${euro(n)}</span>`;
const pct = n => (isFinite(n) ? Math.round(n * 100) + "%" : "—");
const euroK = v => {
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  if (a >= 1e6) return s + (a / 1e6).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "M";
  if (a >= 1e3) return s + (a / 1e3).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "k";
  return s + Math.round(a);
};
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const addGiorni = (iso, k) => { const d = toDate(iso); d.setDate(d.getDate() + k); return isoDate(d); };
const diffGiorni = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
const OGGI = isoDate(new Date()), MESE_CORR = OGGI.slice(0, 7);
const giorniMese = (y, m) => new Date(y, m, 0).getDate();
const shiftMese = (ym, k) => { let [y, m] = ym.split("-").map(Number); m += k; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return `${y}-${pad(m)}`; };
const fmtData = iso => iso ? iso.split("-").reverse().join("/") : "";
const fmtBreve = iso => toDate(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
const fmtGiorno = iso => toDate(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
const nomeMese = (ym, lungo) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("it-IT", lungo ? { month: "long", year: "numeric" } : { month: "short" }); };
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const chiave = s => norm(s).replace(/[0-9]+/g, " ").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 3).join(" ");
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function parseNum(s) {
  s = String(s ?? "").trim().replace(/[€\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!s) return NaN;
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  else s = s.replace(/,/g, "");
  return parseFloat(s);
}
function parseData(s) {
  s = String(s || "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return valida(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (m) return valida(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  return null;
  function valida(y, mo, d) { return mo >= 1 && mo <= 12 && d >= 1 && d <= giorniMese(y, mo) ? `${y}-${pad(mo)}-${pad(d)}` : null; }
}

/* ---------------- Icone ---------------- */
const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".8"/><circle cx="3.5" cy="12" r=".8"/><circle cx="3.5" cy="18" r=".8"/>',
  pie: '<path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15 3.4A9 9 0 0 1 20.6 9H15z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
  wallet: '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h14a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 19.5 7H5.5A2.5 2.5 0 0 1 3 4.5"/><circle cx="16.5" cy="13.5" r="1.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6M18.5 6l-.8 13a2 2 0 0 1-2 2H8.3a2 2 0 0 1-2-2L5.5 6"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  piggy: '<path d="M19 9.5c.8.5 1.5 1.6 1.5 2.5h1v4h-1.6a7 7 0 0 1-2.4 2.6V21h-3v-1.6a8 8 0 0 1-3 0V21h-3v-2.6A7 7 0 0 1 4.5 12c0-3.9 3.6-7 8-7 1.9 0 3.6.5 5 1.4L20 5z"/><circle cx="15.5" cy="11" r=".8"/>',
};
const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;

/* ---------------- Costanti ---------------- */
const PAGES = [
  ["dashboard", "Panoramica", "home", "Il quadro completo delle tue finanze"],
  ["movimenti", "Movimenti", "list", "Tutte le entrate, le uscite e i trasferimenti"],
  ["budget", "Budget", "pie", "Dai un compito a ogni euro"],
  ["obiettivi", "Obiettivi", "target", "I tuoi traguardi di risparmio"],
  ["pianificazione", "Pianificazione", "calendar", "Ricorrenti, abbonamenti e previsione del saldo"],
  ["debiti", "Debiti", "card", "Il piano più rapido ed economico per azzerarli"],
  ["report", "Report", "chart", "Il tuo anno in numeri"],
  ["conti", "Conti", "wallet", "Saldi e patrimonio netto"],
  ["impostazioni", "Impostazioni", "gear", "Importazione, regole, categorie e backup"],
];
const GRUPPI = { necessita: "Necessità", desideri: "Desideri", risparmio: "Risparmio e investimenti", entrata: "Entrate" };
const TIPI_CONTO = { "Conto corrente": "🏦", "Risparmio": "🐷", "Contanti": "💵", "Investimenti": "📈", "Carta di credito": "💳" };
const LIQUIDI = ["Conto corrente", "Risparmio", "Contanti"];
const FREQ = { mensile: "Ogni mese", settimanale: "Ogni settimana", annuale: "Ogni anno" };
const COLORI = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#84cc16", "#f97316", "#14b8a6", "#3b82f6", "#a855f7", "#eab308", "#22c55e", "#0ea5e9", "#e11d48", "#64748b", "#d946ef"];
const CAT_DEF = [
  ["Stipendio", "entrata", "💼"], ["Altre entrate", "entrata", "💰"],
  ["Casa", "necessita", "🏠"], ["Bollette", "necessita", "💡"], ["Spesa alimentare", "necessita", "🛒"],
  ["Trasporti", "necessita", "🚗"], ["Salute", "necessita", "💊"], ["Assicurazioni", "necessita", "🛡️"],
  ["Ristoranti", "desideri", "🍽️"], ["Svago", "desideri", "🎬"], ["Shopping", "desideri", "🛍️"],
  ["Viaggi", "desideri", "✈️"], ["Abbonamenti", "desideri", "📺"], ["Sport", "desideri", "🏃"],
  ["Regali", "desideri", "🎁"], ["Altro", "desideri", "📦"],
  ["Investimenti", "risparmio", "📈"], ["Fondo emergenza", "risparmio", "🛟"],
];
const PAROLE = {
  "Spesa alimentare": ["esselunga", "coop", "conad", "lidl", "carrefour", "eurospin", "penny", "aldi", "md", "iper", "bennet", "despar", "supermercato", "spesa", "alimentari", "panificio", "panetteria", "macelleria", "fruttivendolo", "mercato"],
  "Trasporti": ["benzina", "carburante", "diesel", "eni", "q8", "tamoil", "esso", "trenitalia", "italo", "treno", "atm", "atac", "metro", "bus", "autobus", "uber", "taxi", "autostrade", "autostrada", "telepass", "parcheggio", "bollo", "meccanico", "gomme", "car sharing"],
  "Ristoranti": ["ristorante", "pizzeria", "pizza", "bar", "caffe", "cappuccino", "colazione", "pranzo", "cena", "aperitivo", "sushi", "mcdonald", "burger", "kebab", "deliveroo", "glovo", "just eat", "trattoria", "osteria", "gelato", "gelateria", "pub"],
  "Abbonamenti": ["netflix", "spotify", "disney", "prime video", "amazon prime", "dazn", "now tv", "sky", "youtube premium", "icloud", "google one", "abbonamento", "audible"],
  "Bollette": ["enel", "a2a", "hera", "iren", "edison", "luce", "gas", "acqua", "bolletta", "tim", "vodafone", "iliad", "fastweb", "windtre", "internet", "fibra", "telefono", "tari"],
  "Casa": ["affitto", "mutuo", "condominio", "ikea", "leroy merlin", "brico", "pulizie", "arredamento", "ferramenta"],
  "Salute": ["farmacia", "medico", "dentista", "visita", "ticket", "ospedale", "analisi", "ottico", "psicologo", "fisioterapia"],
  "Shopping": ["zara", "h&m", "amazon", "zalando", "vestiti", "scarpe", "mediaworld", "unieuro", "primark", "abbigliamento", "profumeria"],
  "Sport": ["palestra", "decathlon", "piscina", "calcetto", "padel", "tennis", "gym", "fitness"],
  "Svago": ["cinema", "teatro", "concerto", "steam", "playstation", "xbox", "nintendo", "libro", "libri", "libreria", "museo", "discoteca", "biglietti"],
  "Viaggi": ["hotel", "booking", "airbnb", "ryanair", "easyjet", "wizz", "volo", "aereo", "vacanza", "traghetto", "b&b"],
  "Assicurazioni": ["assicurazione", "rc auto", "polizza"],
  "Regali": ["regalo", "regali", "compleanno"],
  "Stipendio": ["stipendio", "salario", "busta paga", "emolumenti", "retribuzione"],
  "Investimenti": ["etf", "azioni", "pac", "broker", "obbligazioni", "btp"],
};
const PAROLE_RE = Object.fromEntries(Object.entries(PAROLE).map(([c, ps]) => [c, ps.map(p => new RegExp("(^|[^a-z])" + escRe(norm(p)) + "($|[^a-z])"))]));

/* ---------------- Stato ---------------- */
const KEY = "gestore-fondi-v2", OLD_KEY = "gestore-spese-v1";
const DEMO = new URLSearchParams(location.search).has("demo");

function normalizza(st) {
  st.versione = 3;
  for (const k of ["conti", "movimenti", "ricorrenti", "obiettivi", "debiti", "regole", "ignorati", "categorie"]) if (!Array.isArray(st[k])) st[k] = [];
  st.impostazioni = Object.assign({ tema: "auto", privacy: false, extraDebiti: 100, ultimoConto: null }, st.impostazioni || {});
  st.categorie.forEach((c, i) => {
    const def = CAT_DEF.find(d => d[0] === c.nome);
    c.icona = c.icona || (def ? def[2] : c.gruppo === "entrata" ? "💰" : "🏷️");
    c.colore = c.colore || COLORI[i % COLORI.length];
    c.budget = +c.budget || 0; c.rollover = !!c.rollover;
    if (!GRUPPI[c.gruppo]) c.gruppo = "desideri";
  });
  st.movimenti.forEach(m => { if (!Array.isArray(m.tags)) m.tags = []; m.importo = +m.importo || 0; });
  st.conti.forEach(c => { c.saldoIniziale = +c.saldoIniziale || 0; if (!TIPI_CONTO[c.tipo]) c.tipo = "Conto corrente"; });
  return st;
}
function statoIniziale() {
  return normalizza({
    conti: [{ id: uid(), nome: "Conto principale", tipo: "Conto corrente", saldoIniziale: 0 }],
    categorie: CAT_DEF.map(([nome, gruppo, icona], i) => ({ nome, gruppo, icona, colore: COLORI[i % COLORI.length], budget: 0, rollover: false })),
  });
}
function carica() {
  try { const s = localStorage.getItem(KEY); if (s) return normalizza(JSON.parse(s)); } catch (e) { console.error(e); }
  const st = statoIniziale();
  let old = [];
  try { old = JSON.parse(localStorage.getItem(OLD_KEY) || "[]"); } catch (e) { }
  for (const m of old) {
    if (!st.categorie.some(c => c.nome === m.categoria)) st.categorie.push({ nome: m.categoria, gruppo: m.tipo === "entrata" ? "entrata" : "desideri", budget: 0 });
    st.movimenti.push({ id: m.id || uid(), tipo: m.tipo, data: m.data, importo: +m.importo, categoria: m.categoria, contoId: st.conti[0].id, descrizione: m.descrizione || "", tags: [] });
  }
  return normalizza(st);
}

let S = carica();
let cache = {};
const memo = (k, f) => (k in cache ? cache[k] : (cache[k] = f()));
function salva() {
  cache = {};
  if (DEMO) return;
  localStorage.setItem(KEY, JSON.stringify(S));
  tracciaModifiche();
  if (SYNC && !syncInCorso) programmaSync();
}

/* =====================================================================
   Sincronizzazione tra dispositivi
   - dati cifrati sul dispositivo (PBKDF2 + AES-GCM 256) e salvati in un Gist segreto
   - unione voce per voce con data di modifica e "lapidi" per le cancellazioni
   ===================================================================== */
const SYNC_KEY = "fondi-sync", META_KEY = "fondi-meta", SYNC_FILE = "fondi.sync.json", SYNC_DESC = "Fondi · dati cifrati (sincronizzazione)";
const COLLEZIONI = { conti: "id", movimenti: "id", ricorrenti: "id", obiettivi: "id", debiti: "id", categorie: "nome", regole: "parola" };
const IMP_SYNC = ["extraDebiti"];
let SYNC = null, META = { rec: {}, del: {}, init: false };
try { SYNC = JSON.parse(localStorage.getItem(SYNC_KEY) || "null"); } catch (e) { }
try { META = JSON.parse(localStorage.getItem(META_KEY) || "null") || META; } catch (e) { }
let syncInCorso = false, syncTimer = null, syncStato = SYNC ? "attesa" : "off", saltCorrente = null, chiaviCache = {};

function hashStr(s) { // cyrb53
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const chiaveRec = (col, r) => col + ":" + r[COLLEZIONI[col]];

// Confronta lo stato con l'ultima "impronta" nota: le voci cambiate prendono la data di adesso, quelle sparite diventano lapidi.
function tracciaModifiche() {
  const ora = Date.now(), primo = !META.init, visti = new Set();
  const segna = (key, valore) => {
    visti.add(key);
    const h = hashStr(JSON.stringify(valore)), m = META.rec[key];
    if (!m || m.h !== h) { META.rec[key] = { h, t: primo ? 1 : ora }; delete META.del[key]; }
  };
  for (const col of Object.keys(COLLEZIONI)) for (const r of S[col]) segna(chiaveRec(col, r), r);
  for (const p of IMP_SYNC) segna("imp:" + p, S.impostazioni[p]);
  for (const key of Object.keys(META.rec)) if (!visti.has(key)) { META.del[key] = ora; delete META.rec[key]; }
  META.init = true;
  localStorage.setItem(META_KEY, JSON.stringify(META));
}

function unisci(R, RM) {
  RM = RM || { rec: {}, del: {} };
  const out = JSON.parse(JSON.stringify(S));
  const M = { rec: { ...META.rec }, del: { ...META.del }, init: true };
  for (const [k, t] of Object.entries(RM.del || {})) if (!(M.del[k] >= t)) M.del[k] = t;
  for (const col of Object.keys(COLLEZIONI)) {
    const loc = new Map(S[col].map(r => [chiaveRec(col, r), r]));
    const rem = new Map((R[col] || []).map(r => [chiaveRec(col, r), r]));
    const ris = [];
    for (const key of new Set([...loc.keys(), ...rem.keys()])) {
      const lr = loc.get(key), rr = rem.get(key);
      const lt = lr ? (META.rec[key] || {}).t || 0 : -1, rt = rr ? ((RM.rec || {})[key] || {}).t || 0 : -1;
      const vinceRemoto = rt > lt;
      const win = vinceRemoto ? rr : lr, tw = Math.max(lt, rt);
      if ((M.del[key] || 0) >= tw) { delete M.rec[key]; continue; }
      ris.push(JSON.parse(JSON.stringify(win)));
      M.rec[key] = vinceRemoto ? (RM.rec[key] || { h: hashStr(JSON.stringify(rr)), t: rt }) : (META.rec[key] || { h: hashStr(JSON.stringify(lr)), t: lt });
      delete M.del[key];
    }
    out[col] = ris;
  }
  for (const p of IMP_SYNC) {
    const key = "imp:" + p, lt = (META.rec[key] || {}).t || 0, rt = ((RM.rec || {})[key] || {}).t || 0;
    if (rt > lt && R.impostazioni && p in R.impostazioni) { out.impostazioni[p] = R.impostazioni[p]; M.rec[key] = RM.rec[key]; }
  }
  out.ignorati = [...new Set([...(S.ignorati || []), ...(R.ignorati || [])])];
  return { stato: normalizza(out), meta: M };
}

/* --- cifratura --- */
function b64(buf) { const a = new Uint8Array(buf); let s = ""; for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); }
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function chiaveCifra(salt) {
  const k = SYNC.pass + "|" + salt;
  if (chiaviCache[k]) return chiaviCache[k];
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(SYNC.pass), "PBKDF2", false, ["deriveKey"]);
  return (chiaviCache[k] = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64(salt), iterations: 310000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]));
}
async function cifra(obj) {
  if (!saltCorrente) saltCorrente = b64(crypto.getRandomValues(new Uint8Array(16)));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await chiaveCifra(saltCorrente), new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({ app: "fondi", v: 1, salt: saltCorrente, iv: b64(iv), dati: b64(ct) });
}
async function decifra(txt) {
  let p;
  try { p = JSON.parse(txt); } catch (e) { throw new Error("Il file nel cloud è danneggiato"); }
  if (p.app !== "fondi") throw new Error("Il file nel cloud non è di Fondi");
  let pt;
  try { pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) }, await chiaveCifra(p.salt), unb64(p.dati)); }
  catch (e) { throw new Error("Password di cifratura errata"); }
  saltCorrente = p.salt;
  return JSON.parse(new TextDecoder().decode(pt));
}

/* --- GitHub Gist --- */
async function gh(path, opt = {}) {
  const r = await fetch("https://api.github.com" + path, {
    ...opt, cache: "no-store",
    headers: { Authorization: "Bearer " + SYNC.token, Accept: "application/vnd.github+json", ...(opt.body ? { "Content-Type": "application/json" } : {}) },
  });
  if (r.status === 401) throw Object.assign(new Error("Token GitHub non valido o scaduto"), { status: 401 });
  if (r.status === 403) throw Object.assign(new Error("Il token non ha il permesso 'gist' (o limite di richieste raggiunto)"), { status: 403 });
  if (!r.ok) throw Object.assign(new Error("GitHub ha risposto con errore " + r.status), { status: r.status });
  return r.status === 204 ? null : r.json();
}
async function leggiFile(g) {
  const f = g.files && g.files[SYNC_FILE];
  if (!f) return null;
  let c = f.content;
  if (f.truncated) c = await (await fetch(f.raw_url, { cache: "no-store" })).text();
  return c && c.trim() !== "{}" ? c : null;
}
async function trovaGist() {
  if (SYNC.gistId) {
    try { const g = await gh("/gists/" + SYNC.gistId); return { id: g.id, contenuto: await leggiFile(g) }; }
    catch (e) { if (e.status !== 404) throw e; SYNC.gistId = null; }
  }
  for (let p = 1; p <= 10; p++) {
    const lista = await gh(`/gists?per_page=100&page=${p}`);
    const g = lista.find(g => g.files && g.files[SYNC_FILE]);
    if (g) { SYNC.gistId = g.id; return { id: g.id, contenuto: await leggiFile(await gh("/gists/" + g.id)) }; }
    if (lista.length < 100) break;
  }
  const nuovo = await gh("/gists", { method: "POST", body: JSON.stringify({ description: SYNC_DESC, public: false, files: { [SYNC_FILE]: { content: "{}" } } }) });
  SYNC.gistId = nuovo.id;
  return { id: nuovo.id, contenuto: null };
}

/* --- ciclo di sincronizzazione --- */
const salvaSync = () => (SYNC ? localStorage.setItem(SYNC_KEY, JSON.stringify(SYNC)) : localStorage.removeItem(SYNC_KEY));
const syncDisponibile = () => !!(window.crypto && crypto.subtle) && /^https?:$/.test(location.protocol);
function programmaSync(ms = 3000) { clearTimeout(syncTimer); syncTimer = setTimeout(() => sincronizza(), ms); }
function setSyncStato(s) { syncStato = s; aggiornaSyncUI(); }

async function sincronizza(manuale) {
  if (!SYNC || DEMO || !syncDisponibile()) return;
  if (syncInCorso) { programmaSync(2000); return; }
  if (!navigator.onLine) { setSyncStato("offline"); return; }
  syncInCorso = true; setSyncStato("sync");
  try {
    const prima = JSON.stringify(S);
    const g = await trovaGist();
    let remotoTxt = null;
    if (g.contenuto) {
      const remoto = await decifra(g.contenuto);
      remotoTxt = JSON.stringify(remoto);
      const localeVuoto = !SYNC.ultimo && !S.movimenti.length;
      if (localeVuoto) { S = normalizza(remoto.stato); META = remoto.meta || { rec: {}, del: {} }; META.init = true; }
      else { const u = unisci(remoto.stato, remoto.meta); S = u.stato; META = u.meta; }
      cache = {};
      localStorage.setItem(KEY, JSON.stringify(S));
      tracciaModifiche();
      eseguiRicorrenti();
    }
    const payload = { stato: S, meta: META };
    if (JSON.stringify(payload) !== remotoTxt) {
      await gh("/gists/" + g.id, { method: "PATCH", body: JSON.stringify({ files: { [SYNC_FILE]: { content: await cifra(payload) } } }) });
    }
    SYNC.ultimo = Date.now(); SYNC.errore = null; salvaSync();
    setSyncStato("ok");
    if (JSON.stringify(S) !== prima) { render(); if (!manuale) toast("Dati aggiornati dall'altro dispositivo"); }
    if (manuale) toast("Sincronizzazione completata");
    return true;
  } catch (e) {
    console.warn("sync", e);
    if (SYNC) { SYNC.errore = e.message; salvaSync(); }
    setSyncStato("errore");
    if (manuale) toast("Sincronizzazione non riuscita: " + e.message);
    return false;
  } finally { syncInCorso = false; }
}

async function collegaSync(token, pass) {
  if (!syncDisponibile()) return toast("La sincronizzazione funziona dalla versione online dell'app");
  SYNC = { token: token.trim(), pass, gistId: null, ultimo: null };
  chiaviCache = {}; saltCorrente = null;
  setSyncStato("sync");
  const ok = await sincronizza(false);
  if (!ok) { const err = SYNC && SYNC.errore; SYNC = null; salvaSync(); setSyncStato("off"); toast(err || "Collegamento non riuscito"); return; }
  render(); toast("☁️ Sincronizzazione attiva");
}
function scollegaSync() { SYNC = null; salvaSync(); chiaviCache = {}; saltCorrente = null; setSyncStato("off"); render(); toast("Dispositivo scollegato: i dati restano qui"); }

const fmtRel = ts => {
  if (!ts) return "mai";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return "adesso";
  if (s < 3600) return `${Math.round(s / 60)} min fa`;
  if (s < 86400) return `${Math.round(s / 3600)} ore fa`;
  return new Date(ts).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
function testoStato() {
  if (!SYNC) return "";
  return { sync: "⏳ Sincronizzazione…", ok: `☁️ Sincronizzato ${fmtRel(SYNC.ultimo)}`, errore: `⚠️ ${SYNC.errore || "Errore"}`, offline: "📴 Offline: sincronizzo appena torni online", attesa: `☁️ Ultima sincronizzazione ${fmtRel(SYNC.ultimo)}` }[syncStato] || "";
}
function aggiornaSyncUI() {
  const el = $("syncStato");
  if (el) { el.textContent = testoStato(); el.className = syncStato === "errore" ? "neg" : "muted"; }
  const sc = $("syncSide");
  if (sc) sc.textContent = SYNC ? testoStato() : "";
}
function renderSync() {
  const box = $("syncBox");
  if (!box) return;
  if (!syncDisponibile()) {
    box.innerHTML = `<p class="hint" style="margin:0">La sincronizzazione funziona dalla versione online: <a class="link" href="https://francescoraiola11-ux.github.io/fondi/" target="_blank" rel="noopener">francescoraiola11-ux.github.io/fondi</a></p>`;
  } else if (!SYNC) {
    box.innerHTML = `<p class="hint">I dati si allineano da soli tra PC e telefono. Vengono <b>cifrati sul dispositivo</b> (AES-256) con una password che conosci solo tu e salvati in un Gist segreto del tuo GitHub: senza la password nessuno può leggerli, nemmeno GitHub.</p>
      <ol class="steps">
        <li><a class="link" href="https://github.com/settings/tokens/new?scopes=gist&description=Fondi%20sync" target="_blank" rel="noopener">Crea un token GitHub</a> con il <b>solo</b> permesso <b>gist</b>, poi copialo.</li>
        <li>Incollalo qui sotto e scegli una <b>password di cifratura</b>.</li>
        <li>Sull'altro dispositivo inserisci <b>lo stesso token e la stessa password</b>: i dati arrivano da soli.</li>
      </ol>
      <form id="fSync" class="form-grid">
        <label>Token GitHub<input id="sToken" type="password" autocomplete="off" required placeholder="ghp_…"></label>
        <label>Password di cifratura<input id="sPass" type="password" minlength="8" required autocomplete="new-password" placeholder="almeno 8 caratteri"></label>
        <button class="btn primary" type="submit">Collega questo dispositivo</button>
      </form>
      <p class="hint" style="margin:12px 0 0">⚠️ Se dimentichi la password, la copia nel cloud non si può recuperare (i dati sui dispositivi restano). Il token resta salvato solo su questo dispositivo.</p>`;
  } else {
    box.innerHTML = `<div class="sync-on"><div><b>Questo dispositivo è collegato.</b><p class="hint" style="margin:4px 0 0">Ogni modifica viene inviata in pochi secondi; all'apertura dell'app scarico quelle fatte altrove. Puoi lavorare anche offline: al ritorno della connessione unisco tutto.</p></div>
      <div class="btn-row"><button class="btn sm primary" data-act="syncOra">Sincronizza ora</button><button class="btn sm ghost" data-act="syncScollega">Scollega</button></div></div>`;
  }
  aggiornaSyncUI();
}

const catInfo = nome => S.categorie.find(c => c.nome === nome) || { nome: nome || "Senza categoria", icona: "🏷️", colore: "#94a3b8", gruppo: "desideri", budget: 0 };
const gruppoDi = nome => catInfo(nome).gruppo;
const nomeConto = id => (S.conti.find(c => c.id === id) || { nome: "(eliminato)" }).nome;
const isLiquido = id => { const c = S.conti.find(c => c.id === id); return !!c && LIQUIDI.includes(c.tipo); };
const catPerTipo = tipo => S.categorie.filter(c => (tipo === "entrata" ? c.gruppo === "entrata" : c.gruppo !== "entrata"));

/* ---------------- Ricorrenti ---------------- */
function prossimaData(r, da) {
  const [y, m, d] = da.split("-").map(Number);
  if (r.frequenza === "settimanale") return addGiorni(da, 7);
  if (r.frequenza === "annuale") return `${y + 1}-${pad(m)}-${pad(Math.min(r.giorno || d, giorniMese(y + 1, m)))}`;
  const nm = shiftMese(`${y}-${pad(m)}`, 1), [ny, nmm] = nm.split("-").map(Number);
  return `${nm}-${pad(Math.min(r.giorno || d, giorniMese(ny, nmm)))}`;
}
function eseguiRicorrenti() {
  let n = 0, avanzato = false;
  const ids = new Set(S.movimenti.map(m => m.id));
  for (const r of S.ricorrenti) {
    let g = 0;
    while (r.prossima <= OGGI && g++ < 1000) {
      // id deterministico: due dispositivi che generano la stessa scadenza producono lo stesso movimento (niente doppioni in sincronizzazione)
      const id = `ric-${r.id}-${r.prossima}`;
      if (!ids.has(id)) {
        const m = { id, tipo: r.tipo, data: r.prossima, importo: r.importo, contoId: r.contoId, descrizione: r.descrizione, ricorrenteId: r.id, tags: [] };
        if (r.tipo === "trasferimento") m.contoDestId = r.contoDestId; else m.categoria = r.categoria;
        S.movimenti.push(m); ids.add(id);
        n++;
      }
      r.prossima = prossimaData(r, r.prossima);
      avanzato = true;
    }
  }
  if (avanzato) salva();
  return n;
}
function occorrenze(da, a) {
  const out = [];
  for (const r of S.ricorrenti) {
    let d = r.prossima, g = 0;
    while (d <= a && g++ < 500) { if (d >= da) out.push({ data: d, r }); d = prossimaData(r, d); }
  }
  return out.sort((x, y) => x.data.localeCompare(y.data));
}
const equivalenteMensile = r => (r.frequenza === "settimanale" ? r.importo * 52 / 12 : r.frequenza === "annuale" ? r.importo / 12 : r.importo);

/* ---------------- Calcoli ---------------- */
function saldiConti(finoA) {
  return memo("saldi" + (finoA || ""), () => {
    const s = {};
    for (const c of S.conti) s[c.id] = c.saldoIniziale;
    for (const m of S.movimenti) {
      if (finoA && m.data > finoA) continue;
      if (m.tipo === "entrata") s[m.contoId] = (s[m.contoId] || 0) + m.importo;
      else if (m.tipo === "uscita") s[m.contoId] = (s[m.contoId] || 0) - m.importo;
      else { s[m.contoId] = (s[m.contoId] || 0) - m.importo; s[m.contoDestId] = (s[m.contoDestId] || 0) + m.importo; }
    }
    return s;
  });
}
const patrimonio = finoA => { const s = saldiConti(finoA); return somma(S.conti.map(c => s[c.id] || 0)); };
const liquidita = () => { const s = saldiConti(); return somma(S.conti.filter(c => LIQUIDI.includes(c.tipo)).map(c => s[c.id] || 0)); };
const primoGiorno = () => memo("primo", () => S.movimenti.reduce((a, m) => (m.data < a ? m.data : a), OGGI));

function riepilogo(ym) {
  return memo("r" + ym, () => {
    const r = { entrate: 0, necessita: 0, desideri: 0, risparmio: 0, perCat: {}, fisse: 0, n: 0 };
    for (const m of S.movimenti) {
      if (!m.data.startsWith(ym)) continue;
      r.n++;
      if (m.tipo === "entrata") r.entrate += m.importo;
      else if (m.tipo === "uscita") {
        const g = gruppoDi(m.categoria);
        r[g === "entrata" ? "desideri" : g] += m.importo;
        r.perCat[m.categoria] = (r.perCat[m.categoria] || 0) + m.importo;
        if (m.ricorrenteId && g !== "risparmio") r.fisse += m.importo;
      }
    }
    r.spese = r.necessita + r.desideri;
    r.risparmiato = r.entrate - r.spese;
    r.tasso = r.entrate ? r.risparmiato / r.entrate : NaN;
    return r;
  });
}
function riepilogoAnno(y) {
  return memo("y" + y, () => {
    const mesi = [...Array(12)].map((_, i) => `${y}-${pad(i + 1)}`).map(m => ({ m, ...riepilogo(m) }));
    const perCat = {};
    mesi.forEach(r => Object.entries(r.perCat).forEach(([c, v]) => (perCat[c] = (perCat[c] || 0) + v)));
    const entrate = somma(mesi.map(r => r.entrate)), spese = somma(mesi.map(r => r.spese));
    return { mesi, perCat, entrate, spese, risparmiato: entrate - spese, tasso: entrate ? (entrate - spese) / entrate : NaN };
  });
}

function entrateAttese(ym) {
  return memo("ea" + ym, () => {
    const r = riepilogo(ym);
    if (ym !== MESE_CORR) return { tot: r.entrate, future: 0 };
    const [y, m] = ym.split("-").map(Number);
    const future = somma(occorrenze(addGiorni(OGGI, 1), `${ym}-${pad(giorniMese(y, m))}`).filter(o => o.r.tipo === "entrata").map(o => o.r.importo));
    return { tot: r.entrate + future, future };
  });
}

function previsioneSpese() {
  return memo("ps", () => {
    const r = riepilogo(MESE_CORR), [y, m] = MESE_CORR.split("-").map(Number);
    const g = +OGGI.slice(8), tot = giorniMese(y, m), variabili = r.spese - r.fisse;
    const fut = somma(occorrenze(addGiorni(OGGI, 1), `${MESE_CORR}-${pad(tot)}`).filter(o => o.r.tipo === "uscita" && gruppoDi(o.r.categoria) !== "risparmio").map(o => o.r.importo));
    const ritmo = g >= 10 ? variabili / g : previsione(90).vg;
    return r.fisse + fut + variabili + ritmo * (tot - g);
  });
}

function disponibileCat(c, ym, depth = 0) {
  return memo("d|" + c.nome + "|" + ym, () => {
    const b = c.budget || 0;
    if (!c.rollover || depth > 23 || ym <= primoGiorno().slice(0, 7)) return b;
    const prev = shiftMese(ym, -1);
    return b + disponibileCat(c, prev, depth + 1) - (riepilogo(prev).perCat[c.nome] || 0);
  });
}

function coperturaEmergenza() {
  return memo("em", () => {
    const liq = liquidita();
    const prec = [1, 2, 3].map(k => riepilogo(shiftMese(MESE_CORR, -k)).spese).filter(v => v > 0);
    const media = prec.length ? somma(prec) / prec.length : riepilogo(MESE_CORR).spese;
    return { liq, media, mesi: media ? liq / media : NaN };
  });
}

function effettoLiquido(x) {
  if (x.tipo === "entrata") return isLiquido(x.contoId) ? x.importo : 0;
  if (x.tipo === "uscita") return isLiquido(x.contoId) ? -x.importo : 0;
  return (isLiquido(x.contoDestId) ? x.importo : 0) - (isLiquido(x.contoId) ? x.importo : 0);
}

function previsione(giorni = 90) {
  return memo("prev" + giorni, () => {
    let v = liquidita();
    const inizio = addGiorni(OGGI, -89), primo = primoGiorno();
    const da = primo > inizio ? primo : inizio;
    const nGiorni = Math.max(7, diffGiorni(da, OGGI) + 1);
    const variabili = somma(S.movimenti.filter(m => m.tipo === "uscita" && !m.ricorrenteId && m.data >= da && m.data <= OGGI && gruppoDi(m.categoria) !== "risparmio").map(m => m.importo));
    const vg = variabili / nGiorni;
    const occ = occorrenze(addGiorni(OGGI, 1), addGiorni(OGGI, giorni));
    const perG = {};
    for (const o of occ) perG[o.data] = (perG[o.data] || 0) + effettoLiquido(o.r);
    const serie = [{ d: OGGI, v }];
    let min = { d: OGGI, v };
    for (let i = 1; i <= giorni; i++) {
      const d = addGiorni(OGGI, i);
      v += (perG[d] || 0) - vg;
      serie.push({ d, v });
      if (v < min.v) min = { d, v };
    }
    return { serie, min, vg, occ, iniziale: serie[0].v, finale: v };
  });
}

function disponibileOggi() {
  return memo("oggi", () => {
    const r = riepilogo(MESE_CORR);
    const [y, m] = MESE_CORR.split("-").map(Number);
    const fine = `${MESE_CORR}-${pad(giorniMese(y, m))}`;
    const giorniRim = diffGiorni(OGGI, fine) + 1;
    const occ = occorrenze(addGiorni(OGGI, 1), fine);
    const entrateFut = somma(occ.filter(o => o.r.tipo === "entrata").map(o => o.r.importo));
    const usciteFut = somma(occ.filter(o => o.r.tipo === "uscita").map(o => o.r.importo));
    const quotaObiettivi = somma(S.obiettivi.filter(o => o.scadenza && o.scadenza >= OGGI && o.accumulato < o.target).map(o => (o.target - o.accumulato) / mesiA(o.scadenza)));
    const entrateTot = r.entrate + entrateFut;
    const speso = r.spese + r.risparmio;
    const libero = entrateTot - speso - usciteFut - quotaObiettivi;
    return { giorno: libero / giorniRim, libero, giorniRim, entrateTot, usciteFut, quotaObiettivi, speso, entrateFut };
  });
}
function mesiA(iso) {
  const [ys, ms] = iso.split("-").map(Number), [yc, mc] = MESE_CORR.split("-").map(Number);
  return Math.max(1, (ys - yc) * 12 + (ms - mc) + 1);
}

/* ---------------- Categorie automatiche ---------------- */
function indovinaCategoria(desc, tipo) {
  const d = norm(desc);
  const ok = n => catPerTipo(tipo).some(c => c.nome === n);
  if (d.trim()) {
    for (const r of S.regole) if (d.includes(norm(r.parola)) && ok(r.categoria)) return r.categoria;
    const k = chiave(desc);
    if (k) for (let i = S.movimenti.length - 1; i >= 0; i--) {
      const m = S.movimenti[i];
      if (m.tipo === tipo && m.categoria && chiave(m.descrizione) === k && ok(m.categoria)) return m.categoria;
    }
    for (const [cat, res] of Object.entries(PAROLE_RE)) if (ok(cat) && res.some(re => re.test(d))) return cat;
  }
  const def = tipo === "entrata" ? "Altre entrate" : "Altro";
  return ok(def) ? def : (catPerTipo(tipo)[0] || {}).nome;
}

function parseVeloce(txt) {
  let t = " " + txt + " ";
  const out = { tipo: "uscita", data: OGGI, importo: null, tags: [], descrizione: "", forzaEntrata: false };
  t = t.replace(/#([\p{L}\d_-]+)/gu, (_, x) => { out.tags.push(x.toLowerCase()); return " "; });
  if (/^\s*\+/.test(t)) { out.tipo = "entrata"; out.forzaEntrata = true; t = t.replace(/^\s*\+/, " "); }
  if (/\b(l'altro ieri|altroieri)\b/i.test(t)) { out.data = addGiorni(OGGI, -2); t = t.replace(/l'altro ieri|altroieri/i, " "); }
  else if (/(^|\s)ieri(\s|$)/i.test(t)) { out.data = addGiorni(OGGI, -1); t = t.replace(/(^|\s)ieri(\s|$)/i, " "); }
  else if (/(^|\s)oggi(\s|$)/i.test(t)) t = t.replace(/(^|\s)oggi(\s|$)/i, " ");
  const md = t.match(/(^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/);
  if (md) {
    const y = md[4] ? (md[4].length === 2 ? 2000 + +md[4] : +md[4]) : +OGGI.slice(0, 4);
    const iso = parseData(`${md[2]}/${md[3]}/${y}`);
    if (iso) { out.data = iso; t = t.replace(md[0], " "); }
  }
  const ma = t.match(/(^|\s)[+-]?€?\s?(\d+(?:[.,]\d{1,2})?)\s?(€|euro)?(?=\s)/i);
  if (ma) { out.importo = parseFloat(ma[2].replace(",", ".")); t = t.replace(ma[0], " "); }
  out.descrizione = t.replace(/\s+/g, " ").trim();
  if (/\b(stipendio|entrata|ricevuto|rimborso|incasso|accredito)\b/i.test(out.descrizione)) out.tipo = "entrata";
  out.categoria = indovinaCategoria(out.descrizione, out.tipo);
  return out;
}

/* ---------------- Abbonamenti rilevati ---------------- */
function rilevaAbbonamenti() {
  return memo("abb", () => {
    const da = shiftMese(MESE_CORR, -6) + "-01";
    const gruppi = {};
    for (const m of S.movimenti) {
      if (m.tipo !== "uscita" || m.ricorrenteId || m.data < da) continue;
      const k = chiave(m.descrizione);
      if (!k || k.length < 3) continue;
      (gruppi[k] = gruppi[k] || []).push(m);
    }
    const esistenti = new Set(S.ricorrenti.map(r => chiave(r.descrizione)));
    const out = [];
    for (const [k, ms] of Object.entries(gruppi)) {
      if (esistenti.has(k) || S.ignorati.includes(k)) continue;
      const mesi = new Set(ms.map(m => m.data.slice(0, 7)));
      if (mesi.size < 3 || ms.length > mesi.size * 1.5) continue;
      const imp = ms.map(m => m.importo).sort((a, b) => a - b), med = imp[Math.floor(imp.length / 2)];
      if (imp.filter(v => Math.abs(v - med) <= med * .1).length < ms.length * .8) continue;
      const giorni = ms.map(m => +m.data.slice(8)).sort((a, b) => a - b);
      if (giorni[giorni.length - 1] - giorni[0] > 6 && !(giorni[0] <= 3 && giorni[giorni.length - 1] >= 26)) continue;
      const ultimo = ms.reduce((a, m) => (m.data > a.data ? m : a));
      out.push({ k, desc: ultimo.descrizione, importo: med, categoria: ultimo.categoria, contoId: ultimo.contoId, volte: ms.length, ultimo: ultimo.data });
    }
    return out.sort((a, b) => b.importo - a.importo);
  });
}

/* ---------------- Debiti ---------------- */
function simulaDebiti(debiti, extra, strategia) {
  const ds = debiti.map(d => ({ ...d, saldo: +d.saldo, tasso: +d.tasso || 0, rata: +d.rata || 0 }));
  const budgetMese = somma(ds.map(d => d.rata)) + (strategia === "minimo" ? 0 : extra);
  let mese = 0, interessi = 0;
  const ordine = [];
  while (ds.some(d => d.saldo > .005) && mese < 600) {
    mese++;
    let budget = strategia === "minimo" ? somma(ds.filter(d => d.saldo > .005).map(d => d.rata)) : budgetMese;
    for (const d of ds) if (d.saldo > .005) { const i = d.saldo * d.tasso / 1200; d.saldo += i; interessi += i; }
    for (const d of ds) if (d.saldo > .005) { const p = Math.min(d.rata, d.saldo, budget); d.saldo -= p; budget -= p; }
    if (strategia !== "minimo") {
      const att = ds.filter(d => d.saldo > .005).sort(strategia === "valanga" ? (a, b) => b.tasso - a.tasso || a.saldo - b.saldo : (a, b) => a.saldo - b.saldo || b.tasso - a.tasso);
      for (const d of att) { if (budget <= .005) break; const p = Math.min(budget, d.saldo); d.saldo -= p; budget -= p; }
    }
    for (const d of ds) if (d.saldo <= .005 && !d.chiuso) { d.chiuso = mese; ordine.push({ nome: d.nome, mese }); }
  }
  return { mesi: mese, interessi, ordine, impossibile: mese >= 600 };
}

/* ---------------- Grafici ---------------- */
function niceStep(range) {
  const raw = Math.max(range, 1) / 4, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
function sparkline(vals, col) {
  if (vals.length < 2) return "";
  const W = 90, H = 30, min = Math.min(...vals), max = Math.max(...vals), sp = max - min || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - 3 - ((v - min) / sp) * (H - 6)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function graficoFlusso(mesi, sel) {
  const dati = mesi.map(m => { const r = riepilogo(m); return { m, e: r.entrate, u: r.spese, n: r.risparmiato }; });
  let max = Math.max(1, ...dati.flatMap(d => [d.e, d.u]));
  let minN = Math.min(0, ...dati.map(d => d.n));
  const step = niceStep(max - minN);
  max = Math.ceil(max / step) * step; minN = Math.floor(minN / step) * step;
  const W = 680, H = 270, top = 12, bottom = 26, ch = H - top - bottom, bw = W / mesi.length;
  const y = v => top + ch - ((v - minN) / (max - minN)) * ch;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart">`;
  for (let v = minN; v <= max + step / 2; v += step) {
    const yy = y(v);
    s += `<line x1="0" x2="${W}" y1="${yy}" y2="${yy}" class="grid-line"${Math.abs(v) < 1e-9 ? ' style="stroke-dasharray:none"' : ""}/><text x="0" y="${yy - 5}">${euroK(v)}</text>`;
  }
  const w = Math.min(16, bw * .26);
  const linea = [];
  dati.forEach((d, i) => {
    const x = i * bw, cx = x + bw / 2, op = !sel || d.m === sel ? 1 : .5, y0 = y(0);
    s += `<g class="bar-g" data-act="mese" data-m="${d.m}" style="cursor:pointer" opacity="${op}">
      <rect class="hit" x="${x + 2}" y="${top}" width="${bw - 4}" height="${ch}" rx="10" fill="transparent"/>
      <rect x="${cx - w - 2}" y="${y(d.e)}" width="${w}" height="${Math.max(0, y0 - y(d.e))}" rx="${w / 3}" fill="var(--pos)"/>
      <rect x="${cx + 2}" y="${y(d.u)}" width="${w}" height="${Math.max(0, y0 - y(d.u))}" rx="${w / 3}" fill="var(--neg)"/>
      <title>${cap(nomeMese(d.m, 1))}&#10;Entrate ${euro(d.e)}&#10;Spese ${euro(d.u)}&#10;Risparmiato ${euro(d.n)}</title></g>
      <text x="${cx}" y="${H - 6}" text-anchor="middle"${d.m === sel ? ' style="fill:var(--text);font-weight:700"' : ""}>${nomeMese(d.m)}</text>`;
    linea.push(`${cx},${y(d.n)}`);
  });
  s += `<polyline points="${linea.join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" pointer-events="none"/>`;
  dati.forEach((d, i) => (s += `<circle cx="${i * bw + bw / 2}" cy="${y(d.n)}" r="3.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2" pointer-events="none"/>`));
  return s + "</svg>";
}

function graficoPrevisione(p, idG, H = 200) {
  const W = 680, top = 14, bottom = 24, n = p.serie.length - 1;
  const vals = p.serie.map(s => s.v);
  let min = Math.min(0, ...vals), max = Math.max(...vals, 1);
  const step = niceStep(max - min);
  max = Math.ceil(max / step) * step; min = Math.floor(min / step) * step;
  const xs = i => (i / n) * W, ys = v => top + (1 - (v - min) / (max - min)) * (H - top - bottom);
  const pts = p.serie.map((s, i) => `${xs(i).toFixed(1)},${ys(s.v).toFixed(1)}`).join(" ");
  const col = p.min.v < 0 ? "var(--neg)" : "var(--accent)";
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart"><defs><linearGradient id="${idG}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".3"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>`;
  for (let v = min; v <= max + step / 2; v += step) { const y = ys(v); s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" class="grid-line"/><text x="0" y="${y - 5}">${euroK(v)}</text>`; }
  if (min < 0) s += `<line x1="0" x2="${W}" y1="${ys(0)}" y2="${ys(0)}" stroke="var(--neg)" stroke-dasharray="5 4" opacity=".7"/>`;
  s += `<polygon points="0,${ys(min)} ${pts} ${W},${ys(min)}" fill="url(#${idG})"/>`;
  s += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`;
  [0, 30, 60, 90].filter(i => i <= n).forEach(i => (s += `<text x="${xs(i)}" y="${H - 5}" text-anchor="${i === 0 ? "start" : i === n ? "end" : "middle"}">${i === 0 ? "Oggi" : fmtBreve(p.serie[i].d)}</text>`));
  const mi = p.serie.findIndex(x => x.d === p.min.d);
  s += `<circle cx="${xs(mi)}" cy="${ys(p.min.v)}" r="5" fill="${col}" stroke="var(--surface)" stroke-width="2.5"><title>Punto più basso: ${fmtData(p.min.d)} · ${euro(p.min.v)}</title></circle>`;
  s += `<circle cx="${xs(n)}" cy="${ys(p.finale)}" r="4" fill="var(--surface)" stroke="${col}" stroke-width="2.5"><title>Fra ${n} giorni: ${euro(p.finale)}</title></circle>`;
  return s + "</svg>";
}

function donut(items, totale, label) {
  const R = 72, C = 2 * Math.PI * R;
  let off = 0, s = `<svg viewBox="0 0 190 190" class="donut"><circle cx="95" cy="95" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="22"/>`;
  for (const it of items) {
    const len = (it.v / totale) * C;
    s += `<circle class="seg-c" cx="95" cy="95" r="${R}" fill="none" stroke="${it.colore}" stroke-width="22" stroke-dasharray="${Math.max(0, len - (items.length > 1 ? 2.5 : 0))} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 95 95)"><title>${esc(it.nome)}: ${euro(it.v)}</title></circle>`;
    off += len;
  }
  return s + `<text x="95" y="88" text-anchor="middle" class="donut-lbl">${label}</text><text x="95" y="112" text-anchor="middle" class="donut-val">${euroK(totale)} €</text></svg>`;
}

function calendario(ym) {
  const [y, m] = ym.split("-").map(Number), n = giorniMese(y, m), start = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const per = {};
  for (const x of S.movimenti) if (x.tipo === "uscita" && x.data.startsWith(ym) && gruppoDi(x.categoria) !== "risparmio") per[x.data] = (per[x.data] || 0) + x.importo;
  const max = Math.max(1, ...Object.values(per));
  let h = `<div class="cal">` + ["L", "M", "M", "G", "V", "S", "D"].map(d => `<div class="cal-h">${d}</div>`).join("") + "<div></div>".repeat(start);
  for (let d = 1; d <= n; d++) {
    const iso = `${ym}-${pad(d)}`, v = per[iso] || 0, int = v ? .18 + .82 * Math.sqrt(v / max) : 0;
    const st = v ? `background:color-mix(in srgb, var(--neg) ${Math.round(int * 100)}%, var(--surface-2));${int > .5 ? "color:#fff" : "color:var(--text)"}` : "";
    h += `<button class="cal-d${iso === OGGI ? " today" : ""}${iso > OGGI ? " fut" : ""}${filtroGiorno === iso ? " sel" : ""}" data-act="giorno" data-d="${iso}" style="${st}" title="${fmtData(iso)}${v ? " · " + euro(v) : " · nessuna spesa"}">${d}</button>`;
  }
  h += `</div><div class="cal-scale">meno ${[0, .3, .6, 1].map(i => `<span style="background:${i ? `color-mix(in srgb, var(--neg) ${Math.round((.18 + .82 * i) * 100)}%, var(--surface-2))` : "var(--surface-2)"}"></span>`).join("")} più</div>`;
  return { html: h, per };
}

/* ---------------- Stato UI ---------------- */
let pagina = "dashboard", meseSel = MESE_CORR, annoSel = +MESE_CORR.slice(0, 4);
let filtroGiorno = null, limiteLista = 250, IMP = null;

/* ---------------- Render: shell ---------------- */
function renderShell() {
  document.documentElement.dataset.theme = S.impostazioni.tema;
  document.body.classList.toggle("privacy", !!S.impostazioni.privacy);
  const r = riepilogo(MESE_CORR);
  const sforati = S.categorie.filter(c => c.budget > 0 && (r.perCat[c.nome] || 0) > disponibileCat(c, MESE_CORR)).length;
  const badge = { budget: sforati ? [sforati, ""] : null, pianificazione: rilevaAbbonamenti().length ? [rilevaAbbonamenti().length, "soft"] : null };
  $("nav").innerHTML = PAGES.map(([id, nome, ic], i) => `<button class="nav-item${pagina === id ? " active" : ""}" data-goto="${id}" title="${nome} (${i + 1})">${icon(ic, 19)}<span>${nome}</span>${badge[id] ? `<span class="badge ${badge[id][1]}">${badge[id][0]}</span>` : ""}</button>`).join("");
  $("btnPrivacy").innerHTML = `${icon(S.impostazioni.privacy ? "eyeOff" : "eye", 19)}<span>${S.impostazioni.privacy ? "Mostra importi" : "Nascondi importi"}</span>`;
  const t = S.impostazioni.tema;
  $("btnTema").innerHTML = `${icon(t === "dark" ? "moon" : t === "light" ? "sun" : "auto", 19)}<span>Tema: ${t === "dark" ? "scuro" : t === "light" ? "chiaro" : "automatico"}</span>`;
  const pn = patrimonio();
  $("sideCard").innerHTML = `<b class="money">${euro(pn)}</b>patrimonio netto · ${S.conti.length} ${S.conti.length === 1 ? "conto" : "conti"}<div id="syncSide" style="margin-top:6px"></div>`;
  aggiornaSyncUI();
  const p = PAGES.find(p => p[0] === pagina);
  $("pageTitle").textContent = p[1];
  $("pageSub").textContent = p[3];
  $("mLabel").textContent = nomeMese(meseSel, 1);
  $("monthSwitch").hidden = !["dashboard", "movimenti", "budget"].includes(pagina);
  qsa(".page").forEach(s => (s.hidden = s.dataset.page !== pagina));
  const b = $("banner");
  if (DEMO) { b.hidden = false; b.innerHTML = `${icon("info")} Anteprima con dati di esempio: le modifiche non vengono salvate.<a class="btn sm" href="${location.pathname}">Esci dall'anteprima</a>`; }
  else b.hidden = true;
}

/* ---------------- Render: panoramica ---------------- */
function renderDashboard() {
  const ym = meseSel, r = riepilogo(ym), prev = riepilogo(shiftMese(ym, -1));
  // Hero
  const h = $("hero");
  if (ym === MESE_CORR) {
    const o = disponibileOggi();
    if (!o.entrateTot) {
      h.innerHTML = `<div class="hero-top"><div class="hero-label">${icon("spark")} Puoi spendere oggi</div><div class="hero-value">—</div><div class="hero-sub">Aggiungi le entrate del mese (meglio come ricorrente) e calcolo quanto puoi spendere ogni giorno senza sforare.</div></div>
        <div class="btn-row"><button class="btn sm" data-goto="pianificazione">Aggiungi lo stipendio</button><button class="btn sm ghost" style="color:#fff;border-color:rgba(255,255,255,.4)" data-act="demo">Prova con dati di esempio</button></div>`;
    } else {
      const usato = Math.min(1, Math.max(0, (o.speso + o.usciteFut + o.quotaObiettivi) / o.entrateTot));
      h.innerHTML = `<div class="hero-top"><div class="hero-label">${icon("spark")} Puoi spendere oggi <span class="pill">${o.giorniRim} ${o.giorniRim === 1 ? "giorno" : "giorni"} a fine mese</span></div>
        <div class="hero-value money">${euro(Math.max(0, o.giorno))}</div>
        <div class="hero-sub">${o.libero >= 0 ? `Ti restano <b class="money">${euro(o.libero)}</b> liberi fino a fine mese, già tolte le spese fisse in arrivo${o.quotaObiettivi ? " e la quota per gli obiettivi" : ""}.` : `Sei sotto di <b class="money">${euro(-o.libero)}</b> rispetto alle entrate del mese: rallenta le spese non essenziali.`}</div></div>
        <div class="hero-bar"><div style="width:${usato * 100}%"></div></div>
        <div class="hero-foot"><span>Speso <b class="money">${euro(o.speso)}</b></span><span>Fisse in arrivo <b class="money">${euro(o.usciteFut)}</b></span><span>Entrate <b class="money">${euro(o.entrateTot)}</b></span></div>`;
    }
  } else {
    h.innerHTML = `<div class="hero-top"><div class="hero-label">${icon("chart")} Bilancio di ${nomeMese(ym, 1)}</div>
      <div class="hero-value money">${r.risparmiato >= 0 ? "+" : "−"}${euro(Math.abs(r.risparmiato))}</div>
      <div class="hero-sub">${r.entrate ? `Hai messo da parte il <b>${pct(r.tasso)}</b> di quello che hai guadagnato.` : "Nessuna entrata registrata in questo mese."}</div></div>
      <div class="hero-bar"><div style="width:${r.entrate ? Math.min(100, (r.spese / r.entrate) * 100) : 0}%"></div></div>
      <div class="hero-foot"><span>Entrate <b class="money">${euro(r.entrate)}</b></span><span>Spese <b class="money">${euro(r.spese)}</b></span></div>`;
  }

  // KPI
  const mesi6 = [...Array(6)].map((_, i) => shiftMese(ym, i - 5));
  const fine = m => m + "-31";
  const pn = patrimonio(ym === MESE_CORR ? undefined : fine(ym)), pnPrev = patrimonio(fine(shiftMese(ym, -1)));
  const delta = (cur, old, buonoSu = true, tipo = "pct") => {
    if (!old && !cur) return `<span class="delta flat">—</span>`;
    let v, txt;
    if (tipo === "pt") { v = (cur - old) * 100; if (!isFinite(v)) return `<span class="delta flat">—</span>`; txt = (v >= 0 ? "+" : "") + v.toFixed(0) + " pt"; }
    else if (tipo === "abs") { v = cur - old; txt = (v >= 0 ? "+" : "−") + euroK(Math.abs(v)) + " €"; }
    else { if (!old) return `<span class="delta flat">nuovo</span>`; v = (cur - old) / Math.abs(old); txt = (v >= 0 ? "+" : "") + Math.round(v * 100) + "%"; }
    const cls = Math.abs(v) < .005 ? "flat" : (v > 0) === buonoSu ? "good" : "bad";
    return `<span class="delta ${cls}">${txt}</span>`;
  };
  const eaK = entrateAttese(ym), tassoK = eaK.tot ? (eaK.tot - r.spese) / eaK.tot : NaN;
  const kpi = (titolo, ic, col, val, d, spark) => `<div class="card kpi"><div class="kpi-top">${titolo}<span class="kpi-ic" style="background:color-mix(in srgb, ${col} 14%, transparent);color:${col}">${icon(ic, 16)}</span></div>
    <div class="kpi-val">${val}</div><div class="kpi-foot">${d}${spark}</div></div>`;
  $("kpis").innerHTML = [
    kpi("Patrimonio netto", "wallet", "var(--accent)", money(pn), delta(pn, pnPrev, true, "abs"), sparkline(mesi6.map(m => patrimonio(m === MESE_CORR ? undefined : fine(m))), "var(--accent)")),
    kpi("Entrate", "trend", "var(--pos)", money(r.entrate), delta(r.entrate, prev.entrate, true), sparkline(mesi6.map(m => riepilogo(m).entrate), "var(--pos)")),
    kpi("Spese", "card", "var(--neg)", money(r.spese), delta(r.spese, prev.spese, false), sparkline(mesi6.map(m => riepilogo(m).spese), "var(--neg)")),
    kpi(eaK.future ? "Tasso di risparmio previsto" : "Tasso di risparmio", "piggy", "var(--warn)", isFinite(tassoK) ? pct(tassoK) : "—", delta(tassoK, prev.tasso, true, "pt"), sparkline(mesi6.map(m => (m === ym ? tassoK : riepilogo(m).tasso) || 0), "var(--warn)")),
  ].join("");

  $("chFlusso").innerHTML = graficoFlusso([...Array(12)].map((_, i) => shiftMese(ym, i - 11)), ym);

  // Donut
  const cats = Object.entries(r.perCat).sort((a, b) => b[1] - a[1]);
  const totU = somma(cats.map(c => c[1]));
  if (!cats.length) $("donut").innerHTML = `<div class="empty"><span class="big-emoji">🍩</span>Nessuna uscita in ${nomeMese(ym, 1)}</div>`;
  else {
    let items = cats.slice(0, 6).map(([c, v]) => ({ nome: c, v, colore: catInfo(c).colore, icona: catInfo(c).icona }));
    if (cats.length > 6) items.push({ nome: "Altre", v: somma(cats.slice(6).map(c => c[1])), colore: "#94a3b8", icona: "•••" });
    $("donut").innerHTML = `<div class="donut-wrap">${donut(items, totU, "uscite del mese")}<div class="leg-list">${items.map(it => `<div class="leg-row"><span class="e">${it.icona}</span><span>${esc(it.nome)}</span><b class="num">${money(it.v)}</b><span class="p">${pct(it.v / totU)}</span></div>`).join("")}</div></div>`;
  }

  // Calendario
  const cal = calendario(ym);
  $("calendario").innerHTML = cal.html;
  const vals = Object.values(cal.per), [yy, mm] = ym.split("-").map(Number);
  const giorniTrascorsi = ym === MESE_CORR ? +OGGI.slice(8) : ym < MESE_CORR ? giorniMese(yy, mm) : 0;
  $("calInfo").innerHTML = giorniTrascorsi ? `media <b class="money">${euro(somma(vals) / giorniTrascorsi)}</b>/giorno · ${giorniTrascorsi - vals.length} giorni a zero` : "";

  // In arrivo
  const occ = occorrenze(addGiorni(OGGI, 1), addGiorni(OGGI, 30)).slice(0, 6);
  $("inArrivo").innerHTML = occ.length ? occ.map(o => {
    const r2 = o.r, d = toDate(o.data);
    return `<div class="tx static"><div class="date-badge"><b>${d.getDate()}</b><span>${d.toLocaleDateString("it-IT", { month: "short" })}</span></div>
      <div class="tx-main"><div class="tx-desc">${esc(r2.descrizione)}</div><div class="tx-meta">fra ${diffGiorni(OGGI, o.data)} ${diffGiorni(OGGI, o.data) === 1 ? "giorno" : "giorni"}</div></div>
      <div class="tx-amt ${r2.tipo === "entrata" ? "pos" : ""}">${r2.tipo === "entrata" ? "+" : r2.tipo === "uscita" ? "−" : ""}${money(r2.importo)}</div><span></span></div>`;
  }).join("") : `<div class="empty"><span class="big-emoji">📅</span>Nessuna scadenza nei prossimi 30 giorni.<button class="btn sm" data-goto="pianificazione">Aggiungi ricorrenti</button></div>`;

  // Consigli
  $("consigli").innerHTML = consigli(ym).slice(0, 6).map(c => `<li class="ins-${c.t}"><span class="ins-ic">${icon({ ok: "check", warn: "alert", bad: "alert", info: "spark" }[c.t], 15)}</span><div>${c.h}</div></li>`).join("");

  // Previsione
  $("chPrev").innerHTML = graficoPrevisione(previsione(90), "gPrevD", 190);

  // 50/30/20 (nel mese corrente considera anche le entrate ricorrenti in arrivo)
  const ea = entrateAttese(ym), E = ea.tot;
  $("regola").innerHTML = !E ? `<div class="empty">Registra le entrate del mese per vedere l'analisi.</div>` : [
    ["🏠 Necessità", r.necessita / E, .5, "max"], ["🎉 Desideri", r.desideri / E, .3, "max"], ["🐷 Risparmio", (E - r.spese) / E, .2, "min"],
  ].map(([n, v, t, dir]) => {
    const ok = dir === "max" ? v <= t : v >= t;
    return `<div class="rule"><div class="rule-top"><span>${n}</span><span><b class="${ok ? "pos" : "neg"}">${pct(v)}</b> <span class="faint small">${dir === "max" ? "max" : "min"} ${pct(t)}</span></span></div>
      <div class="progress"><div style="width:${Math.max(0, Math.min(100, v * 100))}%;background:${ok ? "var(--pos)" : "var(--neg)"}"></div><span class="marker" style="left:${t * 100}%"></span></div></div>`;
  }).join("") + (ea.future ? `<p class="hint" style="margin:14px 0 0">Calcolata sulle entrate previste del mese (<span class="money">${euro(E)}</span>), comprese quelle ricorrenti ancora in arrivo.</p>` : "");
}

function consigli(ym) {
  const r = riepilogo(ym), c = [], em = coperturaEmergenza();
  if (!S.movimenti.length) {
    c.push({ t: "info", h: "Benvenuto! Inizia da <b>Conti</b> con i saldi attuali, poi aggiungi stipendio e spese fisse in <b>Pianificazione</b>." });
    c.push({ t: "info", h: `Hai già un estratto conto? <a class="link" data-goto="impostazioni">Importa il CSV della banca</a> e lo categorizzo io.` });
    c.push({ t: "info", h: `Vuoi vedere come funziona? <a class="link" data-act="demo">Carica i dati di esempio</a>.` });
    return c;
  }
  if (ym === MESE_CORR) {
    const p = previsione(90);
    if (p.min.v < 0) c.push({ t: "bad", h: `Il saldo previsto va sotto zero il <b>${fmtData(p.min.d)}</b> (<span class="money">${euro(p.min.v)}</span>). Sposta fondi o rimanda qualche spesa.` });
  }
  const sforati = S.categorie.filter(k => k.budget > 0 && (r.perCat[k.nome] || 0) > disponibileCat(k, ym));
  if (sforati.length) c.push({ t: "bad", h: `Budget superato in ${sforati.map(k => `<b>${esc(k.nome)}</b> (+<span class="money">${euro(r.perCat[k.nome] - disponibileCat(k, ym))}</span>)`).join(", ")}.` });
  const E = entrateAttese(ym).tot, ris = E - r.spese, tasso = E ? ris / E : NaN, prev = ym === MESE_CORR ? previsioneSpese() : r.spese;
  if (E) {
    if (ym === MESE_CORR && prev > E) c.push({ t: "bad", h: `Al ritmo attuale chiuderai il mese con circa <b class="money">${euro(prev)}</b> di spese, più delle entrate previste.` });
    else if (tasso >= .2) c.push({ t: "ok", h: `${ym === MESE_CORR ? "Per ora stai" : "Hai"} messo da parte il <b>${pct(tasso)}</b> delle entrate${ym === MESE_CORR ? " previste" : ""}, sopra il 20% consigliato.` });
    else if (tasso >= 0) c.push({ t: "warn", h: `Risparmi il <b>${pct(tasso)}</b> delle entrate. Per arrivare al 20% ti servono <span class="money">${euro(E * .2 - ris)}</span> di spese in meno.` });
    else c.push({ t: "bad", h: `Hai speso <b class="money">${euro(-ris)}</b> più di quanto hai guadagnato.` });
  }
  let peggiore = null;
  for (const [cat, v] of Object.entries(r.perCat)) {
    if (gruppoDi(cat) === "risparmio") continue;
    const media = somma([1, 2, 3].map(k => riepilogo(shiftMese(ym, -k)).perCat[cat] || 0)) / 3;
    if (media > 0 && v > media * 1.3 && v - media > 25 && (!peggiore || v - media > peggiore.d)) peggiore = { cat, d: v - media, media };
  }
  if (peggiore) c.push({ t: "warn", h: `<b>${esc(peggiore.cat)}</b>: <span class="money">${euro(peggiore.d)}</span> in più della tua media degli ultimi 3 mesi.` });
  if (isFinite(em.mesi)) {
    if (em.mesi < 3) c.push({ t: "warn", h: `La liquidità copre <b>${em.mesi.toFixed(1)} mesi</b> di spese. Punta a un fondo di emergenza di 3–6 mesi.` });
    else if (em.mesi > 12) c.push({ t: "info", h: `Hai liquidità per <b>${Math.round(em.mesi)} mesi</b>. Valuta se una parte può rendere di più, per esempio con un conto deposito o investimenti a lungo termine.` });
    else c.push({ t: "ok", h: `Fondo di emergenza solido: <b>${em.mesi.toFixed(1)} mesi</b> di spese coperti.` });
  }
  const abb = rilevaAbbonamenti();
  if (abb.length) c.push({ t: "info", h: `Ho trovato <b>${abb.length}</b> ${abb.length === 1 ? "pagamento che sembra un abbonamento" : "pagamenti che sembrano abbonamenti"}. <a class="link" data-goto="pianificazione">Controlla</a>` });
  const fisse = somma(S.ricorrenti.filter(x => x.tipo === "uscita").map(equivalenteMensile));
  const abbTot = somma(S.ricorrenti.filter(x => x.tipo === "uscita" && x.categoria === "Abbonamenti").map(x => equivalenteMensile(x) * 12));
  if (abbTot > 0) c.push({ t: "info", h: `Gli abbonamenti ti costano <b class="money">${euro(abbTot)}</b> l'anno. Quali usi davvero?` });
  if (fisse && r.entrate && fisse / r.entrate > .55) c.push({ t: "warn", h: `Le spese fisse (<span class="money">${euro(fisse)}</span>/mese) superano metà delle entrate: rivedi contratti e abbonamenti.` });
  if (S.debiti.length) {
    const val = simulaDebiti(S.debiti, S.impostazioni.extraDebiti, "valanga"), min = simulaDebiti(S.debiti, 0, "minimo");
    if (min.interessi - val.interessi > 50) c.push({ t: "info", h: `Con il piano debiti risparmi <b class="money">${euro(min.interessi - val.interessi)}</b> di interessi. <a class="link" data-goto="debiti">Vedi</a>` });
  }
  for (const o of S.obiettivi) if (o.accumulato < o.target && o.scadenza && o.scadenza < OGGI) c.push({ t: "warn", h: `L'obiettivo <b>${esc(o.nome)}</b> è scaduto: mancano <span class="money">${euro(o.target - o.accumulato)}</span>.` });
  if (!S.categorie.some(k => k.budget > 0) && S.movimenti.length > 10) c.push({ t: "info", h: `Non hai ancora un budget. <a class="link" data-goto="budget">Generalo dalle tue abitudini</a> con un clic.` });
  if (!c.length) c.push({ t: "ok", h: "Tutto sotto controllo. Continua così!" });
  const ord = { bad: 0, warn: 1, ok: 2, info: 3 };
  return c.sort((a, b) => ord[a.t] - ord[b.t]);
}

/* ---------------- Render: movimenti ---------------- */
function rigaMov(m) {
  const tr = m.tipo === "trasferimento";
  const c = tr ? { icona: "⇄", colore: "#64748b", nome: "Trasferimento" } : catInfo(m.categoria);
  const meta = tr ? `${esc(nomeConto(m.contoId))} → ${esc(nomeConto(m.contoDestId))}` : esc(c.nome) + (S.conti.length > 1 ? ` · ${esc(nomeConto(m.contoId))}` : "");
  const tags = (m.tags || []).map(t => `<span class="tag" data-act="tag" data-t="${esc(t)}">#${esc(t)}</span>`).join("");
  return `<div class="tx" data-act="modMov" data-id="${m.id}">
    <div class="tx-ic" style="background:${c.colore}1f;color:${c.colore}">${c.icona}</div>
    <div class="tx-main"><div class="tx-desc">${esc(m.descrizione || c.nome)}${m.ricorrenteId ? `<span class="rec" title="Ricorrente">${icon("repeat", 13)}</span>` : ""}</div><div class="tx-meta">${meta}${tags}</div></div>
    <div class="tx-amt ${m.tipo === "entrata" ? "pos" : tr ? "muted" : ""}">${m.tipo === "entrata" ? "+" : tr ? "" : "−"}${money(m.importo)}</div>
    <button class="icon-btn del tx-del" data-act="delMov" data-id="${m.id}" title="Elimina">${icon("trash", 16)}</button></div>`;
}
function renderMovimenti() {
  const q = $("q").value.trim().toLowerCase(), qt = $("qTipo").value, qc = $("qCat").value, qa = $("qConto").value, tutti = $("qTutti").checked;
  const tag = q.startsWith("#") ? q.slice(1) : null;
  const lista = S.movimenti.filter(m =>
    (filtroGiorno ? m.data === filtroGiorno : tutti || m.data.startsWith(meseSel)) &&
    (!qt || m.tipo === qt) && (!qc || m.categoria === qc) && (!qa || m.contoId === qa || m.contoDestId === qa) &&
    (!q || (tag ? (m.tags || []).some(t => t.startsWith(tag)) : norm(m.descrizione).includes(norm(q)) || norm(m.categoria).includes(norm(q)) || String(m.importo).includes(q.replace(",", "."))))
  ).sort((a, b) => b.data.localeCompare(a.data) || (b.importo - a.importo));
  const chips = [];
  if (filtroGiorno) chips.push(`<span class="chip">📅 ${fmtGiorno(filtroGiorno)}<button data-act="clearGiorno">${icon("x", 14)}</button></span>`);
  if (tag) chips.push(`<span class="chip">#${esc(tag)}<button data-act="clearQ">${icon("x", 14)}</button></span>`);
  $("qChips").innerHTML = chips.join("");
  let ent = 0, usc = 0;
  for (const m of lista) { if (m.tipo === "entrata") ent += m.importo; else if (m.tipo === "uscita") usc += m.importo; }
  $("qSumm").innerHTML = `<div><small>Movimenti</small><b>${lista.length}</b></div><div><small>Entrate</small><b class="pos">${money(ent)}</b></div><div><small>Uscite</small><b class="neg">${money(usc)}</b></div><div><small>Netto</small><b class="${ent - usc >= 0 ? "pos" : "neg"}">${money(ent - usc)}</b></div>`;
  if (!lista.length) {
    $("listaMov").innerHTML = `<div class="empty"><span class="big-emoji">🧾</span>${S.movimenti.length ? "Nessun movimento con questi filtri." : "Ancora nessun movimento."}<button class="btn primary sm" data-act="nuovo">${icon("plus", 15)} Aggiungi movimento</button></div>`;
    return;
  }
  let h = "", giorno = null;
  const visibili = lista.slice(0, limiteLista);
  const totGiorno = {};
  for (const m of lista) totGiorno[m.data] = (totGiorno[m.data] || 0) + (m.tipo === "entrata" ? m.importo : m.tipo === "uscita" ? -m.importo : 0);
  for (const m of visibili) {
    if (m.data !== giorno) {
      giorno = m.data;
      const lbl = giorno === OGGI ? "Oggi" : giorno === addGiorni(OGGI, -1) ? "Ieri" : fmtGiorno(giorno);
      const t = totGiorno[giorno];
      h += `<div class="day-head"><span>${lbl}</span><span class="${t > 0 ? "pos" : ""}">${t ? (t > 0 ? "+" : "−") + money(Math.abs(t)) : ""}</span></div>`;
    }
    h += rigaMov(m);
  }
  if (lista.length > limiteLista) h += `<div class="empty"><button class="btn sm" data-act="altri">Mostra altri ${Math.min(250, lista.length - limiteLista)}</button></div>`;
  $("listaMov").innerHTML = h;
}

/* ---------------- Render: budget ---------------- */
function renderBudget() {
  const ym = meseSel, r = riepilogo(ym);
  const cats = S.categorie.filter(c => c.gruppo !== "entrata");
  let totB = 0, totS = 0, totDisp = 0;
  const html = ["necessita", "desideri", "risparmio"].map(g => {
    const cs = cats.filter(c => c.gruppo === g);
    if (!cs.length) return "";
    let gs = 0, gb = 0;
    const righe = cs.map(c => {
      const sp = r.perCat[c.nome] || 0, disp = disponibileCat(c, ym), riporto = disp - c.budget;
      totB += c.budget; totS += sp; gs += sp; gb += disp; if (disp) totDisp += disp - sp;
      const p = disp > 0 ? sp / disp : sp > 0 ? 1 : 0, rim = disp - sp;
      const col = g === "risparmio" ? "var(--pos)" : disp && rim < 0 ? "var(--neg)" : p > .85 ? "var(--warn)" : c.colore;
      const foot = disp ? (rim >= 0 ? `Restano <b class="${p > .85 && g !== "risparmio" ? "warn" : ""} money">${euro(rim)}</b>` : `Sforato di <b class="neg money">${euro(-rim)}</b>`) : sp ? "Nessun budget impostato" : "";
      return `<div class="brow">
        <div class="tx-ic" style="background:${c.colore}1f;color:${c.colore}">${c.icona}</div>
        <div><div class="brow-top"><b>${esc(c.nome)}</b><span class="num">${money(sp)}${disp ? ` <span class="faint">/ ${money(disp)}</span>` : ""}</span></div>
          <div class="progress"><div style="width:${disp ? Math.min(100, p * 100) : 0}%;background:${col}"></div></div>
          <div class="brow-foot small muted">${foot}${c.rollover && Math.abs(riporto) > .005 ? ` · riporto ${riporto > 0 ? "+" : "−"}<span class="money">${euro(Math.abs(riporto))}</span>` : ""}</div></div>
        <input type="number" class="b-in" min="0" step="10" data-cat="${esc(c.nome)}" value="${c.budget || ""}" placeholder="Budget €">
        <button class="icon-btn${c.rollover ? " on" : ""}" data-act="rollover" data-cat="${esc(c.nome)}" title="${c.rollover ? "Riporto attivo" : "Riporta il residuo al mese successivo"}">${icon("repeat", 16)}</button></div>`;
    }).join("");
    return `<div class="bgroup"><div class="bgroup-head"><span>${GRUPPI[g]}</span><span class="num">${money(gs)}${gb ? ` / ${money(gb)}` : ""}</span></div>${righe}</div>`;
  }).join("");
  $("budgetLista").innerHTML = html;
  const ea = entrateAttese(ym), da = ea.tot - totB;
  $("budgetTot").innerHTML = `
    <div class="stat"><small>${ea.future ? "Entrate previste" : "Entrate"} di ${nomeMese(ym)}</small><b class="pos money">${euro(ea.tot)}</b>${ea.future ? `<span>di cui <span class="money">${euro(ea.future)}</span> ancora in arrivo</span>` : ""}</div>
    <div class="stat"><small>Budget assegnato</small><b class="money">${euro(totB)}</b></div>
    <div class="stat"><small>Da assegnare</small><b class="money ${da < 0 ? "neg" : da > 0.005 ? "warn" : "pos"}">${euro(da)}</b><span>${da < 0 ? "hai assegnato più di quanto entra" : da > 0.005 ? "dai un compito anche a questi euro" : "ogni euro ha un compito ✓"}</span></div>
    <div class="stat"><small>Speso</small><b class="neg money">${euro(totS)}</b></div>
    <div class="stat"><small>Ancora disponibile</small><b class="money ${totDisp < 0 ? "neg" : ""}">${euro(totDisp)}</b></div>`;
}

/* ---------------- Render: obiettivi ---------------- */
function renderObiettivi() {
  $("goals").innerHTML = S.obiettivi.length ? S.obiettivi.map((o, i) => {
    const p = Math.min(1, o.target ? o.accumulato / o.target : 0), fatto = o.accumulato >= o.target, manca = Math.max(0, o.target - o.accumulato);
    const col = COLORI[(i * 5) % COLORI.length], R = 40, C = 2 * Math.PI * R;
    let info;
    if (fatto) info = "🎉 Obiettivo raggiunto!";
    else if (o.scadenza) {
      const n = mesiA(o.scadenza);
      info = o.scadenza < OGGI ? `⏰ Scaduto il ${fmtData(o.scadenza)}` : `Metti da parte <b class="money">${euro(manca / n)}</b> al mese per ${n} ${n === 1 ? "mese" : "mesi"} (entro il ${fmtData(o.scadenza)})`;
    } else info = `Mancano <b class="money">${euro(manca)}</b>`;
    return `<div class="card goal${fatto ? " done" : ""}">
      <div class="goal-top">
        <svg viewBox="0 0 100 100" class="ring"><circle cx="50" cy="50" r="${R}" stroke="var(--surface-2)" stroke-width="10" fill="none"/>
          <circle cx="50" cy="50" r="${R}" stroke="${fatto ? "var(--pos)" : col}" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${p * C} ${C}" transform="rotate(-90 50 50)"/>
          <text x="50" y="57" text-anchor="middle">${Math.round(p * 100)}%</text></svg>
        <div><div class="goal-name">${esc(o.icona || "🎯")} ${esc(o.nome)}</div><div class="goal-amt">${money(o.accumulato)}<span class="muted"> / ${money(o.target)}</span></div><div class="muted small">${info}</div></div>
        <button class="icon-btn del" data-act="delObj" data-id="${o.id}" title="Elimina">${icon("trash", 16)}</button>
      </div>
      <div class="goal-actions"><input type="number" step="0.01" min="0.01" placeholder="Importo €" id="v-${o.id}">
        <button class="btn sm primary" data-act="versa" data-id="${o.id}">+ Versa</button><button class="btn sm" data-act="preleva" data-id="${o.id}">− Preleva</button></div></div>`;
  }).join("") : `<div class="card empty" style="grid-column:1/-1"><span class="big-emoji">🎯</span><b>Nessun obiettivo, per ora.</b>Fondo di emergenza, vacanza, anticipo per la casa: dai un nome ai tuoi sogni e ti dico quanto mettere da parte ogni mese.</div>`;
}

/* ---------------- Render: pianificazione ---------------- */
function renderPianificazione() {
  const p = previsione(90);
  const val = k => p.serie[Math.min(k, p.serie.length - 1)].v;
  const stat = (t, v, cls, sub) => `<div class="stat"><small>${t}</small><b class="money ${cls || ""}">${v}</b>${sub ? `<span>${sub}</span>` : ""}</div>`;
  $("prevStats").innerHTML = stat("Oggi", euro(p.iniziale)) + stat("Fra 30 giorni", euro(val(30)), val(30) < 0 ? "neg" : "") + stat("Fra 60 giorni", euro(val(60)), val(60) < 0 ? "neg" : "") + stat("Fra 90 giorni", euro(val(90)), val(90) < 0 ? "neg" : "") +
    stat("Punto più basso", euro(p.min.v), p.min.v < 0 ? "neg" : "", fmtData(p.min.d));
  $("chPrev2").innerHTML = graficoPrevisione(p, "gPrevP", 230);
  $("prevNota").innerHTML = `La previsione considera i ricorrenti programmati e una spesa variabile media di <b class="money">${euro(p.vg)}</b> al giorno, calcolata sugli ultimi 90 giorni.`;

  const usc = somma(S.ricorrenti.filter(r => r.tipo === "uscita").map(equivalenteMensile));
  const ent = somma(S.ricorrenti.filter(r => r.tipo === "entrata").map(equivalenteMensile));
  $("ricTot").innerHTML = S.ricorrenti.length ? `entrate <b class="pos money">${euro(ent)}</b> · uscite <b class="neg money">${euro(usc)}</b> al mese` : "";
  $("ricLista").innerHTML = S.ricorrenti.length ? [...S.ricorrenti].sort((a, b) => a.prossima.localeCompare(b.prossima)).map(r => {
    const tr = r.tipo === "trasferimento", c = tr ? { icona: "⇄", colore: "#64748b", nome: "Trasferimento" } : catInfo(r.categoria);
    return `<div class="tx static"><div class="tx-ic" style="background:${c.colore}1f;color:${c.colore}">${c.icona}</div>
      <div class="tx-main"><div class="tx-desc">${esc(r.descrizione)}</div><div class="tx-meta">${FREQ[r.frequenza]} · prossima ${fmtBreve(r.prossima)} · ${tr ? `${esc(nomeConto(r.contoId))} → ${esc(nomeConto(r.contoDestId))}` : esc(c.nome)}</div></div>
      <div class="tx-amt ${r.tipo === "entrata" ? "pos" : ""}">${r.tipo === "entrata" ? "+" : r.tipo === "uscita" ? "−" : ""}${money(r.importo)}</div>
      <button class="icon-btn del" data-act="delRic" data-id="${r.id}" title="Interrompi">${icon("trash", 16)}</button></div>`;
  }).join("") : `<div class="empty"><span class="big-emoji">🔁</span>Nessun ricorrente. Inizia dallo stipendio e dall'affitto.</div>`;

  const abb = rilevaAbbonamenti();
  $("rilevati").innerHTML = abb.length ? abb.map(a => {
    const c = catInfo(a.categoria);
    return `<div class="tx static" style="grid-template-columns:42px minmax(0,1fr) auto auto"><div class="tx-ic" style="background:${c.colore}1f;color:${c.colore}">${c.icona}</div>
      <div class="tx-main"><div class="tx-desc">${esc(a.desc)}</div><div class="tx-meta">${a.volte} pagamenti negli ultimi 6 mesi · ultimo il ${fmtData(a.ultimo)} · ${esc(c.nome)}</div></div>
      <div class="tx-amt">${money(a.importo)}<span class="muted small">/mese</span></div>
      <div class="btn-row"><button class="btn sm primary" data-act="addAbb" data-k="${esc(a.k)}">Aggiungi</button><button class="btn sm ghost" data-act="ignAbb" data-k="${esc(a.k)}">Ignora</button></div></div>`;
  }).join("") : `<div class="empty">Nessun nuovo abbonamento rilevato. 👍</div>`;
}

/* ---------------- Render: debiti ---------------- */
function renderDebiti() {
  const ds = S.debiti, extra = +S.impostazioni.extraDebiti || 0;
  if (document.activeElement !== $("dExtra")) $("dExtra").value = extra;
  const tot = somma(ds.map(d => +d.saldo)), rate = somma(ds.map(d => +d.rata));
  const medio = tot ? somma(ds.map(d => d.saldo * d.tasso)) / tot : 0;
  $("debStats").innerHTML = `<div class="stat"><small>Debito totale</small><b class="neg money">${euro(tot)}</b></div>
    <div class="stat"><small>Rate minime al mese</small><b class="money">${euro(rate)}</b></div>
    <div class="stat"><small>Tasso medio ponderato</small><b>${medio.toFixed(2).replace(".", ",")}%</b></div>
    <div class="stat"><small>Interessi al mese (oggi)</small><b class="warn money">${euro(somma(ds.map(d => d.saldo * d.tasso / 1200)))}</b></div>`;
  $("debLista").innerHTML = ds.length ? ds.map(d => `<div class="tx static"><div class="tx-ic" style="background:#f43f5e1f;color:#f43f5e">💳</div>
      <div class="tx-main"><div class="tx-desc">${esc(d.nome)}</div><div class="tx-meta">TAN ${String(d.tasso).replace(".", ",")}% · rata <span class="money">${euro(d.rata)}</span>${d.saldo * d.tasso / 1200 >= d.rata ? ' · <b class="neg">la rata non copre gli interessi!</b>' : ""}</div></div>
      <input type="number" class="deb-in" step="0.01" min="0" value="${d.saldo}" data-deb="${d.id}" title="Debito residuo">
      <button class="icon-btn del" data-act="delDeb" data-id="${d.id}" title="Elimina">${icon("trash", 16)}</button></div>`).join("")
    : `<div class="empty"><span class="big-emoji">🎉</span>Nessun debito registrato.</div>`;
  if (!ds.length) { $("debPiano").innerHTML = `<p class="hint" style="margin:0">Aggiungi prestiti, finanziamenti o carte revolving: confronto le strategie e ti dico in quale ordine rimborsarli e quanto risparmi.</p>`; return; }
  const strat = [
    ["valanga", "🏔️ Valanga", "Prima il tasso più alto: paghi meno interessi in totale."],
    ["neve", "⛄ Palla di neve", "Prima il debito più piccolo: chiudi qualcosa subito e resti motivato."],
    ["minimo", "🐢 Solo rate minime", "Nessun extra: la situazione attuale."],
  ].map(([k, n, d]) => ({ k, n, d, ...simulaDebiti(ds, extra, k) }));
  const migliore = strat.filter(s => !s.impossibile && s.k !== "minimo").sort((a, b) => a.interessi - b.interessi || a.mesi - b.mesi)[0];
  const data = mesi => cap(nomeMese(shiftMese(MESE_CORR, mesi), 1));
  $("debPiano").innerHTML = `<div class="strat-grid">${strat.map(s => `<div class="strat${migliore && s.k === migliore.k ? " best" : ""}">${migliore && s.k === migliore.k ? '<span class="best-badge">Consigliata</span>' : ""}
      <h3>${s.n}</h3><p>${s.d}</p>
      ${s.impossibile ? `<div class="v neg">Mai</div><span class="small muted">le rate non coprono gli interessi</span>` : `<div class="v">${data(s.mesi)}</div><span class="small muted">${s.mesi} mesi · interessi <b class="money">${euro(s.interessi)}</b></span>`}</div>`).join("")}</div>
    ${migliore ? `<h3 style="margin:0 0 6px;font-size:14px">Ordine di rimborso consigliato</h3><p class="hint" style="margin:0 0 6px">Paga le rate minime su tutto e metti ogni euro in più, comprese le rate dei debiti già chiusi, sul primo della lista.</p>
    <div class="timeline">${migliore.ordine.map((o, i) => `<div class="tl-row"><span class="tl-n">${i + 1}</span><span><b>${esc(o.nome)}</b></span><span class="muted">estinto a ${data(o.mese)}</span></div>`).join("")}</div>
    ${strat[2].impossibile ? "" : `<p class="hint" style="margin:14px 0 0">Rispetto alle sole rate minime risparmi <b class="pos money">${euro(strat[2].interessi - migliore.interessi)}</b> di interessi e finisci <b>${strat[2].mesi - migliore.mesi} mesi</b> prima.</p>`}` : ""}`;
}

/* ---------------- Render: report ---------------- */
function renderReport() {
  const y = annoSel, a = riepilogoAnno(y), prevA = riepilogoAnno(y - 1);
  $("yLabel").textContent = y;
  const conDati = a.mesi.filter(r => r.n > 0);
  const nMesi = Math.max(1, conDati.length);
  const migliore = conDati.filter(r => r.entrate).sort((x, z) => z.tasso - x.tasso)[0];
  const varSp = prevA.spese ? (a.spese - prevA.spese) / prevA.spese : NaN;
  $("repStats").innerHTML = `<div class="stat"><small>Entrate ${y}</small><b class="pos money">${euro(a.entrate)}</b></div>
    <div class="stat"><small>Spese ${y}</small><b class="neg money">${euro(a.spese)}</b>${isFinite(varSp) ? `<span>${varSp >= 0 ? "+" : ""}${Math.round(varSp * 100)}% rispetto al ${y - 1}</span>` : ""}</div>
    <div class="stat"><small>Messo da parte</small><b class="money ${a.risparmiato >= 0 ? "pos" : "neg"}">${euro(a.risparmiato)}</b><span>tasso di risparmio ${pct(a.tasso)}</span></div>
    <div class="stat"><small>Spesa media mensile</small><b class="money">${euro(a.spese / nMesi)}</b><span>${euro(a.spese / nMesi / 30.4)} al giorno</span></div>
    <div class="stat"><small>Mese migliore</small><b>${migliore ? cap(nomeMese(migliore.m, 1).split(" ")[0]) : "—"}</b><span>${migliore ? "risparmio " + pct(migliore.tasso) : ""}</span></div>`;
  $("repChart").innerHTML = graficoFlusso(a.mesi.map(r => r.m), null);
  $("repTab").innerHTML = `<thead><tr><th>Mese</th><th class="r">Entrate</th><th class="r">Spese</th><th class="r">Risparmiato</th><th class="r">Tasso</th></tr></thead><tbody>` +
    a.mesi.map(r => `<tr><td>${cap(nomeMese(r.m, 1).split(" ")[0])}</td><td class="r pos">${r.entrate ? money(r.entrate) : "—"}</td><td class="r">${r.spese ? money(r.spese) : "—"}</td><td class="r ${r.risparmiato < 0 ? "neg" : ""}">${r.n ? money(r.risparmiato) : "—"}</td><td class="r">${r.entrate ? pct(r.tasso) : "—"}</td></tr>`).join("") +
    `<tr class="tot"><td>Totale</td><td class="r pos">${money(a.entrate)}</td><td class="r">${money(a.spese)}</td><td class="r">${money(a.risparmiato)}</td><td class="r">${pct(a.tasso)}</td></tr></tbody>`;
  const cats = Object.entries(a.perCat).sort((x, z) => z[1] - x[1]);
  const max = cats.length ? cats[0][1] : 1;
  $("repCat").innerHTML = cats.length ? cats.slice(0, 12).map(([c, v]) => {
    const ci = catInfo(c);
    return `<div class="brow" style="grid-template-columns:42px 1fr"><div class="tx-ic" style="background:${ci.colore}1f;color:${ci.colore}">${ci.icona}</div>
      <div><div class="brow-top"><b>${esc(c)}</b><span class="num">${money(v)} <span class="faint small">· ${money(v / nMesi)}/mese</span></span></div>
      <div class="progress"><div style="width:${(v / max) * 100}%;background:${ci.colore}"></div></div></div></div>`;
  }).join("") : `<div class="empty">Nessuna spesa nel ${y}.</div>`;
}

/* ---------------- Render: conti ---------------- */
function renderConti() {
  const s = saldiConti();
  const att = somma(S.conti.map(c => Math.max(0, s[c.id] || 0))), pass = somma(S.conti.map(c => Math.min(0, s[c.id] || 0)));
  const deb = somma(S.debiti.map(d => +d.saldo));
  $("contiStats").innerHTML = `<div class="stat"><small>Attività</small><b class="pos money">${euro(att)}</b></div>
    <div class="stat"><small>Saldi negativi</small><b class="neg money">${euro(pass)}</b></div>
    <div class="stat"><small>Patrimonio netto</small><b class="money">${euro(att + pass)}</b></div>
    <div class="stat"><small>Al netto dei debiti</small><b class="money ${att + pass - deb < 0 ? "neg" : ""}">${euro(att + pass - deb)}</b><span>${deb ? "inclusi " + euro(deb) + " di debiti" : "nessun debito registrato"}</span></div>`;
  const mesi = [...Array(6)].map((_, i) => shiftMese(MESE_CORR, i - 5));
  $("contiLista").innerHTML = S.conti.map((c, i) => {
    const serie = mesi.map(m => (m === MESE_CORR ? s[c.id] : saldiConti(m + "-31")[c.id]) || 0);
    return `<div class="card acc">
      <div class="acc-top"><div class="tx-ic" style="background:${COLORI[i % COLORI.length]}1f">${TIPI_CONTO[c.tipo]}</div><div><div class="acc-name">${esc(c.nome)}</div><div class="small muted">${esc(c.tipo)}</div></div>
        <button class="icon-btn del" data-act="delConto" data-id="${c.id}" title="Elimina">${icon("trash", 16)}</button></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end"><div class="acc-bal ${(s[c.id] || 0) < 0 ? "neg" : ""}">${euro(s[c.id])}</div>${sparkline(serie, COLORI[i % COLORI.length])}</div>
      <div class="acc-foot"><input type="number" step="0.01" placeholder="Saldo reale €" id="ric-${c.id}"><button class="btn sm" data-act="riconcilia" data-id="${c.id}">Correggi</button></div></div>`;
  }).join("") || `<div class="card empty">Nessun conto.</div>`;
}

/* ---------------- Render: impostazioni ---------------- */
function renderImpostazioni() {
  $("regoleLista").innerHTML = S.regole.length ? S.regole.map((r, i) => `<div class="rule-chip"><span class="flex">“${esc(r.parola)}” → ${catInfo(r.categoria).icona} <b>${esc(r.categoria)}</b></span><button class="icon-btn del" data-act="delRegola" data-i="${i}">${icon("x", 15)}</button></div>`).join("") : `<p class="hint" style="margin:0">Nessuna regola personalizzata.</p>`;
  $("catLista").innerHTML = S.categorie.map(c => `<div class="cat-edit">
    <input class="in-emoji" value="${esc(c.icona)}" data-cat-ed="icona" data-cat="${esc(c.nome)}">
    <input value="${esc(c.nome)}" data-cat-ed="nome" data-cat="${esc(c.nome)}">
    <select data-cat-ed="gruppo" data-cat="${esc(c.nome)}">${Object.entries(GRUPPI).map(([k, v]) => `<option value="${k}"${c.gruppo === k ? " selected" : ""}>${v}</option>`).join("")}</select>
    <input type="color" value="${c.colore}" data-cat-ed="colore" data-cat="${esc(c.nome)}">
    <button class="icon-btn del" data-act="delCat" data-cat="${esc(c.nome)}" title="Elimina">${icon("trash", 15)}</button></div>`).join("");
  qsa("#temaSeg button").forEach(b => b.classList.toggle("on", b.dataset.v === S.impostazioni.tema));
  renderImport();
  renderSync();
}

/* ---------------- Import CSV ---------------- */
function parseCSV(text) {
  text = text.replace(/^﻿/, "");
  const first = text.split(/\r?\n/).find(l => l.trim()) || "";
  const sep = [";", ",", "\t", "|"].map(s => [s, first.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
function caricaImport(text, nomeFile) {
  const rows = parseCSV(text);
  if (rows.length < 2) return toast("File vuoto o non riconosciuto");
  let hi = rows.findIndex(r => r.length >= 2 && r.some(c => /^\s*(data|date)/i.test(c)));
  if (hi < 0) hi = 0;
  const header = rows[hi].map(h => h.trim());
  const body = rows.slice(hi + 1).filter(r => r.length >= Math.min(header.length, 2));
  const find = (re, ex = []) => header.findIndex((h, i) => re.test(h) && !ex.includes(i));
  const map = {};
  map.data = find(/data.*(contab|operaz)|^data$|^date$/i); if (map.data < 0) map.data = find(/data|date|valuta/i);
  map.imp = find(/^importo|amount|ammontare|^valore|entrate|avere|accrediti/i, [map.data]);
  map.usc = find(/uscite|^dare|addebiti/i, [map.imp]);
  map.desc = find(/descri|causale|dettagl|beneficiar|esercente|memo|note|operazione/i, [map.data, map.imp, map.usc]);
  map.tipo = header.findIndex(h => /^tipo$/i.test(h));
  map.cat = header.findIndex(h => /^categoria$/i.test(h));
  IMP = { header, body, map, conto: S.impostazioni.ultimoConto && S.conti.some(c => c.id === S.impostazioni.ultimoConto) ? S.impostazioni.ultimoConto : S.conti[0]?.id, inverti: false, nomeFile };
  renderImport();
}
function rigaImport(r) {
  const m = IMP.map, data = parseData(r[m.data]);
  if (!data) return null;
  let v = m.imp >= 0 ? parseNum(r[m.imp]) : 0;
  if (isNaN(v)) v = 0;
  if (m.usc >= 0) { const u = parseNum(r[m.usc]); if (!isNaN(u) && u) v -= Math.abs(u); }
  if (IMP.inverti) v = -v;
  const desc = (m.desc >= 0 ? r[m.desc] || "" : "").trim().replace(/\s+/g, " ");
  let tipo = v >= 0 ? "entrata" : "uscita";
  const tcol = m.tipo >= 0 ? (r[m.tipo] || "").trim().toLowerCase() : "";
  if (tcol === "entrata" || tcol === "uscita") tipo = tcol;
  const importo = arrot(Math.abs(v));
  if (!importo) return null;
  const catCsv = m.cat >= 0 ? (r[m.cat] || "").trim() : "";
  const categoria = catPerTipo(tipo).some(c => c.nome === catCsv) ? catCsv : indovinaCategoria(desc, tipo);
  return { tipo, data, importo, descrizione: desc, categoria, contoId: IMP.conto, tags: [] };
}
const chiaveDup = m => `${m.data}|${m.importo.toFixed(2)}|${norm(m.descrizione).slice(0, 24)}`;
function analizzaImport() {
  const esistenti = new Set(S.movimenti.map(chiaveDup));
  const out = [];
  for (const r of IMP.body) { const m = rigaImport(r); if (m) out.push({ m, dup: esistenti.has(chiaveDup(m)) }); }
  return out;
}
function renderImport() {
  const box = $("impMap");
  if (!IMP) { box.innerHTML = ""; $("drop").hidden = false; return; }
  $("drop").hidden = true;
  const opt = (sel, vuoto) => (vuoto ? `<option value="-1">— nessuna —</option>` : "") + IMP.header.map((h, i) => `<option value="${i}"${i === sel ? " selected" : ""}>${esc(h || "Colonna " + (i + 1))}</option>`).join("");
  const righe = analizzaImport(), nuove = righe.filter(x => !x.dup);
  box.innerHTML = `<div class="card-head" style="margin:0"><h2 style="font-size:14px">📄 ${esc(IMP.nomeFile || "File")} · ${IMP.body.length} righe</h2><button class="btn sm ghost" data-act="impAnnulla">Annulla</button></div>
    <div class="map-grid">
      <label class="f">Colonna data<select data-imp="data">${opt(IMP.map.data)}</select></label>
      <label class="f">Colonna descrizione<select data-imp="desc">${opt(IMP.map.desc, 1)}</select></label>
      <label class="f">Colonna importo / entrate<select data-imp="imp">${opt(IMP.map.imp, 1)}</select></label>
      <label class="f">Colonna uscite (se separata)<select data-imp="usc">${opt(IMP.map.usc, 1)}</select></label>
      <label class="f">Importa nel conto<select data-imp="conto">${S.conti.map(c => `<option value="${c.id}"${c.id === IMP.conto ? " selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></label>
      <label class="switch" style="align-self:end;padding-bottom:8px"><input type="checkbox" data-imp="inverti"${IMP.inverti ? " checked" : ""}><span></span>Inverti segno</label>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrizione</th><th>Categoria</th><th class="r">Importo</th></tr></thead><tbody>
      ${righe.slice(0, 8).map(({ m, dup }) => `<tr class="${dup ? "dup" : ""}"><td>${fmtData(m.data)}</td><td>${esc(m.descrizione)}</td><td>${catInfo(m.categoria).icona} ${esc(m.categoria)}</td><td class="r ${m.tipo === "entrata" ? "pos" : ""}">${m.tipo === "entrata" ? "+" : "−"}${money(m.importo)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Nessuna riga valida: controlla le colonne di data e importo.</td></tr>`}
    </tbody></table></div>
    <div class="btn-row" style="margin-top:16px;align-items:center"><button class="btn primary" data-act="impConferma"${nuove.length ? "" : " disabled"}>Importa ${nuove.length} movimenti</button>
      <span class="muted small">${righe.length - nuove.length ? `${righe.length - nuove.length} duplicati verranno saltati · ` : ""}le categorie sono assegnate in automatico e puoi cambiarle dopo</span></div>`;
}

/* ---------------- Render principale ---------------- */
const RENDER = { dashboard: renderDashboard, movimenti: renderMovimenti, budget: renderBudget, obiettivi: renderObiettivi, pianificazione: renderPianificazione, debiti: renderDebiti, report: renderReport, conti: renderConti, impostazioni: renderImpostazioni };
function aggiornaSelect() {
  const keep = (id, html) => { const el = $(id); if (!el) return; const v = el.value; el.innerHTML = html; if ([...el.options].some(o => o.value === v)) el.value = v; };
  const conti = S.conti.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join("");
  ["mConto", "mDest", "rConto", "rDest"].forEach(id => keep(id, conti));
  const catOpt = list => list.map(c => `<option value="${esc(c.nome)}">${c.icona} ${esc(c.nome)}</option>`).join("");
  keep("rCat", catOpt(catPerTipo($("rTipo").value)));
  keep("gCat", catOpt(S.categorie));
  keep("qCat", `<option value="">Tutte le categorie</option>` + catOpt(S.categorie));
  keep("qConto", `<option value="">Tutti i conti</option>` + conti);
}
function render() {
  try {
    renderShell();
    aggiornaSelect();
    RENDER[pagina]();
  } catch (e) { mostraErrore(e); }
}
function vaiA(p) {
  if (!RENDER[p]) return;
  pagina = p;
  if (p !== "movimenti") limiteLista = 250;
  history.replaceState(null, "", location.search + "#" + p);
  window.scrollTo({ top: 0 });
  render();
}
function cambiaMese(k) { meseSel = shiftMese(meseSel, k); filtroGiorno = null; render(); }

/* ---------------- Toast / undo ---------------- */
let undoSnap = null;
function snapshot() { undoSnap = JSON.stringify(S); }
function toast(msg, undo) {
  const t = $("toast");
  t.innerHTML = `<span>${esc(msg)}</span>${undo && undoSnap ? `<button id="tUndo">Annulla</button>` : ""}`;
  t.classList.add("show");
  if (undo && undoSnap) $("tUndo").onclick = () => { S = normalizza(JSON.parse(undoSnap)); undoSnap = null; salva(); render(); toast("Operazione annullata"); };
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove("show"), undo ? 6000 : 2800);
}
function mostraErrore(e) {
  console.error(e);
  let box = $("errBox");
  if (!box) { box = document.createElement("div"); box.id = "errBox"; box.className = "banner"; box.style.cssText = "background:color-mix(in srgb,var(--neg) 12%,transparent);color:var(--neg)"; $("pages").before(box); }
  box.textContent = "Si è verificato un errore: " + (e && e.message ? e.message : e);
}
window.addEventListener("error", ev => mostraErrore(ev.error || ev.message));

/* ---------------- Modal movimento ---------------- */
let editId = null, catSel = null, catManuale = false, tipoSel = "uscita";
function apriModal(m) {
  if (!S.conti.length) { toast("Crea prima un conto"); vaiA("conti"); return; }
  editId = m ? m.id : null; catManuale = !!m;
  $("mTitolo").textContent = m ? "Modifica movimento" : "Nuovo movimento";
  $("mElimina").hidden = !m; $("mAltro").hidden = !!m;
  $("mQuick").value = "";
  $("mImporto").value = m ? m.importo : "";
  $("mDesc").value = m ? m.descrizione || "" : "";
  $("mData").value = m ? m.data : (meseSel === MESE_CORR ? OGGI : meseSel + "-01");
  $("mTags").value = m ? (m.tags || []).map(t => "#" + t).join(" ") : "";
  aggiornaSelect();
  const cDef = S.impostazioni.ultimoConto && S.conti.some(c => c.id === S.impostazioni.ultimoConto) ? S.impostazioni.ultimoConto : S.conti[0].id;
  $("mConto").value = m ? m.contoId : cDef;
  if (m && m.contoDestId) $("mDest").value = m.contoDestId;
  else { const altro = S.conti.find(c => c.id !== $("mConto").value); if (altro) $("mDest").value = altro.id; }
  catSel = m ? m.categoria : null;
  $("mCatAuto").textContent = "";
  setTipo(m ? m.tipo : "uscita");
  $("modal").hidden = false;
  setTimeout(() => (m ? $("mImporto") : $("mQuick")).focus(), 40);
}
function chiudiModal() { $("modal").hidden = true; editId = null; }
function setTipo(t) {
  tipoSel = t;
  qsa("#mTipo button").forEach(b => b.classList.toggle("on", b.dataset.v === t));
  $("mlDest").hidden = t !== "trasferimento";
  $("mlCat").hidden = t === "trasferimento";
  if (!catPerTipo(t).some(c => c.nome === catSel)) { catSel = indovinaCategoria($("mDesc").value, t); catManuale = false; }
  renderCatGrid();
}
function renderCatGrid() {
  $("mCat").innerHTML = catPerTipo(tipoSel).map(c => `<button type="button" class="cat-chip${c.nome === catSel ? " on" : ""}" data-act="mCat" data-cat="${esc(c.nome)}" style="--c:${c.colore}"><span>${c.icona}</span>${esc(c.nome)}</button>`).join("");
}
function auto() {
  if (catManuale) return;
  const nuova = indovinaCategoria($("mDesc").value, tipoSel);
  if (nuova !== catSel) { catSel = nuova; renderCatGrid(); }
  $("mCatAuto").textContent = $("mDesc").value.trim() ? "· scelta in automatico, tocca per cambiarla" : "";
}
function salvaModal(altro) {
  const importo = arrot(parseFloat(String($("mImporto").value).replace(",", ".")));
  if (!(importo > 0)) { toast("Inserisci un importo"); $("mImporto").focus(); return; }
  const tipo = tipoSel;
  if (tipo === "trasferimento" && $("mConto").value === $("mDest").value) return toast("Scegli due conti diversi");
  const tags = [...new Set(($("mTags").value.match(/[\p{L}\d_-]+/gu) || []).map(t => t.toLowerCase()))];
  const m = { tipo, data: $("mData").value || OGGI, importo, contoId: $("mConto").value, descrizione: $("mDesc").value.trim(), tags };
  if (tipo === "trasferimento") m.contoDestId = $("mDest").value; else m.categoria = catSel;
  snapshot();
  if (editId) {
    const i = S.movimenti.findIndex(x => x.id === editId);
    if (i >= 0) S.movimenti[i] = { id: editId, ...(S.movimenti[i].ricorrenteId ? { ricorrenteId: S.movimenti[i].ricorrenteId } : {}), ...m };
    toast("Movimento aggiornato", true);
  } else {
    S.movimenti.push({ id: uid(), ...m });
    toast(`${tipo === "entrata" ? "Entrata" : tipo === "uscita" ? "Spesa" : "Trasferimento"} di ${euro(importo)} ${tipo === "trasferimento" ? "registrato" : "registrata"}`, true);
  }
  S.impostazioni.ultimoConto = m.contoId;
  salva();
  if (altro) apriModal(); else chiudiModal();
  render();
}

/* ---------------- Dati di esempio ---------------- */
function datiEsempio() {
  const st = statoIniziale();
  const cc = st.conti[0]; cc.nome = "Conto corrente"; cc.saldoIniziale = 1650;
  const rs = { id: uid(), nome: "Conto risparmio", tipo: "Risparmio", saldoIniziale: 4800 };
  const ct = { id: uid(), nome: "Contanti", tipo: "Contanti", saldoIniziale: 80 };
  const inv = { id: uid(), nome: "Investimenti ETF", tipo: "Investimenti", saldoIniziale: 7200 };
  st.conti.push(rs, ct, inv);
  let seed = 42;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const tra = (a, b) => arrot(a + rnd() * (b - a)), pick = a => a[Math.floor(rnd() * a.length)];
  const m0 = shiftMese(MESE_CORR, -6);
  const ric = (tipo, descrizione, importo, categoria, giorno, extra = {}) => st.ricorrenti.push({ id: uid(), tipo, descrizione, importo, categoria, contoId: cc.id, frequenza: "mensile", giorno, prossima: `${m0}-${pad(giorno)}`, ...extra });
  ric("entrata", "Stipendio", 2150, "Stipendio", 27);
  ric("uscita", "Affitto", 750, "Casa", 1);
  ric("uscita", "Enel luce e gas", 78, "Bollette", 16);
  ric("uscita", "Iliad", 9.99, "Bollette", 5);
  ric("uscita", "Fibra Fastweb", 27.95, "Bollette", 10);
  ric("uscita", "Netflix", 13.99, "Abbonamenti", 12);
  ric("uscita", "Spotify", 10.99, "Abbonamenti", 20);
  ric("uscita", "Palestra", 39, "Sport", 3);
  ric("uscita", "Assicurazione auto", 420, "Assicurazioni", 14, { frequenza: "annuale", prossima: `${shiftMese(MESE_CORR, -4)}-14` });
  ric("trasferimento", "PAC ETF", 200, null, 2, { contoDestId: inv.id });
  ric("trasferimento", "Risparmio mensile", 120, null, 28, { contoDestId: rs.id });
  const add = (d, tipo, descrizione, importo, categoria, conto = cc.id, tags = []) => st.movimenti.push({ id: uid(), tipo, data: d, importo: arrot(importo), categoria, contoId: conto, descrizione, tags });
  const negozi = [["Amazon", "Shopping"], ["Zara", "Shopping"], ["Decathlon", "Sport"], ["Mediaworld", "Shopping"], ["Ikea", "Casa"]];
  for (let d = m0 + "-01"; d <= OGGI; d = addGiorni(d, 1)) {
    const dow = toDate(d).getDay(), dd = +d.slice(8);
    if (dow === 6) add(d, "uscita", pick(["Esselunga", "Conad", "Coop"]), tra(55, 95), "Spesa alimentare");
    if (dow === 3 || rnd() < .1) add(d, "uscita", pick(["Lidl", "Carrefour Express", "Panificio"]), tra(8, 35), "Spesa alimentare");
    if (rnd() < .38) add(d, "uscita", pick(["Bar caffè", "Caffè e brioche", "Bar"]), tra(1.4, 4.5), "Ristoranti", ct.id);
    if ((dow === 5 || dow === 6) && rnd() < .5) add(d, "uscita", pick(["Pizzeria da Gino", "Sushi Zen", "Aperitivo", "Trattoria", "Deliveroo"]), tra(14, 55), "Ristoranti", cc.id, rnd() < .3 ? ["amici"] : []);
    if (rnd() < .06) add(d, "uscita", pick(["Benzina Eni", "Q8 carburante", "Tamoil"]), tra(45, 70), "Trasporti");
    if (rnd() < .05) { const [n, c] = pick(negozi); add(d, "uscita", n, tra(15, 110), c); }
    if (rnd() < .035) add(d, "uscita", pick(["Cinema", "Steam", "Libreria", "Concerto"]), tra(8, 45), "Svago");
    if (rnd() < .025) add(d, "uscita", "Farmacia", tra(6, 32), "Salute");
    if (dd === 8) add(d, "uscita", "Disney Plus", 8.99, "Abbonamenti");
    if (dd === 2) add(d, "uscita", "Abbonamento ATM", 39, "Trasporti");
    if (dd === 1 || dd === 15) st.movimenti.push({ id: uid(), tipo: "trasferimento", data: d, importo: 50, contoId: cc.id, contoDestId: ct.id, descrizione: "Prelievo bancomat", tags: [] });
    if (rnd() < .012) add(d, "entrata", pick(["Rimborso spese", "Vendita usato"]), tra(25, 120), "Altre entrate");
  }
  const mv = shiftMese(MESE_CORR, -3);
  add(`${mv}-10`, "uscita", "Volo Ryanair", 148, "Viaggi", cc.id, ["vacanza"]);
  add(`${mv}-11`, "uscita", "Hotel Booking", 390, "Viaggi", cc.id, ["vacanza"]);
  add(`${mv}-12`, "uscita", "Cena di pesce", 64, "Ristoranti", cc.id, ["vacanza"]);
  add(`${shiftMese(MESE_CORR, -1)}-20`, "uscita", "Regalo compleanno Marta", 45, "Regali");
  st.obiettivi.push(
    { id: uid(), nome: "Viaggio in Giappone", icona: "🗾", target: 4000, accumulato: 1350, scadenza: `${shiftMese(MESE_CORR, 9)}-01` },
    { id: uid(), nome: "Fondo emergenza", icona: "🛟", target: 9000, accumulato: 4800, scadenza: null },
    { id: uid(), nome: "Nuovo portatile", icona: "💻", target: 1200, accumulato: 1200, scadenza: null },
  );
  st.debiti.push(
    { id: uid(), nome: "Prestito auto", saldo: 6400, tasso: 6.9, rata: 215 },
    { id: uid(), nome: "Carta revolving", saldo: 1350, tasso: 17.9, rata: 70 },
    { id: uid(), nome: "Finanziamento smartphone", saldo: 480, tasso: 0, rata: 40 },
  );
  st.impostazioni.extraDebiti = 100;
  st.regole.push({ parola: "esselunga", categoria: "Spesa alimentare" });
  S = st; cache = {};
  eseguiRicorrenti();
  cache = {};
  suggerisciBudget();
  const rist = S.categorie.find(c => c.nome === "Ristoranti"); if (rist) rist.budget = Math.round(rist.budget * .8 / 10) * 10;
  ["Regali", "Viaggi"].forEach(n => { const c = S.categorie.find(c => c.nome === n); if (c) { c.rollover = true; c.budget = n === "Regali" ? 30 : 100; } });
  cache = {};
  return S;
}
function suggerisciBudget() {
  let n = 0;
  for (const c of S.categorie.filter(c => c.gruppo !== "entrata")) {
    const valori = [1, 2, 3].map(k => riepilogo(shiftMese(MESE_CORR, -k)).perCat[c.nome] || 0);
    let media = somma(valori) / 3;
    if (!media) media = riepilogo(MESE_CORR).perCat[c.nome] || 0;
    if (media > 0) { c.budget = Math.ceil(media / 10) * 10; n++; }
  }
  cache = {};
  return n;
}

/* ---------------- Eventi ---------------- */
function nuovoRicTipo() {
  const t = $("rTipo").value;
  $("rlDest").hidden = t !== "trasferimento"; $("rlCat").hidden = t === "trasferimento";
  aggiornaSelect();
}
function bind() {
  $("mPrev").innerHTML = icon("left", 17); $("mNext").innerHTML = icon("right", 17);
  $("yPrev").innerHTML = icon("left", 17); $("yNext").innerHTML = icon("right", 17);
  $("icPlus").innerHTML = icon("plus", 17); $("fab").innerHTML = icon("plus", 26);
  $("icSearch").innerHTML = icon("search", 17); $("icUpload").innerHTML = icon("upload", 28);
  $("mChiudi").innerHTML = icon("x", 18);
  $("kTipo").innerHTML = Object.entries(TIPI_CONTO).map(([t, e]) => `<option value="${t}">${e} ${t}</option>`).join("");
  $("rInizio").value = OGGI;

  $("mPrev").onclick = () => cambiaMese(-1);
  $("mNext").onclick = () => cambiaMese(1);
  $("mLabel").onclick = () => { meseSel = MESE_CORR; filtroGiorno = null; render(); };
  $("yPrev").onclick = () => { annoSel--; render(); };
  $("yNext").onclick = () => { annoSel++; render(); };
  $("yLabel").onclick = () => { annoSel = +MESE_CORR.slice(0, 4); render(); };
  $("btnNuovo").onclick = () => apriModal();
  $("fab").onclick = () => apriModal();
  $("btnPrivacy").onclick = togglePrivacy;
  $("btnTema").onclick = () => { const o = ["auto", "light", "dark"]; S.impostazioni.tema = o[(o.indexOf(S.impostazioni.tema) + 1) % 3]; salva(); render(); };
  qsa("#temaSeg button").forEach(b => (b.onclick = () => { S.impostazioni.tema = b.dataset.v; salva(); render(); }));

  // Modal
  $("mChiudi").onclick = chiudiModal;
  $("modal").addEventListener("mousedown", e => { if (e.target === $("modal")) chiudiModal(); });
  qsa("#mTipo button").forEach(b => (b.onclick = () => { setTipo(b.dataset.v); auto(); }));
  $("mQuick").addEventListener("input", () => {
    const p = parseVeloce($("mQuick").value);
    if (p.importo != null) $("mImporto").value = p.importo;
    $("mDesc").value = p.descrizione; $("mData").value = p.data;
    $("mTags").value = p.tags.map(t => "#" + t).join(" ");
    if (tipoSel !== "trasferimento" || p.forzaEntrata) { if (p.tipo !== tipoSel) setTipo(p.tipo); }
    auto();
  });
  $("mDesc").addEventListener("input", auto);
  $("mSalva").onclick = () => salvaModal(false);
  $("mAltro").onclick = () => salvaModal(true);
  $("mElimina").onclick = () => { snapshot(); S.movimenti = S.movimenti.filter(m => m.id !== editId); salva(); chiudiModal(); render(); toast("Movimento eliminato", true); };

  // Filtri movimenti
  ["q", "qTipo", "qCat", "qConto", "qTutti"].forEach(id => $(id).addEventListener("input", () => { limiteLista = 250; renderMovimenti(); }));

  // Form
  $("fObj").onsubmit = e => {
    e.preventDefault();
    S.obiettivi.push({ id: uid(), nome: $("oNome").value.trim(), icona: $("oIcona").value.trim() || "🎯", target: arrot(+$("oTarget").value), accumulato: arrot(+$("oAcc").value || 0), scadenza: $("oScad").value || null });
    e.target.reset(); $("oIcona").value = "🎯"; $("oAcc").value = 0; salva(); render(); toast("Obiettivo creato");
  };
  $("rTipo").onchange = nuovoRicTipo;
  $("fRic").onsubmit = e => {
    e.preventDefault();
    if (!S.conti.length) return toast("Crea prima un conto");
    const tipo = $("rTipo").value;
    if (tipo === "trasferimento" && $("rConto").value === $("rDest").value) return toast("Scegli due conti diversi");
    const inizio = $("rInizio").value;
    const r = { id: uid(), tipo, importo: arrot(+$("rImporto").value), contoId: $("rConto").value, descrizione: $("rDesc").value.trim(), frequenza: $("rFreq").value, giorno: +inizio.slice(8), prossima: inizio };
    if (tipo === "trasferimento") r.contoDestId = $("rDest").value; else r.categoria = $("rCat").value;
    snapshot();
    S.ricorrenti.push(r);
    const n = eseguiRicorrenti();
    $("rImporto").value = ""; $("rDesc").value = "";
    salva(); render();
    toast(n ? `Ricorrente aggiunto · ${n} movimenti già registrati` : "Ricorrente aggiunto", true);
  };
  $("fDeb").onsubmit = e => {
    e.preventDefault();
    S.debiti.push({ id: uid(), nome: $("dNome").value.trim(), saldo: arrot(+$("dSaldo").value), tasso: +$("dTasso").value || 0, rata: arrot(+$("dRata").value) });
    e.target.reset(); $("dTasso").value = 0; salva(); render(); toast("Debito aggiunto");
  };
  $("dExtra").addEventListener("input", () => { S.impostazioni.extraDebiti = Math.max(0, +$("dExtra").value || 0); salva(); renderDebiti(); });
  $("fConto").onsubmit = e => {
    e.preventDefault();
    S.conti.push({ id: uid(), nome: $("kNome").value.trim(), tipo: $("kTipo").value, saldoIniziale: arrot(+$("kSaldo").value || 0) });
    $("kNome").value = ""; $("kSaldo").value = 0; salva(); render(); toast("Conto aggiunto");
  };
  $("fRegola").onsubmit = e => {
    e.preventDefault();
    const parola = $("gParola").value.trim().toLowerCase();
    if (!parola) return;
    S.regole = S.regole.filter(r => r.parola !== parola);
    S.regole.unshift({ parola, categoria: $("gCat").value });
    $("gParola").value = ""; salva(); render(); toast("Regola aggiunta");
  };
  $("gApplica").onclick = () => {
    snapshot();
    let n = 0;
    for (const m of S.movimenti) {
      if (m.tipo === "trasferimento") continue;
      const d = norm(m.descrizione);
      const r = S.regole.find(r => d.includes(norm(r.parola)) && catPerTipo(m.tipo).some(c => c.nome === r.categoria));
      if (r && m.categoria !== r.categoria) { m.categoria = r.categoria; n++; }
    }
    salva(); render(); toast(`${n} movimenti ricategorizzati`, n > 0);
  };
  $("fCatNew").onsubmit = e => {
    e.preventDefault();
    const nome = $("cNome").value.trim();
    if (S.categorie.some(c => c.nome.toLowerCase() === nome.toLowerCase())) return toast("Esiste già una categoria con questo nome");
    S.categorie.push({ nome, gruppo: $("cGruppo").value, icona: $("cIcona").value.trim() || "🏷️", colore: COLORI[S.categorie.length % COLORI.length], budget: 0, rollover: false });
    $("cNome").value = ""; salva(); render(); toast("Categoria aggiunta");
  };
  $("bSuggerisci").onclick = () => { snapshot(); const n = suggerisciBudget(); salva(); render(); toast(n ? `Budget proposto per ${n} categorie, in base alla media degli ultimi 3 mesi` : "Servono più movimenti per proporre un budget", n > 0); };
  $("bAzzera").onclick = () => { snapshot(); S.categorie.forEach(c => (c.budget = 0)); salva(); render(); toast("Budget azzerati", true); };

  // Input delegati
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.classList.contains("b-in")) {
      const c = S.categorie.find(c => c.nome === t.dataset.cat);
      if (c) { c.budget = Math.max(0, parseFloat(t.value) || 0); salva(); render(); }
    } else if (t.dataset.deb) {
      const d = S.debiti.find(d => d.id === t.dataset.deb);
      if (d) { d.saldo = Math.max(0, arrot(+t.value || 0)); salva(); render(); }
    } else if (t.dataset.catEd) {
      const c = S.categorie.find(c => c.nome === t.dataset.cat);
      if (!c) return;
      const campo = t.dataset.catEd, v = t.value.trim();
      if (campo === "nome") {
        if (!v || S.categorie.some(x => x !== c && x.nome.toLowerCase() === v.toLowerCase())) { toast("Nome non valido o già usato"); render(); return; }
        const vecchio = c.nome;
        S.movimenti.forEach(m => { if (m.categoria === vecchio) m.categoria = v; });
        S.ricorrenti.forEach(r => { if (r.categoria === vecchio) r.categoria = v; });
        S.regole.forEach(r => { if (r.categoria === vecchio) r.categoria = v; });
        c.nome = v;
      } else c[campo] = v || c[campo];
      salva(); render();
    } else if (t.dataset.imp && IMP) {
      const k = t.dataset.imp;
      if (k === "conto") IMP.conto = t.value; else if (k === "inverti") IMP.inverti = t.checked; else IMP.map[k] = +t.value;
      renderImport();
    }
  });

  // Click delegati
  document.addEventListener("click", e => {
    const g = e.target.closest("[data-goto]");
    if (g) { e.preventDefault(); vaiA(g.dataset.goto); return; }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const { act, id } = b.dataset;
    switch (act) {
      case "nuovo": return apriModal();
      case "demo": return caricaDemo();
      case "modMov": { const m = S.movimenti.find(x => x.id === id); if (m) apriModal(m); return; }
      case "delMov": e.stopPropagation(); snapshot(); S.movimenti = S.movimenti.filter(m => m.id !== id); salva(); render(); return toast("Movimento eliminato", true);
      case "mCat": catSel = b.dataset.cat; catManuale = true; $("mCatAuto").textContent = ""; return renderCatGrid();
      case "tag": e.stopPropagation(); $("q").value = "#" + b.dataset.t; $("qTutti").checked = true; filtroGiorno = null; return vaiA("movimenti");
      case "clearQ": $("q").value = ""; return renderMovimenti();
      case "clearGiorno": filtroGiorno = null; return renderMovimenti();
      case "giorno": filtroGiorno = b.dataset.d; $("q").value = ""; return vaiA("movimenti");
      case "mese": meseSel = b.dataset.m; if (pagina === "report") pagina = "dashboard"; return render();
      case "altri": limiteLista += 250; return renderMovimenti();
      case "rollover": { const c = S.categorie.find(c => c.nome === b.dataset.cat); if (c) { c.rollover = !c.rollover; salva(); render(); toast(c.rollover ? `Riporto attivo per ${c.nome}` : `Riporto disattivato per ${c.nome}`); } return; }
      case "delCat": {
        snapshot(); S.categorie = S.categorie.filter(c => c.nome !== b.dataset.cat); S.regole = S.regole.filter(r => r.categoria !== b.dataset.cat);
        salva(); render(); return toast("Categoria eliminata: i movimenti restano", true);
      }
      case "delObj": snapshot(); S.obiettivi = S.obiettivi.filter(o => o.id !== id); salva(); render(); return toast("Obiettivo eliminato", true);
      case "versa": case "preleva": {
        const o = S.obiettivi.find(x => x.id === id), v = parseFloat($("v-" + id).value);
        if (!o || !(v > 0)) return toast("Inserisci un importo");
        const prima = o.accumulato < o.target;
        o.accumulato = arrot(Math.max(0, o.accumulato + (act === "versa" ? v : -v)));
        salva(); render();
        return toast(prima && o.accumulato >= o.target ? "🎉 Obiettivo raggiunto!" : act === "versa" ? `Versati ${euro(v)} su ${o.nome}` : `Prelevati ${euro(v)} da ${o.nome}`);
      }
      case "delRic": snapshot(); S.ricorrenti = S.ricorrenti.filter(r => r.id !== id); salva(); render(); return toast("Ricorrente interrotto: lo storico resta", true);
      case "addAbb": {
        const a = rilevaAbbonamenti().find(x => x.k === b.dataset.k); if (!a) return;
        const giorno = +a.ultimo.slice(8), r = { id: uid(), tipo: "uscita", descrizione: a.desc, importo: a.importo, categoria: a.categoria, contoId: a.contoId, frequenza: "mensile", giorno };
        r.prossima = prossimaData(r, a.ultimo);
        while (r.prossima <= OGGI) r.prossima = prossimaData(r, r.prossima);
        snapshot(); S.ricorrenti.push(r); salva(); render(); return toast(`${a.desc} aggiunto ai ricorrenti`, true);
      }
      case "ignAbb": S.ignorati.push(b.dataset.k); salva(); render(); return toast("Non lo segnalerò più");
      case "delDeb": snapshot(); S.debiti = S.debiti.filter(d => d.id !== id); salva(); render(); return toast("Debito eliminato", true);
      case "delConto":
        if (S.movimenti.some(m => m.contoId === id || m.contoDestId === id) || S.ricorrenti.some(r => r.contoId === id || r.contoDestId === id)) return toast("Il conto ha dei movimenti: eliminali o spostali prima");
        snapshot(); S.conti = S.conti.filter(c => c.id !== id); salva(); render(); return toast("Conto eliminato", true);
      case "riconcilia": {
        const v = parseNum($("ric-" + id).value), c = S.conti.find(c => c.id === id);
        if (!c || isNaN(v)) return toast("Scrivi il saldo reale del conto");
        snapshot(); const diff = v - (saldiConti()[id] || 0); c.saldoIniziale = arrot(c.saldoIniziale + diff); salva(); render();
        return toast(`Saldo di ${c.nome} corretto (${diff >= 0 ? "+" : ""}${euro(diff)})`, true);
      }
      case "delRegola": S.regole.splice(+b.dataset.i, 1); salva(); return render();
      case "syncOra": return sincronizza(true);
      case "syncScollega": return scollegaSync();
      case "impAnnulla": IMP = null; return renderImport();
      case "impConferma": {
        const nuove = analizzaImport().filter(x => !x.dup).map(x => ({ id: uid(), ...x.m }));
        snapshot(); S.movimenti.push(...nuove); S.impostazioni.ultimoConto = IMP.conto; IMP = null; salva(); render();
        return toast(`${nuove.length} movimenti importati`, true);
      }
    }
  });

  // Import file
  const leggi = f => { if (!f) return; const rd = new FileReader(); rd.onload = () => caricaImport(String(rd.result), f.name); rd.readAsText(f); };
  $("impFile").onchange = e => { leggi(e.target.files[0]); e.target.value = ""; };
  const drop = $("drop");
  ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => leggi(e.dataTransfer.files[0]));

  // Backup
  const scarica = (nome, contenuto, tipo) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([contenuto], { type: tipo })); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
  $("bkScarica").onclick = () => scarica(`fondi-backup-${OGGI}.json`, JSON.stringify(S, null, 2), "application/json");
  $("bkCarica").onclick = () => $("bkFile").click();
  $("bkFile").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!Array.isArray(d.conti) || !Array.isArray(d.movimenti)) throw new Error("formato");
      snapshot(); S = normalizza(d); salva(); render(); toast("Backup ripristinato", true);
    } catch (err) { toast("File di backup non valido"); }
    e.target.value = "";
  };
  $("csvScarica").onclick = () => {
    const righe = [["data", "tipo", "importo", "categoria", "conto", "conto_destinazione", "descrizione", "tag"],
      ...[...S.movimenti].sort((a, b) => a.data.localeCompare(b.data)).map(m => [m.data, m.tipo, String(m.importo).replace(".", ","), m.categoria || "", nomeConto(m.contoId), m.contoDestId ? nomeConto(m.contoDestId) : "", m.descrizione || "", (m.tags || []).join(" ")])];
    scarica(`movimenti-${OGGI}.csv`, "﻿" + righe.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n"), "text/csv");
  };
  $("bDemo").onclick = caricaDemo;
  let armato = false;
  $("reset").onclick = () => {
    if (!armato) { armato = true; $("reset").textContent = "Sicuro? Clicca di nuovo"; setTimeout(() => { armato = false; $("reset").textContent = "Cancella tutti i dati"; }, 4000); return; }
    armato = false; $("reset").textContent = "Cancella tutti i dati";
    snapshot(); S = statoIniziale(); salva(); render(); toast("Tutti i dati sono stati cancellati", true);
  };

  // Tastiera
  document.addEventListener("keydown", e => {
    const el = document.activeElement, inField = el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    if (!$("modal").hidden) {
      if (e.key === "Escape") chiudiModal();
      else if (e.key === "Enter" && inField && el.tagName !== "SELECT") { e.preventDefault(); salvaModal(e.shiftKey && !editId); }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); return apriModal(); }
    if (inField) { if (e.key === "Escape") el.blur(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "n") { e.preventDefault(); apriModal(); }
    else if (k === "/") { e.preventDefault(); vaiA("movimenti"); $("q").focus(); }
    else if (k === "p") togglePrivacy();
    else if (e.key === "ArrowLeft" && !$("monthSwitch").hidden) cambiaMese(-1);
    else if (e.key === "ArrowRight" && !$("monthSwitch").hidden) cambiaMese(1);
    else if (/^[1-9]$/.test(k)) vaiA(PAGES[+k - 1][0]);
  });
}
function togglePrivacy() { S.impostazioni.privacy = !S.impostazioni.privacy; salva(); render(); toast(S.impostazioni.privacy ? "Importi nascosti: passa il mouse per vederli" : "Importi visibili"); }
function caricaDemo() {
  snapshot();
  const tema = S.impostazioni.tema;
  datiEsempio();
  S.impostazioni.tema = tema;
  salva(); vaiA("dashboard");
  toast("Dati di esempio caricati", true);
}

/* ---------------- Installazione (PWA) ---------------- */
let promptInstalla = null;
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
function aggiornaInstalla() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), android = /android/i.test(navigator.userAgent);
  const web = /^https?:$/.test(location.protocol);
  [$("btnInstalla"), $("btnInstalla2")].forEach(b => (b.hidden = !promptInstalla));
  $("btnInstalla").innerHTML = `${icon("upload", 19)}<span>Installa l'app</span>`;
  let h;
  if (standalone()) h = `<p class="hint" style="margin:0">✅ Stai già usando Fondi come app installata.</p>`;
  else if (!web) h = `<p class="hint" style="margin:0">Ora stai aprendo il file dal computer. Per installarla sul telefono l'app deve essere pubblicata online in HTTPS: poi la apri da quell'indirizzo e la aggiungi alla schermata home.</p>`;
  else h = `<div class="form-grid" style="align-items:start">
      <div><b>${icon("info", 15)} iPhone / iPad (Safari)</b><p class="hint" style="margin:6px 0 0">Tocca <b>Condividi</b> ⬆️ e poi <b>Aggiungi alla schermata Home</b>.</p></div>
      <div><b>${icon("info", 15)} Android (Chrome)</b><p class="hint" style="margin:6px 0 0">Tocca <b>⋮</b> e poi <b>Installa app</b> (o <b>Aggiungi a schermata Home</b>).</p></div>
      <div><b>${icon("info", 15)} Computer (Chrome / Edge)</b><p class="hint" style="margin:6px 0 0">Clicca l'icona di installazione nella barra degli indirizzi.</p></div></div>`;
  if (ios && !standalone() && web) h = `<p class="hint" style="margin:0 0 10px"><b>Sei su iPhone:</b> tocca Condividi ⬆️ e poi "Aggiungi alla schermata Home".</p>` + h;
  else if (android && !standalone() && web && !promptInstalla) h = `<p class="hint" style="margin:0 0 10px"><b>Sei su Android:</b> menu ⋮ e poi "Installa app".</p>` + h;
  $("installaInfo").innerHTML = h + `<p class="hint" style="margin:14px 0 0">ℹ️ Ogni dispositivo ha i suoi dati. Per portarli dal PC al telefono: <b>Scarica backup</b> qui e <b>Ripristina</b> sull'altro dispositivo.</p>`;
}
async function installa() {
  if (!promptInstalla) return;
  promptInstalla.prompt();
  const { outcome } = await promptInstalla.userChoice;
  promptInstalla = null; aggiornaInstalla();
  if (outcome === "accepted") toast("Fondi installata! 🎉");
}
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); promptInstalla = e; aggiornaInstalla(); });
window.addEventListener("appinstalled", () => { promptInstalla = null; aggiornaInstalla(); });
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW", e));

/* ---------------- Avvio ---------------- */
document.addEventListener("submit", e => {
  if (e.target.id !== "fSync") return;
  e.preventDefault();
  const token = $("sToken").value.trim(), pass = $("sPass").value;
  if (pass.length < 8) return toast("La password deve avere almeno 8 caratteri");
  e.target.querySelector("button").disabled = true;
  collegaSync(token, pass);
});
if (!DEMO && !META.init) tracciaModifiche();
if (!DEMO) {
  if (SYNC) setTimeout(() => sincronizza(), 600);
  document.addEventListener("visibilitychange", () => { if (!SYNC) return; if (document.visibilityState === "visible") sincronizza(); else if (syncTimer) { clearTimeout(syncTimer); sincronizza(); } });
  window.addEventListener("online", () => sincronizza());
  setInterval(() => { if (SYNC && document.visibilityState === "visible") sincronizza(); }, 120000);
}
$("btnInstalla").onclick = installa;
$("btnInstalla2").onclick = installa;
bind();
if (DEMO) datiEsempio();
const nuovi = eseguiRicorrenti();
const h0 = location.hash.slice(1);
if (RENDER[h0]) pagina = h0;
render();
aggiornaInstalla();
if (nuovi) toast(`${nuovi} movimenti ricorrenti registrati in automatico`);
if (new URLSearchParams(location.search).has("nuovo")) setTimeout(() => apriModal(), 150);
