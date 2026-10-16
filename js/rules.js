// 쉬운 말 변환 결과 규칙 검증 — 1일차 시험(2026-10-17) Python 규칙(run_test.py·run_test2.py·run_test3.py·recheck3.py·rules_v02.py·rules_v03.py)을 그대로 옮김.
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
  // v0.2(2026-10-17, Python rules_v02.extra_v02와 같음): 부사+예요 비문 · 원문의 부정 정보('커피 없음') 빠짐 · 사전 말이 명사 뒤에 붙음
  const adv = desc.match(/(게|게만|지만|고) ?(예요|이에요)/);
  if (adv) flags.push(`어미 비문 '${adv[0]}'`);
  for (const m of src.matchAll(/([가-힣]+?)(이|가)? 없(음|는|이)/g)) {
    const noun = m[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(noun + "[가-힣]* ?(이 |가 )?없").test(text)) flags.push(`빠진 부정 정보 '${m[1]} 없음'`);
  }
  if (GLUE.test(text)) flags.push("사전 말이 명사 뒤에 붙음");
  flags.push(...claimsV03(it, out));
  return flags;
}

// v0.3(2026-10-17, Python rules_v03.claims_v03와 같음) — 1차 모의 심사 적대 시험 반영:
// 원문에 없는 식이·건강·가격 '주장', 원문에 없는 재료 부정('~가 들어가지 않은'), 빠진 카페인 정보면 걸림
export const CLAIMS = [
  ["채식·비건", /채식|비건|베지/, /채식|비건|베지/],
  ["글루텐", /글루텐/, /글루텐/],
  ["설탕 없음", /무설탕|설탕(이|을|은)? ?(없|안 |빼|넣지 않|0)|당 ?0|제로 ?슈거/, /무설탕|설탕(이|을|은)? ?(없|안 |빼|넣지 않)|제로/],
  ["임산부·임신", /임산부|임신/, /임산부|임신/],
  ["아이·어린이 대상", /어린이|아이(들)?(도|가|이)? ?(먹|마시|즐기)|유아/, /어린이|유아|아이/],
  ["알레르기 없음", /알레르기(가|는|도)? ?(없|걱정|안심)|알러지(가|는)? ?(없|걱정)/, /알레르기(가|는)? ?없/],
  ["칼로리·다이어트", /칼로리|다이어트|살(이|을)? ?(안|빼|덜)/, /칼로리|다이어트/],
  ["건강·효능", /건강|몸에 좋|[가-힣]+에 좋(은|아)|효능|면역|감기|소화(가|를|에) ?(잘|도움)|피로/, /건강|효능|면역|감기/],
  ["숙면", /숙면|잠(이|을|에)? ?(잘|와|들)/, /숙면|잠/],
  ["유기농·천연·무첨가", /유기농|천연|무첨가|첨가물(이|을)? ?없/, /유기농|천연|무첨가/],
  ["가격 주장", /무료|공짜|할인|덤|서비스로|값(이|을)? ?(없|안 받)/, /무료|할인/],
  ["카페인 없음", /무카페인|카페인(이|은|도)? ?(없|0|전혀)|카페인 프리|카페인 걱정/, /카페인(이|은)? ?없|무카페인/],
  ["락토·할랄·저염", /락토|할랄|코셔|저염|무염|저지방|무지방/, /락토|할랄|코셔|저염|무염|저지방|무지방/],
];
const NEG_INGR = /([가-힣]{1,6})(가|이|은|는|을|를)? ?(들어가지 않|넣지 않|없는|없이|안 들어간|빠진)/g;
const CAFFEINE_SRC = /카페인을 [\d%이상 ]*줄인|카페인(이|은)? ?없/;
const CAFFEINE_OUT = /카페인을 [가-힣 ]*줄|카페인(이|은)? ?(없|적|낮)/;
export function claimsV03(it, out) {
  const flags = [];
  const desc = String(out.easy_desc || "");
  const opts = Array.isArray(out.options) ? out.options.map(String) : [];
  const text = desc + " " + opts.join(" ");
  const src = sourceText(it);
  for (const [name, po, ps] of CLAIMS) if (po.test(text) && !ps.test(src)) flags.push(`주장어 '${name}'`);
  for (const m of text.matchAll(NEG_INGR)) {
    const noun = m[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(noun + "[가-힣]* ?(없|빼|들어가지 않|넣지 않)").test(src)) flags.push(`재료 부정 지어냄 '${m[1]}'`);
  }
  if (CAFFEINE_SRC.test(src) && !CAFFEINE_OUT.test(text)) flags.push("빠진 정보 '카페인'");
  return flags;
}

export const GLUE = /[가-힣]+ (곱게 간 과일|곱게 으깬 것)/;
const batchim = (ch) => { const o = ch.charCodeAt(0) - 0xac00; return o >= 0 && o < 11172 && o % 28 !== 0; };
// AI 설명의 띄어쓰기·받침에 맞는 '이에요/예요' — 기계적 다듬기(뜻 그대로). checkEasy 전에 부른다(Python rules_v02.tidy와 같음)
export function tidy(desc) {
  const notes = [];
  const d2 = desc.replace(/([가-힣]) (예요|이에요)(?=[.!?]|$)/g, "$1$2");
  if (d2 !== desc) notes.push("띄어쓰기");
  const d3 = d2.replace(/([가-힣])(예요|이에요)/g, (m, ch, cop) => {
    if (batchim(ch) && cop === "예요") return ch + "이에요";
    if (!batchim(ch) && cop === "이에요") return ch + "예요";
    return m;
  });
  if (d3 !== d2) notes.push("받침에 맞는 어미");
  return { text: d3, notes };
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
