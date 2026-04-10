import { getQuiz, getCategories } from './storage.js';
import { escHtml } from './utils.js';

export function renderPlayer(el, navigate, params = {}) {
  const quiz = getQuiz(params.quizId);

  if (!quiz) {
    el.innerHTML = `
      <div class="max-w-lg mx-auto px-4 pt-24 text-center">
        <div class="text-6xl mb-4">😕</div>
        <p class="text-slate-300 text-lg mb-6">Quiz not found.</p>
        <button id="btn-back"
          class="px-8 py-3 rounded-2xl bg-cyan-500 text-slate-900 font-bold">
          Back to Library
        </button>
      </div>
    `;
    el.querySelector('#btn-back').addEventListener('click', () => navigate('/library'));
    return;
  }

  const cats = getCategories();
  const cat  = cats.find(c => c.id === quiz.categoryId);

  // Shuffle questions; shuffle each question's answers
  const questions = shuffle([...quiz.questions]).map(q => ({
    ...q,
    answers: shuffle([...q.answers]),
  }));

  let idx      = 0;
  let score    = 0;
  let answered = false;

  function renderQuestion() {
    const q        = questions[idx];
    const progress = (idx / questions.length) * 100;
    const isLast   = idx === questions.length - 1;

    el.innerHTML = `
      <div class="max-w-lg mx-auto px-4 pb-10">

        <!-- Top bar -->
        <div class="flex items-center gap-3 pt-6 pb-3">
          <button id="btn-quit"
            class="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold truncate">${escHtml(quiz.title)}</p>
            ${cat ? `<p class="text-xs font-semibold" style="color:${cat.color}">${escHtml(cat.name)}</p>` : ''}
          </div>
          <span class="text-slate-400 text-sm font-semibold flex-shrink-0">
            ${idx + 1} / ${questions.length}
          </span>
        </div>

        <!-- Progress -->
        <div class="progress-bar mb-8">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>

        <!-- Question -->
        <div class="mb-8 fade-in">
          <p class="text-white text-2xl font-bold leading-snug">${escHtml(q.text)}</p>
        </div>

        <!-- Answers -->
        <div class="flex flex-col gap-3 mb-6" id="answers">
          ${q.answers.map(a => `
            <button data-id="${a.id}" data-correct="${a.correct}"
              class="answer-btn w-full py-4 px-6 rounded-2xl bg-slate-800 border-2 border-slate-700
                     text-white text-left font-semibold text-lg">
              ${escHtml(a.text)}
            </button>
          `).join('')}
        </div>

        <!-- Next (hidden until answered) -->
        <button id="btn-next"
          class="hidden w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400
                 text-slate-900 font-extrabold text-lg transition-colors glow-cyan">
          ${isLast ? 'See Results 🏆' : 'Next Question →'}
        </button>
      </div>
    `;

    el.querySelector('#btn-quit').addEventListener('click', () => {
      if (confirm('Quit this quiz?')) navigate('/library');
    });

    el.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const correct = btn.dataset.correct === 'true';
        if (correct) score++;

        // Color all buttons
        el.querySelectorAll('.answer-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === 'true') {
            b.classList.add('correct');
          } else if (b === btn) {
            b.classList.add('wrong');
          }
        });

        // Feedback message
        const fb = document.createElement('div');
        fb.className = 'text-center mb-4 fade-in';
        fb.innerHTML = correct
          ? '<p class="text-emerald-400 font-extrabold text-2xl">🎉 Correct!</p>'
          : '<p class="text-red-400 font-extrabold text-2xl">Nice try!</p>';
        el.querySelector('#answers').after(fb);

        el.querySelector('#btn-next').classList.remove('hidden');
      });
    });

    el.querySelector('#btn-next').addEventListener('click', () => {
      if (idx < questions.length - 1) {
        idx++;
        answered = false;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        renderScore();
      }
    });
  }

  function renderScore() {
    const pct  = Math.round((score / questions.length) * 100);
    const emoji = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '😊' : pct >= 40 ? '💪' : '📖';
    const msg   = pct === 100 ? 'Perfect score!'  : pct >= 80 ? 'Great job!'
                : pct >= 60  ? 'Well done!'       : pct >= 40 ? 'Keep trying!'
                : 'Keep practicing!';

    el.innerHTML = `
      <div class="max-w-lg mx-auto px-4 pb-10">
        <div class="pt-16 flex flex-col items-center text-center fade-in">

          <div class="text-7xl mb-7 bounce-in">${emoji}</div>

          <div class="score-circle mb-7 bounce-in">
            <span class="text-4xl font-extrabold text-cyan-400">${score}/${questions.length}</span>
            <span class="text-slate-400 text-sm mt-1">${pct}%</span>
          </div>

          <h2 class="text-3xl font-extrabold text-white mb-2">${msg}</h2>
          <p class="text-slate-400 mb-10 text-lg">${escHtml(quiz.title)}</p>

          <div class="flex flex-col w-full gap-3">
            <button id="btn-again"
              class="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-extrabold text-lg transition-colors">
              🔄 Play Again
            </button>
            <button id="btn-lib"
              class="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg transition-colors border border-slate-700">
              📚 Back to Library
            </button>
          </div>
        </div>
      </div>
    `;

    el.querySelector('#btn-again').addEventListener('click', () => renderPlayer(el, navigate, params));
    el.querySelector('#btn-lib').addEventListener('click',   () => navigate('/library'));
  }

  renderQuestion();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
