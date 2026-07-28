#!/usr/bin/env node
/**
 * Refresh the GitHub contribution snapshot committed at
 * public/assets/contributions.json.
 *
 * Preferred source is GitHub's own GraphQL API (needs a token with read:user —
 * the Actions GITHUB_TOKEN works for public contribution data). If no token is
 * available, or the call fails, it falls back to the public mirror the site has
 * always used so the workflow still produces fresh data.
 *
 * Run locally:  node scripts/fetch-contributions.mjs
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = process.env.GH_USER || 'MohamedFuad16';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/assets/contributions.json'
);
// The grid renders 52 whole weeks, one column per week — matching the
// "last 12 months" its caption claims. Keep in sync with CONTRIBUTION_DAYS in
// src/main.jsx.
const DAYS = 52 * 7;

/** GitHub buckets a day into 0-4; the mirror already returns that shape. */
function levelFromCount(count, max) {
  if (count <= 0) return 0;
  if (max <= 0) return 1;
  const ratio = count / max;
  if (ratio > 0.66) return 4;
  if (ratio > 0.33) return 3;
  if (ratio > 0.15) return 2;
  return 1;
}

async function fromGraphQL() {
  if (!TOKEN) throw new Error('no token');
  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - 1);
  from.setDate(from.getDate() + 1);

  const query = `
    query ($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays { date contributionCount contributionLevel }
            }
          }
        }
      }
    }`;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': `${USER}-portfolio-contributions`,
    },
    body: JSON.stringify({
      query,
      variables: { login: USER, from: from.toISOString(), to: to.toISOString() },
    }),
  });

  if (!response.ok) throw new Error(`GraphQL HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors[0].message);

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) throw new Error('GraphQL returned no calendar');

  const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  const cells = calendar.weeks
    .flatMap((week) => week.contributionDays)
    .map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: levels[day.contributionLevel] ?? 0,
    }));

  return { source: 'github-graphql', total: calendar.totalContributions, cells };
}

async function fromMirror() {
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`,
    { headers: { 'User-Agent': `${USER}-portfolio-contributions` } }
  );
  if (!response.ok) throw new Error(`mirror HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.contributions)) throw new Error('mirror returned no contributions');

  const max = payload.contributions.reduce((peak, day) => Math.max(peak, Number(day.count) || 0), 0);
  const cells = payload.contributions.map((day) => ({
    date: day.date,
    count: Number(day.count) || 0,
    level: Number.isFinite(Number(day.level)) ? Number(day.level) : levelFromCount(Number(day.count) || 0, max),
  }));

  return { source: 'jogruber-mirror', total: Number(payload.total?.lastYear) || 0, cells };
}

async function main() {
  let result;
  try {
    result = await fromGraphQL();
    console.log('Fetched contributions from GitHub GraphQL.');
  } catch (error) {
    console.log(`GraphQL unavailable (${error.message}); using public mirror.`);
    result = await fromMirror();
  }

  // Keep only days up to today, then the most recent window the grid renders.
  const today = new Date().toISOString().slice(0, 10);
  const cells = result.cells.filter((day) => day.date <= today).slice(-DAYS);
  if (cells.length === 0) throw new Error('no contribution days resolved');

  const snapshot = {
    user: USER,
    source: result.source,
    generatedAt: new Date().toISOString(),
    total: result.total,
    cells,
  };

  // Skip the write when only the timestamp would change, so the workflow does
  // not create an empty commit on every run.
  const next = JSON.stringify(snapshot, null, 2) + '\n';
  try {
    const current = JSON.parse(await readFile(OUT, 'utf8'));
    const same =
      current.total === snapshot.total &&
      JSON.stringify(current.cells) === JSON.stringify(snapshot.cells);
    if (same) {
      console.log('Contributions unchanged; leaving the snapshot as is.');
      return;
    }
  } catch {
    /* first run, or unreadable file — write it */
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, next);
  console.log(`Wrote ${cells.length} days, total ${snapshot.total}, via ${result.source}.`);
}

main().catch((error) => {
  console.error(`Failed to refresh contributions: ${error.message}`);
  process.exit(1);
});
