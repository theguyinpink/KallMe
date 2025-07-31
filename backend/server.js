const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// On sert les fichiers dans /public
app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {
  console.log("🔌 Un utilisateur est connecté");

  // Signaling WebRTC
  socket.on("offer", (data) => socket.broadcast.emit("offer", data));
  socket.on("answer", (data) => socket.broadcast.emit("answer", data));
  socket.on("candidate", (data) => socket.broadcast.emit("candidate", data));

  socket.on("disconnect", () => {
    console.log("❌ Un utilisateur s'est déconnecté");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
