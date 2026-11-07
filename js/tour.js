/* Guided tour (v1.8.0): dims the page, highlights one part at a time and says what it is for.
   Tour.run(steps, { t, onEnd }) where steps = [{ target: CSS selector or null, title: i18n key, text: i18n key }].
   A step whose target is missing or hidden is shown in the middle of the screen with nothing highlighted.
   onEnd(finished) runs once: true after the last step, false after Skip or Escape.
   It is a modal <dialog>, so the page behind cannot be tapped or tabbed to while the tour is open. */
(function () {
  'use strict';

  let open = null;   // the running tour, so a second start does nothing

  function shown(node) { return !!node && node.getClientRects().length > 0; }

  function run(steps, opts) {
    if (open || !steps.length) return false;
    const t = opts.t, PAD = 6, GAP = 12, EDGE = 16;
    const before = document.activeElement;
    const dlg = document.createElement('dialog');
    dlg.className = 'tour';
    dlg.id = 'tourDlg';
    dlg.setAttribute('aria-labelledby', 'tourTitle');
    dlg.setAttribute('aria-describedby', 'tourText');
    const hole = document.createElement('div'); hole.className = 'tour-hole'; hole.setAttribute('aria-hidden', 'true');
    const pop = document.createElement('div'); pop.className = 'tour-pop';
    const say = document.createElement('div'); say.setAttribute('aria-live', 'polite');
    const count = document.createElement('p'); count.className = 'tour-step'; count.id = 'tourStep';
    const title = document.createElement('h3'); title.id = 'tourTitle';
    const text = document.createElement('p'); text.id = 'tourText';
    say.append(count, title, text);
    const row = document.createElement('div'); row.className = 'tour-actions';
    const button = (cls, id) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.id = id; return b; };
    const skip = button('ghost tour-skip', 'tourSkip'), back = button('secondary tour-back', 'tourBack'), next = button('primary tour-next', 'tourNext');
    row.append(skip, back, next);
    pop.append(say, row);
    dlg.append(hole, pop);
    document.body.append(dlg);

    let i = 0, target = null, done = false;

    function place() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const r = target && shown(target) ? target.getBoundingClientRect() : null;
      hole.classList.toggle('none', !r);
      const box = r ? { l: r.left - PAD, t: r.top - PAD, w: r.width + 2 * PAD, h: r.height + 2 * PAD } : { l: vw / 2, t: vh / 2, w: 0, h: 0 };
      Object.assign(hole.style, { left: box.l + 'px', top: box.t + 'px', width: box.w + 'px', height: box.h + 'px' });
      const pw = pop.offsetWidth, ph = pop.offsetHeight;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      let top;
      if (!r) top = (vh - ph) / 2;
      else if (box.t + box.h + GAP + ph <= vh - EDGE) top = box.t + box.h + GAP;   // below the highlight
      else if (box.t - GAP - ph >= EDGE) top = box.t - GAP - ph;                   // above it
      else top = vh - EDGE - ph;                                                   // a tall highlight: over its lower edge
      const left = r ? clamp(box.l + box.w / 2 - pw / 2, EDGE, vw - EDGE - pw) : (vw - pw) / 2;
      pop.style.top = Math.max(EDGE, top) + 'px';
      pop.style.left = Math.max(EDGE, left) + 'px';
    }

    function show(k) {
      i = k;
      const step = steps[i], last = i === steps.length - 1;
      target = step.target ? document.querySelector(step.target) : null;
      count.textContent = t('tour.step', { n: i + 1, total: steps.length });
      title.textContent = t(step.title);
      text.textContent = t(step.text);
      skip.textContent = t('tour.skip'); skip.hidden = last;
      back.textContent = t('tour.back'); back.hidden = i === 0;
      next.textContent = t(last ? 'tour.done' : 'tour.next');
      if (target && shown(target)) {
        // a tall part (the practice options) goes to the top of the screen, so the box below it covers as little as possible
        const h = target.getBoundingClientRect().height + 2 * PAD + GAP + pop.offsetHeight + 2 * EDGE;
        if (h > window.innerHeight * 0.75 && getComputedStyle(target).position !== 'fixed') {
          window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - EDGE - PAD));
        } else target.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
      place();
      next.focus();
    }

    function finish(finished) {
      if (done) return;
      done = true;
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      if (ro) ro.disconnect();
      if (dlg.open) dlg.close();
      dlg.remove();
      open = null;
      if (before && before.isConnected && typeof before.focus === 'function') before.focus();
      if (opts.onEnd) opts.onEnd(finished);
    }

    next.addEventListener('click', () => (i === steps.length - 1 ? finish(true) : show(i + 1)));
    back.addEventListener('click', () => { if (i > 0) show(i - 1); });
    skip.addEventListener('click', () => finish(false));
    dlg.addEventListener('cancel', e => { e.preventDefault(); finish(false); });   // Escape
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); back.click(); }
    });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    // fonts and late layout move things after the first placement
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => place()) : null;
    if (ro) ro.observe(document.body);

    open = { finish };
    dlg.showModal();
    show(0);
    return true;
  }

  window.Tour = { run, get running() { return !!open; }, stop() { if (open) open.finish(false); } };
})();
