export function focusElementById(id: string) {
  const el = document.getElementById(id);
  if (el) el.focus();
}

export function setAriaLabel(el: HTMLElement, label: string) {
  el.setAttribute('aria-label', label);
}

export function toggleHighContrast(enable: boolean) {
  document.body.classList.toggle('high-contrast', enable);
} 