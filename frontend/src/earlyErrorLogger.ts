function renderError(msg: string) {
  try {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<pre style="white-space:pre-wrap;color:#ff6b6b;background:#111;padding:16px;border-radius:8px;font-family:monospace">${msg}</pre>`;
    }
  } catch (e) {
    // swallow
  }
}

window.addEventListener('error', (ev) => {
  const err = ev.error || ev.message || 'Unknown error';
  renderError(String(err));
});

window.addEventListener('unhandledrejection', (ev) => {
  const reason = (ev.reason && (ev.reason.message || ev.reason)) || 'Unhandled rejection';
  renderError(String(reason));
});

export {};
