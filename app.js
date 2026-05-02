// App Logic for LingoMaster

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('error', function(e) {
    console.error(e);
    alert("程式發生錯誤: " + e.message + "\n行號: " + e.lineno + "\n檔案: " + e.filename);
  });
  // DOM Elements
  const screens = {
    start: document.getElementById('screen-start'),
    learn: document.getElementById('screen-learn'),
    readyQuiz: document.getElementById('screen-ready-quiz'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    wordle: document.getElementById('screen-wordle'),
    history: document.getElementById('screen-history'),
    'review-summary': document.getElementById('screen-review-summary')
  };

  // Dashboard & History Elements
  const userStreakEl = document.getElementById('user-streak');
  const userMasteredEl = document.getElementById('user-mastered');
  const btnShowHistory = document.getElementById('btn-show-history');
  const btnHistoryBack = document.getElementById('btn-history-back');
  const historyList = document.getElementById('history-list');
  const hCountEl = document.getElementById('h-count');

  // Streak Popup Elements
  const streakOverlay = document.getElementById('streak-overlay');
  const streakPopupCount = document.getElementById('streak-popup-count');
  const btnCloseStreak = document.getElementById('btn-close-streak');
  const weeklyCalendarEl = document.getElementById('weekly-calendar');
  const btnTestStreak = document.getElementById('btn-test-streak');
  const btnClearStats = document.getElementById('btn-clear-stats');
  const confettiContainer = document.getElementById('confetti-container');

  // Start Screen Elements
  const countBtns = document.querySelectorAll('.btn-count');
  const diffBtns = document.querySelectorAll('.btn-diff');
  const btnStartLearning = document.getElementById('btn-start-learning');
  const totalWordCountEl = document.getElementById('total-word-count');
  const countEasyEl = document.getElementById('count-easy');
  const countMediumEl = document.getElementById('count-medium');
  const countHardEl = document.getElementById('count-hard');
  const btnStartWordle = document.getElementById('btn-start-wordle');
  const langBtns = document.querySelectorAll('.btn-lang');

  // Wordle Elements
  const wordleBoard = document.getElementById('wordle-board');
  const wordleKeyboard = document.getElementById('wordle-keyboard');
  const wordleMessage = document.getElementById('wordle-message');
  const btnWordleBack = document.getElementById('btn-wordle-back');

  // Learn Screen Elements
  const learnCurrentIndex = document.getElementById('learn-current-index');
  const learnTotal = document.getElementById('learn-total');
  const learnProgressFill = document.getElementById('learn-progress-fill');
  const fcWord = document.getElementById('fc-word');
  const fcPos = document.getElementById('fc-pos');
  const fcVerbForms = document.getElementById('fc-verb-forms');
  const fcTrans = document.getElementById('fc-trans');
  const fcExample = document.getElementById('fc-example');
  const fcExampleTrans = document.getElementById('fc-example-trans');
  const btnSpeakWord = document.getElementById('btn-speak-word');
  const btnSpeakExample = document.getElementById('btn-speak-example');
  const btnNextWord = document.getElementById('btn-next-word');
  const flashcard = document.getElementById('flashcard');

  // Review Summary Screen
  const btnFinalQuizStart = document.getElementById('btn-final-quiz-start');
  const cardFanArea = document.getElementById('card-fan');
  const summaryCountEl = document.getElementById('summary-count');

  // Ready Quiz Screen
  const btnStartQuiz = document.getElementById('btn-start-quiz');

  // Quiz Screen Elements
  const quizCurrentIndex = document.getElementById('quiz-current-index');
  const quizTotal = document.getElementById('quiz-total');
  const quizProgressFill = document.getElementById('quiz-progress-fill');
  const quizQuestion = document.getElementById('quiz-question');
  const btnSpeakQuiz = document.getElementById('btn-speak-quiz');
  const btnShowHint = document.getElementById('btn-show-hint');
  const btnShowTrans = document.getElementById('btn-show-trans');
  const quizHint = document.getElementById('quiz-hint');
  const quizTrans = document.getElementById('quiz-trans');
  const quizOptionsContainer = document.getElementById('quiz-options');
  const quizFeedback = document.getElementById('quiz-feedback');
  const btnNextQuestion = document.getElementById('btn-next-question');

  // Result Screen Elements
  const scoreCorrectEl = document.getElementById('score-correct');
  const scoreTotalEl = document.getElementById('score-total');
  const scoreCircle = document.querySelector('.score-circle');
  const resultMsg = document.getElementById('result-msg');
  const resultEmoji = document.getElementById('result-emoji');
  const btnRestart = document.getElementById('btn-restart');

  // App State
  let selectedCount = 5;
  let selectedDifficulty = 'easy';
  let activeWords = [];
  let currentIndex = 0;
  let score = 0;
  let currentLang = 'english';
  let wordDatabase = [];

  // Mock System State
  let isMockMode = sessionStorage.getItem('lingomaster_mock_stats') !== null;
  let mockOffset = parseInt(sessionStorage.getItem('lingomaster_mock_offset') || '0');

  function getToday() {
    const d = new Date();
    if (isMockMode) {
      d.setDate(d.getDate() + mockOffset);
    }
    return d;
  }

  function getTodayStr() {
    return getToday().toISOString().split('T')[0];
  }

  // --- Stats Manager ---
  const StatsManager = {
    globalKey: 'lingomaster_global_stats',
    mockKey: 'lingomaster_mock_stats',
    getLangKey(lang) {
      return 'lingomaster_mastered_' + (lang || currentLang || 'english');
    },

    init() {
      const oldSingle = localStorage.getItem('lingomaster_user_stats');
      if (oldSingle && !localStorage.getItem('lingomaster_user_stats_english')) {
        localStorage.setItem('lingomaster_user_stats_english', oldSingle);
      }
      const oldEng = localStorage.getItem('lingomaster_user_stats_english');
      if (oldEng && !localStorage.getItem(this.globalKey)) {
        try {
          const parsed = JSON.parse(oldEng);
          const globalData = {
            streak: parsed.streak || 0,
            lastPlayed: parsed.lastPlayed || null,
            history: parsed.history || []
          };
          localStorage.setItem(this.globalKey, JSON.stringify(globalData));
          localStorage.setItem(this.getLangKey('english'), JSON.stringify(parsed.masteredWords || []));
        } catch(e) {}
      }
    },
    
    getStats() {
      this.init();
      const lang = currentLang || 'english';
      const defaultGlobal = { streak: 0, lastPlayed: null, history: [] };
      const storedGlobal = isMockMode ? sessionStorage.getItem(this.mockKey) : localStorage.getItem(this.globalKey);
      let global = defaultGlobal;
      try {
        if(storedGlobal) global = JSON.parse(storedGlobal);
      } catch(e) {}
      
      const storedMastered = localStorage.getItem(this.getLangKey(lang));
      let masteredWords = [];
      try {
        if(storedMastered) masteredWords = JSON.parse(storedMastered);
      } catch(e) {}
      
      return { ...global, masteredWords };
    },

    saveStats(stats) {
      const lang = currentLang || 'english';
      const globalData = {
        streak: stats.streak,
        lastPlayed: stats.lastPlayed,
        history: stats.history
      };
      const masteredData = stats.masteredWords;

      if (isMockMode) {
        sessionStorage.setItem(this.mockKey, JSON.stringify(stats));
      } else {
        localStorage.setItem(this.globalKey, JSON.stringify(globalData));
        localStorage.setItem(this.getLangKey(lang), JSON.stringify(masteredData));
      }
    },

    refreshDashboard() {
      const stats = this.getStats();
      if (userStreakEl) userStreakEl.textContent = stats.streak;
      if (userMasteredEl) userMasteredEl.textContent = stats.masteredWords.length;
    },

    forceIncrementStreak() {
      if (!isMockMode) {
        isMockMode = true;
        mockOffset = 0; 
        const realStats = this.getStats();
        sessionStorage.setItem(this.mockKey, JSON.stringify(realStats));
      }
      const stats = this.getStats();
      if (stats.history.length > 0) mockOffset += 1;

      const fakeToday = getTodayStr();
      const updatedStats = this.getStats();
      if (!updatedStats.history.includes(fakeToday)) {
        updatedStats.history.push(fakeToday);
        updatedStats.streak += 1;
      }
      updatedStats.lastPlayed = fakeToday;
      this.saveStats(updatedStats);
      this.refreshDashboard();
      sessionStorage.setItem('lingomaster_mock_offset', mockOffset);
      return updatedStats.streak;
    },

    clearMockStats() {
      isMockMode = false;
      mockOffset = 0;
      sessionStorage.removeItem(this.mockKey);
      sessionStorage.removeItem('lingomaster_mock_offset');
      this.refreshDashboard();
    },

    clearStats() {
      localStorage.removeItem(this.globalKey);
      localStorage.removeItem(this.getLangKey('english'));
      localStorage.removeItem(this.getLangKey('korean'));
      this.refreshDashboard();
    },

    checkStreakReset() {
      if (isMockMode) return;
      const stats = this.getStats();
      const today = getTodayStr();
      const last = stats.lastPlayed;
      if (last && last !== today) {
        const lastDate = new Date(last);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          stats.streak = 0;
          this.saveStats(stats);
        }
      }
      this.refreshDashboard();
    },

    incrementStreak() {
      const stats = this.getStats();
      const today = getTodayStr();
      const last = stats.lastPlayed;
      if (last === today) return false;

      if (!last) {
        stats.streak = 1;
      } else {
        const lastDate = new Date(last);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          stats.streak += 1;
        } else {
          stats.streak = 1;
        }
      }
      stats.lastPlayed = today;
      if (!stats.history.includes(today)) stats.history.push(today);
      this.saveStats(stats);
      this.refreshDashboard();
      return stats.streak;
    },

    addMasteredWord(word) {
      const stats = this.getStats();
      if (!stats.masteredWords.includes(word)) {
        stats.masteredWords.push(word);
        this.saveStats(stats);
        this.refreshDashboard();
      }
    }
  };

  // Initialize Language and Data
  function loadLanguage(lang) {
    currentLang = lang;
    if (lang === 'korean') {
      wordDatabase = (typeof koreanDatabase !== 'undefined') ? koreanDatabase : [];
    } else {
      wordDatabase = (typeof englishDatabase !== 'undefined') ? englishDatabase : [];
    }
    totalWordCountEl.textContent = wordDatabase.length;
    if(countEasyEl) {
      countEasyEl.textContent = wordDatabase.filter(w => w.diff === 'easy').length;
      countMediumEl.textContent = wordDatabase.filter(w => w.diff === 'medium').length;
      countHardEl.textContent = wordDatabase.filter(w => w.diff === 'hard').length;
      const countProEl = document.getElementById('count-pro');
      if(countProEl) countProEl.textContent = wordDatabase.filter(w => w.diff === 'pro').length;
    }
    const subtitle = document.querySelector('.app-subtitle');
    if (lang === 'korean') {
      subtitle.textContent = '韓文單字訓練所 🇰🇷';
      document.title = 'LingoMaster | 韓文單字大師';
    } else {
      subtitle.textContent = '你的每日單字訓練所';
      document.title = 'LingoMaster | 英文單字大師';
    }
    StatsManager.refreshDashboard();
    StatsManager.checkStreakReset();
  }

  // Initial Load
  loadLanguage('english');

  // Language Selection
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadLanguage(btn.dataset.lang);
    });
  });

  // Init Stats
  StatsManager.checkStreakReset();
  StatsManager.refreshDashboard();

  function showStreakPopup(days) {
    const modal = document.querySelector('.streak-modal');
    const calendarBox = document.querySelector('.streak-calendar');
    
    // Reset special effects
    modal.classList.remove('milestone-7');
    streakOverlay.classList.remove('victory-flash');
    if (calendarBox) {
      calendarBox.classList.remove('slide-new-week');
      const oldLabel = calendarBox.querySelector('.calendar-new-label');
      if (oldLabel) oldLabel.remove();
    }
    confettiContainer.innerHTML = '';

    streakPopupCount.textContent = days;
    renderWeeklyCalendar();
    
    // Check for 7-day milestone
    if (days > 0 && days % 7 === 0) {
      modal.classList.add('milestone-7');
      streakOverlay.classList.add('victory-flash');
      createConfetti();
    }

    // 新的一週動畫：當天數是 8, 15, 22... (也就是新週期的第 1 天)
    if (days > 1 && days % 7 === 1) {
      setTimeout(() => {
        if (calendarBox) {
          calendarBox.classList.add('slide-new-week');
          // 加入 "New Week" 標籤
          const newLabel = document.createElement('div');
          newLabel.className = 'calendar-new-label';
          newLabel.textContent = 'New Week 🚀';
          calendarBox.appendChild(newLabel);
        }
      }, 100);
    }

    streakOverlay.classList.remove('hidden');
    setTimeout(() => {
      streakOverlay.classList.add('active');
    }, 50);
  }

  function createConfetti() {
    const colors = ['#fcc419', '#ff6b6b', '#51cf66', '#339af0', '#cc5de8', '#ffffff'];
    const count = 100; // 增加數量
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's'; // 增加持續時間感
      confetti.style.width = Math.random() * 12 + 6 + 'px';
      confetti.style.height = confetti.style.width;
      confetti.style.borderRadius = i % 2 === 0 ? '50%' : '2px'; // 混合圓形與方形紙屑
      confettiContainer.appendChild(confetti);
    }
  }

  function renderWeeklyCalendar() {
    const stats = StatsManager.getStats();
    const today = getToday();
    
    // 計算「今天」應該在哪一個位置 (0-6)
    // 當天數是 1, 8, 15... 時，今天在第 0 位 (最左邊)
    // 當天數是 7, 14, 21... 時，今天在第 6 位 (最右邊)
    let position = 0;
    if (stats.streak > 0) {
      position = (stats.streak - 1) % 7;
    }
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - position);
    
    weeklyCalendarEl.innerHTML = '';
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      const dateStr = d.toISOString().split('T')[0];
      const dateNum = d.getDate();
      const dayName = dayNames[d.getDay()];
      
      const isToday = dateStr === getTodayStr();
      const isCompleted = stats.history.includes(dateStr);
      
      const dayEl = document.createElement('div');
      dayEl.className = `cal-day ${isToday ? 'today' : ''} ${isCompleted ? 'active' : ''}`;
      dayEl.innerHTML = `
        <div class="cal-dot">${dateNum}</div>
        <div class="cal-name">${dayName}</div>
      `;
      weeklyCalendarEl.appendChild(dayEl);
    }
  }

  btnCloseStreak.addEventListener('click', () => {
    streakOverlay.classList.remove('active');
    setTimeout(() => {
      streakOverlay.classList.add('hidden');
      confettiContainer.innerHTML = '';
    }, 400);
  });

  // --- Test/Debug Listeners ---
  if (btnTestStreak) {
    btnTestStreak.addEventListener('click', () => {
      const newStreak = StatsManager.forceIncrementStreak();
      showStreakPopup(newStreak);
    });
  }

  if (btnClearStats) {
    btnClearStats.addEventListener('click', () => {
      const hasMockData = sessionStorage.getItem('lingomaster_mock_stats') !== null;
      
      if (hasMockData) {
        StatsManager.clearMockStats();
        alert("模擬紀錄已清除，回到真實狀態。");
        location.reload();
      } else {
        alert("目前沒有模擬紀錄可以清除喔！此按鈕僅用於測試模式。");
      }
    });
  }

  // --- Utility Functions ---
  
  // Get N random elements from array
  function getRandomWords(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(n, arr.length));
  }

  // Speak Text
  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 根據當前語系設定發音語言
      if (currentLang === 'korean') {
        utterance.lang = 'ko-KR';
      } else {
        utterance.lang = 'en-US';
      }
      
      // 嘗試尋找該語言的最佳人聲
      const voices = window.speechSynthesis.getVoices();
      const targetLang = currentLang === 'korean' ? 'ko' : 'en';
      const bestVoice = voices.find(v => v.lang.startsWith(targetLang) && v.localService);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('SpeechSynthesis API not supported in this browser.');
    }
  }

  // Switch screens
  function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
      if (screen.classList.contains('active')) {
        screen.classList.remove('active');
        screen.classList.add('exit');
        setTimeout(() => screen.classList.remove('exit'), 400); // clear exit class
      }
    });
    
    setTimeout(() => {
      if (screens[screenName]) {
        screens[screenName].classList.add('active');
      } else {
        console.error(`Screen "${screenName}" not found!`);
      }
    }, 100);
  }

  // Generate options for quiz (1 correct, 3 random wrong from mixed difficulty)
  function generateQuizOptions(correctWord) {
    const options = [correctWord];
    
    // Determine allowed difficulties for wrong options
    let allowedDifficulties = [];
    if (selectedDifficulty === 'easy') {
      allowedDifficulties = ['easy', 'medium'];
    } else if (selectedDifficulty === 'hard') {
      allowedDifficulties = ['medium', 'hard', 'pro'];
    } else if (selectedDifficulty === 'pro') {
      allowedDifficulties = ['hard', 'pro'];
    } else {
      allowedDifficulties = ['easy', 'medium', 'hard', 'pro'];
    }
    
    // Pick words from allowed difficulties
    const filteredDatabase = wordDatabase.filter(w => allowedDifficulties.includes(w.diff));
    
    // Fallback to entire database if not enough words (safety check)
    const sourceDatabase = filteredDatabase.length >= 4 ? filteredDatabase : wordDatabase;

    while(options.length < 4) {
      const randomWordObj = sourceDatabase[Math.floor(Math.random() * sourceDatabase.length)];
      if(!options.includes(randomWordObj.word)) {
        options.push(randomWordObj.word);
      }
    }
    return options.sort(() => 0.5 - Math.random()); // Shuffle
  }

  // Create a blank in the example sentence
  function createBlankSentence(example, word) {
    if (currentLang === 'korean') {
      // 韓文處理：直接尋找單字並挖空，不管後面是否有助詞
      return example.replace(word, '________');
    }
    
    // 英文處理：原本的邏輯
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(example)) {
       return example.replace(regex, '________');
    } else {
       const rootRegex = new RegExp(word.substring(0, word.length - 2) + '[a-z]*', 'gi');
       if(rootRegex.test(example)) {
           return example.replace(rootRegex, '________');
       }
       return example.replace(word, '________');
    }
  }


  // --- Event Listeners: Start Screen ---

  countBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      countBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCount = parseInt(btn.dataset.count);
    });
  });

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.diff;
      
      // Update badge theme for Pro
      const totalBadge = document.querySelector('.total-words-badge');
      const diffBreakdown = document.querySelector('.diff-breakdown');
      if (selectedDifficulty === 'pro') {
          totalBadge.classList.add('pro-mode');
          diffBreakdown.classList.add('pro-mode');
      } else {
          totalBadge.classList.remove('pro-mode');
          diffBreakdown.classList.remove('pro-mode');
      }
    });
  });

  let cardRotation = 180; // 初始角度 (背面)

  btnStartLearning.addEventListener('click', () => {
    const filteredWords = wordDatabase.filter(w => w.diff === selectedDifficulty);
    activeWords = getRandomWords(filteredWords, selectedCount);
    
    if(activeWords.length === 0) {
      alert("此難度目前沒有單字！");
      return;
    }
    
    selectedCount = activeWords.length;
    currentIndex = 0;
    
    if (selectedDifficulty === 'pro') {
        flashcard.classList.add('pro-theme');
    } else {
        flashcard.classList.remove('pro-theme');
    }

    // 初始化：角度重設為 180 (背面)
    cardRotation = 180;
    if (flashcard) {
        flashcard.style.transition = 'none';
        flashcard.style.transform = `rotateY(${cardRotation}deg)`;
        flashcard.offsetHeight; 
        flashcard.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    learnTotal.textContent = selectedCount;
    renderFlashcard();
    showScreen('learn');

    // 延遲一點點後翻向正面 (180 -> 0)
    setTimeout(() => {
      cardRotation = 0;
      if (flashcard) flashcard.style.transform = `rotateY(${cardRotation}deg)`;
    }, 600);
  });

  // --- Event Listeners: Learn Screen ---

  function renderFlashcard() {
    const wordObj = activeWords[currentIndex];
    
    fcWord.textContent = wordObj.word;
    fcPos.textContent = wordObj.pos;
    
    if (wordObj.verbForms) {
      fcVerbForms.textContent = `三態：${wordObj.verbForms}`;
      fcVerbForms.classList.remove('hidden');
    } else {
      fcVerbForms.classList.add('hidden');
    }
    
    fcTrans.textContent = wordObj.trans;
    
    // 高亮邏輯：韓文直接匹配，英文才使用根部匹配
    let highlightedExample = wordObj.example;
    if (currentLang === 'korean') {
      const regex = new RegExp(`(${wordObj.word})`, 'gi');
      highlightedExample = wordObj.example.replace(regex, '<span class="highlight">$1</span>');
    } else {
      const regex = new RegExp(`(${wordObj.word.substring(0, wordObj.word.length-2)}[a-z]*)`, 'gi');
      if(regex.test(wordObj.example)) {
          highlightedExample = wordObj.example.replace(regex, '<span class="highlight">$1</span>');
      }
    }
    fcExample.innerHTML = highlightedExample;
    fcExampleTrans.textContent = wordObj.exampleTrans;

    learnCurrentIndex.textContent = currentIndex + 1;
    
    const progress = ((currentIndex) / selectedCount) * 100;
    learnProgressFill.style.width = `${progress}%`;

    if (currentIndex === selectedCount - 1) {
      btnNextWord.textContent = "完成學習 🎉";
    } else {
      btnNextWord.textContent = "下一個單字 ➔";
    }
  }

  btnSpeakWord.addEventListener('click', (e) => {
    e.stopPropagation();
    speakText(activeWords[currentIndex].word);
  });

  btnSpeakExample.addEventListener('click', (e) => {
    e.stopPropagation();
    speakText(activeWords[currentIndex].example);
  });

  btnNextWord.addEventListener('click', () => {
    if (flashcard) {
      // 1. 繼續往左翻轉到背面 (0 -> -180, -360 -> -540 ...)
      cardRotation -= 180;
      flashcard.style.transform = `rotateY(${cardRotation}deg)`;
      
      // 2. 在背面時切換數據 (約 400ms)
      setTimeout(() => {
        currentIndex++;
        if (currentIndex < selectedCount) {
          renderFlashcard();
          
          // 3. 數據更新後繼續往左翻回正面 (-180 -> -360, -540 -> -720 ...)
          setTimeout(() => {
            cardRotation -= 180;
            flashcard.style.transform = `rotateY(${cardRotation}deg)`;
          }, 50); 
        } else {
          learnProgressFill.style.width = `100%`;
          setTimeout(() => {
            renderReviewSummary();
            showScreen('review-summary');
          }, 300);
        }
      }, 400); 
    }
  });

  function renderReviewSummary() {
    summaryCountEl.textContent = selectedCount;
    cardFanArea.innerHTML = '';

    // 針對手機版自動縮小間距
    const isMobile = window.innerWidth <= 600;
    let spacing;
    const wordCount = activeWords.length;

    if (wordCount <= 5) {
      spacing = isMobile ? 55 : 70; 
    } else if (wordCount <= 10) {
      spacing = isMobile ? 30 : 38; 
    } else {
      spacing = isMobile ? 20 : 24; 
    }

    activeWords.forEach((wordObj, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'review-card-wrapper';
      
      // 使用動態計算的 spacing
      const xOffset = (index - (wordCount - 1) / 2) * spacing;
      
      wrapper.style.setProperty('--x', `${xOffset}px`);
      wrapper.style.zIndex = index;

      const card = document.createElement('div');
      // 直接套用跟學習介面完全一樣的類別
      card.className = 'flashcard-front';
      
      // 高亮邏輯：韓文直接匹配，英文才使用根部匹配
      let highlightedExample = wordObj.example;
      if (currentLang === 'korean') {
        const regex = new RegExp(`(${wordObj.word})`, 'gi');
        highlightedExample = wordObj.example.replace(regex, '<span class="highlight">$1</span>');
      } else {
        const regex = new RegExp(`(${wordObj.word.substring(0, wordObj.word.length-2)}[a-z]*)`, 'gi');
        if(regex.test(wordObj.example)) {
            highlightedExample = wordObj.example.replace(regex, '<span class="highlight">$1</span>');
        }
      }

      card.innerHTML = `
        <div class="card-content">
          <div class="word-header-main">
            <div class="word-title-group">
              <h1 class="word-text">${wordObj.word}</h1>
              <span class="pos-badge">${wordObj.pos}</span>
            </div>
            <button class="btn-icon-large btn-speak-word-mini">🔊</button>
          </div>

          <div class="trans-section">
            <p class="trans-text">${wordObj.trans}</p>
            <div class="verb-forms ${wordObj.verbForms ? '' : 'hidden'}">
               ${wordObj.verbForms ? '三態：' + wordObj.verbForms : ''}
            </div>
          </div>
          
          <div class="example-section">
            <div class="example-header">
              <span>例句用法</span>
              <button class="btn-icon-small btn-speak-example-mini">🔊</button>
            </div>
            <p class="example-text">${highlightedExample}</p>
            <p id="fc-example-trans" class="example-trans-text">${wordObj.exampleTrans}</p>
          </div>
        </div>
      `;
      
      // 為手牌內的按鈕綁定事件
      card.querySelector('.btn-speak-word-mini').addEventListener('click', (e) => {
          e.stopPropagation();
          speakText(wordObj.word);
      });
      card.querySelector('.btn-speak-example-mini').addEventListener('click', (e) => {
          e.stopPropagation();
          speakText(wordObj.example);
      });

      wrapper.appendChild(card);
      cardFanArea.appendChild(wrapper);

      // 點擊卡片鎖定在中央
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止觸發背景的清除邏輯
        
        const isFocused = wrapper.classList.contains('focused');
        
        // 先清除所有卡片的狀態
        document.querySelectorAll('.review-card-wrapper').forEach(w => w.classList.remove('focused'));
        
        if (!isFocused) {
          wrapper.classList.add('focused');
        }
      });
    });
  }

  // 點擊背景（非卡片處）取消鎖定
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.review-card-wrapper')) {
      document.querySelectorAll('.review-card-wrapper').forEach(w => w.classList.remove('focused'));
    }
  });

  btnFinalQuizStart.addEventListener('click', () => {
    showScreen('readyQuiz');
    // 自動開始測驗也可以，或者停在 readyQuiz
    setTimeout(() => {
        btnStartQuiz.click();
    }, 500);
  });

  // --- Event Listeners: Ready Quiz Screen ---

  btnStartQuiz.addEventListener('click', () => {
    // Shuffle the active words for the quiz so it's not the same order
    activeWords = activeWords.sort(() => 0.5 - Math.random());
    currentIndex = 0;
    score = 0;
    quizTotal.textContent = selectedCount;
    renderQuizQuestion();
    showScreen('quiz');
  });

  // --- Event Listeners: Quiz Screen ---

  function renderQuizQuestion() {
    const wordObj = activeWords[currentIndex];
    
    quizCurrentIndex.textContent = currentIndex + 1;
    const progress = ((currentIndex) / selectedCount) * 100;
    quizProgressFill.style.width = `${progress}%`;

    const quizInstruction = document.querySelector('.quiz-instruction');
    const isTranslationQuestion = Math.random() > 0.5; // 50% chance

    if (isTranslationQuestion) {
      quizInstruction.textContent = "請選出以下中文對應的英文單字：";
      quizQuestion.textContent = `${wordObj.trans} (${wordObj.pos})`;
      
      btnSpeakQuiz.style.display = 'none';
      btnShowHint.style.display = 'none';
      btnShowTrans.style.display = 'none';
      quizHint.classList.add('hidden');
      quizTrans.classList.add('hidden');
    } else {
      quizInstruction.textContent = "請選擇正確的單字填入空格：";
      quizQuestion.innerHTML = createBlankSentence(wordObj.example, wordObj.word);
      
      btnSpeakQuiz.style.display = 'inline-flex';
      btnShowHint.style.display = 'inline-block';
      btnShowTrans.style.display = 'inline-block';
      quizHint.classList.add('hidden');
      quizTrans.classList.add('hidden');
      
      quizHint.textContent = `提示：${wordObj.trans} (${wordObj.pos})`;
      quizTrans.textContent = wordObj.exampleTrans;
    }
    
    quizFeedback.innerHTML = '';
    quizFeedback.className = 'quiz-feedback';
    btnNextQuestion.classList.add('hidden');

    const options = generateQuizOptions(wordObj.word);
    quizOptionsContainer.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-option';
      btn.textContent = opt;
      btn.onclick = () => handleAnswerSelect(opt, wordObj.word, btn);
      quizOptionsContainer.appendChild(btn);
    });
  }

  function handleAnswerSelect(selected, correct, btnClicked) {
    // Disable all options
    const allBtns = quizOptionsContainer.querySelectorAll('.btn-option');
    allBtns.forEach(btn => btn.disabled = true);

    if (selected === correct) {
      btnClicked.classList.add('correct');
      quizFeedback.innerHTML = '✨ 答對了！';
      quizFeedback.className = 'quiz-feedback feedback-correct';
      score++;
    } else {
      btnClicked.classList.add('wrong');
      // Highlight the correct one
      allBtns.forEach(btn => {
        if(btn.textContent === correct) {
          btn.classList.add('correct');
        }
      });
      quizFeedback.innerHTML = `❌ 答錯了，正確答案是 <b>${correct}</b>`;
      quizFeedback.className = 'quiz-feedback feedback-wrong';
    }

    // If correct, mark as mastered
    if (selected === correct) {
      StatsManager.addMasteredWord(correct);
    }

    // Show next button
    if (currentIndex === selectedCount - 1) {
      btnNextQuestion.textContent = "查看結果 🏆";
    } else {
      btnNextQuestion.textContent = "下一題 ➔";
    }
    btnNextQuestion.classList.remove('hidden');
  }

  // Quiz Helpers Event Listeners
  btnSpeakQuiz.addEventListener('click', () => {
    const wordObj = activeWords[currentIndex];
    // Create text replacing the word with '...' to create a natural pause instead of saying "blank"
    const sentenceWithBlank = wordObj.example.replace(new RegExp(`\\b${wordObj.word.substring(0, wordObj.word.length-2)}[a-z]*\\b`, 'gi'), '...');
    speakText(sentenceWithBlank);
  });

  btnShowHint.addEventListener('click', () => {
    quizHint.classList.remove('hidden');
    btnShowHint.style.display = 'none';
  });

  btnShowTrans.addEventListener('click', () => {
    quizTrans.classList.remove('hidden');
    btnShowTrans.style.display = 'none';
  });

  btnNextQuestion.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex < selectedCount) {
      renderQuizQuestion();
    } else {
      quizProgressFill.style.width = `100%`;
      setTimeout(() => renderResultScreen(), 300);
    }
  });

  // --- Event Listeners: Result Screen ---

  function renderResultScreen() {
    scoreCorrectEl.textContent = score;
    scoreTotalEl.textContent = selectedCount;

    const percentage = (score / selectedCount) * 100;
    scoreCircle.style.setProperty('--progress', `${percentage}%`);

    if (percentage === 100) {
      resultEmoji.textContent = '👑';
      resultMsg.textContent = '完美滿分！你是單字大師！';
    } else if (percentage >= 80) {
      resultEmoji.textContent = '🌟';
      resultMsg.textContent = '太棒了！你的記憶力真好！';
    } else if (percentage >= 60) {
      resultEmoji.textContent = '👍';
      resultMsg.textContent = '表現不錯，繼續保持！';
    } else {
      resultEmoji.textContent = '💪';
      resultMsg.textContent = '多練習幾次，你會越來越好的！';
    }

    showScreen('result');

    // Trigger Streak Popup if earned
    const newStreak = StatsManager.incrementStreak();
    if (newStreak) {
      setTimeout(() => {
        showStreakPopup(newStreak);
      }, 1000);
    }
  }

  btnRestart.addEventListener('click', () => {
    showScreen('start');
  });

  // --- History Logic ---
  btnShowHistory.addEventListener('click', () => {
    renderHistory();
    showScreen('history');
  });

  btnHistoryBack.addEventListener('click', () => {
    showScreen('start');
  });

  function renderHistory(historyLang) {
    const lang = historyLang || currentLang;
    const key = StatsManager.getLangKey(lang);
    
    // 取得指定語系的已學單字
    const storedMastered = localStorage.getItem(key);
    const masteredWords = storedMastered ? JSON.parse(storedMastered) : [];
    
    hCountEl.textContent = masteredWords.length;
    historyList.innerHTML = '';

    const langName = lang === 'korean' ? '韓文' : '英文';
    document.getElementById('h-lang-label').textContent = `${langName}學習清單`;

    if (masteredWords.length === 0) {
      historyList.innerHTML = `<div class="empty-state">還沒有${langName}的學習紀錄喔！</div>`;
      return;
    }

    // 根據語系選擇正確的單字庫進行顯示
    const db = (lang === 'korean') ? (typeof koreanDatabase !== 'undefined' ? koreanDatabase : []) : (typeof englishDatabase !== 'undefined' ? englishDatabase : []);

    const sortedWords = [...masteredWords].sort();
    sortedWords.forEach(wordStr => {
      const wordObj = db.find(w => w.word === wordStr);
      if (!wordObj) return;

      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="h-item-info">
          <h4>${wordObj.word}</h4>
          <p>${wordObj.trans}</p>
        </div>
        <div class="h-item-meta">
          <span class="h-badge">${wordObj.diff}</span>
        </div>
      `;
      historyList.appendChild(item);
    });
  }

  // 紀錄頁面的語系切換
  document.querySelectorAll('.btn-h-lang').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-h-lang').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHistory(btn.dataset.lang);
    });
  });

  // --- Wordle Game Logic ---
  let wordleWord = '';
  let wordleWordObj = null;
  let wordleGuesses = [];
  let currentWordleGuess = '';
  const MAX_WORDLE_GUESSES = 10;
  let isWordleGameOver = false;

  btnStartWordle.addEventListener('click', () => {
    try {
      initWordle();
      showScreen('wordle');
    } catch (err) {
      alert("Error starting Wordle: " + err.message + "\n" + err.stack);
      console.error(err);
    }
  });

  btnWordleBack.addEventListener('click', () => {
    showScreen('start');
  });

  function initWordle() {
    isWordleGameOver = false;
    wordleGuesses = [];
    currentWordleGuess = '';
    wordleMessage.textContent = '';
    wordleMessage.className = 'quiz-feedback';
    wordleBoard.innerHTML = '';
    
    // Pick a word between 4 and 8 characters
    const validWords = wordDatabase.filter(w => w.word.length >= 4 && w.word.length <= 8 && !w.word.includes(' ') && !w.word.includes('-'));
    wordleWordObj = validWords[Math.floor(Math.random() * validWords.length)];
    wordleWord = wordleWordObj.word.toLowerCase();
    
    // Initialize Board
    for (let i = 0; i < MAX_WORDLE_GUESSES; i++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';
      for (let j = 0; j < wordleWord.length; j++) {
        const tile = document.createElement('div');
        tile.className = 'wordle-tile';
        row.appendChild(tile);
      }
      wordleBoard.appendChild(row);
    }

    // Reset Keyboard
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
      key.classList.remove('correct', 'present', 'absent');
    });
  }

  function handleWordleKey(key) {
    if (isWordleGameOver) return;

    if (key === 'enter') {
      submitWordleGuess();
    } else if (key === 'backspace') {
      if (currentWordleGuess.length > 0) {
        currentWordleGuess = currentWordleGuess.slice(0, -1);
        updateWordleBoard();
      }
    } else if (/^[a-z]$/.test(key)) {
      if (currentWordleGuess.length < wordleWord.length) {
        currentWordleGuess += key;
        updateWordleBoard();
      }
    }
  }

  function updateWordleBoard() {
    const row = wordleBoard.children[wordleGuesses.length];
    for (let i = 0; i < wordleWord.length; i++) {
      const tile = row.children[i];
      tile.textContent = currentWordleGuess[i] || '';
    }
  }

  function submitWordleGuess() {
    if (currentWordleGuess.length !== wordleWord.length) {
      wordleMessage.textContent = '單字長度不夠！';
      setTimeout(() => wordleMessage.textContent = '', 1500);
      return;
    }

    const row = wordleBoard.children[wordleGuesses.length];
    const guessChars = currentWordleGuess.split('');
    const wordChars = wordleWord.split('');
    const keyColors = {};

    // First pass: correct letters
    for (let i = 0; i < wordleWord.length; i++) {
      if (guessChars[i] === wordChars[i]) {
        row.children[i].classList.add('correct');
        keyColors[guessChars[i]] = 'correct';
        wordChars[i] = null; // mark as used
        guessChars[i] = null;
      }
    }

    // Second pass: present & absent letters
    for (let i = 0; i < wordleWord.length; i++) {
      if (guessChars[i] !== null) {
        const charIndex = wordChars.indexOf(guessChars[i]);
        if (charIndex !== -1) {
          row.children[i].classList.add('present');
          if (keyColors[guessChars[i]] !== 'correct') {
            keyColors[guessChars[i]] = 'present';
          }
          wordChars[charIndex] = null; // mark as used
        } else {
          row.children[i].classList.add('absent');
          if (!keyColors[guessChars[i]]) {
            keyColors[guessChars[i]] = 'absent';
          }
        }
      }
    }

    // Update Keyboard Colors
    for (const char in keyColors) {
      const btn = document.querySelector(`.key[data-key="${char}"]`);
      if (btn) {
        if (keyColors[char] === 'correct') {
          btn.classList.remove('present', 'absent');
          btn.classList.add('correct');
        } else if (keyColors[char] === 'present' && !btn.classList.contains('correct')) {
          btn.classList.add('present');
        } else if (keyColors[char] === 'absent' && !btn.classList.contains('correct') && !btn.classList.contains('present')) {
          btn.classList.add('absent');
        }
      }
    }

    wordleGuesses.push(currentWordleGuess);

    if (currentWordleGuess === wordleWord) {
      wordleMessage.textContent = `恭喜答對！🎉 (${wordleWordObj.trans})`;
      wordleMessage.className = 'quiz-feedback feedback-correct';
      isWordleGameOver = true;
    } else if (wordleGuesses.length >= MAX_WORDLE_GUESSES) {
      wordleMessage.textContent = `遊戲結束！答案是 ${wordleWord.toUpperCase()} (${wordleWordObj.trans})`;
      wordleMessage.className = 'quiz-feedback feedback-wrong';
      isWordleGameOver = true;
    }

    currentWordleGuess = '';
  }

  // Keyboard Event Listeners for Wordle
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('screen-wordle').classList.contains('active')) {
      let key = e.key.toLowerCase();
      if (key === 'enter' || key === 'backspace' || /^[a-z]$/.test(key)) {
        handleWordleKey(key);
      }
    }
  });

  const keyboardBtns = document.querySelectorAll('.key');
  keyboardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      handleWordleKey(btn.dataset.key);
    });
  });

  // --- Core Utility Functions ---

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = (currentLang === 'korean') ? 'ko-KR' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

});
