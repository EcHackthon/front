import React, { useState, useEffect } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import './styles/MusicPlayerCard.css';

const MusicPlayerCard = () => {
  const { 
    isReady, 
    isPaused, 
    currentTrack, 
    isPremium,
    error,
    position,
    duration,
    trackList,
    currentTrackIndex,
    togglePlay,
    skipToNext,
    skipToPrevious,
    setVolumeLevel
  } = useSpotify();
  
  const [volume, setVolume] = useState(50);

  // 볼륨 조절
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);

    // Spotify player volume 설정 (0.0 ~ 1.0)
    if (setVolumeLevel) {
      setVolumeLevel(newVolume / 100);
    }
  };

  // 시간을 MM:SS 형식으로 변환
  const formatTime = (ms) => {
    if (!ms || ms === 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 프로그레스 바 퍼센트 계산
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  // 기본 플레이스홀더 이미지
  const placeholderImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%23333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="20">No Track</text></svg>';

  return (
    <div className="music-player-card">
      {/* 앨범 커버 */}
      <div className="album-cover">
        <img 
          src={currentTrack?.albumArt || placeholderImage} 
          alt={currentTrack?.name || 'No track playing'}
        />
      </div>

      {/* 재생 컨트롤 */}
      <div className="player-controls">
        <button 
          className="control-btn"
          onClick={skipToPrevious}
          disabled={!isPremium || !isReady || currentTrackIndex <= 0}
          title={currentTrackIndex <= 0 ? "첫 번째 곡입니다" : "이전 곡"}
        >
          ⏮
        </button>
        <button 
          className="control-btn play-btn"
          onClick={togglePlay}
          disabled={!currentTrack}
          title={isPaused ? '재생' : '일시정지'}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button 
          className="control-btn"
          onClick={skipToNext}
          disabled={!isPremium || !isReady || currentTrackIndex >= trackList.length - 1}
          title={currentTrackIndex >= trackList.length - 1 ? "마지막 곡입니다" : "다음 곡"}
        >
          ⏭
        </button>
      </div>

      {/* 프로그레스 바 */}
      <div className="progress-section">
        <div className="time-display">
          <span className="current-time">{formatTime(position)}</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* 볼륨 슬라이더 */}
      <div className="volume-control">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
};

export default MusicPlayerCard;
