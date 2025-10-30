import React, { useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Playlist from "./pages/Playlist";
import Settings from "./pages/Settings";
import "./App.css";

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
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
        </Routes>
      </main>

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
