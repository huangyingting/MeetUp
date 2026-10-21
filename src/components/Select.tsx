import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

type Option = { value: string; label: string };
type SelectProps = {
  id: string;
  name?: string;
  options: readonly Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export default function Select({ id, name, options, value, defaultValue, onChange, disabled = false }: SelectProps) {
  const initialValue = defaultValue ?? options[0]?.value ?? '';
  const [internalValue, setInternalValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ text: '', time: 0 });
  const selectedValue = value ?? internalValue;
  const selected = options.find(option => option.value === selectedValue);
  const unavailable = disabled || options.length === 0;

  function close() {
    setOpen(false);
    search.current.text = '';
  }

  function placeMenu() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - 14;
    const above = rect.top - 14;
    const upwards = below < 240 && above > below;
    const width = Math.min(rect.width, window.innerWidth - 24);
    setPosition({
      width, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      maxHeight: Math.max(48, Math.min(320, upwards ? above : below)),
      ...(upwards ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  }

  function show(index = Math.max(0, options.findIndex(option => option.value === selectedValue))) {
    if (unavailable) return;
    setPortalRoot(trigger.current?.closest('dialog') || document.body);
    placeMenu();
    setActiveIndex(index);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value);
    close();
    trigger.current?.focus();
  }

  useEffect(() => {
    const form = trigger.current?.form;
    function reset(event: Event) {
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setInternalValue(initialValue);
        setOpen(false);
        search.current.text = '';
      });
    }
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [initialValue, value]);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !list.current?.contains(event.target)) close();
    }
    const dialog = trigger.current?.closest('dialog');
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    dialog?.addEventListener('close', close);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
      dialog?.removeEventListener('close', close);
    };
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'Escape') {
      if (open) { event.preventDefault(); event.stopPropagation(); close(); }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(activeIndex); else show();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) show();
      else setActiveIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : options.length - 1;
      if (open) setActiveIndex(index); else show(index);
      return;
    }
    if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const now = Date.now();
    const query = (now - search.current.time < 600 ? search.current.text : '') + event.key.toLocaleLowerCase();
    search.current = { text: query, time: now };
    const prefix = [...query].every(character => character === query[0]) ? query[0] : query;
    const start = prefix.length === 1 ? (open ? activeIndex + 1 : 0) : activeIndex;
    for (let offset = 0; offset < options.length; offset++) {
      const index = (start + offset) % options.length;
      if (options[index].label.toLocaleLowerCase().startsWith(prefix)) {
        if (open) setActiveIndex(index); else show(index);
        break;
      }
    }
  }

  return <>
    {name && <input type="hidden" name={name} value={selectedValue} disabled={unavailable} />}
    <button ref={trigger} type="button" id={id} role="combobox" className="field custom-select-trigger"
      aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="listbox" aria-expanded={open}
      aria-controls={open ? `${id}-listbox` : undefined}
      aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
      disabled={unavailable} onClick={() => open ? close() : show()} onKeyDown={keyDown}>
      <span id={`${id}-value`}>{selected?.label || 'Select an option'}</span>
      <ChevronDown size={16} aria-hidden="true" className={open ? 'rotate-180' : ''} />
    </button>
    {open && portalRoot && createPortal(
      <div ref={list} id={`${id}-listbox`} role="listbox" aria-labelledby={`${id}-label`} className="custom-select-menu" style={position}>
        {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option"
          aria-selected={option.value === selectedValue} data-option-index={index} data-active={index === activeIndex}
          className="custom-select-option" onPointerMove={event => { if (event.pointerType === 'mouse') setActiveIndex(index); }}
          onPointerDown={event => { if (event.pointerType === 'mouse') event.preventDefault(); }} onClick={() => choose(index)}>
          <span>{option.label}</span>{option.value === selectedValue && <Check size={16} aria-hidden="true" />}
        </div>)}
      </div>, portalRoot,
    )}
  </>;
}
