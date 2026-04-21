import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const PORT = 3000;

  // Socket.io for Multiplayer
  const players = new Map();

  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (data) => {
      players.set(socket.id, { id: socket.id, name: data.name, x: 0, y: 5, z: 0, ry: 0 });
      // Send all existing players to the new player
      socket.emit("currentPlayers", Array.from(players.values()));
      // Tell everyone else about the new player
      socket.broadcast.emit("playerJoined", players.get(socket.id));
    });

    socket.on("move", (data) => {
      const player = players.get(socket.id);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
        player.ry = data.ry;
        // Broadcast movement to everyone else
        socket.broadcast.emit("playerMoved", player);
      }
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      players.delete(socket.id);
      io.emit("playerLeft", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
