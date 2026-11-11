/* =====================================================================
   FONDI · ACCOUNT (Firebase Authentication + Firestore)
   - Accesso con Google oppure email e password
   - Il Pro segue l'account: licenza, prova gratuita e Pro regalato dall'amministratore
   - Su Firestore finiscono solo email, nome e stato dell'abbonamento: i movimenti restano sul dispositivo
   Se firebase-config.js non è compilato, questo file non fa nulla.
   ===================================================================== */
const FB_VER = "10.14.1";
const ACC = { stato: "spento", utente: null, doc: null, admin: false }; // stato: spento | caricamento | pronto | offline | locale
let fbAuth = null, fbDb = null, accStop = null, accVista = "accedi";

const accConfigurato = () => !!(window.FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey);
const tsMs = t => (t ? (t.toMillis ? t.toMillis() : +new Date(t)) : null);
const caricaScript = src => new Promise((ok, ko) => {
  const s = document.createElement("script");
  s.src = src; s.onload = ok; s.onerror = () => ko(new Error("Impossibile caricare " + src));
  document.head.appendChild(s);
});

async function avviaAccount() {
  if (DEMO || !accConfigurato()) return;
  if (!/^https?:$/.test(location.protocol)) { ACC.stato = "locale"; return renderAccount(); }
  ACC.stato = "caricamento"; renderAccount();
  try {
    for (const m of ["app", "auth", "firestore"]) await caricaScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${m}-compat.js`);
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    fbAuth = firebase.auth(); fbDb = firebase.firestore();
    fbAuth.languageCode = "it";
    fbAuth.getRedirectResult().catch(e => toast(erroreAuth(e)));
    fbAuth.onAuthStateChanged(u => {
      ACC.utente = u; ACC.stato = "pronto"; ACC.admin = false;
      if (accStop) { accStop(); accStop = null; }
      if (u) collegaUtente(u); else { ACC.doc = null; render(); }
    });
  } catch (e) {
    console.warn("Account", e);
    ACC.stato = "offline"; renderAccount();
    window.addEventListener("online", () => { if (ACC.stato === "offline") avviaAccount(); }, { once: true });
  }
}

/* --- collegamento tra account e Pro sul dispositivo --- */
const licenzaDaSalvare = () => (LIC.key ? { key: LIC.key, ok: !!LIC.ok, verificata: LIC.verificata || 0, scade: LIC.scade || null, email: LIC.email || "", motivo: LIC.motivo || null } : null);

async function collegaUtente(u) {
  const ref = fbDb.collection("utenti").doc(u.uid);
  try {
    const snap = await ref.get();
    const d = snap.exists ? snap.data() : {};
    const FV = firebase.firestore.FieldValue;
    const agg = {
      email: u.email || "", nome: u.displayName || d.nome || "",
      provider: ((u.providerData || [])[0] || {}).providerId || "password",
      ultimoAccesso: FV.serverTimestamp(),
    };
    if (!snap.exists) agg.creato = FV.serverTimestamp();

    // Prova gratuita: una sola per persona, anche tra più dispositivi
    const prove = [LIC.provaInizio, d.provaInizio].filter(Boolean);
    if (prove.length) LIC.provaInizio = agg.provaInizio = Math.min(...prove);

    // Licenza: quella dell'account vince; se c'è solo sul dispositivo, la salvo sull'account
    let daVerificare = false;
    if (d.licenza && d.licenza.key) {
      if (d.licenza.key !== LIC.key) {
        Object.assign(LIC, { key: d.licenza.key, ok: !!d.licenza.ok, verificata: 0, email: d.licenza.email || "", scade: d.licenza.scade || null, motivo: d.licenza.motivo || null });
        daVerificare = true;
      }
    } else if (LIC.key) agg.licenza = licenzaDaSalvare();

    LIC.account = u.uid;
    salvaLic();
    await ref.set(agg, { merge: true });
    try { ACC.admin = (await fbDb.collection("admin").doc(u.uid).get()).exists; } catch (e) { ACC.admin = false; }

    // Aggiornamenti in tempo reale (es. Pro regalato dall'amministratore)
    accStop = ref.onSnapshot(s => {
      ACC.doc = s.data() || {};
      const r = ACC.doc.proRegalo;
      if (r) LIC.regalo = { fino: tsMs(r.fino), nota: r.nota || "", visto: Date.now() };
      else delete LIC.regalo;
      salvaLic(); render();
    }, e => console.warn("Account snapshot", e));

    if (daVerificare) { LIC.verificata = 0; await ricontrollaLicenza(); }
  } catch (e) {
    console.warn("Account", e);
    toast("Non riesco a leggere il tuo account: riprova tra poco");
  }
  render();
}

// Chiamata da app.js dopo attivazione/verifica della licenza o l'avvio della prova
async function accSalvaPro() {
  if (!fbDb || !ACC.utente) return;
  try {
    await fbDb.collection("utenti").doc(ACC.utente.uid).set({ licenza: licenzaDaSalvare(), provaInizio: LIC.provaInizio || null }, { merge: true });
    LIC.account = ACC.utente.uid; salvaLic();
  } catch (e) { console.warn("Account: salvataggio Pro", e); }
}

/* --- accesso --- */
function erroreAuth(e) {
  const c = (e && e.code) || "";
  return ({
    "auth/invalid-credential": "Email o password non corrette",
    "auth/wrong-password": "Email o password non corrette",
    "auth/user-not-found": "Non esiste un account con questa email",
    "auth/email-already-in-use": "Esiste già un account con questa email: accedi",
    "auth/weak-password": "La password deve avere almeno 8 caratteri",
    "auth/invalid-email": "L'indirizzo email non è valido",
    "auth/missing-password": "Inserisci la password",
    "auth/too-many-requests": "Troppi tentativi: riprova tra qualche minuto",
    "auth/network-request-failed": "Sei offline: controlla la connessione",
    "auth/popup-closed-by-user": "Accesso annullato",
    "auth/cancelled-popup-request": "Accesso annullato",
    "auth/unauthorized-domain": "Questo indirizzo non è autorizzato in Firebase (Authentication → Impostazioni → Domini autorizzati)",
    "auth/operation-not-allowed": "Questo metodo di accesso non è attivo in Firebase",
    "auth/requires-recent-login": "Per sicurezza esci, rientra e riprova",
    "auth/account-exists-with-different-credential": "Questa email è già registrata con un altro metodo di accesso",
  })[c] || "Qualcosa è andato storto" + (c ? ` (${c})` : "");
}

async function accediGoogle() {
  const p = new firebase.auth.GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  try { await fbAuth.signInWithPopup(p); chiudiAccesso(); toast("Bentornato! ✦"); }
  catch (e) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(e.code)) return fbAuth.signInWithRedirect(p);
    toast(erroreAuth(e));
  }
}

async function inviaFormAccesso(f) {
  const email = f.querySelector("[name=email]").value.trim(), pass = (f.querySelector("[name=pass]") || {}).value || "";
  const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
  try {
    if (accVista === "reset") {
      await fbAuth.sendPasswordResetEmail(email);
      toast("Ti ho mandato un'email per scegliere una nuova password"); accVista = "accedi"; return renderAccesso();
    }
    if (accVista === "registrati") {
      if (pass.length < 8) throw { code: "auth/weak-password" };
      const nome = f.querySelector("[name=nome]").value.trim();
      const cr = await fbAuth.createUserWithEmailAndPassword(email, pass);
      if (nome) await cr.user.updateProfile({ displayName: nome });
      cr.user.sendEmailVerification().catch(() => { });
      if (nome && fbDb) fbDb.collection("utenti").doc(cr.user.uid).set({ nome }, { merge: true }).catch(() => { });
      chiudiAccesso(); festeggia(); toast("Account creato! Controlla l'email per confermare l'indirizzo");
    } else {
      await fbAuth.signInWithEmailAndPassword(email, pass);
      chiudiAccesso(); toast("Bentornato! ✦");
    }
  } catch (e) { toast(erroreAuth(e)); }
  finally { btn.disabled = false; }
}

async function esciAccount() {
  if (!fbAuth) return;
  await fbAuth.signOut();
  LIC = { provaInizio: LIC.provaInizio }; salvaLic(); // il Pro resta sull'account, non sul dispositivo
  render(); toast("Sei uscito. Il tuo Pro resta salvato sull'account");
}

async function eliminaAccount(b) {
  if (!b.dataset.ok) { b.dataset.ok = "1"; b.textContent = "Confermi? Clicca di nuovo per eliminare"; return; }
  const u = ACC.utente;
  try {
    if (accStop) { accStop(); accStop = null; }
    await fbDb.collection("utenti").doc(u.uid).delete();
    await u.delete();
    LIC = { provaInizio: LIC.provaInizio }; salvaLic();
    render(); toast("Account eliminato. I dati sul dispositivo sono rimasti");
  } catch (e) { toast(erroreAuth(e)); collegaUtente(u); }
}

/* --- finestra di accesso --- */
document.body.insertAdjacentHTML("beforeend", `<div class="overlay" id="accModal" hidden>
  <div class="modal acc-modal" role="dialog" aria-modal="true" aria-labelledby="accTitolo">
    <button class="icon-btn pw-close" data-acc="chiudi" title="Chiudi">${icon("x", 18)}</button>
    <div id="accBody"></div></div></div>`);

function apriAccesso(vista) {
  if (ACC.stato !== "pronto") return toast(ACC.stato === "locale" ? "Apri Fondi dal sito per usare l'account" : "Account non disponibile: controlla la connessione");
  accVista = vista || "accedi"; renderAccesso(); $("accModal").hidden = false;
  setTimeout(() => { const i = $("accBody").querySelector("input"); if (i && matchMedia("(pointer:fine)").matches) i.focus(); }, 50);
}
function chiudiAccesso() { $("accModal").hidden = true; }

function renderAccesso() {
  const v = accVista, reg = v === "registrati", reset = v === "reset";
  const G = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  $("accBody").innerHTML = `
    <div class="acc-head"><div class="logo-mark">€</div>
      <h2 id="accTitolo">${reset ? "Recupera la password" : reg ? "Crea il tuo account" : "Accedi a Fondi"}</h2>
      <p class="muted">${reset ? "Ti mando un link per sceglierne una nuova." : "Il tuo Fondi Pro ti segue su telefono e computer."}</p></div>
    ${reset ? "" : `<button class="btn acc-google" data-acc="google">${G} Continua con Google</button><div class="acc-or"><span>oppure con email</span></div>`}
    <form id="fAccesso" class="acc-form">
      ${reg ? `<label class="f">Nome<input name="nome" autocomplete="name" placeholder="Come ti chiami?"></label>` : ""}
      <label class="f">Email<input name="email" type="email" required autocomplete="email" placeholder="nome@esempio.it"></label>
      ${reset ? "" : `<label class="f">Password<input name="pass" type="password" required minlength="${reg ? 8 : 1}" autocomplete="${reg ? "new-password" : "current-password"}" placeholder="${reg ? "Almeno 8 caratteri" : ""}"></label>`}
      <button class="btn primary" type="submit">${reset ? "Invia il link" : reg ? "Crea account" : "Accedi"}</button>
    </form>
    <div class="acc-links">
      ${v === "accedi" ? `<a class="link" data-acc="vista" data-v="reset">Password dimenticata?</a><span>Non hai un account? <a class="link" data-acc="vista" data-v="registrati">Registrati</a></span>`
      : `<span>Hai già un account? <a class="link" data-acc="vista" data-v="accedi">Accedi</a></span>`}
    </div>
    <p class="acc-privacy">🔒 Salviamo solo email, nome e stato dell'abbonamento. I tuoi movimenti restano sul tuo dispositivo.</p>`;
}

/* --- scheda Account in Impostazioni e riga nella barra laterale --- */
function renderAccount() {
  const card = $("cardAccount"), side = $("accSide");
  if (!card || DEMO || !accConfigurato()) { if (card) card.hidden = true; return; }
  card.hidden = false;
  const u = ACC.utente;
  if (side) side.innerHTML = u ? `<a class="link" data-goto="impostazioni">👤 ${esc((u.displayName || u.email || "Account").split(" ")[0])}</a>`
    : ACC.stato === "pronto" ? `<a class="link" data-acc="apri">👤 Accedi</a>` : "";
  $("accStato").textContent = u ? "connesso" : "";
  const box = $("accBox");
  if (ACC.stato === "locale") return box.innerHTML = `<p class="hint" style="margin:0">L'account funziona quando apri Fondi dal sito (o da un server locale), non dal file sul computer.</p>`;
  if (ACC.stato === "caricamento") return box.innerHTML = `<p class="hint" style="margin:0">Caricamento…</p>`;
  if (ACC.stato === "offline") return box.innerHTML = `<p class="hint" style="margin:0">Sei offline: l'account torna disponibile appena rientri in rete. Le funzioni Pro restano attive.</p>`;
  if (!u) return box.innerHTML = `<p class="hint">Crea un account gratuito per avere il tuo Fondi Pro su tutti i dispositivi. I movimenti restano sul dispositivo.</p>
    <div class="btn-row"><button class="btn primary" data-acc="apri" data-v="registrati">Crea account</button><button class="btn" data-acc="apri">Accedi</button></div>`;
  const nome = u.displayName || (ACC.doc && ACC.doc.nome) || "", iniz = (nome || u.email || "?").trim()[0].toUpperCase();
  const pro = licenzaAttiva() ? "✦ Pro attivo (abbonamento)" : regaloAttivo() ? `🎁 Pro in regalo${LIC.regalo.fino ? " fino al " + new Date(LIC.regalo.fino).toLocaleDateString("it-IT") : ""}` : provaAttiva() ? `✦ Prova Pro: ${giorniProva()} giorni` : "Piano gratuito";
  const pw = ((u.providerData || [])[0] || {}).providerId === "password";
  box.innerHTML = `<div class="acc-user">
      ${u.photoURL ? `<img class="acc-av" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<div class="acc-av">${esc(iniz)}</div>`}
      <div class="flex"><b>${esc(nome || u.email)}</b><span class="muted small">${esc(u.email || "")} · ${pw ? "email e password" : "Google"}</span><span class="small">${pro}</span></div>
      <div class="btn-row">${ACC.admin ? `<a class="btn sm primary" href="admin.html">🛡️ Pannello admin</a>` : ""}${proPagato() || provaAttiva() ? "" : `<button class="btn sm primary" data-act="paywall">Passa a Pro</button>`}<button class="btn sm" data-acc="esci">Esci</button></div></div>
    ${pw && !u.emailVerified ? `<p class="hint" style="margin:14px 0 0">📧 Conferma il tuo indirizzo email con il link che ti abbiamo mandato. <a class="link" data-acc="verifica">Rimandalo</a></p>` : ""}
    <details class="acc-more"><summary class="small muted">Altre opzioni</summary>
      <div class="btn-row" style="margin-top:10px">${pw ? `<button class="btn sm ghost" data-acc="resetpw">Cambia password</button>` : ""}<button class="btn sm danger-text ghost" data-acc="elimina">Elimina account</button></div></details>`;
}

/* --- eventi --- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-acc]");
  if (!b) return;
  e.preventDefault();
  switch (b.dataset.acc) {
    case "apri": return apriAccesso(b.dataset.v);
    case "chiudi": return chiudiAccesso();
    case "vista": accVista = b.dataset.v; return renderAccesso();
    case "google": return accediGoogle();
    case "esci": return esciAccount();
    case "elimina": return eliminaAccount(b);
    case "verifica": return ACC.utente.sendEmailVerification().then(() => toast("Email di conferma inviata")).catch(err => toast(erroreAuth(err)));
    case "resetpw": return fbAuth.sendPasswordResetEmail(ACC.utente.email).then(() => toast("Ti ho mandato un'email per cambiare la password")).catch(err => toast(erroreAuth(err)));
  }
});
document.addEventListener("submit", e => { if (e.target.id === "fAccesso") { e.preventDefault(); inviaFormAccesso(e.target); } });
$("accModal").addEventListener("mousedown", e => { if (e.target === $("accModal")) chiudiAccesso(); });
// Con la finestra aperta, la tastiera serve solo al modulo (niente scorciatoie dell'app)
document.addEventListener("keydown", e => {
  if ($("accModal").hidden) return;
  if (e.key === "Escape") chiudiAccesso();
  e.stopImmediatePropagation();
}, true);

avviaAccount();
render();
