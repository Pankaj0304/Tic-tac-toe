import React from "react";
import "./emoji.css";

const Emoji = ({ socket, playerName }) => {
  const sendEmoji = (emoji) => {
    // Send emoji message to opponent
    socket.emit("chatMessage", { message: emoji, playerName });

    // Display it in the current player's chat box too
    const chatMessages = document.querySelector('.chat_messages');
    const newMessage = document.createElement('div');
    newMessage.className = 'chat_message user';
    newMessage.innerHTML = `<span class="sender">${playerName}</span><div class="bubble">${emoji}</div>`;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  return (
    <div className="emoji_container">
      <div className="emoji_list">
        {["😍", "❤️", "💕", "😘", "🤦‍♀️", "💀", "😒", "☹️", "😪", "🤦‍♂️"].map((emoji) => (
          <span key={emoji} onClick={() => sendEmoji(emoji)} className="emoji">
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Emoji;
