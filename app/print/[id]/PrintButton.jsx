'use client';

export default function PrintButton() {
  return (
    <div className="no-print toolbar">
      <button onClick={() => window.history.back()} className="tb tb-ghost">← Back</button>
      <button onClick={() => window.print()} className="tb tb-primary">Print / Save as PDF</button>
      <style>{`
        .toolbar {
          position: fixed; top: 14px; right: 16px; z-index: 20;
          display: flex; gap: 8px;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .tb {
          padding: .5rem .85rem; border-radius: 4px; font-size: .82rem;
          font-weight: 600; cursor: pointer; border: 1px solid transparent;
          font-family: inherit;
        }
        .tb-primary { background: #0f2544; color: #fff; }
        .tb-primary:hover { background: #1e3a63; }
        .tb-ghost { background: #fff; color: #445061; border-color: #cbd2dc; }
        .tb-ghost:hover { background: #f3f5f8; }
      `}</style>
    </div>
  );
}
