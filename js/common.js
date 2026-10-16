// 내 방식 QR — 공통: 접근성 프로필(기능 코드, 이 기기에만 저장) · 메뉴/변환 결과 불러오기 · 사전 치환 · 읽어 주기 · 같은 기기 연동
// 프로필에는 장애명·건강 정보를 담지 않는다. 기능 코드만: BIG 큰 글씨 · HC 고대비 · EASY 쉬운 말 · VOICE 읽어 주기(느리게) · TOUCH 큰 버튼 · ONE 한 화면 한 선택
export const CODES = {
  BIG: { label: "큰 글씨", hint: "글씨를 크게 봅니다" },
  HC: { label: "또렷한 색(고대비)", hint: "검은 바탕에 밝은 글씨" },
  EASY: { label: "쉬운 말", hint: "어려운 외래어·약어를 쉬운 말로 봅니다" },
  VOICE: { label: "읽어 주기(천천히)", hint: "화면 글을 천천히 읽어 줍니다" },
  TOUCH: { label: "큰 버튼", hint: "누르는 곳을 크게 합니다" },
  ONE: { label: "한 화면에 한 가지씩", hint: "고를 것을 하나씩 차례로 묻습니다" },
};
const KEY = "mywayqr.profile.v1";

export function loadProfile() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v && Array.isArray(v.codes)) return v;
  } catch (e) { /* 저장소를 못 쓰는 환경(사생활 보호 모드 등) */ }
  return null;
}
export function saveProfile(codes) {
  const v = { codes: codes.filter((c) => c in CODES), saved: new Date().toISOString().slice(0, 10) };
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 저장 못 해도 이번 화면에는 적용 */ }
  return v;
}
export function clearProfile() { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }

// URL로 넘어온 프로필(한 기기 시연용, 예: ?p=BIG.EASY) — 저장소보다 우선
export function profileFromUrl() {
  const p = new URLSearchParams(location.search).get("p");
  if (!p) return null;
  return { codes: p.split(".").filter((c) => c in CODES), saved: "url" };
}

export function applyProfile(profile) {
  const codes = new Set(profile ? profile.codes : []);
  document.body.classList.toggle("p-big", codes.has("BIG"));
  document.body.classList.toggle("p-hc", codes.has("HC"));
  document.body.classList.toggle("p-touch", codes.has("TOUCH"));
  document.body.classList.toggle("p-one", codes.has("ONE"));
  return codes;
}

export async function loadJSON(path) {
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

export async function loadStore() {
  const [menu, easy, gloss] = await Promise.all([
    loadJSON("assets/menu-hanmogeum.json"),
    loadJSON("assets/easy-hanmogeum.json"),
    loadJSON("assets/glossary.json"),
  ]);
  const easyById = Object.fromEntries(easy.rows.map((r) => [r.id, r]));
  return { menu, easy, easyById, glossary: gloss.terms };
}

// 사전 치환(검수된 짧은 말만) — 원문 유지 항목의 옵션 이름 등에 쓴다. 긴 말부터 바꾼다(바닐라빈 시럽 > 시럽)
export function substitute(text, glossary) {
  let out = text;
  for (const k of Object.keys(glossary).sort((a, b) => b.length - a.length)) {
    out = out.split(k).join(glossary[k]);
  }
  return out;
}

// 화면에 보일 메뉴 한 개: 이름·가격·알레르기는 항상 원본 값. 설명·옵션 이름만 프로필(EASY)에 따라 바뀜
export function viewItem(it, store, easyOn) {
  const e = store.easyById[it.id];
  const allergy = (it.desc.match(/알레르기:\s*([^.]+)/) || [])[1] || null;
  let desc = it.desc, options = it.options.slice(), source = "원문";
  if (easyOn) {
    if (e && e.used === "AI" && e.easy_desc) {
      desc = e.easy_desc;
      options = (e.easy_options && e.easy_options.length === it.options.length) ? e.easy_options.slice() : it.options.map((o) => substitute(o, store.glossary));
      source = "AI 쉬운 말";
    } else {
      desc = substitute(it.desc.replace(/알레르기:[^.]*\.?/, "").trim(), store.glossary);
      options = it.options.map((o) => substitute(o, store.glossary));
      source = "사전 치환(원문 유지)";
    }
  }
  // 옵션의 추가 금액은 원본에서 다시 읽는다(모델이 숫자를 쓰지 못하게 했으므로)
  const extra = it.options.map((o) => { const m = o.match(/\+([\d,]+)원/); return m ? Number(m[1].replace(/,/g, "")) : 0; });
  return { id: it.id, name: it.name, category: it.category, price: it.price, desc, options, rawOptions: it.options, extra, allergy, source };
}

export const won = (n) => n.toLocaleString("ko-KR") + "원";

// 읽어 주기(브라우저 내장 음성). 한국어 음성이 없는 기기도 있어 실패해도 화면은 그대로
export function speak(text, slow = true) {
  try {
    if (!("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR"; u.rate = slow ? 0.75 : 1.0;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}

// 같은 기기(같은 주소)의 다른 화면과 주문 알림 주고받기 — 한 기기 시연용. 두 기기 사이는 서버가 있어야 해서 시제품은 하지 않음
export function channel() {
  try { return new BroadcastChannel("mywayqr"); } catch (e) { return { postMessage() {}, addEventListener() {} }; }
}

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
}
