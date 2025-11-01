import React, { useState, useEffect } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import './styles/MusicPlayerCard.css';

const MusicPlayerCard = () => {
  const { 
    player, 
    deviceId, 
    isReady, 
    isPaused, 
    currentTrack, 
    accessToken,
    isPremium,
    togglePlay,
    skipToNext,
    skipToPrevious
  } = useSpotify();
  
  const [volume, setVolume] = useState(50);

  // 볼륨 조절
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);

    // Spotify player volume 설정 (0.0 ~ 1.0)
    if (player && isPremium) {
      player.setVolume(newVolume / 100);
    }
  };

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
          disabled={!isPremium}
        >
          ⏮
        </button>
        <button 
          className="control-btn play-btn"
          onClick={togglePlay}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button 
          className="control-btn"
          onClick={skipToNext}
          disabled={!isPremium}
        >
          ⏭
        </button>
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
