# Sparky's shared game flow

All ten variants use the same narration controller. Speech is optional feedback,
never a lock on play, and skipped lines are never queued.

| Moment | Voice / reaction |
| --- | --- |
| Enter a board | One short mode introduction while the cards are previewed |
| Play again | Short “A new board!” line, not the full tutorial |
| First child match | Optional generic praise if the voice is free and quiet time has passed |
| Later matches | Silent happy nod |
| Second missed pair | Optional gentle reassurance; later misses use silent reactions |
| Sparky's first turn | Optional short thinking line |
| Sparky finds a pair | “I found a pair! My memory worked!” at most once per board, except the final pair |
| Sparky misses | “Oops, I missed that pair. Your turn!” at most once per board |
| A later handoff after a miss | “Your turn! Which two cards will you try?” at most once per board, instead of repeating the miss line |
| Hint or repeat tapped | Requested speech, with rapid-tap protection |
| Round finished | One result line, replacing lower-priority guidance |
| Return to a saved game | Welcome-back caption, no automatic repeated tutorial |

Reopening always shows the last-used world's home screen, not the saved board.
Continue appears only for a valid unfinished board in that world. Clicking it
restores the card order, matches, score, mode and difficulty. The mode cards still
open difficulty selection and create a fresh board. XP and world unlocks are kept.

XP is shared across themes and hidden boards. First completions award
Easy 30/20, Medium 40/25, Hard 50/35 (Practice/Beat Sparky), totalling 200.
Only difficulty and mode determine whether XP is already claimed. Old local XP
resets once for XP rule version 3; new XP persists normally. Unlocks, themes,
settings and saved boards stay intact. No theme-based XP or completion bonus remains.

When PW injects userInfo, saves are isolated by user and catalog game. App/local
highest-level progress selects the initial difficulty focus, never opens a board
automatically and never fabricates XP claims. A continuous analytics run shares
one ID across levels; new launches/home/replays start new runs. Explicit Continue
retains the unfinished board's run ID, and retries retain the original report ID.

## Interruptions

An accepted card flip stops current guidance and resets the mouth. Requested help
can replace introductory or optional speech. A new result replaces lower-priority
speech. Optional lines cannot interrupt any active line, and have a four-second
quiet interval after speech ends. Repeated requests within 1.2 seconds are ignored.

Navigation, new boards, settings, muting, and backgrounding cancel narration.
Cancelled callbacks cannot restart old mouth poses or unduck newer speech.
Muted or unavailable recordings remain caption-only. Background music is ducked
only while a voice actually starts; small match effects remain separate.

Every voice has a four-second readiness/start deadline. Once playing, a recording
has its duration plus two seconds to finish (capped at fifteen seconds). A timeout
unloads the audio, ends mouth animation and releases the narration channel. Late
media events cannot restart it. Delayed match/miss recordings also verify the
board, accepted-card-action counter and mascot pose revision before playback;
outdated reactions are discarded. Guidance preserves an ongoing observe/wand
animation instead of replacing it with the talking body pose.

Tapping Sparky in Beat Sparky requests the shipped, variant-neutral recording
“Your turn! Which two cards will you try?” rather than an unavailable greeting.
