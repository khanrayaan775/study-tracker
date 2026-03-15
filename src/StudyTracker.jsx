import React, { useState, useEffect, useRef } from 'react';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function StudyTracker() {
  const [books, setBooks] = useState([]);
  const [series, setSeries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const lastKnownTodayRef = useRef(todayStr());
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddSeries, setShowAddSeries] = useState(false);
  const [view, setView] = useState('dashboard');
  const [tabView, setTabView] = useState('books');
  const [newBook, setNewBook] = useState({ title: '', author: '', totalPages: '', daysToComplete: '', cover: null, coverPreview: null });
  const [newSeries, setNewSeries] = useState({ title: '', instructor: '', totalLectures: '', daysToComplete: '', cover: null, coverPreview: null });
  const [startingId, setStartingId] = useState(null);
  const [startingDays, setStartingDays] = useState('');
  const [type, setType] = useState(null);
  const [planningReadingId, setPlanningReadingId] = useState(null);
  const [planningDays, setPlanningDays] = useState('');
  const [userName, setUserName] = useState('');
  const [tempName, setTempName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tags, setTags] = useState([]);
  const [activityDates, setActivityDates] = useState([]);
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustingType, setAdjustingType] = useState(null);
  const [adjustingDays, setAdjustingDays] = useState('');
  const [adjustingStartDate, setAdjustingStartDate] = useState('');
  const [adjustingStartFromToday, setAdjustingStartFromToday] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const TAG_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    const loadData = async () => {
      try {
        if (typeof window.storage === 'undefined' || typeof window.storage.get !== 'function') {
          console.warn('Storage not available');
          return;
        }
        const booksResult = await window.storage.get('study-books');
        let b = [];
        if (booksResult?.value) {
          b = JSON.parse(booksResult.value);
          b = b.map(book => ({ ...book, tagIds: book.tagIds || [] }));
          setBooks(b);
        }
        const seriesResult = await window.storage.get('study-series');
        let s = [];
        if (seriesResult?.value) {
          s = JSON.parse(seriesResult.value);
          s = s.map(ser => ({ ...ser, tagIds: ser.tagIds || [] }));
          setSeries(s);
        }
        const tagsResult = await window.storage.get('user-tags');
        if (tagsResult?.value) setTags(JSON.parse(tagsResult.value));
        const activityResult = await window.storage.get('user-activity-dates');
        if (activityResult?.value) setActivityDates(JSON.parse(activityResult.value));

        const nameResult = await window.storage.get('user-name');
        if (nameResult?.value) {
          setUserName(nameResult.value);
        }

        const themeResult = await window.storage.get('user-theme');
        if (themeResult?.value) {
          setIsDarkMode(themeResult.value === 'dark');
        }
      } catch (e) {
        console.log('Loading data...', e);
      }
    };
    loadData();
  }, []);

  // When app becomes visible again (e.g. after sleep over midnight), update date if it was "today"
  useEffect(() => {
    const onVisible = () => {
      const now = todayStr();
      if (now !== lastKnownTodayRef.current && selectedDate === lastKnownTodayRef.current) {
        setSelectedDate(now);
      }
      lastKnownTodayRef.current = now;
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onVisible();
    });
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [selectedDate]);

  // Keep "last known today" in sync when user manually picks today
  useEffect(() => {
    if (selectedDate === todayStr()) lastKnownTodayRef.current = selectedDate;
  }, [selectedDate]);

  const updateBooks = (updatedBooks, activityDate) => {
    setBooks(updatedBooks);
    try {
      if (window.storage?.set) window.storage.set('study-books', JSON.stringify(updatedBooks));
      if (activityDate) recordActivity(activityDate);
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const updateSeries = (updatedSeries, activityDate) => {
    setSeries(updatedSeries);
    try {
      if (window.storage?.set) window.storage.set('study-series', JSON.stringify(updatedSeries));
      if (activityDate) recordActivity(activityDate);
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const updateTags = (newTags) => {
    setTags(newTags);
    try {
      if (window.storage?.set) window.storage.set('user-tags', JSON.stringify(newTags));
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const recordActivity = (date) => {
    if (!date || !window.storage?.set) return;
    const next = activityDates.includes(date) ? activityDates : [...activityDates, date].sort();
    setActivityDates(next);
    try {
      window.storage.set('user-activity-dates', JSON.stringify(next));
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const getStreak = (upToDate = selectedDate) => {
    const sorted = [...activityDates].sort();
    if (sorted.length === 0) return { current: 0, longest: 0 };
    let longest = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const [py, pm, pd] = sorted[i - 1].split('-').map(Number);
      const [cy, cm, cd] = sorted[i].split('-').map(Number);
      const prevD = new Date(py, pm - 1, pd).getTime();
      const currD = new Date(cy, cm - 1, cd).getTime();
      const diffDays = (currD - prevD) / (24 * 60 * 60 * 1000);
      if (diffDays === 1) run++;
      else run = 1;
      longest = Math.max(longest, run);
    }
    const pad = (n) => String(n).padStart(2, '0');
    let current = 0;
    let checkDate = upToDate || todayStr();
    while (sorted.includes(checkDate)) {
      current++;
      const [y, m, d] = checkDate.split('-').map(Number);
      const prev = new Date(y, m - 1, d);
      prev.setDate(prev.getDate() - 1);
      checkDate = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-${pad(prev.getDate())}`;
    }
    return { current, longest };
  };

  const applyAdjust = () => {
    const days = parseInt(adjustingDays, 10);
    if (!adjustingId || !adjustingType || !days || days < 1) return;
    const startDate = adjustingStartFromToday ? todayStr() : (adjustingStartDate || undefined);
    if (adjustingType === 'book') {
      updateBooks(books.map(b => b.id === adjustingId
        ? { ...b, daysToComplete: days, ...(startDate ? { startDate } : {}) }
        : b));
    } else {
      updateSeries(series.map(s => s.id === adjustingId
        ? { ...s, daysToComplete: days, ...(startDate ? { startDate } : {}) }
        : s));
    }
    setAdjustingId(null);
    setAdjustingType(null);
    setAdjustingDays('');
    setAdjustingStartDate('');
    setAdjustingStartFromToday(false);
  };

  const saveName = (name) => {
    if (!name.trim()) return;
    setUserName(name.trim());
    try {
      if (window.storage?.set) window.storage.set('user-name', name.trim());
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      if (window.storage?.set) window.storage.set('user-theme', newTheme ? 'dark' : 'light');
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const planReading = (bookId, days) => {
    if (!days) return;
    const updated = books.map(book => {
      if (book.id === bookId) {
        return { ...book, daysToComplete: parseInt(days), startDate: new Date().toISOString().split('T')[0] };
      }
      return book;
    });
    updateBooks(updated);
    setPlanningReadingId(null);
    setPlanningDays('');
  };

  const handleCoverUpload = (file, isBook) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isBook) {
        setNewBook({ ...newBook, cover: reader.result, coverPreview: reader.result });
      } else {
        setNewSeries({ ...newSeries, cover: reader.result, coverPreview: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const addBook = () => {
    if (!newBook.title || !newBook.totalPages) return;
    const book = {
      id: Date.now(),
      title: newBook.title,
      author: newBook.author,
      totalPages: parseInt(newBook.totalPages),
      daysToComplete: newBook.daysToComplete ? parseInt(newBook.daysToComplete) : 0,
      cover: newBook.cover,
      currentPage: 0,
      notesPage: 0,
      note: '',
      startDate: new Date().toISOString().split('T')[0],
      studyDays: {},
      tagIds: []
    };
    updateBooks([...books, book]);
    setNewBook({ title: '', author: '', totalPages: '', daysToComplete: '', cover: null, coverPreview: null });
    setShowAddBook(false);
  };

  const addSeries = () => {
    if (!newSeries.title || !newSeries.totalLectures) return;
    const s = {
      id: Date.now(),
      title: newSeries.title,
      instructor: newSeries.instructor,
      totalLectures: parseInt(newSeries.totalLectures),
      daysToComplete: newSeries.daysToComplete ? parseInt(newSeries.daysToComplete) : 0,
      cover: newSeries.cover,
      lecturesCompleted: 0,
      startDate: new Date().toISOString().split('T')[0],
      lectureNotes: {},
      studyDays: {},
      tagIds: []
    };
    updateSeries([...series, s]);
    setNewSeries({ title: '', instructor: '', totalLectures: '', daysToComplete: '', cover: null, coverPreview: null });
    setShowAddSeries(false);
  };

  const deleteBook = (bookId) => updateBooks(books.filter(b => b.id !== bookId));
  const deleteSeries = (seriesId) => updateSeries(series.filter(s => s.id !== seriesId));

  const getDailyTask = (item, date, isSeries = false) => {
    const totalItems = isSeries ? item.totalLectures : item.totalPages;
    const daysToComplete = item.daysToComplete || 0;
    
    if (!daysToComplete || daysToComplete === 0) {
      return { targetAmount: 0, itemsPerDay: 0, daysElapsed: 0, daysBehind: 0, isOverdue: false };
    }

    const [startYear, startMonth, startDay] = item.startDate.split('-').map(Number);
    const [currentYear, currentMonth, currentDay] = date.split('-').map(Number);
    
    const startD = new Date(startYear, startMonth - 1, startDay);
    const currentD = new Date(currentYear, currentMonth - 1, currentDay);
    
    const daysElapsed = Math.floor((currentD - startD) / (1000 * 60 * 60 * 24)) + 1;
    const itemsPerDay = Math.ceil(totalItems / daysToComplete);
    const currentAmount = isSeries ? item.lecturesCompleted : item.currentPage;
    const targetAmount = Math.min(itemsPerDay * daysElapsed, totalItems);
    
    const daysCompletedFully = Math.floor(currentAmount / itemsPerDay);
    let daysBehind = Math.max(0, daysElapsed - daysCompletedFully - 1);
    daysBehind = Math.min(daysBehind, daysToComplete);
    
    return { targetAmount, itemsPerDay, daysElapsed, daysBehind, isOverdue: currentAmount < targetAmount && daysElapsed > 1 };
  };

  const getDaysRemaining = (item, forDate) => {
    const daysToComplete = item.daysToComplete || 0;
    if (!daysToComplete) return { daysToComplete: 0, daysRemaining: null };
    const [sy, sm, sd] = item.startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(start);
    end.setDate(end.getDate() + daysToComplete - 1);
    const [cy, cm, cd] = (forDate || selectedDate).split('-').map(Number);
    const today = new Date(cy, cm - 1, cd);
    const msRemaining = end.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    return { daysToComplete, daysRemaining };
  };

  const getDailyTasks = () => {
    const tasks = [];
    
    books.forEach(book => {
      if (book.daysToComplete && book.currentPage < book.totalPages) {
        const task = getDailyTask(book, selectedDate);
        if (task.itemsPerDay > 0) {
          // Only show task if they haven't met today's target yet
          if (book.currentPage < task.targetAmount) {
            // Calculate catch-up pages if behind
            const catchUpPages = task.daysBehind * task.itemsPerDay;
            const totalPagesToday = task.itemsPerDay + catchUpPages;
            const nextPageEnd = Math.min(book.currentPage + totalPagesToday, book.totalPages);
            
            tasks.push({
              id: `book-${book.id}`,
              type: 'read',
              title: book.title,
              amount: nextPageEnd - book.currentPage,
              unit: 'pages',
              daysBehind: task.daysBehind
            });
          }
        }
      }

      if (book.currentPage > (book.notesPage || 0)) {
        tasks.push({
          id: `notes-${book.id}`,
          type: 'notes',
          title: book.title,
          amount: book.currentPage - (book.notesPage || 0),
          unit: 'pending pages'
        });
      }
    });

    series.forEach(s => {
      if (s.daysToComplete && s.lecturesCompleted < s.totalLectures) {
        const task = getDailyTask(s, selectedDate, true);
        if (task.itemsPerDay > 0) {
          // Only show task if they haven't met today's target yet
          if (s.lecturesCompleted < task.targetAmount) {
            // Calculate catch-up lectures if behind
            const catchUpLectures = task.daysBehind * task.itemsPerDay;
            const totalLecturesToday = task.itemsPerDay + catchUpLectures;
            const nextLectureEnd = Math.min(s.lecturesCompleted + totalLecturesToday, s.totalLectures);
            
            tasks.push({
              id: `series-${s.id}`,
              type: 'lecture',
              title: s.title,
              amount: nextLectureEnd - s.lecturesCompleted,
              unit: 'lectures',
              daysBehind: task.daysBehind
            });
          }
        }
      }

      let unnotedLectures = 0;
      for (let i = 1; i <= s.lecturesCompleted; i++) {
        if (!s.lectureNotes[`lecture-${i}`]) unnotedLectures++;
      }
      if (unnotedLectures > 0) {
        tasks.push({
          id: `series-notes-${s.id}`,
          type: 'series-notes',
          title: s.title,
          amount: unnotedLectures,
          unit: 'pending lectures'
        });
      }
    });

    return tasks;
  };

  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const colors = {
    bg: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    bgPrimary: isDarkMode ? '#2a2a2a' : '#ffffff',
    bgSecondary: isDarkMode ? '#333333' : '#f0f0f0',
    text: isDarkMode ? '#e0e0e0' : '#1a1a1a',
    textSecondary: isDarkMode ? '#a0a0a0' : '#666666',
    border: isDarkMode ? '#404040' : '#e0e0e0',
    borderSecondary: isDarkMode ? '#505050' : '#d0d0d0'
  };

  // WELCOME VIEW
  if (!userName) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: colors.bg }}>
        <div style={{ padding: '2rem 1.5rem', maxWidth: '700px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            padding: '0.5rem 1rem',
            fontSize: '14px',
            border: `0.5px solid ${colors.border}`,
            background: colors.bgPrimary,
            color: colors.text,
            borderRadius: 'var(--border-radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <div style={{ animation: 'fadeIn 0.6s ease-out', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '36px', fontWeight: '400', fontFamily: 'Georgia, serif', color: colors.text }}>what's your name?</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <input
              type="text"
              placeholder="enter your name"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  saveName(tempName);
                }
              }}
              autoFocus
              style={{
                padding: '0.875rem 1.25rem',
                fontSize: '16px',
                border: `0.5px solid ${colors.border}`,
                borderRadius: 'var(--border-radius-md)',
                background: colors.bgPrimary,
                color: colors.text,
                fontFamily: 'inherit',
                textAlign: 'center'
              }}
            />
            <button
              onClick={() => saveName(tempName)}
              style={{
                padding: '0.875rem 1.25rem',
                fontSize: '14px',
                border: `0.5px solid ${colors.borderSecondary}`,
                background: colors.bgSecondary,
                color: colors.text,
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              continue
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // DASHBOARD VIEW
  if (view === 'dashboard') {
    const tasks = getDailyTasks();

    const themeStyles = `
      :root {
        --bg-primary: ${isDarkMode ? '#1a1a1a' : '#f5f5f5'};
        --bg-secondary: ${isDarkMode ? '#2a2a2a' : '#ffffff'};
        --bg-tertiary: ${isDarkMode ? '#333333' : '#f0f0f0'};
        --text-primary: ${isDarkMode ? '#e0e0e0' : '#1a1a1a'};
        --text-secondary: ${isDarkMode ? '#a0a0a0' : '#666666'};
        --border-primary: ${isDarkMode ? '#404040' : '#e0e0e0'};
        --border-secondary: ${isDarkMode ? '#505050' : '#d0d0d0'};
      }
      input::placeholder {
        color: ${colors.textSecondary};
        opacity: 0.7;
      }
      input {
        color: ${colors.text};
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;

    return (
      <div style={{ width: '100%', minHeight: '100vh', background: colors.bg }}>
        <style>{themeStyles}</style>
        <div style={{ padding: '2rem 1.5rem', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: colors.textSecondary }}>{displayDate}</p>
            <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '400', fontFamily: 'Georgia, serif', color: colors.text }}>
              hey {userName.toLowerCase()}. here's what you have to do today
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '11px', color: colors.textSecondary, fontWeight: '500' }}>Study Tracker v1.2 · Adjust goal, streak, tags</p>
            {(() => { const streak = getStreak(todayStr()); return streak.current > 0 || streak.longest > 0 ? (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '13px', fontWeight: '600', color: colors.text }}>🔥 {streak.current} day{streak.current !== 1 ? 's' : ''} streak {streak.longest > streak.current ? ` · Longest: ${streak.longest}` : ''}</p>
            ) : null; })()}
          </div>
          <button
            onClick={toggleTheme}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '18px',
              border: `0.5px solid ${colors.border}`,
              background: colors.bgPrimary,
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: colors.textSecondary, background: colors.bgPrimary, borderRadius: 'var(--border-radius-lg)', border: `0.5px solid ${colors.border}` }}>
            <p style={{ fontSize: '16px', margin: '0 0 0.5rem 0' }}>You're all caught up! 🎉</p>
            <p style={{ fontSize: '14px', margin: 0 }}>No tasks for today. Add books or series to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', animation: 'slideUp 0.4s ease' }}>
            {tasks.map((task, idx) => (
              <button
                key={task.id}
                onClick={() => setView('daily')}
                style={{
                  padding: '1.25rem',
                  background: colors.bgPrimary,
                  border: `0.5px solid ${colors.border}`,
                  borderRadius: 'var(--border-radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  color: colors.text,
                  animation: `slideUp 0.4s ease ${idx * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.08)' : '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '18px' }}>
                    {task.type === 'read' && '📖'}
                    {task.type === 'notes' && '📝'}
                    {task.type === 'lecture' && '🎥'}
                    {task.type === 'series-notes' && '✍️'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: colors.text }}>
                      {task.type === 'read' && `Read ${task.amount} ${task.unit}`}
                      {task.type === 'notes' && `Write notes for pending pages`}
                      {task.type === 'lecture' && `Watch ${task.amount} ${task.unit}`}
                      {task.type === 'series-notes' && `Add notes for pending lectures`}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.textSecondary }}>{task.title}</div>
                    {task.daysBehind > 0 && (
                      <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '0.25rem', fontWeight: '500' }}>
                        ⚠️ {task.daysBehind} {task.daysBehind === 1 ? 'day' : 'days'} behind schedule
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setView('home')}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '14px',
            border: `0.5px solid ${colors.borderSecondary}`,
            background: colors.bgSecondary,
            color: colors.text,
            borderRadius: 'var(--border-radius-md)',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          View library
        </button>
        </div>
      </div>
    );
  }

  // HOME VIEW
  if (view === 'home') {
    const currentBooks = books.filter(b => b.currentPage > 0 && b.currentPage < b.totalPages);
    const completedBooks = books.filter(b => b.currentPage >= b.totalPages);
    const toReadBooks = books.filter(b => b.currentPage === 0);

    const currentSeries = series.filter(s => s.lecturesCompleted > 0 && s.lecturesCompleted < s.totalLectures);
    const completedSeries = series.filter(s => s.lecturesCompleted >= s.totalLectures);
    const toWatchSeries = series.filter(s => s.lecturesCompleted === 0);

    const isShowingBooks = tabView === 'books-current' || tabView === 'books-completed' || tabView === 'books-toread';
    let itemsToShow = [];
    let itemType = 'book';

    if (tabView === 'books-current') itemsToShow = currentBooks;
    else if (tabView === 'books-completed') itemsToShow = completedBooks;
    else if (tabView === 'books-toread') itemsToShow = toReadBooks;
    else if (tabView === 'series-current') { itemsToShow = currentSeries; itemType = 'series'; }
    else if (tabView === 'series-completed') { itemsToShow = completedSeries; itemType = 'series'; }
    else if (tabView === 'series-towatch') { itemsToShow = toWatchSeries; itemType = 'series'; }

    const themeStyles = `
      input::placeholder {
        color: ${colors.textSecondary};
        opacity: 0.7;
      }
      input {
        color: ${colors.text};
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;

    return (
      <div style={{ width: '100%', minHeight: '100vh', background: colors.bg }}>
        <style>{themeStyles}</style>
        <div style={{ padding: '2rem 1.5rem', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={() => setView('dashboard')} style={{ padding: '0.5rem 1rem', fontSize: '14px', border: `0.5px solid ${colors.borderSecondary}`, background: 'transparent', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', transition: 'all 0.2s ease', color: colors.text }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            ← Dashboard
          </button>
          <button
            onClick={toggleTheme}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '18px',
              border: `0.5px solid ${colors.border}`,
              background: colors.bgPrimary,
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ margin: '0 0 1.5rem 0', fontSize: '32px', fontWeight: '400', fontFamily: 'Georgia, serif', color: colors.text }}>Your Library</h1>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '1rem 1.25rem', background: colors.bgPrimary, borderRadius: 'var(--border-radius-lg)', border: `0.5px solid ${colors.border}`, marginBottom: '1rem' }}>
            <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: '500', minWidth: '50px' }}>Today:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '14px', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, fontFamily: 'inherit', flex: 1 }}
            />
          </div>

          <div style={{ padding: '1rem 1.25rem', background: colors.bgPrimary, borderRadius: 'var(--border-radius-lg)', border: `0.5px solid ${colors.border}`, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAddTag ? '0.75rem' : 0 }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>Tags</span>
              <button type="button" onClick={() => setShowAddTag(!showAddTag)} style={{ padding: '0.35rem 0.75rem', fontSize: '12px', border: `0.5px solid ${colors.border}`, background: colors.bgSecondary, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', color: colors.text }}>{showAddTag ? 'Cancel' : '+ New tag'}</button>
            </div>
            {showAddTag && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input type="text" placeholder="Tag name" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '13px', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, flex: 1, minWidth: '100px' }} />
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {TAG_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewTagColor(c)} style={{ width: 24, height: 24, borderRadius: 4, background: c, border: newTagColor === c ? '2px solid ' + colors.text : 'none', cursor: 'pointer' }} title={c} />
                  ))}
                </div>
                <button type="button" onClick={() => { if (newTagName.trim()) { updateTags([...tags, { id: Date.now(), name: newTagName.trim(), color: newTagColor }]); setNewTagName(''); setNewTagColor(TAG_COLORS[0]); setShowAddTag(false); } }} style={{ padding: '0.4rem 0.75rem', fontSize: '12px', background: colors.bgSecondary, border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', color: colors.text }}>Save</button>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tags.map(t => (
                <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '12px', borderRadius: 'var(--border-radius-md)', background: t.color || '#3b82f6', color: '#fff' }}>
                  {t.name}
                  <button type="button" onClick={() => { updateTags(tags.filter(x => x.id !== t.id)); updateBooks(books.map(b => ({ ...b, tagIds: (b.tagIds || []).filter(id => id !== t.id) }))); updateSeries(series.map(s => ({ ...s, tagIds: (s.tagIds || []).filter(id => id !== t.id) }))); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
                </span>
              ))}
              {tags.length === 0 && !showAddTag && <span style={{ fontSize: '13px', color: colors.textSecondary }}>No tags yet. Add one to categorize books and series.</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: `0.5px solid ${colors.border}`, paddingBottom: '1rem' }}>
          <button 
            onClick={() => setTabView('books-current')} 
            style={{ 
              padding: '0.75rem 1rem', 
              fontSize: '13px', 
              fontWeight: tabView.startsWith('books') ? '600' : '400', 
              border: 'none', 
              background: 'transparent', 
              borderBottom: tabView.startsWith('books') ? `2px solid ${colors.text}` : 'none', 
              cursor: 'pointer', 
              color: tabView.startsWith('books') ? colors.text : colors.textSecondary,
              transition: 'all 0.25s ease'
            }}
          >
            Books
          </button>
          <button 
            onClick={() => setTabView('series-current')} 
            style={{ 
              padding: '0.75rem 1rem', 
              fontSize: '13px', 
              fontWeight: tabView.startsWith('series') ? '600' : '400', 
              border: 'none', 
              background: 'transparent', 
              borderBottom: tabView.startsWith('series') ? `2px solid ${colors.text}` : 'none', 
              cursor: 'pointer', 
              color: tabView.startsWith('series') ? colors.text : colors.textSecondary,
              transition: 'all 0.25s ease'
            }}
          >
            Series
          </button>
        </div>

        {isShowingBooks ? (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
            {[{ key: 'books-current', label: 'Reading', count: currentBooks.length }, { key: 'books-completed', label: 'Completed', count: completedBooks.length }, { key: 'books-toread', label: 'To Read', count: toReadBooks.length }].map(tab => (
              <button 
                key={tab.key} 
                onClick={() => setTabView(tab.key)} 
                style={{ 
                  padding: '0.5rem 0.875rem', 
                  fontSize: '12px', 
                  fontWeight: tabView === tab.key ? '500' : '400', 
                  border: `0.5px solid ${colors.border}`, 
                  background: tabView === tab.key ? colors.bgSecondary : 'transparent', 
                  borderRadius: 'var(--border-radius-md)', 
                  cursor: 'pointer', 
                  color: colors.text,
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
            {[{ key: 'series-current', label: 'Watching', count: currentSeries.length }, { key: 'series-completed', label: 'Completed', count: completedSeries.length }, { key: 'series-towatch', label: 'To Watch', count: toWatchSeries.length }].map(tab => (
              <button 
                key={tab.key} 
                onClick={() => setTabView(tab.key)} 
                style={{ 
                  padding: '0.5rem 0.875rem', 
                  fontSize: '12px', 
                  fontWeight: tabView === tab.key ? '500' : '400', 
                  border: `0.5px solid ${colors.border}`, 
                  background: tabView === tab.key ? colors.bgSecondary : 'transparent', 
                  borderRadius: 'var(--border-radius-md)', 
                  cursor: 'pointer', 
                  color: colors.text,
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}

        {itemsToShow.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: colors.textSecondary, background: colors.bgPrimary, borderRadius: 'var(--border-radius-lg)', border: `0.5px solid ${colors.border}` }}>
            <p style={{ fontSize: '16px', margin: 0 }}>
              {itemType === 'book' ? (tabView.includes('toread') ? 'Add books to your to-read list.' : tabView.includes('completed') ? 'No completed books yet.' : 'No books in progress.') : (tabView.includes('towatch') ? 'Add series to your to-watch list.' : tabView.includes('completed') ? 'No completed series yet.' : 'No series in progress.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
            {itemsToShow.map((item) => {
              const isSeries = 'totalLectures' in item;
              const progress = Math.round(((isSeries ? item.lecturesCompleted : item.currentPage) / (isSeries ? item.totalLectures : item.totalPages)) * 100);

              return (
                <div key={item.id}
                  onClick={() => setView('daily')}
                  style={{
                    padding: '1.5rem',
                    background: colors.bgPrimary,
                    borderRadius: 'var(--border-radius-lg)',
                    border: `0.5px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    gap: '1.5rem',
                    color: colors.text
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {item.cover && <img src={item.cover} alt={item.title} style={{ width: '90px', height: '120px', objectFit: 'cover', borderRadius: 'var(--border-radius-md)', flexShrink: 0, border: '0.5px solid var(--color-border-tertiary)' }} />}
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '16px', fontWeight: '500' }}>{item.title}</h3>
                    {(item.author || item.instructor) && <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, fontWeight: '400' }}>by {item.author || item.instructor}</p>}
                    {(() => {
                      const info = getDaysRemaining(item);
                      if (info.daysToComplete > 0) {
                        const isAdjusting = adjustingId === item.id && adjustingType === (isSeries ? 'series' : 'book');
                        return (
                          <div style={{ margin: '0.25rem 0 0 0' }} onClick={(e) => e.stopPropagation()}>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              Plan: {info.daysToComplete} days · {info.daysRemaining} day{info.daysRemaining !== 1 ? 's' : ''} remaining
                              <button type="button" onClick={() => { setAdjustingId(item.id); setAdjustingType(isSeries ? 'series' : 'book'); setAdjustingDays(String(item.daysToComplete)); setAdjustingStartDate(item.startDate || todayStr()); setAdjustingStartFromToday(false); }} style={{ padding: '0.2rem 0.5rem', fontSize: '11px', border: `0.5px solid ${colors.border}`, background: colors.bgSecondary, borderRadius: 4, cursor: 'pointer', color: colors.text, fontWeight: '500' }}>Adjust</button>
                            </p>
                            {isAdjusting && (
                              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: colors.bgSecondary, borderRadius: 'var(--border-radius-md)', border: `0.5px solid ${colors.border}` }}>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '0.25rem', color: colors.textSecondary }}>Days to complete</label>
                                <input type="number" min={1} value={adjustingDays} onChange={(e) => setAdjustingDays(e.target.value)} style={{ width: '80px', padding: '0.4rem', fontSize: '13px', marginRight: '0.5rem', border: `0.5px solid ${colors.border}`, borderRadius: 4, background: colors.bgPrimary, color: colors.text }} />
                                <div style={{ marginTop: '0.5rem' }}>
                                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '0.25rem', color: colors.textSecondary }}>Start date</label>
                                  <input type="date" value={adjustingStartDate} onChange={(e) => setAdjustingStartDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '13px', marginRight: '0.5rem', border: `0.5px solid ${colors.border}`, borderRadius: 4, background: colors.bgPrimary, color: colors.text }} />
                                  <label style={{ fontSize: '12px', color: colors.text, marginLeft: '0.5rem' }}><input type="checkbox" checked={adjustingStartFromToday} onChange={(e) => setAdjustingStartFromToday(e.target.checked)} /> Start from today</label>
                                </div>
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                  <button type="button" onClick={() => applyAdjust()} style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: colors.bgPrimary, border: `0.5px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', color: colors.text }}>Save</button>
                                  <button type="button" onClick={() => { setAdjustingId(null); setAdjustingType(null); setAdjustingDays(''); setAdjustingStartDate(''); }} style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: 'transparent', border: `0.5px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', color: colors.text }}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {(item.tagIds || []).map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <span key={tagId} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '11px', borderRadius: 4, background: tag.color || '#3b82f6', color: '#fff' }}>
                              {tag.name}
                              <button type="button" onClick={() => { if (isSeries) updateSeries(series.map(s => s.id === item.id ? { ...s, tagIds: (s.tagIds || []).filter(id => id !== tagId) } : s)); else updateBooks(books.map(b => b.id === item.id ? { ...b, tagIds: (b.tagIds || []).filter(id => id !== tagId) } : b)); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}>×</button>
                            </span>
                          );
                        })}
                        <select value="" onChange={(e) => { const id = e.target.value; if (!id) return; const tag = tags.find(t => t.id === Number(id)); if (tag) { if (isSeries) updateSeries(series.map(s => s.id === item.id ? { ...s, tagIds: [...(s.tagIds || []), tag.id] } : s)); else updateBooks(books.map(b => b.id === item.id ? { ...b, tagIds: [...(b.tagIds || []), tag.id] } : b)); } e.target.value = ''; }} style={{ padding: '0.2rem 0.4rem', fontSize: '11px', border: `0.5px solid ${colors.border}`, borderRadius: 4, background: colors.bgSecondary, color: colors.text }}>
                          <option value="">+ Add tag</option>
                          {tags.filter(t => !(item.tagIds || []).includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>

                    <div style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.25rem', fontWeight: '500' }}>
                        {isSeries ? `Lectures: ${item.lecturesCompleted} / ${item.totalLectures}` : `Pages: ${item.currentPage} / ${item.totalPages}`}
                      </div>
                      <div style={{ height: '6px', background: colors.bgSecondary, borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#3b82f6', width: `${progress}%`, transition: 'width 0.2s' }} />
                      </div>
                    </div>

                    {!isSeries && item.currentPage > 0 && item.currentPage < item.totalPages && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.25rem', fontWeight: '500' }}>
                          Notes: {item.notesPage || 0} / {item.currentPage}
                        </div>
                        <div style={{ height: '4px', background: colors.bgSecondary, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#10b981', width: `${item.currentPage > 0 ? Math.round(((item.notesPage || 0) / item.currentPage) * 100) : 0}%`, transition: 'width 0.2s' }} />
                        </div>
                      </div>
                    )}

                    {isSeries && item.lecturesCompleted > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.25rem', fontWeight: '500' }}>
                          Notes: {Object.keys(item.lectureNotes || {}).length} / {item.lecturesCompleted}
                        </div>
                      </div>
                    )}

                    {!isSeries && (
                      <div style={{ marginTop: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                        <textarea
                          placeholder="Add note here"
                          value={item.note || ''}
                          onChange={(e) => updateBooks(books.map(b => b.id === item.id ? { ...b, note: e.target.value } : b))}
                          style={{
                            width: '100%',
                            minHeight: '56px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '13px',
                            border: `0.5px solid ${colors.border}`,
                            borderRadius: 'var(--border-radius-md)',
                            background: colors.bgSecondary,
                            color: colors.text,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                          }}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {!isSeries && item.currentPage === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartingId(item.id);
                          setType('book');
                          setStartingDays('');
                        }}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '12px', 
                          background: colors.bgSecondary, 
                          border: `0.5px solid ${colors.borderSecondary}`,
                          color: colors.text,
                          borderRadius: 'var(--border-radius-md)',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        Start reading
                      </button>
                    )}
                    {!isSeries && item.currentPage === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanningReadingId(item.id);
                          setPlanningDays('');
                        }}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '12px', 
                          background: colors.bgSecondary, 
                          border: `0.5px solid ${colors.borderSecondary}`,
                          color: colors.text,
                          borderRadius: 'var(--border-radius-md)',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        Plan reading
                      </button>
                    )}
                    {isSeries && item.lecturesCompleted === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartingId(item.id);
                          setType('series');
                          setStartingDays('');
                        }}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '12px', 
                          background: colors.bgSecondary, 
                          border: `0.5px solid ${colors.borderSecondary}`,
                          color: colors.text,
                          borderRadius: 'var(--border-radius-md)',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        Start watching
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isSeries ? deleteSeries(item.id) : deleteBook(item.id);
                      }}
                      style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.3, padding: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {planningReadingId && (
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: colors.bgPrimary, borderRadius: 'var(--border-radius-lg)', border: `1.5px solid ${colors.borderSecondary}`, color: colors.text, animation: 'slideDown 0.3s ease' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', fontWeight: '500', color: colors.text }}>Plan reading</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: colors.textSecondary }}>
              {books.find(b => b.id === planningReadingId)?.title}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
              <input 
                type="number" 
                placeholder="e.g. 30" 
                value={planningDays} 
                onChange={(e) => setPlanningDays(e.target.value)} 
                autoFocus 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  fontSize: '14px', 
                  border: `0.5px solid ${colors.border}`, 
                  borderRadius: 'var(--border-radius-md)', 
                  background: colors.bgSecondary, 
                  color: colors.text
                }} 
              />
              <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: '500' }}>days</span>
            </div>
            <p style={{ margin: '0.5rem 0 1rem 0', fontSize: '12px', color: colors.textSecondary }}>
              {planningDays ? `~${Math.ceil(books.find(b => b.id === planningReadingId)?.totalPages / parseInt(planningDays))} pages/day` : 'Enter days to see daily goal'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => planReading(planningReadingId, planningDays)} 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  fontSize: '13px', 
                  border: `0.5px solid ${colors.borderSecondary}`, 
                  background: colors.bgSecondary, 
                  borderRadius: 'var(--border-radius-md)', 
                  cursor: 'pointer', 
                  fontWeight: '500',
                  color: colors.text,
                  transition: 'all 0.2s ease'
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Plan it
              </button>
              <button 
                onClick={() => { setPlanningReadingId(null); setPlanningDays(''); }} 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  fontSize: '13px', 
                  border: `0.5px solid ${colors.borderSecondary}`, 
                  background: 'transparent', 
                  borderRadius: 'var(--border-radius-md)', 
                  cursor: 'pointer', 
                  fontWeight: '500',
                  color: colors.text,
                  transition: 'all 0.2s ease'
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          {isShowingBooks ? (
            <button 
              onClick={() => setShowAddBook(!showAddBook)} 
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                fontSize: '14px', 
                border: `0.5px solid ${colors.borderSecondary}`, 
                background: showAddBook ? colors.bgSecondary : 'transparent', 
                borderRadius: 'var(--border-radius-md)', 
                cursor: 'pointer', 
                fontWeight: '500', 
                color: colors.text,
                transition: 'all 0.2s ease',
                transform: 'scale(1)'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {showAddBook ? '✕' : '+'} Book
            </button>
          ) : (
            <button 
              onClick={() => setShowAddSeries(!showAddSeries)} 
              style={{ 
                flex: 1, 
                padding: '0.75rem', 
                fontSize: '14px', 
                border: `0.5px solid ${colors.borderSecondary}`, 
                background: showAddSeries ? colors.bgSecondary : 'transparent', 
                borderRadius: 'var(--border-radius-md)', 
                cursor: 'pointer', 
                fontWeight: '500', 
                color: colors.text,
                transition: 'all 0.2s ease',
                transform: 'scale(1)'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {showAddSeries ? '✕' : '+'} Series
            </button>
          )}
        </div>

        {isShowingBooks && showAddBook && (
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1.5rem', 
            background: colors.bgPrimary, 
            borderRadius: 'var(--border-radius-lg)', 
            border: `0.5px solid ${colors.border}`, 
            color: colors.text,
            animation: 'slideDown 0.3s ease'
          }}>
            <style>{`
              input[type="file"] {
                display: none;
              }
              .file-input-label {
                display: inline-block;
                width: 100%;
                padding: 0.75rem;
                font-size: 13px;
                border: 0.5px solid ${colors.border};
                border-radius: var(--border-radius-md);
                background: ${colors.bgSecondary};
                color: ${colors.text};
                box-sizing: border-box;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
              }
              .file-input-label:hover {
                background: ${isDarkMode ? '#3a3a3a' : '#e8e8e8'};
                border-color: ${colors.text};
              }
              .file-input-label:active {
                transform: scale(0.98);
              }
            `}</style>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', fontWeight: '500', color: colors.text }}>Add book</h3>
            <input placeholder="Title" value={newBook.title} onChange={(e) => setNewBook({...newBook, title: e.target.value})} style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontSize: '14px', boxSizing: 'border-box', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, transition: 'all 0.2s ease' }} />
            <input placeholder="Author (optional)" value={newBook.author} onChange={(e) => setNewBook({...newBook, author: e.target.value})} style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontSize: '14px', boxSizing: 'border-box', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, transition: 'all 0.2s ease' }} />
            <input placeholder="Total pages" type="number" value={newBook.totalPages} onChange={(e) => setNewBook({...newBook, totalPages: e.target.value})} style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontSize: '14px', boxSizing: 'border-box', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, transition: 'all 0.2s ease' }} />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', color: colors.textSecondary }}>Cover (optional)</label>
              <label className="file-input-label" htmlFor="book-cover-input">
                📁 Choose cover image
              </label>
              <input id="book-cover-input" type="file" accept="image/*" onChange={(e) => handleCoverUpload(e.target.files?.[0], true)} />
              {newBook.coverPreview && <img src={newBook.coverPreview} alt="preview" style={{ marginTop: '0.75rem', height: '100px', width: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius-md)' }} />}
            </div>
            <button 
              onClick={addBook} 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                fontSize: '14px', 
                background: colors.bgSecondary, 
                border: `0.5px solid ${colors.borderSecondary}`, 
                borderRadius: 'var(--border-radius-md)', 
                cursor: 'pointer', 
                fontWeight: '500', 
                color: colors.text,
                transition: 'all 0.2s ease'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Add book
            </button>
          </div>
        )}

        {!isShowingBooks && showAddSeries && (
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1.5rem', 
            background: colors.bgPrimary, 
            borderRadius: 'var(--border-radius-lg)', 
            border: `0.5px solid ${colors.border}`, 
            color: colors.text,
            animation: 'slideDown 0.3s ease'
          }}>
            <style>{`
              input[type="file"] {
                display: none;
              }
              .file-input-label {
                display: inline-block;
                width: 100%;
                padding: 0.75rem;
                font-size: 13px;
                border: 0.5px solid ${colors.border};
                border-radius: var(--border-radius-md);
                background: ${colors.bgSecondary};
                color: ${colors.text};
                box-sizing: border-box;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
              }
              .file-input-label:hover {
                background: ${isDarkMode ? '#3a3a3a' : '#e8e8e8'};
                border-color: ${colors.text};
              }
              .file-input-label:active {
                transform: scale(0.98);
              }
            `}</style>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', fontWeight: '500', color: colors.text }}>Add series</h3>
            <input placeholder="Title" value={newSeries.title} onChange={(e) => setNewSeries({...newSeries, title: e.target.value})} style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontSize: '14px', boxSizing: 'border-box', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, transition: 'all 0.2s ease' }} />
            <input placeholder="Instructor (optional)" value={newSeries.instructor} onChange={(e) => setNewSeries({...newSeries, instructor: e.target.value})} style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontSize: '14px', boxSizing: 'border-box', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, transition: 'all 0.2s ease' }} />
            <input placeholder="Total lectures" type="number" value={newSeries.totalLectures} onChange={(e) => setNewSeries({...newSeries, totalLectures: e.target.value})} style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontSize: '14px', boxSizing: 'border-box', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text, transition: 'all 0.2s ease' }} />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', color: colors.textSecondary }}>Cover (optional)</label>
              <label className="file-input-label" htmlFor="series-cover-input">
                📁 Choose cover image
              </label>
              <input id="series-cover-input" type="file" accept="image/*" onChange={(e) => handleCoverUpload(e.target.files?.[0], false)} />
              {newSeries.coverPreview && <img src={newSeries.coverPreview} alt="preview" style={{ marginTop: '0.75rem', height: '100px', width: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius-md)' }} />}
            </div>
            <button 
              onClick={addSeries} 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                fontSize: '14px', 
                background: colors.bgSecondary, 
                border: `0.5px solid ${colors.borderSecondary}`, 
                borderRadius: 'var(--border-radius-md)', 
                cursor: 'pointer', 
                fontWeight: '500', 
                color: colors.text,
                transition: 'all 0.2s ease'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Add series
            </button>
          </div>
        )}

        {startingId && (
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: colors.bgPrimary, borderRadius: 'var(--border-radius-lg)', border: `1.5px solid ${colors.borderSecondary}`, color: colors.text }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', fontWeight: '500', color: colors.text }}>Start {type === 'series' ? 'watching' : 'reading'}</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: colors.textSecondary }}>
              {(type === 'book' ? books : series).find(b => b.id === startingId)?.title}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
              <input type="number" placeholder="e.g. 7" value={startingDays} onChange={(e) => setStartingDays(e.target.value)} autoFocus style={{ flex: 1, padding: '0.75rem', fontSize: '14px', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgSecondary, color: colors.text }} />
              <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: '500' }}>days</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { if (!startingDays) return; const updated = (type === 'book' ? books : series).map(item => { if (item.id === startingId) { return { ...item, daysToComplete: parseInt(startingDays), [type === 'book' ? 'currentPage' : 'lecturesCompleted']: 1, startDate: new Date().toISOString().split('T')[0] }; } return item; }); type === 'book' ? updateBooks(updated) : updateSeries(updated); setStartingId(null); setStartingDays(''); }} style={{ flex: 1, padding: '0.75rem', fontSize: '13px', border: `0.5px solid ${colors.borderSecondary}`, background: colors.bgSecondary, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '500', color: colors.text }}>
                Start
              </button>
              <button onClick={() => { setStartingId(null); setStartingDays(''); }} style={{ flex: 1, padding: '0.75rem', fontSize: '13px', border: `0.5px solid ${colors.borderSecondary}`, background: 'transparent', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '500', color: colors.text }}>
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  // DAILY VIEW
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: colors.bg }}>
      <div style={{ padding: '2rem 1.5rem', maxWidth: '650px', margin: '0 auto' }}>
      <style>{`
        :root {
          --bg-primary: ${isDarkMode ? '#1a1a1a' : '#f5f5f5'};
          --bg-secondary: ${isDarkMode ? '#2a2a2a' : '#ffffff'};
          --button-bg: ${isDarkMode ? '#3a3a3a' : '#e8e8e8'};
          --button-text: ${colors.text};
          --text-primary: ${isDarkMode ? '#e0e0e0' : '#1a1a1a'};
          --text-secondary: ${isDarkMode ? '#a0a0a0' : '#666666'};
          --border-primary: ${isDarkMode ? '#404040' : '#e0e0e0'};
          --border-secondary: ${isDarkMode ? '#505050' : '#d0d0d0'};
          --color-background-primary: ${colors.bgPrimary};
          --color-background-secondary: ${colors.bgSecondary};
          --color-text-secondary: ${colors.textSecondary};
          --color-border-secondary: ${colors.borderSecondary};
          --color-border-tertiary: ${colors.border};
        }
        input::placeholder {
          color: ${colors.textSecondary};
          opacity: 0.7;
        }
        input {
          color: ${colors.text};
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => setView('dashboard')} style={{ padding: '0.5rem 1rem', fontSize: '14px', border: `0.5px solid ${colors.borderSecondary}`, background: 'transparent', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', transition: 'all 0.2s ease', color: colors.text }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          ← Dashboard
        </button>
        <button
          onClick={toggleTheme}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '18px',
            border: `0.5px solid ${colors.border}`,
            background: colors.bgPrimary,
            borderRadius: 'var(--border-radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <h1 style={{ margin: '0 0 1rem 0', fontSize: '32px', fontWeight: '500', fontFamily: 'Georgia, serif', color: colors.text }}>{displayDate}</h1>
      
      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '0.5rem 0.75rem', fontSize: '14px', border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-md)', background: colors.bgPrimary, color: colors.text, fontFamily: 'inherit', marginBottom: '2rem' }} />

      {(() => {
        const activeBooks = books.filter(b => b.currentPage < b.totalPages);
        const activeSeries = series.filter(s => s.lecturesCompleted < s.totalLectures);
        if (activeBooks.length === 0 && activeSeries.length === 0) {
          return (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: colors.textSecondary, background: colors.bgPrimary, borderRadius: 'var(--border-radius-lg)', border: `0.5px solid ${colors.border}` }}>
              <p style={{ fontSize: '16px', margin: 0 }}>{books.length > 0 || series.length > 0 ? "No active items — all done for now." : "No items yet."}</p>
            </div>
          );
        }
        return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {activeBooks.map((book, idx) => {
            const task = getDailyTask(book, selectedDate);
            const pagesToCompleteToday = Math.max(0, Math.min(task.targetAmount - book.currentPage, book.totalPages - book.currentPage));
            const daysInfo = getDaysRemaining(book);
            return (
              <div key={`book-${book.id}`} style={{ border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-lg)', padding: '1.5rem', background: colors.bgPrimary, transition: 'all 0.2s ease', color: colors.text, animation: `slideUp 0.4s ease ${idx * 0.1}s both` }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.08)' : '0 4px 12px rgba(0, 0, 0, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '18px', fontWeight: '500', color: colors.text }}>{book.title}</h3>
                {book.author && <p style={{ margin: '0 0 0.25rem 0', fontSize: '14px', color: colors.textSecondary }}>by {book.author}</p>}
                {daysInfo.daysToComplete > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, fontWeight: '500' }}>
                      Plan: {daysInfo.daysToComplete} days · {daysInfo.daysRemaining} day{daysInfo.daysRemaining !== 1 ? 's' : ''} remaining
                    </p>
                    <button type="button" onClick={() => { setAdjustingId(book.id); setAdjustingType('book'); setAdjustingDays(String(book.daysToComplete)); setAdjustingStartDate(book.startDate || todayStr()); setAdjustingStartFromToday(false); }} style={{ marginTop: '0.35rem', padding: '0.35rem 0.65rem', fontSize: '12px', border: `1px solid ${colors.borderSecondary}`, background: isDarkMode ? '#3a3a3a' : colors.bgSecondary, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', color: colors.text, fontWeight: '500', display: 'inline-block' }}>
                      Adjust plan
                    </button>
                    {adjustingId === book.id && adjustingType === 'book' && (
                      <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: colors.bgSecondary, borderRadius: 'var(--border-radius-md)', border: `0.5px solid ${colors.border}` }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '0.25rem', color: colors.textSecondary }}>Days to complete</label>
                        <input type="number" min={1} value={adjustingDays} onChange={(e) => setAdjustingDays(e.target.value)} style={{ width: '80px', padding: '0.4rem', fontSize: '13px', marginRight: '0.5rem', border: `0.5px solid ${colors.border}`, borderRadius: 4, background: colors.bgPrimary, color: colors.text }} />
                        <div style={{ marginTop: '0.5rem' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '0.25rem', color: colors.textSecondary }}>Start date</label>
                          <input type="date" value={adjustingStartDate} onChange={(e) => setAdjustingStartDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '13px', marginRight: '0.5rem', border: `0.5px solid ${colors.border}`, borderRadius: 4, background: colors.bgPrimary, color: colors.text }} />
                          <label style={{ fontSize: '12px', color: colors.text }}><input type="checkbox" checked={adjustingStartFromToday} onChange={(e) => setAdjustingStartFromToday(e.target.checked)} /> Start from today</label>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button type="button" onClick={() => applyAdjust()} style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: colors.bgPrimary, border: `0.5px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', color: colors.text }}>Save</button>
                          <button type="button" onClick={() => { setAdjustingId(null); setAdjustingType(null); setAdjustingDays(''); setAdjustingStartDate(''); }} style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: 'transparent', border: `0.5px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', color: colors.text }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: '1.5rem', background: colors.bgSecondary, borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.75rem', fontWeight: '500' }}>Pages: {book.currentPage} / {book.totalPages}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, currentPage: Math.max(0, b.currentPage - 5) } : b), selectedDate)} style={{ padding: '0.75rem 1rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>− 5</button>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, currentPage: Math.max(0, b.currentPage - 1) } : b), selectedDate)} style={{ padding: '0.75rem 0.75rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>− 1</button>
                      <input type="number" value={book.currentPage} onChange={(e) => updateBooks(books.map(b => b.id === book.id ? { ...b, currentPage: parseInt(e.target.value) || 0 } : b), selectedDate)} style={{ width: '80px', padding: '0.75rem', fontSize: '16px', fontWeight: '600', textAlign: 'center', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--button-bg)', color: 'var(--button-text)' }} />
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, currentPage: Math.min(b.totalPages, b.currentPage + 1) } : b), selectedDate)} style={{ padding: '0.75rem 0.75rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>+ 1</button>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, currentPage: Math.min(b.totalPages, b.currentPage + 5) } : b), selectedDate)} style={{ padding: '0.75rem 1rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>+ 5</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, currentPage: Math.min(b.totalPages, b.currentPage + pagesToCompleteToday) } : b), selectedDate)} style={{ padding: '0.75rem', fontSize: '13px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '500' }}>
                        Today's quota (+{pagesToCompleteToday}p)
                      </button>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, currentPage: b.totalPages } : b), selectedDate)} style={{ padding: '0.75rem', fontSize: '13px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '500' }}>
                        Finish
                      </button>
                    </div>
                  </div>

                  <div style={{ borderTop: `0.5px solid ${colors.border}`, paddingTop: '1rem' }}>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.75rem', fontWeight: '500' }}>Notes: {book.notesPage || 0} / {book.currentPage}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, notesPage: Math.max(0, (b.notesPage || 0) - 5) } : b), selectedDate)} style={{ padding: '0.5rem 0.75rem', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>− 5</button>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, notesPage: Math.max(0, (b.notesPage || 0) - 1) } : b), selectedDate)} style={{ padding: '0.5rem 0.75rem', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>− 1</button>
                      <input type="number" value={book.notesPage || 0} onChange={(e) => updateBooks(books.map(b => b.id === book.id ? { ...b, notesPage: parseInt(e.target.value) || 0 } : b), selectedDate)} style={{ flex: 1, padding: '0.5rem', fontSize: '14px', fontWeight: '600', textAlign: 'center', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--button-bg)', color: 'var(--button-text)' }} />
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, notesPage: Math.min(b.currentPage, (b.notesPage || 0) + 1) } : b), selectedDate)} style={{ padding: '0.5rem 0.75rem', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>+ 1</button>
                      <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, notesPage: Math.min(b.currentPage, (b.notesPage || 0) + 5) } : b), selectedDate)} style={{ padding: '0.5rem 0.75rem', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>+ 5</button>
                    </div>
                    <button onClick={() => updateBooks(books.map(b => b.id === book.id ? { ...b, notesPage: b.currentPage } : b), selectedDate)} style={{ width: '100%', padding: '0.75rem', fontSize: '13px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '500' }}>
                      Mark all as noted
                    </button>
                  </div>

                  <div style={{ borderTop: `0.5px solid ${colors.border}`, paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.5rem', fontWeight: '500' }}>Note</div>
                    <textarea
                      placeholder="Add note here"
                      value={book.note || ''}
                      onChange={(e) => updateBooks(books.map(b => b.id === book.id ? { ...b, note: e.target.value } : b))}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '0.5rem 0.75rem',
                        fontSize: '13px',
                        border: `0.5px solid ${colors.border}`,
                        borderRadius: 'var(--border-radius-md)',
                        background: colors.bgPrimary,
                        color: colors.text,
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {activeSeries.map(s => {
            const task = getDailyTask(s, selectedDate, true);
            const lecturesToCompleteToday = Math.max(0, Math.min(task.targetAmount - s.lecturesCompleted, s.totalLectures - s.lecturesCompleted));
            const daysInfo = getDaysRemaining(s);

            return (
              <div key={`series-${s.id}`} style={{ border: `0.5px solid ${colors.border}`, borderRadius: 'var(--border-radius-lg)', padding: '1.5rem', background: colors.bgPrimary, transition: 'all 0.2s ease', color: colors.text }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '18px', fontWeight: '500', color: colors.text }}>{s.title}</h3>
                {s.instructor && <p style={{ margin: '0 0 0.25rem 0', fontSize: '14px', color: colors.textSecondary }}>by {s.instructor}</p>}
                {daysInfo.daysToComplete > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, fontWeight: '500' }}>
                      Plan: {daysInfo.daysToComplete} days · {daysInfo.daysRemaining} day{daysInfo.daysRemaining !== 1 ? 's' : ''} remaining
                    </p>
                    <button type="button" onClick={() => { setAdjustingId(s.id); setAdjustingType('series'); setAdjustingDays(String(s.daysToComplete)); setAdjustingStartDate(s.startDate || todayStr()); setAdjustingStartFromToday(false); }} style={{ marginTop: '0.35rem', padding: '0.35rem 0.65rem', fontSize: '12px', border: `1px solid ${colors.borderSecondary}`, background: isDarkMode ? '#3a3a3a' : colors.bgSecondary, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', color: colors.text, fontWeight: '500', display: 'inline-block' }}>
                      Adjust plan
                    </button>
                    {adjustingId === s.id && adjustingType === 'series' && (
                      <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: colors.bgSecondary, borderRadius: 'var(--border-radius-md)', border: `0.5px solid ${colors.border}` }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '0.25rem', color: colors.textSecondary }}>Days to complete</label>
                        <input type="number" min={1} value={adjustingDays} onChange={(e) => setAdjustingDays(e.target.value)} style={{ width: '80px', padding: '0.4rem', fontSize: '13px', marginRight: '0.5rem', border: `0.5px solid ${colors.border}`, borderRadius: 4, background: colors.bgPrimary, color: colors.text }} />
                        <div style={{ marginTop: '0.5rem' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '0.25rem', color: colors.textSecondary }}>Start date</label>
                          <input type="date" value={adjustingStartDate} onChange={(e) => setAdjustingStartDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '13px', marginRight: '0.5rem', border: `0.5px solid ${colors.border}`, borderRadius: 4, background: colors.bgPrimary, color: colors.text }} />
                          <label style={{ fontSize: '12px', color: colors.text }}><input type="checkbox" checked={adjustingStartFromToday} onChange={(e) => setAdjustingStartFromToday(e.target.checked)} /> Start from today</label>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button type="button" onClick={() => applyAdjust()} style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: colors.bgPrimary, border: `0.5px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', color: colors.text }}>Save</button>
                          <button type="button" onClick={() => { setAdjustingId(null); setAdjustingType(null); setAdjustingDays(''); setAdjustingStartDate(''); }} style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: 'transparent', border: `0.5px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', color: colors.text }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: '1.5rem', background: colors.bgSecondary, borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.75rem', fontWeight: '500' }}>Lectures: {s.lecturesCompleted} / {s.totalLectures}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <button onClick={() => updateSeries(series.map(x => x.id === s.id ? { ...x, lecturesCompleted: Math.max(0, x.lecturesCompleted - 5) } : x), selectedDate)} style={{ padding: '0.75rem 1rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>− 5</button>
                      <button onClick={() => updateSeries(series.map(x => x.id === s.id ? { ...x, lecturesCompleted: Math.max(0, x.lecturesCompleted - 1) } : x), selectedDate)} style={{ padding: '0.75rem 0.75rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>− 1</button>
                      <input type="number" value={s.lecturesCompleted} onChange={(e) => updateSeries(series.map(x => x.id === s.id ? { ...x, lecturesCompleted: parseInt(e.target.value) || 0 } : x), selectedDate)} style={{ width: '80px', padding: '0.75rem', fontSize: '16px', fontWeight: '600', textAlign: 'center', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--button-bg)', color: 'var(--button-text)' }} />
                      <button onClick={() => updateSeries(series.map(x => x.id === s.id ? { ...x, lecturesCompleted: Math.min(x.totalLectures, x.lecturesCompleted + 1) } : x), selectedDate)} style={{ padding: '0.75rem 0.75rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>+ 1</button>
                      <button onClick={() => updateSeries(series.map(x => x.id === s.id ? { ...x, lecturesCompleted: Math.min(x.totalLectures, x.lecturesCompleted + 5) } : x), selectedDate)} style={{ padding: '0.75rem 1rem', fontSize: '16px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '600' }}>+ 5</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      <button onClick={() => updateSeries(series.map(x => x.id === s.id ? { ...x, lecturesCompleted: Math.min(x.totalLectures, x.lecturesCompleted + lecturesToCompleteToday) } : x), selectedDate)} style={{ padding: '0.75rem', fontSize: '13px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '500' }}>
                        Today's quota (+{lecturesToCompleteToday})
                      </button>
                      <button onClick={() => updateSeries(series.map(x => x.id === s.id ? { ...x, lecturesCompleted: x.totalLectures } : x), selectedDate)} style={{ padding: '0.75rem', fontSize: '13px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--button-bg)', color: 'var(--button-text)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontWeight: '500' }}>
                        Finish
                      </button>
                    </div>
                  </div>

                  <div style={{ borderTop: `0.5px solid ${colors.border}`, paddingTop: '1rem' }}>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '0.75rem', fontWeight: '500' }}>Notes taken: {Object.keys(s.lectureNotes || {}).length} / {s.lecturesCompleted}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[...Array(s.lecturesCompleted)].map((_, i) => (
                        <button
                          key={`lecture-${i + 1}`}
                          onClick={() => {
                            const key = `lecture-${i + 1}`;
                            updateSeries(series.map(x => x.id === s.id ? { ...x, lectureNotes: { ...x.lectureNotes, [key]: !x.lectureNotes[key] ? selectedDate : undefined } } : x), selectedDate);
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '13px',
                            border: `0.5px solid ${colors.borderSecondary}`,
                            background: s.lectureNotes[`lecture-${i + 1}`] ? '#10b981' : colors.bgPrimary,
                            borderRadius: 'var(--border-radius-md)',
                            cursor: 'pointer',
                            color: s.lectureNotes[`lecture-${i + 1}`] ? '#ffffff' : colors.text,
                            fontWeight: '500',
                            textAlign: 'left'
                          }}
                        >
                          {s.lectureNotes[`lecture-${i + 1}`] ? '✓' : '○'} Lecture {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}
      </div>
    </div>
  );
}