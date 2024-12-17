/**
 * Skript zum Abfangen von DDoS Attacken.
 * Der Nutzer soll beim Zugriff dann ein Captcha bekommen, 
 * wenn es zu viele Anfragen pro Sekunde gibt.
 * 
 * Genutzte Libraries:
 *  Express: Web-Framework für Node.js zur Erstellung von Webanwendungen und APIs.
 *  SVG-Captcha: Bibliothek zur Generierung von SVG-Captcha-Bildern.
 *  Express Rate Limit: Middleware zur Begrenzung der Anfragenrate pro IP-Adresse.
 *  HTTP Proxy Middleware: Middleware zum Erstellen eines HTTP-Proxys.
 *  Express Session: Middleware zur Verwaltung von Sitzungen in Express-Anwendungen.
 *  FS (File System): Modul zum Lesen und Schreiben von Dateien.
 */


/* -------------------- Import der Libraries -------------------- */

const express = require('express');
const rateLimit = require('express-rate-limit');
const svgCaptcha = require('svg-captcha');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const session = require('express-session');

/* -------------------- Einlesen der Config -------------------- */

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

/* -------------------- Initialisierung der App -------------------- */

const app = express(); //Erstellung der Express Anwendung
const PORT = 3000; //Port zum Ansprechen des Skriptes 
const ORIGIN_SITE = 'http://example.com'; //Seite die ursprünglich angesprochen werden soll

/* -------------------- Session-Middleware einrichten -------------------- */

app.use(session({
  secret: 'test-key', //Schlüssel zu Testzwecken
  resave: false, //Nicht bei jeder Anfrage neu speichern
  saveUninitialized: false, //Neue Sitzung nur speichern, wenn Daten vorhanden
  cookie: { secure: false } //Cookies auch unter HTTP
}));

/* -------------------- URL-encoded Middleware hinzufügen -------------------- */

app.use(express.urlencoded({ extended: true })); //Parsen von URL-encoded Daten ermöglichen

/* -------------------- Rate-Limiting Middleware -------------------- */

const limiter = rateLimit({
  windowMs: config.requestMilSecTimeWindow, //Zeitfenster in Millisekunden
  max: config.maxRequests, //Maximale Anfragen pro IP im Zeitfenster
  handler: (req, res) => {
    //Ursprüngliche URL speichern
    req.session.originalUrl = req.originalUrl;
    //Captcha anzeigen, wenn das Limit überschritten wird
    const captcha = svgCaptcha.create();
    //Captcha Text in Session speichern
    req.session.captcha = captcha.text;
    //Als Antwort Captcha erstellen und senden
    res.status(429).send(`
      <form method="POST" action="/verify-captcha">
        <div>${captcha.data}</div>
        <input type="text" name="captcha" />
        <button type="submit">Eingabe</button>
      </form>
    `);
  }
});
//Limiter in Express App einbinden
app.use(limiter);

/* -------------------- Captcha-Verifizierung -------------------- */

app.post('/verify-captcha', (req, res) => {
  if (req.body.captcha === req.session.captcha) {
    req.session.captcha = null; //Captcha zurücksetzen
    limiter.resetKey(req.ip); //Status der IP-Adresse zurücksetzen
    const redirectUrl = req.session.originalUrl || '/'; //Ursprüngliche URL oder Root
    req.session.originalUrl = null; //Ursprüngliche URL zurücksetzen
    res.redirect(redirectUrl); //Zur ursprünglichen URL weiterleiten
    console.log("Captcha korrekt");
  } else {
    res.status(400).send('Captcha falsch. Bitte erneut versuchen.'); //Fehlerausgabe wenn Captcha falsch
  }
});

/* -------------------- Proxy-Middleware -------------------- */

app.use('/', createProxyMiddleware({
  target: ORIGIN_SITE, //Alle Anfragen an die definierte Seite leiten
  changeOrigin: true, //Host Header auf Ziel URL ändern
  onProxyReq: (proxyReq, req) => {
    req.session.originalUrl = req.originalUrl; // Ursprüngliche URL speichern über Callback
  }
}));

/* -------------------- Server starten -------------------- */

app.listen(PORT, () => { //Server starten
  console.log(`Server läuft auf Port ${PORT}`); //Callback zur Konsolenausgabe zum Start
});
