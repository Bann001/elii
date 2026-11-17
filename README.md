# DevBann Portfolio

React + TypeScript + Vite portfolio. The live UI is `PortfolioRefresh.tsx`; the older animated version in `App.tsx` is kept as a reference but is not mounted in `main.tsx`.

```bash
npm run dev      # local dev server
npm run build    # typecheck + production build
npm run deploy   # build + Cloudflare Worker deploy
```

## Swarm build & auto tour

The "rebuild" effect reconstructs the **real** page content on scroll. It lives in three files:

| File | Role |
| --- | --- |
| `src/SwarmBuild.tsx` | `BuildSection` wrapper, target discovery, the animated overlay, tour trigger |
| `src/PortfolioRefresh.tsx` | Tour controller (state, progress, scroll, cancellation) |
| `src/portfolio-refresh.css` | `.swarm-*` overlay styles and `.pr-*` tour controls |

### How a section builds

1. `BuildSection` wraps a `<section>`; its children render inside a `.swarm-content` div.
2. An `IntersectionObserver` starts the build when the section scrolls into view (or the tour controller starts it explicitly).
3. Elements matching `TARGET_SELECTOR` are measured with `getBoundingClientRect()` relative to the section. Nested matches are dropped so each chunk builds once, and results are sorted by `priorityFor` (text → cards → decorative objects), capped at 14.
4. Each target's original inline `style` attribute is saved, then its element is hidden (`opacity: 0`, plus a clipped `clip-path` for text).
5. On a stagger (`STEP`), the cursors glide to the target, a box is drawn at its measured size with a `W × H` badge, and the real element is revealed. During the tour, the viewport glides to any target that isn't comfortably on screen.
6. At the end, saved styles are restored byte-for-byte and `onBuilt(index)` fires.

### Tour controller

`PortfolioRefresh` owns `tourActive` and `tourIndex` over `SECTION_IDS`. On completion of section `n`, a timer pauses briefly, scrolls to section `n+1`, then advances `tourIndex` — which starts that section's build. Each `BuildSection` gets `index`, `tourActive`, `tourIndex` and `onBuilt`.

- `replayKey` resets all sections; changing it re-runs their setup effects.
- `startRef` lets the tour effect call the latest `start()` without resetting a build already in progress.
- Wheel, touch, and `Esc` cancel the tour and clear any pending advance timer.
- `prefers-reduced-motion` skips the effect entirely and hides the controls.

### Adding a section

```tsx
<BuildSection id="new-section" className="pr-section" ariaLabelledBy="new-title"
  replayKey={replayKey} index={5} tourActive={tourActive}
  tourIndex={tourIndex} onBuilt={handleBuilt}>
  {/* existing section content */}
</BuildSection>
```

Add its id to `SECTION_IDS` in `PortfolioRefresh.tsx` so the tour knows the new total and scroll target.

### Changing what gets rebuilt

Edit `TARGET_SELECTOR`, `nameFor()` (badge label), `kindFor()` (text vs. block reveal), or `priorityFor()` (build order) in `SwarmBuild.tsx`. Keep targets to meaningful top-level chunks — rebuilding every nested `<span>` would be slow and visually noisy.

### Caveats

- The reveal temporarily writes inline styles to real DOM nodes. Always let the cleanup restore them; don't add a competing inline `style` to a target element while a build runs.
- Timers and the IntersectionObserver are cleaned up on unmount, replay, and tour cancellation.
- This is client-only; there is no SSR path for the overlay.
