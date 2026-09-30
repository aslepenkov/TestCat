import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import analyzeRouter from "./routes/analyze";
import outputRouter from "./routes/output";
import { attachSockets } from "./sockets";
import { fileURLToPath } from "url";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerFile = path.join(__dirname, "swagger-output.json");
const swaggerData = fs.readFileSync(swaggerFile, "utf8");
const swaggerOutput = JSON.parse(swaggerData);

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerOutput));

// Mount routers for functional separation
app.use("/", analyzeRouter);
app.use("/", outputRouter);
app.get("/health", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/swagger`);
});

attachSockets(server, process.env.CORS_ORIGIN || "*");

export { app, server };
