# 내 방식 QR (My Way QR)

키오스크 앞에서 망설이는 사람을 위해, **휴대폰에 한 번 저장한 내 방식**(큰 글씨·또렷한 색·쉬운 말·천천히 읽어 주기·큰 버튼·한 화면에 한 가지씩)대로 주문 화면을 바꿔 보여 주는 시제품입니다.

- 시연: https://tiger3c.github.io/my-way-qr/ — [한 기기로 체험](https://tiger3c.github.io/my-way-qr/demo.html) · [내 방식 정하기](https://tiger3c.github.io/my-way-qr/my.html) · [키오스크 화면](https://tiger3c.github.io/my-way-qr/kiosk.html) · [운영자 화면](https://tiger3c.github.io/my-way-qr/admin.html)
- 2026 AI 라이프 솔루션 챌린지(산업통상부·한국산업기술기획평가원) 응모용 시제품 — 「AI 라이프 아이디어 챌린지」 수상 후보작 「내 방식 QR」을 구현했습니다
- 가상 매장 「카페 한모금」과 가상 메뉴 30개로 시연합니다(실존 매장·상표 아님). 주문·결제는 실제로 이루어지지 않습니다

## 흐름
1. **내 방식 정하기**(휴대폰): 필요한 기능만 켭니다. 장애 여부·병명은 묻지 않고 기능 코드만 저장하며, 저장 위치는 그 휴대폰 브라우저 안(localStorage)입니다
2. **키오스크 QR 찍기**: 키오스크의 「내 방식으로 주문」 QR을 휴대폰 카메라로 찍습니다(못 찍으면 네 자리 번호 입력)
3. **내 화면으로 주문**: 같은 메뉴·같은 가격이 내 방식으로 나옵니다. 고를 것은 하나씩 묻고, 결제 전에 한 번 더 확인하고, 언제든 「직원 부르기」를 누를 수 있습니다

## AI가 하는 일
- 매장이 메뉴를 등록할 때 **한 번**, 브라우저 안 AI(Qwen2.5-1.5B-Instruct, WebLLM·WebGPU)가 메뉴 설명과 옵션 이름을 **쉬운 말**로 바꿉니다
- 결과는 규칙 검사(숫자 금지, 원문에 없는 재료·사실, 빠진 주재료, 지어낸 조리법, 옵션 개수·뜻, 분류, 명령문, 길이, 특수 문자)를 통과한 것만 쓰고, 통과하지 못하면 다시 한 번 만들고, 그래도 안 되면 **원문을 그대로** 씁니다
- 메뉴 이름·가격·알레르기 정보는 AI가 건드리지 않고 매장 원본 값을 그대로 보여 줍니다
- 손님 휴대폰에서는 AI를 돌리지 않습니다(저장된 결과를 바로 보여 줌). WebGPU가 없는 기기의 운영자 화면은 저장된 결과와 그 판정을 보여 줍니다
- 저장된 결과(`assets/easy-hanmogeum.json`)는 같은 방식을 같은 계열 모델(Qwen2.5-1.5B-Instruct q4_k_m, llama.cpp)로 돌려 만든 것입니다: 30개 중 AI 쉬운 말 20개, 원문 유지 10개

## 사용한 것
| 이름 | 쓰는 곳 | 라이선스 |
|---|---|---|
| [WebLLM](https://github.com/mlc-ai/web-llm) 0.2.86 | 운영자 화면의 브라우저 AI 실행 | Apache-2.0 |
| [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) | 쉬운 말 변환 모델 | Apache-2.0 |
| [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 | 키오스크 QR 생성 | MIT |
| 브라우저 내장 Web Speech API | 읽어 주기 | — |

서버가 없습니다(GitHub Pages 정적 배포). 이 저장소의 코드와 자료는 열람만 허용하며, 라이선스는 아직 정하지 않았습니다(권리 관계 확인 중).
