import type {
  PracticeFeedback,
  PracticeSkillId,
  PracticeTopic,
} from "@/lib/learning/practice-progress";

export const koreanTopics: Record<PracticeTopic, string> = {
  multiplication: "곱셈과 나눗셈",
  fractions: "분수",
  decimals: "소수",
  percentages: "백분율",
};

export const koreanFeedback: Record<PracticeFeedback, string> = {
  understand: "이해했어요",
  guessed: "추측해서 풀었어요",
  confusing: "헷갈렸어요",
  "too-hard": "너무 어려웠어요",
};

export const koreanSupportNotes: Record<PracticeTopic, string> = {
  multiplication:
    "하임이가 연결되는 곱셈식과 나눗셈식을 소리 내어 말한 뒤, 관련 이야기 문제 하나를 천천히 풀어보게 해주세요.",
  fractions:
    "길이가 같은 막대를 먼저 그려주세요. 전체가 무엇인지 묻고, 분모로 한 부분을 구한 뒤 분자만큼 모아보세요.",
  decimals:
    "소수점을 나란히 맞추고 하임이가 각 수를 자릿값으로 읽어보게 해주세요.",
  percentages:
    "무엇을 전체로 보는지 먼저 묻고, 50%, 25%, 10%, 5%처럼 구하기 쉬운 백분율을 활용해보세요.",
};

export const koreanParentMoves: Record<PracticeSkillId, string> = {
  "fact-families":
    "연결되는 곱셈식과 나눗셈식을 모두 소리 내어 말해보게 해주세요.",
  "equal-groups":
    "한 묶음이 무엇이고, 같은 크기의 묶음이 몇 개인지 물어보세요.",
  "missing-factors": "어떤 곱셈식으로 전체 개수를 만들 수 있는지 물어보세요.",
  "division-meaning": "답이 이야기에서 무엇을 뜻하는지 물어보세요.",
  arrays: "행을 먼저 세고, 그다음 열을 세어보게 해주세요.",
  "fraction-of-amount": "풀기 전에 전체가 무엇인지 물어보세요.",
  "equivalent-fractions":
    "길이가 같은 막대 두 개를 그리고 색칠한 양을 비교해보세요.",
  "simplifying-fractions":
    "분자와 분모를 모두 나누어떨어지게 하는 수가 무엇인지 물어보세요.",
  "fraction-number-line":
    "같은 크기로 몇 번 이동해야 전체 1이 되는지 물어보세요.",
  "comparing-fractions": "각 분수가 절반보다 작은지, 같은지, 큰지 물어보세요.",
  "decimal-comparison":
    "두 소수를 10분의 몇 또는 100분의 몇으로 읽어보게 해주세요.",
  "decimal-operations": "답의 소수점이 어디에 놓여야 하는지 물어보세요.",
  "decimal-place-value": "수를 자릿값으로 읽어보게 해주세요.",
  "powers-of-10":
    "값이 커지려면 숫자가 어느 방향으로 몇 자리 이동해야 하는지 물어보세요.",
  "benchmark-percent":
    "계산하기 전에 무엇을 전체로 보고 백분율을 구하는지 물어보세요.",
  "percent-conversion": "같은 값을 두 가지 다른 형태로 말해보게 해주세요.",
  discounts: "문제가 할인 금액을 묻는지, 최종 가격을 묻는지 물어보세요.",
  "find-the-whole": "알고 있는 부분이 전체의 몇 퍼센트인지 먼저 물어보세요.",
};

type KoreanSkill = {
  name: string;
  learnFocus: string;
  say: string;
  tryTogether: string;
  makeItFun: string;
  watchFor: string;
};

export const koreanSkills: Record<PracticeSkillId, KoreanSkill> = {
  "fact-families": {
    name: "곱셈과 나눗셈의 관계",
    learnFocus: "곱셈식 하나에서 연결되는 나눗셈식 두 개를 찾아봅니다.",
    say: "곱셈 하나를 알면 나눗셈도 알 수 있어. 6 × 7 = 42라면 어떤 나눗셈식 두 개를 만들 수 있을까?",
    tryTogether:
      "곱셈식 하나를 쓰고, 하임이가 옆에 나눗셈식 두 개를 써보게 해주세요.",
    makeItFun:
      "곱셈식을 말하며 발차기 한 번, 나눗셈식 두 개를 말하며 주먹지르기 두 번을 해보세요.",
    watchFor:
      "곱셈과 연결하지 않고 나눗셈을 별개의 암기 문제로 생각하는지 살펴보세요.",
  },
  "equal-groups": {
    name: "같은 크기의 묶음",
    learnFocus: "같은 개수로 이루어진 묶음을 찾고 곱셈식으로 나타냅니다.",
    say: "계산하기 전에 묶음부터 찾아보자. 몇 묶음이고, 한 묶음에 몇 개씩 있을까?",
    tryTogether: "상자 4개에 점을 6개씩 그리고 아래에 4 × 6을 써보세요.",
    makeItFun:
      "치어리딩 팀 4개가 박수를 6번씩 친다고 상상하며 총 박수 횟수를 세어보세요.",
    watchFor: "같은 크기의 묶음을 알아보지 못하고 두 수를 더하는지 살펴보세요.",
  },
  "missing-factors": {
    name: "곱셈식의 빈칸 찾기",
    learnFocus: "나눗셈으로 빈칸을 구한 뒤 원래 곱셈식에 넣어 확인합니다.",
    say: "전체 개수는 이미 알고 있어. 이 수에 무엇을 곱해야 전체 개수가 될까?",
    tryTogether:
      "8 × ? = 56을 56 ÷ 8로 바꾸어 풀고, 곱셈으로 다시 확인해보세요.",
    makeItFun:
      "빈칸을 비밀 상자라고 부르고 하임이가 숨겨진 숫자를 밝혀보게 해주세요.",
    watchFor: "추측한 답을 원래 곱셈식에 넣어 확인하는지 살펴보세요.",
  },
  "division-meaning": {
    name: "나눗셈의 의미",
    learnFocus: "묶음의 개수를 구하는지, 한 묶음의 크기를 구하는지 구분합니다.",
    say: "지금 구하는 건 묶음이 몇 개인지일까, 한 묶음에 몇 개가 들어가는지일까?",
    tryTogether:
      "스티커 36개를 봉투 6개에 똑같이 나누고, 한 봉투에 몇 개씩 들어가는지 물어보세요.",
    makeItFun: "간식이나 만들기 재료를 공평하게 나누는 이야기로 연습해보세요.",
    watchFor:
      "숫자만 답하지 않고 그 숫자가 이야기에서 무엇을 뜻하는지 설명하는지 살펴보세요.",
  },
  arrays: {
    name: "배열로 보는 곱셈",
    learnFocus: "행과 열을 세어 규칙적인 배열을 곱셈식으로 나타냅니다.",
    say: "가로줄이 몇 줄인지, 한 줄에 몇 개씩 있는지 세어보자. 두 수를 곱하면 전체 개수가 돼.",
    tryTogether:
      "작은 사각형을 한 줄에 7개씩 5줄 그리고, 하나씩 세는 대신 줄 단위로 세어보세요.",
    makeItFun: "K-pop 공연장의 작은 좌석 배치도를 만들어보세요.",
    watchFor: "한 줄만 세거나 줄 수와 전체 개수를 혼동하는지 살펴보세요.",
  },
  "fraction-of-amount": {
    name: "전체 양의 분수만큼 구하기",
    learnFocus: "먼저 분모로 나누어 한 부분을 구한 뒤 분자만큼 모읍니다.",
    say: "분모는 전체를 몇 묶음으로 똑같이 나눌지 알려줘. 먼저 한 묶음이 얼마인지 찾아보자.",
    tryTogether:
      "20의 3/4을 구할 때 20개를 4묶음으로 똑같이 나누고 그중 3묶음을 모아보세요.",
    makeItFun:
      "케이크 그림, 만들기 구슬, 스티커를 이용해 같은 크기의 묶음에 동그라미를 쳐보세요.",
    watchFor:
      "분모와 분자의 역할을 혼동하는지 확인하세요. 분자를 먼저 곱해도 같은 답이 나오지만, 이해를 위해 한 부분부터 구해보세요.",
  },
  "equivalent-fractions": {
    name: "크기가 같은 분수",
    learnFocus: "분자와 분모에 같은 수를 곱해 크기가 같은 분수를 만듭니다.",
    say: "양은 그대로야. 같은 전체를 더 작은 조각으로 똑같이 나눈 것뿐이야.",
    tryTogether:
      "길이가 같은 막대 두 개를 그리고 하나는 1/2, 다른 하나는 2/4만큼 색칠해보세요.",
    makeItFun: "종이 띠를 접어서 1/2이 2/4이나 3/6과 같다는 것을 보여주세요.",
    watchFor:
      "숫자가 다르게 생겼다는 이유만으로 양도 다르다고 생각하는지 살펴보세요.",
  },
  "simplifying-fractions": {
    name: "분수의 약분",
    learnFocus: "분자와 분모를 같은 공약수로 나누어 간단히 나타냅니다.",
    say: "위아래 두 수를 모두 나누어떨어지게 하는 수가 있을까?",
    tryTogether:
      "6/8의 분자와 분모를 모두 2로 나누고, 3/4과 같은 양임을 그림으로 확인해보세요.",
    makeItFun:
      "값은 그대로 두고 더 간단하게 정리하는 '분수 정리 놀이'를 해보세요.",
    watchFor:
      "분자만 나누거나 위아래를 서로 다른 수로 나누지 않는지 살펴보세요.",
  },
  "fraction-number-line": {
    name: "수직선 위의 분수",
    learnFocus: "0부터 1까지를 똑같은 간격으로 나누어 분수의 위치를 찾습니다.",
    say: "분모는 0에서 1까지 똑같은 크기로 몇 번 이동해야 하는지 알려줘.",
    tryTogether:
      "0부터 1까지를 5칸으로 똑같이 나누고, 0에서 세 칸 이동해 3/5를 표시해보세요.",
    makeItFun: "수직선을 체조 평균대라고 생각하며 한 칸씩 이동해보세요.",
    watchFor: "눈금 사이의 간격이 아니라 눈금 표시 자체를 세는지 살펴보세요.",
  },
  "comparing-fractions": {
    name: "분수의 크기 비교",
    learnFocus:
      "분모를 같게 하거나, 1/2을 기준으로 삼거나, 그림으로 크기를 비교합니다.",
    say: "숫자만 보지 말고 양을 비교해보자. 각 분수는 절반보다 작을까, 같을까, 클까?",
    tryTogether:
      "길이가 같은 막대에 3/8과 5/8을 색칠하고 어느 쪽이 더 큰지 비교해보세요.",
    makeItFun:
      "'절반보다 작음, 절반, 절반보다 큼' 세 칸으로 분수 카드를 분류해보세요.",
    watchFor: "분모가 크면 분수도 무조건 크다고 생각하는지 살펴보세요.",
  },
  "decimal-comparison": {
    name: "소수의 크기 비교",
    learnFocus: "자릿값을 맞추고 필요하면 끝에 0을 붙여 비교합니다.",
    say: "자릿값을 맞춰보자. 0.7은 0.70으로 써도 같으니까 100분의 몇인지 비교할 수 있어.",
    tryTogether: "0.6, 0.56, 0.65를 각각 100분의 몇인지 말하며 비교해보세요.",
    makeItFun:
      "돈으로 생각해보세요. 0.70달러는 70센트이고 0.56달러는 56센트예요.",
    watchFor:
      "56이 7보다 크다는 이유로 0.56이 0.7보다 크다고 생각하는지 살펴보세요.",
  },
  "decimal-operations": {
    name: "소수의 덧셈과 뺄셈",
    learnFocus: "소수점을 맞춰 같은 자릿값끼리 더하거나 뺍니다.",
    say: "소수점을 세로로 나란히 맞추면 같은 자릿값끼리 계산할 수 있어.",
    tryTogether: "3.45 + 1.2를 3.45 + 1.20으로 세로로 써서 계산해보세요.",
    makeItFun:
      "카페 놀이로 메뉴 가격을 정하고 하임이가 영수증 합계를 구해보게 해주세요.",
    watchFor: "소수점을 맞추지 않고 숫자의 끝만 맞춰 쓰는지 살펴보세요.",
  },
  "decimal-place-value": {
    name: "소수의 자릿값",
    learnFocus:
      "소수 첫째, 둘째, 셋째 자리의 값을 각각 1/10, 1/100, 1/1000과 연결합니다.",
    say: "소수를 자릿값으로 읽어보자. 0.36은 100분의 36이야.",
    tryTogether:
      "일의 자리, 소수 첫째 자리, 둘째 자리, 셋째 자리를 적은 표에 숫자를 놓아보세요.",
    makeItFun:
      "각 자리를 엘리베이터 층으로 생각하고 숫자가 어느 층에 있는지 말해보세요.",
    watchFor:
      "자릿값을 생각하지 않고 소수점 뒤 숫자를 자연수처럼만 읽는지 살펴보세요.",
  },
  "powers-of-10": {
    name: "10, 100, 1000 곱하기",
    learnFocus:
      "10, 100, 1000을 곱할 때 각 숫자의 자릿값이 어떻게 바뀌는지 이해합니다.",
    say: "100을 곱하면 각 숫자가 자릿값 표에서 두 칸 왼쪽으로 이동해. 값이 100배 커지는 거야.",
    tryTogether:
      "자릿값 표에서 0.48의 숫자를 두 칸 왼쪽으로 옮겨 0.48 × 100 = 48을 확인해보세요.",
    makeItFun:
      "숫자들이 기차를 타고 왼쪽으로 두 정거장 이동한다고 상상해보세요.",
    watchFor: "자릿값을 생각하지 않고 무조건 뒤에 0을 붙이는지 살펴보세요.",
  },
  "benchmark-percent": {
    name: "기준 백분율 활용하기",
    learnFocus: "50%, 25%, 10%, 5%처럼 구하기 쉬운 백분율을 활용합니다.",
    say: "무엇을 전체로 보고 구하는 걸까? 전체를 알면 쉬운 백분율부터 구할 수 있어.",
    tryTogether:
      "80의 10%를 구한 뒤, 그 값을 세 배 하여 80의 30%를 구해보세요.",
    makeItFun: "100칸 표에서 10%, 25%, 50%만큼 색칠해보세요.",
    watchFor: "백분율 숫자 자체를 답으로 쓰는지 살펴보세요.",
  },
  "percent-conversion": {
    name: "백분율·분수·소수 바꾸기",
    learnFocus: "같은 양을 백분율, 분수, 소수로 나타내고 서로 연결합니다.",
    say: "퍼센트는 100분의 얼마라는 뜻이야. 분수나 소수로도 나타낼 수 있어.",
    tryTogether:
      "40%를 40/100으로 쓰고 2/5로 약분한 뒤, 소수로 0.4라고 말해보세요.",
    makeItFun: "같은 값을 나타내는 백분율·분수·소수 카드 세 장을 짝지어보세요.",
    watchFor: "약분을 빠뜨리거나 0.4와 0.04를 혼동하는지 살펴보세요.",
  },
  discounts: {
    name: "할인 금액과 최종 가격",
    learnFocus:
      "할인되는 금액을 먼저 구한 뒤 원래 가격에서 빼 최종 가격을 구합니다.",
    say: "먼저 얼마가 할인되는지 구하자. 문제는 할인 금액을 묻고 있을까, 실제로 내는 가격을 묻고 있을까?",
    tryTogether:
      "HK$100에서 20% 할인하면 할인 금액은 HK$20, 최종 가격은 HK$80이라고 구분해서 말해보세요.",
    makeItFun:
      "할인 가격표를 붙여 가게 놀이를 하고 더 유리한 가격을 골라보세요.",
    watchFor: "최종 가격을 묻는 문제에 할인 금액을 답하는지 살펴보세요.",
  },
  "find-the-whole": {
    name: "부분에서 전체 구하기",
    learnFocus: "알고 있는 부분이 전체의 몇 퍼센트인지 보고 100%를 구합니다.",
    say: "전체 중 한 부분의 값을 알고 있어. 같은 크기의 부분을 모아 100%를 만들어보자.",
    tryTogether:
      "15가 전체의 25%라면 25%는 1/4이므로 전체는 15 × 4 = 60이라고 설명해보세요.",
    makeItFun:
      "퍼즐 조각 하나를 알면 전체 그림을 완성할 수 있다고 이야기해보세요.",
    watchFor:
      "알고 있는 양이 전체의 몇 퍼센트인지 확인하기 전에 계산부터 하는지 살펴보세요.",
  },
};
