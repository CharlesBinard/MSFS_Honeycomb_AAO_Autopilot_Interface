import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import WebSocket from "ws";

dotenv.config(); // Load environment variables

const app = express();

app.use(cors());
app.use(express.json());

const API_URL = process.env.API_URL || "http://localhost:43380/webapi";

interface AutopilotData {
  mode?: string;
  altitude: number;
  vertical_speed: number;
  heading: number;
  crs: number;
  ias: number;
}

let autopilotData: AutopilotData = {
  mode: undefined,
  altitude: 0,
  vertical_speed: 0,
  heading: 0,
  crs: 0,
  ias: 0,
};

const wss = new WebSocket.Server({ port: 8081 });

function sendToClient(client: WebSocket, data: AutopilotData): void {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

async function getInitialAutopilotData(): Promise<AutopilotData> {
  try {
    const response = await axios.post(API_URL, {
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
    autopilotData = {
      mode: mapBugMode(data[0].value),
      altitude: data[1].value,
      vertical_speed: data[2].value,
      heading: data[3].value,
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
    return autopilotData; // Retourne les valeurs actuelles en cas d'échec
  }
}

function mapBugMode(modeValue: number): string {
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
app.post("/autopilot/update", (req: Request, res: Response) => {
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

app.listen(8080, () => {
  console.log("Serveur HTTP en écoute sur le port 8080");
});

wss.on("connection", async (ws: WebSocket) => {
  console.log("Client connecté via WebSocket");
  const initialData = await getInitialAutopilotData();
  sendToClient(ws, initialData);
});
