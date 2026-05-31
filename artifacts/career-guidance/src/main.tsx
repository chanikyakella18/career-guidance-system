import { setBaseUrl } from "@workspace/api-client-react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
setBaseUrl(import.meta.env.VITE_API_URL ?? "https://career-guidance-system-bk8t.onrender.com");

createRoot(document.getElementById("root")!).render(<App />);


