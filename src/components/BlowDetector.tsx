"use client";

import { useState } from "react";
import { useBlowDetection } from "@/hooks/useBlowDetection";

const GRAPH_WIDTH = 1000;
const GRAPH_HEIGHT = 360;
const PLAYER_X = 650;
const SAMPLE_SPACING = 7;
const MAX_SAMPLES = 130;
const SAMPLE_INTERVAL_MS = 50;

export function BlowDetector() {
  const [history, setHistory] = useState<number[]>([0]);
  const { error, isActive, percentage, start, stop } = useBlowDetection((level) => {
    setHistory((samples) => [...samples.slice(-(MAX_SAMPLES - 1)), level]);
  }, { sampleIntervalMs: SAMPLE_INTERVAL_MS });

  const handleStart = async () => {
    setHistory([0]);
    await start();
  };

  const visibleHistory = isActive ? history : [0];
  const points = visibleHistory
    .map((sample, index) => {
      const x = PLAYER_X - (visibleHistory.length - 1 - index) * SAMPLE_SPACING;
      const y = GRAPH_HEIGHT - 30 - (sample / 100) * (GRAPH_HEIGHT - 60);
      return `${x},${y}`;
    })
    .join(" ");

  const currentY = GRAPH_HEIGHT - 30 - (percentage / 100) * (GRAPH_HEIGHT - 60);

  return (
    <main className="blow-detector" aria-labelledby="blow-detector-title">
      <section className="blow-detector__header">
        <div>
          <p className="blow-detector__eyebrow">Breath signal</p>
          <h1 id="blow-detector-title">Follow the line</h1>
        </div>
        <output className="blow-detector__value" aria-live="polite">
          {percentage}%
        </output>
      </section>

      <section className="signal-graph" aria-label={`Microphone level: ${percentage}%`}>
        <div className="signal-graph__axis signal-graph__axis--top">100</div>
        <div className="signal-graph__axis signal-graph__axis--bottom">0</div>
        <svg
          className="signal-graph__svg"
          viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
          role="img"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <line className="signal-graph__grid" x1="0" y1="30" x2={GRAPH_WIDTH} y2="30" />
          <line className="signal-graph__grid" x1="0" y1={GRAPH_HEIGHT / 2} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT / 2} />
          <line className="signal-graph__grid" x1="0" y1={GRAPH_HEIGHT - 30} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT - 30} />
          <line className="signal-graph__player-line" x1={PLAYER_X} y1="0" x2={PLAYER_X} y2={GRAPH_HEIGHT} />
          <polyline className="signal-graph__trail" points={points} />
          <circle className="signal-graph__player" cx={PLAYER_X} cy={currentY} r="7" />
        </svg>
        <span className="signal-graph__player-label">now</span>
      </section>

      {error && <p role="alert">{error.message}</p>}
      <button className="blow-detector__button" type="button" onClick={isActive ? stop : handleStart}>
        {isActive ? "Stop microphone" : "Start microphone"}
      </button>
    </main>
  );
}