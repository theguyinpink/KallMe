const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const callBtn = document.getElementById("startCall");

let localStream;
let peerConnection;

// Serveurs STUN (pour percer les NAT/firewall)
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// 🔸 Étape 1 – Obtenir le flux de la caméra + micro
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
  })
  .catch((err) => {
    alert("Erreur d'accès à la caméra/micro : " + err.message);
    console.error(err);
  });

// 🔸 Étape 2 – Clique sur "Appeler" → crée la connexion + envoie une offre
callBtn.addEventListener("click", async () => {
  startPeerConnection();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
});

// 🔸 Fonction pour créer une PeerConnection + ajouter le flux local
function startPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate);
    }
  };
}

// 🔸 Quand tu reçois une offre de l'autre personne
socket.on("offer", async (offer) => {
  startPeerConnection();

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
});

// 🔸 Quand tu reçois une réponse
socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});

// 🔸 Quand tu reçois un candidat ICE
socket.on("candidate", async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (err) {
    console.error("Erreur ICE :", err);
  }
});

// 🔸 Rejoindre la room (ex : room.html?room=clement-elodie)
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "default";
socket.emit("join", roomId);
