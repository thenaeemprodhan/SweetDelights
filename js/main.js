// Shared behaviour for every page. Each feature only runs if its
// elements exist on the current page.

// Icons come from the SVG sprite at the top of each page's <body>
const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true"><use href="#${name}"></use></svg>`;

const formatPrice = (value) => `£${value.toFixed(2)}`;

// ---------- Mobile navigation ----------
function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('hidden', !open);
    toggle.querySelector('use').setAttribute('href', open ? '#x' : '#menu');
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

// ---------- Product cards ----------
function productCard(p) {
  const enquire = `contact.html?product=${encodeURIComponent(p.name)}`;
  return `
    <article class="product-card" data-category="${p.category}">
      <div class="overflow-hidden">
        <img src="${p.image}" alt="${p.name}" width="600" height="450" loading="lazy" class="aspect-[4/3] w-full object-cover">
      </div>
      <div class="flex flex-1 flex-col p-6">
        <span class="eyebrow">${CATEGORY_LABELS[p.category]}</span>
        <h3 class="mt-2 text-2xl font-semibold">${p.name}</h3>
        <p class="mt-2 flex-1 text-sm leading-relaxed text-muted">${p.description}</p>
        <div class="mt-5 flex items-center justify-between border-t border-sand pt-4">
          <p><span class="text-xl font-bold text-maroon">${formatPrice(p.price)}</span>
             <span class="text-xs text-muted">/ ${p.unit}</span></p>
          <a href="${enquire}" class="inline-flex items-center gap-1 text-sm font-semibold text-maroon hover:text-saffron">
            Order ${icon('arrow-right', 'h-4 w-4')}
          </a>
        </div>
      </div>
    </article>`;
}

function initFeatured() {
  const grid = document.querySelector('[data-featured]');
  if (!grid) return;
  grid.innerHTML = PRODUCTS.filter((p) => p.featured).map(productCard).join('');
}

function initCollection() {
  const grid = document.querySelector('[data-collection]');
  if (!grid) return;
  const buttons = document.querySelectorAll('[data-filter]');
  const count = document.querySelector('[data-count]');

  const show = (category) => {
    const items = category === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
    grid.innerHTML = items.map(productCard).join('');
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === category)));
    if (count) count.textContent = `${items.length} sweet${items.length === 1 ? '' : 's'}`;
  };

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      history.replaceState(null, '', b.dataset.filter === 'all' ? location.pathname : `#${b.dataset.filter}`);
      show(b.dataset.filter);
    }),
  );

  const fromHash = location.hash.slice(1);
  show(CATEGORY_LABELS[fromHash] ? fromHash : 'all');
}

// ---------- Image slider (Our Story) ----------
function initSlider() {
  const slider = document.querySelector('[data-slider]');
  if (!slider) return;
  const track = slider.querySelector('[data-track]');
  const slides = [...track.children];
  const dotsWrap = slider.querySelector('[data-dots]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer;

  dotsWrap.innerHTML = slides
    .map((_, i) => `<button type="button" class="h-2.5 rounded-full bg-white/60 transition-all" aria-label="Go to slide ${i + 1}"></button>`)
    .join('');
  const dots = [...dotsWrap.children];

  const go = (i) => {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((s, n) => s.setAttribute('aria-hidden', String(n !== index)));
    dots.forEach((d, n) => {
      d.classList.toggle('w-8', n === index);
      d.classList.toggle('bg-white', n === index);
      d.classList.toggle('w-2.5', n !== index);
      d.setAttribute('aria-current', n === index ? 'true' : 'false');
    });
  };

  const start = () => {
    if (reduceMotion) return;
    stop();
    timer = setInterval(() => go(index + 1), 5000);
  };
  const stop = () => clearInterval(timer);

  slider.querySelector('[data-prev]').addEventListener('click', () => { go(index - 1); start(); });
  slider.querySelector('[data-next]').addEventListener('click', () => { go(index + 1); start(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { go(i); start(); }));
  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  slider.addEventListener('focusin', stop);
  slider.addEventListener('focusout', start);

  // Swipe on touch screens
  let startX = null;
  slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stop(); }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
    start();
  });

  go(0);
  start();
}

// ---------- Contact form ----------
function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const success = document.querySelector('[data-form-success]');

  // Pre-fill the message when arriving from a product's "Order" link
  const product = new URLSearchParams(location.search).get('product');
  if (product) {
    form.subject.value = 'order';
    form.message.value = `Hello! I'd like to order ${product}. `;
  }

  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
    message: (v) => v.trim().length >= 10 || 'Please write a message of at least 10 characters.',
  };

  const check = (field) => {
    const result = rules[field.name](field.value);
    const error = form.querySelector(`[data-error-for="${field.name}"]`);
    const ok = result === true;
    field.setAttribute('aria-invalid', String(!ok));
    error.textContent = ok ? '' : result;
    error.classList.toggle('hidden', ok);
    return ok;
  };

  Object.keys(rules).forEach((name) => {
    form[name].addEventListener('blur', () => check(form[name]));
    form[name].addEventListener('input', () => {
      if (form[name].getAttribute('aria-invalid') === 'true') check(form[name]);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = Object.keys(rules).map((n) => form[n]);
    const valid = fields.map(check).every(Boolean);
    if (!valid) {
      fields.find((f) => f.getAttribute('aria-invalid') === 'true').focus();
      return;
    }
    // This is a static site, so nothing is actually sent.
    // Connect a form service (e.g. Formspree) here to receive real messages.
    success.querySelector('[data-success-name]').textContent = form.name.value.trim().split(' ')[0];
    form.classList.add('hidden');
    success.classList.remove('hidden');
    success.focus();
  });

  success.querySelector('[data-form-reset]').addEventListener('click', () => {
    form.reset();
    success.classList.add('hidden');
    form.classList.remove('hidden');
    form.name.focus();
  });
}

// ---------- Footer year ----------
function initYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFeatured();
  initCollection();
  initSlider();
  initContactForm();
  initYear();
});
