import React, { useState, useEffect, useRef } from "react";
import "./styles/Chat.css";

export default function Chat() {
  const [messages, setMessages] = useState([
    { sender: "other", text: "안녕하세요!" },
    { sender: "me", text: "반가워요 😄" },
  ]);
  const [input, setInput] = useState("");

  // ✅ 스크롤을 제어할 ref
  const messagesEndRef = useRef(null);

  // ✅ 메시지 추가 후 맨 아래로 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // messages가 변경될 때마다 실행

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;

    setMessages((prev) => [...prev, { sender: "me", text: input }]);
    setInput("");
  };

  return (
    <div className="chat-page">
      <section className="chat-left">
        <h2>채팅방</h2>
        <p>오른쪽에 채팅을 입력해보세요!</p>
      </section>

      <aside className="chat-right">
        <header className="chat-right-header">채팅</header>

        {/* ✅ 메시지 표시 영역 */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`msg ${msg.sender === "me" ? "me" : "other"}`}
            >
              {msg.text}
            </div>
          ))}

          {/* ✅ 스크롤 기준점 (맨 아래) */}
          <div ref={messagesEndRef}></div>
        </div>

        {/* 입력창 */}
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
