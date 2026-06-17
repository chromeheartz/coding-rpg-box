# 🎮 coding-rpg-box

내 GitHub 활동을 **RPG 캐릭터 스탯 카드**로 바꿔서 Pin된 Gist에 매일 자동 갱신한다.

```
🎮 your-name.exe  —  Lv.13  🧙 Mage
──────────────────────────────────────────────
  EXP  ████████████░░░░░░░░  60%  (다음까지 86)

  ⚔️  ATK  commits      1482   █████████░░░
  🛡️  DEF  PRs merged    214   ████████████
  ✨  INT  languages      11   ███████████░
  🔥  STR  streak        23d   █████████░░░
  💀  LCK  fix %         38%   █████░░░░░░░

  🏅 Title: "Polyglot Sage"
  ⭐ Stars earned: 87   ·   🏆 Best streak: 51d
```

## 스탯 매핑

| 스탯 | 의미 | 출처 |
|------|------|------|
| **Lv / EXP** | 누적 커밋 (제곱 곡선 — 위로 갈수록 빡셈) | 내 레포 커밋 합 |
| ⚔️ **ATK** | 총 커밋 수 | `history.totalCount` |
| 🛡️ **DEF** | 머지된 PR 수 | `pullRequests(MERGED)` |
| ✨ **INT** | 사용 언어 종류 수 | 레포 언어 |
| 🔥 **STR** | 현재 연속 커밋(streak) | 기여 캘린더 |
| 💀 **LCK** | 커밋 중 fix/bug 비율 | 커밋 메시지 (최근 샘플) |
| 🏅 **Title / Class** | 위 스탯 조합으로 자동 부여 | — |

## 미리보기 (셋업 없이)

```bash
DEMO=1 node index.js
```

## 셋업 (5단계)

### 1. 이 폴더를 GitHub 레포로 push

```bash
cd coding-rpg-box
git init
git add .
git commit -m "init: coding rpg box"
# GitHub에서 빈 레포를 만든 뒤 remote 추가 후 push
```

### 2. 빈 Gist 만들기

1. https://gist.github.com 접속
2. 아무 파일이나 하나 만들기 (예: 파일명 `🎮 dev-stats`, 내용 `loading...`)
3. **Create public gist**
4. 주소창의 ID 복사 → `https://gist.github.com/your-name/`**`이부분이_GIST_ID`**

### 3. Personal Access Token 발급

- https://github.com/settings/tokens → **Generate new token (classic)**
- 권한 체크: **`repo`** + **`gist`** + **`workflow`**
- 토큰 복사 (한 번만 보임)

### 4. 레포 Secrets에 등록

레포 → **Settings → Secrets and variables → Actions → New repository secret**

| 이름 | 값 |
|------|----|
| `GH_TOKEN` | 발급한 토큰 |
| `GIST_ID` | 2번에서 복사한 Gist ID |

### 5. 프로필에 Pin

- 본인 프로필 → **Customize your pins** → 방금 만든 Gist 선택

끝! Action이 매일 한국시간 오전 7시에 돌면서 Gist를 갱신합니다.
바로 한 번 돌려보고 싶으면 레포 **Actions 탭 → Update RPG stats box → Run workflow** 누르세요.

## 커스터마이징

| 바꾸고 싶은 것 | 위치 |
|----------------|------|
| 레벨 곡선 (난이도) | `levelInfo()` 의 `needFor` |
| 칭호 / 직업 조건 | `titleFor()`, `classFor()` |
| 스탯 막대 상한선 | `buildCard()` 의 `norm(val, max)` |
| 갱신 주기 | `.github/workflows/schedule.yml` 의 cron |

## 참고

- 커밋 수는 **내가 author인** 커밋만 집계 (`history(author:)`).
- streak는 GitHub 기여 캘린더(최근 1년) 기준.
- 이모지 폭 때문에 막대 정렬이 1~2칸 어긋나 보일 수 있어요 — Gist(monospace)에선 대체로 깔끔하게 나옵니다.
- 의존성 없음 (Node 20 내장 `fetch`).
