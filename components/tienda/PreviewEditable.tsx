'use client';
// Solo en la vista previa del editor (dentro del iframe): al pasar el mouse sobre un bloque
// se marca con "Editar" y al tocarlo el editor abre la configuración de ese bloque.
import { useEffect } from 'react';

const CSS = `
[data-sec]{cursor:pointer}
[data-sec]:not(header){position:relative}
[data-sec]:hover{outline:2px dashed #2563eb;outline-offset:-2px}
[data-sec]:hover::before{content:"Editar · " attr(data-sec-nombre);position:absolute;top:8px;left:8px;z-index:60;background:#2563eb;color:#fff;font:600 12px/1.6 system-ui,sans-serif;padding:1px 8px;border-radius:4px;pointer-events:none}
`;

export default function PreviewEditable() {
  useEffect(() => {
    const w: any = globalThis as any;
    if (!w.parent || w.parent === w) return; // abierta sola (no dentro del editor): no hace nada
    const style = w.document.createElement('style');
    style.textContent = CSS;
    w.document.head.appendChild(style);
    const onClick = (e: any) => {
      const el = e.target?.closest?.('[data-sec]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      w.parent.postMessage({ tipo: 'nadin-editar', id: el.getAttribute('data-sec') }, w.location.origin);
    };
    w.document.addEventListener('click', onClick, true);
    return () => { w.document.removeEventListener('click', onClick, true); style.remove(); };
  }, []);
  return null;
}
