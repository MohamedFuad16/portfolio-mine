#!/usr/bin/env node
/**
 * Refresh the GitHub contribution snapshot committed at
 * public/media/data/contributions.json.
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
// The profile's time zone, which is what the contribution calendar buckets by.
const TIME_ZONE = process.env.GH_TIME_ZONE || 'Asia/Tokyo';
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/media/data/contributions.json'
);
// The grid renders 52 whole weeks, one column per week — matching the
// "last 12 months" its caption claims. Keep in sync with CONTRIBUTION_DAYS in
// src/App.jsx.
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

// Which public repositories each day's contributions went to. Queried one
// calendar month at a time: a repository's commit connection holds one node
// per day, so a month never exceeds the 100-node page. Pull request, issue and
// review connections hold one node per item, so a page that reports more is
// treated as an error rather than silently truncated. Private repositories are
// dropped by name and only ever appear as an unnamed remainder in the UI.
async function repoActivity(from, to) {
  if (!TOKEN) throw new Error('no token');
  const query = `
    query ($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          commitContributionsByRepository(maxRepositories: 100) {
            repository { name url isPrivate }
            contributions(first: 100) { pageInfo { hasNextPage } nodes { occurredAt commitCount } }
          }
          pullRequestContributionsByRepository(maxRepositories: 100) {
            repository { name url isPrivate }
            contributions(first: 100) { pageInfo { hasNextPage } nodes { occurredAt } }
          }
          issueContributionsByRepository(maxRepositories: 100) {
            repository { name url isPrivate }
            contributions(first: 100) { pageInfo { hasNextPage } nodes { occurredAt } }
          }
          pullRequestReviewContributionsByRepository(maxRepositories: 100) {
            repository { name url isPrivate }
            contributions(first: 100) { pageInfo { hasNextPage } nodes { occurredAt } }
          }
        }
      }
    }`;

  const activity = {};
  const repos = {};
  // Commit nodes are already calendar days (stamped at local midnight, e.g.
  // T07:00:00Z), so their date prefix is the day. Pull requests, issues and
  // reviews carry exact instants, which the calendar buckets in the owner's
  // time zone: on 2026-07-19 the grid's 17 equals 9 commits plus 8 events only
  // when those events are read in Japan time.
  const localDay = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });
  const add = (repository, occurredAt, amount, exact) => {
    if (repository.isPrivate) return;
    const date = exact ? localDay.format(new Date(occurredAt)) : occurredAt.slice(0, 10);
    repos[repository.name] = repository.url;
    const day = (activity[date] ||= {});
    day[repository.name] = (day[repository.name] || 0) + amount;
  };

  for (let start = new Date(from); start < to; ) {
    const end = new Date(Math.min(to, Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)));
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': `${USER}-portfolio-contributions`,
      },
      body: JSON.stringify({
        query,
        variables: { login: USER, from: start.toISOString(), to: new Date(end - 1).toISOString() },
      }),
    });
    if (!response.ok) throw new Error(`GraphQL HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(payload.errors[0].message);
    const collection = payload.data?.user?.contributionsCollection;
    if (!collection) throw new Error('GraphQL returned no collection');

    for (const key of Object.keys(collection)) {
      if (collection[key].some(({ contributions }) => contributions.pageInfo.hasNextPage)) {
        throw new Error(`${key} has more than 100 items in one month`);
      }
    }
    collection.commitContributionsByRepository.forEach(({ repository, contributions }) =>
      contributions.nodes.forEach((node) => add(repository, node.occurredAt, node.commitCount, false))
    );
    for (const key of [
      'pullRequestContributionsByRepository',
      'issueContributionsByRepository',
      'pullRequestReviewContributionsByRepository',
    ]) {
      collection[key].forEach(({ repository, contributions }) =>
        contributions.nodes.forEach((node) => add(repository, node.occurredAt, 1, true))
      );
    }
    start = end;
  }

  // Compact form, busiest repository first: { "2026-07-22": [["WebDrop", 2]] }.
  const byDay = Object.fromEntries(
    Object.entries(activity)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, day]) => [date, Object.entries(day).sort((a, b) => b[1] - a[1])])
  );
  return { activity: byDay, repos };
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

  // Repository breakdown is best effort: without it the grid still works and
  // simply has nothing to list under a day.
  let current = null;
  try {
    current = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    /* first run, or unreadable file */
  }

  // On failure keep the breakdown already committed rather than writing an
  // empty one over it.
  let activity = current?.activity ?? {};
  let repos = current?.repos ?? {};
  try {
    // Start a day early: the first grid day begins at local midnight, which is
    // the previous day in UTC for any zone ahead of it (Asia/Tokyo is +9).
    const first = new Date(`${cells[0].date}T00:00:00Z`);
    first.setUTCDate(first.getUTCDate() - 1);
    const fetched = await repoActivity(first, new Date());
    const inGrid = new Set(cells.map((day) => day.date));
    activity = Object.fromEntries(Object.entries(fetched.activity).filter(([date]) => inGrid.has(date)));
    repos = fetched.repos;
    console.log(`Resolved repositories for ${Object.keys(activity).length} days.`);
  } catch (error) {
    console.log(`Repository breakdown unavailable (${error.message}); keeping the previous one.`);
  }

  const snapshot = {
    user: USER,
    source: result.source,
    generatedAt: new Date().toISOString(),
    total: result.total,
    cells,
    repos,
    activity,
  };

  // Skip the write when only the timestamp would change, so the workflow does
  // not create an empty commit on every run.
  const next = JSON.stringify(snapshot, null, 2) + '\n';
  if (current) {
    const same =
      current.total === snapshot.total &&
      JSON.stringify(current.cells) === JSON.stringify(snapshot.cells) &&
      JSON.stringify(current.activity) === JSON.stringify(snapshot.activity);
    if (same) {
      console.log('Contributions unchanged; leaving the snapshot as is.');
      return;
    }
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, next);
  console.log(`Wrote ${cells.length} days, total ${snapshot.total}, via ${result.source}.`);
}

main().catch((error) => {
  console.error(`Failed to refresh contributions: ${error.message}`);
  process.exit(1);
});
