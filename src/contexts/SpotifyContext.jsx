import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SpotifyContext = createContext();

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within SpotifyProvider');
  }
  return context;
};

export const SpotifyProvider = ({ children }) => {
  // Player state
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Track state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [trackList, setTrackList] = useState([]); // 추천받은 트랙 리스트
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1); // 현재 재생 중인 트랙의 인덱스
  
  // Auth state
  const [accessToken, setAccessToken] = useState(localStorage.getItem('spotify_access_token'));
  const [isPremium, setIsPremium] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // URL에서 OAuth 콜백 확인 (세션 기반) - 한 번만 실행
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('spotify_success');
    const error = params.get('spotify_error');

    if (success) {
      console.log('🎫 Spotify OAuth successful - token stored in session');
      // 세션에서 토큰을 가져오는 API 호출
      fetchTokenFromSession();
      
      // 원래 페이지로 리다이렉트
      const returnPath = localStorage.getItem('spotify_login_return_path');
      localStorage.removeItem('spotify_login_return_path');
      
      if (returnPath && returnPath !== '/chat') {
        console.log('↩️ Redirecting back to:', returnPath);
        window.location.href = returnPath;
      } else {
        // URL 파라미터만 제거 (현재 페이지 유지)
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('✅ Spotify authenticated via session');
      }
      return;
    }

    if (error) {
      console.error('Spotify OAuth error:', error);
      alert('Spotify 로그인 중 오류가 발생했습니다: ' + error);
      // URL 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // OAuth 콜백이 아닌 경우 세션에서 토큰 복원 시도
    fetchTokenFromSession();
  }, []); // 빈 배열 유지 - 컴포넌트 마운트 시 한 번만 실행

  // 세션에서 토큰 가져오기
  const fetchTokenFromSession = async () => {
    try {
      const response = await fetch('https://back-ieck.onrender.com/api/spotify/token', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Token restored from session');
        setAccessToken(data.access_token);
      } else {
        console.log('ℹ️ No valid session token available');
        setAccessToken(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch token from session:', error);
      setAccessToken(null);
    }
  };

  // 사용자 프로필 확인 (Premium 여부)
  const checkUserProfile = useCallback(async (token) => {
    if (!token) {
      console.warn('⚠️ No token provided to checkUserProfile');
      return false;
    }

    try {
      console.log('🔍 Checking Spotify user profile...');
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Spotify user data:', {
          display_name: data.display_name,
          email: data.email,
          product: data.product,
          country: data.country
        });
        
        const premium = data.product === 'premium';
        setIsPremium(premium);
        console.log(`✅ Account type: ${premium ? '⭐ Premium' : '🎵 Free'}`);
        
        if (!premium) {
          console.warn('⚠️ Free account detected - Web Playback SDK will not be initialized');
        }
        
        return premium;
      } else if (response.status === 403) {
        console.error('❌ 403 Forbidden: User not registered in Spotify Developer Dashboard');
        console.warn('⚠️ Add user at https://developer.spotify.com/dashboard');
        setError('User not registered in developer dashboard');
        setIsPremium(false);
        return false;
      } else {
        console.error(`❌ Failed to fetch profile: ${response.status}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        setIsPremium(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Profile check failed:', error);
      setIsPremium(false);
      return false;
    }
  }, []);

  // Web Playback SDK 초기화 (Premium 전용)
  useEffect(() => {
    // Premium이 아니면 SDK 초기화하지 않음
    if (!accessToken || !isPremium) {
      console.log('⏸️ Web Playback SDK not initialized:', {
        hasToken: !!accessToken,
        isPremium
      });
      return;
    }

    console.log('🎮 Initializing Web Playback SDK...');

    // SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    // 이미 로드된 스크립트가 있는지 확인
    const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
    if (!existingScript) {
      document.body.appendChild(script);
    }

    // SDK 준비 콜백
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('🎵 SDK Ready, creating player...');
      
      const spotifyPlayer = new window.Spotify.Player({
        name: 'TongNamu Music Player',
        getOAuthToken: cb => { 
          console.log('🔑 SDK requesting token...');
          cb(accessToken); 
        },
        volume: 0.5
      });

      // Ready 이벤트
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('✅ Player ready! Device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        setError(null);
      });

      // Not Ready 이벤트
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.warn('⚠️ Player not ready. Device ID:', device_id);
        setIsReady(false);
      });

      // 재생 상태 변경 이벤트
      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) {
          console.log('ℹ️ No state (player may be inactive)');
          return;
        }

        console.log('🔄 Player state changed:', {
          paused: state.paused,
          position: state.position,
          duration: state.duration,
          track: state.track_window.current_track.name
        });

        setIsPaused(state.paused);
        setPosition(state.position);
        setDuration(state.duration);

        const track = state.track_window.current_track;
        if (track) {
          setCurrentTrack({
            name: track.name,
            artists: track.artists.map(a => a.name).join(', '),
            albumArt: track.album.images[0]?.url,
            uri: track.uri,
            id: track.id
          });
        }
      });

      // Autoplay 실패 이벤트
      spotifyPlayer.addListener('autoplay_failed', () => {
        console.warn('⚠️ Autoplay failed - browser autoplay rules');
        setError('Autoplay blocked by browser');
      });

      // 에러 이벤트들
      spotifyPlayer.on('initialization_error', ({ message }) => {
        console.error('❌ Initialization error:', message);
        setError(`Initialization error: ${message}`);
      });

      spotifyPlayer.on('authentication_error', ({ message }) => {
        console.error('❌ Authentication error:', message);
        setError(`Authentication error: ${message}`);
        // 토큰이 만료되었을 수 있음 - 세션에서 재시도
        fetchTokenFromSession();
      });

      spotifyPlayer.on('account_error', ({ message }) => {
        console.error('❌ Account error:', message);
        setError('Premium subscription required');
        setIsPremium(false);
      });

      spotifyPlayer.on('playback_error', ({ message }) => {
        console.error('❌ Playback error:', message);
        setError(`Playback error: ${message}`);
      });

      // 플레이어 연결
      spotifyPlayer.connect().then(success => {
        if (success) {
          console.log('✅ Player connected successfully');
          setPlayer(spotifyPlayer);
        } else {
          console.error('❌ Failed to connect player');
          setError('Failed to connect player');
        }
      });
    };

    // Cleanup
    return () => {
      if (player) {
        console.log('🧹 Disconnecting player...');
        player.disconnect();
      }
    };
  }, [accessToken, isPremium]);

  // 재생 중 position 업데이트 (1초마다)
  useEffect(() => {
    if (!player || isPaused || !isReady) return;

    const interval = setInterval(() => {
      player.getCurrentState().then(state => {
        if (state) {
          setPosition(state.position);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isPaused, isReady]);

  // 토큰이 변경될 때 사용자 프로필 확인
  useEffect(() => {
    if (accessToken) {
      console.log('🔑 Access token changed, checking user profile...');
      console.log('Token length:', accessToken.length);
      checkUserProfile(accessToken);
    } else {
      console.log('❌ No access token available');
    }
  }, [accessToken, checkUserProfile]);

  // Spotify 로그인
  const login = () => {
    // 현재 페이지 경로를 localStorage에 저장 (콜백 후 돌아올 위치)
    localStorage.setItem('spotify_login_return_path', window.location.pathname);
    console.log('🔐 Spotify login initiated from:', window.location.pathname);
    window.location.href = 'https://back-ieck.onrender.com/api/spotify/login';
  };

  // 트랙 재생 (Premium 전용)
  const playTrack = useCallback(async (trackUri, trackData, trackListParam = null, indexParam = null) => {
    console.log('🎵 playTrack called:', { 
      trackUri, 
      trackData, 
      isPremium, 
      hasToken: !!accessToken,
      deviceId,
      isReady,
      trackListProvided: !!trackListParam,
      indexProvided: indexParam !== null
    });

    // 트랙 리스트와 인덱스 업데이트
    if (trackListParam && indexParam !== null) {
      setTrackList(trackListParam);
      setCurrentTrackIndex(indexParam);
      console.log(`📋 Track list updated: ${trackListParam.length} tracks, index ${indexParam}`);
    }

    // 로그인 체크
    if (!accessToken) {
      console.warn('⚠️ No access token');
      alert('음악 재생을 위해 Spotify Premium 계정으로 로그인해주세요.');
      return;
    }

    // Premium 체크
    if (!isPremium) {
      console.warn('⚠️ Not a Premium account');
      alert('음악 재생은 Spotify Premium 계정이 필요합니다.\n\nFree 계정은 Spotify 앱에서 직접 재생해주세요.');
      return;
    }

    // Device 준비 체크
    if (!deviceId || !isReady) {
      console.warn('⏳ Device not ready yet, retrying in 1s...');
      setTimeout(() => playTrack(trackUri, trackData, trackListParam, indexParam), 1000);
      return;
    }

    try {
      console.log('▶️ Playing on device:', deviceId);
      
      const response = await fetch('https://back-ieck.onrender.com/api/spotify/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          device_id: deviceId,
          track_uri: trackUri
        })
      });

      if (response.ok) {
        console.log('✅ Playback started:', trackUri);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to play track');
      }
    } catch (error) {
      console.error('❌ Playback error:', error);
      setError(error.message);
      alert(`재생 중 오류가 발생했습니다:\n${error.message}`);
    }
  }, [accessToken, isPremium, deviceId, isReady]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    if (!player || !isReady) {
      console.warn('⚠️ Player not ready');
      return;
    }
    
    console.log(`${isPaused ? '▶️' : '⏸️'} Toggling playback...`);
    player.togglePlay().then(() => {
      console.log('✅ Playback toggled');
    }).catch(err => {
      console.error('❌ Toggle failed:', err);
    });
  }, [player, isReady, isPaused]);

  // 다음 곡
  const skipToNext = useCallback(() => {
    if (!isPremium || !isReady) {
      console.warn('⚠️ Player not ready or not Premium');
      return;
    }

    if (trackList.length === 0) {
      console.warn('⚠️ No track list available');
      alert('재생할 트랙 목록이 없습니다.');
      return;
    }

    const nextIndex = currentTrackIndex + 1;
    if (nextIndex >= trackList.length) {
      console.warn('⚠️ Already at last track');
      alert('마지막 곡입니다.');
      return;
    }

    const nextTrack = trackList[nextIndex];
    console.log('⏭️ Skipping to next track:', nextTrack.name);
    
    playTrack(nextTrack.uri, nextTrack, trackList, nextIndex);
  }, [isPremium, isReady, trackList, currentTrackIndex, playTrack]);

  // 이전 곡
  const skipToPrevious = useCallback(() => {
    if (!isPremium || !isReady) {
      console.warn('⚠️ Player not ready or not Premium');
      return;
    }

    if (trackList.length === 0) {
      console.warn('⚠️ No track list available');
      alert('재생할 트랙 목록이 없습니다.');
      return;
    }

    const prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
      console.warn('⚠️ Already at first track');
      alert('첫 번째 곡입니다.');
      return;
    }

    const prevTrack = trackList[prevIndex];
    console.log('⏮️ Skipping to previous track:', prevTrack.name);
    
    playTrack(prevTrack.uri, prevTrack, trackList, prevIndex);
  }, [isPremium, isReady, trackList, currentTrackIndex, playTrack]);

  // 볼륨 설정
  const setVolumeLevel = useCallback((volume) => {
    if (!player || !isReady) return;
    
    const vol = Math.max(0, Math.min(1, volume));
    player.setVolume(vol);
  }, [player, isReady]);

  // 재생 위치 변경 (seek)
  const seekToPosition = useCallback((positionMs) => {
    if (!player || !isReady || !isPremium) {
      console.warn('⚠️ Cannot seek: player not ready or not premium');
      return;
    }
    
    const seekPos = Math.max(0, Math.min(duration, positionMs));
    console.log(`⏩ Seeking to position: ${seekPos}ms`);
    
    player.seek(seekPos).then(() => {
      console.log('✅ Seek successful');
      setPosition(seekPos);
    }).catch(err => {
      console.error('❌ Seek failed:', err);
    });
  }, [player, isReady, isPremium, duration]);

  // 현재 재생 상태 가져오기
  const getCurrentState = useCallback(() => {
    if (!player) {
      return Promise.resolve(null);
    }
    return player.getCurrentState();
  }, [player]);

  // 로그아웃
  const logout = useCallback(() => {
    console.log('🚪 Logging out from Spotify...');
    
    // 플레이어 정리
    if (player) {
      player.disconnect();
    }
    
    // 백엔드 세션 정리 (선택적)
    fetch('https://back-ieck.onrender.com/api/spotify/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.warn('Logout request failed:', err));
    
    // 상태 초기화
    setAccessToken(null);
    setIsPremium(false);
    setPlayer(null);
    setDeviceId(null);
    setIsReady(false);
    setIsPaused(true);
    setCurrentTrack(null);
    setTrackList([]);
    setCurrentTrackIndex(-1);
    setPosition(0);
    setDuration(0);
    setError(null);
    
    console.log('✅ Logged out successfully');
  }, [player]);

  const value = {
    // Player state
    player,
    deviceId,
    isReady,
    isPaused,
    position,
    duration,
    
    // Track state
    currentTrack,
    trackList,
    currentTrackIndex,
    
    // Auth state
    accessToken,
    isPremium,
    
    // Error state
    error,
    
    // Actions
    login,
    logout,
    playTrack,
    togglePlay,
    skipToNext,
    skipToPrevious,
    setVolumeLevel,
    seekToPosition,
    getCurrentState,
    setAccessToken
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};
