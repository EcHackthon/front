import React, { useState, useEffect, useRef } from "react";
import "./styles/Chat.css";
import TrackList from '../components/TrackList';
import MusicPlayerCard from '../components/MusicPlayerCard';

const BACKEND_SERVER_URL = "http://localhost:4000";

export default function Chat() {
  const [messages, setMessages] = useState([
    { sender: "other", text: "안녕하세요! 오늘 기분은 어떠세요? 듣고 싶은 음악에 대해 말씀해주세요 🎵" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 추가: 배경 이미지 상태
  const [backgroundImage, setBackgroundImage] = useState('/22.jpg');

  // ✅ 추가: 채팅창 너비 상태
  const [chatWidth, setChatWidth] = useState(500);
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "" || isLoading) return;

    const userMessage = input.trim();
    
    // 사용자 메시지 추가
    setMessages((prev) => [...prev, { sender: "me", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // 백엔드 서버로 메시지 전송 (백엔드 → AI 서버 → 백엔드 → 프론트)
      const response = await fetch(`${BACKEND_SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: 'default',
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      
      // 백엔드로부터 받은 응답 처리
      if (!data.ok) {
        // 에러 응답이지만 메시지가 있으면 표시
        if (data.message) {
          setMessages((prev) => [...prev, { 
            sender: "other", 
            text: data.message,
            type: data.type || 'error'
          }]);
          return;
        }
        throw new Error(data.error || '서버 오류');
      }
      
      // AI에서 필터링된 메시지('''로 시작)는 화면에 표시하지 않음
      if (data.type === 'filtered' || data.filtered === true) {
        console.log('[Chat] AI에서 필터링된 메시지 (표시하지 않음)');
        return;
      }
      
      // 빈 메시지는 표시하지 않음
      if (!data.message || data.message.trim() === '') {
        console.log('[Chat] 빈 메시지 수신 (표시하지 않음)');
        return;
      }
      
      // AI 응답 메시지 추가
      setMessages((prev) => [...prev, { 
        sender: "other", 
        text: data.message,
        type: data.type,
        recommendations: data.recommendations 
      }]);

      // 추천 결과가 있으면 콘솔에 출력 (나중에 TrackList와 연동 가능)
      if (data.recommendations) {
        console.log("받은 추천 목록:", data.recommendations);
      }

    } catch (error) {
      console.error("메시지 전송 실패:", error);
      setMessages((prev) => [...prev, { 
        sender: "other", 
        text: `죄송합니다. 서버와 통신 중 오류가 발생했습니다.\n\n${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page">
      {/* ✅ 추가: 배경 전용 블러 레이어 */}
      <div
        className="chat-background"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      ></div>

      <section className="chat-left">
        <TrackList emptyVariant="none" variant="chat" />
        <MusicPlayerCard />
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
            placeholder={isLoading ? "AI가 응답 중..." : "메시지를 입력하세요"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                sendMessage(e);
              }
            }}
          />
        </form>
      </aside>
    </div>
  );
}
