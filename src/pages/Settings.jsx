import React from "react";
import "./styles/Settings.css";

export default function Settings({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="settings-overlay" onClick={onClose}></div>
      <aside className="settings-sidebar">
        <header className="settings-header">
          <h2>설정</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </header>
        <div className="settings-content">
          <p>설정 내용이 여기에 표시됩니다.</p>
        </div>
      </aside>
    </>
  );
}
