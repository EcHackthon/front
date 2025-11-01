import React, { useState, useEffect, useRef } from "react";
import "./styles/Chat.css";
import TrackList from '../components/TrackList';
import MusicPlayerCard from '../components/MusicPlayerCard';

const BACKEND_SERVER_URL = "http://localhost:4000";

const CHAT_STORAGE_KEY = 'chat_messages_history';

// 로컬 스토리지에서 채팅 기록 불러오기
const loadChatHistory = () => {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 배열이고 비어있지 않으면 반환
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('채팅 기록 로드 실패:', err);
  }
  // 기본 환영 메시지
  return [
    { sender: "other", text: "안녕하세요! 오늘 하루는 어떤 하루였나요? 당신의 하루에 대해서 이야기해 주세요. 🎵" }
  ];
};

// 로컬 스토리지에 채팅 기록 저장하기
const saveChatHistory = (messages) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('채팅 기록 저장 실패:', err);
  }
};

export default function Chat() {
  const [messages, setMessages] = useState(loadChatHistory());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 추가: 배경 이미지 상태
  const [backgroundImage, setBackgroundImage] = useState('/9.jpg');

  // ✅ 입력창 참조
  const inputRef = useRef(null);

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

  // ✅ 로딩 완료 후 입력창 포커스 복원
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // ✅ 메시지가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveChatHistory(messages);
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
    if (e) e.preventDefault();
    if (input.trim() === "" || isLoading) return;

    const userMessage = input.trim();
    
    // 사용자 메시지 추가
    setMessages((prev) => [...prev, { sender: "me", text: userMessage }]);
    setInput("");
    
    // ✅ AI 응답 대기 메시지 추가 (임시)
    setMessages((prev) => [...prev, { sender: "other", text: "로딩중...", isLoading: true }]);
    
    // ✅ 입력창 포커스 유지 (상태 변경 전)
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    setIsLoading(true);

    try {
      // 구글 사용자 정보 가져오기 (세션-사용자 매핑용)
      const savedUser = localStorage.getItem('google_user');
      let googleId = null;
      if (savedUser) {
        try {
          const googleUser = JSON.parse(savedUser);
          googleId = googleUser.id;
          console.log('[Chat] 구글 사용자 ID:', googleId);
        } catch (err) {
          console.error('구글 사용자 정보 파싱 실패:', err);
        }
      } else {
        console.warn('[Chat] ⚠️ 구글 로그인이 되어있지 않습니다. 추천곡이 저장되지 않습니다.');
      }
      
      // 백엔드 서버로 메시지 전송 (백엔드 → AI 서버 → 백엔드 → 프론트)
      const response = await fetch(`${BACKEND_SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: 'default',
          google_id: googleId, // 구글 ID 전달 (세션-사용자 매핑 및 추천곡 저장용)
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
          // ✅ 로딩 메시지 제거하고 에러 메시지로 교체
          setMessages((prev) => {
            const filtered = prev.filter(msg => !msg.isLoading);
            return [...filtered, { 
              sender: "other", 
              text: data.message,
              type: data.type || 'error'
            }];
          });
          return;
        }
        throw new Error(data.error || '서버 오류');
      }
      
      // AI에서 필터링된 메시지('''로 시작)는 화면에 표시하지 않음
      if (data.type === 'filtered' || data.filtered === true) {
        console.log('[Chat] AI에서 필터링된 메시지 (표시하지 않음)');
        // ✅ 로딩 메시지만 제거
        setMessages((prev) => prev.filter(msg => !msg.isLoading));
        return;
      }
      
      // 빈 메시지는 표시하지 않음
      if (!data.message || data.message.trim() === '') {
        console.log('[Chat] 빈 메시지 수신 (표시하지 않음)');
        // ✅ 로딩 메시지만 제거
        setMessages((prev) => prev.filter(msg => !msg.isLoading));
        return;
      }
      
      // ✅ 로딩 메시지를 실제 AI 응답으로 교체
      setMessages((prev) => {
        const filtered = prev.filter(msg => !msg.isLoading);
        return [...filtered, { 
          sender: "other", 
          text: data.message,
          type: data.type,
          recommendations: data.recommendations 
        }];
      });

      // 추천 결과가 있으면 콘솔에 출력 (나중에 TrackList와 연동 가능)
      if (data.recommendations) {
        console.log("받은 추천 목록:", data.recommendations);
      }

    } catch (error) {
      console.error("메시지 전송 실패:", error);
      // ✅ 로딩 메시지를 에러 메시지로 교체
      setMessages((prev) => {
        const filtered = prev.filter(msg => !msg.isLoading);
        return [...filtered, { 
          sender: "other", 
          text: `죄송합니다. 서버와 통신 중 오류가 발생했습니다.\n\n${error.message}` 
        }];
      });
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
        <header className="chat-right-header">
          <button 
            className="new-chat-button"
            onClick={() => {
              // 나중에 대화 초기화 기능 추가
              console.log('새 채팅 버튼 클릭');
            }}
          >
            새 채팅
          </button>
          <span className="header-date">{getCurrentDate()}</span>
        </header>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`msg ${msg.sender === "me" ? "me" : "other"} ${msg.isLoading ? "loading" : ""}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        <form 
          className="chat-input" 
          onSubmit={sendMessage}
          onBlur={(e) => {
            // ✅ form 내부 요소에서만 blur 방지
            if (e.currentTarget.contains(e.relatedTarget)) {
              return;
            }
            // form 외부 클릭 시에만 blur 허용
          }}
        >
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              placeholder="메시지를 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              onBlur={(e) => {
                // ✅ 입력창에서 포커스가 벗어나면 즉시 다시 포커스
                setTimeout(() => {
                  if (inputRef.current && !e.relatedTarget) {
                    inputRef.current.focus();
                  }
                }, 0);
              }}
            />
            <button
              type="button"
              className="send-button"
              onClick={() => {
                if (input.trim() && !isLoading) {
                  const fakeEvent = { preventDefault: () => {} };
                  sendMessage(fakeEvent);
                }
              }}
              title="메시지 전송"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                width="24" 
                height="24"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
