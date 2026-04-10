import { getQuizzes, getCategories, deleteQuiz } from './storage.js';
import { showToast, escHtml } from './utils.js';

export function renderLibrary(el, navigate) {
  let search    = '';
  let filterCat = '';

  function render() {
    const quizzes = getQuizzes();
    const cats    = getCategories();
    const catMap  = Object.fromEntries(cats.map(c => [c.id, c]));

    const filtered = quizzes.filter(q => {
      const catName = catMap[q.categoryId]?.name ?? '';
      const matchSearch = !search ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        catName.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCat || q.categoryId === filterCat;
      return matchSearch && matchCat;
    });

    el.innerHTML = `
      <div class="max-w-lg mx-auto px-4 pb-10">

        <!-- Header -->
        <div class="flex items-center gap-3 pt-8 pb-4">
          <button id="btn-back"
            class="p-2.5 rounded-xl hover:bg-slate-800 text-cyan-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-white">Quiz Library</h1>
          <button id="btn-new"
            class="ml-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors">
            + New Quiz
          </button>
        </div>

        <!-- Search -->
        <div class="relative mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input id="inp-search" type="text" placeholder="Search quizzes…" value="${escHtml(search)}"
            class="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 border border-slate-700" />
        </div>

        <!-- Category chips -->
        <div class="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          <button data-cat=""
            class="cat-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors
                   ${!filterCat ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}">
            All
          </button>
          ${cats.map(c => `
            <button data-cat="${c.id}"
              class="cat-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors
                     ${filterCat === c.id
                        ? 'text-slate-900'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}"
              style="${filterCat === c.id ? `background:${c.color}` : ''}">
              ${escHtml(c.name)}
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        ${quizzes.length === 0 ? `
          <div class="text-center py-20 text-slate-500">
            <div class="text-6xl mb-4">📚</div>
            <p class="text-lg mb-6">No quizzes yet!</p>
            <button id="btn-first"
              class="px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors">
              Create your first quiz
            </button>
          </div>
        ` : filtered.length === 0 ? `
          <div class="text-center py-16 text-slate-500">
            <div class="text-5xl mb-3">🔍</div>
            <p>No quizzes match your search.</p>
          </div>
        ` : `
          <div class="flex flex-col gap-3">
            ${filtered.map(q => {
              const cat = catMap[q.categoryId];
              return `
                <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-slate-600 transition-colors">
                  <div class="mb-3">
                    ${cat ? `
                      <span class="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2"
                        style="background:${cat.color}22; color:${cat.color}">
                        ${escHtml(cat.name)}
                      </span>
                    ` : ''}
                    <h3 class="font-bold text-white text-xl leading-snug">${escHtml(q.title)}</h3>
                    <p class="text-slate-400 text-sm mt-1">
                      ${q.questions.length} question${q.questions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button data-play="${q.id}"
                      class="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-colors">
                      ▶ Play
                    </button>
                    <button data-edit="${q.id}"
                      class="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors text-lg">
                      ✏️
                    </button>
                    <button data-del="${q.id}"
                      class="px-4 py-3 rounded-xl bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition-colors text-lg">
                      🗑️
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    el.querySelector('#btn-back').addEventListener('click', () => navigate('/'));
    el.querySelector('#btn-new').addEventListener('click',  () => navigate('/builder'));
    el.querySelector('#btn-first')?.addEventListener('click', () => navigate('/builder'));

    el.querySelector('#inp-search').addEventListener('input', e => {
      search = e.target.value;
      render();
    });

    el.querySelectorAll('.cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        filterCat = btn.dataset.cat;
        render();
      });
    });

    el.querySelectorAll('[data-play]').forEach(btn => {
      btn.addEventListener('click', () => navigate('/player', { quizId: btn.dataset.play }));
    });

    el.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => navigate('/builder', { quizId: btn.dataset.edit }));
    });

    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = getQuizzes().find(q => q.id === btn.dataset.del);
        if (!q) return;
        if (confirm(`Delete "${q.title}"? This can't be undone.`)) {
          deleteQuiz(btn.dataset.del);
          showToast('Quiz deleted.');
          render();
        }
      });
    });
  }

  render();
}
