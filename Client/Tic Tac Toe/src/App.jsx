import { useEffect, useState } from 'react';
import './App.css';
import Square from './square/square.jsx';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import Loading from './loading/loading.jsx';
import Emoji from './emoji/emoji.jsx';
import TicTacToeBackground from './background/TicTacToeBackground.jsx';
import Send from './assets/send.svg';


// Function to initialize the board with nulls
const initialBoard = () => [[null, null, null], [null, null, null], [null, null, null]];

function App() {
  const [gameSquare, setGameSquares] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState('circle');
  const [winner, setWinner] = useState();
  const [gameOver, setGameOver] = useState(false);
  const [final, setFinal] = useState([]);
  const [play, setPlay] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [playingAs, setPlayingAs] = useState(null);
  const [playAgainRequest, setPlayAgainRequest] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const findwinner = () => {
    for (let i = 0; i < 3; i++) {
      // Rows
      if (
        gameSquare[i][0] === gameSquare[i][1] &&
        gameSquare[i][1] === gameSquare[i][2] &&
        gameSquare[i][0] !== null
      ) {
        setFinal([i * 3, i * 3 + 1, i * 3 + 2]);
        setWinner(gameSquare[i][0]);
        return;
      }

      // Columns
      if (
        gameSquare[0][i] === gameSquare[1][i] &&
        gameSquare[1][i] === gameSquare[2][i] &&
        gameSquare[0][i] !== null
      ) {
        setFinal([i, 3 + i, 6 + i]);
        setWinner(gameSquare[0][i]);
        return;
      }
    }

    // Diagonal 1
    if (
      gameSquare[0][0] === gameSquare[1][1] &&
      gameSquare[1][1] === gameSquare[2][2] &&
      gameSquare[0][0] !== null
    ) {
      setFinal([0, 4, 8]);
      setWinner(gameSquare[0][0]);
      return;
    }

    // Diagonal 2
    if (
      gameSquare[0][2] === gameSquare[1][1] &&
      gameSquare[1][1] === gameSquare[2][0] &&
      gameSquare[0][2] !== null
    ) {
      setFinal([2, 4, 6]);
      setWinner(gameSquare[0][2]);
      return;
    }

    // Draw
    if (gameSquare.flat().every(cell => typeof cell === 'string')) {
      setWinner('draw');
      return;
    }
  };

  useEffect(() => {
    findwinner();
  }, [gameSquare]);

  useEffect(() => {
    if (winner) {
      if (winner === playingAs) {
        setPlayerScore(prev => prev + 1);
      } else if (winner && winner !== 'draw') {
        setOpponentScore(prev => prev + 1);
      } else if (winner === 'draw') {
        setPlayerScore(prev => prev + 0.5);
        setOpponentScore(prev => prev + 0.5);
      }
      setGameOver(true);
    }
  }, [winner]);

  useEffect(() => {
    if (!socket) return;

    const handleNotFound = () => {
      setOpponentName(false);
      // console.log("Opponent not found");
    };

    const handleFound = (data) => {
      setOpponentName(data.username);
      setPlayingAs(data.playingAs);
      console.log("Opponent found", data.username);
      setGameOver(false);
      setWinner(null);
      setFinal([]);
      setGameSquares(initialBoard());
      setPlayAgainRequest(false);
    };

    socket.on("OpponentNotFound", handleNotFound);
    socket.on("OpponentFound", handleFound);

    socket.on("playerMoveServer", (data) => {
      // console.log("Received move from server:", data);
      setGameSquares(prev => {
        const newBoard = prev.map(row => [...row]);
        newBoard[data.state.row][data.state.col] = data.state.sign;
        return newBoard;
      });
      setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
    });

    socket.on("play_request_rejected", () => {
      Swal.fire({
        title: "Play Request Rejected",
      })
        .then(() => {
          setPlay(false);
          socket.disconnect();
        });
    });

    socket.on("opponentWantsRematch", () => {
      Swal.fire({
        title: `${opponentName} wants to play again`,
        confirmButtonText: "Accept",
        denyButtonText: "Decline",
        showDenyButton: true,
        icon: "question",
      }).then((result) => {
        if (result.isConfirmed) {
          setPlayAgainRequest(true);
          socket.emit("playAgainRequest");
          // socket.emit("playAgainResponse", { playerName, accept: true });
        } else {
          socket.emit("reject", { playerName, accept: false });
          setPlay(false);
          socket.disconnect();
        }
      });
    });

    socket.on("OpponentDisconnected", async () => {
      const res = await handleDisconnect();
      if (res) {
        setOpponentName('');
        // socket.paired=false;
        setGameOver(false);
        setWinner(null);
        setFinal([]);
        console.log("Opponent disconnected, starting new game");
        setGameSquares(initialBoard());
        setPlayAgainRequest(false);
        console.log(playerName);
        socket.disconnect();
        setPlayerScore(0);
        setOpponentScore(0);
        const newsocket = io('http://localhost:3000');
        setSocket(newsocket);
        newsocket.emit("play_request", { username: playerName });
      }
      else {
        setOpponentName('');
        // socket.paired=false;
        setGameOver(false);
        setWinner(null);
        setFinal([]);
        setGameSquares(initialBoard());
        setPlayAgainRequest(false);
        console.log("Opponent disconnected, starting new game");
        console.log("Leave clicked");
        disconnect();
        setPlay(false);
      }
    });

    const handleDisconnect = async () => {
      const res = await Swal.fire({
        title: "Opponent Disconnected",
        text: "Your Opponent has left the game. You can wait for a new opponent or leave the game.",
        icon: "warning",
        confirmButtonText: "Wait for new opponent",
        denyButtonText: "Leave",
        showDenyButton: true,
      })
      return res.isConfirmed;
    };




    socket.on('chatMessage', ({ message, playerName: sender }) => {
      const chatMessages = document.querySelector('.chat_messages');
      const newMessage = document.createElement('div');
      newMessage.className = sender === playerName ? 'chat_message user' : 'chat_message opponent';
      newMessage.innerHTML = `<span class="sender">${sender}</span><div class="bubble">${message}</div>`;
      chatMessages.appendChild(newMessage);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });


    socket.on("startNewGame", ({ playingAs, currentTurn }) => {
      setGameOver(false);
      setWinner(null);
      setFinal([]);
      setGameSquares(initialBoard());
      setPlayAgainRequest(false);
      setPlayingAs(playingAs);
      setCurrentPlayer(currentTurn ? playingAs : (playingAs === 'circle' ? 'cross' : 'circle'));
    });
    return () => {
      socket.off("OpponentNotFound", handleNotFound);
      socket.off("OpponentFound", handleFound);
    };
  }, [socket]);

  const takeplayername = async () => {
    const result = await Swal.fire({
      title: "Enter your Name",
      input: "text",
      inputLabel: "Your Name",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "You need to write something!";
      }
    });
    return result;
  };



  async function playOnline() {
    const res = await takeplayername();
    if (!res.isConfirmed) return;

    const username = res.value;
    setPlayerName(username);

    const newSocket = io('http://localhost:3000');
    newSocket.emit("play_request", { username });
    setSocket(newSocket);
    setPlay(true);
  }

  function playagain() {
    if (!playAgainRequest) {
      setPlayAgainRequest(true);
      socket.emit("playAgainRequest");
      Swal.fire("Waiting for opponent to accept rematch...");
    }
  }

  function disconnect() {
    if (socket) {
      socket.disconnect(); // Triggers the backend "disconnect" cleanup
    }

    // Reset ALL state
    setSocket(null);
    setOpponentName('');
    setPlayerName('');
    setGameOver(false);
    setWinner(null);
    setFinal([]);
    setGameSquares(initialBoard());
    setPlayingAs(null);
    setCurrentPlayer('circle');
    setPlayAgainRequest(false);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlay(false);
  }



  // UI rendering logic
  if (!play) {
    return (
      <div className="main_div">
        <TicTacToeBackground />
        <button onClick={playOnline} className='play_online'>Play Online</button>
      </div>
    );
  }

  if (play && !opponentName) {
    return (
      <div className='LoadingPage'>

        Waiting for opponent to join.
        <br />
        <br />
        <br />
        <br />

        <div className="flex">
          <Loading /><Loading /><Loading />
        </div>

        <br />
        <div className="flex">
          <Loading /><Loading /><Loading />
        </div>
        <br />
        <div className="flex">
          <Loading /><Loading /><Loading />
        </div>
        <div className='waitingtext'>Waiting for opponent . . .</div>
      </div>
    );
  }

  function snd_msg() {
    const message = document.querySelector('.chat_input').value;
    if (!message.trim()) return;
    document.querySelector('.chat_input').value = '';
    socket.emit('chatMessage', { message, playerName });

    const chatMessages = document.querySelector('.chat_messages');
    const newMessage = document.createElement('div');
    newMessage.className = 'chat_message user';
    newMessage.innerHTML = `<span class="sender">${playerName}</span><div class="bubble">${message}</div>`;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  return (
    <div className='app_container'>
      <div className='chatandscore'>
        <div className="scorebox">
          <h2>Score</h2>
          <div className="score_container">
            <div className="player_score">
              <h3>{playerName}</h3>
              <span className='score_value'>{playerScore}</span>
            </div>
            <div className="opponent_score">
              <h3>{opponentName}</h3>
              <span className='score_value'>{opponentScore}</span>
            </div>
          </div>
        </div>

        <div className='chatbox'>
          <div className="head">
            <h2>Chat Box</h2>
          </div>
          <div className='chat_messages' >
            {/* <img src="./assets/backpic" alt="Background" className='chat_icon' /> */}
            {/* Chat messages will go here */}

          </div>
          <div className="emoji_and_chat">
            <div className="emoji_container">
              <Emoji socket={socket} playerName={playerName} />
            </div>
            <div className="chat_stuff">
              <input type="text" placeholder="   Type here..." className='chat_input' onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  snd_msg();
                }
              }} />
              <button className='send_button' onClick={snd_msg}><img src={Send} className='imgg' /></button>
            </div>
          </div>
        </div>

      </div>

      <div className="main_div">
        <div className="leave"><button className='Leave' onClick={disconnect}>Leave</button></div>
        <div className="move_detection">
          <div className={`left ${playingAs === currentPlayer ? 'current-move-' + currentPlayer : ''}`}>
            {playerName}
          </div>
          <div className={`right ${playingAs !== currentPlayer ? 'current-move-' + currentPlayer : ''}`}>
            {opponentName}
          </div>
        </div>

        <div><h1 className="heading">Tic Tac Toe</h1></div>

        <div className='square_wrapper'>
          {
            gameSquare.map((row, r) =>
              row.map((cell, c) => (
                <Square
                  key={r * 3 + c}
                  row={r}
                  col={c}
                  currentelement={cell}
                  final={final}
                  socket={socket}
                  playingAs={playingAs}
                  winner={winner}
                  gameOver={gameOver}
                  gameSquare={gameSquare}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  setWinner={setWinner}
                  setGameSquares={setGameSquares}
                />
              ))
            )
          }
        </div>

        <div className="game_status">
          {winner && (
            <h2>
              {winner === 'draw'
                ? "It's a draw!"
                : winner === playingAs
                  ? "You Won the game ⭐"
                  : "You Lost the game 🥲"}
            </h2>
          )}
          {opponentName && !winner && (
            <div>
              <h3>Opponent : {opponentName}</h3>
            </div>
          )}
          {winner && (
            <div>
              <button className='play_again' onClick={playagain}>Play Again</button></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
