# PW Games app integration

All ten variants share `shape-friends/save.js`, `engine.js`, and `analytics.js`.

## Local save and resume

Each game uses `brainmatch:<variant-id>:v1` in localStorage. Existing XP, unlocks,
discoveries and sound settings remain compatible. In-progress saves add the
exact shuffled deck, matches, scores, turn, first child pick, observed cards,
world, board, difficulty, mode and analytics session. Reopening automatically
resumes the saved board. A resolved transition is restored after its result;
an interrupted two-card choice is closed without scoring it twice. Interrupted
Sparky choices restart safely. Completed boards clear the in-progress save.

Saves happen on reveals, resolved pairs, turn changes, visibility changes and
pagehide. Corrupt or outdated decks are ignored. Storage errors never crash play.
Persistence is per browser/WebView origin, not a cloud or cross-device save.
The PW app must enable DOM storage and retain its WebView storage between launches.
If multiple children share a WebView profile, their storage must be separated by
the host; no PW user identifier was supplied to these games.

## Analytics contract

Adapted from `Mini-s-Market-Sorter/src/core/analytics.js`. Delivery preference:

1. `window.myJsAnalytics.trackGameSession(payload)`
2. `window.ReactNativeWebView.postMessage(JSON.stringify(payload))`
3. `window.parent.postMessage(payload, configuredOrigin)` for an iframe

Only one bridge is used per delivery. The payload retains `gameId`, `name`,
`runId`, `highestLevelPlayed`, `level`, `xpEarned`, `xpEarnedTotal`, `rawData`,
`diagnostics`, and `timestamp`. Each child pair attempt is a task with its
correct partner, actual choice, success, active elapsed time and earned XP.
Companion attempts are not counted as child learning attempts. Raw data includes
world, round, difficulty, mode, attempts, accuracy, child score and journey XP.
XP exactly matches the existing game reward, including zero-XP replays;
`xpEarnedTotal` is this submitted session's XP, matching the supplied sorter.
Lifetime journey XP is in `rawData.journey_xp_total` (maximum 200).

Game IDs default to the variant IDs. If PW has catalog IDs, launch with
`?gameId=<PW-catalog-id>`; the game's local save key stays variant-specific.
Sessions retain their `runId` across resume. The host should deduplicate by
`gameId` + `runId` + `level.levelId`, since a bridge call is not a server receipt.
Pending completions use the sorter's shared localStorage queue
`ignite_pending_sessions_jsplugin` and retry on startup, online and host config.
The queue is bounded to the most recent 100 sessions to avoid unlimited storage.
No child names, account identifiers or other personal data are collected.

For an iframe, send `{type:'ANALYTICS_CONFIG', parentOrigin: location.origin}`
from the parent to configure the target origin. Only messages from the parent
whose declared origin matches the actual message origin are accepted. Until
configuration arrives, the compatibility fallback is `'*'`, as in the supplied
game. Native WebView DOM storage and receipt/deduplication need validation in PW;
browser/unit tests cannot verify the app's server-side analytics ingestion.
