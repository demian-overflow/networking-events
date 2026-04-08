import { Server } from "socket.io";

export function setupChat(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    const userName = `Guest #${socket.id.slice(0, 6)}`;

    console.log(`Chat: ${userName} connected`);

    socket.emit("chat:welcome", {
      message: `Ласкаво просимо до чату підтримки, ${userName}!`,
      userName,
    });

    socket.broadcast.emit("chat:system", {
      message: `${userName} приєднався до чату`,
    });

    socket.on("chat:message", (data) => {
      const msg = {
        id: Date.now(),
        userName,
        text: String(data.text || "").slice(0, 1000),
        timestamp: new Date().toISOString(),
      };
      io.emit("chat:message", msg);
    });

    socket.on("chat:typing", () => {
      socket.broadcast.emit("chat:typing", { userName });
    });

    socket.on("disconnect", () => {
      console.log(`Chat: ${userName} disconnected`);
      socket.broadcast.emit("chat:system", {
        message: `${userName} покинув чат`,
      });
    });
  });

  return io;
}
