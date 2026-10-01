# Apple HIG 디자인 원칙으로 본 풍차돌리기 개선점 (2026-10-02)

기준: [Human Interface Guidelines › Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)의 8가지 원칙 — Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight.

각 원칙마다 지금 잘 지키는 점과 개선점을 적었습니다. 맨 아래에 우선순위를 모았습니다.

---

## 1. Purpose — 가치를 만들고, 핵심에 집중하라

> "Prioritize your app's most important features … and focus on making those features truly great."

- **잘하는 점:** 앱의 핵심이 "이번 달에 무엇을 가입할지"로 분명하고, 할 일 목록이 그 역할을 합니다.
- **개선점**
  - **할 일이 있을 때는 할 일을 그래프보다 위에 두기.** 지금 순서는 풍차 → 전환 → 그래프 → 할 일이라, 이번 달에 할 일이 있어도 그래프를 지나야 보입니다. "지금 가입하세요"나 만기된 계좌가 있으면 할 일을 그래프 위로 올리세요.
  - **풍차 계산기 정리.** 풍차 만들기가 같은 계산(계좌당 금액, 늘어나는 납입액)을 이미 보여 줍니다. 계산기는 기능이 겹치니 없애거나, 풍차 만들기 안의 "자세히 계산"으로 합치는 편이 집중에 좋습니다.

## 2. Agency — 방해하지 말고, 실수에서 돌아올 수 있게

> "Help people recover from mistakes … Build forgiveness into your design."

- **잘하는 점:** 소개는 2장이고 건너뛸 수 있습니다. 시트는 언제든 취소할 수 있습니다.
- **개선점**
  - **해지·삭제 되돌리기.** 중도 해지와 만기 해지는 확인 창 하나로 바로 확정되고 되돌릴 방법이 없습니다. 처리 직후 "되돌리기" 토스트를 몇 초 보여 주고, 종료된 계좌에서도 "진행 중으로 되돌리기"를 할 수 있게 하세요. 계좌 삭제도 마찬가지입니다.
  - **목록에서 바로 처리.** 계좌 목록 행을 왼쪽으로 밀면 [해지]가 나오는 iOS 스와이프 동작을 넣으면, 상세 화면까지 들어가지 않아도 됩니다.

## 3. Responsibility — 투명하게, 정보를 안전하게

> "Provide a clear rationale when asking for permission … Keep people's information safe."

- **잘하는 점:** 알림 권한 전에 이유를 먼저 묻습니다. 데이터는 기기 안에만 있고 개인정보를 수집하지 않습니다.
- **개선점**
  - **앱 잠금(Face ID).** 금액과 은행 정보가 담긴 앱입니다. 설정에 "Face ID로 잠그기"를 선택 사항으로 두면 안심하고 쓸 수 있습니다.
  - **금리 출처 표시.** 금리 비교 맨 위에 "금융감독원 공시 · 2026년 9월 기준 · 기본 금리"를 눈에 띄게 두어, 은행 앱의 금리와 다를 수 있음을 미리 알립니다.

## 4. Familiarity — 익숙한 개념, 일관된 모양, 분명한 피드백

> "Keep visuals and interactions consistent … use system patterns to display alerts and offer choices."

- **잘하는 점:** iOS 기본 컨트롤(세그먼트, 시트, 달력, 확인 창)을 쓰고, 날개를 누르면 시계처럼 월이 보입니다.
- **개선점**
  - **버튼 모양 통일.** 지금 버튼이 세 종류로 섞여 있습니다. 큰 파란 버튼(풍차 만들기), 작은 파란 알약(가입했어요·만기 해지하고 다시 가입), 파란 글자 링크(금리 높은 상품 보기·해지만)입니다. 같은 무게의 행동은 같은 모양으로 맞추세요. 주 행동은 알약, 보조 행동은 글자 링크로 정합니다.
  - **iOS 메뉴 패턴.** "…" 메뉴는 잘 쓰고 있습니다. 계좌 목록 행에도 길게 누르면 나오는 메뉴(상세 보기·해지·삭제)를 붙이면 iOS 사용자에게 익숙합니다.

## 5. Flexibility — 모두를 위해, 맥락을 지키며

> "Treat accessibility as a priority from the start."

- **개선점 (중요)**
  - **다크 모드.** 지금 밝은 화면만 지원합니다(`userInterfaceStyle: light`). iOS 사용자 상당수가 다크 모드를 쓰고, HIG는 시스템 설정을 따르기를 기대합니다. 색을 토큰으로 두었으니 다크 색만 정하면 됩니다.
  - **큰 글자(Dynamic Type).** 글자 크기를 숫자로 고정한 곳이 많고, 일부는 확대를 막아 두었습니다. 설정에서 글자를 키우는 사람에게 할 일·금액이 잘리거나 겹치지 않는지 확인하고 맞춰야 합니다.
  - **VoiceOver.** 그래프 막대에 읽어 줄 이름이 없습니다. 막대마다 "9월 적금, 가입 7개월째, 5개월 남음"처럼 읽히게 하세요.
  - **iPad.** iPad에서 화면이 가로로 길게 늘어납니다. 내용 폭을 600 정도로 제한해 가운데 두세요.

## 6. Simplicity — 필요한 것만, 간결하게, 분명한 위계

> "Simplicity isn't minimalism. … keeps the important things close by and lets the others fall away."

- **잘하는 점:** 설명 문구를 크게 줄였고, 할 일은 다음 세 단계만 보입니다.
- **개선점**
  - **홈의 위계.** 할 일이 1번 원칙처럼 위로 올라오면, 그래프 카드는 "현황"으로 아래에 두는 위계가 자연스럽습니다.
  - **"총 N개 · 원금" 숫자의 의미.** 원금은 지금까지 넣은 돈입니다. 처음 보는 사람이 "원금"을 이해하기 어려울 수 있으니 "지금까지 모은 돈"처럼 풀어 쓰는 것을 고려하세요.

## 7. Craft — 품질이 인상을 만든다

> "Strive for stunning visuals, smooth animations, precise wording."

- **잘하는 점:** 날개가 자라는 애니메이션, 패럴랙스 스크롤, 진동 피드백이 들어갔습니다.
- **개선점**
  - **전환 애니메이션.** 적금/예금 전환 시 풍차와 그래프가 순간적으로 바뀝니다. 짧은 크로스페이드를 넣으면 같은 화면 안에서 바뀌었다는 것이 자연스럽게 느껴집니다.
  - **실기기 확인.** 시뮬레이터에서만 확인한 화면이 많습니다. Release 빌드를 실기기에서 써 보며 스크롤 성능과 키보드 동작을 확인하세요.

## 8. Delight — 결정적 순간을 만든다

> "Create defining moments. … Don't mistake delight for decoration."

- **개선점**
  - **풍차 완성 순간.** 12번째 날개를 채운 순간이 이 앱의 가장 큰 순간인데, 지금은 다른 날개를 채울 때와 같습니다. 한 번만 나오는 축하(풍차가 처음 돌기 시작하는 애니메이션과 강한 진동, "풍차가 돌기 시작했어요" 문구)를 넣으세요.
  - **첫 만기.** 처음 만기를 받는 달에 "첫 만기가 돌아왔어요"를 보여 주면, 풍차돌리기의 효과를 몸으로 느끼게 됩니다.

---

## 우선순위

| 순위 | 개선점 | 원칙 | 크기 |
| --- | --- | --- | --- |
| 1 | 할 일이 있으면 할 일을 그래프 위로 | Purpose · Simplicity | 작음 |
| 2 | 해지·삭제 되돌리기, 종료 계좌 복구 | Agency | 중간 |
| 3 | 다크 모드 | Flexibility | 중간 |
| 4 | 큰 글자·VoiceOver 대응 | Flexibility | 중간 |
| 5 | 풍차 완성 축하 순간 | Delight | 작음 |
| 6 | 버튼 모양 통일 | Familiarity | 작음 |
| 7 | 목록 스와이프·길게 누르기 메뉴 | Familiarity · Agency | 작음 |
| 8 | Face ID 잠금 | Responsibility | 중간 |
| 9 | 계산기 정리 | Purpose | 작음 |
| 10 | 적금/예금 전환 애니메이션, iPad 폭 제한 | Craft · Flexibility | 작음 |
