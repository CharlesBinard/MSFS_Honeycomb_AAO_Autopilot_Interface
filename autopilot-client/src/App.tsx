import { motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  HDG: { key: "heading", unit: "°" },
  IAS: { key: "ias", unit: "kts" },
  VS: { key: "vertical_speed", unit: "f/m" },
  CRS: { key: "crs", unit: "°" },
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

  const renderDataValue = useCallback(() => {
    const config =
      autopilotConfig[autopilotData.mode as keyof typeof autopilotConfig];
    if (config) {
      return `${autopilotData[config.key as keyof AutopilotData]} ${
        config.unit
      }`;
    }
    return "--";
  }, [autopilotData]);

  const otherModes = useMemo(() => {
    return Object.entries(autopilotConfig).map(([mode, config]) => ({
      title: mode,
      value: `${autopilotData[config.key as keyof AutopilotData]} ${
        config.unit
      }`,
    }));
  }, [autopilotData]);

  const renderDataTitle = useMemo(
    () => autopilotData.mode,
    [autopilotData.mode]
  );

  return (
    <div className="app">
      {/* Affichage du mode sélectionné */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="selected-mode"
      >
        {renderDataTitle}:{" "}
        <span className="mode-value">{renderDataValue()}</span>
      </motion.h1>

      {/* Affichage des autres modes */}
      <motion.div
        className="other-modes"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {otherModes
          .filter((mode) => mode.title !== renderDataTitle)
          .map((mode, index) => (
            <div key={index} className="mode-item">
              <span className="mode-title">{mode.title}</span>:{" "}
              <span className="mode-value">{mode.value}</span>
            </div>
          ))}
      </motion.div>
    </div>
  );
};

export default App;
