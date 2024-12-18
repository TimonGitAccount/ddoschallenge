/**
 * Skript zum Senden vieler Anfragen zum Test.
 * 
 * Genutzte Libraries:
 *  Axios: HTTP Client Funktionalitäten
 */

/* -------------------- Import von Axios -------------------- */

const axios = require('axios');

/* -------------------- Definition der Konstanten -------------------- */

const URL = 'http://localhost:3000'; //Proxy-Server URL
const REQUESTS_PER_SECOND = 6; //Anzahl Anfragen pro Sekunde
const DURATION = 10; //Testdauer in Sekunden

/* -------------------- Senden der Anfragen -------------------- */

async function sendRequest() {
  try {
    //GET-Anfrage erwarten und Statuscode ausgeben
    const response = await axios.get(URL);
    console.log(`Status: ${response.status}`);
  } catch (error) {
    if (error.response) {
      //Fehler ausgeben wenn Server antwortete
      console.log(`Error Status: ${error.response.status}`);
    } else {
      //Fehler ausgeben wenn Server nicht antwortete
      console.log(`Error: ${error.message}`);
    }
  }
}

/* -------------------- Test durchführen -------------------- */

function startTest() {
  const interval = 1000 / REQUESTS_PER_SECOND; //Interval zwischen Anfragen berechnen
  let count = 0;
  const intervalId = setInterval(() => {
    if (count >= REQUESTS_PER_SECOND * DURATION) { //Test auf Anzahl gesendeter Anfragen
      clearInterval(intervalId); //Intervall beenden und Test abschließen
      console.log('Test abgeschlossen');
      return;
    }
    sendRequest(); //Anfrage senden
    count++; //Anfragencounter erhöhen
  }, interval);
}

startTest();
