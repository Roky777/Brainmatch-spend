# Sparky wall-seat animation prompts

This file contains twelve independent prompts. Copy one complete prompt at a time. For every request, attach the original approved Sparky reference image. Starting with Prompt 2, also attach Frame 000 produced and approved from Prompt 1 as the wall-seat registration reference. Do not use the turquoise-overalls atlas as a costume reference.

---

## Prompt 01 — Wall-seated idle and blink

Create a production-ready animation package named `sparky_wall_idle_blink`.

The attached original Sparky image is a strict identity lock. Draw the same friendly childlike flame character: large asymmetric yellow flame head, orange inner shading, red-orange outer flame edge and tips, two short red eyebrows, two large oval black eyes with white highlights, small curved black smile, no nose, white four-finger gloves, and the same proportions. Do not redesign his face or flame silhouette.

Dress Sparky in his approved formal costume, not turquoise overalls: cobalt-blue Japanese-style kimono with long sleeves, cream V-shaped overlapping collar, golden-yellow waist sash, small round gold center clasp, dark-blue lower garment, and blue-and-cream shoes with small gold accents. His viewer-left hand holds a short brown wand with a small gold five-point star. His viewer-right glove rests palm-down on the invisible ledge for balance. Preserve these exact clothes and colors in every frame and in all later animation packages.

Sparky sits on the front edge of a separate wall. Do not draw the wall. Treat `y=300` as an invisible horizontal wall top on every 512×512 frame. Set the seated contact point near `seatAnchor=(256,300)`. His hips rest on that line, both thighs come forward over the edge, both knees bend naturally, and both lower legs hang in front. His shoes stay separate and fully visible. He must not float, squat, kneel, cross his legs, or sit on a cloud.

Deliver 16 individually numbered transparent sRGB PNG frames, each exactly 512×512 with straight alpha and at least 24 px clear padding. Use fixed camera, scale, face, flame outline, costume construction, seat position, mouth pivot, wand length and glove anatomy. No background, wall, cloud, shadow, text, grid, checkerboard, cards, interface, sparkles, travelling star, beam or confetti.

Frame plan and duration:

1. `000`, 900 ms: exact neutral; open eyes, closed smile, upright relaxed torso, wand steady, legs hanging.
2. `001`, 120 ms: chest begins a 1% inhale; shoulders rise 1 px; hips stay fixed.
3. `002`, 120 ms: inhale continues; tallest flame tip follows upward by at most 1 px.
4. `003`, 160 ms: inhale peak, maximum 2% chest expansion; no whole-body scaling.
5. `004`, 140 ms: exhale begins; shoulders and head settle smoothly.
6. `005`, 450 ms: nearly neutral; feet complete a tiny 2 px relaxed forward swing.
7. `006`, 70 ms: blink anticipation; upper eyelids soften slightly.
8. `007`, 42 ms: eyes 25% closed.
9. `008`, 42 ms: eyes 50% closed.
10. `009`, 42 ms: eyes 90% closed.
11. `010`, 84 ms: eyes gently fully closed.
12. `011`, 42 ms: eyes reopen to 15%.
13. `012`, 42 ms: eyes reopen to 50%; pupils remain registered.
14. `013`, 42 ms: eyes reopen to 85%.
15. `014`, 180 ms: fully open; feet, flame and chest settle.
16. `015`, 850 ms: pixel-identical to Frame 000 for an invisible loop.

Deliver the PNGs, a 4×4 review contact sheet, a 24 fps preview honoring variable durations, a preview composited over a temporary wall, and `animation-manifest.json`. The manifest must contain filenames, durations, loop points and measured `seatAnchor`, `mouthAnchor`, `wandHandPivot`, `wandTip`, and foot positions. Never invent anchor measurements. Reject any frame with identity drift, extra fingers, changing clothes, sliding hips, morphing flame points, changing wand length, clipped pixels, colored halo, or a first/last-frame pop.

---

## Prompt 02 — Arrive and settle onto the wall

Create `sparky_wall_arrive_settle`. Attach the original approved Sparky image as the identity reference and approved `sparky_wall_idle_blink_000.png` as the exact final pose.

Sparky must have the exact original flame face and the exact costume in the approved idle reference: cobalt-blue long-sleeved kimono, cream overlapping V collar, golden-yellow sash, round gold clasp, dark-blue lower garment, blue-and-cream shoes, white four-finger gloves, and short brown wand with a gold five-point star in the viewer-left hand. No turquoise overalls. Do not alter his colors, face, flame points, proportions or costume between frames.

Create 20 transparent 512×512 frames. The wall is separate and must never be painted. Its invisible top is `y=300`. Sparky enters from above, lands gently on that edge, moves both legs over the front, and finishes pixel-identical to the approved idle Frame 000. No flying effect, cloud, teleport, second bounce or hard impact.

Frame plan:

1. `000`: upper body enters from above; eyes look toward the wall position.
2. `001`: gentle downward motion; free hand prepares to balance.
3. `002`: hips approach the seat line; knees begin bending.
4. `003`: wand stays controlled; eyes lead downward.
5. `004`: thighs rotate forward toward the ledge edge.
6. `005`: viewer-right palm approaches the invisible wall top.
7. `006`: shoes move forward so the legs can clear the edge.
8. `007`: first light seat contact; mark `SEAT_CONTACT`.
9. `008`: hips settle onto `seatAnchor`; 2% compression only.
10. `009`: both legs pass fully in front of the wall plane.
11. `010`: lower legs begin hanging vertically.
12. `011`: torso recovers from compression.
13. `012`: shoes make one small forward pendulum movement.
14. `013`: free glove becomes comfortably planted for balance.
15. `014`: head rises; eyes move toward the child.
16. `015`: flame tips complete delayed settling motion.
17. `016`: wand returns to the approved neutral angle.
18. `017`: chest and legs approach neutral.
19. `018`: one-frame pre-handoff nearly identical to neutral.
20. `019`: pixel-identical to approved idle Frame 000; mark `NEUTRAL_HANDOFF`.

Use coherent connected drawings at 24 fps, not translated copies of one pose. Deliver numbered PNGs, 5×4 contact sheet, transparent preview, wall-composite preview and a manifest with measured anchors, durations, `SEAT_CONTACT` and `NEUTRAL_HANDOFF`. Keep at least 24 px padding. No background, wall, cloud, shadow, text, cards, interface, star trail, beam or confetti.

---

## Prompt 03 — Calm wall-seated talking loop

Create `sparky_wall_talk_loop`. Attach the original Sparky identity image and approved wall-idle Frame 000. Preserve exactly the same flame head, eyes, brows, smile proportions, cobalt-blue kimono, cream V collar, gold sash and clasp, dark-blue lower garment, blue-and-cream shoes, white four-finger gloves, and brown gold-star wand. No overalls and no costume substitutions.

Create 16 transparent 512×512 frames. Sparky remains seated at the same `seatAnchor` on an invisible wall at `y=300`; draw no wall. Hips and thighs never slide. Legs hang in front. The viewer-left hand keeps the wand secure. The viewer-right hand makes one small friendly conversational gesture. This is a reusable body loop; draw a closed neutral mouth region in every frame because a separate viseme overlay will provide speech.

Frame plan:

1. `000`: pixel-identical wall neutral.
2. `001`: eyes meet the child; chest begins a small inhale.
3. `002`: head inclines 2 degrees toward the child.
4. `003`: viewer-right elbow lifts slightly from the ledge.
5. `004`: free palm opens upward near the waist.
6. `005`: palm reaches the gesture peak; fingers remain four and rounded.
7. `006`: brows brighten slightly; body remains seated.
8. `007`: hold the welcoming conversational beat.
9. `008`: hand begins returning; eyes remain on the child.
10. `009`: head passes smoothly toward center.
11. `010`: palm lowers toward the ledge.
12. `011`: glove makes light ledge contact.
13. `012`: shoulders exhale and settle.
14. `013`: flame tips follow with tiny delayed motion.
15. `014`: nearly exact neutral.
16. `015`: pixel-identical to Frame 000.

No open-mouth drawings, lip flapping, pointing, waving, leg kicking or wand casting. Deliver PNGs, 4×4 contact sheet, repeated-loop preview, idle→talk→idle preview, 100 px game-size preview and manifest with durations and measured anchors. Reject face morphing, glove changes, moving mouth pivot, seat drift or costume changes.

---

## Prompt 04 — Invite the child’s turn

Create `sparky_wall_invite_turn`. Attach the original Sparky identity image and approved wall-idle Frame 000. Use the exact yellow/orange/red flame identity and exact cobalt-blue kimono, cream collar, gold sash and clasp, dark-blue lower garment, blue-and-cream shoes, white four-finger gloves, and brown gold-star wand. Never use turquoise overalls.

Create 16 transparent 512×512 frames. Invisible wall top is `y=300`; do not paint it. Sparky stays seated with hips fixed. Legs hang naturally. The gesture must say “your choice” without pointing to a particular hidden card or revealing an answer.

Frame plan: `000` exact neutral; `001` eyes meet child; `002` head turns 2 degrees toward child; `003` wand lowers safely toward lap; `004` free elbow lifts; `005` free palm rotates outward; `006` arm extends gently toward the general board area; `007` palm reaches open welcoming pose; `008` hold and mark `INVITE_HOLD`; `009` warm brow lift; `010` arm begins returning; `011` palm rotates down; `012` glove approaches ledge; `013` wand returns to neutral; `014` body settles; `015` pixel-identical neutral handoff.

No answer pointing, cast, travelling star, large wave, standing, jumping or leg kick. Deliver numbered PNGs, 4×4 contact sheet, preview, wall composite and manifest with durations, `INVITE_HOLD`, `seatAnchor`, `mouthAnchor`, `wandHandPivot` and `wandTip`.

---

## Prompt 05 — Observe, remember and choose

Create a complete production-ready animation package named `sparky_wall_observe_think_v2`.

IMPORTANT: This must replace the incomplete previous version. Generate every required frame, including clean new Frames 006 and 007. Do not omit, crop, distort or substitute any frame.

### Reference images

Use the attached original Sparky identity image as the absolute character reference.

Also use:

1. The approved wall-idle Frame 000 as the exact neutral starting pose.
2. The existing incomplete observe/think frames as pose and registration references.
3. The matching left, center and right wand-pick Frame 000 images as the exact ending poses.

### Character appearance — preserve exactly

Sparky is a friendly childlike flame character. He must retain:

- The exact yellow flame-shaped face and head.
- The same orange inner flame shading.
- The same strong red-orange outer flame outline.
- The same flame-tip count, shape, spacing and proportions.
- Large white oval eyes with black pupils and small white highlights.
- Thin red-orange eyebrows.
- Small friendly curved mouth.
- Soft rounded cheeks.
- The same head-to-body proportions as the approved reference.
- The same cobalt-blue kimono.
- The same cream V-shaped collar.
- The same golden-yellow waist sash.
- The same round gold sash clasp.
- The same dark-blue lower garment.
- The same blue-and-cream shoes.
- The same white four-finger gloves.
- The same short brown wand with a gold five-point star.

Never use turquoise overalls, red sleeves, shorts, a different costume, a different wand or a different character design.

### Seated position and registration

Create three complete directional variants:

- `left`
- `center`
- `right`

Each variant must contain exactly 16 transparent frames.

Technical requirements:

- Canvas: exactly 512 × 512 pixels per frame.
- Transparent RGBA background.
- Straight alpha.
- sRGB colour space.
- Sparky remains seated on an invisible horizontal wall.
- The wall plane is at `y = 300`.
- Do not draw the wall, cloud, platform, cards, UI or background.
- Keep `seatAnchor = [256, 300]` identical in every frame.
- Hips, thighs and seated contact must never slide.
- Both legs hang naturally in front.
- Shoes must remain registered without popping or changing size.
- Sparky must retain the same scale and canvas position in all variants.
- Maintain at least 24 pixels of transparent padding around all visible artwork.
- Do not crop the flame, glove, wand, shoes or costume.

The three variants must differ only through pupil direction and a very small head-direction adjustment. Body position, costume, scale and seat registration must remain identical.

### Animation purpose

This animation plays after Sparky sees a card that has actually been revealed.

Sparky must:

1. Look toward the genuinely revealed card.
2. Briefly observe it.
3. Bring his free hand near his chin.
4. Show gentle uncertainty while remembering.
5. Resolve his thought.
6. Commit his gaze toward the card he will legally choose.
7. Prepare the wand hand for the following wand-pick animation.

Sparky must never appear to know the identity of an unrevealed card.

Do not show X-ray vision, scanning light, magical detection, answer beams, card symbols, card pictures, glowing clues, pointing lines, telepathy, a guaranteed-correct expression or any hidden-information knowledge.

### Hand rules

The viewer-left hand holds the brown gold-star wand securely throughout the animation.

- Wand length must never change.
- Wand star must never detach.
- Wand grip must remain anatomically consistent.
- Do not cast magic in this animation.
- Do not lift the wand into the final casting motion before the specified preparation frames.

The viewer-right hand is the free hand.

- It moves gradually toward the chin.
- It must remain a white four-finger glove.
- It must never cover the mouth.
- It must never merge into the face.
- It must never gain or lose fingers.
- It must never become oversized.
- It must never pass through the sleeve or head.
- Frames 006 and 007 require especially clean glove anatomy and smooth sleeve deformation.

### Frame-by-frame plan

Apply this complete plan independently to the left, center and right variants.

#### Frame 000 — NEUTRAL START

- Pixel-identical to approved wall-idle Frame 000.
- Sparky faces forward.
- Neutral friendly smile.
- Both hands in their approved resting positions.
- Exact seat, costume, wand and shoe registration.

#### Frame 001 — EYES MOVE FIRST

- Pupils move toward the actually revealed card.
- Use the direction of the current variant: left, center or right.
- Head and body remain unchanged.
- Do not move the hand yet.

#### Frame 002 — HEAD FOLLOWS

- Head follows the pupil direction by approximately 2 degrees.
- Keep the movement subtle.
- Seat, torso, wand and legs remain fixed.

#### Frame 003 — ATTENTION

- Eyebrows lift slightly to show attention.
- Eyes remain directed toward the revealed card.
- Expression is curious and friendly, not surprised or worried.

#### Frame 004 — OBSERVE_HOLD

- Stable observation pose.
- Mark this frame as `OBSERVE_HOLD`.
- Hold may be extended briefly by the game.
- No body drift or costume change.

#### Frame 005 — RETURN SLIGHTLY

- Eyes move slightly back toward centre.
- The movement should suggest remembering the observed card.
- Head remains close to the previous position.

#### Frame 006 — HAND RISE BEGINS

- Create a completely new clean drawing for this formerly missing frame.
- Viewer-right elbow bends gently.
- Free glove begins rising from the resting position toward the chin.
- Hand remains below the mouth.
- Four rounded fingers must be clearly readable.
- Sleeve follows naturally without stretching or collapsing.
- This must be a smooth bridge between Frames 005 and 007.

#### Frame 007 — HAND NEAR CHIN

- Create a completely new clean drawing for this formerly missing frame.
- Free glove reaches a comfortable thinking position near the chin.
- Glove must not touch or cover the mouth.
- Palm angle and finger arrangement must transition smoothly from Frame 006 to Frame 008.
- Preserve four fingers and correct wrist attachment.
- No face distortion, hand-face merging or sleeve popping.

#### Frame 008 — GENTLE UNCERTAINTY

- Eyebrows show mild thoughtful uncertainty.
- Add a very small head tilt.
- Expression remains warm and child-friendly.
- No sadness, fear, frustration or exaggerated confusion.
- Free hand stays near the chin.

#### Frame 009 — MEMORY COMPARISON

- Eyes make one small, controlled comparison movement.
- It should feel like Sparky is remembering previously revealed positions.
- Do not scan every card.
- Do not suggest knowledge of unseen cards.
- Body and seat remain fixed.

#### Frame 010 — THOUGHT RESOLVES

- Eyebrows relax.
- Small confident-but-not-certain smile.
- Head begins returning from the thinking tilt.
- Free hand begins preparing to lower.

#### Frame 011 — GAZE COMMITS

- Pupils commit toward the selected target direction.
- The selected target must come from legal game memory only.
- No pointing or magic.
- Do not move the seat or legs.

#### Frame 012 — HEAD FOLLOWS COMMITTED GAZE

- Head follows the committed gaze by approximately 2 degrees.
- Keep motion smooth and restrained.
- Free hand continues returning from the chin.

#### Frame 013 — WAND PREPARATION

- Wand-holding hand makes a tiny preparation adjustment.
- Do not lift, point, cast or release a star.
- The movement must lead naturally into the corresponding wand-pick animation.

#### Frame 014 — CHOOSE_HOLD

- Stable committed-choice pose.
- Mark this frame as `CHOOSE_HOLD`.
- This frame may be held until the game starts the wand-pick action.
- No movement, drift or magical effect.

#### Frame 015 — EXACT WAND-PICK HANDOFF

- Must be pixel-identical to Frame 000 of the corresponding supplied wand-pick variant.
- Left observe Frame 015 must match left wand-pick Frame 000.
- Center observe Frame 015 must match center wand-pick Frame 000.
- Right observe Frame 015 must match right wand-pick Frame 000.
- Match scale, seat anchor, head position, gaze, hands, wand, costume and shoes exactly.
- The transition into the wand-pick animation must contain no pop or jump.

### Motion requirements

- Animate at 24 fps.
- Use restrained, smooth ease-in and ease-out motion.
- Pupils lead the head movement.
- The head follows with a slight natural delay.
- The hand rise must be continuous across Frames 005–008.
- The hand return must be continuous across Frames 010–014.
- No sudden pose replacement.
- No frame-to-frame scale change.
- No seat drift.
- No limb popping.
- No costume morphing.
- No flame-outline boiling.
- No camera movement.
- No squash-and-stretch of the entire character.

### Timing

Use these default frame durations for every variant:

- Frame 000: 250 ms
- Frame 001: 83.333 ms
- Frame 002: 83.333 ms
- Frame 003: 83.333 ms
- Frame 004: 500 ms — `OBSERVE_HOLD`
- Frame 005: 83.333 ms
- Frame 006: 83.333 ms
- Frame 007: 83.333 ms
- Frame 008: 125 ms
- Frame 009: 125 ms
- Frame 010: 83.333 ms
- Frame 011: 83.333 ms
- Frame 012: 83.333 ms
- Frame 013: 83.333 ms
- Frame 014: 500 ms — `CHOOSE_HOLD`
- Frame 015: 83.333 ms — wand-pick handoff

### Delivery structure

Deliver exactly 48 numbered transparent PNG frames:

```text
left/
sparky_wall_observe_think_left_000.png
through
sparky_wall_observe_think_left_015.png

center/
sparky_wall_observe_think_center_000.png
through
sparky_wall_observe_think_center_015.png

right/
sparky_wall_observe_think_right_000.png
through
sparky_wall_observe_think_right_015.png
```

Also deliver:

1. `atlas_left.png`: exact 2048 × 2048 image, 4 columns × 4 rows, every cell exactly 512 × 512, with no spacing, labels, borders or background.
2. `atlas_center.png`: same specifications.
3. `atlas_right.png`: same specifications.
4. Three labelled 4 × 4 contact sheets for review.
5. Three transparent repeated previews.
6. Three temporary-wall composite previews.
7. A 100-pixel game-size comparison preview showing all directions.
8. `animation-manifest.json`.

### Manifest requirements

The manifest must include:

- Clip name.
- Variant names.
- Frame count.
- Frame rate.
- Per-frame durations.
- Canvas size.
- Atlas grid.
- Straight-alpha RGBA declaration.
- `wallPlaneY = 300`.
- `seatAnchor` for every frame.
- `mouthAnchor` for every frame.
- `wandTip` for every frame.
- `freeHand` anchor for every frame.
- Shoe anchors for every frame.
- Bounding box for every frame.
- `OBSERVE_HOLD = 004`.
- `CHOOSE_HOLD = 014`.
- `WAND_PICK_HANDOFF = 015`.
- Confirmation that each Frame 015 is pixel-identical to the corresponding wand-pick Frame 000.

### Strict rejection conditions

Reject and regenerate the package if any of these occur:

- Frames 006 or 007 are missing.
- Any frame is cropped.
- Glove has the wrong number of fingers.
- Hand merges with the face.
- Hand covers the mouth.
- Sleeve changes costume design.
- Wand changes length or shape.
- Sparky wears overalls.
- Seat anchor moves.
- Hips or thighs slide.
- Shoes pop or change size.
- Head or body scale changes.
- Flame silhouette changes unexpectedly.
- Left, center and right variants use different body registration.
- Sparky appears to know an unseen card.
- Cards, walls, platforms, UI or backgrounds appear in runtime frames.
- Frame 015 does not exactly match the corresponding wand-pick Frame 000.
- Atlas cells are not exactly 512 × 512.
- Labels or borders appear in runtime atlases.

---

## Prompt 06 — Continuous wand pick

Create `sparky_wall_wand_pick`. Attach the original Sparky identity image, approved wall-idle Frame 000, and the approved `CHOOSE_HOLD` ending from Prompt 05. Preserve the exact flame identity and cobalt-blue kimono costume. The short brown wand with gold five-point star remains the same length in every frame. No overalls.

Create left, center and right target variants, each containing 24 transparent 512×512 frames. Invisible wall top is `y=300`; draw no wall. Hips remain fixed and legs hang in front. The action is one continuous shot: choose hold → small windup → cast → release → watch separate travelling star → contact response → neutral recovery. Never paint the travelling star, beam, card or impact into Sparky’s frames.

Frame plan for each variant: `000` exact Prompt-05 `CHOOSE_HOLD`; `001–003` fingers secure wand and wrist begins windup; `004–006` elbow draws back with restrained anticipation; `007–009` wand moves through a clean short arc; `010` exact `CAST_RELEASE`, with clearly measured `wandTip`; `011–013` restrained follow-through; `014–016` stable `STAR_WAIT_HOLD` while eyes watch the separate code-driven star; `017` tiny reaction when the target card begins flipping; `018–020` wrist and elbow recover; `021` wand returns beside body; `022` torso settles; `023` pixel-identical wall neutral.

The game may hold Frames 014–016 for different travel distances, so they must be stable. No hand teleport, changing wand length, painted magic, second bounce or seat drift. Deliver 72 PNGs, three 6×4 contact sheets, previews and a manifest with `CAST_RELEASE`, `STAR_WAIT_HOLD`, measured `wandTip`, `wandHandPivot`, `seatAnchor`, target name and safe restart frame.

---

## Prompt 07 — Pair joy

Create `sparky_wall_pair_joy`. Attach the original Sparky identity image and approved wall-idle Frame 000. Preserve the exact yellow/orange/red flame character and cobalt-blue kimono, cream collar, gold sash and clasp, dark-blue lower garment, blue-and-cream shoes, white gloves and brown gold-star wand. No overalls.

Create 16 transparent 512×512 frames. Wall is invisible at `y=300`; draw no wall. Sparky remains seated. This one modest celebration is reused whether the child or Sparky finds a pair, so it must feel warm and shared, never smug.

Frame plan: `000` neutral; `001` eyes widen slightly; `002` brows lift; `003` smile brightens without changing mouth anchor; `004` free glove lifts; `005` palm opens; `006` small seated chest rise; `007` celebration peak with free hand raised no higher than shoulder; `008` hold happy pose; `009` hand begins lowering; `010` head settles; `011` shoulders relax; `012` glove approaches ledge; `013` feet complete a tiny happy swing; `014` nearly neutral; `015` pixel-identical neutral.

No jump, trophy, confetti, card, text, gloating, huge arm swing or baked magical star. Deliver PNGs, contact sheet, preview, wall composite and measured manifest.

---

## Prompt 08 — Gentle missed-pair reaction

Create `sparky_wall_gentle_miss`. Attach the original Sparky identity image and approved wall-idle Frame 000. Preserve the exact flame face, cobalt-blue kimono, cream collar, gold sash and clasp, dark-blue lower garment, shoes, white gloves and wand. No overalls.

Create 16 transparent 512×512 frames with fixed wall seat at `y=300`; do not draw the wall. The reaction is a tiny “not yet” followed immediately by encouragement. It must never shame, scold, cry, look angry or exaggerate failure.

Frame plan: `000` neutral; `001` pupils register the missed pair; `002` eyes widen 5%; `003` brows lift briefly; `004` head tilts 2 degrees; `005` tiny surprise hold; `006` expression softens; `007` brows return warm; `008` small encouraging smile; `009` free palm opens near waist; `010` hold reassurance; `011` palm lowers; `012` head returns center; `013` shoulders settle; `014` nearly neutral; `015` pixel-identical neutral.

No tears, frown, shame gesture, face covering, head shake, standing, card, text or effects. Deliver PNGs, contact sheet, preview and measured manifest.

---

## Prompt 09 — Friendly result reaction

Create `sparky_wall_result_reaction`. Attach the original Sparky identity image and approved wall-idle Frame 000. Preserve the exact flame identity and exact cobalt-blue kimono costume, cream collar, gold sash and clasp, lower garment, shoes, white gloves and brown gold-star wand. No overalls.

Create 20 transparent 512×512 frames. Sparky stays seated on the invisible wall at `y=300`; do not draw it. The same animation must work for child win, Sparky win, tie and Practice completion. It must be outcome-neutral: warm, proud and friendly, with no gloating or sadness.

Frame plan: `000` neutral; `001–002` eyes turn to child; `003–004` smile brightens; `005–006` free hand rises; `007–008` modest open-palm celebration; `009` happy peak; `010–011` one small approving nod; `012–013` head returns upright; `014–015` free hand lowers; `016` stable friendly final pose begins; `017–019` identical held final pose for result-screen looping or freezing.

No trophy, score, words, confetti, jumping, victory sign, losing sadness or background. Deliver PNGs, 5×4 contact sheet, preview, wall composite and manifest marking `RESULT_HOLD` and all measured anchors.

---

## Prompt 10 — Mouth-viseme atlas

Create `sparky_wall_mouth_visemes`. Attach the original Sparky identity image and approved wall-idle Frame 000. This is a mouth-only overlay atlas, not a full-body animation. Match the approved flame face exactly: same yellow face color, black line weight, shading, cheek area and mouth pivot. Do not redraw the head, eyes, eyebrows, body, kimono, wall, wand or background.

Every mouth is isolated on transparent 256×256 sRGB canvas with straight alpha and identical `mouthAnchor=(128,128)` until measured precisely. All shapes must share identical scale, line weight and color. Edges must blend cleanly over the approved face at 90–120 CSS px character height.

Create these named shapes: `REST` closed friendly smile; `MBP` gently pressed lips; `A` vertical open vowel; `E` wider horizontal vowel; `O` round opening; `U` small rounded opening; `FV` upper teeth touching lower lip; `LTH` simplified tongue/teeth; `S` narrow teeth shape; `SMILE_OPEN` delighted open smile; `GASP` rounded surprised opening. Also create transitions `REST_A_1`, `REST_A_2`, `A_O_1`, `A_O_2`, `O_REST_1`, `O_REST_2`.

Keep the mouth child-friendly and simple. Do not add realistic gums, detailed tongue texture, detached teeth, lipstick, beard, nose, sticker border, white rectangle or shadow. The surrounding transparent pixels must not cover the eyes or face shading.

Deliver 17 individually named transparent PNGs, one labeled review atlas, overlays tested on idle Frames 000, 005 and 014, a speaking preview returning to `REST`, and a manifest with measured `mouthAnchor`, bounds and recommended transitions. Reject pivot movement, different line thickness, face-colored halos, mismatched smile width or any mouth that looks pasted on.

---

## Prompt 11 — Quiet approving nod

Create a production-ready animation package named `sparky_wall_nod_yes`. Attach the original approved Sparky identity image and the approved wall-idle Frame 000. Frame 000 of this package must be copied from that approved idle frame, not redrawn.

Preserve exactly the same yellow/orange/red flame head, eyes, brows, closed smile proportions, cobalt-blue kimono, cream V collar, gold sash and clasp, dark-blue lower garment, blue-and-cream shoes, white four-finger gloves, and short brown wand with a gold five-point star. No overalls, costume substitutions or identity changes.

This is a quick silent acknowledgement used during ordinary gameplay when spoken praise would be repetitive. It should communicate “yes”, “I saw that” or “good choice” through one clear, gentle head nod. Sparky does not talk. Keep the mouth closed and registered in every frame so no viseme overlay is required.

Create 12 transparent 512×512 sRGB PNG frames with straight alpha. Sparky remains seated on the same invisible wall at `y=300`; draw no wall. Keep the exact approved `seatAnchor`, scale and camera. Hips and thighs never move. Legs hang in front without kicking. The viewer-left hand keeps the wand secure at the neutral angle. The viewer-right glove stays planted on the invisible ledge. Only the eyes, brows, head, upper neck/shoulder connection and tiny delayed flame-tip motion may change.

Frame plan and default durations:

1. `000`, 120 ms: pixel-identical approved wall neutral.
2. `001`, 67 ms: eyes warmly acknowledge the child; brows brighten by at most 1 px.
3. `002`, 67 ms: chin begins moving downward; head rotation no more than 1.5 degrees.
4. `003`, 67 ms: head continues into the nod; flame base follows without deforming.
5. `004`, 100 ms: nod reaches a restrained 4-degree downward peak; mark `YES_BEAT`.
6. `005`, 67 ms: head begins returning toward center.
7. `006`, 67 ms: head passes center with a natural upward recovery of at most 1 degree.
8. `007`, 67 ms: one much smaller confirming dip, no more than 2 degrees.
9. `008`, 100 ms: warm approving eyes and closed smile; mark `YES_HOLD`.
10. `009`, 67 ms: head returns to exact center; flame tips follow with a tiny delay.
11. `010`, 67 ms: shoulders and brows settle; wand, gloves, legs and seat remain unchanged.
12. `011`, 120 ms: pixel-identical to Frame 000; mark `NEUTRAL_HANDOFF`.

The complete action should read clearly at a rendered character height of 90–120 CSS px and should finish in about one second. Use connected drawings with smooth ease-in/ease-out, not translated copies of one image. The head must rotate naturally around the neck pivot; never move the entire character up and down.

Do not add speech, open-mouth drawings, a large bow, hand gesture, thumbs-up, pointing, wand casting, travelling star, sparkles, card art, words, wall, cloud, platform, shadow or background. Do not let the chin collide with the collar. Do not squash the face, move the pupils outside the eyes, change the flame silhouette, slide the hips or alter the costume.

Deliver:

1. Twelve individually numbered transparent PNGs named `sparky_wall_nod_yes_000.png` through `sparky_wall_nod_yes_011.png`.
2. One exact 4×3 runtime atlas, 2048×1536, with twelve 512×512 cells, no spacing, labels, border or background.
3. A labelled 4×3 review contact sheet.
4. A transparent one-shot preview.
5. An idle→nod yes→idle preview composited over a temporary wall.
6. A 100 px game-size preview.
7. `animation-manifest.json` containing per-frame durations, `YES_BEAT`, `YES_HOLD`, `NEUTRAL_HANDOFF`, canvas and atlas dimensions, straight-alpha declaration, and measured per-frame `seatAnchor`, `mouthAnchor`, `headPivot`, `wandHandPivot`, `wandTip`, glove anchors, shoe anchors and character bounds.

Reject the package if Frames 000 and 011 are not pixel-identical, any frame changes the mouth pivot, the motion resembles a bow, the nod is too subtle to read at game size, the full body bobs, the seat drifts, the wand changes, a glove gains or loses a finger, the costume changes, the character is cropped, or the atlas cells are not exactly 512×512.

---

## Prompt 12 — Quiet gentle “not yet” head shake

Create a production-ready animation package named `sparky_wall_nod_no`. Attach the original approved Sparky identity image and approved wall-idle Frame 000. Frame 000 of this package must be copied from the approved idle frame, not redrawn.

Preserve exactly the same yellow/orange/red flame identity, large black eyes, short red brows, closed smile proportions, cobalt-blue kimono, cream V collar, gold sash and clasp, dark-blue lower garment, blue-and-cream shoes, white four-finger gloves, and short brown gold-star wand. No overalls and no costume substitutions.

This is a quick silent “not this pair yet” reaction for a game played by very young children. It must feel gentle, helpful and emotionally safe—never scolding, disappointed or mocking. Sparky makes one small side-to-side head shake and immediately returns to warm encouragement. He does not talk. Draw a closed neutral-to-kind mouth in every frame so no viseme overlay is required.

Create 12 transparent 512×512 sRGB PNG frames with straight alpha. Sparky remains seated on the same invisible wall at `y=300`; do not draw it. Preserve the exact approved `seatAnchor`, scale, camera and body registration. Hips, thighs, legs, shoes, planted viewer-right glove, wand hand and wand remain fixed. Motion is limited to pupils, brows, a small horizontal head rotation and tiny delayed flame-tip follow-through.

Frame plan and default durations:

1. `000`, 120 ms: pixel-identical approved wall neutral.
2. `001`, 67 ms: eyes register the two non-matching cards; brows lift softly, never frown.
3. `002`, 67 ms: head begins turning 2 degrees toward viewer-left.
4. `003`, 83 ms: head reaches a maximum 4-degree viewer-left turn.
5. `004`, 67 ms: head passes smoothly back through center.
6. `005`, 83 ms: head reaches a maximum 4-degree viewer-right turn.
7. `006`, 100 ms: brief gentle `NO_BEAT`; eyes remain warm and open.
8. `007`, 67 ms: head begins returning from viewer-right.
9. `008`, 67 ms: head passes center into a final tiny 1.5-degree viewer-left echo.
10. `009`, 100 ms: exact centered encouraging expression; mark `TRY_AGAIN_HOLD`.
11. `010`, 67 ms: brows, pupils and flame tips settle without changing the smile.
12. `011`, 120 ms: pixel-identical to Frame 000; mark `NEUTRAL_HANDOFF`.

The complete action should finish in about one second and remain readable at 90–120 CSS px character height. Rotate the head around the measured neck pivot. Pupils may lead each turn by one frame, while flame tips follow by one frame. Use smooth connected motion with restrained ease-in/ease-out. Do not translate the entire head or body sideways.

No tears, frown, lowered ashamed gaze, angry brows, eye roll, face covering, shrug, finger wag, hand movement, pointing, open mouth, speech, wand casting, magical effect, card, text, wall, cloud, platform, shadow or background. The action must mean “not yet—try again”, not “you are wrong”.

Deliver:

1. Twelve individually numbered transparent PNGs named `sparky_wall_nod_no_000.png` through `sparky_wall_nod_no_011.png`.
2. One exact 4×3 runtime atlas, 2048×1536, with twelve 512×512 cells, no spacing, labels, border or background.
3. A labelled 4×3 review contact sheet.
4. A transparent one-shot preview.
5. An idle→nod no→idle preview composited over a temporary wall.
6. A 100 px game-size preview.
7. `animation-manifest.json` containing per-frame durations, `NO_BEAT`, `TRY_AGAIN_HOLD`, `NEUTRAL_HANDOFF`, canvas and atlas dimensions, straight-alpha declaration, and measured per-frame `seatAnchor`, `mouthAnchor`, `headPivot`, `wandHandPivot`, `wandTip`, glove anchors, shoe anchors and character bounds.

Reject the package if Frames 000 and 011 are not pixel-identical, the expression reads as angry or sad, the shake is too large or too subtle, the whole body slides, the head translates rather than rotates, the mouth opens, the mouth pivot moves, the costume or flame identity changes, glove anatomy changes, the wand moves, the character is cropped, or any runtime atlas cell is not exactly 512×512.
