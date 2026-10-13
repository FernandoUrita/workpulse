import { useEffect, useId, useRef } from 'react';

const dialogs = [];
let originalOverflow = '';
export function useModalDialog(open, onClose) {
 const ref = useRef(null);
 const closeRef = useRef(onClose);
 const id = useId();
 useEffect(() => { closeRef.current = onClose; }, [onClose]);
 useEffect(() => {
  const dialog = ref.current;
  if (!open || !dialog) return;
  const previous = document.activeElement;
  if (!dialogs.length) { originalOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  dialogs.push(dialog);
  const heading = dialog.querySelector('.modal-header h3, .confirm-title');
  const previousId = heading?.id;
  if (heading) { if (!heading.id) heading.id = `${id}-title`; dialog.setAttribute('aria-labelledby',heading.id); }
  const annotate = () => {
   dialog.querySelectorAll('.form-group').forEach((group, index) => {
    const label = group.querySelector('label');
    const controls = group.querySelectorAll('input,select,textarea');
    if (label && controls.length === 1 && !label.htmlFor && !label.contains(controls[0])) {
     const control = controls[0];
     if (!control.id) control.id = `${id}-field-${index}`;
     label.htmlFor = control.id;
    }
   });
  };
  annotate();
  const observer = new MutationObserver(annotate);
  observer.observe(dialog,{ childList: true, subtree: true });
  const frame = requestAnimationFrame(() => dialog.focus());
  const focusable = () => [...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
  const keydown = event => {
   if (dialogs.at(-1) !== dialog) return;
   if (event.key === 'Escape') {
    // Native selects and composition should finish their own interaction first.
    if (event.isComposing || document.activeElement?.tagName === 'SELECT') return;
    const close = dialog.querySelector('.close-modal, .confirm-cancel');
    if (close?.disabled) return;
    event.preventDefault(); event.stopPropagation(); closeRef.current?.();
   } else if (event.key === 'Tab') {
    const nodes = focusable(), first = nodes[0], last = nodes.at(-1);
    if (!nodes.length) { event.preventDefault(); dialog.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
   }
  };
  const focusin = event => { if (dialogs.at(-1) === dialog && !dialog.contains(event.target)) dialog.focus(); };
  document.addEventListener('keydown',keydown,true);
  document.addEventListener('focusin',focusin);
  return () => {
   observer.disconnect();
   cancelAnimationFrame(frame);
   document.removeEventListener('keydown',keydown,true);
   document.removeEventListener('focusin',focusin);
   const index = dialogs.indexOf(dialog); if (index >= 0) dialogs.splice(index,1);
   if (!dialogs.length) document.body.style.overflow = originalOverflow;
   if (heading && !previousId) heading.removeAttribute('id');
   if (previous?.isConnected) previous.focus();
  };
 }, [open,id]);
 return { ref, role: 'dialog', 'aria-modal': true, tabIndex: -1 };
}
