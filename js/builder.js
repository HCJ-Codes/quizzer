import { getCategories, getQuiz, upsertQuiz } from './storage.js';
import { uid, showToast, escHtml } from './utils.js';

let quiz      = null;
let navigate  = null;
let container = null;

export function renderBuilder(el, nav, params = {}) {
  container = el;
  navigate  = nav;

  const cats = getCategories();

  if (cats.length === 0) {
    el.innerHTML = `
      <div class="max-w-lg mx-auto px-4 pb-10">
        ${header('Create Quiz')}
        <div class="text-center py-16">
          <div class="text-6xl mb-5">🏷️</div>
          <p class="text-slate-300 mb-6 text-lg">You need a category before you can create a quiz.</p>
          <button id="go-cats"
            class="px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-colors">
            Go to Categories
          </button>
        </div>
      </div>
    `;
    el.querySelector('#btn-back').addEventListener('click', () => navigate('/'));
    el.querySelector('#go-cats').addEventListener('click',  () => navigate('/categories'));
    return;
  }

  if (params.quizId) {
    const existing = getQuiz(params.quizId);
    quiz = existing ? JSON.parse(JSON.stringify(existing)) : newQuiz();
  } else {
    quiz = newQuiz();
  }

  renderForm();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function newQuiz() {
  return { id: null, categoryId: '', title: '', questions: [newQuestion()] };
}

function newQuestion() {
  return {
    id: uid(),
    text: '',
    answers: [
      { id: uid(), text: '', correct: true  },
      { id: uid(), text: '', correct: false },
    ],
  };
}

function header(title) {
  return `
    <div class="flex items-center gap-3 pt-8 pb-6">
      <button id="btn-back"
        class="p-2.5 rounded-xl hover:bg-slate-800 text-cyan-400 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-white">${title}</h1>
    </div>
  `;
}

// ── Main render ─────────────────────────────────────────────────────────────

function renderForm() {
  const cats   = getCategories();
  const isEdit = !!quiz.id;

  container.innerHTML = `
    <div class="max-w-lg mx-auto px-4 pb-10">
      ${header(isEdit ? 'Edit Quiz' : 'Create Quiz')}

      <!-- Category + Title -->
      <div class="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700">
        <label class="block text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">Category</label>
        <select id="sel-cat"
          class="w-full bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600 mb-4 appearance-none">
          <option value="">— Select a category —</option>
          ${cats.map(c => `
            <option value="${c.id}" ${quiz.categoryId === c.id ? 'selected' : ''}>
              ${escHtml(c.name)}
            </option>
          `).join('')}
        </select>

        <label class="block text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">Quiz Title</label>
        <input id="inp-title" type="text" placeholder="e.g. Animal Kingdom" maxlength="80"
          value="${escHtml(quiz.title)}"
          class="w-full bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 border border-slate-600" />
      </div>

      <!-- Questions -->
      <div id="questions-list">
        ${quiz.questions.map((q, i) => questionHTML(q, i)).join('')}
      </div>

      <!-- Add Question -->
      <button id="btn-add-q"
        class="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-600
               hover:border-cyan-500 text-slate-400 hover:text-cyan-400
               font-semibold transition-all mt-1 mb-6">
        + Add Question
      </button>

      <!-- Save -->
      <button id="btn-save"
        class="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-900
               font-extrabold text-lg transition-colors glow-cyan">
        💾 Save Quiz
      </button>
    </div>
  `;

  attachEvents();
}

// ── Templates ────────────────────────────────────────────────────────────────

function questionHTML(q, qi) {
  return `
    <div class="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700" data-qid="${q.id}">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-cyan-400 font-extrabold text-sm">Q${qi + 1}</span>
        <div class="flex-1 h-px bg-slate-700"></div>
        ${quiz.questions.length > 1 ? `
          <button data-del-q="${q.id}"
            class="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                   m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        ` : ''}
      </div>

      <textarea data-q-text="${q.id}" rows="2" placeholder="Type your question here…" maxlength="300"
        class="w-full bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3
               border border-slate-600 mb-3">${escHtml(q.text)}</textarea>

      <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
        Answers — tap ✓ to mark correct
      </p>

      <div class="flex flex-col gap-2" data-answers="${q.id}">
        ${q.answers.map(a => answerHTML(a, q.id)).join('')}
      </div>

      <button data-add-ans="${q.id}"
        class="mt-2.5 w-full py-2 text-sm text-slate-500 hover:text-cyan-400
               rounded-xl hover:bg-slate-700 transition-colors font-semibold">
        + Add answer option
      </button>
    </div>
  `;
}

function answerHTML(a, qid) {
  return `
    <div class="flex items-center gap-2 rounded-xl p-1 ${a.correct ? 'bg-emerald-900/25' : ''}"
         data-aid="${a.id}">
      <button data-toggle="${a.id}" data-qid="${qid}"
        class="correct-toggle ${a.correct ? 'active' : ''}"
        title="${a.correct ? 'Correct answer' : 'Tap to mark correct'}">
        ${a.correct ? '✓' : ''}
      </button>
      <input type="text" data-ans-text="${a.id}" data-qid="${qid}"
        placeholder="Answer option…" maxlength="150"
        value="${escHtml(a.text)}"
        class="flex-1 bg-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2
               border ${a.correct ? 'border-emerald-600' : 'border-slate-600'} text-sm" />
      <button data-del-ans="${a.id}" data-qid="${qid}"
        class="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0 text-lg leading-none">
        ×
      </button>
    </div>
  `;
}

// ── Events ───────────────────────────────────────────────────────────────────

function attachEvents() {
  // Back
  container.querySelector('#btn-back').addEventListener('click', () => {
    if (confirm("Your quiz isn't saved yet. Leave anyway?")) navigate('/library');
  });

  // Category
  container.querySelector('#sel-cat').addEventListener('change', e => {
    quiz.categoryId = e.target.value;
  });

  // Title
  container.querySelector('#inp-title').addEventListener('input', e => {
    quiz.title = e.target.value;
  });

  // Delegate all question-list interactions
  const ql = container.querySelector('#questions-list');

  ql.addEventListener('input', e => {
    if (e.target.dataset.qText) {
      const q = quiz.questions.find(q => q.id === e.target.dataset.qText);
      if (q) q.text = e.target.value;
    }
    if (e.target.dataset.ansText) {
      const q = quiz.questions.find(q => q.id === e.target.dataset.qid);
      const a = q?.answers.find(a => a.id === e.target.dataset.ansText);
      if (a) a.text = e.target.value;
    }
  });

  ql.addEventListener('click', e => {
    // Toggle correct
    const toggleBtn = e.target.closest('[data-toggle]');
    if (toggleBtn) {
      const q = quiz.questions.find(q => q.id === toggleBtn.dataset.qid);
      const a = q?.answers.find(a => a.id === toggleBtn.dataset.toggle);
      if (a) {
        a.correct = !a.correct;
        toggleBtn.classList.toggle('active', a.correct);
        toggleBtn.textContent = a.correct ? '✓' : '';
        const row = toggleBtn.closest('[data-aid]');
        if (row) {
          row.className = `flex items-center gap-2 rounded-xl p-1 ${a.correct ? 'bg-emerald-900/25' : ''}`;
          const inp = row.querySelector('input');
          if (inp) inp.className = inp.className
            .replace('border-emerald-600', 'border-slate-600')
            .replace('border-slate-600', a.correct ? 'border-emerald-600' : 'border-slate-600');
        }
      }
      return;
    }

    // Delete answer
    const delAns = e.target.closest('[data-del-ans]');
    if (delAns) {
      const q = quiz.questions.find(q => q.id === delAns.dataset.qid);
      if (!q) return;
      if (q.answers.length <= 2) { showToast('Need at least 2 answer options.', true); return; }
      q.answers = q.answers.filter(a => a.id !== delAns.dataset.delAns);
      delAns.closest('[data-aid]').remove();
      return;
    }

    // Add answer
    const addAns = e.target.closest('[data-add-ans]');
    if (addAns) {
      const q = quiz.questions.find(q => q.id === addAns.dataset.addAns);
      if (!q) return;
      if (q.answers.length >= 8) { showToast('Maximum 8 answer options.', true); return; }
      const a = { id: uid(), text: '', correct: false };
      q.answers.push(a);
      const answersDiv = container.querySelector(`[data-answers="${q.id}"]`);
      if (answersDiv) {
        const tmp = document.createElement('div');
        tmp.innerHTML = answerHTML(a, q.id);
        answersDiv.appendChild(tmp.firstElementChild);
        answersDiv.lastElementChild.querySelector('input')?.focus();
      }
      return;
    }

    // Delete question
    const delQ = e.target.closest('[data-del-q]');
    if (delQ) {
      quiz.questions = quiz.questions.filter(q => q.id !== delQ.dataset.delQ);
      rerenderAll();
      return;
    }
  });

  // Add question
  container.querySelector('#btn-add-q').addEventListener('click', () => {
    if (quiz.questions.length >= 50) { showToast('Maximum 50 questions per quiz.', true); return; }
    const q  = newQuestion();
    quiz.questions.push(q);
    const qi = quiz.questions.length - 1;
    const tmp = document.createElement('div');
    tmp.innerHTML = questionHTML(q, qi);
    ql.appendChild(tmp.firstElementChild);
    ql.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    ql.lastElementChild.querySelector('textarea')?.focus();
  });

  // Save
  container.querySelector('#btn-save').addEventListener('click', save);
}

function rerenderAll() {
  const ql = container.querySelector('#questions-list');
  if (ql) ql.innerHTML = quiz.questions.map((q, i) => questionHTML(q, i)).join('');
}

// ── Save & validate ──────────────────────────────────────────────────────────

function save() {
  // Sync DOM → state (safety net alongside real-time updates)
  quiz.categoryId = container.querySelector('#sel-cat').value;
  quiz.title      = container.querySelector('#inp-title').value.trim();

  quiz.questions.forEach(q => {
    const ta = container.querySelector(`[data-q-text="${q.id}"]`);
    if (ta) q.text = ta.value.trim();
    q.answers.forEach(a => {
      const inp = container.querySelector(`[data-ans-text="${a.id}"]`);
      if (inp) a.text = inp.value.trim();
    });
  });

  if (!quiz.categoryId)          { showToast('Please select a category.', true); return; }
  if (!quiz.title)               { showToast('Please enter a quiz title.', true); return; }

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    if (!q.text)                          { showToast(`Q${i+1}: Enter the question text.`, true); return; }
    if (!q.answers.some(a => a.correct))  { showToast(`Q${i+1}: Mark at least one correct answer.`, true); return; }
    if (!q.answers.some(a => !a.correct)) { showToast(`Q${i+1}: Add at least one wrong answer.`, true); return; }
    for (const a of q.answers) {
      if (!a.text) { showToast(`Q${i+1}: Fill in all answer options.`, true); return; }
    }
  }

  upsertQuiz(quiz);
  showToast('Quiz saved! 🎉');
  navigate('/library');
}
