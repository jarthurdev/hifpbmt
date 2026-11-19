import { app } from "./app";
import { prisma } from "./shared/prisma";

const port = Number(process.env.API_PORT || 3333);
const server = app.listen(port, () => {
  console.log(`HIFPB API listening on port ${port}.`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received; shutting down.`);
  server.close(async error => {
    if (error) {
      console.error("HTTP server shutdown failed:", error);
      process.exitCode = 1;
    }
    await prisma.$disconnect();
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
