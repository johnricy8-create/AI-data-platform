import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./extra.css";

const container = document.getElementById("root");
if (!container) throw new Error("root element not found");

createRoot(container).render(<App />);
