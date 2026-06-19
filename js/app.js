// Rope Drop — App

const BADGE_CONFIG = {
  thrill:    { label: 'Thrill',     cls: 'badge-thrill' },
  family:    { label: 'Family',     cls: 'badge-family' },
  show:      { label: 'Show',       cls: 'badge-show'   },
  food:      { label: 'Food',       cls: 'badge-food'   },
  character: { label: 'Meet',       cls: 'badge-character' },
};

// View state: 'resorts' (the resort-picker screen) or 'park' (a park's checklist)
let currentView = 'resorts';
let activeResortId = Storage.getActiveResort();
let activeParkId = Storage.getActivePark();

// If we have a remembered park, jump straight back into it; otherwise
// land on the resort picker first.
if (activeResortId && PARKS.some(p => p.id === activeParkId && p.resortId === activeResortId)) {
  currentView = 'park';
}

// ── Render resort picker screen ─────────────────────────────────────────────
function renderResortScreen() {
  const main = document.getElementById('main-content');
  const nav = document.getElementById('park-nav');
  nav.innerHTML = '';
  nav.style.display = 'none';

  const html = `
    <div class="resort-screen">
      <div class="resort-screen-header">
        <h1 class="resort-screen-title">Where to?</h1>
        <p class="resort-screen-subtitle">Pick a resort to see its parks</p>
      </div>
      <div class="resort-cards">
        ${RESORTS.map(resort => {
          const parksHere = PARKS.filter(p => p.resortId === resort.id);
          const tally = Storage.getResortTally(resort.id);
          return `
            <button class="resort-card" data-resort="${resort.id}">
              <span class="resort-card-emoji">${resort.emoji}</span>
              <span class="resort-card-name">${resort.name}</span>
              <span class="resort-card-location">${resort.location}</span>
              <span class="resort-card-parks">${parksHere.map(p => p.emoji).join(' ')} ${parksHere.length} parks</span>
              ${tally > 0 ? `<span class="resort-card-tally">${tally} activities logged</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  main.innerHTML = html;

  main.querySelectorAll('.resort-card').forEach(btn => {
    btn.addEventListener('click', () => switchResort(btn.dataset.resort));
  });

  document.getElementById('progress-summary').innerHTML = '';
  document.getElementById('reset-btn').style.display = 'none';
}

function switchResort(resortId) {
  activeResortId = resortId;
  Storage.setActiveResort(resortId);
  // Jump to the first park belonging to this resort
  const firstPark = PARKS.find(p => p.resortId === resortId);
  if (firstPark) {
    activeParkId = firstPark.id;
    Storage.setActivePark(firstPark.id);
  }
  currentView = 'park';
  document.getElementById('reset-btn').style.display = '';
  renderNav();
  renderPark();
  window.scrollTo(0, 0);
}

function backToResorts() {
  currentView = 'resorts';
  renderResortScreen();
  window.scrollTo(0, 0);
}

// ── Render park nav ──────────────────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('park-nav');
  nav.style.display = '';

  const parksHere = PARKS.filter(p => p.resortId === activeResortId);

  const backBtn = `
    <button class="park-tab back-tab" data-action="back-to-resorts">
      <span class="tab-emoji">←</span>
      <span class="tab-name">Resorts</span>
    </button>
  `;

  const parkTabs = parksHere.map(park => {
    const { total: tallyTotal } = Storage.getActivityTally(park.id);
    const isActive = park.id === activeParkId;

    return `
      <button
        class="park-tab${isActive ? ' active' : ''}"
        role="tab"
        aria-selected="${isActive}"
        aria-controls="main-content"
        data-park="${park.id}"
        style="${isActive ? `--tab-accent: ${park.accentColor}; --tab-accent-light: ${park.accentLight};` : ''}"
      >
        <span class="tab-emoji">${park.emoji}</span>
        <span class="tab-name">${park.shortName}</span>
        ${tallyTotal > 0 ? `<span class="tab-pill" style="${isActive ? `background:${park.accentColor};color:#fff;` : ''}">${tallyTotal}</span>` : ''}
      </button>
    `;
  }).join('');

  nav.innerHTML = backBtn + parkTabs;

  nav.querySelector('[data-action="back-to-resorts"]').addEventListener('click', backToResorts);
  nav.querySelectorAll('.park-tab[data-park]').forEach(btn => {
    btn.addEventListener('click', () => switchPark(btn.dataset.park));
  });
}

// ── Render a single item row (used by both Must-Dos and regular sections) ──
function renderItemRow(item, checks, opts = {}) {
  const isDone = !!checks[item.id];
  const badge = BADGE_CONFIG[item.badge] || BADGE_CONFIG.family;
  const count = Storage.getCount(item.id);
  const hasSongPicker = !!SONG_PICKERS[item.id];
  const songLog = Storage.getSongLog(item.id);
  const isStarred = Storage.isStarred(item.id);
  const inMustDos = !!opts.inMustDos;

  return `
    <div class="item-row${isDone ? ' item-done' : ''}" data-id="${item.id}">
      ${inMustDos ? `
        <button
          class="remove-must-btn"
          data-id="${item.id}"
          aria-label="Remove from must-dos"
          title="Remove from must-dos"
        >✕</button>
      ` : `
        <button
          class="star-btn${isStarred ? ' starred' : ''}"
          data-id="${item.id}"
          aria-pressed="${isStarred}"
          aria-label="${isStarred ? 'Remove from your must-dos' : 'Add to your must-dos'}"
          title="${isStarred ? 'Your must-do' : 'Mark as your must-do'}"
        >${isStarred ? '★' : '☆'}</button>
      `}
      <button
        class="item"
        data-id="${item.id}"
        aria-pressed="${isDone}"
        aria-label="${item.name}${isDone ? ' — completed' : ''}"
      >
        <span class="item-check" aria-hidden="true">
          ${isDone ? `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </span>
        <span class="item-body">
          <span class="item-name">${item.name}</span>
          <span class="item-meta">${item.meta}${songLog.length ? ` · <span class="song-tag-inline">${songLog[songLog.length - 1]}</span>` : ''}</span>
        </span>
        <span class="badge ${badge.cls}">${badge.label}</span>
      </button>
      <div class="item-extras">
        ${isDone ? `
          <div class="count-stepper">
            <button class="count-minus" data-id="${item.id}" title="Remove a ride" ${count === 0 ? 'disabled' : ''}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>
            </button>
            <span class="count-display">${count + 1}×</span>
            <button class="count-plus" data-id="${item.id}" title="Add another ride">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        ` : ''}
        ${isDone && hasSongPicker ? `
          <button class="song-btn" data-id="${item.id}" title="Log which song you got">
            🎵${songLog.length > 1 ? ` <span class="count-num">${songLog.length}</span>` : ''}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ── Render main content ──────────────────────────────────────────────────────
function renderPark() {
  const park = PARKS.find(p => p.id === activeParkId);
  const checks = Storage.getChecked();
  const notes = Storage.getNotes();
  const { done, total, pct } = Storage.getParkStats(park.id);
  const tally = Storage.getActivityTally(park.id);
  const main = document.getElementById('main-content');

  const TALLY_LABELS = {
    rides: { label: 'Rides', emoji: '🎢' },
    show: { label: 'Shows', emoji: '🎭' },
    food: { label: 'Food & drink', emoji: '🍽️' },
    character: { label: 'Character meets', emoji: '👋' },
  };

  const tallyChips = Object.entries(tally.byCategory)
    .filter(([, count]) => count > 0)
    .map(([cat, count]) => `
      <div class="tally-chip">
        <span class="tally-emoji">${TALLY_LABELS[cat].emoji}</span>
        <span class="tally-num">${count}</span>
        <span class="tally-label">${TALLY_LABELS[cat].label}</span>
      </div>
    `).join('');

  // Hero
  let html = `
    <div class="park-hero" style="--accent: ${park.accentColor}; --accent-light: ${park.accentLight};">
      <div class="park-hero-inner">
        <div class="park-meta">${park.resort}</div>
        <h1 class="park-name">${park.emoji} ${park.name}</h1>
        <div class="park-progress-wrap">
          <div class="park-progress-bar">
            <div class="park-progress-fill" style="width: ${pct}%; background: ${park.accentColor};"></div>
          </div>
          <span class="park-progress-label" style="color: ${park.accentColor};">${done} of ${total} done</span>
        </div>
        ${tally.total > 0 ? `
          <div class="tally-section">
            <div class="tally-total">
              <span class="tally-total-num" style="color: ${park.accentColor};">${tally.total}</span>
              <span class="tally-total-label">total activities logged</span>
            </div>
            <div class="tally-chips">${tallyChips}</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Must-Dos section — gathers every starred item across all sections in
  // this park, in starred order. Items here are removed from their normal
  // category below so nothing is duplicated.
  const allStarredItems = [];
  park.sections.forEach(section => {
    section.items.forEach(item => {
      if (Storage.isStarred(item.id)) allStarredItems.push(item);
    });
  });

  if (allStarredItems.length > 0) {
    html += `<div class="section must-dos-section"><h2 class="section-heading must-dos-heading">★ Your must-dos</h2>`;
    allStarredItems.forEach(item => {
      html += renderItemRow(item, checks, { inMustDos: true });
    });
    html += `</div>`;
  }

  // Sections — starred items are excluded here since they live in Must-Dos above
  park.sections.forEach(section => {
    const remainingItems = section.items.filter(item => !Storage.isStarred(item.id));
    if (remainingItems.length === 0) return;

    html += `<div class="section"><h2 class="section-heading">${section.name}</h2>`;
    remainingItems.forEach(item => {
      html += renderItemRow(item, checks);
    });
    html += `</div>`;
  });

  // Notes
  const noteVal = notes[activeParkId] || '';
  html += `
    <div class="section notes-section">
      <h2 class="section-heading">Your notes</h2>
      <textarea
        class="notes-input"
        placeholder="Rope drop plan, Lightning Lane strategy, meal reservations, kids' requests…"
        aria-label="Your notes for ${park.name}"
      >${noteVal}</textarea>
    </div>
    <div class="bottom-spacer"></div>
  `;

  main.innerHTML = html;

  // Bind star buttons
  main.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toggleStar(btn.dataset.id);
    });
  });

  // Bind must-do remove buttons
  main.querySelectorAll('.remove-must-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toggleStar(btn.dataset.id);
    });
  });

  // Bind item taps (the main check toggle)
  main.querySelectorAll('.item').forEach(btn => {
    btn.addEventListener('click', () => toggleItem(btn.dataset.id));
  });

  // Bind count stepper buttons
  main.querySelectorAll('.count-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      bumpCount(btn.dataset.id, 1);
    });
  });
  main.querySelectorAll('.count-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      bumpCount(btn.dataset.id, -1);
    });
  });

  // Bind song buttons
  main.querySelectorAll('.song-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSongPicker(btn.dataset.id);
    });
  });

  // Bind notes
  main.querySelector('.notes-input').addEventListener('input', e => {
    Storage.setNote(activeParkId, e.target.value);
  });

  renderBottomBar(park, done, total, pct);
}

// ── Bottom bar ───────────────────────────────────────────────────────────────
function renderBottomBar(park, done, total, pct) {
  const summary = document.getElementById('progress-summary');
  summary.innerHTML = `
    <span class="progress-text">
      <strong>${done}</strong> / ${total} completed
      ${pct === 100 ? ' 🎉' : ''}
    </span>
  `;

  const resetBtn = document.getElementById('reset-btn');
  resetBtn.style.display = '';
  resetBtn.onclick = () => resetPark(park);
}

// ── Actions ──────────────────────────────────────────────────────────────────
function switchPark(id) {
  activeParkId = id;
  Storage.setActivePark(id);
  renderNav();
  renderPark();
  document.getElementById('main-content').scrollTop = 0;
  window.scrollTo(0, 0);
}

function toggleItem(id) {
  const newState = Storage.toggleItem(id);
  const park = PARKS.find(p => p.id === activeParkId);

  renderNav();
  renderPark();

  if (newState) {
    const { done, total } = Storage.getParkStats(activeParkId);
    if (done === total) showToast(`${park.emoji} All done at ${park.shortName}!`);

    // If this item has a song picker, prompt right away
    if (SONG_PICKERS[id]) {
      openSongPicker(id);
    }
  }
}

function toggleStar(id) {
  Storage.toggleStar(id);
  renderPark();
}

function bumpCount(id, direction) {
  if (direction > 0) {
    Storage.incrementCount(id);
    showToast('Logged another ride 🎢');
  } else {
    Storage.decrementCount(id);
  }
  renderNav();
  renderPark();
}

function findItemById(id) {
  for (const park of PARKS) {
    for (const section of park.sections) {
      const item = section.items.find(i => i.id === id);
      if (item) return item;
    }
  }
  return null;
}

// ── Song picker modal ────────────────────────────────────────────────────────
function openSongPicker(id) {
  const config = SONG_PICKERS[id];
  if (!config) return;
  const item = findItemById(id);
  const log = Storage.getSongLog(id);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>${config.label}</h3>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <p class="modal-subtitle">${item ? item.name : ''}</p>
      <div class="song-options">
        ${config.options.map(song => `
          <button class="song-option" data-song="${song.replace(/"/g, '&quot;')}">${song}</button>
        `).join('')}
      </div>
      ${log.length ? `
        <div class="song-log">
          <div class="song-log-heading">Logged rides (${log.length})</div>
          ${log.map((s, i) => `
            <div class="song-log-item">
              <span>${s}</span>
              <button class="song-log-remove" data-index="${i}" aria-label="Remove">✕</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    renderPark(); // refresh song tag/count on the item
  };

  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelectorAll('.song-option').forEach(btn => {
    btn.addEventListener('click', () => {
      Storage.addSong(id, btn.dataset.song);
      showToast('Song logged 🎵');
      close();
    });
  });

  overlay.querySelectorAll('.song-log-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      Storage.removeSong(id, parseInt(btn.dataset.index, 10));
      close();
      openSongPicker(id); // reopen refreshed
    });
  });
}

function resetPark(park) {
  if (!confirm(`Clear all checkmarks for ${park.name}?`)) return;
  Storage.clearPark(park.id);
  renderNav();
  renderPark();
  showToast('Checklist cleared');
}

// ── Trips modal ──────────────────────────────────────────────────────────────
function bindTripButton() {
  const btn = document.getElementById('trip-btn');
  if (btn) btn.addEventListener('click', openTripsModal);
}

function openTripsModal() {
  const trips = Storage.listTrips();
  const activeId = Storage.getActiveTripId();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>Your trips</h3>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <p class="modal-subtitle">Each trip keeps its own checklist, stars, and stats — perfect for comparing this year's visit to last year's.</p>
      <div class="trip-list">
        ${trips.map(trip => `
          <div class="trip-item${trip.id === activeId ? ' trip-item-active' : ''}" data-id="${trip.id}">
            <button class="trip-select" data-id="${trip.id}">
              <span class="trip-name">${trip.name}</span>
              <span class="trip-date">${new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </button>
            <button class="trip-rename" data-id="${trip.id}" aria-label="Rename trip" title="Rename">✎</button>
            ${trips.length > 1 ? `<button class="trip-delete" data-id="${trip.id}" aria-label="Delete trip" title="Delete">🗑</button>` : ''}
          </div>
        `).join('')}
      </div>
      <button class="new-trip-btn">+ Start a new trip</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = (shouldRerender) => {
    overlay.remove();
    document.body.style.overflow = '';
    if (shouldRerender) {
      activeResortId = Storage.getActiveResort();
      activeParkId = Storage.getActivePark();
      if (activeResortId) {
        currentView = 'park';
        renderNav();
        renderPark();
      } else {
        currentView = 'resorts';
        renderResortScreen();
      }
    }
  };

  overlay.querySelector('.modal-close').addEventListener('click', () => close(false));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close(false);
  });

  overlay.querySelectorAll('.trip-select').forEach(btn => {
    btn.addEventListener('click', () => {
      Storage.setActiveTrip(btn.dataset.id);
      showToast('Switched trips 🧳');
      close(true);
    });
  });

  overlay.querySelectorAll('.trip-rename').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trips = Storage.listTrips();
      const trip = trips.find(t => t.id === btn.dataset.id);
      const newName = prompt('Rename this trip', trip ? trip.name : '');
      if (newName && newName.trim()) {
        Storage.renameTrip(btn.dataset.id, newName.trim());
        close(false);
        openTripsModal();
      }
    });
  });

  overlay.querySelectorAll('.trip-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trips = Storage.listTrips();
      const trip = trips.find(t => t.id === btn.dataset.id);
      if (!confirm(`Delete "${trip ? trip.name : 'this trip'}"? This removes all its checklist data permanently.`)) return;
      Storage.deleteTrip(btn.dataset.id);
      close(true);
    });
  });

  overlay.querySelector('.new-trip-btn').addEventListener('click', () => {
    const name = prompt('Name this trip (e.g. "Family Vacation 2026")', '');
    if (name === null) return; // cancelled
    const tripId = Storage.createTrip(name.trim() || 'New Trip');
    Storage._seedStarsForTrip(tripId);
    localStorage.removeItem(STORAGE_KEY_RESORT); // new trip starts at resort picker
    showToast('New trip started 🎉');
    close(true);
  });
}

// ── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, opts = {}) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.toggle('toast-wrap', !!opts.wrap);
  toast.classList.add('toast-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast-show'), opts.duration || 2600);
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Make sure a valid trip exists before anything else renders
  Storage.ensureActiveTrip();

  if (currentView === 'park' && activeResortId) {
    renderNav();
    renderPark();
  } else {
    currentView = 'resorts';
    renderResortScreen();
  }

  maybeShowStarHint();
  bindTripButton();
});

function maybeShowStarHint() {
  const seen = localStorage.getItem('rd_star_hint_seen_v1');
  if (seen) return;
  localStorage.setItem('rd_star_hint_seen_v1', '1');
  setTimeout(() => {
    showToast('★ Starred rides are suggested must-dos — tap any star to add or remove your own', { wrap: true, duration: 4200 });
  }, 600);
}
