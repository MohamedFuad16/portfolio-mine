import { createHash } from 'node:crypto';

/**
 * Visitor counter for the portfolio footer.
 *
 * This is the only server-side code in the project. It exists because a real
 * visitor count needs persistence and the site is otherwise fully static — the
 * alternative was pinging a third-party counter service, which would hand every
 * visit to someone else.
 *
 *   GET  /api/visits  -> { count }            read only, never increments
 *   POST /api/visits  -> { count, counted }   increments once per unique visitor
 *
 * Uniqueness is enforced server-side rather than trusting the browser: a key
 * derived from the request's IP and user-agent is written with NX (set only if
 * absent) and a 30-day expiry, and the counter is incremented only when that
 * write actually created the key. Clearing localStorage therefore cannot
 * inflate the number, and neither can replaying the request.
 *
 * Only a truncated salted hash is stored — never the address itself — and it
 * expires after 30 days.
 *
 * Environment (set in the Vercel project, both required):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const COUNTER_KEY = 'portfolio:visits';
const SEEN_PREFIX = 'portfolio:seen:';
const SEEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function redisUrl() {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;
  return { base: base.replace(/\/$/, ''), token };
}

async function redis(command) {
  const cfg = redisUrl();
  if (!cfg) throw new Error('redis not configured');
  const response = await fetch(`${cfg.base}/${command.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`redis HTTP ${response.status}`);
  const payload = await response.json();
  return payload.result;
}

/** Truncated salted hash of IP + user-agent. The raw address is never stored. */
function visitorKey(req) {
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ip = String(forwarded).split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const agent = String(req.headers['user-agent'] || 'unknown');
  const salt = process.env.VISITS_SALT || 'portfolio-visits';
  return SEEN_PREFIX + createHash('sha256').update(`${ip}|${agent}|${salt}`).digest('hex').slice(0, 32);
}

export default async function handler(req, res) {
  // The count is public but should not be cached at the edge, or every visitor
  // would be served one stale number and the footer would never tick over.
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  if (!redisUrl()) {
    // Unconfigured is not an error worth breaking the page over — the footer
    // simply omits the counter when this comes back unavailable.
    return res.status(503).json({ error: 'counter not configured' });
  }

  try {
    if (req.method === 'GET') {
      const raw = await redis(['get', COUNTER_KEY]);
      return res.status(200).json({ count: Number(raw) || 0 });
    }

    // SET <key> 1 NX EX <ttl> returns "OK" only when it created the key.
    const created = await redis(['set', visitorKey(req), '1', 'nx', 'ex', String(SEEN_TTL_SECONDS)]);
    if (created === 'OK') {
      const count = await redis(['incr', COUNTER_KEY]);
      return res.status(200).json({ count: Number(count) || 0, counted: true });
    }
    const raw = await redis(['get', COUNTER_KEY]);
    return res.status(200).json({ count: Number(raw) || 0, counted: false });
  } catch (error) {
    console.error('visits handler failed:', error);
    return res.status(502).json({ error: 'counter unavailable' });
  }
}
