// theme.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  const body = document.body;

  let theme = localStorage.getItem('theme') ||
              (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  body.classList.add(theme + '-theme');
  updateIcon(theme);

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      body.classList.replace(body.classList[0], theme + '-theme');
      localStorage.setItem('theme', theme);
      updateIcon(theme);
    });
  }

  function updateIcon(th) {
    if (toggle) {
      toggle.innerHTML = th === 'dark'
        ? '<i class="fa-solid fa-sun-bright"></i>'
        : '<i class="fa-solid fa-moon-stars"></i>';
    }
  }

  // Fade-in
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});
