import React, { useEffect, useRef } from 'react';
import './RiskGauge.css';

const RADIUS = 80;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = Math.PI * RADIUS; // half-circle

export default function RiskGauge({ score = 0, size = 220, showLabel = true }) {
  const progressRef = useRef(null);

  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE;

  const getColor = (s) => {
    if (s >= 80) return '#ef4444';
    if (s >= 60) return '#f97316';
    if (s >= 35) return '#f59e0b';
    return '#22c55e';
  };

  const getLabel = (s) => {
    if (s >= 80) return 'CRITICAL';
    if (s >= 60) return 'HIGH';
    if (s >= 35) return 'MODERATE';
    return 'LOW';
  };

  const color = getColor(clampedScore);
  const label = getLabel(clampedScore);

  // Animated stroke
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.strokeDashoffset = CIRCUMFERENCE;
      setTimeout(() => {
        if (progressRef.current) {
          progressRef.current.style.strokeDashoffset = offset;
        }
      }, 100);
    }
  }, [offset]);

  const svgSize = size;
  const cx = size / 2;
  const cy = size * 0.56;

  return (
    <div className="gauge-container" style={{ width: size }}>
      <svg width={svgSize} height={svgSize * 0.6} viewBox={`0 0 ${svgSize} ${svgSize * 0.6}`}>
        {/* Background arc */}
        <path
          d={describeArc(cx, cy, RADIUS, 180, 360)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />

        {/* Colored segments background */}
        <path d={describeArc(cx, cy, RADIUS, 180, 247)} fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth={STROKE_WIDTH} />
        <path d={describeArc(cx, cy, RADIUS, 248, 295)} fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth={STROKE_WIDTH} />
        <path d={describeArc(cx, cy, RADIUS, 296, 331)} fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth={STROKE_WIDTH} />
        <path d={describeArc(cx, cy, RADIUS, 332, 360)} fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth={STROKE_WIDTH} />

        {/* Progress arc */}
        <path
          ref={progressRef}
          d={describeArc(cx, cy, RADIUS, 180, 360)}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }}
        />

        {/* Score text */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="gauge-score" style={{ fill: color }}>
          {clampedScore}
        </text>

        {showLabel && (
          <text x={cx} y={cy + 16} textAnchor="middle" className="gauge-label" style={{ fill: color }}>
            {label} RISK
          </text>
        )}

        {/* Min/Max labels */}
        <text x={cx - RADIUS - 4} y={cy + 4} textAnchor="middle" className="gauge-minmax">0</text>
        <text x={cx + RADIUS + 4} y={cy + 4} textAnchor="middle" className="gauge-minmax">100</text>
      </svg>
    </div>
  );
}

// Helper: SVG arc path descriptor
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}
