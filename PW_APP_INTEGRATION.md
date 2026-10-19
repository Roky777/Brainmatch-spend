# PW Games app integration

All ten variants share `shape-friends/save.js`, `engine.js`, and `analytics.js`.

## Local save and resume

Each game uses `brainmatch:<variant-id>:v1` in localStorage. Existing XP, unlocks,
discoveries and sound settings remain compatible. In-progress saves add the
exact shuffled deck, matches, scores, turn, first child pick, observed cards,
world, board, difficulty, mode and analytics session. Reopening shows the last-used
theme's home screen. Only Continue restores the saved board; choosing a mode and
difficulty creates a fresh board. A resolved transition is restored after its result;
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
It is also available as numeric `journeyXpTotal` with `campaignXpCap: 200`.
These cumulative fields are informational, NOT another XP award to add.

Reporting version 3 follows XP rule version 2: only `difficulty:mode` identifies
an XP claim. Themes and hidden curriculum boards never create another reward.
`activityId` is e.g. `gentle:practice`; `level.levelId` is namespaced as
`difficulty:gentle:practice` to distinguish it from old theme-based reporting.
`level.levelNumber` and `highestLevelPlayed` use the six numeric activity IDs
1–6 (Easy Practice, Easy Beat Sparky, Medium Practice, Medium Beat Sparky,
Hard Practice, Hard Beat Sparky). The curriculum board remains in
`rawData.curriculum_level`. Theme and board are informational only.

| Difficulty | Practice | Beat Sparky |
| --- | ---: | ---: |
| Easy | 30 | 20 |
| Medium | 40 | 25 |
| Hard | 50 | 35 |

All six first completions total 200 with no completion bonus. Replays in any
theme or on another hidden board award zero for that same difficulty/mode.
Old totals are preserved as proportional credit across the six new rewards:
for each slot, credit is the difference of consecutive cumulative floors of
`oldTotal × cumulativeReward / 200`. This preserves every integer total exactly.
The next first clear awards only the unearned part of that slot; completing all
six reaches exactly 200. Old claims cannot reveal the played difficulty, so they
are not fabricated into difficulty completions. Credits and new claims are saved
under `xpRuleVersion: 2`, `xpCredits`, and `xpClaims`; migration itself emits no
new analytics award. Old manifests' rewards are retained under `legacyXP` only
for inferring totals from saves that predate an explicit XP total.

Resumed legacy runs keep their run ID but adopt the new activity identity when
they next finish. Already queued historical reports retain their original
identity and award amounts; rewriting or replaying them could double count XP.

Game IDs default to the variant IDs. If PW has catalog IDs, launch with
`?gameId=<PW-catalog-id>`; the game's local save key stays variant-specific.
Sessions retain their `runId` across resume. The host should deduplicate by
`gameId` + `runId` + `level.levelId`, since a bridge call is not a server receipt.
Completions are written to the sorter's shared localStorage queue
`ignite_pending_sessions_jsplugin` BEFORE delivery. A false bridge return,
exception or rejected promise retains the report. Promise-based bridge responses
have a 2.5-second deadline. Pending reports retry on startup, online, host config,
pageshow, foregrounding, and with a 1–30 second backoff for late-injected bridges.
One serialized flush prevents overlapping retries; reports created during a flush
are preserved. Old zero-XP reports may be pruned after 100 entries, but unsent
positive-XP awards are not silently discarded at that threshold. If localStorage
is unavailable/full, delivery still attempts directly but cannot guarantee a
durable retry.

The last 100 bridge-accepted reports are archived under
`brainmatch:analytics-delivery:v1` for diagnosis. This status is NOT a server
receipt, and the archive is never automatically replayed. Existing reported XP
cannot safely be backfilled merely by subtracting the app screenshot total from
the game's local total: there is no account-scoped server receipt or reconciliation
API in the supplied bridge. Host-side deduplication remains necessary when a
timed-out async bridge later accepts a retried run.
No child names, account identifiers or other personal data are collected.

For an iframe, send `{type:'ANALYTICS_CONFIG', parentOrigin: location.origin}`
from the parent to configure the target origin. Only messages from the parent
whose declared origin matches the actual message origin are accepted. Until
configuration arrives, the compatibility fallback is `'*'`, as in the supplied
game. Native WebView DOM storage and receipt/deduplication need validation in PW;
browser/unit tests cannot verify the app's server-side analytics ingestion.
