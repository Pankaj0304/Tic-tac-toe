import React, { useState } from "react";
import "./square.css";

const circleSvg = (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        ></path>
    </svg>
);

const crossSvg = (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M19 5L5 19M5.00001 5L19 19"
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        ></path>
    </svg>
);

const Square = ({
    playingAs,
    socket,
    final,
    gameOver,
    gameSquare,
    winner,
    currentPlayer,
    setCurrentPlayer,
    setGameSquares,
    row,
    col,
    currentelement,
}) => {
    const [icon, seticon] = useState(null);

    const ClickSquare = () => {
        if (gameSquare[row][col]!=="circle" && gameSquare[row][col]!=="cross" && !gameOver && playingAs === currentPlayer) {
            if (currentPlayer === "circle") {
                seticon(circleSvg);
            } else {
                seticon(crossSvg);
            }
            console.log("Clicked square at row:", row, "col:", col);
            socket.emit("playerMoveFromClient", {state: {row: row,col: col,sign: currentPlayer}});
            setCurrentPlayer(currentPlayer === "circle" ? "cross" : "circle");
            console.log("Current player after click:", currentPlayer);
            setGameSquares((prev) => {
                let newGameSquare = prev.map((r) => [...r]); 
                newGameSquare[row][col] = currentPlayer;
                return newGameSquare;
            });
        }
    };

    const isWinningSquare =
        Array.isArray(final) && final.includes(row * 3 + col);

    return (
    <div
        className={`square_container 
              ${gameOver ? "not-allowed" : ""} 
              ${isWinningSquare ? winner + "win" : ""}`}
        onClick={ClickSquare}
    >
        {currentelement === 'circle' ? circleSvg :
         currentelement === 'cross' ? crossSvg : null}
    </div>
);
};

export default Square;
