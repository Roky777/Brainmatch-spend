# Shape Friends — Dream Brainmatch

Run `npm start` from the repository root and open http://127.0.0.1:4178/. No build or runtime dependencies. The repository and root route are dedicated to Shape Friends.

## Current experience

The current release is a portrait-mobile game. The home screen offers **Practice** and **Beat Sparky**; choosing one opens a separate three-level scene. The play, pause and result views each have one clear primary action. On a landscape phone, a turn-upright gate covers the game. Seated kimono Sparky appears beside the turn heading. See [design research](DESIGN_RESEARCH.md).

| Level | Cards | Sparky remembers |
| --- | ---: | --- |
| Little spark | 4 | Last 2 observed positions |
| Bright spark | 6 | Last 4 observed positions |
| Super spark | 8 | All revealed positions |

Practice gives every turn to the child. In Beat Sparky, each pair earns one point and another turn; a miss passes play to the other player. This rule applies equally to the child and Sparky. The result can be a child win, Sparky win or tie. No timer, penalty, purchases or retention pressure.

The matching screen contains cards, one compact turn/progress-or-score indicator, small seated Sparky, home and pause. No collection shelf, hint button, caption, rotation prompt, picnic activities or level selectors compete with the board. Result actions offer another board or return to setup. Home cancels the current turn and returns to setup.

Content remains the Grade 1 GDD **What is Long? What is Round?** pack: four authored sets of different objects sharing an overall shape. Difficulty levels are NOT grade labels; a full class 1–3 curriculum has not been authored. Smaller boards use the first two or three pairs of the selected set. Completing a board unlocks the next set; replay moves to it. Progress uses the existing isolated save key. Settings can select unlocked sets.

## Art and character

`studio.css` provides the base layout; `prototype.css` applies the current portrait art direction: sky-blue upper frame, a warm clear center, painted cloud edges and high-contrast star cards. The play board is free-standing, not boxed in. `cloud-reveal.js` opens a painted full-screen cloud cover from the board outward when a round begins, with a reduced-motion skip. The supplied seated kimono idle/blink sheet sits on the small cloud perch beside the heading. During voice playback Sparky holds this clean idle; the supplied speaking-loop draft is reserved for correction because its intermediate drawings do not register smoothly. During Sparky's turn, a code-drawn placeholder star flies from his wand toward a card; the flip occurs at star contact. The full wand cast and mouth-viseme sheets are still planned, not implemented. See [ASSETS.md](ASSETS.md) for sources and provenance. Earlier painted objects remain available; `prepare-painted-art.mjs` with the `dream` argument reproduces current object atlas extraction with cwebp.

The earlier kimono sheets and reaching-hand studies are preserved but are not the visible match character. Twenty-one local English MP3 clips are shipped. Device speech is a failure fallback. The supplied background music is edited into an exact 58-second loop with a gentle two-second crossfade; it starts after interaction, pauses when the settings dialog or page is hidden, and has its own toggle. Voice and effects have separate toggles; on-screen character captions are currently hidden.

**Voice limitation:** generated with AI Voice Generator's gentle `delicate` preset. Context and animation are implemented, but emotional acting has not been perceptually approved. No custom character-trained voice, microphone conversation or phoneme lip-sync. The assistant checked playback/decoding, not acting quality. Voice direction and clean scripts live in `voice/`.

## Architecture

- `engine.js`: hidden cards, input lock, practice/challenge turns, pair scores.
- `companion.js`: bounded observed-position memory; never receives hidden deck identities.
- `play-options.js`: level definitions, option validation and result classification.
- `dialogue.js`: context-specific rotating line banks.
- `app.js`: setup, round lifecycle, interaction, results, pause/cancellation.
- `audio.js`, `music.js`, `sparky.js`: local voice/effects, looping background music and sprite-frame reactions, ready for the later character pass.
- `cloud-reveal.js`: canvas-based cloud cover and board-centered reveal.
- `content.js`: stable item IDs, shape pairs and versioned dream-art URLs.
- `save.js`, `timeline.js`: isolated persistent progress and cancellable waits.

Earlier picnic modules/assets remain as source history but are not exposed in the current mode-first flow. Old discovery data is preserved. There is no analytics, account or child-data collection.

## Verification and reuse

`npm test` covers shape rules, scoring, mode transitions, fair memory, saves, audio failures, sprite frames and dialogue coverage.

With the local server and isolated Chrome debugging on port 9223:
```sh
node tests/shape-modes-browser.mjs
```
The old `shape-friends-browser.mjs` entry point delegates to this current suite. It plays all six mode/level combinations, checks portrait bounds, cloud reveal, local audio decoding/playback, score totals, pause, cancellation and reduced motion. See [QA.md](QA.md).

To reuse the template, author a new content pack, assign a distinct storage key and update labels/assets. Test curriculum accuracy and silhouettes with children and educators. This is not yet validated 30-minute engagement or device-lab Safari certification.
