import { exportBackup, importBackup, getQuizzes, getCategories } from './storage.js';
import { showToast } from './utils.js';

export function renderHome(el, navigate) {
  function render() {
    const quizzes = getQuizzes();
    const cats    = getCategories();

    el.innerHTML = `
      <div class="max-w-lg mx-auto px-4 pb-10">

        <!-- Header -->
        <div class="flex items-center justify-between pt-10 pb-6">
          <div>
            <h1 class="text-5xl font-extrabold gradient-text tracking-tight">QuizQuiz</h1>
            <p class="text-slate-400 text-sm mt-1.5">
              ${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} &middot;
              ${cats.length} categor${cats.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div class="flex gap-2">
            <button id="btn-export" title="Download backup"
              class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </button>
            <label title="Import backup"
              class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12"/>
              </svg>
              <input type="file" id="import-file" accept=".json" class="hidden" />
            </label>
          </div>
        </div>

        <!-- Nav cards -->
        <div class="flex flex-col gap-4">
          <button data-nav="/categories"
            class="nav-card group w-full text-left p-6 rounded-2xl bg-slate-800 border border-slate-700
                   hover:border-cyan-500 card-hover glow-cyan-sm transition-all">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center text-3xl
                          group-hover:scale-110 transition-transform">🏷️</div>
              <div>
                <div class="text-xl font-bold text-white">Categories</div>
                <div class="text-slate-400 text-sm mt-0.5">Manage quiz categories</div>
              </div>
              <div class="ml-auto text-2xl text-slate-600 group-hover:text-cyan-400 transition-colors">›</div>
            </div>
          </button>

          <button data-nav="/builder"
            class="nav-card group w-full text-left p-6 rounded-2xl bg-slate-800 border border-slate-700
                   hover:border-violet-500 card-hover transition-all">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center text-3xl
                          group-hover:scale-110 transition-transform">✏️</div>
              <div>
                <div class="text-xl font-bold text-white">Create Quiz</div>
                <div class="text-slate-400 text-sm mt-0.5">Build a brand-new quiz</div>
              </div>
              <div class="ml-auto text-2xl text-slate-600 group-hover:text-violet-400 transition-colors">›</div>
            </div>
          </button>

          <button data-nav="/library"
            class="nav-card group w-full text-left p-6 rounded-2xl bg-slate-800 border border-slate-700
                   hover:border-amber-500 card-hover transition-all">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center text-3xl
                          group-hover:scale-110 transition-transform">📚</div>
              <div>
                <div class="text-xl font-bold text-white">Quiz Library</div>
                <div class="text-slate-400 text-sm mt-0.5">Find and play your quizzes</div>
              </div>
              <div class="ml-auto text-2xl text-slate-600 group-hover:text-amber-400 transition-colors">›</div>
            </div>
          </button>
        </div>

        ${cats.length === 0 ? `
          <div class="mt-7 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 text-center">
            <p class="text-cyan-300 text-sm leading-relaxed">
              👋 Welcome to QuizQuiz! Start by tapping <strong>Categories</strong> to create
              your first category, then build a quiz.
            </p>
          </div>
        ` : ''}

        <p class="text-center text-slate-700 text-xs mt-8">
          Tip: tap the ↓ button to back up your quizzes to a file!
        </p>
      </div>
    `;

    el.querySelectorAll('.nav-card').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });

    el.querySelector('#btn-export').addEventListener('click', () => {
      exportBackup();
      showToast('Backup downloaded!');
    });

    el.querySelector('#import-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await importBackup(file);
        showToast('Import successful!');
        render();
      } catch {
        showToast('Import failed — check the file.', true);
      }
      e.target.value = '';
    });
  }

  render();
}
