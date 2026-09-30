import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "TestCatAi API",
    description: "API for TestCatAi services",
  },
  host: "localhost:3000",
  basePath: "/",
  schemes: ["http"],
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, "dist", "swagger-output.json");

// ...existing code...
swaggerAutogen()(outputFile, [path.join(__dirname, "dist", "index.js")], doc);
