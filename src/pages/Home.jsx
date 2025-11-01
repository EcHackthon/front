import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  const handleNavigateToChat = () => {
    navigate('/chat');
  };

  return (
    <div className="home-background">
      <div className="home-container">
        <button className="find-music-button" onClick={handleNavigateToChat}>
        Find Your Own Musics
        </button>
      </div>
    </div>
  );
}