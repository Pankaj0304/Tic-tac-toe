import React, { useEffect, useState } from "react";
import "./TicTacToeBackground.css";

const TicTacToeBackground = ({ onPlay }) => {
  const [moves, setMoves] = useState(Array(9).fill(""));
  const [loopKey, setLoopKey] = useState(0); // To retrigger animation

  useEffect(() => {
    let indices = [...Array(9).keys()].sort(() => Math.random() - 0.5);
    let newMoves = Array(9).fill("");
    for (let i = 0; i < indices.length; i++) {
      newMoves[indices[i]] = i % 2 === 0 ? "X" : "O";
    }
    setMoves(newMoves);

    // Loop every 5 seconds
    const timer = setTimeout(() => {
      setLoopKey((k) => k + 1);
    }, 6000);

    return () => clearTimeout(timer);
  }, [loopKey]);

  return (
    <div className="home-wrapper" key={loopKey}>
      <div className="game-title">Tic Tac Toe</div>

      <div className="home-board">
        {moves.map((val, idx) => (
          <div
            key={idx}
            className={`cell ${val.toLowerCase()}`}
            style={{ animationDelay: `${1.5+ (Math.random()%9) * 2}s` }}
          >
           <span className="shaker">{val}</span>
          </div>
        ))}
        <div className="line vertical v1"></div>
        <div className="line vertical v2"></div>
        <div className="line horizontal h1"></div>
        <div className="line horizontal h2"></div>
      </div>
    </div>
  );
};

export default TicTacToeBackground;
