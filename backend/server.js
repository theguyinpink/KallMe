const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// 🔓 Autoriser toutes les origines (à restreindre plus tard si besoin)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Servir les fichiers statiques (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "../public")));

// Route directe pour accéder à room.html (nécessaire sur Render)
app.get("/room.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/room.html"));
});

// (Optionnel) Page d’accueil si jamais
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// WebSocket + gestion de rooms privées
io.on("connection", (socket) => {
  console.log("🔌 Un utilisateur est connecté");

  socket.on("join", (roomId) => {
    socket.join(roomId);
    console.log(`🚪 Rejoint la room : ${roomId}`);

    socket.on("offer", (data) => {
      socket.to(roomId).emit("offer", data);
    });

    socket.on("answer", (data) => {
      socket.to(roomId).emit("answer", data);
    });

    socket.on("candidate", (data) => {
      socket.to(roomId).emit("candidate", data);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Déconnecté de la room ${roomId}`);
    });
  });
});

// Port dynamique pour Render (ou 3000 local)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
