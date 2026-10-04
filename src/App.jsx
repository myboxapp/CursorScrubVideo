import React, { useState } from "react";
import CursorScrubVideo, { FFMPEG_README } from "./CursorScrubVideo.jsx";

const DEMO = { name: "demo.mp4 (built-in)", src: "demo.mp4" };

export default function App() {
  const [file, setFile] = useState(DEMO.src);
  const [fileName, setFileName] = useState(DEMO.name);
  const [axis, setAxis] = useState("horizontal");
  const [reverse, setReverse] = useState(false);
  const [trackingArea, setTrackingArea] = useState("component");
  const [smoothing, setSmoothing] = useState(0.22);
  const [objectFit, setObjectFit] = useState("cover");
  const [showPoster, setShowPoster] = useState(true);
  const [borderRadius, setBorderRadius] = useState(0);
  const [copied, setCopied] = useState(false);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
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
      <aside className="panel">
        <h1>CursorScrubVideo</h1>

        <Field label="videoFile" hint={fileName || "none"}>
          <input type="file" accept="video/*" onChange={onFile} />
          <button className="link" onClick={() => { setFile(null); setFileName(""); }}>
            Clear (show placeholder)
          </button>
        </Field>

        <Field label="axis">
          <Select value={axis} onChange={setAxis} options={["horizontal", "vertical"]} />
        </Field>

        <Field label="reverse">
          <Toggle checked={reverse} onChange={setReverse} />
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

        <div className="note">
          <strong>For buttery scrubbing</strong>, encode the video with every frame as a keyframe:
          <pre>{FFMPEG_README}</pre>
          <button className="link" onClick={copy}>{copied ? "Copied!" : "Copy command"}</button>
        </div>
      </aside>

      <main className="stage">
        <div className="frame">
          <CursorScrubVideo
            videoFile={file}
            axis={axis}
            reverse={reverse}
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
