import React from "react";
import { useSpotify } from "../contexts/SpotifyContext";
import "./styles/Settings.css";

export default function Settings({ isOpen, onClose, googleUser, setGoogleUser }) {
  const { accessToken, isPremium, login, logout } = useSpotify();

  // 디버깅: Settings가 열릴 때 googleUser 상태 확인
  React.useEffect(() => {
    if (isOpen) {
      console.log('⚙️ Settings opened - Google user:', googleUser ? googleUser.name : 'Not logged in');
    }
  }, [isOpen, googleUser]);

  if (!isOpen) return null;

  // 구글 로그인
  const handleGoogleLogin = () => {
    console.log('🔐 Initiating Google login...');
    window.location.href = 'https://back-ieck.onrender.com/auth/google';
  };

  // 구글 로그아웃
  const handleGoogleLogout = () => {
    console.log('🚪 Logging out from Google...');
    localStorage.removeItem('google_user');
    setGoogleUser(null);
    console.log('✅ Google logged out');
  };

  // Spotify 로그아웃
  const handleSpotifyLogout = () => {
    logout();
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose}></div>
      <aside className="settings-sidebar">
        <button className="settings-close" onClick={onClose}>✕</button>
        <div className="settings-content">
          {/* Google 로그인 섹션 */}
          <div className="google-section">
            <h3>계정</h3>
            {!googleUser ? (
              <button className="google-btn" onClick={handleGoogleLogin}>
                <span className="google-icon">G</span>
                Google로 로그인
              </button>
            ) : (
              <div className="google-status">
                <div className="user-info">
                  {googleUser.picture && (
                    <img src={googleUser.picture} alt={googleUser.name} className="user-avatar" />
                  )}
                  <div className="user-details">
                    <div className="user-name">{googleUser.name}</div>
                    <div className="user-email">{googleUser.email}</div>
                  </div>
                </div>
                <button className="google-logout-btn" onClick={handleGoogleLogout}>
                  로그아웃
                </button>
              </div>
            )}
          </div>

          {/* Spotify 섹션 */}
          <div className="settings-divider"></div>
          <div className="spotify-section">
            <h3>Spotify</h3>
            {!accessToken ? (
              <button className="spotify-btn" onClick={login}>
                Spotify 연결
              </button>
            ) : (
              <div className="spotify-status">
                <div className="status-connected">
                  <span className="status-icon">✓</span>
                  <span>Spotify 연결됨</span>
                </div>
                <span className={`account-badge ${isPremium ? 'premium' : 'free'}`}>
                  {isPremium ? 'Premium' : 'Free'}
                </span>
                <button className="spotify-disconnect-btn" onClick={handleSpotifyLogout}>
                  연결 해제
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
