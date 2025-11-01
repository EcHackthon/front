import React, { useState, useEffect } from 'react';
import TrackList from '../components/TrackList';
import './styles/Playlist.css';

export default function Playlist() {
  const [groupedRecommendations, setGroupedRecommendations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTracks, setSelectedTracks] = useState([]);

  // localStorage에서 사용자 정보 가져오기
  const getGoogleUser = () => {
    const savedUser = localStorage.getItem('google_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (err) {
        console.error('Failed to parse google user:', err);
        return null;
      }
    }
    return null;
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateOnly = dateString.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dateOnly === todayStr) {
      return '오늘';
    } else if (dateOnly === yesterdayStr) {
      return '어제';
    } else {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
  };

  // 추천 히스토리 가져오기
  useEffect(() => {
    const fetchHistory = async () => {
      const googleUser = getGoogleUser();
      
      if (!googleUser || !googleUser.id) {
        console.log('ℹ️ 로그인된 사용자 없음 - 히스토리 로드 건너뜀');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/api/recommend/history/${googleUser.id}`);
        const data = await response.json();

        if (data.ok && data.data && data.data.length > 0) {
          console.log(`✅ ${data.data.length}개 날짜의 추천 히스토리 로드됨`);
          setGroupedRecommendations(data.data);
          // 기본으로 가장 최근 날짜 선택
          setSelectedDate(data.data[0].date);
        } else {
          console.log('ℹ️ 저장된 추천 히스토리 없음');
          setGroupedRecommendations([]);
        }
      } catch (err) {
        console.error('❌ 히스토리 로드 실패:', err);
        setError('추천 히스토리를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // 선택된 날짜의 트랙 가져오기
  const getSelectedTracks = () => {
    if (!selectedDate) return [];
    const group = groupedRecommendations.find(g => g.date === selectedDate);
    return group ? group.tracks : [];
  };

  // 트랙 선택 토글
  const toggleTrackSelection = (trackId) => {
    setSelectedTracks(prev => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  // 선택된 트랙 삭제
  const handleDeleteSelected = async () => {
    if (selectedTracks.length === 0) return;

    if (!window.confirm(`선택된 ${selectedTracks.length}개의 트랙을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/recommend/tracks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedTracks })
      });

      const data = await response.json();

      if (data.ok) {
        console.log(`✅ ${data.deleted_count}개 트랙 삭제됨`);
        
        // UI에서 삭제된 트랙 제거
        setGroupedRecommendations(prev => {
          return prev.map(group => ({
            ...group,
            tracks: group.tracks.filter(track => !selectedTracks.includes(track.id))
          })).filter(group => group.tracks.length > 0); // 트랙이 없는 날짜 그룹 제거
        });
        
        // 선택 초기화
        setSelectedTracks([]);
        
        // 현재 선택된 날짜에 트랙이 없으면 다른 날짜로 변경
        const currentGroup = groupedRecommendations.find(g => g.date === selectedDate);
        if (currentGroup && currentGroup.tracks.filter(t => !selectedTracks.includes(t.id)).length === 0) {
          const remaining = groupedRecommendations.filter(g => 
            g.date !== selectedDate || g.tracks.some(t => !selectedTracks.includes(t.id))
          );
          if (remaining.length > 0) {
            setSelectedDate(remaining[0].date);
          }
        }
      } else {
        alert('트랙 삭제에 실패했습니다: ' + data.message);
      }
    } catch (err) {
      console.error('❌ 트랙 삭제 실패:', err);
      alert('트랙 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="playlist-page">
        <div className="playlist-loading">추천 히스토리를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlist-page">
        <div className="playlist-error">{error}</div>
      </div>
    );
  }

  if (groupedRecommendations.length === 0) {
    return (
      <div className="playlist-page">
        <div className="playlist-empty">
          <p>아직 추천받은 음악이 없습니다.</p>
          <p>채팅에서 음악을 추천받아보세요! 🎵</p>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-page">
      {/* 날짜 선택 탭 */}
      <div className="date-selector">
        {groupedRecommendations.map(group => (
          <button
            key={group.date}
            onClick={() => setSelectedDate(group.date)}
            className={`date-tab ${selectedDate === group.date ? 'active' : ''}`}
          >
            <span className="date-label">{formatDate(group.date)}</span>
            <span className="track-count">({group.tracks.length}곡)</span>
          </button>
        ))}
        
        {/* 삭제 버튼 */}
        {selectedTracks.length > 0 && (
          <button 
            className="delete-button"
            onClick={handleDeleteSelected}
          >
            삭제하기 ({selectedTracks.length})
          </button>
        )}
      </div>

      {/* 선택된 날짜의 트랙 리스트 */}
      <TrackList 
        tracks={getSelectedTracks()} 
        emptyVariant="none" 
        variant="playlist"
        selectedTracks={selectedTracks}
        onToggleSelect={toggleTrackSelection}
      />
    </div>
  );
}
