/* Chỉ xử lý chế độ sáng/tối, không sửa chức năng JobConnect. */
(() => {
  const key = 'jobconnect-ui-theme-v1';
  const root = document.documentElement;
  let mode = 'light';
  try { mode = localStorage.getItem(key) === 'dark' ? 'dark' : 'light'; } catch (_) {}
  function apply(value) {
    mode = value;
    root.setAttribute('data-theme', value);
    root.style.colorScheme = value;
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const dark = value === 'dark';
    btn.querySelector('.theme-toggle-icon').textContent = dark ? '☀' : '☾';
    btn.querySelector('.theme-toggle-label').textContent = dark ? 'Sáng' : 'Tối';
    btn.setAttribute('aria-label', dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
    btn.setAttribute('aria-pressed', String(dark));
  }
  apply(mode);
  document.addEventListener('DOMContentLoaded', () => {
    apply(mode);
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const next = mode === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(key, next); } catch (_) {}
    });
  });
})();
