// App Logic for LingoMaster

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('error', function(e) {
    alert("Global Error: " + e.message + " at " + e.filename + ":" + e.lineno);
  });
  // DOM Elements
  const screens = {
    start: document.getElementById('screen-start'),
    learn: document.getElementById('screen-learn'),
    readyQuiz: document.getElementById('screen-ready-quiz'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    wordle: document.getElementById('screen-wordle')
  };

  // Start Screen Elements
  const countBtns = document.querySelectorAll('.btn-count');
  const diffBtns = document.querySelectorAll('.btn-diff');
  const btnStartLearning = document.getElementById('btn-start-learning');
  const totalWordCountEl = document.getElementById('total-word-count');
  const countEasyEl = document.getElementById('count-easy');
  const countMediumEl = document.getElementById('count-medium');
  const countHardEl = document.getElementById('count-hard');
  const btnStartWordle = document.getElementById('btn-start-wordle');

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
  const flashcard = document.querySelector('.flashcard');

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

  // Initialize Word Count
  totalWordCountEl.textContent = wordDatabase.length;
  if(countEasyEl) {
    countEasyEl.textContent = wordDatabase.filter(w => w.diff === 'easy').length;
    countMediumEl.textContent = wordDatabase.filter(w => w.diff === 'medium').length;
    countHardEl.textContent = wordDatabase.filter(w => w.diff === 'hard').length;
    const countProEl = document.getElementById('count-pro');
    if(countProEl) countProEl.textContent = wordDatabase.filter(w => w.diff === 'pro').length;
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
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
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
      screens[screenName].classList.add('active');
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
    // Basic regex to find the word in the sentence (case insensitive)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    // If the exact word form isn't found (e.g. past tense used), we just blank out a substring if possible
    if (regex.test(example)) {
       return example.replace(regex, '________');
    } else {
       // Fallback: finding the root word ignoring suffix. Simple replace.
       // This is a naive approach, but works for most basic examples.
       const rootRegex = new RegExp(word.substring(0, word.length - 2) + '[a-z]*', 'gi');
       if(rootRegex.test(example)) {
           return example.replace(rootRegex, '________');
       }
       return example.replace(word, '________'); // absolute fallback
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

  btnStartLearning.addEventListener('click', () => {
    // Filter words by difficulty
    const filteredWords = wordDatabase.filter(w => w.diff === selectedDifficulty);
    
    // Select words
    activeWords = getRandomWords(filteredWords, selectedCount);
    // Adjust total to actual available words if less than requested
    const actualCount = activeWords.length;
    
    if(actualCount === 0) {
      alert("此難度目前沒有單字！");
      return;
    }
    
    selectedCount = actualCount; // Update active count just in case
    currentIndex = 0;
    
    // Apply theme
    if (selectedDifficulty === 'pro') {
        flashcard.classList.add('pro-theme');
    } else {
        flashcard.classList.remove('pro-theme');
    }

    // Init Learn Screen
    learnTotal.textContent = selectedCount;
    renderFlashcard();
    showScreen('learn');
  });

  // --- Event Listeners: Learn Screen ---

  function renderFlashcard() {
    const wordObj = activeWords[currentIndex];
    
    // Trigger animation re-flow
    flashcard.style.animation = 'none';
    flashcard.offsetHeight; // trigger reflow
    flashcard.style.animation = 'cardIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    fcWord.textContent = wordObj.word;
    fcPos.textContent = wordObj.pos;
    
    if (wordObj.verbForms) {
      fcVerbForms.textContent = `三態：${wordObj.verbForms}`;
      fcVerbForms.classList.remove('hidden');
    } else {
      fcVerbForms.classList.add('hidden');
    }
    
    fcTrans.textContent = wordObj.trans;
    
    // Highlight the word in the example sentence
    const regex = new RegExp(`(${wordObj.word.substring(0, wordObj.word.length-2)}[a-z]*)`, 'gi');
    let highlightedExample = wordObj.example;
    if(regex.test(wordObj.example)) {
        highlightedExample = wordObj.example.replace(regex, '<span class="highlight">$1</span>');
    }
    fcExample.innerHTML = highlightedExample;
    fcExampleTrans.textContent = wordObj.exampleTrans;

    learnCurrentIndex.textContent = currentIndex + 1;
    
    // Update progress bar
    const progress = ((currentIndex) / selectedCount) * 100;
    learnProgressFill.style.width = `${progress}%`;

    // Update button text on last word
    if (currentIndex === selectedCount - 1) {
      btnNextWord.textContent = "完成學習 🎉";
    } else {
      btnNextWord.textContent = "下一個單字 ➔";
    }
  }

  btnSpeakWord.addEventListener('click', () => {
    speakText(activeWords[currentIndex].word);
  });

  btnSpeakExample.addEventListener('click', () => {
    speakText(activeWords[currentIndex].example);
  });

  btnNextWord.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex < selectedCount) {
      renderFlashcard();
    } else {
      learnProgressFill.style.width = `100%`;
      setTimeout(() => {
        showScreen('readyQuiz');
      }, 300);
    }
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
  }

  btnRestart.addEventListener('click', () => {
    showScreen('start');
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

});
