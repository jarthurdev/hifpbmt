import express, { ErrorRequestHandler } from "express";
import path from "node:path";
import { ZodError } from "zod";
import { academicRouter } from "./routes/academic.routes";
import { HttpError } from "./shared/http-error";
import { Prisma } from "@prisma/client";

export const app = express();

app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type");
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: "5mb" }));
app.use("/api", academicRouter);
app.use(express.static(path.resolve(process.cwd(), "../frontend")));
app.use((_request, response) => {
  response.status(404).json({ error: "Route not found." });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Invalid request.", details: error.flatten() });
    return;
  }
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    response.status(400).json({ error: "Invalid JSON request body." });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = [
        Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target || ""),
        error.message
      ].join(",").toLowerCase();
      const resource = target.includes("professor") ? "professor" :
        target.includes("room") ? "sala" :
        target.includes("class_group") ? "turma" : "recurso";
      response.status(409).json({
        error: resource === "recurso"
          ? "Já existe um registro com esses dados."
          : `Conflito de horário: ${resource} já está ocupado neste dia e faixa de horário.`
      });
      return;
    }
    if (error.code === "P2025") {
      response.status(404).json({ error: "Registro não encontrado." });
      return;
    }
    if (error.code === "P2003") {
      response.status(409).json({ error: "Não é possível remover ou alterar o registro porque ele está em uso." });
      return;
    }
  }
  console.error("Request failed:", error);
  response.status(500).json({ error: "Internal server error." });
};

app.use(errorHandler);
