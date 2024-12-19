/**
 * Unit-Tests für die DDoS Protection
 * 
 * Libraries:
 *  Chai: Assertion Library für Tests
 *  Supertest-Session: Ermöglicht das Testen von HTTP-Endpunkten mit Sitzungsunterstützung
 */


/* -------------------- Einbindung von Chai und Supertest-Session -------------------- */

const chai = require('chai');
const supertestSession = require('supertest-session');

/* -------------------- Definition der Konstanten -------------------- */

const server = require('./protection.js');
const should = chai.should();
const config = require('./config.json'); // Einlesen der Konfigurationsdatei

describe('DDoS Protection', () => {
  let testSession; // Variable für die Session

  before((done) => {
    // Server starten, falls er noch nicht läuft
    if (!server.listening) {
      server.listen(3000, done);
    } else {
      done();
    }
  });

  after((done) => {
    // Server schließen nach den Tests
    server.close(done);
  });

  beforeEach(() => {
    // Neue Test-Session vor jedem Test initialisieren
    testSession = supertestSession(server);
  });

  it('should return 200 for valid requests', (done) => {
    // Test für gültige Anfragen, die einen 200-Statuscode zurückgeben sollten
    testSession
      .get('/')
      .expect(200, done); // Erwartet einen 200-Statuscode
  });

  it('should return 429 for too many requests', (done) => {
    // Test für zu viele Anfragen, die einen 429-Statuscode zurückgeben sollten
    const requests = Array.from({ length: config.maxRequests + 1 }, () =>
      testSession.get('/')
    );

    Promise.all(requests)
      .then((responses) => {
        const lastResponse = responses[responses.length - 1]; // Letzte Antwort prüfen
        lastResponse.status.should.equal(429); // Erwartet einen 429-Statuscode
        done();
      })
      .catch(done);
  });

  it('should show captcha when rate limit is exceeded', (done) => {
    // Test, ob das Captcha angezeigt wird, wenn das Anfragelimit überschritten wird
    const requests = Array.from({ length: config.maxRequests + 1 }, () =>
      testSession.get('/')
    );

    Promise.all(requests)
      .then((responses) => {
        const lastResponse = responses[responses.length - 1]; // Letzte Antwort prüfen
        lastResponse.status.should.equal(429); // Erwartet einen 429-Statuscode
        lastResponse.text.should.include('<form method="POST" action="/verify-captcha">'); // Captcha-Formular prüfen

        done();
      })
      .catch(done);
  });
});
