# MVP-4.0 CPU Call Plan

MVP-4.0 is a design-only milestone for CPU pon and chi. CPU calls change game pace, yaku visibility, turn flow, riichi decisions, and the four-direction table UI, so the first step is to define a deliberately small, testable scope before implementation.

No production code, UI, or tests are implemented in this milestone.

## Purpose

- Decide when CPU players may pon or chi.
- Keep CPU calls readable and not too frequent.
- Preserve human reaction choices.
- Reuse existing open-hand yaku behavior where possible.
- Prepare CPU meld display for the MVP-3.4 four-direction table layout.
- Define implementation order, scenarios, and Go / No-Go conditions.

## First Implementation Scope

Recommended scope for MVP-4.1 and MVP-4.2:

- CPU pon.
- CPU chi.
- CPU discard after a call.
- CPU meld display in the existing four-direction table.
- Simple one-caller resolution when multiple CPU players can call.
- Existing yaku detection for open yakuhai and open tanyao.
- Existing discard evaluator for post-call discard choice.
- RNG injection for stable tests.

Out of first scope:

- Kan.
- CPU call difficulty settings UI.
- Full multi-player call competition.
- Multiple ron.
- Head bump / atamahane.
- Kuikae.
- Furiten.
- Scoring and point movement.
- Riichi stick / deposit handling.

## State And Helper Direction

Reuse the existing `player.melds` shape introduced for human calls:

```js
player.melds = [
  {
    type: "pon",
    tiles: [...],
    calledTile,
    fromPlayerId
  },
  {
    type: "chi",
    tiles: [...],
    calledTile,
    fromPlayerId
  }
];
```

Design notes:

- Treat `player.melds.length > 0` as open-hand state.
- A CPU in riichi cannot call.
- A CPU with any meld cannot declare riichi later.
- Do not create CPU-only meld structures if the human structure can be shared.
- Keep helpers UI-independent so they can be tested without DOM.

Candidate helper names:

```js
getCpuPonOptions(state, cpuId)
getCpuChiOptions(state, cpuId)
evaluateCpuPonDecision(state, cpuId, option, context)
evaluateCpuChiDecision(state, cpuId, option, context)
findCpuCallWinner(state, discard, context)
resolveCpuCallAfterDiscard(state, context)
selectCpuDiscardAfterCall(state, cpuId, context)
```

The exact names can follow existing action/helper naming.

## CPU Pon Judgment

A CPU can pon if another player discards a tile and the CPU has at least two matching hand tiles. The CPU should not pon every available pair.

Pon-friendly conditions:

- Yakuhai pon:
  - White.
  - Green.
  - Red.
  - Self wind.
  - Round wind.
- Toitoi direction is visible.
- The CPU already has many pairs or triplets.
- The CPU is already open and has a visible yaku route.
- The call improves tenpai or near-tenpai shape.
- The pair contributes to a yaku rather than being an isolated ordinary pair.

Pon-unfriendly conditions:

- CPU is in riichi.
- No yaku is visible after opening.
- The hand appears close to closed riichi.
- The pair is an ordinary middle-tile pair in a distant hand.
- Calling would make the hand likely no-yaku.
- The discard is dora or near dora and the value impact is unclear.

Initial probability guidance:

- Dragon pon: 70%.
- Self-wind / round-wind pon: 70%.
- Toitoi-leaning pon: 45%.
- Already-open yaku-visible pon: 55%.
- Ordinary pair pon with no yaku route: 5% or skip.

These numbers are not scoring logic. They are guardrails to avoid unnatural over-calling and must be controlled through injected RNG in tests.

## CPU Chi Judgment

A CPU can chi only the upper player's suited-number discard if two hand tiles complete a sequence. Chi should be less common than pon because it can easily create no-yaku open hands.

Chi-friendly conditions:

- Tanyao direction is visible.
- The hand is mostly 2 through 8 suited tiles.
- The chi keeps or creates a visible yaku route.
- The CPU is already open with tanyao or yakuhai direction.
- The chi reaches tenpai or clearly improves shape.
- The chi fixes a bad wait or weak shape.

Chi-unfriendly conditions:

- CPU is in riichi.
- The discard is not from the CPU's upper player.
- The chi includes terminal tiles and yaku is unclear.
- The CPU appears close to closed riichi.
- The hand is still far from completion.
- Multiple chi candidates exist and none is clearly better.
- The post-chi discard would be unstable or likely break the hand.

Initial probability guidance:

- Clear open tanyao chi: 40%.
- Chi that reaches tenpai with a yaku route: 50%.
- Already-open tanyao continuation chi: 45%.
- Ambiguous chi with no yaku route: 0% to 5%.
- Terminal-heavy chi with no yakuhai/toitoi support: skip.

Use deterministic scoring first, then RNG as a final threshold.

## CPU Call And Riichi Relationship

Rules:

- CPU in riichi cannot pon or chi.
- CPU with melds cannot declare riichi.
- CPU that calls must continue as an open hand.
- CPU tsumo after opening must not receive menzen-tsumo.
- CPU win after opening still requires yaku.

Priority guidance:

- If a closed CPU can currently discard into riichi-ready tenpai, prefer the existing CPU riichi path over speculative calls.
- If the CPU is far from riichi and has a clear yakuhai/tanyao route, allow calls.
- If the CPU is already open and has yaku visible, additional calls can be slightly more likely.
- CPU call judgment should happen after immediate ron checks.

## Reaction Priority

The target reaction priority is:

1. Ron.
2. Pon.
3. Chi.
4. Skip / pass.

Recommended MVP behavior:

- Human ron reaction remains highest priority.
- If the human can ron, show the existing human ron/skip UI and do not auto-call CPU first.
- Human pon/chi remains a player choice.
- If the human can pon/chi, show the human call UI first.
- CPU ron is checked before CPU calls.
- CPU calls should be considered only when no human reaction is currently waiting, or after the human explicitly skips if that flow is implemented.
- Multiple CPU callers are resolved simply in turn order for the first CPU call MVP.
- If one CPU can pon and another can chi, pon wins.
- If several CPUs can pon, choose the first eligible CPU in turn order.
- Full multiple ron and head-bump rules remain deferred.

Open question for MVP-4.1:

- Whether CPU call resolution happens immediately when the human has no reaction, or after a short visible "CPU thinking" pause. The initial implementation can be immediate for simplicity.

## CPU Call After Human Skip

Human choice matters. Two possible designs:

Option A, recommended first:

- If the human has a reaction, wait for human choice.
- If the human skips, then evaluate CPU ron and CPU calls.
- This preserves human agency and matches the current teaching focus.

Option B:

- If human can call but CPU can pon, show a combined timing window.
- This is closer to real competition but adds UI complexity.

MVP-4.1 should use Option A unless implementation risk suggests otherwise.

## CPU Discard After Calling

After a CPU pon or chi, the CPU must discard one tile.

Recommended behavior:

- Reuse `evaluateDiscardCandidates`.
- Pass open-hand context and current melds.
- Prefer discards that keep the visible yaku route.
- After yakuhai pon, do not break the completed yakuhai meld.
- After tanyao chi, make 1/9/honor tiles more discardable.
- Avoid discards that leave a complete shape with no yaku when a yaku-preserving alternative exists.
- Keep a fallback: if evaluation returns no candidate, discard the last legal hand tile or use existing CPU fallback logic.

Post-call discard should still go through game actions, not direct UI mutation.

## Open-Hand Yaku Behavior

Reuse existing human open-hand behavior:

- Yakuhai pon is yaku-valid.
- Open tanyao is allowed under the current beginner-friendly kuitan-ari policy.
- Open no-yaku hands cannot win.
- Open tsumo does not receive menzen-tsumo.
- Open hands cannot declare riichi.
- Riichi is not added to CPU wins unless the CPU declared riichi before opening, which should be impossible.

Test open-hand CPU yaku with both tsumo and ron paths where possible.

## CPU Meld UI

CPU melds should appear in the four-direction table without revealing CPU closed hands.

Placement:

- CPU1: right-side meld lane near the CPU1 seat.
- CPU2: top meld lane near the CPU2 seat.
- CPU3: left-side meld lane near the CPU3 seat.
- Human meld lane remains near the bottom hand/support area.

Orientation:

- Human meld tiles: 0deg.
- CPU1 meld tiles: -90deg.
- CPU2 meld tiles: 180deg.
- CPU3 meld tiles: 90deg.

Layout requirements:

- CPU meld lanes must not overlap discard rivers.
- CPU meld lanes must not cover the gear button.
- CPU meld lanes must not cover seat markers.
- Multiple melds should remain in each player's lane with internal scrolling or compact wrapping if needed.
- Round-end all-hands review may show both closed hand and melds for learning.

MVP-4.1 should start with existing meld rendering patterns and strengthen layout checks for CPU meld lanes.

## Anti Over-Calling Controls

CPU calls need deliberate throttling.

Recommended controls:

- Always skip if CPU is in riichi.
- Skip most no-yaku calls.
- Lower call probability if the CPU is closed and close to riichi.
- Raise call probability slightly when the CPU is already open and has yaku visible.
- Prefer yakuhai pon over ordinary pon.
- Prefer clear tanyao chi over terminal-heavy chi.
- Add a per-hand soft cap if real-device play shows too many CPU calls, such as "avoid more than two speculative calls without tenpai."
- Keep RNG injected so tests can force call or skip.

Initial probability table:

| Situation | Suggested chance |
| --- | ---: |
| Dragon pon | 70% |
| Self/round wind pon | 70% |
| Toitoi direction pon | 45% |
| Already-open yaku-visible pon | 55% |
| Ordinary no-yaku pon | 0-5% |
| Clear tanyao chi | 40% |
| Chi to yaku-valid tenpai | 50% |
| Already-open tanyao continuation chi | 45% |
| No-yaku chi | 0-5% |
| Closed hand close to riichi | reduce by 30-50 points |

These are starting points, not final difficulty tuning.

## Scenario Plan

Add deterministic scenarios before implementing:

- `cpu-pon-ready-yakuhai`
- `cpu-pon-ready-toitoi`
- `cpu-pon-no-yaku-avoid`
- `cpu-chi-ready-tanyao`
- `cpu-chi-not-kamicha`
- `cpu-chi-no-yaku-avoid`
- `cpu-call-riichi-blocked`
- `cpu-call-after-human-skip`
- `cpu-multiple-call-candidates`
- `cpu-open-hand-win-yakuhai`
- `cpu-open-hand-win-tanyao`
- `cpu-open-hand-no-yaku-rejected`
- `cpu-call-discard-continues`
- `cpu-call-meld-display`

## Test Plan

Core tests:

- CPU pon availability.
- CPU pon rejection with only one matching tile.
- CPU pon blocked while riichi.
- CPU chi availability from upper player.
- CPU chi blocked from non-upper player.
- CPU chi blocked for honors.
- CPU call decision respects injected RNG.
- CPU call decision favors yakuhai pon.
- CPU call decision avoids no-yaku chi.
- Multiple CPU call candidates choose one caller by simple priority.
- Pon wins over chi if both are possible.
- CPU call creates a meld and removes hand tiles.
- CPU call marks the hand open.
- CPU call blocks later riichi.
- CPU discard after call returns the game to normal turn flow.
- CPU open yakuhai/tanyao wins include yaku.
- CPU open no-yaku completed hand is rejected.
- CPU open tsumo does not include menzen-tsumo.

UI tests:

- CPU melds render for CPU1/CPU2/CPU3.
- CPU meld tiles rotate by seat direction.
- Multiple CPU melds stay in the CPU meld lane.
- CPU melds do not reveal closed CPU hand tiles.
- Result/all-hands popup remains readable with CPU melds.

Layout checks:

- `cpu-pon-reaction` or `cpu-pon-called`.
- `cpu-chi-called`.
- `cpu-multiple-melds`.
- `cpu-open-hand-win`.
- CPU meld lanes do not overlap rivers, hand, gear menu, or seat markers.
- Page-level overflow remains absent in all smartphone landscape viewports.

Regression tests:

- Human pon/chi still work.
- Human and CPU riichi still work.
- CPU tsumo/ron still work.
- Advice, yaku guide, waits, all-hands, result, and gear menu still work.

## Implementation Order

Recommended staged path:

1. MVP-4.1 CPU pon core + UI
   - CPU pon availability.
   - CPU pon decision with RNG.
   - CPU pon meld state.
   - CPU post-pon discard.
   - CPU pon meld display.
   - Yakuhai/toitoi-focused tests.
2. MVP-4.2 CPU chi core + UI
   - CPU chi availability from upper player.
   - CPU chi decision with RNG.
   - CPU chi meld state.
   - CPU post-chi discard.
   - Tanyao-focused tests.
3. MVP-4.3 CPU open-hand stability
   - Open yaku validation.
   - No-yaku rejection.
   - No menzen-tsumo.
   - Next-round meld cleanup.
   - All-hands/result display with CPU melds.
4. MVP-4.4 CPU call frequency tuning
   - Real-device review.
   - Adjust probabilities only if needed.
   - Add lightweight simulation diagnostics for call frequency.
5. MVP-5.0 scoring display / scoring calculation design.
6. Kan remains later than scoring design unless a narrower design is approved.

## Go / No-Go Conditions

Go for MVP-4.1 when:

- This design is accepted.
- Human pon/chi, riichi, CPU win, and table UI are stable on `main`.
- CPU pon scenarios are written before or with implementation.
- The team accepts simple turn-order priority for multiple CPU callers.
- The team accepts beginner-friendly kuitan-ari open tanyao.

No-Go / defer when:

- Human reaction priority is unclear.
- CPU calls would require large UI redesign.
- Existing open-hand yaku tests are unstable.
- Layout guard cannot fit CPU meld lanes in smartphone landscape.
- CPU calls make play feel too chaotic without an anti over-calling throttle.

## Open Questions To Revisit After MVP-4.1

- Should CPU call decisions wait visually for a short pause?
- Should human skip always allow CPU calls immediately afterward?
- Should CPU call frequency vary by seat, hand progress, or round number?
- Should dora-related calls be more conservative before scoring exists?
- Should all CPU melds show called-tile source direction before scoring work?
