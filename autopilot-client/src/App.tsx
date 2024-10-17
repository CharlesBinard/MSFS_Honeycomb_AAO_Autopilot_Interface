import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

// Définition de l'interface pour les données d'autopilot
interface AutopilotData {
  altitude: number;
  heading: number;
  ias: number;
  vertical_speed: number;
  crs: number;
  mode: string;
}

const autopilotConfig = {
  ALT: { key: "altitude", unit: "ft" },
  VS: { key: "vertical_speed", unit: "f/m" },
  HDG: { key: "heading", unit: "°" },
  CRS: { key: "crs", unit: "°" },
  IAS: { key: "ias", unit: "kts" },
};

const WEBSOCKET_URL = import.meta.env.WEBSOCKET_URL || "ws://192.168.1.12:8081";

const App: React.FC = () => {
  const [autopilotData, setAutopilotData] = useState<AutopilotData>({
    altitude: 0,
    heading: 0,
    ias: 0,
    vertical_speed: 0,
    crs: 0,
    mode: "",
  });

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("Connecté au serveur WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setAutopilotData(data);
      } catch (error) {
        console.error("Erreur de parsing JSON:", error);
      }
    };

    ws.onclose = () => {
      console.log("Déconnexion du serveur WebSocket");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Calculer les valeurs pour chaque mode
  const otherModes = useMemo(() => {
    return Object.entries(autopilotConfig).map(([mode, config]) => ({
      title: mode,
      value: `${autopilotData[config.key as keyof AutopilotData]} ${
        config.unit
      }`,
    }));
  }, [autopilotData]);

  return (
    <div className="app">
      {/* Affichage vertical des modes et de leurs valeurs */}
      <motion.div
        className="dial-container-vertical"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {otherModes.map((mode, index) => (
          <motion.div
            key={index}
            className={`dial-item-vertical ${
              mode.title === autopilotData.mode ? "selected" : ""
            }`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="mode-title">{mode.title}:</span>
            <span className="mode-value">{mode.value}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default App;
