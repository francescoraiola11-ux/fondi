# Account e pannello amministratore · configurazione

Fondi usa **Firebase** (Google) per gli account. Il piano gratuito basta: fino a 50.000 utenti al mese.
Su Firebase finiscono solo **email, nome e stato dell'abbonamento**: i movimenti restano sul dispositivo dell'utente.

Finché `firebase-config.js` è vuoto, l'app funziona come prima e la sezione Account non compare.

---

## 1. Crea il progetto Firebase (5 minuti)
1. Vai su https://console.firebase.google.com e accedi con il tuo account Google
2. **Crea un progetto** → nome `fondi` → Google Analytics: puoi disattivarlo → Crea
3. Nella pagina del progetto clicca l'icona **`</>`** (App web) → nome `Fondi` → **Registra app**
   (non serve Firebase Hosting: il sito resta su GitHub Pages)
4. Copia i valori di `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, `appId`) dentro **`firebase-config.js`**

## 2. Attiva i metodi di accesso
Console → **Authentication** → Inizia → scheda **Metodo di accesso**:
- **Email/password** → Attiva → Salva
- **Google** → Attiva → scegli l'email di assistenza → Salva

Poi scheda **Impostazioni → Domini autorizzati** → **Aggiungi dominio**:
- `francescoraiola11-ux.github.io`
(`localhost` c'è già, serve per le prove sul PC)

Facoltativo ma consigliato: **Authentication → Modelli** → imposta la lingua delle email su italiano.

## 3. Crea il database e incolla le regole di sicurezza
1. Console → **Firestore Database** → **Crea database** → posizione `eur3 (europe-west)` → **modalità di produzione**
2. Scheda **Regole** → cancella tutto, incolla il contenuto di **`firestore.rules`** → **Pubblica**

Le regole fanno in modo che:
- ogni utente legga e modifichi **solo il proprio** documento
- nessun utente possa regalarsi il Pro da solo (il campo `proRegalo` lo scrive solo un amministratore)
- solo gli amministratori vedano l'elenco degli utenti

## 4. Crea le tue credenziali da amministratore
1. Apri **`admin.html`** (online: https://francescoraiola11-ux.github.io/fondi/admin.html)
2. Accedi con Google (o crea prima un account email/password dall'app: Impostazioni → Account)
3. La pagina dice "Non sei ancora amministratore" e mostra il tuo **UID** → **Copia UID**
4. Console Firebase → **Firestore Database → Dati** → **Avvia raccolta**
   - ID raccolta: `admin`
   - ID documento: **incolla il tuo UID**
   - campo `ruolo` (stringa) = `admin` → **Salva**
5. Ricarica `admin.html`: ora vedi il pannello

Per aggiungere un altro amministratore ripeti il punto 4 con il suo UID. Per toglierlo, elimina il suo documento in `admin`.

**Sicurezza:** proteggi l'account Google che usi come amministratore con la **verifica in due passaggi**
(https://myaccount.google.com/security). Chi entra in quell'account entra nel pannello.

## Cosa fa il pannello (`admin.html`)
- **Numeri:** utenti registrati, nuovi negli ultimi 30 giorni, attivi (7 e 30 giorni), abbonati Pro, Pro regalati, prove in corso
- **Grafico** dei nuovi iscritti degli ultimi 12 mesi
- **Elenco utenti** con ricerca e filtri: nome, email, metodo di accesso, data di iscrizione, ultimo accesso, stato Pro
- **Regala Pro** a un utente: 1 mese, 3 mesi, 1 anno, per sempre, oppure togli il regalo (arriva in tempo reale sull'app dell'utente)
- **Esporta CSV** dell'elenco (filtrato)

## Come funziona il Pro con l'account
- L'utente attiva la licenza (o la prova gratuita) una volta: viene salvata sull'account
- Su un altro dispositivo basta accedere con lo stesso account: il Pro arriva da solo
- La licenza viene sempre riverificata con Gumroad: una chiave falsa non sblocca nulla
- La prova gratuita è una sola per account, anche su più dispositivi
- Uscendo dall'account il Pro viene tolto da quel dispositivo (resta sull'account)
- Offline il Pro resta attivo fino a 14 giorni dall'ultimo controllo

## Prova in locale
Firebase non funziona aprendo `index.html` con doppio clic (indirizzo `file://`). Avvia un server dalla cartella del progetto:
```
python -m http.server 8000
```
e apri http://localhost:8000. Ricordati di chiuderlo (Ctrl+C) quando hai finito.

## Prima di pubblicare
- **Privacy policy:** raccogliendo email e nomi serve un'informativa privacy (GDPR). Va linkata dalla finestra di accesso e da `scopri.html`.
- **Accesso con Apple:** quando avrai l'Apple Developer Program si aggiunge da Authentication → Metodo di accesso → Apple.
