const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

let autopilotData = {
  mode: undefined,
  altitude: 0,
  vertical_speed: 0,
  heading: 0,
  crs: 0,
  ias: 0,
};

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ port: 8081 });

// Fonction pour envoyer les données à tous les clients connectés
function sendToClient(client, data) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

// Récupérer les valeurs actuelles via un appel API
async function getInitialAutopilotData() {
  try {
    const response = await axios.post("http://192.168.1.11:43380/webapi", {
      getvars: [
        { var: "(L:SELECTED_BUG_MODE)", value: 0.0 },
        { var: "(A:AUTOPILOT ALTITUDE LOCK VAR, feet)", value: 0.0 },
        {
          var: "(A:AUTOPILOT VERTICAL HOLD VAR:0, Feet per minute)",
          value: 0.0,
        },
        { var: "(A:AUTOPILOT HEADING LOCK DIR, degrees)", value: 0.0 },
        { var: "(A:NAV1 OBS, degrees)", value: 0.0 },
        { var: "(A:AUTOPILOT AIRSPEED HOLD VAR:0, Knots)", value: 0.0 },
      ],
    });

    const data = response.data.getvars;
    // Mettre à jour les données autopilot avec les valeurs récupérées
    autopilotData = {
      mode: mapBugMode(data[0].value),
      altitude: data[1].value,
      vertical_speed: data[3].value,
      heading: data[2].value,
      crs: data[4].value,
      ias: data[5].value,
    };

    console.log("Données initiales:", autopilotData);

    return autopilotData;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données initiales:",
      error
    );
    return autopilotData; // En cas d'erreur, renvoie les valeurs par défaut
  }
}

// Fonction de mapping pour SELECTED_BUG_MODE
function mapBugMode(modeValue) {
  switch (modeValue) {
    case 1:
      return "ALT";
    case 2:
      return "VS";
    case 3:
      return "HDG";
    case 4:
      return "CRS";
    case 5:
      return "IAS";
    default:
      return "Unknown";
  }
}

// Route pour recevoir les mises à jour de mode et autres données d'autopilot
app.post("/autopilot/update", (req, res) => {
  const data = req.body;
  autopilotData = {
    ...autopilotData,
    ...data,
  };
  console.log("Data mis à jour");
  // Envoyer les nouvelles données à tous les clients WebSocket connectés
  wss.clients.forEach((client) => sendToClient(client, autopilotData));

  res.send("Données reçues et mises à jour");
});

// Lancer le serveur HTTP sur le port 8080
app.listen(8080, () => {
  console.log("Serveur HTTP en écoute sur le port 8080");
});

// Lancer le serveur WebSocket sur le port 8081
wss.on("connection", async (ws) => {
  console.log("Client connecté via WebSocket");

  // Récupérer les données initiales via l'API Axis and Ohs
  const initialData = await getInitialAutopilotData();

  // Envoyer les données actuelles au client connecté
  sendToClient(ws, initialData);
});
