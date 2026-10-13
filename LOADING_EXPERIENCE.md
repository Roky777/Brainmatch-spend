# Smooth loading plan

- Replace repository-root redirect/link pages with direct game entrypoints.
- Render an inline-styled loader immediately, before external CSS/modules arrive.
- Use the existing Dream backdrop and Sparky's seated idle frame on his cloud.
- Decode opening art and fonts before enabling the menu.
- Entry waits only for the current background, cloud, and small seated still, with a 3.5-second maximum asset wait and no artificial minimum delay.
- Warm the first board, current world, controls, then optional character sheets and later cards using two background workers. External font stylesheets never gate bootstrap.
- After entry, selected cards are decoded before revealing their board, without full-screen overlays. Sparky holds a complete still while optional animation sheets arrive.
- Embed the lightweight seated still, cloud and blurred backdrop in the entry HTML so welcome artwork has no separate network requests. External fallback artwork reveals atomically after decoding.
- Reuse decoded requests, cancel stale transitions, and provide a retry on failure.
- Verify entrypoint paths, readiness/cache behavior, existing game tests, and browser transitions.
