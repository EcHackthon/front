import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate("/chat");
  };

  return (
    <div className="home-background">
      <div className="home-content">
        <h1 className="home-title">통나무</h1>
        <button className="start-button" onClick={handleStartClick}>
          start
        </button>
      </div>
    </div>
  );
}