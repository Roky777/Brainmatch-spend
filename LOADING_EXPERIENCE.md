# Smooth loading plan

- Replace repository-root redirect/link pages with direct game entrypoints.
- Render an inline-styled loader immediately, before external CSS/modules arrive.
- Use the existing Dream backdrop and Sparky's seated idle frame on his cloud.
- Decode opening art and fonts before enabling the menu.
- Decode all variant card art, all three worlds, difficulty icons, the reveal curtain, and Sparky sheets during the single entry load.
- After entry, readiness guards reuse decoded cache hits without creating overlays or blocking the current screen.
- Embed the lightweight seated still, cloud and blurred backdrop in the entry HTML so welcome artwork has no separate network requests. External fallback artwork reveals atomically after decoding.
- Reuse decoded requests, cancel stale transitions, and provide a retry on failure.
- Verify entrypoint paths, readiness/cache behavior, existing game tests, and browser transitions.
