// v0.6 — 주문 QR(휴대폰 → 키오스크, 서버 없음). 형식은 연동 규격 docs/interface-spec-v0.3.md 2절:
//   MWQ1|<매장ID>|<메뉴판 판번호>|<키오스크 번호>|<품목ID>:<옵션 번호,…>:<수량>;…|<체크섬>
// 금액·이름·쉬운 말 문장·손님의 기능 코드는 넣지 않는다(키오스크가 자기 메뉴판으로 다시 계산 — 휴대폰 쪽 변조·옛 메뉴판 차단, 개인정보 최소화).
// 체크섬 = 앞 내용의 CRC-16/CCITT-FALSE(오타·찢어진 QR 감지용, 보안 서명 아님).

export function crc16(str) {
  let c = 0xffff;
  for (const b of new TextEncoder().encode(str)) {
    c ^= b << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c.toString(16).padStart(4, "0");
}

// cart: [{ id, temp, on: [] }] → 문자열
export function encodeOrder(storeId, menuVer, k, cart) {
  const items = cart.map((c) => {
    const opts = [...(c.temp != null ? [c.temp] : []), ...(c.on || [])].join(",");
    return `${c.id}:${opts}:1`;
  }).join(";");
  const body = `MWQ1|${storeId}|${menuVer}|${k || ""}|${items}`;
  return `${body}|${crc16(body)}`;
}

// 문자열 → { ok, problems[], store, ver, k, items: [{ id, opts: [], qty }] } — 해석만(메뉴판 대조는 키오스크가)
export function decodeOrder(text) {
  const problems = [];
  const s = String(text || "").trim();
  const parts = s.split("|");
  if (parts[0] !== "MWQ1" || parts.length !== 6) return { ok: false, problems: ["내 방식 주문 QR이 아니에요"], items: [] };
  const [, store, ver, k, list, sum] = parts;
  if (crc16(parts.slice(0, 5).join("|")) !== sum) problems.push("QR 내용이 손상되었어요(체크섬이 맞지 않음) — 다시 읽거나 직원에게");
  const items = [];
  for (const seg of list.split(";").filter(Boolean)) {
    const [id, opts, qty] = seg.split(":");
    items.push({ id, opts: (opts || "").split(",").filter((x) => x !== "").map(Number), qty: Number(qty) });
  }
  if (!items.length) problems.push("주문 품목이 없어요");
  return { ok: !problems.length, problems, store, ver, k: /^\d{4}$/.test(k) ? k : "", rawK: k, items };
}
