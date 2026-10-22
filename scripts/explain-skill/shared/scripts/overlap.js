// Spacing check for an explainer page. Run it in the page (browser console or a javascript tool).
// It returns every label that overlaps another label, sits within 3px of an arrow, partly covers a shape,
// or runs off the edge of its picture. An empty list means the spacing passes.
// Stacked pairs (a name with its note directly under it) are allowed to touch; this check uses no padding.
(() => {
  const out = [];
  const hit = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
  const inside = (a, b) => a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.width <= b.x + b.width + 1 && a.y + a.height <= b.y + b.height + 1;
  [...document.querySelectorAll('.card svg')].forEach((svg, n) => {
    const vb = svg.viewBox.baseVal, pic = `picture ${n + 1}`;
    const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[style*="opacity:0"]')).map(t => ({ t: t.textContent.trim(), b: t.getBBox() }));
    const arrows = [...svg.querySelectorAll('.ar')];
    const shapes = [...svg.querySelectorAll(':scope > rect, :scope > use, :scope > g > rect')].map(s => ({ n: s.tagName + (s.getAttribute('href') || ''), b: s.getBBox() }));
    texts.forEach((a, i) => {
      if (a.b.x < vb.x || a.b.y < vb.y || a.b.x + a.b.width > vb.x + vb.width || a.b.y + a.b.height > vb.y + vb.height) out.push(`${pic}: "${a.t}" runs off the edge`);
      texts.slice(i + 1).forEach(b => { if (hit(a.b, b.b)) out.push(`${pic}: "${a.t}" overlaps "${b.t}"`); });
      arrows.forEach(p => { const L = p.getTotalLength(); for (let d = 0; d <= L; d += 2) { const q = p.getPointAtLength(d);
        if (q.x > a.b.x - 3 && q.x < a.b.x + a.b.width + 3 && q.y > a.b.y - 3 && q.y < a.b.y + a.b.height + 3) { out.push(`${pic}: an arrow is within 3px of "${a.t}"`); break; } } });
      shapes.forEach(s => { if (hit(a.b, s.b) && !inside(a.b, s.b)) out.push(`${pic}: "${a.t}" partly covers ${s.n}`); });
    });
  });
  return [...new Set(out)];
})();
