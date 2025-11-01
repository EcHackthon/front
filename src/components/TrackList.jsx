import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../pages/styles/Playlist.css';
import { useSpotify } from '../contexts/SpotifyContext';

function extractTracks(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const candidates = [
    payload.tracks,
    payload.items,
    payload.songs,
    payload.recommendations,
    payload.results,
    payload.data,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

function formatArtists(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const names = value.map(a => (typeof a === 'string' ? a : a && (a.name || a.artist) ? (a.name || a.artist) : '')).filter(Boolean);
    return names.join(', ');
  }
  if (typeof value === 'object') return value.name || value.artist || '';
  return '';
}

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-size="20">No Image</text></svg>';

function extractUrl(t) {
  if (!t) return null;
  const candidates = [
    t.url,
    t.song_url,
    t.track_url,
    t.external_url,
    (t.external_urls && t.external_urls.spotify),
    t.link,
    t.href,
    t.track_link,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c) return c;
  }
  if (t.album && typeof t.album === 'object') {
    if (t.album.url) return t.album.url;
    if (t.album.external_urls && t.album.external_urls.spotify) return t.album.external_urls.spotify;
  }
  return null;
}

export default function TrackList({ className, emptyVariant = 'text', variant = '' }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null); // outer wrapper (.track-list-wrapper)
  const listRef = useRef(null); // inner .track-list
  const { playTrack, accessToken, isPremium } = useSpotify();

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recommend', { method: 'GET', credentials: 'include' });
      if (!res.ok) {
        // don't surface server errors to the UI; treat as empty data
        console.warn(`TrackList: fetch /api/recommend returned status ${res.status}`);
        setPayload(null);
        return;
      }
      const json = await res.json();
      const newPayload = json && json.ok ? json.data : json;
      setPayload(newPayload);
      
      // 자동 재생 비활성화 - 사용자가 플레이 버튼을 눌러야 재생됨
      const tracks = extractTracks(newPayload);
      if (tracks && tracks.length > 0) {
        console.log('🎵 New recommendations loaded:', tracks.length, 'tracks');
        console.log('ℹ️ Click play button to start playback');
      }
    } catch (e) {
      // Log but do not show a red error to the user
      console.error('Failed to fetch latest recommendation', e);
    } finally {
      setLoading(false);
    }
  }, [playTrack]);

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 10000);
    return () => clearInterval(id);
  }, [fetchLatest]);

  const tracks = extractTracks(payload);
  const WHITE_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%23ffffff"/></svg>';

  // Prepare content depending on tracks / emptyVariant
  let content = null;
  if (tracks && tracks.length > 0) {
    content = (
      <div className="track-list" ref={listRef}>
        {tracks.map((t, idx) => {
          const name = t.name || t.title || '';
          const artists = formatArtists(t.artists || t.artist || t.artists_names || t.artistsName);
          const img = t.album_image || t.album?.image || t.image || t.album_image_url || t.cover || '';
          const url = extractUrl(t);
          const uri = t.uri || t.track_uri || null;
          
          const handlePlayClick = (e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 방지
            
            // Premium 사용자: 트랙을 플레이어에 로드하고 즉시 재생
            if (isPremium && playTrack && uri) {
              console.log('▶️ Playing track:', name, 'at index', idx);
              
              // 트랙 데이터 준비 (전체 리스트 형식으로 변환)
              const trackListData = tracks.map(track => ({
                name: track.name || track.title || '',
                artists: formatArtists(track.artists || track.artist || track.artists_names || track.artistsName),
                albumArt: track.album_image || track.album?.image || track.image || track.album_image_url || track.cover || '',
                uri: track.uri || track.track_uri || null
              }));
              
              playTrack(uri, {
                name,
                artists,
                albumArt: img,
                uri
              }, trackListData, idx);
            } else if (url) {
              window.open(url, '_blank', 'noopener');
            }
          };

          const handleCardClick = () => {
            // 카드 클릭 시 Spotify URL 열기
            if (url) {
              window.open(url, '_blank', 'noopener');
            }
          };
          
          return (
            <div
              className={`track-card ${variant ? `${variant}-card` : ''}`}
              key={idx}
              onClick={handleCardClick}
            >
              <div className="cover">
                <img src={img || PLACEHOLDER} alt={`${name} cover`} onError={(e)=>{e.currentTarget.src=PLACEHOLDER}} />
                {/* 재생 버튼 오버레이 */}
                {isPremium && uri && (
                  <button 
                    className="track-play-btn"
                    onClick={handlePlayClick}
                    aria-label={`Play ${name}`}
                    title={`재생: ${name}`}
                  >
                    ▶
                  </button>
                )}
              </div>
              <div className="meta">
                <div className="track-name" title={name}>{name || 'Unknown Title'}</div>
                <div className="track-artists" title={artists}>{artists || 'Unknown Artist'}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    if (emptyVariant === 'text') {
      content = <div className="empty">추천된 곡이 없습니다.</div>;
    } else if (emptyVariant === 'card') {
      content = (
        <div className="track-list" ref={listRef}>
          <div className={`track-card ${variant ? `${variant}-card` : ''} placeholder`} key="placeholder">
            <div className="cover">
              <img src={WHITE_PLACEHOLDER} alt="placeholder cover" />
            </div>
            <div className="meta">
              <div className="track-name" style={{height: '16px'}}></div>
              <div className="track-artists" style={{height: '12px'}}></div>
            </div>
          </div>
        </div>
      );
    } else {
      // 'none' => content stays null
      content = null;
    }
  }
  // If chat variant, after render, adjust scroll so the 5th card's bottom touches the wrapper bottom
  useEffect(() => {
    if (variant !== 'chat') return;
    const wrapper = wrapperRef.current;
    const list = listRef.current;
    if (!wrapper || !list) return;
    // wait a tick to ensure layout
    const id = setTimeout(() => {
      const children = list.children;
      if (!children || children.length < 5) {
        // if fewer than 5, align last item to bottom
        const last = children[children.length - 1];
        if (last) {
          const delta = last.offsetTop + last.offsetHeight - wrapper.clientHeight;
          wrapper.scrollTop = Math.max(0, delta);
        }
        return;
      }
      const fifth = children[4];
      const delta = fifth.offsetTop + fifth.offsetHeight - wrapper.clientHeight;
      wrapper.scrollTop = Math.max(0, delta);
    }, 50);
    return () => clearTimeout(id);
  }, [variant, tracks]);


  return (
    <div className={className || 'track-list-wrapper'} ref={wrapperRef}>
      {content}
    </div>
  );
}
