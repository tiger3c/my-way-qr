// 쉬운 말 변환 결과 규칙 검증 — 1일차 시험(2026-10-17) Python 규칙(run_test.py·run_test2.py·run_test3.py·recheck3.py)을 그대로 옮김.
// 걸리면 재생성 1회 → 그래도 걸리면 원문 유지(틀린 쉬운 말이 화면에 나가지 않게 하는 안전 기본값)
const CONCEPTS = {
  "우유": /우유|밀크(?!티)|밀크티/, "귀리": /오트|귀리/, "초콜릿": /초콜릿|초코|코코아/, "바닐라": /바닐라/,
  "카라멜": /카라멜|캐러멜/, "크림": /크림|휘핑/, "아이스크림": /아이스크림/, "딸기": /딸기/, "레몬": /레몬/,
  "자몽": /자몽/, "망고": /망고/, "요거트": /요거트|요구르트/, "유자": /유자/, "녹차": /말차|녹차/,
  "홍차": /홍차|얼그레이/, "캐모마일": /캐모마일/, "꿀": /꿀/, "계피": /시나몬|계피/, "민트": /민트/,
  "바나나": /바나나/, "복숭아": /복숭아/, "견과": /견과|땅콩|아몬드|호두/, "치즈": /치즈/, "버터": /버터/,
  "계란": /계란|달걀/, "밀": /밀가루|(?<![가-힣])밀(?!크)/, "대두": /대두|콩/, "돼지고기": /돼지|햄/,
  "고구마": /고구마/, "오렌지": /오렌지/, "탄산": /탄산|톡 쏘/, "소금": /소금|짭짤/, "잼": /잼/,
  "커피": /커피|에스프레소|원두|샷|콜드브루/, "물": /(?<![가-힣])물(?![건질])/,
};
const SPECIAL = {
  "단맛": [/달콤|달달|단맛/, /달콤|단맛|시럽|초콜릿|초코|설탕|잼|청|아이스크림|바닐라|카라멜|당도|덜 달게|크림|마카롱|케이크|스콘|브라우니|고구마|딸기|망고|오렌지|꿀|모카/],
  "알레르기 안내": [/알레르기|알러지/, /(?!)/],
};
export const JARGON = ["샷", "HOT", "ICE", "ONLY", "디카페인", "시럽", "휘핑", "드리즐", "스팀", "오트밀크", "에스프레소", "콜드브루",
  "블렌디드", "퓨레", "페이스트", "티백", "베르가못", "파우더", "착즙", "페이스트리", "마끼아또", "비엔나"];
const WARM = /따뜻|뜨겁|뜨거운/;
const COLD_CHOICE = /차갑게|차가운|아이스로|시원하게/;
const TRAPS = { // 가상 매장 '한모금' 메뉴의 함정 문항
  c07: ["디카페인 = 카페인을 줄인 것(0 아님)", /카페인(이|은)? ?(없|0|전혀)/],
  n06: ["딸기라떼에는 커피가 없음", /(?<!커피가 )(?<!커피 )커피(가|를|와|도)? ?(들어|넣|있)/],
  t02: ["캐모마일은 카페인 없음", /카페인(이)? ?(있|들어)/],
  c06: ["ICE ONLY — 따뜻하게 금지", WARM],
  c08: ["HOT만 — 차갑게 금지", COLD_CHOICE],
  n08: ["착즙 100% — 설탕·물 추가 금지", /설탕|물을 (섞|타|넣)/],
};
const CATEGORY_BAD = {
  "커피": /(?<![가-힣])차(예요|이에요|입니다)|빵(이에요|예요)/,
  "차": /커피(예요|이에요|입니다)|빵(이에요|예요)/,
  "음료": /빵(이에요|예요)|케이크(예요|이에요)/,
  "디저트": /음료/,
};
const ALLOWED = /^[가-힣ㄱ-ㅎ0-9A-Za-z\s.,·'"()+\-~%/!?]*$/;
const MAIN = ["녹차", "홍차", "캐모마일", "유자", "레몬", "자몽", "딸기", "망고", "고구마", "오렌지", "초콜릿", "바닐라", "카라멜", "치즈", "햄", "커피"];
const PROCESS = /끓|익힌|익혀|증발|볶|튀기|굽고|구워|발효|숙성|빠르게|뿌려 (만든|먹)/g;

const sourceText = (it) => [it.name, it.desc, it.options.join(" ")].join(" ");

export function checkEasy(it, out) {
  const flags = [];
  const src = sourceText(it);
  if (!out || typeof out !== "object") return ["JSON 아님"];
  if (out.id !== it.id) flags.push("id 불일치");
  const desc = String(out.easy_desc || "");
  const opts = Array.isArray(out.options) ? out.options.map(String) : [];
  const text = desc + " " + opts.join(" ");
  for (const m of text.matchAll(/\d[\d,.]*/g)) flags.push(`숫자 '${m[0]}'`);
  for (const [c, re] of Object.entries(CONCEPTS)) {
    if (re.test(text) && !re.test(src)) {
      if (c === "물" && /ICE|HOT/.test(src)) continue;
      flags.push(`개념 추가 '${c}'`);
    }
  }
  for (const [c, [po, ps]] of Object.entries(SPECIAL)) if (po.test(text) && !ps.test(src)) flags.push(`개념 추가 '${c}'`);
  if (opts.length !== it.options.length) flags.push(`옵션 개수 ${opts.length}≠${it.options.length}`);
  if (/(세요|십시오|주세요)[.!]?$/.test(desc.trim())) flags.push("설명이 명령문");
  if (desc.length > 45) flags.push("설명 김");
  if (TRAPS[it.id] && TRAPS[it.id][1].test(text)) flags.push(`함정: ${TRAPS[it.id][0]}`);
  it.options.forEach((o, i) => {
    const e = opts[i] || "";
    if ((o === "HOT" || o === "데워 드림") && !/따뜻|뜨겁|데워|데운/.test(e)) flags.push(`옵션 뜻 바뀜 '${o}'→'${e}'`);
    if (o === "ICE" && !/차갑|차가운|시원|얼음/.test(e)) flags.push(`옵션 뜻 바뀜 '${o}'→'${e}'`);
    const verbs = { "빼기": /빼|없이/, "추가": /추가|더|넣/, "변경": /바꾸|변경|대신/, "덜 달게": /덜|조금/ };
    for (const [v, re] of Object.entries(verbs)) if (o.includes(v) && !re.test(e)) flags.push(`옵션 뜻 바뀜 '${o}'→'${e}'`);
  });
  const bad = CATEGORY_BAD[it.category];
  if (bad && bad.test(desc)) flags.push(`분류 '${it.category}'와 맞지 않는 명사`);
  if (!ALLOWED.test(text)) flags.push("한글·기본 기호 밖 문자");
  for (const c of MAIN) {
    const re = CONCEPTS[c] || new RegExp(c);
    if (re.test(src) && !re.test(desc) && !new RegExp(`(${re.source})[가-힣]* ?없`).test(src)) flags.push(`재료 빠짐 '${c}'`);
  }
  for (const m of desc.matchAll(PROCESS)) if (!src.includes(m[0])) flags.push(`조리법 지어냄 '${m[0]}'`);
  return flags;
}

export const SYSTEM = [
  "너는 카페 키오스크 글을 '쉬운 말'로 바꾸는 도우미다. 읽는 사람은 외래어와 긴 문장이 어려운 사람이다.",
  "규칙:",
  "1. 원래 글에 없는 재료·맛·사실을 지어내지 않는다. 원래 글에 있는 재료는 빼먹지 않는다.",
  "2. 숫자(가격·용량·퍼센트·시간)는 쓰지 않는다.",
  "3. 외래어·약어는 쉬운 우리말로 풀어 쓴다. 예: 샷 → 커피 원액, 시럽 → 단맛 액, 휘핑 → 달콤한 크림, 스팀 밀크 → 데운 우유.",
  "4. easy_desc는 이 메뉴가 무엇인지 설명하는 한 문장(30자 안팎), '~예요/~이에요'로 끝낸다. 만드는 방법이나 명령문(~하세요)은 쓰지 않는다.",
  "5. options에는 원래 옵션을 같은 순서로 하나씩 쉬운 말로 바꿔 넣는다(개수 같게). 원래 옵션이 없으면 빈 목록.",
  "6. 반드시 JSON 한 개만 출력한다.",
].join("\n");
export const EX_IN = { id: "x00", name: "핫초코", desc: "초콜릿 파우더 + 스팀 밀크, 휘핑 토핑", options: ["HOT", "ICE", "휘핑 빼기"] };
export const EX_OUT = { id: "x00", easy_desc: "초콜릿 가루를 데운 우유에 타고 달콤한 크림을 올린 음료예요.", options: ["따뜻하게", "차갑게", "달콤한 크림 빼기"] };
export const SCHEMA = {
  type: "object",
  properties: { id: { type: "string" }, easy_desc: { type: "string" }, options: { type: "array", items: { type: "string" }, maxItems: 4 } },
  required: ["id", "easy_desc", "options"],
};
export function hints(it, glossary) {
  const src = sourceText(it);
  const found = [], used = [];
  for (const k of Object.keys(glossary).sort((a, b) => b.length - a.length)) {
    if (src.includes(k) && !used.some((u) => u.includes(k))) { found.push(`${k}=${glossary[k]}`); used.push(k); }
  }
  return found;
}
