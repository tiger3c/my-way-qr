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

export function checkEasy(it, out, glossary = null) {
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
  flags.push(...rulesV04(it, out, glossary));
  return [...new Set(flags)];
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
  ["건강·효능", /건강|몸에 좋|[가-힣]+에 좋(은|아)|효능|면역|감기|소화(가|를|에) ?(잘|도움)|(?<![가-힣])피로/, /건강|효능|면역|감기/], // v0.4: '커피로' 오탐 수정(2차 모의 심사 C)
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


// ───────────────────────── v0.4(2026-10-17) — 2차 모의 심사(설계 세트: 위원 B·C가 낸 틀린 문장) 반영, 범주 단위로 넓힘 ─────────────────────────
// 평가는 규칙을 고치기 전에 고정한 따로 떼어 둔 세트(feasibility/heldout_v04.json)로 따로 잰다 — 그 세트로 규칙을 고치지 않는다
// ① 한글 수사(세 번·네 개·칠백 원·하루) ② 닫힌 재료 어휘(일반 식재료 낱말 중 원문·용어 사전에 없는 것) ③ 대체 우유·옵션에만 있는 재료를 기본 재료로
// ④ 원문 재료·알레르기 성분을 없다/뺐다고 함(범주어 포함) ⑤ 효능·기분·안심·가격·순위 주장 넓힘 ⑥ 카페인 함정 넓힘 ⑦ 온도 함정 일반화 ⑧ 옵션 뜻 뒤집기 ⑨ 외래어 남음
const KNUM = /(?<![가-힣])(두|세|네|다섯|여섯|일곱|여덟|아홉|열|스무|서른|이백|삼백|사백|오백|육백|칠백|팔백|구백|백|천|이천|삼천|오천|만) ?(번|개|잔|조각|시간|배|원|가지|컵|알|장|봉지|팩|인분|스푼|방울|입)/;
const KTIME = /(?<![가-힣])(하루|이틀|사흘|반나절|한나절|절반|반값|반 ?잔|반 ?조각)/;
// 일반 식재료 낱말(카페·제과·식사, 식품 알레르기 표시 대상 포함) — 출력에 있는데 원문(또는 원문 낱말의 용어 사전 값·같은 개념)에 없으면 '지어낸 재료'
const FOOD = ["우유", "두유", "연유", "생크림", "크림", "요거트", "요구르트", "치즈", "버터", "마가린", "아이스크림", "계란", "달걀", "밀가루", "쌀", "쌀가루",
  "찹쌀", "현미", "보리", "귀리", "오트", "옥수수", "감자", "고구마", "호박", "콩", "팥", "녹두", "땅콩", "호두", "아몬드", "잣", "밤", "캐슈넛", "피스타치오",
  "마카다미아", "코코넛", "깨", "참깨", "흑임자", "들깨", "해바라기씨", "꿀", "설탕", "흑설탕", "시럽", "메이플", "올리고당", "물엿", "소금", "후추", "계피",
  "시나몬", "생강", "인삼", "홍삼", "대추", "쑥", "녹차", "말차", "홍차", "보이차", "커피", "코코아", "초콜릿", "바닐라", "카라멜", "캐러멜", "민트", "레몬",
  "라임", "자몽", "유자", "오렌지", "귤", "한라봉", "망고", "바나나", "사과", "배", "포도", "키위", "딸기", "블루베리", "라즈베리", "체리", "복숭아", "수박",
  "멜론", "파인애플", "석류", "토마토", "당근", "오이", "양파", "마늘", "양상추", "시금치", "버섯", "햄", "베이컨", "소시지", "돼지고기", "소고기", "쇠고기",
  "닭고기", "새우", "게", "오징어", "조개", "연어", "참치", "고등어", "떡", "젤리", "젤라틴", "술", "럼", "와인", "맥주", "리큐르", "알코올", "기름", "식물성",
  "올리브유", "잼", "마시멜로", "쿠키", "빵", "케이크", "과자", "탄산"];
const JOSA = /(으로|에서|이랑|부터|까지|처럼|하고|이나|이에요|예요|입니다|이고|에다|을|를|이|가|은|는|과|와|에|로|의|도|만|랑|나|요)$/;
function stems(text) {
  return text.replace(/[.,·!?()"'~+\-/]/g, " ").split(/\s+/).filter(Boolean).map((w) => w.replace(JOSA, "")).filter(Boolean);
}
function foodIn(text) {
  const st = stems(text), found = new Set();
  for (const t of st) for (const w of FOOD) {
    if (w.length === 1 ? t === w : (t === w || t.startsWith(w) || t.endsWith(w))) found.add(w);
  }
  return found;
}
// 메뉴의 재료 낱말 → 알레르기·재료 범주(부정 검사용)
const CATEGORY = { "유제품": ["우유", "크림", "요거트", "치즈", "버터", "아이스크림"], "글루텐": ["밀"], "견과": ["땅콩", "호두", "아몬드"],
  "고기": ["돼지고기", "햄", "소고기", "닭고기", "베이컨"], "동물성": ["우유", "크림", "치즈", "버터", "계란", "햄"], "알": ["계란"], "달걀": ["계란"], "밀가루": ["밀"] };
const SRC_ING = { "우유": /우유|밀크|라떼|크림|휘핑|요거트|치즈|버터|아이스크림/, "계란": /계란|달걀|마카롱|머랭/, "밀": /밀가루|빵|케이크|스콘|크루아상|브라우니|페이스트리|샌드위치|마들렌/,
  "크림": /크림|휘핑/, "치즈": /치즈/, "버터": /버터/, "요거트": /요거트/, "아이스크림": /아이스크림/, "햄": /햄/, "돼지고기": /돼지|햄/, "커피": /커피|에스프레소|원두|샷|콜드브루/ };
const CLAIMS_V04 = [
  ["효능·기분", /기분(이|을)? ?(좋|밝|나아)|머리(가|를)? ?맑|맑아|비타민|채워 ?줘|몸(을|이)? ?(데워|따뜻|가볍|편)|편안|편해|목(이|에)? ?(아플|아프|편|좋)|속(이|을)? ?(편|든든)|차분|진정|기운|활력|푹 쉬|밤에도|집중|피부|해독|붓기|소화|숙면|잠(이|을|에)/],
  ["안심 주장", /안심|걱정 ?(없|없이|마|말)|아무나|누구나|모두 (먹|마시)|편하게 (드|먹|마시)/],
  ["가격·순위 주장", /반값|세일|할인|저렴|(?<![가-힣])싸(요|게|고)|무료|공짜|(?<![가-힣])덤|하나 더|1 ?\+ ?1|값(이|을)? ?(내려|깎|싸)|인기|(?<![가-힣])가장|제일|최고|많이 찾|잘 팔|베스트|추천|1위/],
  ["임신·아이 주장", /임신|임산부|배 ?속|아기|태아|어린이|유아|아이(들)?(도|가|이)? ?(마실|먹을|마셔|먹어)/],
  ["식이 주장", /채식|비건|베지|고기 ?(없|빼|안)|무육|글루텐|락토|할랄|저염|무염|저지방|무지방|무설탕|짜지 않|덜 짠|싱거/],
  ["단맛 없음 주장", /(단맛|당|설탕)(을|이|은)? ?(쏙 |다 |모두 |전부 )?(뺀|빼고|없|안 넣)/],
  ["칼로리·가벼움 주장", /가벼운 ?(한 ?끼|식사)|가볍게 (먹|드)|칼로리|다이어트/],
  ["가격 주장(덤)", /그냥 ?(더 )?(드려|줘|드립)|공짜로|덤으로|서비스로/],
];
export function rulesV04(it, out, glossary = null) {
  const flags = [];
  const desc = String(out.easy_desc || "");
  const opts = Array.isArray(out.options) ? out.options.map(String) : [];
  const text = desc + " " + opts.join(" ");
  // 메뉴 이름·설명 중 옵션을 말하는 문장(변경·추가·빼기·선택·가능·조절)은 뺀 '기본 재료' 글(예: 카페라떼의 '오트밀크 변경 +700원'은 기본 재료가 아님)
  const base = [it.name, ...it.desc.split(/[.]/).filter((x) => !/변경|추가|빼기|선택|가능|조절/.test(x))].join(" ");
  const src = sourceText(it);                            // 옵션 포함
  // 원문에 있는 낱말의 용어 사전 값(예: 페이스트리 → '버터를 겹겹이 넣어 구운 빵')도 허용 어휘
  let allowed = src;
  if (glossary) for (const [k, v] of Object.entries(glossary)) if (src.includes(k)) allowed += " " + v;
  // ① 한글 수사
  const kn = text.match(KNUM) || text.match(KTIME);
  if (kn) flags.push(`한글 수량 '${kn[0]}'`);
  // ② 닫힌 재료 어휘
  for (const w of foodIn(text)) {
    if (allowed.includes(w)) continue;
    const c = Object.entries(CONCEPTS).find(([, re]) => re.test(w));
    if (c && c[1].test(allowed)) continue;
    flags.push(`원문에 없는 재료 '${w}'`);
  }
  // ③ 대체 우유·옵션에만 있는 재료를 기본 재료로(설명에)
  if (/두유|아몬드 ?우유|귀리 ?우유|오트 ?(밀크|우유)|코코넛 ?(밀크|우유)|라이스 ?밀크/.test(desc) && !/두유|아몬드|귀리|오트|코코넛|라이스/.test(base)) flags.push("대체 우유를 기본 재료로");
  for (const [c, re] of Object.entries(CONCEPTS)) {
    if (re.test(it.options.join(" ")) && !re.test(base) && re.test(desc)) flags.push(`옵션 재료를 기본 재료로 '${c}'`);
  }
  // ④ 원문 재료·알레르기 성분을 없다/뺐다고 함(범주어 포함) — 원문이 스스로 '없음'이라 한 것은 허용
  const srcIngr = new Set(Object.entries(SRC_ING).filter(([, re]) => re.test(src)).map(([k]) => k));
  for (const a of (Array.isArray(it.allergy_derived) ? it.allergy_derived : [])) srcIngr.add(a);
  const declared = (it.desc.match(/알레르기:\s*([^.]+)/) || [])[1];
  if (declared) for (const a of declared.split(/[,\s]+/)) if (a) srcIngr.add(a);
  // 부정하는 말 바로 앞 낱말만 본다(문장 안 다른 재료는 보지 않음 — 「우유를 부은 라떼로, 커피는 없어요」 오탐 수정)
  for (const m of desc.matchAll(/([가-힣]{1,6}?)(은|는|이|가|을|를|도|만)? ?(들어가지 않|들어 있지 않|안 들어|넣지 않|안 넣|쓰지 않|안 쓰|없이|없는|없어|없음|없고|빼고|뺀|빠진|제외)/g)) {
    const t = m[1].replace(/류$/, "");
    const cats = CATEGORY[t] || CATEGORY[m[1]] || [t];
    if (cats.some((x) => srcIngr.has(x)) && !new RegExp(t + "[가-힣]* ?(이 |가 )?(없|빼)").test(src)) flags.push(`원문 재료를 없다고 함 '${m[1]}'`);
  }
  // ⑤ 넓힌 주장어
  for (const [name, re] of CLAIMS_V04) if (re.test(text) && !re.test(src)) flags.push(`주장어 '${name}'`);
  if (/(?<![가-힣])술(?![가-힣])|술(이|을|은|도)/.test(text) && !/술/.test(src)) flags.push("원문에 없는 재료 '술'");
  if (/(커피|카페인)(가|이|은|는)? ?(약|연|순|적|낮)/.test(text) && !/줄인|디카페인|없는/.test(src)) flags.push("카페인 약함 주장");
  // ⑥ 카페인 함정 넓힘
  if (/카페인[^.]{0,8}(없|0|전혀|하나도|들지 않|안 들|프리)|무카페인/.test(text) && !/카페인(이|은)? ?없/.test(src)) flags.push("카페인 없음 주장");
  if (/카페인(이|은)? ?없/.test(src) && /카페인[^.]{0,6}(있|들어|살짝|조금)/.test(text) && !/카페인[^.]{0,6}(없)/.test(text)) flags.push("카페인 있음 주장");
  // ⑦ 온도 함정 일반화: 차갑게만 파는 메뉴 ↔ 따뜻하게, 따뜻하게만 파는 메뉴 ↔ 차갑게
  const hasHot = it.options.includes("HOT"), hasIce = it.options.includes("ICE");
  if (hasIce && !hasHot && /따뜻|뜨겁|뜨거|데워|데운|데우|(?<![가-힣])핫/.test(text) && !/스팀|데운|데워/.test(src)) flags.push("온도 함정: 차갑게만");
  if (hasHot && !hasIce && /차갑|차가운|아이스|얼음|시원/.test(text)) flags.push("온도 함정: 따뜻하게만");
  // ⑧ 옵션 뜻 뒤집기
  it.options.forEach((o, i) => {
    const e = opts[i] || "";
    if (o.includes("빼기") && /빼지 않|안 빼|두 ?배|더 |많이|듬뿍|추가/.test(e)) flags.push(`옵션 뜻 뒤집힘 '${o}'→'${e}'`);
    if (o.includes("추가") && /덜|빼|적게|줄/.test(e)) flags.push(`옵션 뜻 뒤집힘 '${o}'→'${e}'`);
    if (o.includes("덜 달게") && /더 달|많이 달/.test(e)) flags.push(`옵션 뜻 뒤집힘 '${o}'→'${e}'`);
    if (o === "ICE" && /얼음 ?(없|빼)/.test(e)) flags.push(`옵션 뜻 뒤집힘 '${o}'→'${e}'`);
    if (o.includes("변경") && !/바꾸|변경|대신/.test(e)) flags.push(`옵션 뜻 바뀜 '${o}'→'${e}'`);
  });
  // ⑨ 쉬운 말에 외래어가 남음(2차 모의 심사 C·E: 「시럽 덜 달게」·「휘핑 크림 빼기」·「비엔나 스타일」)
  const left = JARGON.filter((j) => !/^(HOT|ICE|ONLY)$/.test(j) && !it.name.includes(j) && text.includes(j));
  if (left.length) flags.push(`외래어 남음 '${left.join("·")}'`);
  return flags;
}
