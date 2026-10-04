# CursorScrubVideo

React component whose video playhead is driven by cursor position, plus a demo site with a left control panel for every prop.

```
npm install
npm run dev
```

Component: `src/CursorScrubVideo.jsx`. Props: `videoFile`, `axis`, `reverse`, `trackingArea`, `smoothing`, `objectFit`, `showPoster`, `borderRadius`.

## Encoding (important)
For buttery scrubbing, encode the video with every frame as a keyframe:

```
ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 -x264-params "scenecut=0" -profile:v high -pix_fmt yuv420p -movflags +faststart -an out.mp4
```
