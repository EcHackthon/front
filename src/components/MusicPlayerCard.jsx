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
    setVolumeLevel,
    seekToPosition
  } = useSpotify();
  
  const [volume, setVolume] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  // 볼륨 조절
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);

    // Spotify player volume 설정 (0.0 ~ 1.0)
    if (setVolumeLevel) {
      setVolumeLevel(newVolume / 100);
    }
  };

  // 프로그레스 바 클릭 시 재생 위치 변경
  const handleProgressClick = (e) => {
    if (!isPremium || !isReady || !duration || !seekToPosition) {
      return;
    }

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newPosition = Math.floor(duration * percentage);

    seekToPosition(newPosition);
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e) => {
      // 입력 필드에서는 무시
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          if (currentTrack) {
            togglePlay();
          }
          break;
        
        case 'ArrowLeft':
          e.preventDefault();
          if (isPremium && isReady && seekToPosition) {
            const newPosition = Math.max(0, position - 5000); // 5초 뒤로
            seekToPosition(newPosition);
          }
          break;
        
        case 'ArrowRight':
          e.preventDefault();
          if (isPremium && isReady && seekToPosition) {
            const newPosition = Math.min(duration, position + 5000); // 5초 앞으로
            seekToPosition(newPosition);
          }
          break;
        
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHovered, currentTrack, togglePlay, isPremium, isReady, position, duration, seekToPosition]);

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
    <div 
      className={`music-player-card ${!currentTrack ? 'no-track' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
    >
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
        <div 
          className="progress-bar" 
          onClick={handleProgressClick}
          style={{ cursor: isPremium && isReady && duration ? 'pointer' : 'default' }}
          title={isPremium && isReady ? '클릭하여 재생 위치 변경' : ''}
        >
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* 볼륨 슬라이더 */}
      <div className="volume-control">
        <span className="volume-icon" title={`볼륨: ${volume}%`}>
          {volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
        </span>
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
