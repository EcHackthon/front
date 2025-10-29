import React, { useState, useEffect, useRef } from "react";
import "./styles/Chat.css";

export default function Chat() {
  const [messages, setMessages] = useState([
    { sender: "other", text: "안녕하세요!" },
    { sender: "me", text: "반가워요 😄" },
  ]);
  const [input, setInput] = useState("");

  // ✅ 추가: 배경 이미지 상태
  const [backgroundImage, setBackgroundImage] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;

    setMessages((prev) => [...prev, { sender: "me", text: input }]);

    // ✅ 추가: 숫자 1~10이면 배경 변경
    const num = parseInt(input.trim(), 10);
    if (num >= 1 && num <= 10) {
      setBackgroundImage(`/${num}.jpg`);
    }

    setInput("");
  };

  return (
    <div className="chat-page">
      {/* ✅ 추가: 배경 전용 블러 레이어 */}
      <div
        className="chat-background"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : "linear-gradient(to right, #74ebd5, #acb6e5)",
        }}
      ></div>

      <section className="chat-left">
        <h2>채팅방</h2>
        <p>오른쪽에 채팅을 입력해보세요!</p>
      </section>

      <aside className="chat-right">
        <header className="chat-right-header">채팅</header>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`msg ${msg.sender === "me" ? "me" : "other"}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        <form className="chat-input" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">➡️</button>
        </form>
      </aside>
    </div>
  );
}
