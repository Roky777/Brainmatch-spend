# UI polish review

## Scope

Preserve the implemented themes, artwork, screen hierarchy, corner XP widget,
buttons and 4 / 6 / 8 card sizes. This pass fixes geometry and accessibility only.

## Changes

- The fixed scene uses `overflow: clip`, preventing dialog focus restoration from
  scrolling the hidden canvas and clipping the Worlds button above the screen.
- World chooser titles wrap within their header instead of touching the close
  button. Difficulty headings retain a reserved close-button lane.
- Keyboard navigation has an explicit focus ring, retaining the toy-button style.

## Browser checks

Local Chrome review at 320 × 568, with shared-screen spot checks at 375 × 667 and
768 × 1024. Each variant was visited separately; all ten were played through an
Easy practice round to inspect results. Number Friends also displayed its newly
unlocked-world dialog. The shared pause dialog fits the narrow viewport in all
ten games without scrolling.

| Variant | Home and difficulty | Worlds | Hard card fit | Result | Pause |
| --- | --- | --- | --- | --- | --- |
| Shape Friends | Checked | Checked | Checked | Checked | Checked |
| Number Friends | Checked | Checked | Checked | Checked | Checked |
| Money Match | Checked | Checked | Checked | Checked | Checked |
| Body & Sound Match | Checked | Checked | Checked | Checked | Checked |
| Animal Friends | Checked | Checked | Checked | Checked | Checked |
| Animal Action Match | Checked | Checked | Checked | Checked | Checked |
| Shadow Match | Checked | Checked | Checked | Checked | Checked |
| Clock Match | Checked | Checked | Checked | Checked | Checked |
| Plant Match | Checked | Checked | Checked | Checked | Checked |
| Discovery / How Things Work | Checked | Checked | Checked | Checked | Checked |

Hard-board image boxes remained inside the card faces in DOM geometry checks.
Results retain mascot headroom and fit their completion messages and XP summaries.
Loading art, Dream styling and Neon styling were visually inspected. Browser play
used only this local preview origin, not the deployed games.

## Suggestions only — not implemented

- On very narrow phones, four-column boards make longer words and groups of coins
  small. A larger board or different row arrangement could improve readability,
  but would change the intentional layout, so it remains a suggestion.
- The narrow-phone portrait orientation gate remains intentional and unchanged.

These checks do not establish flawless behaviour on every device, WebView or slow
network. This pass makes no new asset, progression or deployment changes.
