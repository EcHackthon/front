import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Playlist from "./pages/Playlist";
import "./App.css";

export default function App() {
  return (
    <>
      <header className="navbar">
        <nav className="nav-inner">
          <div className="brand">TongNamu</div>
          <ul className="nav-links">
            <li><NavLink to="/">홈</NavLink></li>
            <li><NavLink to="/chat">탐색</NavLink></li>
            <li><NavLink to="/playlist">플레이리스트</NavLink></li>
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
    </>
  );
}
