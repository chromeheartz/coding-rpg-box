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

운세 박스와 동일합니다. **단, Gist는 새로 하나 더 만들어야 해요** (박스 1개당 Gist 1개).

1. 이 폴더를 GitHub 레포로 push
2. 새 빈 Gist 생성 → ID 복사
3. PAT 발급 (`repo` + `gist` 권한) — 운세 박스 토큰 재사용 가능
4. 레포 Secrets에 `GH_TOKEN`, `GIST_ID` 등록
5. 프로필에 Gist Pin

> Pin은 최대 6개까지 가능하니 운세 박스 + RPG 박스 둘 다 꽂을 수 있어요.

자세한 단계는 `commit-fortune-box`의 README와 동일합니다.

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
