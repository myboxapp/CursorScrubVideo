# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies
- `npm run dev` — Vite dev server for the demo site
- `npm run build` / `npm run preview` — production build / serve the build

There is no test runner, linter, or TypeScript setup; the project is plain JSX (React 18 + Vite 5).

## Architecture

Two parts, no routing or state library:

- `src/CursorScrubVideo.jsx` — the reusable component (the actual product). A muted `<video>` that never plays; its `currentTime` is driven by the cursor position.
- `src/App.jsx` — demo site: a left control panel with one control per component prop, and the component rendered in the stage on the right. When adding or changing a prop, update both files (and the prop list in `README.md`).

### How the scrubbing works (spans several effects in `CursorScrubVideo.jsx`)

- Pointer position is stored normalized (0..1) in a ref (`pos`), written by a `pointermove` listener attached to either the component root or `window` depending on `trackingArea`.
- A `requestAnimationFrame` loop reads `pos`, maps the chosen `axis` (and `reverse`) to a target time, eases `currentTimeRef` toward it by `smoothing`, and sets `video.currentTime` only when not already `seeking` and the delta exceeds 8ms.
- Props are mirrored into a `cfg` ref each render so the RAF loop reads current values without re-subscribing; only `src` re-creates the loop.
- `videoFile` may be a `File` (converted to an object URL, revoked on change/unmount) or a URL string. The loop stays idle until `canplaythrough` sets `readyRef`.
- With no `videoFile`, a placeholder div renders instead of the video.

### Video encoding

Smooth scrubbing requires an all-intra video (every frame a keyframe), otherwise seeks stutter. The ffmpeg command is exported as `FFMPEG_README` from the component, reused by the demo UI, and duplicated in `README.md`. `public/demo.mp4` is the built-in demo, referenced by a relative path (`"demo.mp4"`) so it works under a non-root base path.
