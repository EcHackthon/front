import React, { createContext, useContext, useState, useEffect } from 'react';

const SpotifyContext = createContext();

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within SpotifyProvider');
  }
  return context;
};

export const SpotifyProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('spotify_access_token'));
  const [isPremium, setIsPremium] = useState(false);
  const [audioElement, setAudioElement] = useState(null);

  // URL에서 토큰 파라미터 확인 (OAuth 콜백)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('spotify_token');
    const error = params.get('spotify_error');

    if (token) {
      localStorage.setItem('spotify_access_token', token);
      setAccessToken(token);
      // URL 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('Spotify token saved from callback');
    }

    if (error) {
      console.error('Spotify OAuth error:', error);
      alert('Spotify 로그인 중 오류가 발생했습니다: ' + error);
      // URL 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 사용자 프로필 확인 (Premium 여부)
  const checkUserProfile = async (token) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const premium = data.product === 'premium';
        setIsPremium(premium);
        console.log('Spotify account type:', premium ? 'Premium' : 'Free');
        return premium;
      }
    } catch (error) {
      console.error('Failed to check user profile:', error);
    }
    return false;
  };

  // Spotify Web Playback SDK 초기화 (Premium 전용)
  useEffect(() => {
    if (!accessToken || !isPremium) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Music Chat Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;
        
        setIsPaused(state.paused);
        
        const track = state.track_window.current_track;
        if (track) {
          setCurrentTrack({
            name: track.name,
            artists: track.artists.map(a => a.name).join(', '),
            albumArt: track.album.images[0]?.url,
            uri: track.uri
          });
        }
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken, isPremium]);

  // 토큰이 변경될 때 사용자 프로필 확인
  useEffect(() => {
    if (accessToken) {
      checkUserProfile(accessToken);
    }
  }, [accessToken]);

  // Spotify 로그인
  const login = () => {
    window.location.href = 'http://localhost:4000/api/spotify/login';
  };

  // 트랙 재생 (Premium: SDK, Free: Preview URL)
  const playTrack = async (trackUri, trackData) => {
    console.log('🎵 playTrack called:', { 
      trackUri, 
      trackData, 
      isPremium, 
      hasToken: !!accessToken,
      deviceId 
    });

    // 로그인 안 했으면 Premium 필요 알림
    if (!accessToken) {
      console.warn('⚠️ Spotify 로그인이 필요합니다.');
      alert('음악 재생을 위해서는 Spotify Premium 계정으로 로그인이 필요합니다.');
      return;
    }

    // Premium 계정만 재생 가능
    if (!isPremium) {
      console.warn('⚠️ 음악 재생은 Spotify Premium 계정이 필요합니다.');
      alert('음악 재생은 Spotify Premium 계정이 필요합니다.\nFree 계정은 Spotify 앱에서 직접 재생해주세요.');
      return;
    }

    console.log('▶️ Using Premium playback');
    
    // Device ID가 아직 준비 안 됐으면 대기
    if (!deviceId) {
      console.warn('⏳ Device ID not ready yet, waiting...');
      // 잠시 후 다시 시도
      setTimeout(() => playTrack(trackUri, trackData), 1000);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/spotify/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          device_id: deviceId,
          track_uri: trackUri
        })
      });

      if (response.ok) {
        console.log('Playing track (Premium):', trackUri);
        // currentTrack은 player_state_changed 이벤트에서 자동 업데이트
      } else {
        throw new Error('Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      alert('재생 중 오류가 발생했습니다.');
    }
  };

  // 재생/일시정지 토글 (Premium 전용)
  const togglePlay = () => {
    if (isPremium && player) {
      player.togglePlay();
    } else {
      console.warn('⚠️ 음악 재생은 Spotify Premium 계정이 필요합니다.');
    }
  };

  // 다음 곡 (Premium 전용)
  const skipToNext = () => {
    if (isPremium && player) {
      player.nextTrack();
    }
  };

  // 이전 곡 (Premium 전용)
  const skipToPrevious = () => {
    if (isPremium && player) {
      player.previousTrack();
    }
  };

  // 로그아웃 (연결 해제)
  const logout = () => {
    // localStorage에서 토큰 삭제
    localStorage.removeItem('spotify_access_token');
    
    // 플레이어 정리
    if (player) {
      player.disconnect();
    }
    
    // 오디오 정지
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    // 상태 초기화
    setAccessToken(null);
    setIsPremium(false);
    setPlayer(null);
    setDeviceId(null);
    setIsReady(false);
    setIsPaused(true);
    setCurrentTrack(null);
    setAudioElement(null);
    
    console.log('🚪 Spotify logged out');
  };

  const value = {
    player,
    deviceId,
    isReady,
    isPaused,
    currentTrack,
    accessToken,
    isPremium,
    login,
    logout,
    playTrack,
    togglePlay,
    skipToNext,
    skipToPrevious,
    setAccessToken
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};
