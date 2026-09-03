/* =========================================================
   أيمن × ماسة — Wedding Invitation
   Vanilla JS animation & interaction system
   ========================================================= */

(() => {
  'use strict';

  /* ---------------------------------------------------------
     0. EDITABLE WEDDING DATA
     --------------------------------------------------------- */
  const wedding = {
    groom: "المهندس أيمن",
    bride: "المهندسة ماسة",
    date: "2026-09-20", // YYYY-MM-DD — used by countdown & date display
    day: "الأحد",
    time: "16:00",
    timeDisplay: "٤ مساءً",
    venue: "كافيه ايليت بلازا",
    address: " دمشق - الميدان - ساحة الأشمر - خلف كازية المهايني ",
    mapsUrl: "https://maps.app.goo.gl/wzRsoxYNZk2EFQvQA",
    whatsapp: "0949330851"
  };

  // Add your photos to assets/images as: image 1.jpg, image 2.png, etc.
  // Up to six images are detected automatically in the supported formats below.
  const galleryImageNames = [
    "image 1", "image 2", "image 3",
    "image 4", "image 5", "image 6"
  ];
  const galleryImageExtensions = ["jpg", "jpeg", "png", "webp"];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. HELPERS
     --------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  function formatArabicDate(isoDate) {
    try {
      const d = new Date(isoDate + 'T00:00:00');
      return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(d);
    } catch (e) {
      return isoDate;
    }
  }

  function applyWeddingData() {
    const dateDisplay = formatArabicDate(wedding.date);

    $$('[data-field]').forEach((el) => {
      const field = el.getAttribute('data-field');
      if (field === 'dateDisplay') el.textContent = dateDisplay;
      else if (wedding[field]) el.textContent = wedding[field];
    });

    const timeEl = $('[data-field="time"]');
    if (timeEl && wedding.timeDisplay) timeEl.textContent = wedding.timeDisplay;

    const mapLink = $('#mapLink');
    if (mapLink) mapLink.href = wedding.mapsUrl;

    const rsvpLink = $('#rsvpLink');
    if (rsvpLink) {
      const msg = encodeURIComponent(`نتشرف بحضوركم حفل خطوبة ${wedding.groom} و${wedding.bride}`);
      rsvpLink.href = `https://wa.me/${wedding.whatsapp}?text=${msg}`;
    }
  }

  /* ---------------------------------------------------------
     2. LOADER
     --------------------------------------------------------- */
  function initLoader() {
    return new Promise((resolve) => {
      const loader = $('#loader');
      const minDuration = prefersReducedMotion ? 200 : 1900;

      const finish = () => {
        if (!loader) return resolve();
        loader.classList.add('is-hidden');
        document.body.classList.remove('no-scroll');
        setTimeout(resolve, prefersReducedMotion ? 0 : 700);
      };

      document.body.classList.add('no-scroll');
      setTimeout(finish, minDuration);
    });
  }

  /* ---------------------------------------------------------
     3. TYPEWRITER SYSTEM
     --------------------------------------------------------- */
  function pauseForChar(ch, baseDelay) {
    if (ch === '،') return baseDelay + 180;
    if (ch === ',') return baseDelay + 180;
    if (ch === '.') return baseDelay + 300;
    if (ch === '\n') return baseDelay + 260;
    return baseDelay;
  }

  /**
   * Types text into `el` character by character.
   * @param {HTMLElement} el
   * @param {string} text
   * @param {{ speed?: number, cursor?: boolean }} opts
   */
  function typewrite(el, text, opts = {}) {
    const speed = opts.speed || 65;
    const showCursor = opts.cursor !== false;

    return new Promise((resolve) => {
      el.textContent = '';
      let cursorSpan = null;

      if (showCursor) {
        cursorSpan = document.createElement('span');
        cursorSpan.className = 'tw-cursor';
        el.appendChild(cursorSpan);
      }

      if (prefersReducedMotion) {
        el.textContent = text;
        if (showCursor) el.appendChild(cursorSpan);
        if (cursorSpan) cursorSpan.classList.add('tw-cursor-out');
        return resolve();
      }

      // Handle ellipsis as a unit for pacing purposes, but type per character.
      const chars = Array.from(text);
      let i = 0;

      function step() {
        if (i >= chars.length) {
          if (cursorSpan) {
            let blinks = 0;
            const blinkInterval = setInterval(() => {
              blinks++;
              if (blinks >= 4) {
                clearInterval(blinkInterval);
                cursorSpan.classList.add('tw-cursor-out');
                setTimeout(() => resolve(), 500);
              }
            }, 450);
          } else {
            resolve();
          }
          return;
        }

        const ch = chars[i];
        const textNode = document.createTextNode(ch === '\n' ? '\n' : ch);
        if (cursorSpan) {
          el.insertBefore(textNode, cursorSpan);
        } else {
          el.appendChild(textNode);
        }

        i++;
        const delay = pauseForChar(ch, speed);
        setTimeout(step, delay);
      }

      step();
    });
  }

  function initTypewriterFor(el) {
    if (el.dataset.twDone) return Promise.resolve();
    el.dataset.twDone = '1';
    const text = el.getAttribute('data-text') || '';
    const isBlock = el.classList.contains('typewriter-block');
    return typewrite(el, text, { speed: isBlock ? 60 : 75, cursor: true });
  }

  /* ---------------------------------------------------------
     4. HERO STAGED ENTRANCE
     --------------------------------------------------------- */
  async function initHeroAnimations() {
    const deco   = $('#heroDeco');
    const kicker = $('#heroKicker');
    const names  = $('#heroNames');
    const tw     = $('#heroTypewriter');
    const ayahSrc= $('#heroAyahSource');
    const divider= $('#heroDivider');
    const cta    = $('#heroCta');
    const scrollInd = $('#scrollIndicator');

    if (prefersReducedMotion) {
      [deco, kicker, names, ayahSrc, divider, cta, scrollInd].forEach((el) => el && el.classList.add('is-in'));
      if (tw) tw.textContent = tw.getAttribute('data-text') || '';
      return;
    }

    await wait(400);
    deco && deco.classList.add('is-in');

    await wait(400);
    kicker && kicker.classList.add('is-in');

    await wait(400);
    names && names.classList.add('is-in');

    await wait(600);
    if (tw) await initTypewriterFor(tw);

    await wait(300);
    ayahSrc && ayahSrc.classList.add('is-in');

    await wait(300);
    divider && divider.classList.add('is-in');

    await wait(300);
    cta && cta.classList.add('is-in');

    scrollInd && scrollInd.classList.add('is-in');
  }

  /* ---------------------------------------------------------
     5. SCROLL-TRIGGERED SECTION REVEALS
     --------------------------------------------------------- */
  async function runSectionSequence(section) {
    const items = $$('.reveal', section);
    if (!items.length) return;

    await wait(prefersReducedMotion ? 0 : 380);

    for (const el of items) {
      const kind = el.getAttribute('data-reveal');
      const tag = el.tagName.toLowerCase();

      if (el.classList.contains('typewriter')) {
        // typewriter elements are handled inline where they sit in flow
        await initTypewriterFor(el);
        await wait(prefersReducedMotion ? 0 : 250);
        continue;
      }

      el.classList.add('is-in');

      // stagger pacing depends on element role
      let delay = 260;
      if (kind === 'title') delay = 300;
      else if (kind === 'deco' || kind === 'line') delay = 220;
      else if (kind === 'card') delay = prefersReducedMotion ? 0 : 200;
      else if (kind === 'from-right') delay = 260;
      else if (kind === 'from-left') delay = 260;
      else if (kind === 'names') delay = 320;

      await wait(prefersReducedMotion ? 0 : delay);
    }
  }

  function initScrollReveals() {
    const sections = $$('.section');
    const seen = new WeakSet();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          runSectionSequence(entry.target);

          // extra: timeline fill line & couple grow-line get special treatment
          if (entry.target.id === 'timeline') {
            const fill = $('#timelineFill');
            if (fill) setTimeout(() => { fill.style.width = '100%'; }, 900);
          }

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    sections.forEach((s) => observer.observe(s));
  }

  /* ---------------------------------------------------------
     6. COUNTDOWN
     --------------------------------------------------------- */
  function initCountdown() {
    const target = new Date(`${wedding.date}T${wedding.time}:00`);
    const daysEl = $('#cd-days');
    const hoursEl = $('#cd-hours');
    const minsEl = $('#cd-minutes');
    const secsEl = $('#cd-seconds');
    if (!daysEl) return;

    const pad = (n) => String(Math.max(n, 0)).padStart(2, '0');

    function update() {
      const now = new Date();
      let diff = target.getTime() - now.getTime();
      if (diff < 0) diff = 0;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setValue(daysEl, pad(days));
      setValue(hoursEl, pad(hours));
      setValue(minsEl, pad(minutes));
      setValue(secsEl, pad(seconds));
    }

    function setValue(el, val) {
      if (el.textContent === val) return;
      el.classList.add('is-updating');
      requestAnimationFrame(() => {
        el.textContent = val;
        setTimeout(() => el.classList.remove('is-updating'), 220);
      });
    }

    update();
    setInterval(update, 1000);
  }

  /* ---------------------------------------------------------
     7. COUPLE PHOTO GALLERY
     --------------------------------------------------------- */
  function findGalleryImage(name) {
    return new Promise((resolve) => {
      let extensionIndex = 0;

      function tryNextExtension() {
        if (extensionIndex >= galleryImageExtensions.length) {
          resolve(null);
          return;
        }

        const extension = galleryImageExtensions[extensionIndex++];
        const src = `assets/images/${name}.${extension}`;
        const probe = new Image();
        probe.onload = () => resolve({ src, name });
        probe.onerror = tryNextExtension;
        probe.src = src;
      }

      tryNextExtension();
    });
  }

  async function initGallery() {
    const gallery = $('#photoGallery');
    const image = $('#galleryImage');
    const placeholder = $('#galleryPlaceholder');
    const prevButton = $('#galleryPrev');
    const nextButton = $('#galleryNext');
    const status = $('#galleryStatus');

    if (!gallery || !image || !prevButton || !nextButton) return;
    if (status) status.textContent = 'جاري تحميل الصور…';

    const discovered = await Promise.all(galleryImageNames.map(findGalleryImage));
    const images = discovered.filter(Boolean);

    if (!images.length) {
      if (status) status.textContent = 'بانتظار إضافة الصور';
      return;
    }

    let currentIndex = 0;
    const formatNumber = (value) => new Intl.NumberFormat('ar').format(value);
    const hasMultipleImages = images.length > 1;

    if (placeholder) placeholder.hidden = true;
    image.hidden = false;
    prevButton.disabled = !hasMultipleImages;
    nextButton.disabled = !hasMultipleImages;
    gallery.classList.toggle('has-single-image', !hasMultipleImages);

    let isTransitioning = false;
    const fadeOutDelay = prefersReducedMotion ? 0 : 260;
    const fadeInDuration = prefersReducedMotion ? 0 : 380;

    function renderImage() {
      const current = images[currentIndex];
      image.src = current.src;
      image.alt = `صورة للمهندس أيمن والمهندسة ماسة رقم ${formatNumber(currentIndex + 1)}`;

      if (status) {
        status.textContent = `الصورة ${formatNumber(currentIndex + 1)} من ${formatNumber(images.length)}`;
      }

    }

    function moveGallery(step) {
      if (!hasMultipleImages || isTransitioning) return;
      isTransitioning = true;
      image.classList.add('is-changing');

      setTimeout(() => {
        currentIndex = (currentIndex + step + images.length) % images.length;
        renderImage();

        requestAnimationFrame(() => {
          image.classList.remove('is-changing');
          setTimeout(() => { isTransitioning = false; }, fadeInDuration);
        });
      }, fadeOutDelay);
    }

    nextButton.addEventListener('click', () => moveGallery(1));
    prevButton.addEventListener('click', () => moveGallery(-1));

    gallery.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveGallery(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveGallery(-1);
      }
    });

    let touchStartX = null;
    gallery.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    gallery.addEventListener('touchend', (event) => {
      if (touchStartX === null) return;
      const distance = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) < 45) return;
      moveGallery(distance < 0 ? 1 : -1);
    }, { passive: true });

    renderImage();
  }

  /* ---------------------------------------------------------
     8. CONTINUOUS FALLING FLOWERS
     --------------------------------------------------------- */
  function initFlowers() {
    if (prefersReducedMotion) return;
    const isSmallScreen = window.innerWidth < 640;
    const count = isSmallScreen ? 10 : 20;
    const flowerSymbols = ['🌹', '🌸'];

    const field = document.createElement('div');
    field.className = 'flower-field';
    field.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < count; i++) {
      const flower = document.createElement('span');
      const duration = 10 + Math.random() * 9;
      flower.className = 'falling-flower';
      flower.textContent = flowerSymbols[i % flowerSymbols.length];
      flower.style.left = `${Math.random() * 100}%`;
      flower.style.fontSize = `${15 + Math.random() * 13}px`;
      flower.style.animationDuration = `${duration}s`;
      flower.style.animationDelay = `${-Math.random() * duration}s`;
      flower.style.setProperty('--flower-drift', `${-70 + Math.random() * 140}px`);
      flower.style.setProperty('--flower-spin', Math.random() > .5 ? '360deg' : '-360deg');
      field.appendChild(flower);
    }

    document.body.appendChild(field);
  }

  /* ---------------------------------------------------------
     9. SMOOTH SCROLL FOR IN-PAGE LINKS
     --------------------------------------------------------- */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ---------------------------------------------------------
     10. HERO VIDEO — SLOW PLAYBACK + PAUSE WHEN TAB HIDDEN
     --------------------------------------------------------- */
  // The clip is short (~5s), so we slow it down to feel deliberate
  // and cinematic rather than looping quickly. Lower = slower.
  // 1 = normal speed, 0.5 = half speed, 0.35 = very slow.
  const HERO_VIDEO_PLAYBACK_RATE = 0.4;

  function initVideoPerf() {
    const video = $('.hero-video');
    if (!video) return;

    const applyRate = () => {
      try { video.playbackRate = HERO_VIDEO_PLAYBACK_RATE; } catch (e) {}
    };
    applyRate();
    video.addEventListener('loadedmetadata', applyRate);
    // Some browsers reset playbackRate after a loop restarts.
    video.addEventListener('play', applyRate);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else video.play().then(applyRate).catch(() => {});
    });
  }

  /* ---------------------------------------------------------
     BOOTSTRAP
     --------------------------------------------------------- */
  async function main() {
    applyWeddingData();
    initSmoothScroll();
    initVideoPerf();
    initCountdown();
    initGallery();
    initFlowers();
    initScrollReveals();

    await initLoader();
    initHeroAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
