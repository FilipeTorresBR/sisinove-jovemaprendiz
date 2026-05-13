import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import { authMiddleware } from "./middleware/auth.js";
import { initializeDatabase } from "./services/setupService.js";
import { fileURLToPath } from "url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "sisinove-jovemaprendiz-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/resources", authMiddleware, resourceRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const port = process.env.PORT || 4003;

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao iniciar banco:", error);
    process.exit(1);
  });
