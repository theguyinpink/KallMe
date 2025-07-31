const socket = io(); // Connexion Socket.IO
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const callBtn = document.getElementById("startCall");

let localStream;
let peerConnection;

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // STUN server public
  ]
};

// 1. Demander accès à la caméra/micro
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
  localStream = stream;
  localVideo.srcObject = stream;
}).catch((error) => {
  console.error("Erreur media:", error);
});

// 2. Quand tu cliques sur "Appeler"
callBtn.addEventListener("click", async () => {
  peerConnection = new RTCPeerConnection(config);

  // Quand tu reçois une piste de l’autre
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Ajoute ton propre stream dans la connexion
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Envoie les ICE candidates (trous réseau) à l’autre
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate);
    }
  };

  // Création de l'offre
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
});

// 3. Quand tu reçois une "offer" de quelqu’un
socket.on("offer", async (offer) => {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate);
    }
  };

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
});

// 4. Quand tu reçois une "answer"
socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});

// 5. Quand tu reçois un "candidate" réseau
socket.on("candidate", async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.error("Erreur ICE : ", e);
  }
});
