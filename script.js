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

  // Each caption is paired with the photo that has the same number.
  const galleryItems = [
    {
      name: "image 1",
      caption: "الحمدلله الذي بنعمته تتم الصالحات، البداية كانت حُلماً، واليوم أصبح واقعاً يجمعنا"
    },
    {
      name: "image 2",
      caption: "بين نموّ الحلم واكتمال النصيب، يسعدنا أن تشاركونا فرحة العمر"
    },
    {
      name: "image 3",
      caption: "الحمدلله الذي جعل نهاية الصبر جبراً، وجمعنا معاً في حلاله"
    },
    {
      name: "image 4",
      caption: "وشاءَ الله أن يجمعنا بالنصيب، ليُصبح حلم العمر حقيقة نعيشها معاً"
    },
    {
      name: "image 5",
      caption: "الحمدلله الذي توّج الصبر بجميل اللقاء، وجعلنا لبعضنا نصيباً وعمراً."
    }
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
     2. OPENING CURTAINS
     --------------------------------------------------------- */
  function initStoryEntrance(startAudio) {
    return new Promise((resolve) => {
      const gate = $('#storyGate');
      const openButton = $('#openInvitation');
      const invitation = $('#invitationPage');
      let opened = false;

      if (!gate || !openButton || !invitation) {
        if (invitation) invitation.hidden = false;
        document.body.classList.remove('no-scroll', 'story-closed');
        resolve();
        return;
      }

      document.body.classList.add('no-scroll');
      openButton.focus({ preventScroll: true });

      function openInvitation() {
        if (opened) return;
        opened = true;

        // Keep play() inside this actual click/keyboard gesture, before any await
        // or curtain animation, so mobile browsers can authorize the music.
        startAudio();
        openButton.disabled = true;
        invitation.inert = true;
        invitation.hidden = false;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        gate.classList.add('is-opening');

        setTimeout(() => {
          gate.hidden = true;
          invitation.inert = false;
          document.body.classList.remove('no-scroll', 'story-closed');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          const hero = $('#hero');
          if (hero) hero.focus({ preventScroll: true });
          resolve();
        }, prefersReducedMotion ? 0 : 1600);
      }

      // Tapping anywhere on the curtain opens it; the button also supports
      // Enter, Space, and assistive technology through native click behavior.
      gate.addEventListener('click', openInvitation);
      gate.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          openButton.focus({ preventScroll: true });
        }
      });
    });
  }

  /* ---------------------------------------------------------
     3. TYPEWRITER SYSTEM
     --------------------------------------------------------- */
  function segmentTypingText(text) {
    if (typeof Intl.Segmenter === 'function') {
      return Array.from(
        new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(text),
        (part) => part.segment
      );
    }

    // Older mobile browsers must reveal Arabic vowel marks with their letter.
    const segments = [];
    const arabicMark = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7-\u06e8\u06ea-\u06ed]/;
    for (const character of Array.from(text)) {
      if (segments.length && arabicMark.test(character)) {
        segments[segments.length - 1] += character;
      } else {
        segments.push(character);
      }
    }
    return segments;
  }

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
      // Keep one text run so Safari can shape and order connected Arabic letters.
      const textNode = document.createTextNode('');
      el.appendChild(textNode);
      let cursorSpan = null;

      if (showCursor) {
        cursorSpan = document.createElement('span');
        cursorSpan.className = 'tw-cursor';
        cursorSpan.setAttribute('aria-hidden', 'true');
        el.appendChild(cursorSpan);
      }

      if (prefersReducedMotion) {
        textNode.data = text;
        if (cursorSpan) cursorSpan.classList.add('tw-cursor-out');
        return resolve();
      }

      const chars = segmentTypingText(text);
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
        textNode.data += ch;

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

    await wait(650);
    if (tw) {
      tw.dataset.twDone = '1';
      await typewrite(tw, tw.getAttribute('data-text') || '', { speed: 38, cursor: false });
    }

    await wait(300);
    ayahSrc && ayahSrc.classList.add('is-in');

    await wait(500);
    names && names.classList.add('is-in');

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

          // The timeline fill line gets its own delayed drawing animation.
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
  function findGalleryImage(item) {
    return new Promise((resolve) => {
      let extensionIndex = 0;

      function tryNextExtension() {
        if (extensionIndex >= galleryImageExtensions.length) {
          resolve(null);
          return;
        }

        const extension = galleryImageExtensions[extensionIndex++];
        const src = `assets/images/${item.name}.${extension}`;
        const probe = new Image();
        probe.onload = () => resolve({ ...item, src });
        probe.onerror = tryNextExtension;
        probe.src = src;
      }

      tryNextExtension();
    });
  }

  async function initGallery() {
    const gallery = $('#photoGallery');
    const image = $('#galleryImage');
    const captionLayer = $('#galleryCaptionLayer');
    const caption = $('#galleryCaption');
    const captionLive = $('#galleryCaptionLive');
    const placeholder = $('#galleryPlaceholder');
    const prevButton = $('#galleryPrev');
    const nextButton = $('#galleryNext');
    const status = $('#galleryStatus');

    if (!gallery || !image || !captionLayer || !caption || !prevButton || !nextButton) return;
    if (status) status.textContent = 'جاري تحميل الصور…';

    const discovered = await Promise.all(galleryItems.map(findGalleryImage));
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
    captionLayer.hidden = false;
    prevButton.disabled = !hasMultipleImages;
    nextButton.disabled = !hasMultipleImages;
    gallery.classList.toggle('has-single-image', !hasMultipleImages);

    let isTransitioning = false;
    let captionsAreActive = false;
    let captionTimer = null;
    let captionRunId = 0;
    const fadeOutDelay = prefersReducedMotion ? 0 : 260;
    const fadeInDuration = prefersReducedMotion ? 0 : 380;

    function stopCaptionTyping() {
      captionRunId++;
      clearTimeout(captionTimer);
      captionTimer = null;
      caption.classList.remove('is-typing');
    }

    function typeGalleryCaption(text, announcement) {
      stopCaptionTyping();
      const activeRunId = captionRunId;
      caption.textContent = '';
      if (captionLive) captionLive.textContent = announcement;

      if (prefersReducedMotion) {
        caption.textContent = text;
        return;
      }

      const characters = segmentTypingText(text);
      let characterIndex = 0;
      caption.classList.add('is-typing');

      function typeNextCharacter() {
        if (activeRunId !== captionRunId) return;

        if (characterIndex >= characters.length) {
          caption.classList.remove('is-typing');
          return;
        }

        const character = characters[characterIndex++];
        caption.textContent += character;

        let delay = 58;
        if (character === '،' || character === ',') delay = 240;
        else if (character === '.' || character === '؛') delay = 340;

        captionTimer = setTimeout(typeNextCharacter, delay);
      }

      typeNextCharacter();
    }

    function renderCaption(current) {
      const imagePosition = formatNumber(currentIndex + 1);
      const imageTotal = formatNumber(images.length);
      typeGalleryCaption(current.caption, `الصورة ${imagePosition} من ${imageTotal}: ${current.caption}`);
    }

    function renderImage() {
      const current = images[currentIndex];
      const imagePosition = formatNumber(currentIndex + 1);
      const imageTotal = formatNumber(images.length);
      image.src = current.src;
      image.alt = `صورة للمهندس أيمن والمهندسة ماسة رقم ${imagePosition}`;
      if (captionsAreActive) renderCaption(current);

      if (status) {
        status.textContent = `الصورة ${imagePosition} من ${imageTotal}`;
      }

    }

    function moveGallery(step) {
      if (!hasMultipleImages || isTransitioning) return;
      isTransitioning = true;
      image.classList.add('is-changing');
      captionLayer.classList.add('is-changing');
      stopCaptionTyping();

      setTimeout(() => {
        currentIndex = (currentIndex + step + images.length) % images.length;
        renderImage();

        requestAnimationFrame(() => {
          image.classList.remove('is-changing');
          captionLayer.classList.remove('is-changing');
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

    if ('IntersectionObserver' in window) {
      const captionObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        captionObserver.disconnect();

        setTimeout(() => {
          captionsAreActive = true;
          renderCaption(images[currentIndex]);
        }, prefersReducedMotion ? 0 : 480);
      }, { threshold: .35 });
      captionObserver.observe(gallery);
    } else {
      captionsAreActive = true;
    }

    renderImage();
  }

  /* ---------------------------------------------------------
     8. CONTINUOUS BURGUNDY PETALS
     --------------------------------------------------------- */
  function initFlowers() {
    if (prefersReducedMotion) return;
    const isSmallScreen = window.innerWidth < 640;
    const count = isSmallScreen ? 11 : 19;

    function createField(className, petalCount) {
      const field = document.createElement('div');
      field.className = className;
      field.setAttribute('aria-hidden', 'true');

      for (let i = 0; i < petalCount; i++) {
        const petal = document.createElement('span');
        const duration = 13 + Math.random() * 10;
        petal.className = `falling-petal petal-variant-${i % 3}`;
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.animationDuration = `${duration}s`;
        petal.style.animationDelay = `${-Math.random() * duration}s`;
        petal.style.setProperty('--petal-size', `${13 + Math.random() * 13}px`);
        petal.style.setProperty('--petal-drift', `${-70 + Math.random() * 140}px`);
        petal.style.setProperty('--petal-spin', Math.random() > .5 ? '280deg' : '-280deg');
        petal.style.setProperty('--petal-tilt', `${Math.random() * 180}deg`);
        field.appendChild(petal);
      }

      return field;
    }

    document.body.appendChild(createField('flower-field', count));
    const gate = $('#storyGate');
    if (gate) gate.appendChild(createField('story-petals', isSmallScreen ? 8 : 13));
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
     10. BACKGROUND MUSIC — STARTED BY THE ENTRANCE GESTURE
     --------------------------------------------------------- */
  function initBackgroundAudio() {
    const audio = $('#backgroundAudio');
    if (!audio) return () => {};

    audio.loop = true;
    audio.volume = 0.72;

    function startAudio() {
      try {
        const playAttempt = audio.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
          // An audio loading failure must not block opening the invitation.
          playAttempt.catch(() => {});
        }
      } catch (error) {
        // Keep the invitation usable if the browser cannot play the audio.
      }
    }

    return startAudio;
  }

  /* ---------------------------------------------------------
     11. HERO VIDEO — SLOW PLAYBACK + PAUSE WHEN TAB HIDDEN
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
    const startAudio = initBackgroundAudio();
    initSmoothScroll();
    initVideoPerf();
    initCountdown();
    initGallery();
    initFlowers();
    await initStoryEntrance(startAudio);
    initScrollReveals();
    initHeroAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
