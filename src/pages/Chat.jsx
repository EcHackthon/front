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

  // ✅ 추가: 채팅창 너비 상태
  const [chatWidth, setChatWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);

  // ✅ 실시간 날짜 가져오기
  const getCurrentDate = () => {
    const today = new Date();
    const month = today.getMonth() + 1; // 0부터 시작하므로 +1
    const day = today.getDate();
    return `${month}월 ${day}일`;
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ 리사이즈 핸들러
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

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
      </section>

      <aside className="chat-right" style={{ width: `${chatWidth}px` }}>
        <div className="resize-handle" onMouseDown={handleMouseDown}></div>
        <header className="chat-right-header">{getCurrentDate()}</header>
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage(e);
              }
            }}
          />
        </form>
      </aside>
    </div>
  );
}
