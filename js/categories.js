import { getCategories, upsertCategory, deleteCategory } from './storage.js';
import { showToast, escHtml } from './utils.js';

const PALETTE = [
  '#ef4444','#f97316','#f59e0b','#84cc16',
  '#22c55e','#14b8a6','#06b6d4','#3b82f6',
  '#8b5cf6','#ec4899','#f43f5e','#a78bfa',
];

export function renderCategories(el, navigate) {
  let editing = null; // null = closed, {} = new, {id,...} = edit

  function render() {
    const cats = getCategories();

    el.innerHTML = `
      <div class="max-w-lg mx-auto px-4 pb-10">

        <!-- Header -->
        <div class="flex items-center gap-3 pt-8 pb-6">
          <button id="btn-back"
            class="p-2.5 rounded-xl hover:bg-slate-800 text-cyan-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-white">Categories</h1>
          <button id="btn-add"
            class="ml-auto px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-sm transition-colors">
            + Add
          </button>
        </div>

        <!-- Add / Edit form -->
        <div id="cat-form" class="${editing !== null ? '' : 'hidden'} mb-6 p-5 rounded-2xl bg-slate-800 border border-cyan-500/50">
          <h2 class="font-bold text-cyan-300 mb-4 text-sm uppercase tracking-wider">
            ${editing?.id ? 'Edit Category' : 'New Category'}
          </h2>
          <input id="cat-name" type="text" placeholder="Category name…" maxlength="40"
            value="${escHtml(editing?.name ?? '')}"
            class="w-full bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3
                   border border-slate-600 mb-4" />
          <p class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Pick a color</p>
          <div class="flex flex-wrap gap-2 mb-5" id="color-picker">
            ${PALETTE.map(c => `
              <button data-color="${c}"
                class="color-opt w-9 h-9 rounded-full border-2 transition-all"
                style="background:${c}; border-color:${(editing?.color ?? PALETTE[6]) === c ? 'white' : 'transparent'};
                       transform:${(editing?.color ?? PALETTE[6]) === c ? 'scale(1.18)' : 'scale(1)'}">
              </button>
            `).join('')}
          </div>
          <div class="flex gap-2">
            <button id="cat-save"
              class="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-colors">
              Save
            </button>
            <button id="cat-cancel"
              class="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>

        <!-- List -->
        <div class="flex flex-col gap-3">
          ${cats.length === 0 ? `
            <div class="text-center py-16 text-slate-500">
              <div class="text-5xl mb-3">🏷️</div>
              <p>No categories yet. Tap <strong>+ Add</strong> to create one!</p>
            </div>
          ` : cats.map(c => `
            <div class="flex items-center gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <span class="cat-dot" style="background:${c.color}"></span>
              <span class="flex-1 font-semibold text-white">${escHtml(c.name)}</span>
              <button data-edit="${c.id}"
                class="p-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-slate-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                       m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button data-del="${c.id}"
                class="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                       m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    let selectedColor = editing?.color ?? PALETTE[6];

    el.querySelector('#btn-back').addEventListener('click', () => navigate('/'));

    el.querySelector('#btn-add').addEventListener('click', () => {
      editing = { name: '', color: PALETTE[6] };
      render();
      setTimeout(() => el.querySelector('#cat-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    el.querySelectorAll('.color-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedColor = btn.dataset.color;
        el.querySelectorAll('.color-opt').forEach(b => {
          const active = b.dataset.color === selectedColor;
          b.style.borderColor = active ? 'white' : 'transparent';
          b.style.transform   = active ? 'scale(1.18)' : 'scale(1)';
        });
      });
    });

    el.querySelector('#cat-cancel')?.addEventListener('click', () => {
      editing = null;
      render();
    });

    el.querySelector('#cat-save')?.addEventListener('click', () => {
      const name = el.querySelector('#cat-name').value.trim();
      if (!name) { showToast('Please enter a category name.', true); return; }
      upsertCategory({ id: editing?.id ?? null, name, color: selectedColor });
      editing = null;
      showToast('Category saved!');
      render();
    });

    el.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = getCategories().find(c => c.id === btn.dataset.edit);
        if (cat) {
          editing = { ...cat };
          render();
          setTimeout(() => el.querySelector('#cat-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      });
    });

    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = getCategories().find(c => c.id === btn.dataset.del);
        if (!cat) return;
        if (confirm(`Delete "${cat.name}"? Any quizzes in this category will also be deleted.`)) {
          deleteCategory(btn.dataset.del);
          showToast('Category deleted.');
          render();
        }
      });
    });
  }

  render();
}
