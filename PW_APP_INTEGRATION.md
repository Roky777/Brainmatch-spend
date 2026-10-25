# PW Games app integration

## Fresh-data release reset

Release `fresh-start-2026-10` performs one local reset per variant before the
runtime reads saves or starts analytics. It removes that variant's previous
anonymous/account saves (including XP, unlocks, settings and unfinished boards),
campaign records, and identifiable old outbox/history entries. It does not use
`localStorage.clear()` or touch unrelated apps. A release marker makes the reset
one-time, so newly earned progress persists normally. Cache-busted entrypoints
load this reset before the game. Backend records and app-injected progress are
not erased by a browser-side reset; resetting those requires the app/backend.

All ten variants share `shape-friends/save.js`, `engine.js`, and `analytics.js`.

## Local save and resume

Browser-only games use `brainmatch:<variant-id>:v1` in localStorage. When the app
injects valid `window.userInfo`, saves are scoped by variant, app game ID and user
ID (`brainmatch:<variant>:user:<encoded-user>:game:<encoded-game>:v1`). Anonymous
progress is not automatically attributed to a signed-in child. Unlocks,
discoveries and sound settings remain compatible. Old XP resets once under
the fresh-data release, as requested; new XP then persists normally. In-progress saves add the
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
`window.userInfo.UserID` and `.GameID` map to `userId` and `gameId`; display names
are ignored. Injection is re-read at home, before choosing a mode or continuing,
and after native message notifications (from the actual global, not message data).
App identity takes precedence over the query-string game ID. Valid app/local
`highestLevelPlayed` values are positive safe integers merged with `Math.max`. The
home screen remains visible; the corresponding difficulty receives focus when
the child opens the picker. Progress alone never creates an XP claim. Existing
explicit Continue restores only this child's saved board. Account changes on
native notification checkpoint the old account and return to the new account's home.

## Analytics contract

Uses the level-wise contract in
`BrainMatch-main/js-analytics-bridge/analytics-bridge.esm.js` (`submitLevel` and
`validateLevelPayload`), also compatible with the supplied sorter. Older Markdown
examples describe cumulative reports and conflict with this executable contract.
Delivery preference:

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

Reporting version 4 retains the supplied wire format and now uses XP rule 4.
Every completed board is eligible, including replaying the same board/difficulty.
`activityId` (e.g. `gentle:practice`) describes the chosen mode; it is NOT a claim
or backend deduplication key. The numeric reporting level advances on every
completion, starting above the maximum of saved and injected progress, rather
than recycling six difficulty IDs. `levelId` is that number as a string;
`levelNumber` and `highestLevelPlayed` are numbers with no six-level clamp.
Curriculum board, theme, mode and difficulty remain metadata.

| Difficulty | Practice | Beat Sparky |
| --- | ---: | ---: |
| Easy | 10 | 15 |
| Medium | 10 | 15 |
| Hard | 10 | 15 |

The existing 200-XP cap remains. The last reward is limited to the remaining XP;
after 200, performance reports still submit with zero XP. Completed-board IDs
(`runId:levelNumber`) are stored in `xpCompletionIds` to prevent duplicate callbacks
from paying twice. A new replay uses a new reporting level and can earn again.
Migration preserves previously earned totals and clears obsolete six-slot claims;
it sends no backfill reward and does not introduce another fresh-data reset.

As in the supplied sorter, a report describes one completed level:
`diagnostics.levels` contains just that `level`, with tasks and their allocated XP.
The score is recorded in `level.score` and `rawData.score`. A continuous run uses
one game-generated ID across different completed levels. Reloading/new launches,
returning home, starting level 1, or replaying an already-submitted level creates
a new run, as in the reference integration. Explicit Continue restores the
unfinished board's saved run ID. Repeated completion callbacks do not resubmit.
Replays receive the same mode reward until the cap. Retried reports always keep
their original run/level identity and exact XP delta; never regenerate IDs on retry.

Game IDs use injected `GameID` first, then a query-string override, then the
variant ID. If no identity is injected and PW has catalog IDs, launch with
`?gameId=<PW-catalog-id>`; the game's local save key stays variant-specific.
Sessions retain their `runId` across resume. The host should merge levels under
`gameId` + `runId`, and deduplicate by
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
No display names or user IDs are added to analytics payloads or logs. The
app-provided user ID is used locally for save keys and an outbox ownership marker;
that marker is stripped before delivery. Reports owned by another child remain
queued until that child's app session is active, rather than being misattributed.

For an iframe, send `{type:'ANALYTICS_CONFIG', parentOrigin: location.origin}`
from the parent to configure the target origin. Only messages from the parent
whose declared origin matches the actual message origin are accepted. Until
configuration arrives, the compatibility fallback is `'*'`, as in the supplied
game. Native WebView DOM storage and receipt/deduplication need validation in PW;
browser/unit tests cannot verify the app's server-side analytics ingestion.
This client reset cannot delete existing backend records or reset the app's XP.
Whether the host creates a ticket per call is controlled by its handler; the
game now supplies stable run and level IDs for merging, not new session IDs.
