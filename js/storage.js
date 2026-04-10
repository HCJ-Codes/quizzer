import { uid } from './utils.js';

const KEY = 'quizzer_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { categories: [], quizzes: [] };
  } catch {
    return { categories: [], quizzes: [] };
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// ── Categories ──────────────────────────────────────────────────────────────

export function getCategories() {
  return load().categories;
}

export function upsertCategory(cat) {
  const data = load();
  const idx = data.categories.findIndex(c => c.id === cat.id);
  if (idx >= 0) {
    data.categories[idx] = cat;
  } else {
    data.categories.push({ ...cat, id: uid() });
  }
  save(data);
}

export function deleteCategory(id) {
  const data = load();
  data.categories = data.categories.filter(c => c.id !== id);
  data.quizzes    = data.quizzes.filter(q => q.categoryId !== id);
  save(data);
}

// ── Quizzes ─────────────────────────────────────────────────────────────────

export function getQuizzes() {
  return load().quizzes;
}

export function getQuiz(id) {
  return load().quizzes.find(q => q.id === id) || null;
}

export function upsertQuiz(quiz) {
  const data = load();
  const idx = data.quizzes.findIndex(q => q.id === quiz.id);
  if (idx >= 0) {
    data.quizzes[idx] = { ...quiz, updatedAt: Date.now() };
  } else {
    data.quizzes.push({ ...quiz, id: uid(), createdAt: Date.now() });
  }
  save(data);
}

export function deleteQuiz(id) {
  const data = load();
  data.quizzes = data.quizzes.filter(q => q.id !== id);
  save(data);
}

// ── Export / Import ──────────────────────────────────────────────────────────

export function exportBackup() {
  const data = load();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `quizzer-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.categories) || !Array.isArray(data.quizzes)) {
          throw new Error('Invalid backup format');
        }
        save(data);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}
