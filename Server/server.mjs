import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const guestusers = [];
const rematchPairs = new Map();
const rematchRequests = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  guestusers.push(socket.id);

  socket.on("play_request", (data) => {
    const index = guestusers.indexOf(socket.id);
    if (index !== -1) {
      guestusers[index] = {
        id: socket.id,
        username: data.username,
        socket,
        paired: false
      };
    }

    const user = guestusers.find(u => u.id === socket.id);
    if (!user || user.paired) return;


    //print("Current users:", guestusers.map(u => u.username || u.id));
    console.log("Current users:", guestusers.map(u => u?(u.username):''));

    const opponent = guestusers.find(u => u.id !== socket.id && !u.paired);

    
    if (!opponent) {
      user.socket.emit("OpponentNotFound");
      user.waiting = true;
      return;
    }
    console.log("Opponent found:", opponent ? opponent.username : "");

    // Pair players
    user.paired = true;
    opponent.paired = true;

    opponent.waiting = false;

    // Assign playing symbols
    user.playingAs = "circle"
    opponent.playingAs = "cross";
    // user.playingAs = Math.random() "circle";
    // opponent.playingAs = "cross";

    // Notify players
    user.socket.emit("OpponentFound", {
      username: opponent.username,
      playingAs: user.playingAs
    });

    opponent.socket.emit("OpponentFound", {
      username: user.username,
      playingAs: opponent.playingAs
    });

    // Save pairing
    rematchPairs.set(user.id, opponent.socket);
    rematchPairs.set(opponent.id, user.socket);


    user.socket.on("playerMoveFromClient", (data) => {
      opponent.socket.emit("playerMoveServer", data);
    });

    opponent.socket.on("playerMoveFromClient", (data) => {
      user.socket.emit("playerMoveServer", data);
    });

    user.socket.on("chatMessage", ({ message, playerName }) => {
      opponent.socket.emit("chatMessage", { message, playerName });
    });

    opponent.socket.on("chatMessage", ({ message, playerName }) => {
      user.socket.emit("chatMessage", { message, playerName });
    });
  });
  
  socket.on("reject", () => {
    const index = guestusers.findIndex(u => u.id === socket.id);
    if (index !== -1) {
      guestusers[index].paired = false;
      guestusers[index].waiting = false;
    }
    socket.emit("play_request_rejected");

  });

  socket.on("playAgainRequest", () => {
    const opponentSocket = rematchPairs.get(socket.id);
    console.log("rematch requested by:", socket.id);
    // console.log("opponentSocket:", opponentSocket ? opponentSocket.id : "none");
    if (!opponentSocket) return;

    rematchRequests.set(socket.id, true);

    if (rematchRequests.get(opponentSocket.id)) {
      // Both agreed
      // console.log("rematch accepted by ", opponentSocket.id);
      rematchRequests.delete(socket.id);
      rematchRequests.delete(opponentSocket.id);

      const user1 = guestusers.find(u => u.id === socket.id);
      const user2 = guestusers.find(u => u.id === opponentSocket.id);

      if (!user1 || !user2) return;

      // Swap symbols
      const temp = user1.playingAs;
      user1.playingAs = temp === "circle" ? "cross" : "circle";
      user2.playingAs = temp;

      const starting = Math.random() < 0.5 ? user1 : user2;

      socket.emit("startNewGame", {
        playingAs: user1.playingAs,
        currentTurn: starting.id === user1.id
      });

      opponentSocket.emit("startNewGame", {
        playingAs: user2.playingAs,
        currentTurn: starting.id === user2.id
      });

      // Reset pairing
      user1.paired = false;
      user2.paired = false;

      // Auto replay
      socket.emit("play_request", { username: user1.username });
      opponentSocket.emit("play_request", { username: user2.username });
    } else {
      // console.log("Waiting for opponent to accept rematch");
      opponentSocket.emit("opponentWantsRematch");
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    const opponentSocket = rematchPairs.get(socket.id);
    if (opponentSocket) {
      console.log("Opponent found for disconnection:", opponentSocket);
      opponentSocket.paired = false;
      opponentSocket.emit("OpponentDisconnected");
      rematchPairs.delete(opponentSocket.id);
    }

    rematchPairs.delete(socket.id);
    rematchRequests.delete(socket.id);

    const index = guestusers.findIndex(
      u => (typeof u === "string" && u === socket.id) ||
        (typeof u === "object" && u.id === socket.id)
    );

    if (index !== -1) guestusers.splice(index, 1);
    console.log("Remaining users:", guestusers.length);
  });
});

httpServer.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
