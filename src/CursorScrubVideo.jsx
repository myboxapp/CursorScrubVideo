import React, { useEffect, useRef, useState } from "react";

export const FFMPEG_README =
  'ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 -x264-params "scenecut=0" -profile:v high -pix_fmt yuv420p -movflags +faststart -an out.mp4';

/**
 * CursorScrubVideo — a video whose playhead is driven by the cursor position.
 *
 * The video never autoplays and is never played by the user; it only scrubs.
 *
 * PLAYBACK REQUIREMENT (README)
 * For buttery scrubbing the uploaded video must be encoded with EVERY FRAME AS
 * A KEYFRAME (all-intra). Otherwise the browser must decode from the previous
 * keyframe on every seek and scrubbing will stutter. Recommended encode:
 *
 *   ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 \
 *     -x264-params "scenecut=0" -profile:v high -pix_fmt yuv420p \
 *     -movflags +faststart -an out.mp4
 *
 * @param {object}   props
 * @param {File|string} props.videoFile  Required. A video/* File (or a URL string).
 * @param {"horizontal"|"vertical"} [props.axis="horizontal"]  Axis that scrubs.
 * @param {boolean}  [props.reverse=false]  Flip the mapping on the selected axis.
 *        false: left→right / top→bottom = start→end.
 * @param {"component"|"window"} [props.trackingArea="component"]
 * @param {number}   [props.smoothing=0.22]  0.02–1. Higher = snappier, lower = more inertia.
 * @param {"cover"|"contain"|"fill"} [props.objectFit="cover"]
 * @param {boolean}  [props.showPoster=true]  Show the first frame while buffering.
 * @param {number}   [props.borderRadius=0]  px.
 * @param {string}   [props.README]  Optional override for the encoding hint text.
 */
export default function CursorScrubVideo({
  videoFile,
  axis = "horizontal",
  reverse = false,
  trackingArea = "component",
  smoothing = 0.22,
  objectFit = "cover",
  showPoster = true,
  borderRadius = 0,
  README = `For buttery scrubbing, encode with every frame as a keyframe:\n${FFMPEG_README}`,
}) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [ready, setReady] = useState(false);

  // Latest props, read from inside the RAF loop / listeners without re-binding.
  const cfg = useRef({});
  cfg.current = { axis, reverse, smoothing: clamp(smoothing, 0.02, 1) };

  const pos = useRef({ x: 0, y: 0 }); // normalized cursor 0..1
  const currentTimeRef = useRef(0);
  const seekingRef = useRef(false);
  const readyRef = useRef(false);

  // Resolve the file to a URL; revoke object URLs on change/unmount.
  useEffect(() => {
    setReady(false);
    readyRef.current = false;
    seekingRef.current = false;
    currentTimeRef.current = 0;
    if (!videoFile) return setSrc(null);
    if (typeof videoFile === "string") return setSrc(videoFile);
    const url = URL.createObjectURL(videoFile);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Video setup + RAF scrub loop.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const onSeeking = () => (seekingRef.current = true);
    const onSeeked = () => (seekingRef.current = false);
    const onReady = () => {
      readyRef.current = true;
      setReady(true);
    };
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("canplaythrough", onReady);

    video.load();
    // Muted play→pause nudges the browser into buffering decodable frames.
    video.play().then(() => video.pause()).catch(() => {});
    video.currentTime = 0;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const { axis, reverse, smoothing } = cfg.current;
      const duration = video.duration;
      if (!readyRef.current || !Number.isFinite(duration) || duration <= 0) return;

      let p = axis === "horizontal" ? pos.current.x : pos.current.y;
      if (reverse) p = 1 - p;
      const target = p * duration;

      const cur = currentTimeRef.current;
      const next = cur + (target - cur) * smoothing;
      currentTimeRef.current = next;

      if (!seekingRef.current && Math.abs(video.currentTime - next) > 0.008) {
        video.currentTime = next;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("canplaythrough", onReady);
    };
  }, [src]);

  // Pointer tracking.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onWindowMove = (e) => {
      pos.current = {
        x: clamp(e.clientX / window.innerWidth, 0, 1),
        y: clamp(e.clientY / window.innerHeight, 0, 1),
      };
    };
    const onComponentMove = (e) => {
      // clientX - rect.left == offsetX relative to the root, but stays correct
      // when the event target is a child element.
      const r = root.getBoundingClientRect();
      pos.current = {
        x: r.width ? clamp((e.clientX - r.left) / r.width, 0, 1) : 0,
        y: r.height ? clamp((e.clientY - r.top) / r.height, 0, 1) : 0,
      };
    };

    const target = trackingArea === "window" ? window : root;
    const handler = trackingArea === "window" ? onWindowMove : onComponentMove;
    target.addEventListener("pointermove", handler);
    return () => target.removeEventListener("pointermove", handler);
  }, [trackingArea]);

  const wrap = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius,
    background: "#0b0b0f",
  };

  if (!videoFile) {
    return (
      <div
        ref={rootRef}
        style={{
          ...wrap,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8b8fa3",
          font: "500 14px system-ui, sans-serif",
          border: "1px dashed #3a3d4d",
          boxSizing: "border-box",
        }}
      >
        Add a video file
      </div>
    );
  }

  return (
    <div ref={rootRef} style={wrap} title={README}>
      <video
        ref={videoRef}
        // #t=0.001 makes browsers paint the first frame as a poster while buffering.
        src={src ? `${src}#t=0.001` : undefined}
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit,
          borderRadius,
          opacity: ready || showPoster ? 1 : 0,
          pointerEvents: "none",
        }}
      />
      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            font: "500 12px system-ui, sans-serif",
            background: showPoster ? "transparent" : "#0b0b0f",
            pointerEvents: "none",
          }}
        >
          <span style={{ background: "rgba(0,0,0,.55)", padding: "4px 10px", borderRadius: 999 }}>
            Loading…
          </span>
        </div>
      )}
    </div>
  );
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
