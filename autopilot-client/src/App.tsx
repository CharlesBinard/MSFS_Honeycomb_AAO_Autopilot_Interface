import { motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

// Définir le type des données reçues
interface AutopilotData {
  altitude: number;
  heading: number;
  ias: number;
  vertical_speed: number;
  crs: number;
  mode: string;
}

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
    // Se connecter au WebSocket
    const ws = new WebSocket("ws://localhost:8081"); // Connexion WebSocket

    ws.onopen = () => {
      console.log("Connecté au serveur WebSocket");
    };

    ws.onmessage = (event) => {
      // Quand on reçoit des données via WebSocket, on les met à jour
      const data = JSON.parse(event.data);
      setAutopilotData(data);
    };

    ws.onclose = () => {
      console.log("Déconnexion du serveur WebSocket");
    };

    return () => {
      ws.close(); // Fermer la connexion WebSocket quand le composant est démonté
    };
  }, []);

  const renderDataValue = useCallback(() => {
    switch (autopilotData.mode) {
      case "ALT":
        return `${autopilotData.altitude} ft`;
      case "HDG":
        return `${autopilotData.heading}°`;
      case "IAS":
        return `${autopilotData.ias} kts`;
      case "VS":
        return `${autopilotData.vertical_speed}°`;
      case "CRS":
        return `${autopilotData.crs}°`;
      default:
        return "--";
    }
  }, [autopilotData]);

  const otherModes = useMemo(() => {
    return [
      { title: "ALT", value: `${autopilotData.altitude} ft ` },
      { title: "HDG", value: `${autopilotData.heading}°` },
      { title: "IAS", value: `${autopilotData.ias} kts` },
      { title: "VS", value: `${autopilotData.vertical_speed}°` },
      { title: "CRS", value: `${autopilotData.crs}°` },
    ];
  }, [autopilotData]);

  const renderDataTitle = useMemo(
    () => autopilotData.mode,
    [autopilotData.mode]
  );

  return (
    <div className="app">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="selected-mode"
      >
        {autopilotData.mode}:{" "}
        <span className="mode-value">{renderDataValue()}</span>
      </motion.h1>

      {/* Autres modes en bas */}
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
