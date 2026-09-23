'use client';

import { useEffect, useRef, useState } from 'react';
import { normaliseMarks } from '@/lib/annotations';

// Rendering side of the damage marks. The shape of a mark, and the rules for
// what counts as a valid one, live in @/lib/annotations so the server can apply
// them too — see that file for the data model.
export { MARK_COLORS, DEFAULT_COLOR, normaliseMarks, markCount } from '@/lib/annotations';

// ---------------------------------------------------------------------------
// AnnotationLayer — read-only overlay, sized to whatever box it's dropped into.
//
// It measures itself rather than drawing in a fixed viewBox: an arrowhead or a
// circle stretched by a non-uniform viewBox stops reading as an arrow or a
// circle. Measured pixels keep every mark the shape it was drawn as.
// ---------------------------------------------------------------------------
export function AnnotationLayer({ marks, minimal = false }) {
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shapes = normaliseMarks(marks);

  return (
    <div ref={ref} className="anno-layer" aria-hidden="true">
      {box.w > 1 && box.h > 1 && shapes.length > 0 && (
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
          {shapes.map(m => (
            <Mark key={m.id} m={m} w={box.w} h={box.h} minimal={minimal} />
          ))}
        </svg>
      )}
    </div>
  );
}

// A single mark, drawn in pixel space. `minimal` drops the text labels — on a
// thumbnail they'd cover the damage they're pointing at.
// `hit` draws the same geometry as an invisible, much thicker copy: a 2px
// stroke is impossible to land a fingertip on, so the editor stacks one of
// these underneath each mark to catch the tap.
export function Mark({ m, w, h, minimal = false, selected = false, hit = false }) {
  const stroke = Math.max(1.5, Math.min(w, h) * 0.008);
  const x1 = m.x1 * w, y1 = m.y1 * h, x2 = m.x2 * w, y2 = m.y2 * h;
  const common = {
    stroke: hit ? 'transparent' : m.color,
    strokeWidth: hit ? Math.max(stroke * 6, 22) : (selected ? stroke * 1.5 : stroke),
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    // A red line on a red car is invisible; the shadow lifts every colour off
    // whatever it's drawn over. The hit copy skips it — blurring something
    // invisible costs paint time for nothing.
    style: hit
      // 'stroke' hits the stroke area whether or not it's painted, so the fat
      // transparent copy still catches the tap.
      ? { pointerEvents: 'stroke' }
      : { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.85))' },
  };

  let shape = null;
  if (m.type === 'arrow') {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const head = Math.max(stroke * 3.2, Math.min(len * 0.34, Math.min(w, h) * 0.09));
    const ux = dx / len, uy = dy / len;      // unit vector along the shaft
    const px = -uy, py = ux;                 // and its perpendicular
    const bx = x2 - ux * head, by = y2 - uy * head;
    const wing = head * 0.42;
    shape = (
      <>
        {/* Stop the shaft at the head so it doesn't show through the point. */}
        <line x1={x1} y1={y1} x2={bx} y2={by} {...common} />
        <polygon
          points={`${x2},${y2} ${bx + px * wing},${by + py * wing} ${bx - px * wing},${by - py * wing}`}
          {...common}
          fill={hit ? 'transparent' : m.color}
          style={hit ? { pointerEvents: 'all' } : common.style}
        />
      </>
    );
  } else if (m.type === 'circle') {
    shape = (
      <ellipse
        cx={(x1 + x2) / 2} cy={(y1 + y2) / 2}
        rx={Math.abs(x2 - x1) / 2} ry={Math.abs(y2 - y1) / 2}
        {...common}
      />
    );
  } else if (m.type === 'box') {
    shape = (
      <rect
        x={Math.min(x1, x2)} y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)}
        rx={stroke} {...common}
      />
    );
  }

  // The label sits at the tail of an arrow (the end you drew from, away from
  // the damage) and above the top-left corner of a box or circle.
  const label = m.label?.trim();
  const showLabel = label && !minimal && !hit;
  const anchorX = m.type === 'arrow' ? x1 : Math.min(x1, x2);
  const anchorY = m.type === 'arrow' ? y1 : Math.min(y1, y2);
  const fontSize = Math.max(11, Math.min(w, h) * 0.032);

  return (
    <g>
      {shape}
      {(showLabel || (m.type === 'text' && !hit)) && (
        <LabelChip
          x={anchorX} y={anchorY} w={w}
          text={m.type === 'text' ? (label || 'Label') : label}
          color={m.color} fontSize={fontSize} above={m.type !== 'text'}
        />
      )}
    </g>
  );
}

// Text on a photo needs its own ground to sit on — a caption straight onto a
// picture is unreadable over half of it.
function LabelChip({ x, y, w, text, color, fontSize, above }) {
  const padX = fontSize * 0.45;
  const padY = fontSize * 0.3;
  const width = text.length * fontSize * 0.56 + padX * 2;
  const height = fontSize + padY * 2;
  // Keep the chip inside the frame when the mark sits near an edge.
  const cx = Math.min(Math.max(x, 2), Math.max(2, w - width - 2));
  const cy = above ? Math.max(2, y - height - fontSize * 0.35) : y;

  return (
    <>
      <rect x={cx} y={cy} width={width} height={height} rx={fontSize * 0.28}
        fill="rgba(6,10,18,.86)" stroke={color} strokeWidth={1} />
      <text
        x={cx + padX} y={cy + padY + fontSize * 0.8}
        fill={color} fontSize={fontSize} fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {text}
      </text>
    </>
  );
}
