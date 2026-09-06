'use client';

import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { searchPickList } from '@/lib/picklist';

// ---------------------------------------------------------------------------
// Combo — a text input with a filtered suggestion list.
// Typing filters the options (prefix matches first, then anything containing
// the query); focusing with an empty box shows the whole list. Free text is
// always allowed, so an import or a model we don't list can still be typed.
// ---------------------------------------------------------------------------
export function Combo({ label, value, onChange, options = [], placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = String(value || '').trim().toLowerCase();
    if (!q) return options;
    const starts = options.filter(o => o.toLowerCase().startsWith(q));
    const contains = options.filter(
      o => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q),
    );
    return [...starts, ...contains];
  }, [value, options]);

  // Close when focus or a click lands outside the widget.
  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  useEffect(() => { setActive(0); }, [value]);

  const choose = (opt) => { onChange(opt); setOpen(false); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActive(a => (matches.length ? (a + dir + matches.length) % matches.length : 0));
    } else if (e.key === 'Enter') {
      if (open && matches[active]) { e.preventDefault(); choose(matches[active]); }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && <label className="label">{label}</label>}
      <input
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" className="combo-list">
          {matches.slice(0, 60).map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={i === active}
              className={'combo-option' + (i === active ? ' is-active' : '')}
              onMouseEnter={() => setActive(i)}
              // mousedown, not click — click fires after blur has closed the list.
              onMouseDown={(e) => { e.preventDefault(); choose(opt); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NumberField — accepts digits only.
// Deliberately type="text" + inputMode: a native type="number" still lets you
// type "e", "+" and "-" (it reports them as an empty value), which is how junk
// ends up in an hours or price column. Here anything that isn't a digit or a
// single decimal point never makes it into state.
// ---------------------------------------------------------------------------
export function NumberField({ label, value, onChange, decimals = 2, maxLength, ...rest }) {
  const clean = (raw) => {
    let s = String(raw).replace(/[^0-9.]/g, '');       // digits and dots only
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {                              // keep just the first dot
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    }
    if (decimals === 0) s = s.replace(/\./g, '');
    else if (firstDot !== -1) {
      const [int, frac = ''] = s.split('.');
      s = int + '.' + frac.slice(0, decimals);
    }
    if (maxLength) s = s.slice(0, maxLength);
    return s;
  };

  const input = (
    <input
      className="input"
      type="text"
      inputMode={decimals === 0 ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={value ?? ''}
      onChange={e => onChange(clean(e.target.value))}
      onPaste={e => {
        e.preventDefault();
        onChange(clean(e.clipboardData.getData('text')));
      }}
      {...rest}
    />
  );

  if (!label) return input;
  return <div><label className="label">{label}</label>{input}</div>;
}

// ---------------------------------------------------------------------------
// PickField — description box backed by the Crashzone pick list.
// Which group it searches follows the line's type, so a labour line offers R&R
// items and a paint line offers paint items. Choosing a row that carries a
// standard time hands the hours back to the caller as well as the description.
// Typing anything else is still fine — this only suggests.
// ---------------------------------------------------------------------------
export function PickField({ group, value, onChange, onPick, placeholder }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listId = useId();

  const matches = useMemo(
    () => (group ? searchPickList(group, value) : []),
    [group, value],
  );

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  useEffect(() => { setActive(0); }, [value, group]);

  const choose = (row) => {
    onChange(row.description);
    onPick?.(row);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActive(a => (matches.length ? (a + dir + matches.length) % matches.length : 0));
    } else if (e.key === 'Enter') {
      if (open && matches[active]) { e.preventDefault(); choose(matches[active]); }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" className="combo-list pick-list">
          {matches.map((row, i) => (
            <li
              key={row.code + row.area}
              role="option"
              aria-selected={i === active}
              className={'combo-option pick-option' + (i === active ? ' is-active' : '')}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(row); }}
            >
              <span className="pick-code">{row.code}</span>
              <span className="pick-desc">{row.description}</span>
              <span className="pick-area">{row.area}</span>
              {row.hours > 0 && <span className="pick-hrs">{row.hours}h</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
