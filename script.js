'use strict';
/* =========================================================
   4年の算数 たいけんノート  script.js
   1) 共通部品  2) 単元データ  3) 画面  4) 保護者・プリント
   ========================================================= */
(() => {

/* ---------- 1. 共通部品 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fx = x => Math.round(x * 1e6) / 1e6;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const toHalf = s => String(s).replace(/[０-９．－]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[ー−]/g, '-');
function num(s) { s = toHalf(s ?? '').replace(/[,，、\s]/g, ''); if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN; return Number(s); }
const isPow10 = (u, a) => u !== 0 && a !== 0 && u !== a && Number.isInteger(fx(Math.log10(Math.abs(u / a))));
const strip = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '[図]').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* 分数の表示 */
const fr = (n, d, w) => `${w ? `<span class="fw">${w}</span>` : ''}<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const frMix = (N, d) => { const w = Math.floor(N / d), n = N % d; return n === 0 ? `${w}` : fr(n, d, w || ''); };

/* 漢数字・大きな数 */
const KD = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function kg(g) { let s = ''; [[1000, '千'], [100, '百'], [10, '十'], [1, '']].forEach(([u, c]) => { const d = Math.floor(g / u) % 10; if (d) s += (d === 1 && u > 1 ? '' : KD[d]) + c; }); return s; }
function toKanji(n) { if (n === 0) return '零'; const U = ['', '万', '億', '兆']; let s = '', i = 0; while (n > 0) { const g = n % 10000; if (g) s = kg(g) + U[i] + s; n = Math.floor(n / 10000); i++; } return s; }
function toMix(n) { if (n === 0) return '0'; const U = ['', '万', '億', '兆']; let s = '', i = 0; while (n > 0) { const g = n % 10000; if (g) s = g + U[i] + s; n = Math.floor(n / 10000); i++; } return s; }
function groupStr(n) { let s = String(n); while (s.length % 4) s = '0' + s; const g = s.match(/.{4}/g), U = ['', '万', '億', '兆']; return g.map((x, i) => (i === 0 ? String(Number(x)) : x) + U[g.length - 1 - i]).join(' '); }

/* ---------- つまずきの種類 ---------- */
const TAGS = {
  calc: { name: '計算・読みとりのミス', tip: '途中の式や筆算を書いて、答えが出たらもう一度見直しましょう。' },
  bigZero: { name: '大きな数の 0 の書き落とし', tip: '位取り表を使い、右から4けたずつ区切って書きます。何もない位には 0 を書きます。' },
  bigShift: { name: '10倍・100倍・1/10 の位の動き', tip: '10倍で位が1つ上がり、100倍で2つ上がります。1/10 では位が1つ下がります。' },
  manshin: { name: '万・億・兆のしくみ', tip: '1万の1万倍が1億、1億の1万倍が1兆です。4けたごとに新しい単位になります。' },
  roundRule: { name: '四捨五入のきまり', tip: 'がい数にする位の1つ下の位を見て、0〜4なら切り捨て、5〜9なら切り上げます。' },
  roundPlace: { name: 'がい数にする位のとりちがい', tip: '「何の位までのがい数か」を確かめ、その1つ下の位に印をつけてから考えます。' },
  purpose: { name: '目的に合った見積もり', tip: '足りなくならないようにするなら切り上げ、少なくともいくらあるかを知るなら切り捨てを使います。' },
  range: { name: '以上・以下・未満の範囲', tip: '「以上・以下」はその数をふくみ、「未満」はふくみません。数直線にかいて確かめます。' },
  divEst: { name: '商の見当となおし方', tip: 'わる数を何十とみて見当をつけます。ひけなければ商を1小さく、あまりがわる数以上なら1大きくします。' },
  divMul: { name: 'わり算の中のかけ算', tip: '「わる数 × 商」をくり上がりに気をつけて計算します。くり上がりは小さくメモしよう。' },
  divSub: { name: 'わり算の中のひき算', tip: '一の位から順にひきます。ひけないときは、となりの位から1かりてきます。' },
  divDown: { name: '数のおろしわすれ', tip: 'ひき算のあとは、つぎの位の数字をおろしてから、また商をたてます。' },
  divRem: { name: 'あまりがわる数より大きい', tip: '最後に「あまり < わる数」になっているか必ず確かめます。' },
  divPlace: { name: '商のたつ位・0 のたてわすれ', tip: '下の位を指でかくして、商がどの位からたつかを決めます。おろした数がわる数より小さいときは 0 をたてます。' },
  decAlign: { name: '小数点をそろえていない', tip: '小数のたし算・ひき算は、小数点の位置をたてにそろえて計算します。' },
  decPoint: { name: '小数点の位置', tip: '小数×整数、小数÷整数は、かけられる数・わられる数の小数点にそろえて答えに小数点をうちます。' },
  decPlace: { name: '小数の位のしくみ', tip: '0.1 が10こで1、0.01 が10こで0.1 です。位取り表で確かめます。' },
  fracConv: { name: '仮分数と帯分数のなおし方', tip: '仮分数 → 帯分数は「分子 ÷ 分母」の商が整数、あまりが分子。帯分数 → 仮分数は「整数×分母＋分子」。' },
  fracDen: { name: '分母どうしをたしている', tip: '分母が同じ分数のたし算・ひき算は、分母はそのままで分子だけを計算します。' },
  fracBorrow: { name: '帯分数のひき算のくり下がり', tip: '分子がひけないときは、整数から1をくり下げて仮分数にしてからひきます。' },
  order: { name: '計算の順じょ', tip: '×、÷ は ＋、− より先に計算します。先に計算するところに線を引きましょう。' },
  paren: { name: '（ ）のある式', tip: '（ ）の中をひとまとまりとみて、いちばん先に計算します。' },
  distrib: { name: '分配のきまりの使い方', tip: '（100−2）×6 は 100×6 − 2×6。かける数は両方にかかります。' },
  box: { name: '□を求める考え方', tip: '□ × 6 = 54 なら □ = 54 ÷ 6。たし算はひき算、かけ算はわり算で □ を求めます。' },
  soroGo: { name: 'そろばんの五玉の読み方', tip: 'はりに近づいている上の玉（五玉）は5を表します。下の玉1つは1です。' },
  soroPlace: { name: 'そろばんの位の読み方', tip: '定位点（はりの点）のあるけたを一の位と決めて、左へ十、百…と読みます。' },
  protractor: { name: '分度器の目もりの読みちがい', tip: '角の辺が 0 に重なっているほうの目もり（内側か外側か）を読みます。' },
  reflex: { name: '180° をこえる角', tip: '180°＋のこりの角、または 360°−反対側の角 で求めます。' },
  turn: { name: '回転の角の大きさ', tip: '直角は90°、半回転は180°、1回転は360°です。' },
  quadDef: { name: '四角形・直線の関係の決まり', tip: '台形は平行が1組、平行四辺形は2組、ひし形は4つの辺がすべて等しい四角形です。' },
  quadProp: { name: '四角形の辺・角・対角線の性質', tip: '平行四辺形の向かい合う角は等しく、となり合う角の和は180°です。対角線の特ちょうは表で整理しましょう。' },
  parallelAngle: { name: '平行な直線と角', tip: '平行な直線は、ほかの直線と同じ角度で交わります。一直線は180°です。' },
  areaPerim: { name: '面積と周りの長さの混同', tip: '面積は「たて×横」、周りの長さは辺の長さをたしたものです。' },
  areaComposite: { name: '組み合わせた図形の面積', tip: '長方形に分けてたすか、大きな長方形から欠けた部分をひきます。' },
  areaUnit: { name: '面積の単位のかんさん', tip: '1a=100m²、1ha=100a、1km²=100ha、1m²=10000cm²。辺の長さが10倍になると面積は100倍です。' },
  areaInverse: { name: '面積から辺の長さを求める', tip: '横の長さ = 面積 ÷ たての長さ です。' },
  solidParts: { name: '面・辺・頂点の数', tip: '直方体・立方体は面6、辺12、頂点8。見取り図で数えて確かめます。' },
  solidRel: { name: '面や辺の平行・垂直', tip: '1つの面に平行な面は1つ、垂直な面は4つです。' },
  solidNet: { name: '展開図の向かい合う面', tip: '展開図では、1つおいたとなりの面が向かい合います。組み立てるところを想像しましょう。' },
  position: { name: '位置の表し方', tip: '（横，たて）や（横，たて，高さ）の順番で表します。順番をとりちがえないようにします。' },
  pattern: { name: 'きまりの見つけ方', tip: '表にかいて、1つふえると何本ふえるかを調べます。最初の1本も忘れずに。' },
  relation: { name: 'ともなって変わる2つの量の関係', tip: '表を横に見るだけでなく、たてに見て「□と○の関係」をことばの式にします。' },
  formula: { name: '□と○を使った式', tip: 'ことばの式をつくってから、□と○にあてはめます。' },
  ratioDiff: { name: '「差」と「何倍」の混同', tip: '何倍かは「くらべる量 ÷ もとにする量」で求めます。ひき算ではありません。' },
  ratioBase: { name: 'もとにする量のとらえ方', tip: '「○の何倍」の ○ がもとにする量です。テープ図にかいて考えます。' },
  graphScale: { name: 'グラフの1目もりの大きさ', tip: '目もりの数字と線の数を見て、1目もりがいくつかを先に確かめます。' },
  graphRead: { name: '折れ線グラフの読みとり', tip: '線のかたむきが急なほど変わり方が大きいです。点の位置を横の線までたどって読みます。' },
  graphWave: { name: '波線・グラフの選び方', tip: '波線は目もりのとちゅうを省いた印。変化が実際より大きく見えるので目もりも確かめます。' },
};

/* ---------- SVG 部品 ---------- */
const P = (a, r, cx, cy) => [fx(cx + r * Math.cos(a * Math.PI / 180)), fx(cy - r * Math.sin(a * Math.PI / 180))];

function soroDraw(ds, live) {
  const W = ds.length * 46 + 24, H = 210;
  let g = `<svg viewBox="0 0 ${W} ${H}" class="soro${live ? ' soro-live' : ''}" role="img" aria-label="そろばん" width="${W}">`;
  g += `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="8" class="sframe"/><rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="light-dark(#fff8ec,#2b2416)" style="fill:#fff8ec"/>`;
  ds.forEach((d, i) => {
    const x = 24 + i * 46; g += `<line x1="${x}" y1="10" x2="${x}" y2="${H - 10}" class="srod"/>`;
  });
  g += `<rect x="10" y="62" width="${W - 20}" height="8" class="sbeam"/>`;
  ds.forEach((d, i) => {
    const x = 24 + i * 46;
    g += `<ellipse data-r="${i}" data-b="h" cx="${x}" cy="${d >= 5 ? 50 : 22}" rx="19" ry="10" class="bead"/>`;
    const c = d % 5;
    for (let j = 0; j < 4; j++) { const y = j < c ? 81 + j * 21 : 111 + j * 21; g += `<ellipse data-r="${i}" data-b="${j}" cx="${x}" cy="${y}" rx="19" ry="10" class="bead"/>`; }
    if ((ds.length - 1 - i) % 3 === 0) g += `<circle cx="${x}" cy="66" r="3" class="sdot"/>`;
  });
  return g + '</svg>';
}
const soroSVG = (n, rods = 6) => soroDraw(String(n).padStart(rods, '0').slice(-rods).split('').map(Number));

function angleSVG(deg, { prot = false, label = '', given = null } = {}) {
  const full = deg > 180, W = 300, H = full ? 300 : 178, cx = 150, cy = full ? 150 : 165, L = 128;
  const p = (a, r) => P(a, r, cx, cy);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="角の図">`;
  if (prot && !full) {
    s += `<path d="M${cx - 120} ${cy} A120 120 0 0 1 ${cx + 120} ${cy} Z" class="prot"/>`;
    for (let t = 0; t <= 180; t += 5) {
      const [x1, y1] = p(t, 120), [x2, y2] = p(t, t % 10 ? 113 : 106);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tick"/>`;
      if (t % 10 === 0) { const [ox, oy] = p(t, 97), [ix, iy] = p(t, 82); s += `<text x="${ox}" y="${oy}" class="to">${t}</text><text x="${ix}" y="${iy}" class="ti">${180 - t}</text>`; }
    }
  }
  const [ax, ay] = p(0, L), [bx, by] = p(deg, L), rs = full ? 56 : 36, [s0x, s0y] = p(0, rs), [s1x, s1y] = p(deg, rs);
  s += `<path d="M${cx} ${cy} L${s0x} ${s0y} A${rs} ${rs} 0 ${deg > 180 ? 1 : 0} 0 ${s1x} ${s1y} Z" class="sec"/>`;
  if (given !== null) { const [g0x, g0y] = p(deg, 24), [g1x, g1y] = p(360, 24); s += `<path d="M${g0x} ${g0y} A24 24 0 0 0 ${g1x} ${g1y}" class="dash"/>`; const [tx, ty] = p(deg + (360 - deg) / 2, 46); s += `<text x="${tx}" y="${ty}" class="lbl s">${given}°</text>`; }
  s += `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" class="ln"/><line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" class="ln"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="currentColor"/>`;
  if (label) { const [lx, ly] = p(deg / 2, 54); s += `<text x="${lx}" y="${ly}" class="lbl ac">${label}</text>`; }
  return s + '</svg>';
}

function parSVG(a, mode) {
  const W = 320, H = 210, y1 = 60, y2 = 150, X1 = 175, ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
  const X2 = fx(X1 - (y2 - y1) * ca / sa);
  const t1 = 55, t2 = (y2 - y1) / sa + 45;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="平行な直線と角">`;
  s += `<line x1="10" y1="${y1}" x2="310" y2="${y1}" class="ln"/><line x1="10" y1="${y2}" x2="310" y2="${y2}" class="ln"/>`;
  s += `<line x1="${fx(X1 + t1 * ca)}" y1="${fx(y1 - t1 * sa)}" x2="${fx(X1 - t2 * ca)}" y2="${fx(y1 + t2 * sa)}" class="ln"/>`;
  s += `<text x="300" y="${y1 - 10}" class="lbl s">ア</text><text x="300" y="${y2 - 10}" class="lbl s">イ</text>`;
  const arc = (cx, cy, f, t, lab) => { const [px, py] = P(f, 26, cx, cy), [qx, qy] = P(t, 26, cx, cy), [lx, ly] = P((f + t) / 2, 42, cx, cy); return `<path d="M${px} ${py} A26 26 0 0 0 ${qx} ${qy}" class="arc"/><text x="${lx}" y="${ly}" class="lbl ac">${lab}</text>`; };
  s += arc(X1, y1, 0, a, `${a}°`);
  s += mode === 'same' ? arc(X2, y2, 0, a, '？') : arc(X2, y2, a, 180, '？');
  return s + '</svg>';
}

function lshapeSVG(W1, H1, w2, h2) {
  const u = Math.min(20, 220 / W1, 160 / H1), ox = 40, oy = 20, X = v => fx(ox + v * u), Y = v => fx(oy + v * u);
  const pts = [[0, 0], [W1 - w2, 0], [W1 - w2, h2], [W1, h2], [W1, H1], [0, H1]];
  let s = `<svg viewBox="0 0 ${fx(W1 * u + 90)} ${fx(H1 * u + 60)}" width="${fx(W1 * u + 90)}" role="img" aria-label="組み合わせた図形">`;
  s += `<polygon points="${pts.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" class="fill1"/>`;
  s += `<text x="${X((W1 - w2) / 2)}" y="${Y(0) - 9}" class="lbl s">${W1 - w2}cm</text>`;
  s += `<text x="${X(0) - 22}" y="${Y(H1 / 2)}" class="lbl s">${H1}cm</text>`;
  s += `<text x="${X(W1 / 2)}" y="${Y(H1) + 14}" class="lbl s">${W1}cm</text>`;
  s += `<text x="${X(W1) + 24}" y="${Y((h2 + H1) / 2)}" class="lbl s">${H1 - h2}cm</text>`;
  return s + '</svg>';
}

function cuboidSVG(mode) {
  const V = { A: [40, 75], B: [190, 75], C: [190, 165], D: [40, 165], E: [100, 30], F: [250, 30], G: [250, 120], H: [100, 120] };
  const L = (p, q, cl) => `<line x1="${V[p][0]}" y1="${V[p][1]}" x2="${V[q][0]}" y2="${V[q][1]}" class="${cl}"/>`;
  let s = `<svg viewBox="0 0 290 190" width="290" role="img" aria-label="直方体の見取り図">`;
  const face = (ps, cl) => `<polygon points="${ps.map(p => V[p].join(',')).join(' ')}" class="${cl}"/>`;
  s += face(['A', 'B', 'C', 'D'], mode === 'face' ? 'fill1' : 'fill0') + face(['A', 'E', 'F', 'B'], mode === 'face' ? 'fill2' : 'fill0') + face(['B', 'F', 'G', 'C'], mode === 'face' ? 'fill1' : 'fill0');
  const hid = 'dash' + (mode === 'edge' ? ' hi' : '');
  s += L('E', 'H', hid) + L('H', 'G', hid) + L('D', 'H', hid);
  const vis = 'ln' + (mode === 'edge' ? ' hi' : '');
  [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'E'], ['E', 'F'], ['F', 'B'], ['F', 'G'], ['G', 'C']].forEach(([p, q]) => s += L(p, q, vis));
  if (mode === 'vertex') Object.values(V).forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="6" class="vx"/>`);
  return s + '</svg>';
}

function netSVG(hl) {
  const F = { ア: [10, 60], イ: [60, 60], ウ: [110, 60], エ: [160, 60], オ: [60, 10], カ: [60, 110] };
  let s = `<svg viewBox="0 0 220 170" width="220" role="img" aria-label="立方体の展開図">`;
  for (const [k, [x, y]] of Object.entries(F)) s += `<rect x="${x}" y="${y}" width="50" height="50" class="${k === hl ? 'fill1' : 'fill0'}"/><text x="${x + 25}" y="${y + 26}" class="lbl">${k}</text>`;
  return s + '</svg>';
}

function gridSVG(px, py, n = 6) {
  const g = 30, ox = 40, oy = 20 + n * g;
  let s = `<svg viewBox="0 0 ${n * g + 70} ${n * g + 60}" width="${n * g + 70}" role="img" aria-label="方眼と点">`;
  for (let i = 0; i <= n; i++) { s += `<line x1="${ox + i * g}" y1="${oy}" x2="${ox + i * g}" y2="${oy - n * g}" class="gline"/><line x1="${ox}" y1="${oy - i * g}" x2="${ox + n * g}" y2="${oy - i * g}" class="gline"/>`; s += `<text x="${ox + i * g}" y="${oy + 16}" class="lbl s">${i}</text><text x="${ox - 14}" y="${oy - i * g}" class="lbl s">${i}</text>`; }
  s += `<line x1="${ox}" y1="${oy}" x2="${ox + n * g + 10}" y2="${oy}" class="ln"/><line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - n * g - 10}" class="ln"/>`;
  s += `<text x="${ox + n * g + 22}" y="${oy}" class="lbl s">横</text><text x="${ox}" y="${oy - n * g - 18}" class="lbl s">たて</text><text x="${ox - 12}" y="${oy + 14}" class="lbl s">A</text>`;
  s += `<circle cx="${ox + px * g}" cy="${oy - py * g}" r="7" class="pt"/><text x="${ox + px * g + 14}" y="${oy - py * g - 12}" class="lbl">P</text>`;
  return s + '</svg>';
}

function matchSVG(n) {
  const g = 34, W = n * g + 20;
  let s = `<svg viewBox="0 0 ${W} 60" width="${W}" role="img" aria-label="ぼうでつくった正方形">`;
  for (let i = 0; i < n; i++) s += `<line x1="${10 + i * g + 3}" y1="10" x2="${10 + (i + 1) * g - 3}" y2="10" class="ln2"/><line x1="${10 + i * g + 3}" y1="${10 + g}" x2="${10 + (i + 1) * g - 3}" y2="${10 + g}" class="ln2"/>`;
  for (let i = 0; i <= n; i++) s += `<line x1="${10 + i * g}" y1="13" x2="${10 + i * g}" y2="${10 + g - 3}" class="ln2"/>`;
  return s + '</svg>';
}

function chartSVG(vals, { lo = 0, hi, step, lab, xl, wave = false, unit = '度', xunit = '月' }) {
  const W = 400, H = 260, l = 50, r = 14, t = 20, b = 40, iw = W - l - r, ih = H - t - b;
  const y = v => fx(t + ih - (v - lo) / (hi - lo) * ih), x = i => fx(l + (i + .5) * iw / vals.length);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="折れ線グラフ">`;
  for (let v = lo; v <= hi + 1e-9; v = fx(v + step)) { s += `<line x1="${l}" y1="${y(v)}" x2="${W - r}" y2="${y(v)}" class="gline"/>`; if (Math.abs(fx(v / lab) - Math.round(v / lab)) < 1e-9) s += `<text x="${l - 14}" y="${y(v)}" class="lbl s">${v}</text>`; }
  s += `<line x1="${l}" y1="${t - 6}" x2="${l}" y2="${t + ih}" class="ln"/><line x1="${l}" y1="${t + ih}" x2="${W - r}" y2="${t + ih}" class="ln"/>`;
  if (wave) { const yy = t + ih + 12; s += `<path d="M${l - 8} ${yy - 4} l4 -4 l4 8 l4 -8 l4 8 l4 -4" class="ln"/><text x="${l - 14}" y="${t + ih + 24}" class="lbl s">0</text>`; }
  s += `<text x="${l - 6}" y="8" class="lbl s">(${unit})</text>`;
  s += `<polyline points="${vals.map((v, i) => x(i) + ',' + y(v)).join(' ')}" class="ln2"/>`;
  vals.forEach((v, i) => { s += `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="var(--ac)"/><text x="${x(i)}" y="${t + ih + (wave ? 32 : 16)}" class="lbl s">${xl[i]}</text>`; });
  s += `<text x="${W - r - 6}" y="${H - 4}" class="lbl s">(${xunit})</text>`;
  return s + '</svg>';
}

/* ---------- 2. 単元データ ---------- */
const AREAS = {
  num: { name: '数と計算', color: 'var(--num)' },
  shape: { name: '図形', color: 'var(--shape)' },
  change: { name: '変化と関係', color: 'var(--change)' },
  data: { name: 'データの活用', color: 'var(--data)' },
};
const ch = (q, ans, choices, tag, sol, extra = {}) => ({ q, input: 'choice', ans, choices: shuffle(choices), defTag: tag, ansText: ans, sol, ...extra });

/* わり算の問題づくり */
const estQ = (cur, v) => Math.min(9, Math.floor(cur / (Math.floor(v / 10) * 10)));
function divSteps(D, v) { const s = String(D); let k = 1; while (Number(s.slice(0, k)) < v) k++; let cur = Number(s.slice(0, k)); const out = []; for (let i = k - 1; i < s.length; i++) { if (i > k - 1) cur = cur * 10 + Number(s[i]); const q = Math.floor(cur / v); out.push({ cur, q }); cur -= q * v; } return out; }
const divNeedsFix = (D, v) => divSteps(D, v).some(x => x.cur >= v && estQ(x.cur, v) !== x.q);
function genDiv(L) {
  for (let t = 0; t < 3000; t++) {
    let v, q;
    if (L === 1) { v = R(12, 49); q = R(2, 9); } else if (L === 2) { v = R(12, 98); q = R(2, 9); } else if (L === 3) { v = R(12, 49); q = R(10, 99); } else if (L === 5) { v = R(12, 45); q = R(1, 9) * 10; } else { v = R(13, 98); q = R(2, 40); }
    const D = v * q + R(0, v - 1);
    if (L === 1 && D > 99) continue;
    if (L > 1 && (D < 100 || D > 999)) continue;
    if (L === 4 && !divNeedsFix(D, v)) continue;
    return { D, v };
  }
  return { D: 221, v: 32 };
}
/* 筆算の正しい途中の行（かけ算の答え・ひき算(おろした後)の答え） */
function divExpected(D, v) {
  const st = divSteps(D, v), r = D % v, idx = st.map((x, i) => i).filter(i => i === 0 || st[i].q > 0);
  return idx.map((i, m) => ({ q: st[i].q, prod: st[i].q * v, diff: st[i].cur - st[i].q * v, after: m + 1 < idx.length ? st[idx[m + 1]].cur : r }));
}
/* 子どもが書いた筆算から、どこでまちがえたかを調べる */
function divProcDiag(D, v, proc) {
  if (!proc) return null;
  const seq = proc.rows.map((t, i) => ({ t: t.replace(/\s/g, ''), i })).filter(x => x.t !== '');
  if (!seq.length) return null;
  const ex = divExpected(D, v);
  for (let m = 0; m < ex.length; m++) {
    const P = seq[2 * m], A = seq[2 * m + 1];
    if (!P) return { tag: null, row: null, msg: '筆算がとちゅうまでしか書かれていません。最後まで書いてみよう。' };
    const pv = Number(P.t);
    if (pv !== ex[m].prod) {
      if (pv % v === 0 && pv / v <= 9) return { tag: 'divEst', row: P.i, msg: `${m + 1}回目にたてた商がちがいます（${v}×${pv / v}＝${pv}）。` };
      return { tag: 'divMul', row: P.i, msg: `${m + 1}回目のかけ算 ${v}×${ex[m].q} がちがいます（正しくは ${ex[m].prod}）。` };
    }
    if (!A) return { tag: null, row: null, msg: '筆算がとちゅうまでしか書かれていません。' };
    const av = Number(A.t);
    if (av !== ex[m].after) {
      if (av === ex[m].diff && ex[m].after !== ex[m].diff) return { tag: 'divDown', row: A.i, msg: `${m + 1}回目のひき算のあと、つぎの数字をおろしていません。` };
      return { tag: 'divSub', row: A.i, msg: `${m + 1}回目のひき算がちがいます（正しくは ${ex[m].diff}${ex[m].after !== ex[m].diff ? `、おろして ${ex[m].after}` : ''}）。` };
    }
  }
  return null;
}
function divProblem(D, v) {
  const q = Math.floor(D / v), r = D % v;
  return {
    q: `<span class="num-font" style="font-size:1.4em">${D} ÷ ${v}</span> を筆算で計算しましょう。`,
    input: 'div', scratch: { D, v }, ans: { q, r }, ansText: `${q}${r ? ` あまり ${r}` : ''}`, wide: true,
    sol: `${divExpected(D, v).map((s, i) => `${i + 1}回目：商 ${s.q} → ${v}×${s.q}＝${s.prod} → ひいて ${s.diff}${s.after !== s.diff ? ` → おろして ${s.after}` : ''}`).join('<br>')}<br>たしかめ：${v} × ${q} ＋ ${r} ＝ ${D}`,
    diag: (u, proc) => {
      if (u.q === q && u.r !== r && u.r >= v) return 'divRem';
      const pd = divProcDiag(D, v, proc); if (pd && pd.tag) return pd.tag;
      if (u.q === q && u.r !== r) return u.r >= v ? 'divRem' : 'divSub';
      if (u.r >= v) return 'divRem';
      const sq = String(q);
      if (sq.includes('0') && String(u.q) === sq.replace(/0/g, '')) return 'divPlace';
      if (u.q * 10 === q || q * 10 === u.q) return 'divPlace';
      if (Math.abs(u.q - q) === 1 || Math.abs(Math.floor(u.q / 10) - Math.floor(q / 10)) === 1) return 'divEst';
      return 'calc';
    },
  };
}

const UNITS = [];

/* ===== 大きな数 ===== */
UNITS.push({
  id: 'big', area: 'num', title: '大きな数（億・兆）', short: '一億・一兆の単位、4けたごとの区切り、10倍・1/10',
  explain: `<div class="ex">
<h3>1. 4けたごとに新しい単位</h3>
<p>一、十、百、千 の4つがひとまとまり。千の10倍で <b>万</b>、千万の10倍で <b>億</b>、千億の10倍で <b>兆</b> になります。</p>
<table><tr><th colspan="4">兆</th><th colspan="4">億</th><th colspan="4">万</th><th colspan="4">一</th></tr>
<tr>${'千百十一'.repeat(4).split('').map(c => `<td>${c}</td>`).join('')}</tr></table>
<p>1万の1万倍が1億、1億の1万倍が1兆です（<b>万進法</b>）。</p>
<h3>2. 読み方・書き方</h3>
<ul><li>読むとき：右から4けたずつ区切り、左から「○兆 ○億 ○万 ○」と読みます。</li>
<li>書くとき：位取り表にあてはめ、<b>数字のない位には 0</b> を書きます。</li></ul>
<div class="box">例：「三兆五百二十億」→ 3｜0520｜0000｜0000 → <span class="num-font">3052000000000</span></div>
<h3>3. 10倍・100倍・1/10</h3>
<p>どの位の数字も、10倍すると<b>位が1つ上がり</b>、1/10にすると<b>位が1つ下がり</b>ます（<b>十進位取り記数法</b>）。</p>
<div class="box">350億 ×10 = 3500億　／　350億 ×100 = 3兆5000億　／　350億 ÷10 = 35億</div>
<div class="warn"><b>つまずきやすいところ</b><br>・何もない位の 0 を書き落とす → 4けたごとに「｜」で区切ってから書く。<br>・「1兆は1億の何倍？」で 1000倍 と答える → 万・億・兆は「1万倍」ずつ。</div>
</div>`,
  exp(root) {
    let n = 320500000000;
    const draw = () => {
      const s = String(n).padStart(16, '0'); const first = s.search(/[1-9]/);
      const G = ['兆', '億', '万', '一'], S = ['千', '百', '十', '一'];
      root.innerHTML = `<div class="stage"><table class="pv" aria-label="位取り表"><tr>${G.map((g, i) => `<th colspan="4" class="g${i ? ' gs' : ''}">${g}</th>`).join('')}</tr>
<tr>${s.split('').map((c, i) => `<th class="${i % 4 === 0 && i ? 'gs' : ''}">${S[i % 4]}</th>`).join('')}</tr>
<tr>${s.split('').map((c, i) => `<td class="${i < first ? 'z' : ''}${i % 4 === 0 && i ? ' gs' : ''}">${c}</td>`).join('')}</tr></table></div>
<div class="say">数字：<span class="big">${n.toLocaleString('ja-JP')}</span><br>読み方：${toKanji(n)}<br>単位で：${toMix(n)}</div>
<div class="btns"><button class="btn main" data-o="x10" ${n * 10 >= 1e15 ? 'disabled' : ''}>10倍</button><button class="btn main" data-o="x100" ${n * 100 >= 1e15 ? 'disabled' : ''}>100倍</button><button class="btn main" data-o="d10" ${n % 10 ? 'disabled' : ''}>1/10</button><button class="btn" data-o="rnd">べつの数</button></div>
<p class="note">10倍すると数字がそのまま1つ左の位へ、1/10 にすると1つ右の位へうつります。どの位も「となりの位の10倍」になっているからです。</p>`;
    };
    root.addEventListener('click', e => { const o = e.target.closest('[data-o]')?.dataset.o; if (!o) return; if (o === 'x10') n *= 10; else if (o === 'x100') n *= 100; else if (o === 'd10') n /= 10; else n = R(1, 999) * 10 ** R(6, 11) + pick([0, R(1, 99) * 1e4]); draw(); });
    draw();
  },
  kinds: [
    { id: 'write', name: '漢数字を数字で書く', gen() {
      let cho = R(1, 99), oku = pick([R(1, 9) * 1000, R(1, 9) * 1000 + R(1, 9) * 100, R(1, 99) * 10, R(1, 9) * 100 + R(1, 9), 0]), man = pick([0, 0, R(1, 9) * 1000, R(1, 999)]);
      let n = cho * 1e12 + oku * 1e8 + man * 1e4;
      if (Math.random() < .4) { n = oku * 1e8 + man * 1e4; if (n < 1e8) n = R(2, 9) * 1e8 + R(1, 9) * 1e5; }
      return { q: `「<b>${toKanji(n)}</b>」を数字で書きましょう。`, input: 'num', ans: n, ansText: String(n), sol: `4けたずつ区切ると ${groupStr(n)}。何もない位には 0 を書きます。`, diag: u => String(Math.round(u)).length !== String(n).length ? 'bigZero' : 'calc' };
    } },
    { id: 'times', name: '10倍・100倍・1/10', gen() {
      const unit = pick(['万', '億']), op = pick(['x10', 'x100', 'd10']);
      const b = op === 'x10' ? R(2, 999) : op === 'x100' ? R(2, 99) : R(2, 999) * 10;
      const ans = op === 'x10' ? b * 10 : op === 'x100' ? b * 100 : b / 10;
      const wr = op === 'x10' ? [b * 100, b / 10] : op === 'x100' ? [b * 10, b * 1000] : [b * 10, b / 100];
      const ot = { x10: '10倍した', x100: '100倍した', d10: '1/10にした' }[op];
      return { q: `${b}${unit} を${ot}数は、何${unit}ですか。`, input: 'num', label: unit, ans, ansText: ans + unit, wrongs: wr.map(v => ({ v, tag: 'bigShift' })), sol: `${op === 'd10' ? '1/10 にすると位が1つ下がります' : op === 'x10' ? '10倍すると位が1つ上がります' : '100倍すると位が2つ上がります'}。${b}${unit} → ${ans}${unit}` };
    } },
    { id: 'compose', name: '1億・1兆が何こ', gen() {
      if (Math.random() < .5) { const a = R(1, 9), b = R(1, 99) * 100, ans = a * 10000 + b; return { q: `${a}兆${b}億 は、1億を何こ集めた数ですか。`, input: 'num', label: 'こ', ans, ansText: ans + 'こ', wrongs: [{ v: a * 1000 + b, tag: 'manshin' }, { v: a * 100000 + b, tag: 'manshin' }, { v: a + b, tag: 'manshin' }], sol: `1兆は1億が10000こ。${a}兆は1億が${a * 10000}こ、${b}億とあわせて${ans}こ。` }; }
      const a = R(1, 9), b = R(1, 99) * 100, ans = a * 10000 + b; return { q: `${a}億${b}万 は、1万を何こ集めた数ですか。`, input: 'num', label: 'こ', ans, ansText: ans + 'こ', wrongs: [{ v: a * 1000 + b, tag: 'manshin' }, { v: a * 100000 + b, tag: 'manshin' }, { v: a + b, tag: 'manshin' }], sol: `1億は1万が10000こ。${a}億は1万が${a * 10000}こ、${b}万とあわせて${ans}こ。` };
    } },
    { id: 'unit', name: '万・億・兆のしくみ', gen() {
      const P4 = ['10倍', '100倍', '1000倍', '10000倍'];
      const pool = [['1兆は、1億の何倍ですか。', '10000倍', P4], ['1億は、1万の何倍ですか。', '10000倍', P4], ['1億は、1000万の何倍ですか。', '10倍', P4], ['1000万を10倍した数は？', '1億', ['1億', '1000億', '10億', '100万']], ['1兆を10でわった数は？', '1000億', ['1000億', '100億', '1億', '1000万']], ['10億を100倍した数は？', '1000億', ['1000億', '100億', '1兆', '10兆']]];
      const [q, a, c] = pick(pool); return ch(q, a, c, 'manshin', '一・十・百・千のくり返しで、4けたごとに万・億・兆と単位が変わります。1万の1万倍が1億、1億の1万倍が1兆です。');
    } },
  ],
});

/* ===== がい数 ===== */
UNITS.push({
  id: 'round', area: 'num', title: 'およその数（がい数）', short: '四捨五入、上から○けた、見積もり、以上・以下・未満',
  explain: `<div class="ex">
<h3>1. がい数と四捨五入</h3>
<p>「約3000人」のように、だいたいの数を <b>がい数</b> といいます。がい数にする位の <b>1つ下の位</b> を見て、0〜4 なら切り捨て、5〜9 なら切り上げます（<b>四捨五入</b>）。</p>
<div class="box">43<u>6</u>7 を百の位までのがい数に → 十の位の「6」を見る → 5以上なので切り上げ → <span class="num-font">4400</span></div>
<h3>2. 「上から○けた」のがい数</h3>
<p>上から2けたのがい数にするときは、上から <b>3けため</b> を四捨五入します。</p>
<div class="box">57<u>4</u>21 → 上から3けための「4」は切り捨て → <span class="num-font">57000</span></div>
<h3>3. 範囲（以上・以下・未満）</h3>
<ul><li><b>以上</b>・<b>以下</b>：その数をふくむ。　<b>未満</b>：その数をふくまない。</li>
<li>十の位までのがい数にして 80 になるのは、<b>75以上 85未満</b> の数です。</li></ul>
<h3>4. 目的に合わせた見積もり</h3>
<ul><li>お金が<b>足りなくならないように</b>する → 多めに見積もる → <b>切り上げ</b></li>
<li>「少なくとも」いくらあるか → 少なめに見積もる → <b>切り捨て</b></li>
<li>和・差はがい数にしてから計算、積・商は上から1けたのがい数にして見積もります。</li></ul>
<div class="warn"><b>つまずきやすいところ</b><br>・がい数にする位そのものの数字を見てしまう → 「1つ下の位」に印をつける。<br>・85 も 80 になると考える → 85 は 90 になる。「未満」はふくまない。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="stage" id="rl"></div><div class="ctrl"><label>数 <input type="range" min="0" max="999" value="463" id="rv"><output id="ro"></output></label></div><div class="say" id="rs"></div>`;
    const draw = () => {
      const n = +$('#rv', root).value, r = Math.round(n / 100) * 100, X = v => fx(20 + v * 0.56);
      $('#ro', root).textContent = n;
      let s = `<svg viewBox="0 0 600 120" width="600" role="img" aria-label="数直線"><rect x="${X(Math.max(0, r - 50))}" y="30" width="${fx((Math.min(1000, r + 50) - Math.max(0, r - 50)) * 0.56)}" height="40" fill="color-mix(in srgb,var(--ac) 22%,transparent)"/><line x1="${X(0)}" y1="50" x2="${X(1000)}" y2="50" class="ln"/>`;
      for (let v = 0; v <= 1000; v += 50) s += `<line x1="${X(v)}" y1="${v % 100 ? 42 : 34}" x2="${X(v)}" y2="${v % 100 ? 58 : 66}" class="ln"/>${v % 100 ? '' : `<text x="${X(v)}" y="84" class="lbl s">${v}</text>`}`;
      s += `<circle cx="${X(n)}" cy="50" r="8" class="pt"/><text x="${X(n)}" y="18" class="lbl ac">${n}</text></svg>`;
      $('#rl', root).innerHTML = s;
      const d = Math.floor(n / 10) % 10;
      $('#rs', root).innerHTML = `百の位までのがい数：十の位は「${d}」→ ${d >= 5 ? '切り上げ' : '切り捨て'} → <span class="big">${r}</span><br>色の部分（${Math.max(0, r - 50)}以上 ${r + 50}未満）の数は、みんな ${r} になります。<br><span class="note">切り捨てなら ${Math.floor(n / 100) * 100}、切り上げなら ${Math.ceil(n / 100) * 100}</span>`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'round', name: '四捨五入', gen() {
      const [p, nm, low] = pick([[100, '百', '十'], [1000, '千', '百'], [10000, '一万', '千']]);
      const n = R(p + 1, p * 99); const ans = Math.round(n / p) * p, d = Math.floor(n / (p / 10)) % 10;
      return { q: `${n} を四捨五入して、${nm}の位までのがい数にしましょう。`, input: 'num', ans, ansText: String(ans), sol: `${nm}の位までにするので、1つ下の${low}の位の「${d}」を見ます。${d >= 5 ? '5以上なので切り上げ' : '4以下なので切り捨て'} → ${ans}`,
        wrongs: [{ v: Math.floor(n / p) * p, tag: 'roundRule' }, { v: Math.ceil(n / p) * p, tag: 'roundRule' }, { v: Math.round(n / (p * 10)) * p * 10, tag: 'roundPlace' }, { v: Math.round(n / (p / 10)) * (p / 10), tag: 'roundPlace' }].filter(w => w.v !== ans) };
    } },
    { id: 'top', name: '上から○けたのがい数', gen() {
      const n = R(1000, 99999), k = pick([1, 2]), p = 10 ** (String(n).length - k), ans = Math.round(n / p) * p, d = Math.floor(n / (p / 10)) % 10;
      return { q: `${n} を四捨五入して、上から${k}けたのがい数にしましょう。`, input: 'num', ans, ansText: String(ans), sol: `上から${k + 1}けための「${d}」を四捨五入します → ${ans}`,
        wrongs: [{ v: Math.floor(n / p) * p, tag: 'roundRule' }, { v: Math.ceil(n / p) * p, tag: 'roundRule' }, { v: Math.round(n / (p * 10)) * p * 10, tag: 'roundPlace' }, { v: Math.round(n / (p / 10)) * (p / 10), tag: 'roundPlace' }].filter(w => w.v !== ans) };
    } },
    { id: 'range', name: '以上・以下・未満', gen() {
      const big = Math.random() < .4, u = big ? 100 : 10, t = R(2, 9) * u, mn = Math.random() < .5, h = u / 2;
      const ans = mn ? t - h : t + h - 1;
      return { q: `四捨五入して${big ? '百' : '十'}の位までのがい数にすると ${t} になる整数のうち、いちばん${mn ? '小さい' : '大きい'}数はいくつですか。`, input: 'num', ans, ansText: String(ans), defTag: 'range',
        sol: `${t} になるのは ${t - h}以上 ${t + h}未満 の整数です。${t + h} は「未満」なのでふくみません。`, wrongs: (mn ? [t - h + 1, t - u, t] : [t + h, t + u - 1, t + u]).map(v => ({ v, tag: 'range' })) };
    } },
    { id: 'buy', name: '目的に合わせた見積もり', gen() {
      if (Math.random() < .5) {
        const items = shuffle(['にんじん', 'たまねぎ', 'じゃがいも', 'カレールウ', 'ぶた肉', 'りんご']).slice(0, 3), pr = items.map(() => R(11, 49) * 10 + R(1, 9));
        const sum = f => pr.reduce((a, x) => a + f(x / 100) * 100, 0), ans = sum(Math.ceil);
        return { q: `カレーの材料を買います。${items.map((it, i) => `${it} ${pr[i]}円`).join('、')}。お金が足りなくならないように、それぞれの代金を<b>百の位までのがい数</b>にして見積もります。何円もっていけば安心ですか。`, input: 'num', label: '円', ans, ansText: ans + '円',
          sol: `足りなくならないように、多めに見積もる「切り上げ」を使います。${pr.map(x => Math.ceil(x / 100) * 100).join('＋')}＝${ans}円`, wrongs: [sum(Math.round), sum(Math.floor), pr.reduce((a, b) => a + b, 0)].filter(v => v !== ans).map(v => ({ v, tag: 'purpose' })) };
      }
      const [q, a] = pick([['お金が足りなくならないように、買う物の代金を見積もるときに使う方法は？', '切り上げ'], ['ちょ金が「少なくとも」何円あるかを見積もるときに使う方法は？', '切り捨て'], ['3つの町の人口のおよその合計を知りたいときに、よく使う方法は？', '四捨五入']]);
      return ch(q, a, ['切り上げ', '切り捨て', '四捨五入'], 'purpose', '多めに見積もりたいときは切り上げ、少なめに見積もりたいときは切り捨て、およその数を知りたいときは四捨五入を使います。');
    } },
  ],
});

/* ===== わり算の筆算 ===== */
UNITS.push({
  id: 'div', area: 'num', title: 'わり算の筆算（2けたでわる）', short: 'たてる→かける→ひく→おろす、商の見当と修正',
  explain: `<div class="ex">
<h3>1. 商がどの位からたつか</h3>
<p>わられる数の下の位を<b>指でかくし</b>、上から2けたとわる数をくらべます。</p>
<div class="box">221 ÷ 32 → 下の「1」をかくすと「22」。22 に 32 は入らない → 3けた「221」で考える → 商は <b>一の位</b> からたつ。</div>
<h3>2. 商の見当をつける</h3>
<p>わる数を <b>何十</b> とみて、九九で見当をつけます。</p>
<div class="box">221 ÷ 32 → 32 を 30 とみる → 22 ÷ 3 で、およそ 7（これを <b>仮の商</b> といいます）</div>
<h3>3. たてる → かける → ひく → おろす</h3>
<ol><li><b>たてる</b>：仮の商をたてる　<li><b>かける</b>：わる数 × 商（くり上がりはメモ）<li><b>ひく</b>：わられる数からひく<li><b>おろす</b>：次の位の数字をおろして、また「たてる」へ</ol>
<h3>4. 仮の商のなおし方</h3>
<div class="box">32 × 7 ＝ 224 → 221 からひけない → 商を1小さくして 6<br>32 × 6 ＝ 192 → 221 − 192 ＝ 29 → 29 は 32 より小さいのでOK<br>答え：<b>6 あまり 29</b>　たしかめ：32 × 6 ＋ 29 ＝ 221</div>
<ul><li>ひけない → 商を <b>1小さく</b>（ひけるまでくり返す）</li><li>あまりがわる数以上 → 商を <b>1大きく</b></li></ul>
<h3>5. 商に 0 がたつとき</h3>
<div class="box">642 ÷ 32 → 64 ÷ 32 ＝ 2、ひいて 0、2 をおろす → 2 ÷ 32 は 0 → 一の位に <b>0</b> をたてる → 20 あまり 2</div>
<div class="warn"><b>つまずきやすいところ</b><br>・見当の商をそのまま答えにする → かけてひいて、必ず確かめる。<br>・あまりがわる数より大きいまま → 最後に「あまり ＜ わる数」をチェック。<br>・商の 0 を書き忘れる（20 を 2 と書く）。</div>
</div>`,
  exp(root) { divTool(root); },
  kinds: [
    { id: 'calc3', name: '3けた÷2けた', gen() { const { D, v } = genDiv(pick([2, 3, 3, 4, 5])); return divProblem(D, v); } },
    { id: 'calc2', name: '2けた÷2けた', gen() { const { D, v } = genDiv(1); return divProblem(D, v); } },
    { id: 'place', name: '商のたつ位', gen() {
      const { D, v } = genDiv(pick([2, 3])), top = Number(String(D).slice(0, 2)), a = top >= v ? '十の位' : '一の位';
      return ch(`${D} ÷ ${v} の商は、何の位からたちますか。`, a, ['百の位', '十の位', '一の位'], 'divPlace', `下の位をかくして上から2けた「${top}」と ${v} をくらべます。${top >= v ? `${top} に ${v} は入るので十の位から` : `${top} に ${v} は入らないので一の位から`}たちます。`);
    } },
    { id: 'fix', name: '仮の商のなおし方', gen() {
      for (let t = 0; t < 500; t++) {
        const { D, v } = genDiv(pick([2, 4])), st = divSteps(D, v)[0], tens = Math.floor(v / 10);
        if (Math.random() < .5) { const e = estQ(st.cur, v); if (e > st.q) return ch(`${D} ÷ ${v} で、${v} を ${tens}0 とみて仮の商 ${e} をたてました。${v} × ${e} ＝ ${v * e} で、${st.cur} からひけません。どうしますか。`, '商を1小さくする', ['商を1小さくする', '商を1大きくする', 'そのまま答えにする'], 'divEst', `ひけないのは商が大きすぎるからです。${e - 1} にしてもう一度かけてみます。`); }
        else { const e = Math.min(9, Math.floor(st.cur / ((tens + 1) * 10))); if (e < st.q) return ch(`${D} ÷ ${v} で、仮の商 ${e} をたてると、あまりが ${st.cur - v * e} になりました。どうしますか。`, '商を1大きくする', ['商を1小さくする', '商を1大きくする', 'そのまま答えにする'], 'divEst', `あまり ${st.cur - v * e} がわる数 ${v} 以上なので、商が小さすぎます。商を1大きくします。`); }
      }
      return ch('221 ÷ 32 で仮の商 7 をたてると、32 × 7 ＝ 224 で 221 からひけません。どうしますか。', '商を1小さくする', ['商を1小さくする', '商を1大きくする', 'そのまま答えにする'], 'divEst', 'ひけないのは商が大きすぎるからです。');
    } },
  ],
});

/* ===== 小数 ===== */
UNITS.push({
  id: 'dec', area: 'num', title: '小数のしくみと計算', short: '1/100の位、たし算・ひき算、小数×整数・小数÷整数',
  explain: `<div class="ex">
<h3>1. 小数のしくみ</h3>
<p>1 を10等分した1つ分が <b>0.1</b>、0.1 を10等分した1つ分が <b>0.01</b>、0.01 を10等分した1つ分が <b>0.001</b> です。</p>
<table><tr><th>一の位</th><th>.</th><th>1/10の位</th><th>1/100の位</th><th>1/1000の位</th></tr><tr><td>2</td><td>.</td><td>3</td><td>5</td><td></td></tr></table>
<p>2.35 は「1 が2こ、0.1 が3こ、0.01 が5こ」。また「0.01 が235こ」とも見られます。小数も整数と同じように、10倍で位が1つ上がり、1/10 で位が1つ下がります。</p>
<h3>2. たし算・ひき算</h3>
<p><b>小数点をそろえて</b>書き、整数と同じように計算して、上の小数点にそろえて答えの小数点をうちます。</p>
<div class="box">3.45 ＋ 1.2 → 1.2 を 1.20 と考える → 4.65（3.57 にしない）</div>
<h3>3. 小数×整数・小数÷整数</h3>
<ul><li>×整数：小数点がないものとして計算し、かけられる数と同じ位置に小数点をうつ。<br>2.3 × 4 → 23 × 4 ＝ 92 → <b>9.2</b>（0.1 が 23×4＝92 こ）</li>
<li>÷整数：わられる数の小数点にそろえて、商の小数点をうつ。<br>7.2 ÷ 3 → 72 ÷ 3 ＝ 24 → <b>2.4</b></li>
<li>答えの終わりの 0 は消します（3.40 → 3.4）。</li></ul>
<div class="warn"><b>つまずきやすいところ</b><br>・位をそろえずに右はしをそろえてしまう。<br>・答えに小数点をうち忘れる → 「0.1 が何こ」で考えると大きさが確かめられる。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="stage" id="dg"></div><div class="ctrl"><label>0.01 の数 <input type="range" min="0" max="300" value="135" id="dk"><output id="do"></output></label></div><div class="say" id="ds"></div>`;
    const draw = () => {
      const k = +$('#dk', root).value; $('#do', root).textContent = k;
      let s = `<svg viewBox="0 0 640 220" width="640" role="img" aria-label="1を100に分けた図">`;
      for (let b = 0; b < 3; b++) { for (let i = 0; i < 100; i++) { const on = b * 100 + i < k, x = 10 + b * 210 + (i % 10) * 19, y = 10 + Math.floor(i / 10) * 19; s += `<rect x="${x}" y="${y}" width="18" height="18" fill="${on ? 'var(--ac)' : 'var(--paper)'}" stroke="var(--line)"/>`; } s += `<text x="${10 + b * 210 + 95}" y="210" class="lbl s">1</text>`; }
      $('#dg', root).innerHTML = s + '</svg>';
      const v = fx(k / 100), str = v.toFixed(2), [a, bb] = str.split('.');
      $('#ds', root).innerHTML = `0.01 が ${k} こ → <span class="big">${String(v)}</span><br>1 が ${a} こ、0.1 が ${bb[0]} こ、0.01 が ${bb[1]} こ。<br><span class="note">小さな正方形1つが 0.01、たて1列（10こ）が 0.1、大きな正方形1つが 1 です。</span>`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'addsub', name: '小数のたし算・ひき算', gen() {
      let a, b; do { a = R(101, 999); } while (a % 10 === 0); a /= 100; do { b = R(11, 99); } while (b % 10 === 0); b /= 10;
      const plus = Math.random() < .5 || b >= a;
      const ans = fx(plus ? a + b : a - b), wa = fx(plus ? a + b / 10 : a - b / 10);
      return { q: `${a.toFixed(2)} ${plus ? '＋' : '−'} ${b.toFixed(1)} ＝ ？`, input: 'num', ans, ansText: String(ans), wrongs: [{ v: wa, tag: 'decAlign' }], diag: u => isPow10(u, ans) ? 'decPoint' : null, sol: `小数点をそろえて、${b.toFixed(1)} を ${b.toFixed(2)} と考えます。${a.toFixed(2)} ${plus ? '＋' : '−'} ${b.toFixed(2)} ＝ ${ans}` };
    } },
    { id: 'mul', name: '小数×整数', gen() {
      let a = Math.random() < .6 ? R(11, 99) / 10 : R(101, 999) / 100; if (fx(a * 10) % 10 === 0) a = fx(a + 0.1);
      const n = R(2, 9), ans = fx(a * n), k = String(a).split('.')[1]?.length || 0;
      return { q: `${a} × ${n} ＝ ？`, input: 'num', ans, ansText: String(ans), diag: u => isPow10(u, ans) ? 'decPoint' : null, sol: `小数点がないものとして ${Math.round(a * 10 ** k)} × ${n} ＝ ${Math.round(a * 10 ** k) * n}。かけられる数と同じく小数点以下${k}けたにして ${ans}。` };
    } },
    { id: 'divi', name: '小数÷整数', gen() {
      const x = R(11, 99) / 10, n = R(2, 9), a = fx(x * n);
      return { q: `${a} ÷ ${n} ＝ ？`, input: 'num', ans: x, ansText: String(x), diag: u => isPow10(u, x) ? 'decPoint' : null, sol: `${Math.round(a * 10)} ÷ ${n} ＝ ${Math.round(x * 10)}（0.1 が ${Math.round(x * 10)} こ）。わられる数の小数点にそろえて ${x}。` };
    } },
    { id: 'struct', name: '小数のしくみ', gen() {
      if (Math.random() < .5) { const k = R(101, 999), ans = fx(k / 100); return { q: `0.01 を ${k} こ集めた数はいくつですか。`, input: 'num', ans, ansText: String(ans), defTag: 'decPlace', diag: u => isPow10(u, ans) ? 'decPlace' : null, sol: `0.01 が100こで1。${k} こは 1 が ${Math.floor(k / 100)} こ、0.01 が ${k % 100} こで ${ans}。` }; }
      const x = R(11, 99) / 10, ans = Math.round(x * 10);
      return { q: `${x} は 0.1 を何こ集めた数ですか。`, input: 'num', label: 'こ', ans, ansText: ans + 'こ', defTag: 'decPlace', diag: u => isPow10(u, ans) ? 'decPlace' : null, sol: `1 は 0.1 が10こ。${x} は 0.1 が ${ans} こ。` };
    } },
  ],
});

/* ===== 分数 ===== */
UNITS.push({
  id: 'frac', area: 'num', title: '分数（仮分数・帯分数）', short: '真分数・仮分数・帯分数、同じ分母のたし算・ひき算',
  explain: `<div class="ex">
<h3>1. 分数のなかま</h3>
<ul><li><b>真分数</b>：分子が分母より小さい（${fr(2, 5)}）…1より小さい</li>
<li><b>仮分数</b>：分子が分母と同じか大きい（${fr(7, 5)}、${fr(5, 5)}）…1と同じか大きい</li>
<li><b>帯分数</b>：整数と真分数を合わせた形（${fr(2, 5, 1)}）</li></ul>
<h3>2. なおし方</h3>
<div class="box">仮分数 → 帯分数：${fr(13, 4)} は 13 ÷ 4 ＝ 3 あまり 1 → ${fr(1, 4, 3)}<br>帯分数 → 仮分数：${fr(3, 5, 2)} は 2 × 5 ＋ 3 ＝ 13 → ${fr(13, 5)}</div>
<h3>3. 分母が同じ分数のたし算・ひき算</h3>
<p>${fr(1, 7)} がいくつ分かで考えます。<b>分母はそのまま、分子だけ</b>計算します。</p>
<div class="box">${fr(2, 7)} ＋ ${fr(3, 7)} ＝ ${fr(5, 7)}（${fr(1, 7)} が 2＋3＝5 こ）。${fr(5, 14)} にはなりません。</div>
<p>帯分数のひき算で分子がひけないときは、整数から1くり下げます。</p>
<div class="box">${fr(1, 5, 3)} − ${fr(3, 5, 1)} → ${fr(6, 5, 2)} − ${fr(3, 5, 1)} ＝ ${fr(3, 5, 1)}</div>
<div class="warn"><b>つまずきやすいところ</b><br>・分母どうしもたしてしまう。<br>・帯分数 → 仮分数で「整数＋分子」としてしまう（${fr(3, 5, 2)} → ${fr(5, 5)} はまちがい）。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="stage" id="fg"></div><div class="ctrl"><label>分母 <input type="range" min="2" max="8" value="4" id="fd"><output id="fdo"></output></label><label>分子 <input type="range" min="1" max="24" value="7" id="fn"><output id="fno"></output></label></div><div class="say" id="fs"></div>`;
    const draw = () => {
      const d = +$('#fd', root).value, nIn = $('#fn', root); nIn.max = d * 3; const n = Math.min(+nIn.value, d * 3); $('#fdo', root).textContent = d; $('#fno', root).textContent = n;
      const bars = Math.max(1, Math.ceil(n / d)); let s = `<svg viewBox="0 0 520 ${bars * 52 + 10}" width="520" role="img" aria-label="分数のテープ図">`;
      for (let b = 0; b < bars; b++) for (let i = 0; i < d; i++) { const k = b * d + i; s += `<rect x="${10 + i * 480 / d}" y="${10 + b * 52}" width="${480 / d}" height="40" fill="${k < n ? 'var(--ac)' : 'var(--paper)'}" stroke="var(--ink)" stroke-width="2"/>`; }
      $('#fg', root).innerHTML = s + '</svg>';
      const kind = n < d ? '真分数' : '仮分数';
      $('#fs', root).innerHTML = `${fr(n, d)} は <b>${kind}</b>。${fr(1, d)} が ${n} こ分。${n >= d ? (n % d ? `<br>帯分数で表すと ${fr(n % d, d, Math.floor(n / d))}（${n} ÷ ${d} ＝ ${Math.floor(n / d)} あまり ${n % d}）` : `<br>${fr(n, d)} ＝ <b>${n / d}</b>（整数と同じ大きさ）`) : '<br>1 より小さい分数です。'}`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'tomix', name: '仮分数→帯分数', gen() { const d = R(2, 9), w = R(1, 4), n = R(1, d - 1), N = w * d + n; return { q: `${fr(N, d)} を帯分数で表しましょう。`, input: 'frac', form: 'mixed', ans: { w, n, d }, ansText: fr(n, d, w), defTag: 'fracConv', sol: `${N} ÷ ${d} ＝ ${w} あまり ${n} → 整数が ${w}、分子が ${n}。` }; } },
    { id: 'toimp', name: '帯分数→仮分数', gen() { const d = R(2, 9), w = R(1, 4), n = R(1, d - 1), N = w * d + n; return { q: `${fr(n, d, w)} を仮分数で表しましょう。`, input: 'frac', form: 'improper', ans: { w: 0, n: N, d }, ansText: fr(N, d), defTag: 'fracConv', sol: `${w} は ${fr(w * d, d)}。${w} × ${d} ＋ ${n} ＝ ${N} → ${fr(N, d)}` }; } },
    { id: 'add', name: '分数のたし算', gen() {
      const d = R(3, 9); let n1, n2, w1, w2, T; do { n1 = R(1, d - 1); n2 = R(1, d - 1); w1 = pick([0, 0, R(1, 2)]); w2 = pick([0, R(1, 2)]); T = (w1 + w2) * d + n1 + n2; } while (T % d === 0);
      const A = { w: Math.floor(T / d), n: T % d, d };
      return { q: `${w1 ? fr(n1, d, w1) : fr(n1, d)} ＋ ${w2 ? fr(n2, d, w2) : fr(n2, d)} ＝ ？`, input: 'frac', form: 'any', ans: A, ansText: `${frMix(T, d)}${A.w ? `（${fr(T, d)}）` : ''}`, diag: u => u.d === 2 * d ? 'fracDen' : null, sol: `分母 ${d} はそのまま。${fr(1, d)} が ${T} こ分で ${fr(T, d)}${A.w ? ` ＝ ${frMix(T, d)}` : ''}。帯分数でも仮分数でも正かいです。` };
    } },
    { id: 'sub', name: '分数のひき算', gen() {
      const d = R(4, 9);
      if (Math.random() < .35) { const n1 = R(2, d - 1), n2 = R(1, n1 - 1); return { q: `${fr(n1, d)} − ${fr(n2, d)} ＝ ？`, input: 'frac', form: 'any', ans: { w: 0, n: n1 - n2, d }, ansText: fr(n1 - n2, d), diag: u => u.d === 0 || (u.n === n1 - n2 && u.d !== d) ? 'fracDen' : null, sol: `分母はそのまま、分子だけひきます。${n1} − ${n2} ＝ ${n1 - n2}` }; }
      const w1 = R(2, 5), n1 = R(1, d - 2), n2 = R(n1 + 1, d - 1), w2 = R(1, w1 - 1), T = (w1 * d + n1) - (w2 * d + n2);
      return { q: `${fr(n1, d, w1)} − ${fr(n2, d, w2)} ＝ ？`, input: 'frac', form: 'any', ans: { w: Math.floor(T / d), n: T % d, d }, ansText: frMix(T, d), diag: u => (u.w === w1 - w2 && u.n === n2 - n1) ? 'fracBorrow' : (u.d !== d ? 'fracDen' : null), defTag: 'fracBorrow', sol: `${n1} から ${n2} はひけないので、${w1} から1くり下げて ${fr(n1 + d, d, w1 - 1)} にします。${fr(n1 + d, d, w1 - 1)} − ${fr(n2, d, w2)} ＝ ${frMix(T, d)}` };
    } },
  ],
});

/* ===== 計算のきまり ===== */
UNITS.push({
  id: 'rules', area: 'num', title: '計算のきまりと式', short: '計算の順じょ、（ ）、交換・結合・分配のきまり、□を使った式',
  explain: `<div class="ex">
<h3>1. 計算の順じょ</h3>
<ol><li>（ ）の中を先に計算する</li><li>×、÷ を ＋、− より先に計算する</li><li>あとは左から順に計算する</li></ol>
<div class="box">8 ＋ 4 × 3 ＝ 8 ＋ 12 ＝ <b>20</b>（36 ではない）<br>30 − (8 ＋ 6) ＝ 30 − 14 ＝ <b>16</b></div>
<h3>2. 計算のきまり</h3>
<table><tr><th>きまり</th><th>式</th><th>使える計算</th></tr>
<tr><td>交換のきまり</td><td>■＋●＝●＋■、■×●＝●×■</td><td>たし算・かけ算</td></tr>
<tr><td>結合のきまり</td><td>(■＋●)＋▲＝■＋(●＋▲)<br>(■×●)×▲＝■×(●×▲)</td><td>たし算だけ・かけ算だけの式</td></tr>
<tr><td>分配のきまり</td><td>(■＋●)×▲＝■×▲＋●×▲<br>(■−●)×▲＝■×▲−●×▲</td><td>たし算・ひき算とかけ算</td></tr></table>
<p>ひき算・わり算では、交換のきまりは使えません（5−2 と 2−5 はちがう）。</p>
<h3>3. くふうして計算</h3>
<div class="box">25 × 7 × 4 ＝ 25 × 4 × 7 ＝ 100 × 7 ＝ 700<br>98 × 6 ＝ (100 − 2) × 6 ＝ 600 − 12 ＝ 588<br>102 × 25 ＝ (100 ＋ 2) × 25 ＝ 2500 ＋ 50 ＝ 2550</div>
<h3>4. □を使った式</h3>
<p>わからない数を □ にして式に表し、逆の計算で求めます。□ × 6 ＝ 54 → □ ＝ 54 ÷ 6 ＝ 9</p>
<div class="warn"><b>つまずきやすいところ</b><br>・左から順に計算してしまう。<br>・(100−2)×6 を 600−2 としてしまう → 2 にも 6 をかける。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="stage" id="rg"></div><div class="ctrl"><label>青の行 <input type="range" min="1" max="6" value="3" id="ra"><output></output></label><label>赤の行 <input type="range" min="1" max="6" value="2" id="rb"><output></output></label><label>列 <input type="range" min="1" max="9" value="4" id="rc"><output></output></label></div><div class="say" id="rsay"></div>`;
    const draw = () => {
      const a = +$('#ra', root).value, b = +$('#rb', root).value, c = +$('#rc', root).value;
      $$('.ctrl output', root).forEach((o, i) => o.textContent = [a, b, c][i]);
      let s = `<svg viewBox="0 0 ${c * 34 + 20} ${(a + b) * 34 + 30}" width="${c * 34 + 20}" role="img" aria-label="ドットの図">`;
      for (let r = 0; r < a + b; r++) for (let k = 0; k < c; k++) s += `<circle cx="${27 + k * 34}" cy="${27 + r * 34 + (r >= a ? 10 : 0)}" r="12" class="${r < a ? 'dot1' : 'dot2'}"/>`;
      $('#rg', root).innerHTML = s + '</svg>';
      $('#rsay', root).innerHTML = `全体を1つの長方形とみる：(${a} ＋ ${b}) × ${c} ＝ <span class="big">${(a + b) * c}</span><br>青と赤に分けてみる：${a} × ${c} ＋ ${b} × ${c} ＝ ${a * c} ＋ ${b * c} ＝ <span class="big">${(a + b) * c}</span><br><span class="note">どちらで数えても同じ。これが分配のきまりです。</span>`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'order', name: '計算の順じょ', gen() {
      const b = R(2, 9), c = R(2, 9), t = pick(['+x', '-x', '+/']);
      if (t === '+x') { const a = R(2, 30); return { q: `${a} ＋ ${b} × ${c} ＝ ？`, input: 'num', ans: a + b * c, ansText: String(a + b * c), wrongs: [{ v: (a + b) * c, tag: 'order' }], sol: `× を先に計算：${b}×${c}＝${b * c}、${a}＋${b * c}＝${a + b * c}` }; }
      if (t === '-x') { const a = R(b * c + 1, b * c + 40); return { q: `${a} − ${b} × ${c} ＝ ？`, input: 'num', ans: a - b * c, ansText: String(a - b * c), wrongs: [{ v: (a - b) * c, tag: 'order' }], sol: `× を先に計算：${b}×${c}＝${b * c}、${a}−${b * c}＝${a - b * c}` }; }
      const a = R(2, 30), B = b * c; return { q: `${a} ＋ ${B} ÷ ${c} ＝ ？`, input: 'num', ans: a + b, ansText: String(a + b), wrongs: [{ v: (a + B) / c, tag: 'order' }], sol: `÷ を先に計算：${B}÷${c}＝${b}、${a}＋${b}＝${a + b}` };
    } },
    { id: 'paren', name: '（ ）のある式', gen() {
      const t = pick(['a-(b+c)', '(a+b)xc', '(a-b)/c']);
      if (t === 'a-(b+c)') { const b = R(3, 20), c = R(3, 20), a = R(b + c + 1, b + c + 40); return { q: `${a} − (${b} ＋ ${c}) ＝ ？`, input: 'num', ans: a - b - c, ansText: String(a - b - c), wrongs: [{ v: a - b + c, tag: 'paren' }], sol: `（ ）の中を先に：${b}＋${c}＝${b + c}、${a}−${b + c}＝${a - b - c}` }; }
      if (t === '(a+b)xc') { const a = R(2, 15), b = R(2, 15), c = R(2, 9); return { q: `(${a} ＋ ${b}) × ${c} ＝ ？`, input: 'num', ans: (a + b) * c, ansText: String((a + b) * c), wrongs: [{ v: a + b * c, tag: 'paren' }], sol: `（ ）の中を先に：${a}＋${b}＝${a + b}、${a + b}×${c}＝${(a + b) * c}` }; }
      const c = R(2, 9), q = R(2, 9), b = R(1, 9) * c, a = b + q * c; return { q: `(${a} − ${b}) ÷ ${c} ＝ ？`, input: 'num', ans: q, ansText: String(q), wrongs: [{ v: a - b / c, tag: 'paren' }], sol: `（ ）の中を先に：${a}−${b}＝${a - b}、${a - b}÷${c}＝${q}` };
    } },
    { id: 'distrib', name: '分配のきまり', gen() {
      const k = R(1, 3), plus = Math.random() < .5, n = plus ? pick([25, R(3, 9)]) : R(3, 9), a = plus ? 100 + k : 100 - k, ans = a * n;
      return { q: `${a} × ${n} を、${a} ＝ 100 ${plus ? '＋' : '−'} ${k} と考えて、くふうして計算しましょう。`, input: 'num', ans, ansText: String(ans), wrongs: [{ v: plus ? 100 * n + k : 100 * n - k, tag: 'distrib' }], sol: `(100 ${plus ? '＋' : '−'} ${k}) × ${n} ＝ 100×${n} ${plus ? '＋' : '−'} ${k}×${n} ＝ ${100 * n} ${plus ? '＋' : '−'} ${k * n} ＝ ${ans}` };
    } },
    { id: 'swap', name: 'くふうして計算', gen() {
      const [a, b] = pick([[25, 4], [125, 8], [4, 25], [50, 2]]), n = R(3, 19), ans = a * b * n;
      return { q: `${a} × ${n} × ${b} を、くふうして計算しましょう。`, input: 'num', ans, ansText: String(ans), sol: `交換のきまりで ${a} × ${b} × ${n} とならべかえると ${a * b} × ${n} ＝ ${ans}` };
    } },
    { id: 'box', name: '□を求める', gen() {
      const t = pick(['x', '+', '-', '/']), a = R(3, 9), x = R(4, 12);
      if (t === 'x') return { q: `□ × ${a} ＝ ${x * a}　□にあてはまる数は？`, input: 'num', ans: x, ansText: String(x), wrongs: [{ v: x * a * a, tag: 'box' }, { v: x * a - a, tag: 'box' }], sol: `□ ＝ ${x * a} ÷ ${a} ＝ ${x}` };
      if (t === '+') { const b = R(20, 80), c = R(20, 80); return { q: `□ ＋ ${b} ＝ ${b + c}　□にあてはまる数は？`, input: 'num', ans: c, ansText: String(c), wrongs: [{ v: 2 * b + c, tag: 'box' }], sol: `□ ＝ ${b + c} − ${b} ＝ ${c}` }; }
      if (t === '-') { const b = R(10, 50), c = R(10, 50); return { q: `□ − ${b} ＝ ${c}　□にあてはまる数は？`, input: 'num', ans: b + c, ansText: String(b + c), wrongs: [{ v: Math.abs(c - b), tag: 'box' }], sol: `□ ＝ ${c} ＋ ${b} ＝ ${b + c}` }; }
      return { q: `□ ÷ ${a} ＝ ${x}　□にあてはまる数は？`, input: 'num', ans: a * x, ansText: String(a * x), wrongs: [{ v: x / a, tag: 'box' }], sol: `□ ＝ ${x} × ${a} ＝ ${a * x}` };
    } },
  ],
});

/* ===== そろばん ===== */
UNITS.push({
  id: 'soro', area: 'num', title: 'そろばん', short: '玉の読み方・数の入れ方、たし算・ひき算',
  explain: `<div class="ex">
<h3>1. そろばんのしくみ</h3>
<ul><li>はりの上の玉（<b>五玉</b>）1つで <b>5</b>、下の玉（<b>一玉</b>）1つで <b>1</b> を表します。</li>
<li>はりに近づいている玉だけを数えます。</li>
<li>はりの上の点（<b>定位点</b>）がある1つのけたを一の位と決め、左へ十、百、千…と読みます。小数は定位点の右が 1/10 の位です。</li></ul>
<h3>2. 数の入れ方（たし算）</h3>
<div class="box">3 ＋ 4：一玉が4つたりない → 五玉を入れて一玉を1つはらう（5 − 1）→ 7<br>8 ＋ 5：一の位に5を入れられない → 十の位に1を入れて一の位から5をはらう（10 − 5）→ 13</div>
<h3>3. ひき算</h3>
<div class="box">7 − 4：一玉4つがない → 五玉をはらって一玉を1つ入れる（−5 ＋ 1）→ 3<br>12 − 5：一の位から5をひけない → 十の位から1はらって一の位に5を入れる（−10 ＋ 5）→ 7</div>
<div class="warn"><b>つまずきやすいところ</b><br>・五玉を 1 と読んでしまう。<br>・どのけたが一の位かわからなくなる → 定位点をさがしてから読む。</div>
</div>`,
  exp(root) {
    let ds = [0, 0, 0, 0, 0, 0], target = R(10, 9999);
    const draw = () => {
      const v = Number(ds.join(''));
      root.innerHTML = `<div class="stage" id="sb">${soroDraw(ds, true)}</div><div class="say">いまの数：<span class="big">${v}</span>　<span class="note">玉をタップすると動きます。いちばん右が一の位です。</span></div>
<div class="say">チャレンジ：<span class="big">${target}</span> をそろばんに入れてみよう ${v === target ? '<b style="color:var(--ok)">できた！</b>' : ''}</div>
<div class="btns"><button class="btn" data-o="clr">ごはさん（0 にする）</button><button class="btn main" data-o="new">べつのチャレンジ</button></div>`;
    };
    root.addEventListener('click', e => {
      const b = e.target.closest('.bead'), o = e.target.closest('[data-o]')?.dataset.o;
      if (b) { const r = +b.dataset.r, k = b.dataset.b, d = ds[r]; if (k === 'h') ds[r] = d >= 5 ? d - 5 : d + 5; else { const j = +k, c = d % 5; ds[r] = d - c + (j < c ? j : j + 1); } draw(); }
      else if (o === 'clr') { ds = ds.map(() => 0); draw(); } else if (o === 'new') { target = R(10, 9999); draw(); }
    });
    draw();
  },
  kinds: [
    { id: 'read', name: 'そろばんの数を読む', gen() {
      const n = R(10, 99999), s = String(n).padStart(6, '0');
      return { q: `そろばんが表している数を読みましょう。（いちばん右のけたが一の位）${soroSVG(n)}`, input: 'num', ans: n, ansText: String(n), wide: true, sol: `左から ${s.split('').map(Number).join('、')}。五玉が入っているけたは5をたして数えます → ${n}`,
        diag: u => { const t = String(Math.round(u)).padStart(6, '0'); if (t.length !== 6) return 'soroPlace'; let five = 0, other = 0; for (let i = 0; i < 6; i++) { const df = Math.abs(+t[i] - +s[i]); if (df === 5) five++; else if (df) other++; } if (five && !other) return 'soroGo'; if (String(Math.round(u)).replace(/0+$/, '') === String(n).replace(/0+$/, '')) return 'soroPlace'; return 'calc'; } };
    } },
    { id: 'calc', name: 'そろばんのたし算・ひき算', gen() {
      const a = R(12, 89), b = R(12, 89), plus = Math.random() < .5 || b > a;
      const ans = plus ? a + b : a - b;
      return { q: `そろばんで計算しましょう。${a} ${plus ? '＋' : '−'} ${b} ＝ ？`, input: 'num', ans, ansText: String(ans), sol: `${plus ? 'たし算は十の位から入れます。' : 'ひき算は十の位からはらいます。'}一の位で入らない（はらえない）ときは、となりのけたに1を入れて（はらって）調整します。答え ${ans}` };
    } },
  ],
});

/* ===== 角 ===== */
UNITS.push({
  id: 'angle', area: 'shape', title: '角とその大きさ', short: '回転の大きさ、分度器、180°をこえる角、三角じょうぎ',
  explain: `<div class="ex">
<h3>1. 角の大きさは「回転の大きさ」</h3>
<p>辺の長さには関係なく、<b>辺の開きぐあい</b>が角の大きさです。単位は <b>度（°）</b>。</p>
<ul><li>直角 ＝ 90°　／　半回転（2直角）＝ 180°　／　1回転（4直角）＝ 360°</li></ul>
<h3>2. 分度器のつかい方</h3>
<ol><li>分度器の<b>中心</b>を角の頂点に合わせる</li><li><b>0°の線</b>を1つの辺に合わせる</li><li>もう1つの辺が重なる目もりを読む。0°がある側の目もり（内側か外側か）を読む</li></ol>
<h3>3. 180° をこえる角</h3>
<div class="box">210° の角 → 180° ＋ 30°（半回転よりあと30°）<br>または 360° − 150°（1回転から反対側の角をひく）</div>
<h3>4. 三角じょうぎの角</h3>
<p>1組の三角じょうぎの角は 90°・45°・45° と 90°・60°・30°。組み合わせて 75°（45＋30）、105°（45＋60）、15°（45−30）などがつくれます。</p>
<div class="warn"><b>つまずきやすいところ</b><br>・反対側の目もりを読んで、60° を 120° と答えてしまう → だいたい直角より大きいか小さいかを先に見ておく。<br>・180° をこえる角を、小さいほうの角と答えてしまう。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="two"><div class="stage" id="ag"></div><div><div class="ctrl"><label>角の大きさ <input type="range" min="0" max="360" step="5" value="60" id="av"><output id="ao"></output></label></div><div class="say" id="as"></div></div></div>`;
    const draw = () => {
      const d = +$('#av', root).value; $('#ao', root).textContent = d + '°';
      $('#ag', root).innerHTML = angleSVG(d || 0.01, { prot: d <= 180, label: d + '°' });
      $('#as', root).innerHTML = d < 90 ? `直角（90°）より小さい角` : d === 90 ? `<span class="big">直角</span>（90°）` : d < 180 ? `直角より大きく、半回転（180°）より小さい角` : d === 180 ? `<span class="big">半回転</span>：一直線になります（180°）` : d < 360 ? `180° をこえる角<br>180° ＋ ${d - 180}° ＝ <span class="big">${d}°</span><br>360° − ${360 - d}° ＝ <span class="big">${d}°</span>` : `<span class="big">1回転</span>（360°）`;
      if (d <= 180) $('#as', root).innerHTML += `<br><span class="note">青い数字は右の辺を0°とする目もり、赤い数字は左の辺を0°とする目もりです。</span>`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'measure', name: '分度器で角をはかる', gen() { let d; do { d = R(4, 32) * 5; } while (d === 90); return { q: `分度器で、角の大きさをはかりましょう。${angleSVG(d, { prot: true })}`, input: 'num', label: '°', ans: d, ansText: d + '°', wrongs: [{ v: 180 - d, tag: 'protractor' }], sol: `右の辺が青い目もりの 0° に合っているので、青い目もりを読みます → ${d}°。${d < 90 ? '直角より小さい' : '直角より大きい'}ことも確かめましょう。` }; } },
    { id: 'reflex', name: '180° をこえる角', gen() { const d = R(19, 34) * 10 + pick([0, 5]), sm = 360 - d; return { q: `色のついた角の大きさは何度ですか。点線の角は ${sm}° です。${angleSVG(d, { given: sm })}`, input: 'num', label: '°', ans: d, ansText: d + '°', wrongs: [{ v: sm, tag: 'reflex' }, { v: 180 + sm, tag: 'reflex' }].filter(w => w.v !== d), defTag: 'reflex', sol: `1回転は360°。360° − ${sm}° ＝ ${d}°` }; } },
    { id: 'tri', name: '三角じょうぎの角', gen() { const [a, b, op] = pick([[45, 30, '+'], [45, 60, '+'], [90, 30, '+'], [90, 45, '+'], [60, 45, '−'], [90, 30, '−'], [45, 30, '−'], [90, 60, '+']]); const ans = op === '+' ? a + b : a - b; return { q: `三角じょうぎの ${a}° と ${b}° の角を${op === '+' ? '組み合わせてできる角' : '重ねてできる角（大きいほうから小さいほうをひいた角）'}は何度ですか。`, input: 'num', label: '°', ans, ansText: ans + '°', sol: `${a}° ${op} ${b}° ＝ ${ans}°` }; } },
    { id: 'turn', name: '回転の角', gen() { const [q, a] = pick([['直角2つ分', 180], ['直角3つ分', 270], ['半回転', 180], ['1回転', 360], ['直角1つ分', 90], ['1回転と直角1つ分', 450]]); return { q: `${q}の角は何度ですか。`, input: 'num', label: '°', ans: a, ansText: a + '°', defTag: 'turn', sol: `直角は90°。${q}は ${a}° です。` }; } },
  ],
});

/* ===== 垂直・平行と四角形 ===== */
const QUADS = {
  台形: { pts: '50,140 230,140 180,50 95,50', par: '1組', side: '決まりはない', ang: '決まりはない', diag: 'とくに決まりはない' },
  平行四辺形: { pts: '30,140 190,140 235,50 75,50', par: '2組', side: '向かい合う辺の長さが等しい', ang: '向かい合う角が等しい', diag: 'それぞれの真ん中で交わる' },
  ひし形: { pts: '135,15 225,95 135,175 45,95', par: '2組', side: '4つの辺がすべて等しい', ang: '向かい合う角が等しい', diag: '真ん中で垂直に交わる' },
  長方形: { pts: '40,40 230,40 230,145 40,145', par: '2組', side: '向かい合う辺の長さが等しい', ang: '4つとも直角', diag: '長さが等しく、真ん中で交わる' },
  正方形: { pts: '80,30 190,30 190,140 80,140', par: '2組', side: '4つの辺がすべて等しい', ang: '4つとも直角', diag: '長さが等しく、真ん中で垂直に交わる' },
};
UNITS.push({
  id: 'quad', area: 'shape', title: '垂直・平行と四角形', short: '垂直・平行、台形・平行四辺形・ひし形、対角線',
  explain: `<div class="ex">
<h3>1. 垂直と平行</h3>
<ul><li>2本の直線が<b>直角に交わる</b>とき、2本の直線は <b>垂直</b>。交わっていなくても、のばして直角に交われば垂直です。</li>
<li>1本の直線に垂直な2本の直線は <b>平行</b>。平行な直線のはばはどこも等しく、どこまでのばしても交わりません。</li>
<li>平行な直線は、ほかの直線と<b>等しい角度</b>で交わります。</li></ul>
<h3>2. 四角形のなかま</h3>
<table><tr><th>四角形</th><th>平行な辺</th><th>辺</th><th>角</th></tr>
<tr><td>台形</td><td>1組</td><td>—</td><td>—</td></tr>
<tr><td>平行四辺形</td><td>2組</td><td>向かい合う辺が等しい</td><td>向かい合う角が等しい</td></tr>
<tr><td>ひし形</td><td>2組</td><td>4つとも等しい</td><td>向かい合う角が等しい</td></tr></table>
<p>平行四辺形のとなり合う角をたすと 180° になります。</p>
<h3>3. 対角線</h3>
<p>向かい合った頂点を結んだ直線を <b>対角線</b> といいます。</p>
<table><tr><th></th><th>長さが等しい</th><th>垂直に交わる</th><th>真ん中で交わる</th></tr>
<tr><td>平行四辺形</td><td></td><td></td><td>○</td></tr><tr><td>ひし形</td><td></td><td>○</td><td>○</td></tr><tr><td>長方形</td><td>○</td><td></td><td>○</td></tr><tr><td>正方形</td><td>○</td><td>○</td><td>○</td></tr></table>
<div class="warn"><b>つまずきやすいところ</b><br>・台形と平行四辺形の区別（平行が1組か2組か）。<br>・平行四辺形のとなり合う角を等しいと考えてしまう。</div>
</div>`,
  exp(root) {
    let cur = '平行四辺形', diag = true;
    const draw = () => {
      const Q = QUADS[cur], p = Q.pts.split(' ').map(s => s.split(',').map(Number));
      let s = `<svg viewBox="0 0 270 190" width="270" role="img" aria-label="${cur}"><polygon points="${Q.pts}" class="fill1"/>`;
      if (diag) s += `<line x1="${p[0][0]}" y1="${p[0][1]}" x2="${p[2][0]}" y2="${p[2][1]}" class="dash"/><line x1="${p[1][0]}" y1="${p[1][1]}" x2="${p[3][0]}" y2="${p[3][1]}" class="dash"/>`;
      root.innerHTML = `<div class="chips">${Object.keys(QUADS).map(k => `<button class="chip${k === cur ? ' on' : ''}" data-q="${k}">${k}</button>`).join('')}<button class="chip" data-d="1">対角線：${diag ? 'あり' : 'なし'}</button></div>
<div class="two"><div class="stage">${s}</svg></div><table class="tbl"><tr><th>平行な辺</th><td>${Q.par}</td></tr><tr><th>辺</th><td>${Q.side}</td></tr><tr><th>角</th><td>${Q.ang}</td></tr><tr><th>対角線</th><td>${Q.diag}</td></tr></table></div>`;
    };
    root.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.q) cur = b.dataset.q; if (b.dataset.d) diag = !diag; draw(); });
    draw();
  },
  kinds: [
    { id: 'def', name: '四角形・垂直平行の決まり', gen() {
      const S = ['台形', '平行四辺形', 'ひし形', '長方形', '正方形'];
      const pool = [['向かい合った1組の辺だけが平行な四角形は？', '台形', S], ['向かい合った2組の辺がそれぞれ平行な四角形は？', '平行四辺形', S], ['4つの辺の長さがすべて等しい四角形は？（角は直角とはかぎらない）', 'ひし形', S], ['2本の直線が直角に交わっているとき、2本の直線は？', '垂直', ['垂直', '平行', '対角線']], ['1本の直線に垂直な2本の直線は？', '平行', ['垂直', '平行', '対角線']], ['四角形の向かい合った頂点を結んだ直線を何という？', '対角線', ['垂直', '平行', '対角線']]];
      const [q, a, c] = pick(pool); return ch(q, a, c, 'quadDef', TAGS.quadDef.tip);
    } },
    { id: 'diag', name: '対角線の性質', gen() {
      const pool = [['対角線の長さが等しく、垂直に交わり、それぞれの真ん中で交わる四角形は？', '正方形'], ['対角線が垂直に交わり、それぞれの真ん中で交わる（長さは等しくない）四角形は？', 'ひし形'], ['対角線の長さが等しく、それぞれの真ん中で交わる（垂直ではない）四角形は？', '長方形'], ['対角線がそれぞれの真ん中で交わるが、長さも等しくなく垂直でもない四角形は？', '平行四辺形']];
      const [q, a] = pick(pool); return ch(q, a, ['正方形', 'ひし形', '長方形', '平行四辺形'], 'quadProp', '平行四辺形：真ん中で交わる。ひし形：＋垂直。長方形：＋長さが等しい。正方形：ぜんぶ。');
    } },
    { id: 'angle', name: '平行四辺形・ひし形の角', gen() {
      const a = R(5, 16) * 5, sh = pick(['平行四辺形', 'ひし形']), opp = Math.random() < .5, ans = opp ? a : 180 - a;
      return { q: `${sh}の1つの角が ${a}° です。この角と${opp ? '向かい合う' : 'となり合う'}角は何度ですか。`, input: 'num', label: '°', ans, ansText: ans + '°', wrongs: (opp ? [180 - a, 360 - a] : [a, 360 - a]).map(v => ({ v, tag: 'quadProp' })), sol: opp ? `向かい合う角は等しいので ${a}°` : `となり合う角をたすと180°なので 180° − ${a}° ＝ ${180 - a}°` };
    } },
    { id: 'par', name: '平行な直線と角', gen() {
      let a; do { a = R(8, 28) * 5; } while (a === 90); const same = Math.random() < .5, ans = same ? a : 180 - a;
      return { q: `直線アと直線イは平行です。？の角は何度ですか。${parSVG(a, same ? 'same' : 'adj')}`, input: 'num', label: '°', ans, ansText: ans + '°', wrongs: [{ v: same ? 180 - a : a, tag: 'parallelAngle' }], defTag: 'parallelAngle', sol: same ? `平行な直線はほかの直線と等しい角度で交わるので ${a}°` : `平行な直線と等しい角度で交わるので、下でも ${a}° の角ができます。一直線は180°なので 180° − ${a}° ＝ ${180 - a}°` };
    } },
  ],
});

/* ===== 面積 ===== */
UNITS.push({
  id: 'area', area: 'shape', title: '面積', short: '面積の意味、公式、cm²・m²・km²・a・ha、組み合わせた図形',
  explain: `<div class="ex">
<h3>1. 面積の意味</h3>
<p>広さのことを <b>面積</b> といいます。1辺が1cmの正方形の面積が <b>1cm²</b>（1平方センチメートル）。いくつ分あるかで面積を表します。</p>
<h3>2. 公式</h3>
<div class="box">長方形の面積 ＝ たて × 横　／　正方形の面積 ＝ 1辺 × 1辺</div>
<p>面積とたての長さがわかれば、横 ＝ 面積 ÷ たて で求められます。</p>
<h3>3. 組み合わせた図形</h3>
<ul><li>いくつかの長方形に<b>分けて</b>たす</li><li>大きな長方形から欠けた部分を<b>ひく</b></li><li>動かして1つの長方形に<b>形を変える</b></li></ul>
<h3>4. 大きな面積の単位</h3>
<table><tr><th>単位</th><th>正方形の1辺</th><th>関係</th></tr>
<tr><td>1m²</td><td>1m</td><td>＝10000cm²</td></tr><tr><td>1a（アール）</td><td>10m</td><td>＝100m²</td></tr><tr><td>1ha（ヘクタール）</td><td>100m</td><td>＝100a ＝10000m²</td></tr><tr><td>1km²</td><td>1km</td><td>＝100ha ＝1000000m²</td></tr></table>
<p>1辺の長さが10倍になると、面積は 10×10 ＝ 100倍 になります。</p>
<div class="warn"><b>つまずきやすいところ</b><br>・たてと横をたしてしまう（周りの長さと混同）。<br>・1m² ＝ 100cm² とまちがえる → 100cm × 100cm ＝ 10000cm²。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="two"><div class="stage" id="arg"></div><div><div class="ctrl"><label>たて(cm) <input type="range" min="1" max="8" value="3" id="ah"><output></output></label><label>横(cm) <input type="range" min="1" max="12" value="5" id="aw"><output></output></label></div><div class="say" id="ars"></div></div></div>`;
    const draw = () => {
      const h = +$('#ah', root).value, w = +$('#aw', root).value; $$('.ctrl output', root).forEach((o, i) => o.textContent = [h, w][i]);
      let s = `<svg viewBox="0 0 ${12 * 26 + 20} ${8 * 26 + 20}" width="${12 * 26 + 20}" role="img" aria-label="方眼の長方形">`;
      for (let i = 0; i <= 12; i++) s += `<line x1="${10 + i * 26}" y1="10" x2="${10 + i * 26}" y2="${10 + 8 * 26}" class="gline"/>`;
      for (let j = 0; j <= 8; j++) s += `<line x1="10" y1="${10 + j * 26}" x2="${10 + 12 * 26}" y2="${10 + j * 26}" class="gline"/>`;
      s += `<rect x="10" y="10" width="${w * 26}" height="${h * 26}" class="fill1"/>`;
      $('#arg', root).innerHTML = s + '</svg>';
      $('#ars', root).innerHTML = `1cm² の正方形が、たてに ${h} こ、横に ${w} こ<br>面積：${h} × ${w} ＝ <span class="big">${h * w}cm²</span><br>周りの長さ：(${h} ＋ ${w}) × 2 ＝ ${(h + w) * 2}cm<br><span class="note">面積と周りの長さはちがうものです。形を変えると、どう変わるかくらべてみよう。</span>`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'rect', name: '長方形・正方形の面積', gen() {
      const sq = Math.random() < .3, h = R(3, 15), w = sq ? h : R(3, 18), ans = h * w;
      return { q: sq ? `1辺が ${h}cm の正方形の面積は何cm²ですか。` : `たて ${h}cm、横 ${w}cm の長方形の面積は何cm²ですか。`, input: 'num', label: 'cm²', ans, ansText: ans + 'cm²', wrongs: [{ v: (h + w) * 2, tag: 'areaPerim' }, { v: h + w, tag: 'areaPerim' }].filter(x => x.v !== ans), sol: `${sq ? '1辺 × 1辺' : 'たて × 横'} ＝ ${h} × ${w} ＝ ${ans}cm²` };
    } },
    { id: 'comp', name: '組み合わせた図形の面積', gen() {
      const W1 = R(6, 12), H1 = R(5, 10), w2 = R(2, W1 - 3), h2 = R(2, H1 - 3), ans = W1 * H1 - w2 * h2;
      return { q: `次の図形の面積は何cm²ですか。${lshapeSVG(W1, H1, w2, h2)}`, input: 'num', label: 'cm²', ans, ansText: ans + 'cm²', wrongs: [{ v: W1 * H1, tag: 'areaComposite' }, { v: (W1 - w2) * H1 + w2 * h2, tag: 'areaComposite' }].filter(x => x.v !== ans), wide: true,
        sol: `大きな長方形 ${W1}×${H1}＝${W1 * H1} から、欠けた部分 ${w2}×${h2}＝${w2 * h2} をひいて ${ans}cm²。（2つの長方形に分けて ${W1 - w2}×${H1}＋${w2}×${H1 - h2}＝${ans} でもよい）` };
    } },
    { id: 'unit', name: '面積の単位', gen() {
      const [f, t, k] = pick([['ha', 'a', 100], ['a', 'm²', 100], ['ha', 'm²', 10000], ['km²', 'ha', 100], ['m²', 'cm²', 10000], ['km²', 'm²', 1000000]]), x = R(2, 9), ans = x * k;
      return { q: `${x}${f} ＝ □${t}　□にあてはまる数は？`, input: 'num', label: t, ans, ansText: `${ans}${t}`, diag: u => isPow10(u, ans) ? 'areaUnit' : null, defTag: 'areaUnit', sol: `1${f} ＝ ${k}${t} なので、${x}${f} ＝ ${ans}${t}` };
    } },
    { id: 'inv', name: '面積から長さを求める', gen() {
      const h = R(3, 12), w = R(3, 15), A = h * w;
      return { q: `面積が ${A}cm²、たてが ${h}cm の長方形があります。横は何cmですか。`, input: 'num', label: 'cm', ans: w, ansText: w + 'cm', wrongs: [{ v: A - h, tag: 'areaInverse' }, { v: A * h, tag: 'areaInverse' }, { v: A / 2 - h, tag: 'areaPerim' }].filter(x => x.v !== w), defTag: 'areaInverse', sol: `${h} × □ ＝ ${A} → □ ＝ ${A} ÷ ${h} ＝ ${w}cm` };
    } },
  ],
});

/* ===== 直方体と立方体・位置 ===== */
UNITS.push({
  id: 'solid', area: 'shape', title: '直方体と立方体・位置の表し方', short: '面・辺・頂点、見取り図・展開図、平行と垂直、位置',
  explain: `<div class="ex">
<h3>1. 直方体と立方体</h3>
<p>長方形だけ、または長方形と正方形でかこまれた形が <b>直方体</b>、正方形だけでかこまれた形が <b>立方体</b> です。</p>
<table><tr><th></th><th>面</th><th>辺</th><th>頂点</th></tr><tr><td>直方体・立方体</td><td>6</td><td>12</td><td>8</td></tr></table>
<h3>2. 見取り図と展開図</h3>
<ul><li><b>見取り図</b>：全体の形がわかるようにかいた図。見えない辺は点線でかきます。</li>
<li><b>展開図</b>：辺にそって切り開いて、平面に広げた図。組み立てたとき重なる辺の長さは等しくなります。</li></ul>
<h3>3. 面や辺の平行・垂直</h3>
<ul><li>1つの面に<b>平行な面は1つ</b>、<b>垂直な面は4つ</b>。</li><li>1つの辺に平行な辺は3本、垂直な辺は4本。</li></ul>
<h3>4. 位置の表し方</h3>
<p>平面の位置は（横，たて）、空間の位置は（横，たて，高さ）のように、もとにする点からの長さの組で表します。</p>
<div class="box">点Aから横に3、たてに2 → （3，2）　／　横に4cm、たてに2cm、高さ3cm → （4，2，3）</div>
<div class="warn"><b>つまずきやすいところ</b><br>・辺と頂点の数をとりちがえる。<br>・（横，たて）の順番を逆にしてしまう。</div>
</div>`,
  exp(root) {
    let mode = 'face', view = 'box', hl = 'ア';
    const OPP = { ア: 'ウ', ウ: 'ア', イ: 'エ', エ: 'イ', オ: 'カ', カ: 'オ' };
    const draw = () => {
      const msg = { face: '面は6つ（見えているのは3つ。うしろ・下・左にも面がある）', edge: '辺は12本（見えない辺は点線）', vertex: '頂点は8つ' }[mode];
      root.innerHTML = `<div class="chips"><button class="chip${view === 'box' ? ' on' : ''}" data-v="box">見取り図</button><button class="chip${view === 'net' ? ' on' : ''}" data-v="net">展開図</button></div>
${view === 'box' ? `<div class="two"><div class="stage">${cuboidSVG(mode)}</div><div><div class="chips">${[['face', '面'], ['edge', '辺'], ['vertex', '頂点']].map(([k, n]) => `<button class="chip${k === mode ? ' on' : ''}" data-m="${k}">${n}</button>`).join('')}</div><p class="say">${msg}</p></div></div>`
          : `<div class="two"><div class="stage">${netSVG(hl)}</div><div><p class="say">面をタップしてね。<br>組み立てると、面<span class="big">${hl}</span>と向かい合うのは面<span class="big">${OPP[hl]}</span></p><div class="chips">${Object.keys(OPP).map(k => `<button class="chip${k === hl ? ' on' : ''}" data-f="${k}">${k}</button>`).join('')}</div></div></div>`}`;
    };
    root.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.m) mode = b.dataset.m; if (b.dataset.v) view = b.dataset.v; if (b.dataset.f) hl = b.dataset.f; draw(); });
    draw();
  },
  kinds: [
    { id: 'parts', name: '面・辺・頂点の数', gen() { const [q, a] = pick([['直方体の頂点', 8], ['直方体の辺', 12], ['直方体の面', 6], ['立方体の辺', 12], ['立方体の頂点', 8], ['立方体の面', 6]]); return { q: `${q}の数はいくつですか。`, input: 'num', ans: a, ansText: String(a), wrongs: [6, 8, 12].filter(v => v !== a).map(v => ({ v, tag: 'solidParts' })), sol: '面6、辺12、頂点8 です。見取り図で、見えない部分も数えましょう。' }; } },
    { id: 'rel', name: '面や辺の平行・垂直', gen() { const [q, a] = pick([['直方体で、1つの面に垂直な面はいくつありますか。', 4], ['直方体で、1つの面に平行な面はいくつありますか。', 1], ['直方体で、1つの辺に平行な辺は（その辺をのぞいて）何本ありますか。', 3], ['直方体で、1つの辺に垂直な辺は何本ありますか。', 4]]); return { q, input: 'num', ans: a, ansText: String(a), defTag: 'solidRel', sol: TAGS.solidRel.tip + '1つの辺に平行な辺は3本、垂直な辺は4本です。' }; } },
    { id: 'net', name: '展開図', gen() { const OPP = { ア: 'ウ', ウ: 'ア', イ: 'エ', エ: 'イ', オ: 'カ', カ: 'オ' }, f = pick(Object.keys(OPP)); return ch(`立方体の展開図を組み立てたとき、面${f}と向かい合う面はどれですか。${netSVG(f)}`, OPP[f], Object.keys(OPP).filter(k => k !== f), 'solidNet', `横にならんだ4つの面は1つおきに向かい合い、上と下の面どうしが向かい合います。面${f}と向かい合うのは面${OPP[f]}です。`, { wide: true }); } },
    { id: 'pos', name: '位置の表し方', gen() {
      if (Math.random() < .6) { let x, y; do { x = R(1, 6); y = R(1, 6); } while (x === y); return { q: `点Aをもとにして、点Pの位置を（横，たて）で表しましょう。${gridSVG(x, y)}`, input: 'pair', ans: [x, y], ansText: `（${x}，${y}）`, diag: u => u[0] === y && u[1] === x ? 'position' : null, sol: `横に ${x}、たてに ${y} なので（${x}，${y}）。横が先です。` }; }
      const x = R(1, 9), y = R(1, 9), z = R(1, 9), a = `（${x}，${y}，${z}）`;
      return ch(`点Aから、横に${x}cm、たてに${y}cm、高さ${z}cm の位置を（横，たて，高さ）で表すと？`, a, [...new Set([a, `（${y}，${x}，${z}）`, `（${z}，${y}，${x}）`, `（${x}，${z}，${y}）`])], 'position', '（横，たて，高さ）の順で書きます。');
    } },
  ],
});

/* ===== 変わり方調べ ===== */
UNITS.push({
  id: 'change', area: 'change', title: '変わり方調べ', short: 'ともなって変わる2つの量、表、□と○の式',
  explain: `<div class="ex">
<h3>1. ともなって変わる2つの量</h3>
<p>一方が変わると、それにつれてもう一方も変わる2つの量を、<b>表</b>にかいて調べます。</p>
<h3>2. 表の見方</h3>
<table><tr><th>正方形の数（□こ）</th><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th>ぼうの数（○本）</th><td>4</td><td>7</td><td>10</td><td>13</td></tr></table>
<ul><li><b>横に見る</b>：□が1ふえると、○は3ふえる</li><li><b>たてに見る</b>：○ ＝ □ × 3 ＋ 1（はじめの1本 ＋ 1こにつき3本）</li></ul>
<p>たてに見て関係を式にすると、□が大きくても表をのばさずに求められます。</p>
<h3>3. 式に表す</h3>
<div class="box">・まわりの長さが 20cm の長方形：たて□cm、横○cm → □ ＋ ○ ＝ 10<br>・1本 60円のえんぴつ□本の代金○円 → 60 × □ ＝ ○<br>・兄は弟より3才年上：弟□才、兄○才 → □ ＋ 3 ＝ ○</div>
<div class="warn"><b>つまずきやすいところ</b><br>・正方形1こにぼう4本と考えて「□×4」にしてしまう → となりの正方形とぼうを共有している。<br>・表を横にだけ見て、たての関係（式）にできない。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="stage" id="cg"></div><div class="ctrl"><label>正方形の数 <input type="range" min="1" max="10" value="3" id="cn"><output></output></label></div><div id="ct"></div>`;
    const draw = () => {
      const n = +$('#cn', root).value; $('.ctrl output', root).textContent = n;
      $('#cg', root).innerHTML = matchSVG(n);
      $('#ct', root).innerHTML = `<table class="tbl"><tr><th>正方形（□こ）</th>${[1, 2, 3, 4, 5, 6].map(i => `<td${i === n ? ' style="background:color-mix(in srgb,var(--ac) 22%,transparent)"' : ''}>${i}</td>`).join('')}</tr><tr><th>ぼう（○本）</th>${[1, 2, 3, 4, 5, 6].map(i => `<td>${3 * i + 1}</td>`).join('')}</tr></table>
<p class="say">□が1ふえると○は3ふえる。<br>○ ＝ □ × 3 ＋ 1 → ${n} × 3 ＋ 1 ＝ <span class="big">${3 * n + 1}</span>本</p>`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'match', name: 'きまりを見つける', gen() { const n = R(5, 15), ans = 3 * n + 1; return { q: `ぼうを使って、正方形を横につなげていきます。${matchSVG(3)}正方形を ${n} こつくるには、ぼうは何本いりますか。`, input: 'num', label: '本', ans, ansText: ans + '本', wrongs: [{ v: 4 * n, tag: 'pattern' }, { v: 3 * n, tag: 'pattern' }], defTag: 'pattern', sol: `はじめの1本と、正方形1こにつき3本。${n} × 3 ＋ 1 ＝ ${ans}本` }; } },
    { id: 'table', name: '表から関係を読む', gen() {
      const t = pick(['x', '+', 'S']), m = R(2, 9), S = R(12, 20), k = t === 'S' ? R(5, S - 1) : R(7, 15);
      const f = x => t === 'x' ? x * m : t === '+' ? x + m : S - x;
      const ans = f(k), wr = t === 'x' ? [k + m, f(4) + (k - 4)] : t === '+' ? [k * m, f(4) + m] : [S + k, k];
      return { q: `□と○の関係を表にしました。<table class="tbl"><tr><th>□</th>${[1, 2, 3, 4].map(i => `<td>${i}</td>`).join('')}</tr><tr><th>○</th>${[1, 2, 3, 4].map(i => `<td>${f(i)}</td>`).join('')}</tr></table>□が ${k} のとき、○はいくつですか。`, input: 'num', ans, ansText: String(ans), wrongs: wr.filter(v => v !== ans).map(v => ({ v, tag: 'relation' })), defTag: 'relation', sol: `たてに見ると ${t === 'x' ? `○ ＝ □ × ${m}` : t === '+' ? `○ ＝ □ ＋ ${m}` : `□ ＋ ○ ＝ ${S}`}。□が${k}のとき ○ ＝ ${ans}` };
    } },
    { id: 'formula', name: '□と○の式', gen() {
      const p = R(3, 9) * 10, S = R(5, 9) * 10, a = R(2, 6);
      const sc = [[`1本 ${p}円のえんぴつを□本買ったときの代金を○円とします。`, `${p} × □ ＝ ○`, [`${p} ＋ □ ＝ ○`, `□ ÷ ${p} ＝ ○`, `${p} − □ ＝ ○`]], [`${S}cm のひもから□cm 切りとった残りの長さを○cm とします。`, `${S} − □ ＝ ○`, [`${S} ＋ □ ＝ ○`, `□ − ${S} ＝ ○`, `${S} × □ ＝ ○`]], [`兄は弟より ${a} 才年上です。弟が□才のときの兄の年れいを○才とします。`, `□ ＋ ${a} ＝ ○`, [`□ − ${a} ＝ ○`, `□ × ${a} ＝ ○`, `${a} − □ ＝ ○`]]];
      const [q, ans, dis] = pick(sc);
      return ch(`${q}□と○の関係を表す式はどれですか。`, ans, [ans, ...dis], 'relation', 'まずことばの式をつくります（例：1本のねだん × 本数 ＝ 代金）。そのあと □ と ○ をあてはめます。');
    } },
  ],
});

/* ===== 倍の見方 ===== */
UNITS.push({
  id: 'ratio', area: 'change', title: '倍の見方（かんたんな割合）', short: '何倍か、もとにする量、差と倍のちがい',
  explain: `<div class="ex">
<h3>1. 何倍かを求める</h3>
<div class="box">何倍 ＝ くらべる量 ÷ もとにする量<br>赤 24cm は白 6cm の何倍？ → 24 ÷ 6 ＝ <b>4倍</b></div>
<h3>2. もとにする量を求める</h3>
<p>「○の何倍」の ○ が<b>もとにする量</b>です。テープ図にかくとわかりやすくなります。</p>
<div class="box">A は B の3倍で 45 → B × 3 ＝ 45 → B ＝ 45 ÷ 3 ＝ <b>15</b></div>
<h3>3. 「差」でくらべるか「倍」でくらべるか</h3>
<table><tr><th></th><th>前</th><th>後</th><th>差</th><th>何倍</th></tr><tr><td>おかしA</td><td>50円</td><td>150円</td><td>100円</td><td>3倍</td></tr><tr><td>おかしB</td><td>200円</td><td>400円</td><td>200円</td><td>2倍</td></tr></table>
<p>ねだんの「差」はBのほうが大きいけれど、「もとのねだんの何倍になったか」でくらべると <b>Aのほうがよくねあがりした</b> といえます。もとの大きさがちがうものをくらべるときは、倍で考えます。</p>
<div class="warn"><b>つまずきやすいところ</b><br>・何倍かを求めるのに、ひき算をしてしまう。<br>・もとにする量とくらべる量を逆にしてわる。</div>
</div>`,
  exp(root) {
    root.innerHTML = `<div class="ctrl"><label>もとにする量 <input type="range" min="1" max="10" value="4" id="tb"><output></output></label><label>何倍 <input type="range" min="1" max="6" value="3" id="tm"><output></output></label></div><div class="stage" id="tg"></div><div class="say" id="ts"></div>`;
    const draw = () => {
      const b = +$('#tb', root).value, m = +$('#tm', root).value, u = 52; $$('.ctrl output', root).forEach((o, i) => o.textContent = [b, m][i]);
      let s = `<svg viewBox="0 0 ${b * m * u / b > 0 ? Math.max(360, 60 * 6 + 120) : 360} 130" width="480" role="img" aria-label="テープ図">`;
      const W = 60; s += `<text x="40" y="35" class="lbl s">もと</text><rect x="80" y="20" width="${W}" height="30" class="fill2"/><text x="${80 + W / 2}" y="36" class="lbl s">${b}</text>`;
      s += `<text x="40" y="90" class="lbl s">くらべる</text>`; for (let i = 0; i < m; i++) s += `<rect x="${80 + i * W}" y="75" width="${W}" height="30" class="fill1"/><text x="${80 + i * W + W / 2}" y="91" class="lbl s">${b}</text>`;
      $('#tg', root).innerHTML = s + '</svg>';
      $('#ts', root).innerHTML = `くらべる量 ＝ ${b} × ${m} ＝ <span class="big">${b * m}</span><br>何倍：${b * m} ÷ ${b} ＝ <span class="big">${m}倍</span>　（差は ${b * m - b}）<br><span class="note">「もと」のテープがいくつ分かが「何倍」です。差とはちがいます。</span>`;
    };
    root.addEventListener('input', draw); draw();
  },
  kinds: [
    { id: 'times', name: '何倍かを求める', gen() { const b = R(3, 12), m = R(2, 9), a = b * m; return { q: `赤いテープは ${a}cm、白いテープは ${b}cm です。赤いテープの長さは、白いテープの長さの何倍ですか。`, input: 'num', label: '倍', ans: m, ansText: m + '倍', wrongs: [{ v: a - b, tag: 'ratioDiff' }, { v: fx(b / a), tag: 'ratioBase' }], sol: `もとにする量は白（${b}cm）。${a} ÷ ${b} ＝ ${m}倍` }; } },
    { id: 'base', name: 'もとにする量を求める', gen() { const b = R(4, 20), m = R(2, 6), a = b * m; return { q: `兄のカードは ${a} まいで、弟のカードの ${m} 倍です。弟のカードは何まいですか。`, input: 'num', label: 'まい', ans: b, ansText: b + 'まい', wrongs: [{ v: a * m, tag: 'ratioBase' }, { v: a - m, tag: 'ratioDiff' }], defTag: 'ratioBase', sol: `弟 × ${m} ＝ ${a} → 弟 ＝ ${a} ÷ ${m} ＝ ${b}まい` }; } },
    { id: 'cmp', name: '差と倍でくらべる', gen() {
      let p1, m1, p2, m2; do { p1 = R(2, 6) * 10; m1 = R(3, 4); p2 = p1 * R(3, 5); m2 = 2; } while (p2 * (m2 - 1) <= p1 * (m1 - 1));
      return ch(`おかしAは ${p1}円から ${p1 * m1}円に、おかしBは ${p2}円から ${p2 * m2}円にねあがりしました。もとのねだんの何倍になったかでくらべると、よくねあがりしたといえるのはどちらですか。`, 'おかしA', ['おかしA', 'おかしB'], 'ratioDiff', `Aは ${p1 * m1}÷${p1}＝${m1}倍、Bは ${p2 * m2}÷${p2}＝${m2}倍。差はBのほうが大きいけれど、倍でくらべるとAのほうがよくねあがりしています。`);
    } },
  ],
});

/* ===== 折れ線グラフ ===== */
const BASE_T = [5, 6, 9, 14, 19, 22, 26, 27, 23, 17, 12, 7];
function tempData(step) { return BASE_T.map(v => Math.max(0, Math.round((v + R(-1, 1)) / step) * step)); }
UNITS.push({
  id: 'graph', area: 'data', title: '折れ線グラフ', short: '変わり方の読みとり、1目もり、波線、グラフの選び方',
  explain: `<div class="ex">
<h3>1. 折れ線グラフとは</h3>
<p>気温や体温のように、<b>時間とともに変わっていく様子</b>を表すのに使うグラフです。量の大きさをくらべるときは ぼうグラフ を使います。</p>
<h3>2. 読み方</h3>
<ol><li>表題・横じく・たてじくの単位を見る</li><li><b>1目もりの大きさ</b>を確かめる（数字のある線と線の間を数える）</li><li>点の位置を横の線までたどって値を読む</li></ol>
<h3>3. 変わり方の読みとり</h3>
<ul><li>線が右上がり → ふえている　／　右下がり → へっている　／　横 → 変わらない</li><li><b>かたむきが急なほど、変わり方が大きい</b></li></ul>
<h3>4. 波線（≈）</h3>
<p>目もりのとちゅうを省くときに使う印です。変わり方がわかりやすくなりますが、<b>実際よりも変化が大きく見える</b>ので、目もりの数字をよく見て読みます。</p>
<h3>5. かき方</h3>
<ol><li>横じくに時間、たてじくに量をとり、いちばん大きい値が入るように1目もりを決める</li><li>点をうって直線で結ぶ</li><li>表題と単位を書く</li></ol>
<div class="warn"><b>つまずきやすいところ</b><br>・1目もりを「1」と思いこんで読む。<br>・波線のあるグラフで、変化をそのまま大きいと受けとる。</div>
</div>`,
  exp(root) {
    let wave = false; const data = [15, 16, 18, 20, 21, 21, 20, 18], xl = ['9', '10', '11', '12', '13', '14', '15', '16'];
    const draw = () => {
      root.innerHTML = `<div class="chips"><button class="chip${!wave ? ' on' : ''}" data-w="0">0 から全部かく</button><button class="chip${wave ? ' on' : ''}" data-w="1">波線で省く</button></div>
<div class="two"><div class="stage">${chartSVG(data, wave ? { lo: 14, hi: 22, step: 1, lab: 2, xl, wave: true, xunit: '時' } : { lo: 0, hi: 25, step: 1, lab: 5, xl, xunit: '時' })}</div>
<p class="say">ある日の気温（9時〜16時）<br>${wave ? '波線で 0〜13 を省くと、1目もりが大きく見え、上がり方・下がり方がはっきりします。<br><span class="note">でも、変化が実際より大きく見えます。目もりの数字を必ず確かめよう。</span>' : '0 から全部かくと、変わり方は小さく見えます。<br><span class="note">「波線で省く」とくらべてみよう。</span>'}</p></div>`;
    };
    root.addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (!b) return; wave = b.dataset.w === '1'; draw(); });
    draw();
  },
  kinds: [
    { id: 'scale', name: '1目もりの大きさ', gen() { const step = pick([1, 2, 5]), d = tempData(step), lab = step === 5 ? 10 : step * 5; return { q: `ある町の1年間の気温を表した折れ線グラフです。たてじくの1目もりは何度ですか。${chartSVG(d, { lo: 0, hi: 30, step, lab, xl: d.map((_, i) => i + 1) })}`, input: 'num', label: '度', ans: step, ansText: step + '度', wrongs: [1, lab, 10].filter(v => v !== step).map(v => ({ v, tag: 'graphScale' })), defTag: 'graphScale', wide: true, sol: `${lab}度の間が ${lab / step} 目もりに分かれているので、1目もりは ${lab} ÷ ${lab / step} ＝ ${step}度。` }; } },
    { id: 'read', name: '値を読む', gen() { const step = pick([1, 2]), d = tempData(step), m = R(1, 12), ans = d[m - 1], lab = step * 5; return { q: `ある町の1年間の気温のグラフです。${m}月の気温は何度ですか。${chartSVG(d, { lo: 0, hi: 30, step, lab, xl: d.map((_, i) => i + 1) })}`, input: 'num', label: '度', ans, ansText: ans + '度', wrongs: [ans + step, ans - step, ans + 1, ans - 1].filter(v => v !== ans).map(v => ({ v, tag: step > 1 ? 'graphScale' : 'graphRead' })), defTag: 'graphRead', wide: true, sol: `1目もりは ${step}度。${m}月の点を横にたどると ${ans}度。` }; } },
    { id: 'trend', name: '変わり方を読む', gen() {
      const d = tempData(1), up = Math.random() < .5, diffs = d.slice(0, -1).map((v, i) => d[i + 1] - v);
      const best = up ? diffs.indexOf(Math.max(...diffs)) : diffs.indexOf(Math.min(...diffs));
      const others = shuffle(diffs.map((_, i) => i).filter(i => i !== best && diffs[i] !== diffs[best])).slice(0, 3), L = i => `${i + 1}月から${i + 2}月`;
      return ch(`ある町の1年間の気温のグラフです。気温の${up ? '上がり方' : '下がり方'}がいちばん大きいのは、何月から何月の間ですか。${chartSVG(d, { lo: 0, hi: 30, step: 1, lab: 5, xl: d.map((_, i) => i + 1) })}`, L(best), [best, ...others].map(L), 'graphRead', `線のかたむきがいちばん急なところをさがします。${L(best)}は ${Math.abs(diffs[best])}度${up ? '上がって' : '下がって'}います。`, { wide: true });
    } },
    { id: 'wave', name: '波線・グラフの選び方', gen() {
      const pool = [['波線を使って目もりのとちゅうを省くと、グラフの変わり方は実際より…', '大きく見える', ['大きく見える', '小さく見える', '変わらない']], ['1日の気温の変わり方を表すのに合うグラフは？', '折れ線グラフ', ['折れ線グラフ', 'ぼうグラフ']], ['クラスで好きな果物ごとの人数をくらべるのに合うグラフは？', 'ぼうグラフ', ['折れ線グラフ', 'ぼうグラフ']], ['折れ線グラフで、線のかたむきが急なところは…', '変わり方が大きい', ['変わり方が大きい', '変わり方が小さい', '変わっていない']], ['折れ線グラフで、線が横にまっすぐなところは…', '変わっていない', ['ふえている', 'へっている', '変わっていない']]];
      const [q, a, c] = pick(pool); return ch(q, a, c, 'graphWave', TAGS.graphWave.tip + ' 時間とともに変わる様子は折れ線グラフ、量の大小のくらべは ぼうグラフ が合います。');
    } },
  ],
});

/* ---------- 3. 記録 ---------- */
const KEY = 'sansu4-note-v1';
let DB = { name: '', log: [] };
try { const s = localStorage.getItem(KEY); if (s) DB = Object.assign(DB, JSON.parse(s)); } catch (e) { /* 保存できない環境でも動く */ }
const save = () => { try { if (DB.log.length > 3000) DB.log = DB.log.slice(-3000); localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* noop */ } };
const U = id => UNITS.find(u => u.id === id);
const K = (u, k) => U(u)?.kinds.find(x => x.id === k);

function unitStat(uid) { const L = DB.log.filter(e => e.u === uid), r = L.slice(-20); return { n: L.length, acc: r.length ? Math.round(r.filter(e => e.ok).length / r.length * 100) : null }; }
function weakKinds() {
  const m = new Map();
  for (const e of DB.log) { const k = e.u + '|' + e.k; if (!m.has(k)) m.set(k, []); m.get(k).push(e); }
  const out = [];
  for (const [key, L] of m) {
    const r = L.slice(-10), err = r.filter(e => !e.ok).length, last3 = L.slice(-3);
    if (!err || (last3.length === 3 && last3.every(e => e.ok))) continue;
    const [u, k] = key.split('|'); if (!K(u, k)) continue;
    const tags = {}; r.filter(e => !e.ok).forEach(e => tags[e.tag] = (tags[e.tag] || 0) + 1);
    out.push({ u, k, err, n: r.length, tag: Object.entries(tags).sort((a, b) => b[1] - a[1])[0][0] });
  }
  return out.sort((a, b) => b.err - a.err);
}
function tagRank() { const c = {}, where = {}; DB.log.slice(-300).filter(e => !e.ok).forEach(e => { c[e.tag] = (c[e.tag] || 0) + 1; (where[e.tag] ||= new Set()).add(e.u); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ t, n, units: [...where[t]].map(u => U(u)?.title).filter(Boolean) })); }

/* ---------- 答えの判定 ---------- */
function readAns(p, box) {
  const v = n => num($(`[name=${n}]`, box)?.value ?? '');
  if (p.input === 'num') return v('a');
  if (p.input === 'div') { const q = v('q'), rr = $('[name=r]', box).value.trim() === '' ? 0 : v('r'); return { q, r: rr }; }
  if (p.input === 'pair') return [v('x'), v('y')];
  if (p.input === 'frac') { const w = $('[name=w]', box) && $('[name=w]', box).value.trim() !== '' ? v('w') : 0; return { w, n: v('n'), d: v('d') }; }
  return null;
}
function valid(p, u) {
  if (p.input === 'num') return !isNaN(u);
  if (p.input === 'div') return !isNaN(u.q) && !isNaN(u.r);
  if (p.input === 'pair') return u.every(x => !isNaN(x));
  if (p.input === 'frac') return !isNaN(u.w) && !isNaN(u.n) && !isNaN(u.d) && u.d > 0;
  return u != null;
}
function check(p, u) {
  switch (p.input) {
    case 'num': return Math.abs(u - p.ans) < 1e-9;
    case 'choice': return u === p.ans;
    case 'div': return u.q === p.ans.q && u.r === p.ans.r;
    case 'pair': return u[0] === p.ans[0] && u[1] === p.ans[1];
    case 'frac': {
      const uv = (u.w * u.d + u.n) / u.d, av = (p.ans.w * p.ans.d + p.ans.n) / p.ans.d;
      if (Math.abs(uv - av) > 1e-9) return false;
      if (p.form === 'mixed') return u.w > 0 && u.n > 0 && u.n < u.d;
      if (p.form === 'improper') return u.w === 0;
      return true;
    }
  }
  return false;
}
function diagnose(p, u, proc) {
  if (p.diag) { const t = p.diag(u, proc); if (t) return t; }
  for (const w of p.wrongs || []) { if (p.input === 'num' && Math.abs(u - w.v) < 1e-9) return w.tag; if (p.input === 'choice' && u === w.v) return w.tag; }
  if (p.input === 'frac' && p.form && p.form !== 'any') { const uv = (u.w * u.d + u.n) / u.d, av = (p.ans.w * p.ans.d + p.ans.n) / p.ans.d; if (Math.abs(uv - av) < 1e-9) return 'fracConv'; }
  return p.defTag || 'calc';
}
function uText(p, u) {
  if (p.input === 'div') return `${u.q} あまり ${u.r}`;
  if (p.input === 'pair') return `（${u[0]}，${u[1]}）`;
  if (p.input === 'frac') return `${u.w ? u.w + 'と' : ''}${u.n}/${u.d}`;
  return String(u) + (p.label || '');
}
function inputHTML(p) {
  const I = (n, cls = '') => `<input name="${n}" class="in ${cls}" inputmode="decimal" autocomplete="off" aria-label="答え">`;
  if (p.input === 'num') return `<div class="ansrow">${I('a')}<span>${p.label || ''}</span></div>`;
  if (p.input === 'div') return `${p.scratch ? '<div class="scbox"></div>' : ''}<div class="ansrow">商 ${I('q', 's')} あまり ${I('r', 's')}</div>${p.scratch ? '<p class="note">商とあまりのらんが空のまま「こたえる」をおすと、筆算に書いた数から読みとります。</p>' : ''}`;
  if (p.input === 'pair') return `<div class="ansrow">（ ${I('x', 's')} ， ${I('y', 's')} ）</div>`;
  if (p.input === 'frac') return `<div class="ansrow">${p.form !== 'improper' ? `${I('w', 's')}<span class="note">整数</span>` : ''}<span class="fin">${I('n')}<hr>${I('d')}</span><span class="note">分子／分母${p.form === 'mixed' ? '（帯分数で）' : p.form === 'improper' ? '（仮分数で）' : '（整数のらんは空でもよい）'}</span></div>`;
  return `<div class="choices">${p.choices.map(c => `<button class="choice" data-c="${esc(c)}">${c}</button>`).join('')}</div>`;
}

/* ---------- 練習セッション ---------- */
function runSession(box, items, opts = {}) {
  const S = { items: items.slice(), i: 0, res: [], p: null, done: false };
  const next = () => {
    if (S.i >= S.items.length) return finish();
    const it = S.items[S.i], unit = U(it.u), kind = K(it.u, it.k); S.p = kind.gen(); S.done = false;
    box.style.setProperty('--ac', AREAS[unit.area].color);
    box.innerHTML = `<div class="qcard"><div class="qtop"><span>${S.i + 1} / ${S.items.length} 問</span><div class="prog"><i style="width:${S.i / S.items.length * 100}%"></i></div><span class="tag" style="background:${AREAS[unit.area].color}">${unit.title}・${kind.name}</span></div>
<div class="qtext">${S.p.q}</div><div class="ansbox">${inputHTML(S.p)}</div>${S.p.input !== 'choice' ? '<div class="btns"><button class="btn main" data-a="ok">こたえる</button></div>' : ''}<div class="fb" aria-live="polite"></div></div>`;
    S.sc = S.p.scratch ? scratchDiv($('.scbox', box), S.p.scratch.D, S.p.scratch.v) : null;
    const f = $('input', box); if (f && !S.sc && !('ontouchstart' in window)) f.focus();
  };
  const answer = choice => {
    if (S.done) return; const p = S.p, ab = $('.ansbox', box);
    if (S.sc) { const t = S.sc.read(), qi = $('[name=q]', ab), ri = $('[name=r]', ab); if (qi.value.trim() === '' && t.qNum !== null) qi.value = t.qNum; if (ri.value.trim() === '' && qi.value.trim() !== '' && t.last !== null) ri.value = t.last; }
    const u = p.input === 'choice' ? choice : readAns(p, ab);
    if (!valid(p, u)) { const fb = $('.fb', box); fb.innerHTML = '<div class="note">答えを数で入れてね。</div>'; ab.classList.remove('shake'); void ab.offsetWidth; ab.classList.add('shake'); return; }
    S.done = true; const proc = S.sc ? S.sc.read() : null, ok = check(p, u), tag = ok ? null : diagnose(p, u, proc), it = S.items[S.i];
    const pd = proc && proc.any ? divProcDiag(p.scratch.D, p.scratch.v, proc) : null;
    if (S.sc) { S.sc.lock(); if (pd && pd.row !== null && pd.row !== undefined) S.sc.mark(pd.row); }
    S.res.push({ ...it, ok, tag });
    const ent = { t: Date.now(), u: it.u, k: it.k, ok, tag, q: strip(p.q).slice(0, 120), ua: uText(p, u), ca: strip(p.ansText) };
    if (proc && proc.any) ent.proc = { D: p.scratch.D, v: p.scratch.v, q: proc.q, rows: proc.rows };
    DB.log.push(ent); save();
    if (p.input === 'choice') $$('.choice', box).forEach(b => { b.disabled = true; if (b.dataset.c === p.ans) b.classList.add('good'); else if (b.dataset.c === u) b.classList.add('bad'); });
    $$('input', ab).forEach(i => i.disabled = true); $('[data-a=ok]', box)?.remove();
    $('.fb', box).innerHTML = ok ? `<div class="ok">せいかい！</div>${pd ? `<div class="tagbox"><b>答えは合っています。筆算も見なおそう：</b>${pd.msg}</div>` : ''}<div class="sol">${p.sol}</div><div class="btns"><button class="btn main" data-a="next">つぎへ</button></div>`
      : `<div class="ng">ざんねん…　正しい答えは ${p.ansText}</div><div class="tagbox"><b>つまずき：${TAGS[tag].name}</b><br>${pd ? `<b>筆算を見ると：</b>${pd.msg}${pd.row !== null ? '（赤くなった段）' : ''}<br>` : ''}${TAGS[tag].tip}</div><div class="sol">${p.sol}</div><div class="btns"><button class="btn main" data-a="again">にた問題でもう一度</button><button class="btn" data-a="next">つぎへ</button></div>`;
    $('.fb .btn', box)?.focus({ preventScroll: true });
  };
  const finish = () => {
    const n = S.res.length, ok = S.res.filter(r => r.ok).length, tags = {};
    S.res.filter(r => !r.ok).forEach(r => tags[r.tag] = (tags[r.tag] || 0) + 1);
    const wrongKinds = [...new Map(S.res.filter(r => !r.ok).map(r => [r.u + '|' + r.k, { u: r.u, k: r.k }])).values()];
    box.innerHTML = `<div class="qcard result"><div class="score">${ok} / ${n}</div><p class="say">${ok === n ? 'ぜんぶ正かい！すばらしい！' : ok >= n * .7 ? 'よくできました。まちがえた問題をもう一度やってみよう。' : 'まちがえたところが、のびるところ。かいせつを読んでもう一度ちょうせんしよう。'}</p>
${Object.keys(tags).length ? `<div class="tagbox"><b>今回のつまずき</b><ul>${Object.entries(tags).map(([t, c]) => `<li>${TAGS[t].name}（${c}問）：${TAGS[t].tip}</li>`).join('')}</ul></div>` : ''}
<div class="btns">${wrongKinds.length ? '<button class="btn main" data-a="retry">まちがえた種類をもう一度</button>' : ''}<button class="btn" data-a="restart">もう一度</button><a class="btn" href="#home">ホームへ</a></div></div>`;
    S.wrongKinds = wrongKinds;
  };
  box.onclick = e => {
    const c = e.target.closest('.choice'); if (c && !S.done) return answer(c.dataset.c);
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'ok') answer();
    else if (a === 'next') { S.i++; next(); }
    else if (a === 'again') { S.items.splice(S.i + 1, 0, { ...S.items[S.i] }); S.i++; next(); }
    else if (a === 'retry') runSession(box, shuffle(S.wrongKinds.flatMap(w => [w, w, w])).slice(0, 10), opts);
    else if (a === 'restart') opts.restart ? opts.restart() : runSession(box, items, opts);
  };
  box.onkeydown = e => { if (e.key === 'Enter' && e.target.matches('input') && !S.done) { e.preventDefault(); answer(); } };
  next();
}


/* ---------- 筆算を書きこむマス目 ---------- */
function scratchDiv(el, D, v) {
  const s = String(D), n = s.length, nRows = divExpected(D, v).length * 2 + 2;
  let g, sel = null, locked = false, pen = false, bad = null, drawing = false;
  const reset = () => { g = { q: Array(n).fill(''), rows: Array.from({ length: nRows }, () => Array(n).fill('')) }; };
  reset();
  el.innerHTML = `<div class="sc-tools"><button class="chip" data-s="pen" aria-pressed="false">ペンでメモ：オフ</button><button class="chip" data-s="penclr">メモを消す</button><button class="chip" data-s="clr">筆算をぜんぶ消す</button></div>
<div class="sc-wrap"><div class="dt-paper sc-paper"><div class="dt-board sc-board"></div><canvas class="sc-pen" aria-hidden="true"></canvas></div>
<div class="sc-keys">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(k => `<button data-s="k${k}">${k}</button>`).join('')}<button data-s="left" aria-label="左のマスへ">←</button><button data-s="k0">0</button><button data-s="right" aria-label="右のマスへ">→</button><button data-s="del" class="wide">けす</button></div></div>
<p class="note">マスをタップして、キーで数字を書こう。商は上の段、かけ算・ひき算の答えはその下の段に書きます。くり上がりのメモは「ペンでメモ」で自由に書けます。</p>`;
  const board = $('.sc-board', el), cv = $('.sc-pen', el), paper = $('.sc-paper', el), ctx = cv.getContext && cv.getContext('2d');
  const arr = k => k === 'q' ? g.q : g.rows[k];
  const isSel = (k, c) => sel && sel[0] === k && sel[1] === c;
  const draw = () => {
    let h = '<div></div>';
    for (let c = 0; c < n; c++) h += `<button class="dc dq scell${isSel('q', c) ? ' ssel' : ''}" data-cell="q,${c}" aria-label="商の${c + 1}けため">${g.q[c]}</button>`;
    h += `<div class="dv">${v}</div>`;
    for (let c = 0; c < n; c++) h += `<div class="dc dd">${s[c]}</div>`;
    g.rows.forEach((row, r) => { h += '<div></div>'; row.forEach((x, c) => { h += `<button class="dc scell${r % 2 ? ' dl' : ''}${bad === r ? ' sbad' : ''}${isSel(r, c) ? ' ssel' : ''}" data-cell="${r},${c}" aria-label="${r + 1}段め ${c + 1}れつめ">${x}</button>`; }); });
    board.style.gridTemplateColumns = `calc(var(--c)*2) repeat(${n},var(--c))`; board.innerHTML = h;
  };
  const put = d => { if (!sel || locked) return; const [k, c] = sel; arr(k)[c] = d; if (k === 'q') { if (c < n - 1) sel = [k, c + 1]; } else if (c > 0) sel = [k, c - 1]; draw(); };
  const move = dx => { if (!sel || locked) return; const c = Math.min(n - 1, Math.max(0, sel[1] + dx)); sel = [sel[0], c]; draw(); };
  const fit = () => { if (!ctx) return; const dpr = window.devicePixelRatio || 1, w = paper.clientWidth, h = paper.clientHeight; if (!w || cv.width === Math.round(w * dpr) && cv.height === Math.round(h * dpr)) return; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#d4313a'; };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cell) { if (locked) return; const [k, c] = b.dataset.cell.split(','); sel = [k === 'q' ? 'q' : +k, +c]; return draw(); }
    const a = b.dataset.s; if (!a) return;
    if (a[0] === 'k') put(a.slice(1));
    else if (a === 'del') { if (sel && !locked) { arr(sel[0])[sel[1]] = ''; draw(); } }
    else if (a === 'left') move(-1); else if (a === 'right') move(1);
    else if (a === 'pen') { pen = !pen; b.textContent = `ペンでメモ：${pen ? 'オン' : 'オフ'}`; b.classList.toggle('on', pen); b.setAttribute('aria-pressed', pen); cv.classList.toggle('on', pen); fit(); }
    else if (a === 'penclr') { if (ctx) ctx.clearRect(0, 0, cv.width, cv.height); }
    else if (a === 'clr' && !locked) { reset(); sel = null; draw(); }
  });
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => { if (!pen || !ctx) return; drawing = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* noop */ } const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); });
  cv.addEventListener('pointermove', e => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); });
  const end = () => { drawing = false; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const onKey = e => {
    if (!el.isConnected) return window.removeEventListener('keydown', onKey);
    if (!sel || locked || e.target.matches('input,select,textarea')) return;
    if (/^[0-9]$/.test(e.key)) put(e.key); else if (e.key === 'Backspace' || e.key === 'Delete') { arr(sel[0])[sel[1]] = ''; draw(); } else if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { const k = sel[0], d = e.key === 'ArrowUp' ? -1 : 1; let nk = k === 'q' ? (d > 0 ? 0 : 'q') : k + d; if (nk === -1) nk = 'q'; if (nk === 'q' || (nk >= 0 && nk < nRows)) { sel = [nk, sel[1]]; draw(); } }
    else return; e.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  draw(); setTimeout(fit, 0);
  return {
    read() {
      const q = g.q.map(x => x || ' ').join(''), rows = g.rows.map(r => r.map(x => x || ' ').join(''));
      const qd = q.replace(/\s/g, ''), filled = rows.filter(r => r.trim());
      return { q, rows, any: !!(qd || filled.length), qNum: qd ? Number(qd) : null, last: filled.length ? Number(filled.at(-1).replace(/\s/g, '')) : null };
    },
    lock() { locked = true; sel = null; draw(); },
    mark(r) { bad = r; draw(); },
  };
}

/* ---------- わり算の筆算ツール ---------- */
function divTool(root) {
  const PL = ['一', '十', '百']; let st;
  root.innerHTML = `<div class="dt-start">わられる数 <input class="in s" id="dtD" value="221" inputmode="numeric"> ÷ わる数 <input class="in s" id="dtV" value="32" inputmode="numeric"><button class="btn main" id="dtGo">スタート</button><button class="btn" id="dtR">べつの問題</button></div>
<div class="dt"><div class="dt-paper"><div class="dt-board"></div></div><div class="dt-panel"></div></div>`;
  const board = $('.dt-board', root), panel = $('.dt-panel', root);
  const lastDiff = () => { for (let j = st.rows.length - 1; j >= 0; j--) if (st.rows[j].kind === 'diff' && !st.rows[j].bad) return j; return -1; };
  const start = (D, v) => { st = { D, v, s: String(D), n: String(D).length, rows: [], qd: {}, p: Math.min(2, String(D).length), ph: 'place', msg: '', mt: '', fix: 0 }; draw(); };
  const go = ph => { st.ph = ph; };
  const msg = (t, k = '') => { st.msg = t; st.mt = k; };
  const draw = () => {
    const { n, ph } = st, ld = lastDiff(); let h = '<div></div>';
    for (let c = 0; c < n; c++) h += `<div class="dc dq${c === st.i && ph === 'tateru' ? ' dbox' : ''}">${st.qd[c] ?? ''}</div>`;
    h += `<div class="dv">${st.v}</div>`;
    for (let c = 0; c < n; c++) { let cl = 'dc dd'; if (ph === 'place') cl += c >= st.p ? ' dcov' : ' dh'; if (ph === 'tateru' && ld < 0 && c <= st.i) cl += ' dh'; h += `<div class="${cl}">${st.s[c]}</div>`; }
    st.rows.forEach((r, ri) => { const b = r.end - r.val.length + 1; h += '<div></div>'; for (let c = 0; c < n; c++) { let cl = 'dc'; if (r.kind === 'diff' && c >= r.from && c <= r.to) cl += ' dl'; if (r.bad) cl += ' dbad'; const ch = c >= b && c <= r.end ? r.val[c - b] : ''; if (ph === 'tateru' && ri === ld && ch !== '') cl += ' dh'; h += `<div class="${cl}">${ch}</div>`; } });
    board.style.gridTemplateColumns = `calc(var(--c)*2) repeat(${n},var(--c))`; board.innerHTML = h;
    let p = '';
    const key = `<div class="ansrow"><input class="in" id="dtIn" inputmode="numeric" autocomplete="off"><button class="btn main" data-d="ok">OK</button></div>`;
    if (ph === 'place') { const x = st.s.slice(0, st.p); p = `<p class="say">下の位を指でかくして、上の${st.p}けた <span class="big">${x}</span> と わる数 <span class="big">${st.v}</span> をくらべよう。${x} の中に ${st.v} は入るかな？</p><div class="btns"><button class="btn main" data-d="fit">入る</button><button class="btn" data-d="no">入らない</button></div>`; }
    else if (ph === 'tateru') { const t = Math.floor(st.v / 10); p = `<p class="say"><span class="tag">たてる</span> ${st.cur} ÷ ${st.v} の商を ${PL[n - 1 - st.i]}の位にたてよう</p>${key}<p class="note">ヒント：${st.cur < st.v ? `${st.cur} は ${st.v} より小さいので 0` : `${st.v} を ${t}0 とみて ${Math.floor(st.cur / 10)} ÷ ${t} → およそ ${estQ(st.cur, st.v)}`}</p>`; }
    else if (ph === 'kakeru') p = `<p class="say"><span class="tag">かける</span> ${st.v} × ${st.q} ＝ ？</p>${key}<p class="note">くり上がりはメモしよう</p>`;
    else if (ph === 'hiku') p = `<p class="say"><span class="tag">ひく</span> ${st.cur} − ${st.prod} ＝ ？</p>${key}`;
    else if (ph === 'orosu') p = `<p class="say"><span class="tag">おろす</span> つぎの数字 ${st.s[st.i + 1]} をおろそう</p><button class="btn main" data-d="orosu">${st.s[st.i + 1]} をおろす ↓</button>`;
    else p = `<p class="say">${st.D} ÷ ${st.v} ＝ <span class="big">${st.Q}</span>${st.R ? ` あまり <span class="big">${st.R}</span>` : ''}</p><div class="box">あまり ${st.R} ＜ わる数 ${st.v}　OK<br>たしかめ：${st.v} × ${st.Q} ＋ ${st.R} ＝ ${st.v * st.Q + st.R}<br>${st.fix ? `商を ${st.fix} 回なおして正しい商にたどりついたね。` : 'なおしなしで正しい商がたてられたね。'}</div>`;
    panel.innerHTML = p + `<div class="dt-msg ${st.mt}">${st.msg}</div>`;
  };
  const finish = r => { st.R = r; let q = ''; for (let c = st.i0; c < st.n; c++) q += st.qd[c]; st.Q = Number(q); go('done'); msg(''); };
  const submit = () => {
    const el = $('#dtIn', root); const x = num(el?.value); if (isNaN(x)) return;
    if (st.ph === 'tateru') {
      if (x > 9 || x < 0 || !Number.isInteger(x)) { msg('商は 0 から 9 までの数だよ。'); return draw(); }
      st.rows = st.rows.filter(r => !r.bad); st.q = x; st.qd[st.i] = x;
      if (x === 0 && st.cur < st.v) { st.zero = true; if (st.i < st.n - 1) { go('orosu'); msg('0 をたてたら、かける・ひくはしないで、つぎの数字をおろそう。'); } else finish(st.cur); return draw(); }
      st.zero = false; st.prod = x * st.v; go('kakeru'); msg('');
    } else if (st.ph === 'kakeru') {
      if (x !== st.prod) { msg('おしい！もういちど計算してみよう。'); return draw(); }
      st.rows.push({ kind: 'prod', val: String(st.prod), end: st.i });
      if (st.prod > st.cur) { st.rows.at(-1).bad = true; st.fix++; delete st.qd[st.i]; go('tateru'); msg(`${st.prod} は ${st.cur} より大きいから ひけない！ 商を1小さくしよう。`, 'fix'); } else { go('hiku'); msg(''); }
    } else if (st.ph === 'hiku') {
      const d = st.cur - st.prod; if (x !== d) { msg('おしい！もういちど計算してみよう。'); return draw(); }
      st.rows.push({ kind: 'diff', val: String(d), end: st.i, from: st.i - Math.max(String(st.cur).length, String(st.prod).length) + 1, to: st.i });
      if (d >= st.v) { st.rows.slice(-2).forEach(r => r.bad = true); st.fix++; delete st.qd[st.i]; go('tateru'); msg(`あまり ${d} が わる数 ${st.v} 以上！ 商を1大きくしよう。`, 'fix'); }
      else { st.diff = d; if (st.i < st.n - 1) { go('orosu'); msg(''); } else finish(d); }
    }
    draw(); $('#dtIn', root)?.focus();
  };
  root.addEventListener('click', e => {
    const d = e.target.closest('[data-d]')?.dataset.d;
    if (e.target.id === 'dtGo') { const D = num($('#dtD', root).value), v = num($('#dtV', root).value); if (Number.isInteger(D) && Number.isInteger(v) && v >= 10 && v <= 99 && D >= v && D <= 9999) start(D, v); else { panel.innerHTML = '<p class="dt-msg">わる数は2けた、わられる数はわる数以上・4けたまでにしてね。</p>'; } return; }
    if (e.target.id === 'dtR') { const g = genDiv(pick([2, 3, 4, 4, 5])); $('#dtD', root).value = g.D; $('#dtV', root).value = g.v; start(g.D, g.v); return; }
    if (!d) return;
    if (d === 'fit' || d === 'no') { const x = Number(st.s.slice(0, st.p)), ok = (x >= st.v) === (d === 'fit'); if (!ok) msg(`もういちど くらべてみよう。${x} と ${st.v}、どちらが大きい？`); else if (d === 'fit') { st.i = st.p - 1; st.i0 = st.i; st.cur = x; go('tateru'); msg(`商は ${PL[st.n - 1 - st.i]}の位から たつよ。`); } else { msg(`${x} に ${st.v} は入らないね。もう1けた見よう。`); st.p++; } draw(); }
    else if (d === 'ok') submit();
    else if (d === 'orosu') { const nc = (st.zero ? st.cur : st.diff) * 10 + Number(st.s[st.i + 1]), li = lastDiff(); if (li >= 0) { st.rows[li].val = String(nc); st.rows[li].end = st.i + 1; } st.i++; st.cur = nc; st.zero = false; go('tateru'); msg(''); draw(); }
  });
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'dtIn') { e.preventDefault(); submit(); } });
  start(221, 32);
}

/* ---------- 画面 ---------- */
const app = $('#app');
function setNav(n) { $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === n)); }

function home() {
  setNav('home');
  const total = DB.log.length, ok = DB.log.filter(e => e.ok).length, weak = weakKinds();
  app.innerHTML = `<section class="hero"><div><h1>4年の算数 たいけんノート</h1><p class="lead">単元ごとに「かいせつ」を読み、「たいけん」で動かして確かめ、「れんしゅう」でくり返しちょうせんしよう。まちがえた問題は、どこでつまずいたかを教えてくれます。</p>
<div class="stats"><span class="stat"><b>${total}</b>問 といた</span><span class="stat"><b>${total ? Math.round(ok / total * 100) : 0}</b>% 正かい</span><span class="stat"><b>${weak.length}</b>こ にがてな問題の種類</span></div>
<div class="btns"><a class="btn main" style="--ac:var(--ng)" href="#review">にがてチャレンジ</a><a class="btn" href="#parent">保護者のページ</a></div></div>
<div class="hero-pic">${angleSVG(135, { prot: true, label: '135°' })}</div></section>
${Object.entries(AREAS).map(([a, A]) => `<section class="area" style="--ac:${A.color}"><h2>${A.name}</h2><div class="ugrid">${UNITS.filter(u => u.area === a).map(u => { const s = unitStat(u.id); return `<a class="ucard" href="#u-${u.id}"><b>${u.title}</b><span>${u.short}</span><div class="meter" aria-hidden="true"><i style="width:${s.acc ?? 0}%"></i></div><small>${s.n ? `${s.n}問・最近の正かい ${s.acc}%` : 'まだといていません'}</small></a>`; }).join('')}</div></section>`).join('')}`;
}

function unitPage(u, tab = 'ex') {
  setNav('');
  app.innerHTML = `<div style="--ac:${AREAS[u.area].color}"><div class="uhead"><a href="#home" class="back">← ホーム</a><br><span class="atag">${AREAS[u.area].name}</span><h1>${u.title}</h1><p class="lead">${u.short}</p></div>
<div class="tabs" role="tablist"><button data-tab="ex" role="tab">かいせつ</button><button data-tab="tk" role="tab">たいけん</button><button data-tab="pr" role="tab">れんしゅう</button></div>
<section data-pane="ex">${u.explain}<div class="btns"><button class="btn main" data-go="tk">たいけんしてみる →</button></div></section>
<section data-pane="tk" hidden><div class="exp"></div><div class="btns"><button class="btn main" data-go="pr">れんしゅうする →</button></div></section>
<section data-pane="pr" hidden><div class="setup card"><h2>れんしゅうの問題をえらぶ</h2><div class="chips" id="kc">${u.kinds.map(k => `<button class="chip on" data-k="${k.id}">${k.name}</button>`).join('')}</div>
<div class="chips"><span class="note" style="align-self:center">問題数</span>${[5, 10, 15].map(n => `<button class="chip${n === 10 ? ' on' : ''}" data-n="${n}">${n}問</button>`).join('')}</div><div><button class="btn main" id="startP">スタート</button></div></div><div id="sess" style="margin-top:16px"></div></section></div>`;
  u.exp($('.exp', app));
  const show = t => { $$('[data-tab]', app).forEach(b => b.classList.toggle('on', b.dataset.tab === t)); $$('[data-pane]', app).forEach(p => p.hidden = p.dataset.pane !== t); };
  let cnt = 10;
  app.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) show(b.dataset.tab);
    else if (b.dataset.go) { show(b.dataset.go); window.scrollTo(0, 0); }
    else if (b.dataset.k) { b.classList.toggle('on'); if (!$$('#kc .chip.on', app).length) b.classList.add('on'); }
    else if (b.dataset.n) { cnt = +b.dataset.n; $$('[data-n]', app).forEach(x => x.classList.toggle('on', x === b)); }
    else if (b.id === 'startP') {
      const ks = $$('#kc .chip.on', app).map(x => x.dataset.k), items = [];
      for (let i = 0; i < cnt; i++) items.push({ u: u.id, k: ks[i % ks.length] });
      const sess = $('#sess', app); runSession(sess, shuffle(items), { restart: () => $('#startP', app).click() }); sess.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  show(tab);
}

function review() {
  setNav('review');
  const w = weakKinds();
  app.innerHTML = `<h1>にがてチャレンジ</h1><p class="lead">最近まちがえた問題の種類から出題します。3回続けて正かいすると、にがてリストから外れます。</p><div id="rv" style="margin-top:18px"></div>`;
  const box = $('#rv', app);
  if (!w.length) { box.innerHTML = `<div class="card"><p class="say">いまは にがてな問題の種類はありません。単元の「れんしゅう」にちょうせんしよう！</p><a class="btn main" href="#home">ホームへ</a></div>`; return; }
  box.innerHTML = `<div class="card"><h2>にがてな問題の種類</h2><ul>${w.slice(0, 8).map(x => `<li>${U(x.u).title}・${K(x.u, x.k).name}（最近${x.n}問中${x.err}問まちがい／${TAGS[x.tag].name}）</li>`).join('')}</ul><button class="btn main" id="rgo">10問ちょうせん</button></div>`;
  $('#rgo', box).onclick = () => { const top = w.slice(0, 5), items = []; for (let i = 0; i < 10; i++) items.push(top[i % top.length]); runSession(box, shuffle(items).map(x => ({ u: x.u, k: x.k })), { restart: review }); };
}

/* ---------- 4. 保護者のページ・プリント ---------- */
function miniDiv(pr) {
  const n = String(pr.D).length; let rows = pr.rows.slice(); while (rows.length && !rows.at(-1).trim()) rows.pop();
  const cells = (str, cls = '') => str.padEnd(n).split('').map(c => `<td class="${cls}">${c.trim() ? esc(c) : ''}</td>`).join('');
  return `<table class="mini" aria-label="お子さんが書いた筆算"><tr><td></td>${cells(pr.q)}</tr><tr><td class="dvm">${pr.v}</td>${cells(String(pr.D), 'dd')}</tr>${rows.map((r, i) => `<tr><td></td>${cells(r, i % 2 ? 'dl' : '')}</tr>`).join('')}</table>`;
}
const fmtDate = t => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

function parent() {
  setNav('parent');
  const L = DB.log, total = L.length, ok = L.filter(e => e.ok).length, ranks = tagRank(), weak = weakKinds(), wrong = L.filter(e => !e.ok).slice(-20).reverse();
  const days = new Set(L.map(e => new Date(e.t).toDateString())).size;
  app.innerHTML = `<h1>保護者のページ</h1><p class="lead">お子さんの学習記録と、つまずきの傾向を確認できます。つまずきに合わせたプリントや、単元をえらんだ課題プリントを作って印刷できます。</p>
<div class="stats"><span class="stat"><b>${total}</b>問</span><span class="stat"><b>${total ? Math.round(ok / total * 100) : 0}</b>% 正答</span><span class="stat"><b>${days}</b>日 学習</span><span class="stat">最終学習 ${total ? fmtDate(L.at(-1).t) : '—'}</span></div>
<div class="pgrid" style="margin-top:18px">
<section class="card"><h2>単元ごとの正答率（最近20問）</h2>${UNITS.map(u => { const s = unitStat(u.id); return `<div class="urow" style="--ac:${AREAS[u.area].color}"><span>${u.title.replace(/（.*）/, '')}</span><div class="meter"><i style="width:${s.acc ?? 0}%"></i></div><em>${s.n ? `${s.acc}%・${s.n}問` : '—'}</em></div>`; }).join('')}</section>
<section class="card"><h2>つまずきの傾向</h2>${ranks.length ? ranks.slice(0, 8).map(r => `<div class="trow"><b>${TAGS[r.t].name}</b>　${r.n}回<br><small>${r.units.join('・')}</small><br>${TAGS[r.t].tip}</div>`).join('') : '<p class="note">まだまちがいの記録はありません。</p>'}
${weak.length ? `<h3>今、復習が必要な問題の種類</h3><ul>${weak.slice(0, 6).map(x => `<li>${U(x.u).title}・${K(x.u, x.k).name}（最近${x.n}問中${x.err}問）</li>`).join('')}</ul>` : ''}</section>
<section class="card full"><h2>最近まちがえた問題</h2>${wrong.length ? `<div style="overflow-x:auto"><table class="mtable"><thead><tr><th>日時</th><th>単元</th><th>問題</th><th>お子さんの答え</th><th>正しい答え</th><th>つまずき</th></tr></thead><tbody>${wrong.map(e => `<tr><td class="c">${fmtDate(e.t)}</td><td>${esc(U(e.u)?.title || '')}</td><td>${esc(e.q)}${e.proc ? miniDiv(e.proc) : ''}</td><td class="c">${esc(e.ua)}</td><td class="c">${esc(e.ca)}</td><td>${esc(TAGS[e.tag]?.name || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">まだまちがいの記録はありません。</p>'}</section>
<section class="card full" id="maker"><h2>プリントをつくる</h2>
<div class="radio"><label><input type="radio" name="pm" value="weak" ${weak.length ? 'checked' : ''}> つまずきに合わせたプリント</label><label><input type="radio" name="pm" value="unit" ${weak.length ? '' : 'checked'}> 単元をえらんで課題プリント</label></div>
<div id="upick" class="checks" style="margin:8px 0 12px"></div>
<div class="two" style="gap:12px"><label class="field">タイトル<input id="ptitle" value=""></label><label class="field">名前<input id="pname" value="${esc(DB.name)}" placeholder="なまえ"></label></div>
<div class="radio" style="margin-top:8px"><label>問題数 <select id="pcount" class="field"><option>6</option><option selected>10</option><option>16</option><option>20</option></select></label><label><input type="checkbox" id="pans" checked> 答えのページをつける</label></div>
<div class="btns"><button class="btn main" id="pmake" style="--ac:var(--shape)">プリントを作る</button><button class="btn dark" id="pprint" disabled>印刷する</button></div>
<p class="note">問題は毎回ちがう数で作られます。気に入らなければ「プリントを作る」をもう一度おしてください。印刷画面で「PDFに保存」を選ぶと、PDFにもできます。</p>
<div class="preview" id="pview"><p class="note">ここにプリントの見本が出ます。</p></div></section>
<section class="card full"><h2>記録の管理</h2><p class="note">記録はこの端末のブラウザに保存されています。別の端末とは共有されません。</p><div class="btns"><button class="btn danger" id="reset">記録をすべて消す</button></div></section>
</div>`;
  const upick = $('#upick', app);
  const drawPick = () => {
    const m = $('[name=pm]:checked', app).value;
    upick.innerHTML = m === 'unit' ? UNITS.map(u => `<label><input type="checkbox" value="${u.id}"> ${u.title}</label>`).join('')
      : (weak.length ? `<p class="note" style="grid-column:1/-1">最近まちがえた種類（${weak.slice(0, 6).map(x => K(x.u, x.k).name).join('、')}）を中心に出題します。</p>` : `<p class="note" style="grid-column:1/-1">まだまちがいの記録がないため、つまずきプリントは作れません。単元をえらんでください。</p>`);
    $('#ptitle', app).value = m === 'unit' ? '算数 課題プリント' : 'にがて克服プリント';
  };
  drawPick();
  $$('[name=pm]', app).forEach(r => r.onchange = drawPick);
  $('#pname', app).onchange = e => { DB.name = e.target.value; save(); };
  let sheet = '';
  $('#pmake', app).onclick = () => {
    const m = $('[name=pm]:checked', app).value, n = +$('#pcount', app).value; let items = [], aim = '';
    if (m === 'weak') {
      if (!weak.length) { $('#pview', app).innerHTML = '<p class="note">つまずきの記録がまだありません。</p>'; return; }
      const top = weak.slice(0, 5), tot = top.reduce((a, x) => a + x.err, 0);
      top.forEach(x => { const c = Math.max(1, Math.round(n * x.err / tot)); for (let i = 0; i < c; i++) items.push({ u: x.u, k: x.k }); });
      while (items.length < n) items.push(top[items.length % top.length]); items = items.slice(0, n);
      const tags = [...new Set(top.map(x => x.tag))];
      aim = `<div class="sh-aim"><b>このプリントのねらい</b><br>${tags.map(t => `・${TAGS[t].name}：${TAGS[t].tip}`).join('<br>')}</div>`;
    } else {
      const us = $$('#upick input:checked', app).map(i => i.value);
      if (!us.length) { $('#pview', app).innerHTML = '<p class="note">単元を1つ以上えらんでください。</p>'; return; }
      const pool = us.flatMap(u => U(u).kinds.map(k => ({ u, k: k.id })));
      for (let i = 0; i < n; i++) items.push(pool[i % pool.length]);
    }
    items = m === 'weak' ? shuffle(items) : items;
    const probs = items.map(it => ({ it, p: K(it.u, it.k).gen() }));
    sheet = buildSheet($('#ptitle', app).value || '算数プリント', $('#pname', app).value, aim, probs, $('#pans', app).checked);
    $('#pview', app).innerHTML = sheet; $('#pprint', app).disabled = false;
  };
  $('#pprint', app).onclick = () => { $('#print-area').innerHTML = sheet; window.print(); };
  const rs = $('#reset', app); let armed = false;
  rs.onclick = () => { if (!armed) { armed = true; rs.textContent = 'もう一度おすと消えます（元にもどせません）'; setTimeout(() => { armed = false; rs.textContent = '記録をすべて消す'; }, 5000); return; } DB.log = []; save(); parent(); };
}

function blank(p) {
  if (p.input === 'div') return `<div class="space"></div><div class="pa">答え　商（　　　）あまり（　　　）</div>`;
  if (p.input === 'pair') return `<div class="pa">答え（　　　，　　　）</div>`;
  if (p.input === 'frac') return `<div class="pa">答え ${p.form === 'mixed' ? '（帯分数）' : p.form === 'improper' ? '（仮分数）' : ''}</div><div style="height:50px"></div>`;
  if (p.input === 'choice') return `<div class="pa">${p.choices.map((c, i) => `${'アイウエオカ'[i]}　${c}`).join('　／　')}</div><div class="pa">答え（　　　）</div>`;
  return `<div class="pa">答え（　　　　　　）${p.label || ''}</div>`;
}
function buildSheet(title, name, aim, probs, withAns) {
  const d = new Date(), ds = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  const head = `<div class="sh-head"><div class="sh-title">${esc(title)}</div><div class="sh-meta">${ds}　名前 ${name ? esc(name) : '＿＿＿＿＿＿'}　　　／${probs.length}</div></div>`;
  const list = `<div class="sh-list">${probs.map(({ it, p }, i) => `<div class="pq${p.wide || /<svg/.test(p.q) ? ' wide' : ''}"><span class="pn">(${i + 1})</span>${p.q}${blank(p)}</div>`).join('')}</div>`;
  const ans = withAns ? `<div class="ans-page"><div class="sh-head"><div class="sh-title">${esc(title)}　答え</div><div class="sh-meta">${ds}</div></div><div class="ans-list">${probs.map(({ it, p }, i) => `<div>(${i + 1}) ${p.input === 'choice' ? `${'アイウエオカ'[p.choices.indexOf(p.ans)]}　` : ''}${p.ansText}<br><small>${U(it.u).title}・${K(it.u, it.k).name}</small></div>`).join('')}</div></div>` : '';
  return `<div class="sheet">${head}${aim}${list}${ans}</div>`;
}

/* ---------- ルーター ---------- */
function route() {
  const h = location.hash.slice(1) || 'home';
  if (h === 'parent') parent();
  else if (h === 'review') review();
  else if (h.startsWith('u-') && U(h.slice(2))) unitPage(U(h.slice(2)));
  else home();
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
route();

/* テスト用（ブラウザでは使いません） */
window.__S4 = { UNITS, TAGS, check, diagnose, valid, DB };
})();
