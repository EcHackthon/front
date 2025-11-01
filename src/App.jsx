import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Playlist from "./pages/Playlist";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { SpotifyProvider } from "./contexts/SpotifyContext";
import "./App.css";

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(() => {
    // 초기 로드 시 localStorage에서 사용자 정보 읽기
    const savedUser = localStorage.getItem('google_user');
    console.log('🔄 Initial load - saved user:', savedUser ? 'Found' : 'Not found');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        console.log('👤 Restored user:', user.name);
        return user;
      } catch (err) {
        console.error('❌ Failed to parse saved user:', err);
        localStorage.removeItem('google_user');
        return null;
      }
    }
    return null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  // URL에서 구글 사용자 정보 확인
  useEffect(() => {
    console.log('🔍 Checking URL params:', location.search);
    
    const params = new URLSearchParams(location.search);
    const encodedUser = params.get('google_user');
    const error = params.get('error');

    if (encodedUser) {
      try {
        console.log('📦 Encoded user data found:', encodedUser.substring(0, 50) + '...');
        
        // Base64 디코딩 (UTF-8 지원)
        const decodedString = decodeURIComponent(encodedUser);
        const binaryString = atob(decodedString);
        
        // UTF-8 디코딩을 위한 처리
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const userJson = new TextDecoder('utf-8').decode(bytes);
        const user = JSON.parse(userJson);
        
        console.log('✅ Google login success:', user);
        
        // localStorage에 저장
        localStorage.setItem('google_user', JSON.stringify(user));
        setGoogleUser(user);
        
        // 백엔드로 사용자 정보 전송 (Supabase 저장)
        fetch('http://localhost:4000/auth/google/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        })
          .then(response => response.json())
          .then(data => {
            console.log('✅ 사용자 정보가 Supabase에 저장되었습니다:', data);
          })
          .catch(err => {
            console.error('❌ Supabase 저장 실패:', err);
          });
        
        // URL 파라미터 제거
        window.history.replaceState({}, document.title, location.pathname);
      } catch (err) {
        console.error('❌ Failed to parse Google user data:', err);
        console.error('Raw encoded data:', encodedUser);
      }
    } else if (error) {
      console.error('❌ Google auth error:', error);
      alert('Google 로그인에 실패했습니다.');
      window.history.replaceState({}, document.title, location.pathname);
    } else {
      console.log('ℹ️ No Google auth params in URL');
    }
  }, [location.search]);

  return (
    <SpotifyProvider>
      <header className="navbar">
        <nav className="nav-inner">
          <div className="brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>TongNamu</div>
          <ul className="nav-links">
            <li><NavLink to="/">홈</NavLink></li>
            <li><NavLink to="/chat">탐색</NavLink></li>
            <li><NavLink to="/playlist">플레이리스트</NavLink></li>
            <li>
              <button className="settings-button" onClick={() => setIsSettingsOpen(true)}>
                <span className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        googleUser={googleUser}
        setGoogleUser={setGoogleUser}
      />
    </SpotifyProvider>
  );
}
