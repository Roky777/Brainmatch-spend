# Card asset audit — all ten games

Reviewed all 294 manifest items in browser contact sheets at small-card size.

## Visual standard

Finished, softly modeled children's illustrations; clear silhouettes; one unmistakable subject; consistent spacing; transparent cutouts. Preserve exact quantities, clock hands, currency denominations and shadow contours. Keep text and mathematical diagrams deterministic rather than asking image generation to render them.

| Game | Findings / work |
| --- | --- |
| Shape Friends | Dream objects are finished and clear. Season icons use a deliberately outlined child-friendly system; retain their shapes and soften fills rather than replacing readable artwork. |
| Number Friends | Counting fingers and numerals are clear and correct. Quantity pictures have excessive empty space; improve their framing without changing counts. |
| Money Match | Preserve authentic currency photos and attribution. Improve visibility of small coin numerals with a denomination detail, not invented banknotes. |
| Body & Sound Match | Replace ambiguous head, skin and body-part emoji pictures. Reuse improved animal illustrations for phonics; replace king-like Queen picture with a clearly recognizable queen. Keep letters and short words exact. |
| Animal Action Match | Horse and lamb are finished storybook illustrations. Replace the mismatched emoji animals with full-body storybook pictures. |
| Animal Friends | Replace floating animal faces and simplified emoji animals with finished full-body illustrations. Reuse the same animal art across the games. |
| Shadow Match | Hand poses and matching silhouettes are clear; retain paired contours. Add consistent outline/soft highlights to the solid-object sources only. |
| Clock Match | Times and hand directions are correct. Improve numeral weight and dial readability; retain exact hand geometry. |
| Plant Match | Illustrations are detailed, correct and consistent; retain. Keep legible short function/type labels. |
| How Things Work | Objects are finished and identifiable. Align the ball with the finished Shape Friends rendering; retain authentic coin and other clear objects. |

## Replacement image briefs

Built-in image generation; one transparent subject per image. Premium softly painted storybook learning-card cutouts, gently modeled volume, crisp silhouette, subtle navy-brown contours, centered with safe margins; no text, frame, scenery, or watermark.

- Full-body monkey, frog, fish, bird, cat, lion, rabbit, elephant and snake (anatomically recognizable, friendly).
- A child's head; human eye with eyelids; ear; nose; mouth; open five-finger hand; leg; foot; forearm/skin with gentle touch to clearly convey skin.
- A friendly queen with long hair, crown and royal dress (not a king).

Generated originals are retained; installed assets use versioned names so previous artwork remains recoverable. Final checks: image validity/transparency, all manifest paths, exact pair mapping, thumbnail review, and game tests.

## Installed replacements

18 new built-in-generated illustrations are installed as `*-v2.png`:

- `animal-friends/assets/cards/`: monkey, frog, fish, bird, rabbit, elephant, snake.
- `animal-action-match/assets/cards/`: monkey, frog, fish, bird, cat, snake.
- `body-sound-match/assets/cards/`: eye, ear, nose, hand, mouth, head, leg, foot, skin, queen, cat, fish (ear/nose also reused by phonics).

These update 27 manifest card items. PNGs retain transparency and are resized to at most 512px for delivery; full-resolution generated originals remain available. Exact prompt set: `CARD_ART_PROMPTS.json` (built-in generation, no API/CLI fallback).

The lion generation failed twice, so the existing lion is retained in Animal Friends and phonics. A licensed alternative was reviewed but rejected for visual mismatch. No blocked generator output is used. A lion replacement remains outstanding if a fully uniform animal set is required.

Other changes: shaded native season icons, 22% larger counting-group artwork, clearer clock numerals, outlined solid-object sources (silhouette cards untouched), original coin denomination details (individual coins only, never hidden combination totals), and a shared finished beach-ball rendering in How Things Work. Plant artwork was reviewed and retained unchanged.
