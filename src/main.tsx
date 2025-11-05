import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  Tooltip,
  Title,
  Legend,
} from "chart.js";
import { MyScale } from "./components/MyScale.ts";

ChartJS.register(LinearScale, BarElement, Tooltip, Title, Legend, MyScale);

const queryClient = new QueryClient();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
