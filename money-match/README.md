# Money Match

Launch with `npm start`, then open `/money-match/` or select Money Match in the game library.

Easy: 4 cards, coins and notes. Medium: 6 cards, adding totals. Hard: 8 cards, different currency combinations of equal value. Each difficulty cycles through two content boards; each play samples pairs so all supplied denominations and combinations can appear.

Practice earns 7 XP per first board clear; Beat Sparky earns 4 XP. Across three worlds and six boards, plus a 2 XP completion bonus, the journey totals 200 XP. Progress is saved independently from other variants.

Currency cards use authentic Indian coin photographs and Mahatma Gandhi New Series note images, stored locally and embedded into the card SVGs. Original note specimen markings are retained. Combination cards show each denomination separately, never a hidden total. Sources, credits and licences are in [CURRENCY_SOURCES.md](CURRENCY_SOURCES.md). Rebuild art with `node money-match/scripts/generate-card-art.mjs` (requires FFmpeg).

The incomplete master-board rows in the brief use the established equal-value combinations for ₹6, ₹7, ₹8 and ₹10. Each board has distinct totals to ensure one valid match per card.
