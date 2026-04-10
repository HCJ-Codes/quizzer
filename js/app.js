import { renderHome }       from './home.js';
import { renderCategories } from './categories.js';
import { renderBuilder }    from './builder.js';
import { renderLibrary }    from './library.js';
import { renderPlayer }     from './player.js';

const app = document.getElementById('app');
let routeParams = {};

export function navigate(hash, params = {}) {
  routeParams = params;
  window.location.hash = hash;
}

function route() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  app.innerHTML = '';
  app.className = 'min-h-screen fade-in';

  const views = {
    '/':           () => renderHome(app, navigate),
    '/categories': () => renderCategories(app, navigate),
    '/builder':    () => renderBuilder(app, navigate, routeParams),
    '/library':    () => renderLibrary(app, navigate),
    '/player':     () => renderPlayer(app, navigate, routeParams),
  };

  (views[hash] ?? views['/'])();
}

window.addEventListener('hashchange', route);
route();
