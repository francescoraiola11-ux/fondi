# Fondi · Finanza personale

Gestore completo delle finanze personali. Funziona offline e i dati restano solo sul tuo dispositivo.
Piano **gratuito** completo per l'uso di tutti i giorni + **Fondi Pro** in abbonamento (3,99 €/mese o 29,99 €/anno, prova gratuita di 7 giorni).
**Online e installabile:** https://francescoraiola11-ux.github.io/fondi/ · Pagina di presentazione: https://francescoraiola11-ux.github.io/fondi/scopri.html · Kit di lancio: `LANCIO.md`
(iPhone: Safari → Condividi → Aggiungi alla schermata Home · Android: Chrome → ⋮ → Installa app)

In locale: apri `index.html` con il browser. Per un'anteprima con 6 mesi di dati di esempio, che non tocca i tuoi dati, apri `index.html?demo`.

## File
- `index.html`: struttura delle pagine
- `app.css`: grafica (tema chiaro e scuro, versione per telefono)
- `app.js`: tutta la logica
- `account.js`: account (Google, email) e Pro legato all'account · `firebase-config.js`: chiavi Firebase
- `admin.html` + `admin.js`: pannello amministratore · `firestore.rules`: regole di sicurezza · configurazione in `ACCOUNT.md`

## Funzioni
| Area | Cosa fa |
|---|---|
| **Inserimento rapido** | Scrivi `12,50 pizza ieri #amici`: importo, data, tag e categoria vengono compilati da soli |
| **Categorie automatiche** | Regole personali, apprendimento dai movimenti passati, dizionario di negozi italiani |
| **Puoi spendere oggi** | Budget giornaliero calcolato su entrate previste, spese fisse in arrivo e obiettivi |
| **Previsione del saldo** | Saldo dei prossimi 90 giorni con avviso se va sotto zero |
| **Budget a base zero** | Tetti per categoria, "da assegnare", riporto del residuo al mese dopo, suggerimento automatico |
| **Abbonamenti rilevati** | Trova i pagamenti che si ripetono e propone di aggiungerli ai ricorrenti |
| **Piano debiti** | Confronto tra Valanga, Palla di neve e sole rate minime: data di fine, interessi, ordine di rimborso |
| **Obiettivi** | Quanto mettere da parte ogni mese per arrivare in tempo |
| **Import da banca** | Qualsiasi CSV: riconosce colonne, date e importi italiani, colonne Dare/Avere, duplicati |
| **Report annuale** | Mese per mese, categorie, confronto con l'anno precedente |
| **Consigli** | Budget sforati, categorie in crescita, fondo di emergenza, regola 50/30/20 |
| **Conti** | Più conti, trasferimenti, patrimonio netto, correzione del saldo |
| **Account** | Accesso con Google o email: il Pro segue l'utente su tutti i dispositivi (facoltativo) |
| **Privacy** | Tasto per nascondere gli importi (P), i movimenti non lasciano il dispositivo |
| **Annulla** | Ogni modifica importante si può annullare dalla notifica |

## Gratis e Pro
| Gratis | Pro |
|---|---|
| Movimenti, inserimento rapido, categorie automatiche, budget, consigli, ricorrenti, backup | Tutto il piano gratuito |
| Fino a 3 conti e 2 obiettivi | Conti e obiettivi illimitati |
| | 🔮 **Il tuo futuro**: simulatore a 40 anni con eventi di vita e libertà finanziaria |
| | 🎁 **Il tuo anno in Fondi**: riepilogo a storie con immagine da condividere |
| | 📄 Report PDF, 📈 previsione del saldo, 🕵️ abbonamenti rilevati, 🏔️ piano debiti |
| | 📥 Import CSV della banca, ☁️ sincronizzazione cifrata, ↻ budget con riporto |

Pagamenti tramite Gumroad (o Lemon Squeezy): la piattaforma incassa, applica l'IVA e manda al cliente una chiave di licenza, che l'app verifica direttamente dal browser. Configurazione in `app.js`, oggetto `PRO`.
Anteprima della versione gratuita con dati di esempio: `index.html?demo&free`.

## Scorciatoie
`N` nuovo movimento · `/` cerca · `P` nascondi importi · `←` `→` cambia mese · `1`–`9` cambia pagina · `Shift+Invio` salva e aggiungi un altro

## Dati
Sono salvati nel `localStorage` del browser. Scarica un backup ogni tanto da **Impostazioni**.
I dati delle versioni precedenti vengono importati in automatico.
