const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const sectionStart = source.lastIndexOf('/*', source.indexOf('3. TYPEWRITER SYSTEM'));
const sectionEnd = source.lastIndexOf('/*', source.indexOf('4. HERO STAGED ENTRANCE'));
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, 'Find the production typewriter section');
const typewriterSource = source.slice(sectionStart, sectionEnd);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const verse = html.match(/id="heroTypewriter"[^>]*data-text="([^"]+)"/)[1];

function textNode(value) {
  return {
    nodeType: 3,
    data: value,
    get textContent() { return this.data; },
    set textContent(text) { this.data = text; }
  };
}

function element() {
  const el = {
    nodeType: 1,
    childNodes: [],
    className: '',
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    appendChild(node) { this.childNodes.push(node); return node; },
    insertBefore(node, reference) {
      const index = this.childNodes.indexOf(reference);
      assert.notEqual(index, -1);
      this.childNodes.splice(index, 0, node);
      return node;
    },
    get textContent() { return this.childNodes.map(node => node.textContent).join(''); },
    set textContent(value) { this.childNodes = value ? [textNode(value)] : []; }
  };
  el.classList = {
    contains(name) { return el.className.split(/\s+/).includes(name); },
    add(name) { if (!this.contains(name)) el.className += ` ${name}`; }
  };
  return el;
}

function harness({ fallback = false, reducedMotion = false } = {}) {
  const queue = [];
  const active = new Set();
  let nextId = 0;
  function schedule(callback, interval) {
    const id = ++nextId;
    active.add(id);
    queue.push({ id, callback, interval });
    return id;
  }
  const context = {
    Intl: fallback ? {} : Intl,
    prefersReducedMotion: reducedMotion,
    document: { createTextNode: textNode, createElement: element },
    setTimeout: callback => schedule(callback, false),
    clearTimeout: id => active.delete(id),
    setInterval: callback => schedule(callback, true),
    clearInterval: id => active.delete(id)
  };
  vm.runInNewContext(`${typewriterSource}\nglobalThis.runTypewriter = typewrite;`, context);
  return {
    typewrite: context.runTypewriter,
    flush(onFrame) {
      let count = 0;
      while (queue.length) {
        assert.ok(++count < 5000, 'Animation timers must finish');
        const task = queue.shift();
        if (!active.has(task.id)) continue;
        if (!task.interval) active.delete(task.id);
        task.callback();
        onFrame();
        if (task.interval && active.has(task.id)) queue.push(task);
      }
    }
  };
}

async function animateAndCheck(text, segments, options = {}) {
  const runner = harness(options);
  const el = element();
  const prefixes = new Set(['']);
  let prefix = '';
  for (const segment of segments) prefixes.add(prefix += segment);
  const seen = new Set();
  function checkFrame() {
    const nodes = el.childNodes.filter(node => node.nodeType === 3);
    assert.equal(nodes.length, 1, 'Arabic must stay in one text node for contextual shaping');
    assert.ok(prefixes.has(el.textContent), `Do not expose a partial Arabic grapheme: ${el.textContent}`);
    seen.add(el.textContent);
  }
  const completion = runner.typewrite(el, text, { cursor: options.cursor ?? false, speed: 1 });
  checkFrame();
  runner.flush(checkFrame);
  await completion;
  assert.equal(el.textContent, text, 'Preserve every character in logical reading order');
  if (!options.reducedMotion) {
    for (const boundary of prefixes) {
      if (boundary) assert.ok(seen.has(boundary), `Reveal the complete grapheme at ${boundary}`);
    }
  }
  if (options.cursor) {
    const cursor = el.childNodes.find(node => node.nodeType === 1);
    assert.ok(cursor?.classList.contains('tw-cursor'));
    assert.ok(cursor.classList.contains('tw-cursor-out'), 'Cursor finishes without replacing the text');
  }
}

test('the actual Quran verse stays in one text run throughout its animation', async () => {
  const segments = Array.from(new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(verse), part => part.segment);
  await animateAndCheck(verse, segments);
});

const markedSegments = ['بِ', 'سْ', 'مِ', ' ', 'ا', 'ل', 'لَّ', 'هِ', '\n', 'ا', 'ل', 'رَّ', 'حْ', 'مَٰ', 'نِ', '،', ' ', 'وَ', 'رَ', 'حْ', 'مَ', 'ةً', '.'];
const markedText = markedSegments.join('');

for (const fallback of [false, true]) {
  test(`Arabic marks, stacked marks, dagger alif and newlines remain intact (${fallback ? 'older browser fallback' : 'Intl.Segmenter'})`, async () => {
    await animateAndCheck(markedText, markedSegments, { fallback, cursor: true });
  });
}

test('reduced motion shows the whole verse immediately and completes the cursor', async () => {
  await animateAndCheck(verse, [verse], { fallback: true, reducedMotion: true, cursor: true });
});
