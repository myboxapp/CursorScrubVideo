import React, { useState } from "react";
import CursorScrubVideo, { FFMPEG_README } from "./CursorScrubVideo.jsx";

// Cursor→time keypoints for every axis mode. Horizontal: head turns left↔right (1.0s→3.0s).
// Vertical: chin up (4.2s) → level (5.5s) → chin down (6.4s).
const DEMO_KEYS = {
  horizontalKeys: [[0, 1], [0.5, 2], [1, 3]],
  verticalKeys: [[0, 4.2], [0.5, 5.5], [1, 6.4]],
};
const DEMO = { name: "demo.mp4 (built-in)", src: "demo.mp4" };

export default function App() {
  const [file, setFile] = useState(DEMO.src);
  const [fileName, setFileName] = useState(DEMO.name);
  const [axis, setAxis] = useState("both");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [trackingArea, setTrackingArea] = useState("component");
  const [smoothing, setSmoothing] = useState(0.06);
  const [objectFit, setObjectFit] = useState("cover");
  const [showPoster, setShowPoster] = useState(true);
  const [borderRadius, setBorderRadius] = useState(0);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const isDemo = file === DEMO.src;

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setStartTime(0);
    setEndTime(0);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FFMPEG_README);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="app">
      <button className="panel-toggle" onClick={() => setOpen((o) => !o)}
        aria-expanded={open} aria-controls="controls-panel">
        {open ? "Close controls" : "Open controls"}
      </button>
      <aside id="controls-panel" className={`panel ${open ? "open" : ""}`} aria-hidden={!open}>
        <h1>CursorScrubVideo</h1>

        <Field label="videoFile" hint={fileName || "none"}>
          <input type="file" accept="video/*" onChange={onFile} />
          <button className="link" onClick={() => { setFile(null); setFileName(""); }}>
            Clear (show placeholder)
          </button>
        </Field>

        <Field label="axis">
          <Select value={axis} onChange={setAxis} options={["horizontal", "vertical", "both"]} />
        </Field>

        <Field label="startTime" hint={`${startTime.toFixed(1)}s`}>
          <input type="range" min="0" max="30" step="0.1" value={startTime}
            onChange={(e) => setStartTime(+e.target.value)} />
        </Field>

        <Field label="endTime" hint={endTime > 0 ? `${endTime.toFixed(1)}s` : "end"}>
          <input type="range" min="0" max="30" step="0.1" value={endTime}
            onChange={(e) => setEndTime(+e.target.value)} />
        </Field>

        <Field label="trackingArea">
          <Select value={trackingArea} onChange={setTrackingArea} options={["component", "window"]} />
        </Field>

        <Field label="smoothing" hint={smoothing.toFixed(2)}>
          <input type="range" min="0.02" max="1" step="0.01" value={smoothing}
            onChange={(e) => setSmoothing(+e.target.value)} />
        </Field>

        <Field label="objectFit">
          <Select value={objectFit} onChange={setObjectFit} options={["cover", "contain", "fill"]} />
        </Field>

        <Field label="showPoster">
          <Toggle checked={showPoster} onChange={setShowPoster} />
        </Field>

        <Field label="borderRadius" hint={`${borderRadius}px`}>
          <input type="range" min="0" max="200" step="1" value={borderRadius}
            onChange={(e) => setBorderRadius(+e.target.value)} />
        </Field>
      </aside>

      <main className="stage">
        <div className="frame">
          <CursorScrubVideo
            videoFile={file}
            axis={axis}
            horizontalKeys={isDemo ? DEMO_KEYS.horizontalKeys : undefined}
            verticalKeys={isDemo ? DEMO_KEYS.verticalKeys : undefined}
            startTime={startTime}
            endTime={endTime > 0 ? endTime : undefined}
            trackingArea={trackingArea}
            smoothing={smoothing}
            objectFit={objectFit}
            showPoster={showPoster}
            borderRadius={borderRadius}
          />
        </div>
      </main>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <div className="field-head">
        <label>{label}</label>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o} className={o === value ? "on" : ""} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}
      role="switch" aria-checked={checked}>
      <span />
    </button>
  );
}
