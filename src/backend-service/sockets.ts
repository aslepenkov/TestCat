import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { runAnalysisStreaming } from "./services/analysisRunner";

export const attachSockets = (httpServer: HttpServer, origin: string) => {
  const io = new Server(httpServer, { cors: { origin } });
  let running = false; // MVP: one analysis at a time

  io.on("connection", (socket) => {
    socket.on("start-analysis", async (options = {}) => {
      if (running) {
        return socket.emit("analysis-error", {
          message: "An analysis is already running",
        });
      }
      running = true;
      io.emit("analysis-started", {});
      try {
        const code = await runAnalysisStreaming(options, (message, type) =>
          io.emit("analysis-progress", { message, type }),
        );
        if (code === 0) io.emit("analysis-completed", {});
        else io.emit("analysis-error", { message: `Agent exited with code ${code}` });
      } catch (e) {
        io.emit("analysis-error", { message: (e as Error).message });
      } finally {
        running = false;
      }
    });

    socket.on("chat-message", () =>
      socket.emit("chat-response", {
        message: "Chat is not available yet in this version.",
      }),
    );
  });
  return io;
};
