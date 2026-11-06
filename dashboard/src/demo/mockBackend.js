// In-browser mock backend for the GitHub Pages demo (REACT_APP_DEMO_MODE=1).
// Every post, user and outlet below is generated. The tracked person "Alex Example" is fictional.
import axios from 'axios';

const TARGET = 'Alex Example';
const QUERIES = ['Alex Example', 'Minister Example', 'A. Example'];

function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const TEMPLATES = {
  positive: [
    `${TARGET} opened the new public library and promised longer opening hours.`,
    `Great speech by ${TARGET} on clean energy investment today.`,
    `${TARGET} met with students and announced a new scholarship fund.`,
    `Residents praise ${TARGET} for the quick response to the storm damage.`,
  ],
  negative: [
    `${TARGET} faces criticism over delays in the transit project.`,
    `Not impressed with ${TARGET}'s answer on housing costs.`,
    `Opposition questions ${TARGET} about the budget overrun.`,
    `${TARGET} skipped the town hall again, people are frustrated.`,
  ],
  neutral: [
    `${TARGET} will attend the regional summit next week.`,
    `Interview with ${TARGET} scheduled for Thursday evening.`,
  ],
};
const OUTLETS = ['Example Daily', 'Sample Times', 'Demo Herald', 'Placeholder News', 'Mock Gazette'];
const COUNTRIES = ['qatar', 'us', 'uk', 'india', 'uae', 'germany', 'france'];

function makeRun(seed, count, daysBack, bias) {
  const rand = rng(seed);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const roll = rand() + bias;
    const label = roll > 0.55 ? 'positive' : roll < 0.08 ? 'neutral' : 'negative';
    const score = label === 'positive' ? 0.55 + rand() * 0.45 : label === 'negative' ? -(0.55 + rand() * 0.45) : rand() * 0.2 - 0.1;
    const isX = rand() < 0.45;
    const date = new Date(now - Math.floor(rand() * daysBack * 86400000)).toISOString();
    const text = pick(TEMPLATES[label]);
    const outlet = pick(OUTLETS);
    const user = `demo_user_${Math.floor(rand() * 400)}`;
    return {
      id: `demo-${seed}-${i}`,
      post_id: `demo-${seed}-${i}`,
      source: isX ? 'X' : 'News',
      platform: isX ? 'X' : outlet,
      source_name: isX ? 'X' : outlet,
      type: isX ? 'post' : 'article',
      date,
      published_date: date,
      published_at: date,
      text,
      title: isX ? null : text,
      content: text,
      description: isX ? null : `${text} (generated demo article)`,
      url: 'https://example.com/',
      query: pick(QUERIES),
      language: 'en',
      country: pick(COUNTRIES),
      retweets: isX ? Math.floor(rand() * 300) : 0,
      likes: isX ? Math.floor(rand() * 1500) : 0,
      comments: isX ? Math.floor(rand() * 120) : 0,
      user_name: isX ? `Demo User ${user.slice(10)}` : null,
      user_handle: isX ? user : null,
      user_location: null,
      user_avatar: null,
      tags: [],
      sentiment_label: label,
      sentiment_score: Math.round(score * 1000) / 1000,
    };
  });
}

const latest = makeRun(7, 900, 60, 0.05);
const previous = makeRun(11, 800, 60, -0.05);
let target = { individual_name: TARGET, query_variations: QUERIES };
let emailConfig = { provider: 'mailersend', recipients: ['demo@example.com'], enabled: false, notifyOnCollection: false, notifyOnProcessing: false, notifyOnAnalysis: true };
const status = {
  is_running: true,
  current_task: null,
  last_run: { collection: { status: 'success', timestamp: new Date().toISOString() } },
  next_scheduled_run: new Date(Date.now() + 3600000).toISOString(),
};

function route(method, url, body) {
  const path = new URL(url, window.location.href).pathname;
  const ts = new Date().toISOString();
  if (path.endsWith('/latest-data')) return { status: 'success', data: latest, timestamp: ts };
  if (path.endsWith('/comparison-data'))
    return { status: 'success', latest_data: latest, previous_data: previous, latest_timestamp: ts, previous_timestamp: new Date(Date.now() - 7 * 86400000).toISOString() };
  if (path.endsWith('/target')) {
    if (method === 'POST') target = body;
    return { status: 'success', data: target };
  }
  if (path.endsWith('/email/config')) {
    if (method === 'POST') emailConfig = body;
    return emailConfig;
  }
  if (path.includes('/email/')) return { status: 'success', message: 'Demo mode: no email was sent.' };
  if (path.endsWith('/agent/trigger-run')) return { status: 'success', message: 'Demo mode: collection is simulated, no data is fetched.' };
  if (path.endsWith('/status')) return status;
  if (path.endsWith('/command')) return { success: true, message: 'Demo mode: command ignored.' };
  return null;
}

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const isApi = (url) => typeof url === 'string' && (url.startsWith(API) || url.startsWith('http://localhost:8000'));

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (!isApi(url)) return realFetch(input, init);
  const method = (init.method || 'GET').toUpperCase();
  const data = route(method, url, init.body ? JSON.parse(init.body) : undefined);
  await new Promise((r) => setTimeout(r, 200));
  return new Response(JSON.stringify(data ?? { detail: 'Not available in demo' }), {
    status: data ? 200 : 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

axios.defaults.adapter = async (config) => {
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  const data = route((config.method || 'get').toUpperCase(), config.url, body);
  return { data, status: data ? 200 : 404, statusText: 'OK', headers: {}, config, request: {} };
};

// Minimal stand-in for the Supabase client: always signed in as a demo user.
const demoUser = { id: 'demo-user', email: 'demo@example.com', user_metadata: { full_name: 'Demo Viewer' } };
const demoSession = { user: demoUser, access_token: 'demo' };
export const demoSupabase = {
  auth: {
    getSession: async () => ({ data: { session: demoSession }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ data: { session: demoSession, user: demoUser }, error: null }),
    signUp: async () => ({ data: { session: demoSession, user: demoUser }, error: null }),
    updateUser: async () => ({ data: { user: demoUser }, error: null }),
  },
};
