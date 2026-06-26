import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/global.scss";
import { LanguageProvider, useLang } from "./context/LanguageContext";
import { theme } from "./theme";
import App from "./App";

function ThemedApp() {
  const { dir } = useLang();
  return (
    <DirectionProvider key={dir} initialDirection={dir} detectDirection={false}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position={dir === "rtl" ? "top-left" : "top-right"} />
        <App />
      </MantineProvider>
    </DirectionProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ThemedApp />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
