# Call Advice Plan

This note records future beginner guidance for human pon/chi decisions. MVP-4.4 does not implement this UI; it only keeps the design ready while CPU call frequency and multi-meld layout are tuned.

## Goal

When the human can pon or chi, the app should eventually explain whether calling is probably helpful:

- "This pon looks good."
- "This chi may help, but it removes riichi."
- "This call looks risky because no yaku is visible."

The advice should stay short in the table UI, with details available in the existing advice/modal surfaces.

## Guidance Available Before Scoring

These checks do not require point calculation:

- Yakuhai pon is recommended for white, green, red, seat wind, and round wind.
- Tanyao-visible chi is mildly recommended when the hand is mostly 2-8 number tiles.
- A call that leaves tenpai is recommended more strongly.
- A call with no visible yaku should show a caution.
- If the hand appears close to closed riichi, suggest considering skip.
- Explain that calling prevents riichi.
- Explain that calling removes menzen-tsumo.
- If the player has already opened the hand and has a visible yaku route, additional useful calls can be more acceptable.

## Guidance To Improve After Scoring

Once point calculation exists, call advice can consider:

- Whether the call makes the hand much cheaper.
- Whether closed riichi has better value.
- Whether the dealer should prioritize speed.
- Round and placement conditions.
- Dora and red-five value.
- Honba, riichi sticks, and future score movement.

## UI Direction

- Keep the table button area compact.
- Put only a short label near the call options, such as "おすすめ" or "注意".
- Use the advice popup for explanations.
- Do not block quick calls for experienced users.
- Keep pon/chi candidate buttons large enough for smartphone landscape.

## Deferred Work

- Full expected-value calculation.
- Furiten-aware call advice.
- Defense and dangerous discard guidance.
- Call advice tied to future CPU difficulty settings.
