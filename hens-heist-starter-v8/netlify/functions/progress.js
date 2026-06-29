const { getStore } = require('@netlify/blobs');

const TEAMS = ['cousteau', 'poirot', 'marple', 'sherlock'];
const DEFAULT_PROGRESS = Object.fromEntries(
  TEAMS.map(team => [team, { clues: 0, challenges: 0, solved: false, updatedAt: null }])
);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

async function readProgress(store) {
  const saved = await store.get('leaderboard', { type: 'json' });
  return { ...DEFAULT_PROGRESS, ...(saved || {}) };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const store = getStore('hens-heist-progress');

  try {
    if (event.httpMethod === 'GET') {
      const progress = await readProgress(store);
      return json(200, { ok: true, progress, serverTime: new Date().toISOString() });
    }

    if (event.httpMethod !== 'POST') {
      return json(405, { ok: false, error: 'Method not allowed' });
    }

    const body = JSON.parse(event.body || '{}');
    const { teamId, clues, challenges, solved } = body;

    if (!TEAMS.includes(teamId)) {
      return json(400, { ok: false, error: 'Unknown team' });
    }

    const progress = await readProgress(store);
    const current = progress[teamId] || DEFAULT_PROGRESS[teamId];

    progress[teamId] = {
      clues: Math.max(Number(current.clues) || 0, Number(clues) || 0),
      challenges: Math.max(Number(current.challenges) || 0, Number(challenges) || 0),
      solved: Boolean(current.solved || solved),
      updatedAt: new Date().toISOString()
    };

    await store.setJSON('leaderboard', progress);

    return json(200, { ok: true, progress, serverTime: new Date().toISOString() });
  } catch (error) {
    return json(500, { ok: false, error: error.message || 'Server error' });
  }
};
