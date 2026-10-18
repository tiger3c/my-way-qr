// v0.6 — AI 화면 구성안(사전질의 답변서2 2번: "최초 적용 시에는 반드시 AI로 각 조건별 화면을 만들어 … 초기 시제품에서도 화면 변환은 AI가")
// 매장 메뉴판을 처음 등록할 때, 기능 코드 조합(6개 → 64가지)마다 AI가 '화면 구성안'(목록에 보일 정보·처음 보일 메뉴 수·설명 접기·옵션 묻는 방식·
// 글씨·단추 크기·읽어 줄 것·첫 화면 안내 한 줄)을 만든다 → 코드가 검증·보정 → 조합별로 저장(케이스별 저장) → 손님 화면은 저장본을 바로 쓴다.
// 구성안이 바꿀 수 없는 것(코드가 항상 지킴): 메뉴 이름·가격 표시, 담기 전·결제 전 알레르기 표시, 「직원 부르기」, 매장 원본 값.
// 같은 파일을 앱(운영자 화면·손님 화면)과 일괄 생성 스크립트(node validate_plans.mjs, Python gen_plans.py가 읽는 prompt_plan.json)가 함께 쓴다.

export const CODE_ORDER = ["BIG", "HC", "EASY", "VOICE", "TOUCH", "ONE"];
export const CODE_KO = {
  BIG: "큰 글씨", HC: "또렷한 색(고대비)", EASY: "쉬운 말", VOICE: "읽어 주기(천천히)", TOUCH: "큰 버튼", ONE: "한 화면에 한 가지씩",
};
export const comboKey = (codes) => CODE_ORDER.filter((c) => (codes instanceof Set ? codes.has(c) : codes.includes(c))).join(".") || "기본";
export function allCombos() {
  const out = [];
  for (let m = 0; m < 64; m++) out.push(CODE_ORDER.filter((_, i) => m & (1 << i)));
  return out;
}

export const LIST_SHOW = ["이름·가격", "이름·가격·짧은 설명", "이름·가격·설명"];
export const PER_PAGE = [3, 4, 5, 6, 8, 10, 12];
export const DETAIL = ["펼침", "접기"];
export const OPTIONS = ["한 화면에 모두", "하나씩"];
export const TEXT_PCT = [100, 110, 120, 130, 140, 150, 160];
export const BUTTON_PCT = [100, 120, 140, 160, 180];
export const READ = ["제목", "이름", "가격", "설명", "알레르기", "옵션"];

// 모델 출력 형식(llama.cpp·WebLLM 문법 제약에 그대로 씀)
export const PLAN_SCHEMA = {
  type: "object",
  properties: {
    list_show: { type: "string", enum: LIST_SHOW },
    per_page: { type: "integer", enum: PER_PAGE },
    detail: { type: "string", enum: DETAIL },
    options: { type: "string", enum: OPTIONS },
    text_pct: { type: "integer", enum: TEXT_PCT },
    button_pct: { type: "integer", enum: BUTTON_PCT },
    read: { type: "array", items: { type: "string", enum: READ }, maxItems: 6 },
    greeting: { type: "string", maxLength: 60 },
  },
  required: ["list_show", "per_page", "detail", "options", "text_pct", "button_pct", "read", "greeting"],
};

export const PROMPT_VER = "v3"; // v1 → v2(기능별 지침·예시 3개) → v3(한 가지씩 예시·안내 길이) — 10-18 실행 결과를 보고 고침. 이전 결과는 src/plan/*.p1·p2.json에 그대로 보관
export const PLAN_SYSTEM = [
  "너는 키오스크 주문 화면을 손님의 사용 방식에 맞게 다시 짜는 설계 도우미다.",
  "입력: 매장 메뉴판 요약과 손님이 고른 기능(장애명·병명은 없음, 기능만).",
  "출력: 화면 구성안 JSON 하나. 항목 뜻 —",
  "list_show: 메뉴 목록 단추에 보일 정보. per_page: 목록에 처음 보일 메뉴 수(나머지는 '더 보기').",
  "detail: 메뉴 설명을 바로 보일지(펼침), '설명 보기'로 접을지(접기). options: 고를 것을 한 화면에 모두 보일지, 하나씩 물을지.",
  "text_pct: 글씨 크기(%). button_pct: 단추 크기(%). read: 읽어 주기를 켰을 때 소리로 읽을 것.",
  "greeting: 첫 화면 맨 위 안내 한 문장(손님에게 하는 말, '-요'로 끝냄, 20~40자, 규칙을 설명하지 말 것).",
  "기본 원칙: 손님이 고른 기능만 바꾼다. 고르지 않은 기능은 그대로 둔다(글씨 100~110%, 단추 100~120%, 읽기 목록은 비움).",
  "큰 글씨를 골랐으면 글씨 150%(140~160), 목록은 이름·가격, 처음 보일 메뉴는 4~5개, 설명은 접기(휴대폰 한 화면에 고르는 단추가 먼저 보이게: 글씨 > 단추 > 자세한 설명).",
  "큰 버튼을 골랐으면 단추 160%(140~180). 한 화면에 한 가지씩을 골랐으면 options는 반드시 '하나씩', 처음 보일 메뉴는 3~4개.",
  "쉬운 말을 골랐으면 설명이 보여야 한다(목록에 짧은 설명을 보이거나 메뉴 화면에서 펼침). 읽어 주기를 골랐으면 제목·가격·알레르기는 꼭 읽는다.",
  "또렷한 색은 색만 바꾸므로 크기·구성은 다른 기능을 따른다. 기능이 없으면 매장 기본 화면에 가깝게 한다.",
  "안내 문장에는 손님이 고른 기능만 말한다. 장애·질병·나이를 말하지 말고, 가격·건강·맛을 약속하지 않는다. JSON만 쓴다.",
].join("\n");

// 메뉴판 요약(모델 입력·검증에 쓰는 같은 숫자)
export function storeSummary(menu) {
  const items = menu.items;
  const cats = [...new Set(items.map((i) => i.category))];
  const perCat = cats.map((c) => items.filter((i) => i.category === c).length);
  const descLen = items.map((i) => i.desc.replace(/알레르기:[^.]*\.?/, "").trim().length);
  const optN = items.map((i) => i.options.length);
  return {
    store: menu.store, store_id: menu.store_id, items: items.length, categories: cats.length,
    max_per_category: Math.max(...perCat), max_options: Math.max(...optN),
    longest_desc_chars: Math.max(...descLen), avg_desc_chars: Math.round(descLen.reduce((a, b) => a + b, 0) / descLen.length),
    // 하나만 고르는 묶음(온도 HOT/ICE, 맵기 '…맛')이 있는 메뉴 수
    choose_one_items: items.filter((i) => i.options.filter((o) => o === "HOT" || o === "ICE").length >= 2 || i.options.filter((o) => /맛$/.test(o)).length >= 2).length,
  };
}
export function planUserMessage(summary, codes) {
  const on = CODE_ORDER.filter((c) => codes.includes(c)).map((c) => CODE_KO[c]);
  return JSON.stringify({ 매장: summary, 손님이_고른_기능: on.length ? on : ["(없음 — 기본 화면)"] });
}
// 예시 두 개(모델이 형식을 알게 — 실제 조합과 같은 예시를 그대로 베끼면 검증에서 드러남)
export const PLAN_EX = [
  { codes: [], out: { list_show: "이름·가격·설명", per_page: 10, detail: "펼침", options: "한 화면에 모두", text_pct: 100, button_pct: 100, read: [], greeting: "매장 메뉴를 그대로 보여 드려요. 필요하면 내 방식을 바꿀 수 있어요." } },
  { codes: ["BIG", "TOUCH"], out: { list_show: "이름·가격", per_page: 4, detail: "접기", options: "한 화면에 모두", text_pct: 150, button_pct: 160, read: [], greeting: "글씨와 단추를 크게 했어요. 설명은 '설명 보기'를 누르세요." } },
  { codes: ["EASY", "VOICE"], out: { list_show: "이름·가격·짧은 설명", per_page: 6, detail: "펼침", options: "한 화면에 모두", text_pct: 110, button_pct: 110, read: ["제목", "이름", "가격", "설명", "알레르기", "옵션"], greeting: "쉬운 말로 보여 드리고, 천천히 읽어 드릴게요." } },
  { codes: ["EASY", "ONE"], out: { list_show: "이름·가격·짧은 설명", per_page: 4, detail: "펼침", options: "하나씩", text_pct: 110, button_pct: 110, read: [], greeting: "쉬운 말로 보여 드리고, 고를 것은 하나씩 물어볼게요." } },
];

// 코드가 정하는 기본 구성(AI 구성안이 없거나 검증에 실패할 때) — 지금까지(v0.5)의 동작과 같게
export function defaultPlan(codes) {
  const has = (c) => codes.includes(c);
  return {
    list_show: has("BIG") ? "이름·가격" : "이름·가격·설명",
    per_page: has("ONE") ? 4 : has("BIG") ? 5 : 12,
    detail: has("BIG") && !has("ONE") ? "접기" : "펼침",
    options: has("ONE") ? "하나씩" : "한 화면에 모두",
    text_pct: has("BIG") ? 150 : 100,
    button_pct: has("TOUCH") ? 160 : 100,
    read: has("VOICE") ? ["제목", "이름", "가격", "알레르기"] : [],
    greeting: "",
  };
}

// 안내 한 줄 검사 — 장애·질병·나이 말, 약속(가격·건강·맛), 문자, 길이, 끝맺음
const BAN_WORDS = /장애|질병|질환|환자|노인|어르신|고령|노약|시각|청각|치매|약시|저시력|난독|문맹|어린이|아이|노안|건강|치료|효능|맛있|저렴|싸게|할인|무료|안전합|보장/;
const GREET_OK = /^[가-힣0-9\s.,·'"()!?~「」]*$/;
// 안내 문장 속 기능 낱말 → 기능 코드(고르지 않은 기능을 말하면 보정)
export const GREET_FEATURE = [
  ["BIG", /큰 ?글씨|글씨를 크게|글씨가 크|크게 보여/], ["HC", /또렷|고대비|대비|밝은 글씨|검은 바탕|색을/], ["EASY", /쉬운 ?말|쉽게 풀|쉬운 낱말/],
  ["VOICE", /읽어|소리로|들려/], ["TOUCH", /큰 ?버튼|단추를 크게|버튼을 크게|큰 단추|버튼으로/], ["ONE", /한 가지씩|하나씩|한 화면에 한/],
];
export function checkGreeting(g) {
  const why = [];
  const s = String(g || "").trim();
  if (!s) return ["비어 있음"];
  if (s.length > 50) why.push("길이 50자 넘음");
  if (!GREET_OK.test(s)) why.push("한글·기본 기호 밖 문자");
  const m = s.match(BAN_WORDS); if (m) why.push(`쓰지 않을 말 「${m[0]}」`);
  if (!/요[.!]?$/.test(s)) why.push("'-요'로 끝나지 않음");
  return why;
}
// 받침에 따라 '로'·'으로'(받침 없음·ㄹ받침 → 로)
function ro(word) {
  const h = [...word.replace(/\([^)]*\)/g, "")].reverse().find((ch) => ch >= "가" && ch <= "힣");
  if (!h) return "로";
  const jong = (h.charCodeAt(0) - 0xac00) % 28;
  return jong === 0 || jong === 8 ? "로" : "으로";
}
export function defaultGreeting(codes) {
  const on = CODE_ORDER.filter((c) => codes.includes(c)).map((c) => CODE_KO[c].replace(/\([^)]*\)/g, ""));
  return on.length ? `${on.join(", ")}${ro(on[on.length - 1])} 보여 드릴게요.` : "매장 메뉴를 그대로 보여 드릴게요.";
}

// 검증·보정: AI 구성안 → { plan, fixes[], verdict }
export function validatePlan(raw, codes, summary) {
  const has = (c) => codes.includes(c);
  const fixes = [];
  let p;
  if (!raw || typeof raw !== "object") return { plan: { ...defaultPlan(codes), greeting: defaultGreeting(codes) }, fixes: ["구성안을 읽을 수 없음"], verdict: "기본 구성(AI 구성안 실패)" };
  p = { ...raw };
  // 형식(문법 제약이 없는 경로 — 브라우저 실행 등 — 를 위해 다시 확인)
  const pick = (k, list, dflt) => { if (!list.includes(p[k])) { fixes.push(`${k} 값 형식 밖 → 기본값`); p[k] = dflt; } };
  const d = defaultPlan(codes);
  pick("list_show", LIST_SHOW, d.list_show); pick("per_page", PER_PAGE, d.per_page); pick("detail", DETAIL, d.detail);
  pick("options", OPTIONS, d.options); pick("text_pct", TEXT_PCT, d.text_pct); pick("button_pct", BUTTON_PCT, d.button_pct);
  p.read = Array.isArray(p.read) ? [...new Set(p.read.filter((x) => READ.includes(x)))] : [];
  // 손님 기능과 맞는지(최소 기준) — 맞지 않으면 그 항목만 고침
  if (has("BIG") && p.text_pct < 140) { fixes.push(`큰 글씨인데 글씨 ${p.text_pct}% → 140%`); p.text_pct = 140; }
  if (!has("BIG") && p.text_pct > 120) { fixes.push(`큰 글씨를 고르지 않았는데 글씨 ${p.text_pct}% → 110%`); p.text_pct = 110; }
  if (has("TOUCH") && p.button_pct < 140) { fixes.push(`큰 버튼인데 단추 ${p.button_pct}% → 160%`); p.button_pct = 160; }
  if (!has("TOUCH") && p.button_pct > 120 && !has("BIG")) { fixes.push(`큰 버튼을 고르지 않았는데 단추 ${p.button_pct}% → 120%`); p.button_pct = 120; } // 큰 글씨는 단추도 커야 글이 들어감
  if (has("ONE") && p.options !== "하나씩") { fixes.push("한 화면에 한 가지씩인데 옵션을 한 화면에 모두 → 하나씩"); p.options = "하나씩"; }
  if (has("ONE") && p.per_page > 4) { fixes.push(`한 화면에 한 가지씩인데 처음 보일 메뉴 ${p.per_page}개 → 4개`); p.per_page = 4; }
  if (has("VOICE")) {
    for (const must of ["가격", "알레르기"]) if (!p.read.includes(must)) { fixes.push(`읽어 주기인데 「${must}」을(를) 읽지 않음 → 추가`); p.read.push(must); }
    if (!p.read.includes("제목")) { fixes.push("읽어 주기인데 화면 제목을 읽지 않음 → 추가"); p.read.unshift("제목"); }
  } else if (p.read.length) { p.read = []; } // 읽어 주기를 안 켰으면 읽지 않음(보정으로 세지 않음 — 쓰이지 않는 값)
  if (has("EASY") && p.list_show === "이름·가격" && p.detail === "접기" && !has("BIG")) {
    fixes.push("쉬운 말인데 설명이 목록에도 메뉴 화면에도 안 보임 → 메뉴 화면에서 펼침"); p.detail = "펼침";
  }
  // 첫 화면 안에 '담기' — 어림 계산 대신, 손님 화면이 그릴 때 실제 높이를 재서 넘치면 그 자리에서 설명 접기 → 하나씩 묻기(order.html 실행 중 보정)
  // 안내 한 줄 — 손님이 고르지 않은 기능을 말하면(「쉬운 말로 보여 드리고…」를 기본 화면에) 사실과 다름
  const gw = checkGreeting(p.greeting);
  for (const [code, re] of GREET_FEATURE) if (!has(code) && re.test(String(p.greeting || ""))) gw.push(`고르지 않은 기능(${CODE_KO[code]})을 말함`);
  if (gw.length) { fixes.push(`안내 문장(${gw.join(", ")}) → 기본 문장`); p.greeting = defaultGreeting(codes); }
  return { plan: p, fixes, verdict: fixes.length ? `AI 구성안(보정 ${fixes.length})` : "AI 구성안(검증 통과)" };
}

// 손님 화면에 쓸 구성안 찾기: 저장본(조합별) → 없으면 기본 구성
export function planFor(plans, codes) {
  const key = comboKey(codes);
  const row = plans && plans.rows ? plans.rows[key] : null;
  if (row && row.plan) return { key, ...row };
  return { key, plan: { ...defaultPlan([...codes]), greeting: defaultGreeting([...codes]) }, fixes: [], verdict: "기본 구성(저장된 AI 구성안 없음)" };
}
