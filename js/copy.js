// Copy buttons next to contacts: the icon turns into a check and the label says it worked.
export function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.getAttribute('aria-label');
    let timer = 0;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
      } catch {
        // Older browsers or blocked clipboard: select the text through a hidden field.
        const field = Object.assign(document.createElement('textarea'), { value: button.dataset.copy });
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;opacity:0';
        document.body.append(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      button.classList.add('is-copied');
      button.setAttribute('aria-label', button.dataset.copied);
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.classList.remove('is-copied');
        button.setAttribute('aria-label', label);
      }, 1800);
    });
  });
}
