import React, { useState, useEffect } from 'react';
import TrackList from '../components/TrackList';
import './styles/Playlist.css';

export default function Playlist() {
  const [groupedRecommendations, setGroupedRecommendations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false); // 캘린더 표시 상태
  const [currentYear, setCurrentYear] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null);

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
          
          // 오늘 날짜와 일치하는 플레이리스트 찾기
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
          const todayGroup = data.data.find(g => g.date.startsWith(todayStr));
          
          // 오늘 날짜 플레이리스트가 있으면 그것을 선택, 없으면 가장 최근 날짜 선택
          const selectedDateValue = todayGroup ? todayGroup.date : data.data[0].date;
          setSelectedDate(selectedDateValue);
          
          // 선택된 날짜의 년월로 캘린더 초기화
          const dateObj = new Date(selectedDateValue);
          setCurrentYear(dateObj.getFullYear());
          setCurrentMonth(dateObj.getMonth());
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

  // 특정 날짜의 추천곡 개수 가져오기
  const getTrackCountForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const group = groupedRecommendations.find(g => g.date.startsWith(dateStr));
    return group ? group.tracks.length : 0;
  };

  // 달력 날짜 클릭 핸들러
  const handleDateClick = (year, month, day) => {
    const trackCount = getTrackCountForDate(year, month, day);
    if (trackCount > 0) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const group = groupedRecommendations.find(g => g.date.startsWith(dateStr));
      if (group) {
        setSelectedDate(group.date);
        setShowCalendar(false); // 캘린더 닫기
      }
    }
  };

  // 달력 생성 함수
  const generateCalendar = () => {
    const displayYear = currentYear ?? new Date().getFullYear();
    const displayMonth = currentMonth ?? new Date().getMonth();
    
    // 현재 달 첫날과 마지막 날
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    
    // 첫 주의 시작 (일요일 기준)
    const startDay = firstDay.getDay();
    
    // 달력 배열 생성
    const days = [];
    
    // 이전 달의 빈 칸
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // 이번 달의 날짜들
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }
    
    return { days, year: displayYear, month: displayMonth };
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    const currentMonthValue = currentMonth ?? new Date().getMonth();
    const currentYearValue = currentYear ?? new Date().getFullYear();
    
    if (currentMonthValue === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYearValue - 1);
    } else {
      setCurrentMonth(currentMonthValue - 1);
    }
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    const currentMonthValue = currentMonth ?? new Date().getMonth();
    const currentYearValue = currentYear ?? new Date().getFullYear();
    
    if (currentMonthValue === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYearValue + 1);
    } else {
      setCurrentMonth(currentMonthValue + 1);
    }
  };

  // 선택된 트랙 삭제
  const handleDeleteSelected = async () => {
    if (selectedTracks.length === 0) return;

    if (!window.confirm(`선택된 ${selectedTracks.length}개의 트랙을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('https://back-ieck.onrender.com/api/recommend/tracks', {
        method: 'POST',
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

  // currentYear와 currentMonth가 null이면 오늘 날짜로 초기화
  const displayYear = currentYear ?? new Date().getFullYear();
  const displayMonth = currentMonth ?? new Date().getMonth();
  
  const { days, year, month } = generateCalendar();
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <div className="playlist-page">
      {/* 날짜 선택 탭 */}
      <div className="date-selector">
        <button 
          className="calendar-button"
          onClick={() => {
            // 캘린더를 열 때 현재 선택된 플레이리스트 날짜의 월로 이동
            if (!showCalendar && selectedDate) {
              const dateObj = new Date(selectedDate);
              setCurrentYear(dateObj.getFullYear());
              setCurrentMonth(dateObj.getMonth());
            }
            setShowCalendar(!showCalendar);
          }}
        >
          📅 캘린더
        </button>
        
        {/* 월 네비게이션 (캘린더 열렸을 때만 표시) */}
        {showCalendar && (
          <div className="calendar-nav-inline">
            <button className="month-nav-button" onClick={goToPreviousMonth}>
              ◀
            </button>
            <span className="current-month">{year}년 {monthNames[month]}</span>
            <button className="month-nav-button" onClick={goToNextMonth}>
              ▶
            </button>
          </div>
        )}
        
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

      {/* 캘린더 페이지 또는 트랙 리스트 */}
      {showCalendar ? (
        <div className="calendar-view">
          <div className="calendar-grid">
            <div className="calendar-day-header">일</div>
            <div className="calendar-day-header">월</div>
            <div className="calendar-day-header">화</div>
            <div className="calendar-day-header">수</div>
            <div className="calendar-day-header">목</div>
            <div className="calendar-day-header">금</div>
            <div className="calendar-day-header">토</div>
            
            {days.map((day, index) => {
              const trackCount = day ? getTrackCountForDate(year, month, day) : 0;
              const today = new Date();
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const hasTrack = trackCount > 0;
              
              // 현재 선택된 플레이리스트 날짜 확인
              const isSelectedPlaylistDate = selectedDate && day && (() => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return selectedDate.startsWith(dateStr);
              })();
              
              return (
                <div 
                  key={index} 
                  className={`calendar-day ${day ? '' : 'empty'} ${isToday ? 'today' : ''} ${isSelectedPlaylistDate ? 'selected' : ''} ${hasTrack ? 'has-track' : ''}`}
                  onClick={() => day && handleDateClick(year, month, day)}
                  style={{ cursor: hasTrack ? 'pointer' : 'default' }}
                >
                  {day && (
                    <>
                      <span className="calendar-day-number">{day}</span>
                      {trackCount > 0 && (
                        <span className="calendar-day-count">({trackCount})</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 선택된 날짜의 트랙 리스트 */
        <TrackList 
          tracks={getSelectedTracks()} 
          emptyVariant="none" 
          variant="playlist"
          selectedTracks={selectedTracks}
          onToggleSelect={toggleTrackSelection}
        />
      )}
    </div>
  );
}
