// coding-rpg-box
// 내 GitHub 활동을 RPG 캐릭터 스탯 카드로 변환해 Pin된 Gist에 덮어쓴다.
//
//   ATK = 커밋 수, DEF = 머지된 PR, INT = 언어 수,
//   STR = 현재 streak, LCK = fix 비율
//
// 환경변수:
//   GH_TOKEN : repo + gist 권한 PAT
//   GIST_ID  : 표시할 Gist ID
//   TZ       : 타임존 (기본 Asia/Seoul)

const GH_TOKEN = process.env.GH_TOKEN;
const GIST_ID = process.env.GIST_ID;
const TZ = process.env.TZ || "Asia/Seoul";

if (!process.env.DEMO && (!GH_TOKEN || !GIST_ID)) {
  console.error("GH_TOKEN, GIST_ID 환경변수가 필요합니다. (미리보기는 DEMO=1)");
  process.exit(1);
}

const API = "https://api.github.com";

// ─────────────────────────────────────────────────────────────
// 1. GitHub 데이터 수집
// ─────────────────────────────────────────────────────────────
async function graphql(query, variables = {}) {
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${GH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("GraphQL 오류: " + JSON.stringify(json.errors));
  return json.data;
}

async function fetchStats() {
  const { viewer } = await graphql(`query { viewer { id login } }`);

  const data = await graphql(
    `
      query ($id: ID!) {
        viewer {
          pullRequests(states: MERGED) {
            totalCount
          }
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
          repositories(
            first: 100
            ownerAffiliations: OWNER
            isFork: false
            orderBy: { field: PUSHED_AT, direction: DESC }
          ) {
            nodes {
              stargazerCount
              languages(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 100, author: { id: $id }) {
                      totalCount
                      nodes {
                        message
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    { id: viewer.id }
  );

  const v = data.viewer;
  const repos = v.repositories.nodes;

  const langs = new Set();
  let commits = 0;
  let stars = 0;
  let sampled = 0;
  let fixSampled = 0;

  for (const repo of repos) {
    stars += repo.stargazerCount || 0;
    for (const e of repo.languages?.edges ?? []) langs.add(e.node.name);
    const hist = repo.defaultBranchRef?.target?.history;
    if (hist) {
      commits += hist.totalCount;
      for (const c of hist.nodes) {
        sampled++;
        if (/\b(fix|bug|hotfix|patch|오류|버그|수정)\b/i.test(c.message)) fixSampled++;
      }
    }
  }

  const streaks = computeStreaks(v.contributionsCollection.contributionCalendar);

  return {
    login: viewer.login,
    commits,
    prsMerged: v.pullRequests.totalCount,
    languages: langs.size,
    stars,
    fixRatio: sampled ? fixSampled / sampled : 0,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
}

// 기여 캘린더에서 현재/최장 연속 기록 계산
function computeStreaks(calendar) {
  const days = [];
  for (const w of calendar.weeks)
    for (const d of w.contributionDays)
      days.push({ date: d.date, count: d.contributionCount });
  days.sort((a, b) => (a.date < b.date ? -1 : 1));

  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  // 현재 streak: 마지막 날짜(오늘/어제 포함)부터 거꾸로
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i < days.length - 1) break; // 오늘 0개여도 어제까지 이어졌으면 인정
    else continue;
  }
  return { current, longest };
}

// ─────────────────────────────────────────────────────────────
// 2. 레벨 / 칭호 계산
// ─────────────────────────────────────────────────────────────
// 커밋 기반 레벨: 레벨이 오를수록 더 많은 커밋 필요 (제곱 곡선)
function levelInfo(commits) {
  // 누적 필요 커밋: 10 * lvl^1.5
  // 제곱(L^2)보다 완만해 고렙 구간이 덜 가파름. Lv.100 = 정확히 10,000 커밋.
  const needFor = (lvl) => Math.round(10 * Math.pow(lvl, 1.5));
  let lvl = 1;
  while (needFor(lvl + 1) <= commits) lvl++;
  const base = needFor(lvl);
  const next = needFor(lvl + 1);
  const progress = next > base ? (commits - base) / (next - base) : 0;
  return { level: lvl, progress, toNext: next - commits };
}

function titleFor(s) {
  if (s.currentStreak >= 30) return "Unstoppable Machine";
  if (s.stars >= 100) return "Open Source Hero";
  if (s.fixRatio >= 0.5) return "Bug Hunter";
  if (s.languages >= 8) return "Polyglot Sage";
  if (s.prsMerged >= 100) return "Merge Master";
  if (s.commits >= 1000) return "Code Warrior";
  if (s.currentStreak >= 7) return "Steady Grinder";
  return "Rising Adventurer";
}

const classFor = (s) =>
  s.fixRatio >= 0.45
    ? "🛡️ Guardian"
    : s.languages >= 6
    ? "🧙 Mage"
    : s.prsMerged >= 50
    ? "⚔️ Knight"
    : "🗡️ Rogue";

// ─────────────────────────────────────────────────────────────
// 3. 렌더링
// ─────────────────────────────────────────────────────────────
function bar(ratio, width = 20) {
  const f = Math.round(Math.min(Math.max(ratio, 0), 1) * width);
  return "█".repeat(f) + "░".repeat(width - f);
}

// 스탯 값을 0~1로 정규화해 막대로 (상한선은 적당히)
const norm = (val, max) => Math.min(val / max, 1);

// GitHub 핀 박스는 Gist 내용의 첫 5~6줄만 보여주므로:
//   - 레벨 / EXP / 칭호 / 직업 → 파란 헤더(=파일명)로
//   - 본문 → 스탯 5줄만 (빈 줄·구분선 없이)
function buildCard(s) {
  const { level, progress } = levelInfo(s.commits);
  const title = titleFor(s);
  const classEmoji = classFor(s).split(" ")[0];
  const fixPct = Math.round(s.fixRatio * 100);
  const expPct = Math.round(progress * 100);

  // 핀에 보이는 파란 헤더
  const header = `🎮 Lv.${level} ${title} ${classEmoji} · EXP ${expPct}%`;

  const rows = [
    ["⚔️", "commits", String(s.commits), norm(s.commits, 2000)],
    ["🛡️", "PRs", String(s.prsMerged), norm(s.prsMerged, 200)],
    ["✨", "langs", String(s.languages), norm(s.languages, 12)],
    ["🔥", "streak", `${s.currentStreak}d`, norm(s.currentStreak, 30)],
    ["💀", "fix%", `${fixPct}%`, s.fixRatio],
  ];

  // 이모지는 JS 길이가 제각각이라(✨=1, ⚔️=2) 패딩은 ASCII 라벨에만 적용
  const content = rows
    .map(([emoji, label, val, ratio]) => {
      const value = val.padStart(6);
      return `${emoji} ${label.padEnd(8)}${value}  ${bar(ratio, 14)}`;
    })
    .join("\n");

  return { title: header, content };
}

// ─────────────────────────────────────────────────────────────
// 4. Gist 덮어쓰기
// ─────────────────────────────────────────────────────────────
async function updateGist(title, content) {
  const getRes = await fetch(`${API}/gists/${GIST_ID}`, {
    headers: { Authorization: `bearer ${GH_TOKEN}` },
  });
  if (!getRes.ok) throw new Error(`Gist 조회 실패: ${getRes.status} ${await getRes.text()}`);
  const gist = await getRes.json();
  const oldFilename = Object.keys(gist.files)[0];

  const patchRes = await fetch(`${API}/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `bearer ${GH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: { [oldFilename]: { filename: title, content } },
    }),
  });
  if (!patchRes.ok)
    throw new Error(`Gist 업데이트 실패: ${patchRes.status} ${await patchRes.text()}`);
}

// ─────────────────────────────────────────────────────────────
function mockStats() {
  if (process.env.MOCK) return JSON.parse(process.env.MOCK);
  return {
    login: "your-name",
    commits: 1482,
    prsMerged: 214,
    languages: 11,
    stars: 87,
    fixRatio: 0.38,
    currentStreak: 23,
    longestStreak: 51,
  };
}

async function main() {
  const stats = process.env.DEMO ? mockStats() : await fetchStats();
  const { title, content } = buildCard(stats);

  console.log(title);
  console.log(content);

  if (process.env.DEMO) {
    console.log("\n(DEMO 모드 — Gist는 건드리지 않음)");
    return;
  }
  await updateGist(title, content);
  console.log("\n✅ Gist 업데이트 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
