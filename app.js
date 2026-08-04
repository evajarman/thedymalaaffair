const TEAMS = [
  { id: 'clouseau', name: 'Inspector Clouseau', emoji: '🦩', quote: '“I suspect everyone.”' },
  { id: 'poirot', name: 'Hercule Poirot', emoji: '🥸', quote: '“The truth...is always beautiful to those who seek it.”' },
  { id: 'marple', name: 'Nancy Drew', emoji: '🔦', quote: '“Every clue tells a story.”' },
  { id: 'sherlock', name: 'Sherlock Holmes', emoji: '🔎', quote: '“The game is afoot.”' }
];

const CORRECT_BAR = 'La Liquiderie';
const WHATSAPP = '61 403 599 510';
const WHATSAPP_URL = 'https://wa.me/61403599510';

const GRADES = {
  confirmed: { label: 'Confirmed Intelligence', emoji: '🟢', className: 'confirmed', meaning: 'Verified by multiple sources. Treat this as fact.' },
  witness: { label: 'Witness Statement', emoji: '🟡', className: 'witness', meaning: 'Credible, but eyewitnesses are not perfect.' },
  field: { label: 'Field Report', emoji: '🟠', className: 'field', meaning: 'Useful information from investigators. May include assumptions.' },
  anonymous: { label: 'Anonymous Tip', emoji: '🔴', className: 'anonymous', meaning: 'Possibly useful. Possibly nonsense. Proceed carefully.' },
  police: { label: 'French Police File', emoji: '⚫', className: 'police', meaning: 'Officially documented. Surprisingly unhelpful.' }
};

const CHALLENGES = [
  'Ask for a dildo in French at a sex shop.',
  'Get a photo with a French police officer.',
  'Buy a croissant from Urban Bakery – Goncourt.',
  'Get a video of a stranger wishing Alanna and Arthur bonne chance for their wedding.',
  'Score exactly 20 with a dart.',
  'Bum a cigarette from a French local.',
  'Give your number to someone (single ladies only 😊).',
  'Get a scoop of ice cream from Folderol.',
  'Ride the 69 bus (photo evidence).',
  'Get a margarita from El Guacamole.',
  'Get a video of a stranger offering Alanna and Arthur marriage advice.',
  'Do something gravity-defying at the Cité des Sciences (photo or video).'
];

const BARS = [
  'La Liquiderie', 'Dirty Lemon', 'Le Split', 'Mobster Bar', 'Notre Dame Music Bar',
  'Le Perchoir', 'Delicatessen cave', 'Bar Principal', "L'Orange Méchanique", 'Au Chat Noir',
  'RORI', 'Folderol', 'The Cork and Cavan'
];

const CLUE_TIERS = [
  [
    { grade: 'police', text: 'Paris police report that the suspects “went somewhere.” This has been filed as progress.' },
    { grade: 'witness', text: 'A witness insists the thieves stayed within easy walking distance of Le Carreau.' },
    { grade: 'confirmed', text: 'The thieves chose somewhere where the drinks matter more than dinner.' },
    { grade: 'anonymous', text: 'A local claims one suspect fled on an electric scooter while looking “suspiciously pleased”.' },
    { grade: 'field', text: 'Investigators can safely rule out the rooftop option.' }
  ],
  [
    { grade: 'confirmed', text: 'The getaway did not involve citrus. Dirty Lemon is a false lead.' },
    { grade: 'field', text: 'The suspects avoided anywhere that sounds like a gangster would write it on a business card.' },
    { grade: 'confirmed', text: 'The diamonds were not taken underground into the cave.' },
    { grade: 'field', text: 'CCTV caught no one entering Folderol. Tempting name. Wrong case.' }
  ],
  [
    { grade: 'confirmed', text: 'The hideout begins with “La”. Very French. Suspiciously convenient.' },
    { grade: 'confirmed', text: 'The hideout is not mechanically orange, musically holy, or principally obvious.' },
    { grade: 'confirmed', text: 'Final intelligence: the thieves are hiding at La Liquiderie.' }
  ]
];

const STORAGE_VERSION = 'v9';

const app = document.querySelector('#app');
let state = loadState();

function storageKey(teamId = state.teamId) {
  return `hens-heist-${STORAGE_VERSION}-${teamId || 'global'}`;
}

function loadState() {
  const global = JSON.parse(localStorage.getItem(`hens-heist-${STORAGE_VERSION}-global`) || '{}');
  if (!global.teamId) return { screen: 'welcome' };

  const teamState = JSON.parse(localStorage.getItem(`hens-heist-${STORAGE_VERSION}-${global.teamId}`) || '{}');
  return { screen: 'dashboard', teamId: global.teamId, ...teamState };
}

function saveState() {
  if (state.teamId) {
    localStorage.setItem(`hens-heist-${STORAGE_VERSION}-global`, JSON.stringify({ teamId: state.teamId }));
    localStorage.setItem(storageKey(), JSON.stringify(state));
  }
}

function hashSeed(str) {
  return [...str].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
}

function seededShuffle(items, seedText) {
  const arr = [...items];
  let seed = Math.abs(hashSeed(seedText)) + 1;

  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function buildTieredClues(teamId) {
  return CLUE_TIERS.flatMap((tier, tierIndex) =>
    seededShuffle(tier, `${teamId}-clues-tier-${tierIndex}`).map((clue, i) => ({
      ...clue,
      id: `${tierIndex}-${i}`,
      tier: tierIndex + 1,
      unlocked: false
    }))
  );
}

function ensureTeamState(teamId) {
  const saved = JSON.parse(localStorage.getItem(`hens-heist-${STORAGE_VERSION}-${teamId}`) || 'null');
  if (saved?.clues?.[0]?.grade) return saved;

  return {
    screen: 'brief',
    teamId,
    activeTab: 'challenges',
    briefingSeen: false,
    solved: false,
    challenges: seededShuffle(
      CHALLENGES.map((text, i) => ({ id: i, text, done: false, justCompleted: false })),
      `${teamId}-challenges`
    ),
    clues: buildTieredClues(teamId),
    wrongGuesses: []
  };
}

function renderTemplate(id) {
  app.innerHTML = '';
  app.append(document.querySelector(id).content.cloneNode(true));
}

function render() {
  if (state.screen === 'welcome') {
    renderTemplate('#welcome-template');
    return;
  }

  if (state.screen === 'team') {
    renderTeam();
    return;
  }

  if (state.screen === 'brief') {
    renderBrief();
    return;
  }

  renderDashboard();
}

function renderTeam() {
  renderTemplate('#team-template');

  const grid = document.querySelector('#team-grid');

  TEAMS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'team-card';
    btn.dataset.team = t.id;
    btn.innerHTML = `
      <span class="team-emoji" aria-hidden="true">${t.emoji}</span>
      <span class="team-name">${t.name}</span>
      <small>${t.quote}</small>
    `;
    grid.append(btn);
  });
}

function renderBrief() {
  renderTemplate('#brief-template');

  const team = TEAMS.find(t => t.id === state.teamId);
  document.querySelector('#brief-team-title').textContent = `Team ${team.name}, your case file is active.`;
}

function renderDashboard() {
  renderTemplate('#dashboard-template');

  const team = TEAMS.find(t => t.id === state.teamId);
  const done = state.challenges.filter(c => c.done).length;

  document.querySelector('#team-label').textContent = `Team ${team.name}`;
  document.querySelector('#completed-count').textContent = done;
  document.querySelector('#progress-bar').style.width = `${(done / CHALLENGES.length) * 100}%`;

  document.querySelectorAll('.tab').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === state.activeTab);
  });

  renderTab();

  if (state.activeTab === 'clues' && !state.briefingSeen) {
    state.briefingSeen = true;
    saveState();
    window.setTimeout(showIntelligenceBriefing, 250);
  }
}

function renderTab() {
  const el = document.querySelector('#tab-content');

  if (state.activeTab === 'challenges') {
    el.innerHTML = '<div class="challenge-grid"></div>';

    const grid = el.querySelector('.challenge-grid');

    state.challenges.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = `challenge-card ${c.done ? 'done' : ''} ${c.justCompleted ? 'just-completed' : ''}`;
      btn.dataset.challenge = idx;

      btn.innerHTML = `
        <span class="card-inner">
          <span class="card-front">
            <b>Evidence ${idx + 1}</b>
            ${c.text}
            <span class="status">Submit evidence</span>
          </span>
          <span class="card-back">
            <b>Evidence ${idx + 1}</b>
            <strong>Completed</strong>
            <em>Verified</em>
          </span>
        </span>
      `;

      grid.append(btn);

      if (c.justCompleted) {
        window.setTimeout(() => {
          c.justCompleted = false;
          saveState();
        }, 1400);
      }
    });

    return;
  }

  if (state.activeTab === 'clues') {
    const unlocked = state.clues.filter(c => c.unlocked);

    el.innerHTML = `
      <button class="ghost protocol-button" data-action="briefing">ℹ Intelligence protocol</button>
      <div class="clue-list"></div>
    `;

    const list = el.querySelector('.clue-list');

    if (!unlocked.length) {
      list.innerHTML = '<div class="clue locked"><b>Vault empty</b>Recover evidence to unlock your first clue.</div>';
    }

    state.clues.forEach((c, idx) => {
      const grade = GRADES[c.grade];
      const div = document.createElement('div');
      div.className = `clue ${c.unlocked ? grade.className : 'locked'}`;

      div.innerHTML = c.unlocked
        ? `<b>Clue ${idx + 1}</b><span class="grade">${grade.emoji} ${grade.label}</span><p>${c.text}</p>`
        : `<b>Locked</b>Recover more intelligence.`;

      list.append(div);
    });

    return;
  }

  el.innerHTML = '<div class="bar-list"></div>';

  const list = el.querySelector('.bar-list');

  seededShuffle(BARS, `${state.teamId}-bars`).forEach(bar => {
    const btn = document.createElement('button');
    btn.className = `bar-card ${state.wrongGuesses.includes(bar) ? 'wrong' : ''}`;
    btn.dataset.bar = bar;
    btn.textContent = `🍸 ${bar}`;
    list.append(btn);
  });
}

function submitChallenge(index) {
  const c = state.challenges[index];
  if (!c || c.done) return;

  showEvidenceInstructions(index);
}

function showEvidenceInstructions(index) {
  showModal({
    title: 'Submit evidence',
    message: `Text your photo or video evidence to the case manager on WhatsApp: <strong>${WHATSAPP}</strong>.`,
    buttons: [
      { label: 'Cancel', className: 'ghost modal-button-secondary' },
      { label: 'I understand', className: 'primary', action: () => showEvidenceConfirmation(index) }
    ]
  });
}

function showEvidenceConfirmation(index) {
  showModal({
    title: 'Evidence sent?',
    message: 'Have you actually sent your evidence to the case manager on WhatsApp?',
    buttons: [
      { label: 'No, not yet', className: 'ghost modal-button-secondary' },
      { label: 'Yes, I have', className: 'primary', action: () => processEvidence(index) }
    ]
  });
}

function processEvidence(index) {
  const c = state.challenges[index];
  if (!c || c.done) return;

  showModal({
    title: 'Evidence processing',
    message: 'Our analysts are reviewing your evidence…',
    processing: true,
    buttons: []
  });

  window.setTimeout(() => {
    c.done = true;
    c.justCompleted = true;

    const nextClueIndex = state.clues.findIndex(clue => !clue.unlocked);
    const nextClue = nextClueIndex >= 0 ? state.clues[nextClueIndex] : null;

    if (nextClue) nextClue.unlocked = true;

    saveState();

    document.querySelector('.result')?.remove();
    state.activeTab = 'challenges';
    renderDashboard();
    announceClueUnlock(nextClue, nextClueIndex);
  }, 1400);
}

function gentleBuzz() {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([35, 45, 35]);
    } catch (error) {}
  }
}

function announceClueUnlock(clue, clueIndex) {
  gentleBuzz();

  if (!clue) {
    showResult('Evidence archived', 'All intelligence files have already been recovered.', true);
    return;
  }

  const grade = GRADES[clue.grade];
  const overlay = document.createElement('div');

  overlay.className = 'result clue-reveal-overlay';
  overlay.innerHTML = `
    <div class="clue-reveal-card ${grade.className}">
      <div class="panther-trail" aria-hidden="true"><span>◖</span><span>◗</span><span>◖</span></div>
      <p class="case-label">New Intelligence</p>
      <div class="reveal-folder">
        <div class="folder-tab">FILE #${String(clueIndex + 1).padStart(3, '0')}</div>
        <div class="magnifier" aria-hidden="true">⌕</div>
        <span class="grade reveal-grade">${grade.emoji} ${grade.label}</span>
        <p>${clue.text}</p>
        <strong class="stamp-small">Recovered</strong>
      </div>
      <button class="primary" data-close-result>Archive file</button>
    </div>
  `;

  document.body.append(overlay);
}

function showIntelligenceBriefing() {
  const rows = Object.values(GRADES)
    .map(g => `<li><strong>${g.emoji} ${g.label}</strong><span>${g.meaning}</span></li>`)
    .join('');

  showModal({
    title: 'Intelligence Protocol',
    message: `<ul class="grade-list">${rows}</ul>`,
    buttons: [{ label: 'Understood', className: 'primary' }]
  });
}

function showModal({ title, message, buttons, processing = false }) {
  document.querySelector('.result')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'result';

  const buttonHtml = buttons
    .map((button, i) => `<button class="${button.className}" data-modal-button="${i}">${button.label}</button>`)
    .join('');

  overlay.innerHTML = `
    <div class="result-card modal-card">
      <button class="modal-close" data-modal-close aria-label="Close">×</button>
      <h2>${title}</h2>
      <p>${message}</p>
      ${processing ? '<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>' : ''}
      <div class="modal-actions">${buttonHtml}</div>
    </div>
  `;

  document.body.append(overlay);

  overlay.addEventListener('click', event => {
    if (event.target.closest('[data-modal-close]')) overlay.remove();

    const index = event.target.closest('[data-modal-button]')?.dataset.modalButton;

    if (index !== undefined) {
      const button = buttons[Number(index)];
      overlay.remove();
      if (button.action) button.action();
    }
  });
}

function guessBar(bar) {
  const certain = confirm(`Are you certain the thieves are hiding at ${bar}?`);
  if (!certain) return;

  if (bar === CORRECT_BAR) {
    state.solved = true;
    saveState();
    showResult(
      'Case closed',
      'The Dymala Affair is solved. Proceed inside La Liquiderie to claim the liberated cocktails.',
      true
    );
  } else {
    if (!state.wrongGuesses.includes(bar)) state.wrongGuesses.push(bar);
    saveState();
    showResult(
      'False lead',
      'The thieves are not here. Protocol requires one round of shots before reopening the case.',
      false
    );
  }
}

function showResult(title, message, success) {
  const overlay = document.createElement('div');
  overlay.className = 'result';

  overlay.innerHTML = `
    <div class="result-card ${success ? 'success' : 'fail'}">
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="primary" data-close-result>Continue</button>
    </div>
  `;

  document.body.append(overlay);
}

document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;

  if (action === 'start') {
    state = { screen: 'team' };
    render();
  }

  if (action === 'show-board') {
    state.screen = 'dashboard';
    state.activeTab = 'challenges';
    saveState();
    render();
  }

  if (action === 'briefing') showIntelligenceBriefing();

  if (action === 'reset') {
    if (confirm('Reset this team on this phone?')) {
      localStorage.removeItem(storageKey());
      localStorage.removeItem(`hens-heist-${STORAGE_VERSION}-global`);
      state = { screen: 'welcome' };
      render();
    }
  }

  const team = e.target.closest('[data-team]')?.dataset.team;

  if (team) {
    state = ensureTeamState(team);
    saveState();
    render();
  }

  const tab = e.target.closest('[data-tab]')?.dataset.tab;

  if (tab) {
    state.activeTab = tab;
    saveState();
    renderDashboard();
  }

  const challenge = e.target.closest('[data-challenge]')?.dataset.challenge;

  if (challenge !== undefined) submitChallenge(Number(challenge));

  const bar = e.target.closest('[data-bar]')?.dataset.bar;

  if (bar) guessBar(bar);

  if (e.target.closest('[data-close-result]')) {
    document.querySelector('.result')?.remove();
    renderDashboard();
  }
});

render();
