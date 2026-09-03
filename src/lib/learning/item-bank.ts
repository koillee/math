import type { MathItem, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const ITEM_TYPES = ["Diagnostic", "Review", "Retention", "Misconception Repair", "Transfer", "Explanation", "Challenge"] as const;
export const TRANSFER_LEVELS = ["none", "near", "medium", "far"] as const;

type ItemType = (typeof ITEM_TYPES)[number];
type TransferLevel = (typeof TRANSFER_LEVELS)[number];

type CommonWrongAnswer = { answer: string; misconceptionId?: string; reason: string };
type ExplanationRubric = { strong: string[]; partial: string[]; watchFor: string[]; evidencePurpose: string };

export type MathItemSeed = {
  itemId: string;
  subject: string;
  yearGroup: string;
  domain: string;
  strand: string;
  skillNodeId: string;
  title: string;
  itemType: ItemType;
  sequence: number;
  difficulty: number;
  prompt: string;
  expectedAnswer: string;
  acceptedAnswers: string[];
  commonWrongAnswers: CommonWrongAnswer[];
  misconceptionIds: string[];
  explanationRubric: ExplanationRubric;
  representationOptions: string[];
  placeholder: string;
  transferLevel: TransferLevel;
  evidenceCategory: string;
  evidenceWeight: number;
  active: boolean;
  version: string;
};

type ItemInput = Omit<MathItemSeed, "subject" | "yearGroup" | "domain" | "active" | "version" | "explanationRubric"> & {
  domain?: string;
  explanationRubric?: Partial<ExplanationRubric>;
};

const DEFAULT_DOMAIN = "Fractions, Decimals & Percentages";
const VERSION = "v2-sprint-f-multi-domain";

function item({ explanationRubric, ...input }: ItemInput): MathItemSeed {
  return {
    subject: "Mathematics",
    yearGroup: "Year 6",
    domain: DEFAULT_DOMAIN,
    active: true,
    version: VERSION,
    ...input,
    explanationRubric: {
      strong: explanationRubric?.strong ?? ["Names the mathematical structure", "Uses a representation or equivalent form", "Connects answer to the whole or unit"],
      partial: explanationRubric?.partial ?? ["Gives correct answer with limited reasoning", "Uses a procedure but does not explain why it works"],
      watchFor: explanationRubric?.watchFor ?? ["Correctness without explanation", "Whole-number reasoning applied to fractional quantities"],
      evidencePurpose: explanationRubric?.evidencePurpose ?? `${input.itemType} evidence for ${input.skillNodeId}`,
    },
  };
}

export const itemBankSeeds: MathItemSeed[] = [
  item({
    itemId: "q1",
    strand: "Fractions",
    skillNodeId: "FRA-004",
    title: "Unit fraction size",
    itemType: "Diagnostic",
    sequence: 1,
    difficulty: 2,
    prompt: "Which is larger: 1/4 or 1/8? Explain briefly.",
    expectedAnswer: "1/4 is larger because fourths are larger equal parts than eighths when the whole is the same.",
    acceptedAnswers: ["1/4", "quarter", "one quarter"],
    commonWrongAnswers: [{ answer: "1/8", misconceptionId: "MISC-FRA-001", reason: "Compares denominator size as a whole number." }],
    misconceptionIds: ["MISC-FRA-001"],
    explanationRubric: { evidencePurpose: "Checks inverse relationship between denominator size and unit fraction size." },
    representationOptions: ["number line", "fraction strips", "mental comparison"],
    placeholder: "Type 1/4 or 1/8 and explain why",
    transferLevel: "none",
    evidenceCategory: "Conceptual Understanding",
    evidenceWeight: 82,
  }),
  item({
    itemId: "q2",
    strand: "Fractions",
    skillNodeId: "FRA-006",
    title: "Unlike denominator addition",
    itemType: "Diagnostic",
    sequence: 2,
    difficulty: 3,
    prompt: "Calculate 1/3 + 1/4. Explain why your method works.",
    expectedAnswer: "7/12, because thirds and fourths must be renamed as twelfths before adding same-sized parts.",
    acceptedAnswers: ["7/12", "seven twelfths"],
    commonWrongAnswers: [{ answer: "2/7", misconceptionId: "MISC-FRA-002", reason: "Adds numerators and denominators separately." }],
    misconceptionIds: ["MISC-FRA-002", "MISC-FRA-004"],
    explanationRubric: { evidencePurpose: "Checks whether common denominators are understood as common units, not only a rule." },
    representationOptions: ["common denominator", "area model", "number line"],
    placeholder: "Example: 7/12 because...",
    transferLevel: "none",
    evidenceCategory: "Numerical Fluency",
    evidenceWeight: 88,
  }),
  item({
    itemId: "q3",
    strand: "Fractions",
    skillNodeId: "FRA-001",
    title: "Equivalent fractions",
    itemType: "Diagnostic",
    sequence: 3,
    difficulty: 2,
    prompt: "Which fraction is equivalent to 2/3: 3/5, 4/6, or 5/9?",
    expectedAnswer: "4/6 is equivalent to 2/3 because numerator and denominator are both scaled by 2.",
    acceptedAnswers: ["4/6", "four sixths"],
    commonWrongAnswers: [{ answer: "3/5", misconceptionId: "MISC-FRA-003", reason: "Equivalent scaling relationship is uncertain." }],
    misconceptionIds: ["MISC-FRA-003"],
    representationOptions: ["scaling", "fraction strips", "multiplication facts"],
    placeholder: "Type the equivalent fraction and explain",
    transferLevel: "none",
    evidenceCategory: "Conceptual Understanding",
    evidenceWeight: 78,
  }),
  item({
    itemId: "q4",
    strand: "Decimals",
    skillNodeId: "DEC-002",
    title: "Decimal comparison",
    itemType: "Diagnostic",
    sequence: 4,
    difficulty: 2,
    prompt: "Which is larger: 0.7 or 0.56? Explain how you know.",
    expectedAnswer: "0.7 is larger because 0.7 is 70 hundredths and 70 hundredths is greater than 56 hundredths.",
    acceptedAnswers: ["0.7", "0.70", "seven tenths"],
    commonWrongAnswers: [{ answer: "0.56", misconceptionId: "MISC-DEC-001", reason: "Treats decimals as whole-number strings." }],
    misconceptionIds: ["MISC-DEC-001"],
    representationOptions: ["place value", "number line", "money/measure"],
    placeholder: "Type 0.7 or 0.56 and explain",
    transferLevel: "none",
    evidenceCategory: "Conceptual Understanding",
    evidenceWeight: 80,
  }),
  item({
    itemId: "q5",
    strand: "Fractions-Decimals-Percentages Connections",
    skillNodeId: "FDP-005",
    title: "Benchmark percentage",
    itemType: "Diagnostic",
    sequence: 5,
    difficulty: 2,
    prompt: "What is 25% of 80?",
    expectedAnswer: "20, because 25% is one quarter and one quarter of 80 is 20.",
    acceptedAnswers: ["20", "twenty"],
    commonWrongAnswers: [{ answer: "25", misconceptionId: "MISC-PCT-001", reason: "Treats percent as the answer rather than a ratio of the whole." }],
    misconceptionIds: ["MISC-PCT-001"],
    representationOptions: ["fraction equivalent", "percent bar", "mental strategy"],
    placeholder: "Type the answer and your method",
    transferLevel: "none",
    evidenceCategory: "Numerical Fluency",
    evidenceWeight: 78,
  }),
  item({
    itemId: "q6",
    strand: "Fractions-Decimals-Percentages Connections",
    skillNodeId: "FDP-007",
    title: "Percentage comparison",
    itemType: "Diagnostic",
    sequence: 6,
    difficulty: 4,
    prompt: "Class A: 18 out of 60 students chose football. Class B: 12 out of 30 chose football. Which class had the higher percentage?",
    expectedAnswer: "Class B, because Class A is 30% and Class B is 40%.",
    acceptedAnswers: ["Class B", "B", "40%"],
    commonWrongAnswers: [{ answer: "Class A", misconceptionId: "MISC-PCT-004", reason: "Compares raw counts rather than percentages with different wholes." }],
    misconceptionIds: ["MISC-PCT-002", "MISC-PCT-004"],
    explanationRubric: { evidencePurpose: "Checks base-rate reasoning across unequal totals." },
    representationOptions: ["percent conversion", "ratio table", "fraction comparison"],
    placeholder: "Class A or Class B, with reason",
    transferLevel: "medium",
    evidenceCategory: "Mathematical Reasoning",
    evidenceWeight: 94,
  }),
  item({
    itemId: "q7",
    strand: "Percentages",
    skillNodeId: "V2-FDP-001",
    title: "Percent as operator",
    itemType: "Diagnostic",
    sequence: 7,
    difficulty: 3,
    prompt: "A $50 book has a 10% discount. How much money is taken off?",
    expectedAnswer: "$5 is taken off, because 10% means one tenth of 50.",
    acceptedAnswers: ["5", "$5", "five dollars"],
    commonWrongAnswers: [{ answer: "$40", misconceptionId: "MISC-PCT-003", reason: "Confuses discount amount with final price or subtracts 10 as a whole number." }],
    misconceptionIds: ["MISC-PCT-001", "MISC-PCT-003"],
    representationOptions: ["10% strategy", "decimal multiplication", "bar model"],
    placeholder: "Type the discount amount and method",
    transferLevel: "near",
    evidenceCategory: "Mathematical Modeling",
    evidenceWeight: 88,
  }),
  item({
    itemId: "q8",
    strand: "Fractions-Decimals-Percentages Connections",
    skillNodeId: "FDP-001",
    title: "FDP equivalence",
    itemType: "Diagnostic",
    sequence: 8,
    difficulty: 2,
    prompt: "Write 3/4 as a decimal and a percentage.",
    expectedAnswer: "3/4 = 0.75 = 75%.",
    acceptedAnswers: ["0.75 and 75%", ".75 and 75%", "75/100"],
    commonWrongAnswers: [{ answer: "0.34", misconceptionId: "MISC-FRA-003", reason: "Does not connect three quarters to hundredths." }],
    misconceptionIds: ["MISC-FRA-003"],
    representationOptions: ["hundred grid", "division", "known equivalence"],
    placeholder: "Example: 0.__ and __%",
    transferLevel: "none",
    evidenceCategory: "Representation",
    evidenceWeight: 78,
  }),
  item({
    itemId: "q9",
    strand: "Fractions",
    skillNodeId: "V2-FRA-001",
    title: "Fraction as operator",
    itemType: "Diagnostic",
    sequence: 9,
    difficulty: 2,
    prompt: "What is 1/2 of 36? Explain what 'of' means here.",
    expectedAnswer: "18; 'of' means acting on the quantity, so one half of 36 is 36 divided into two equal groups.",
    acceptedAnswers: ["18", "eighteen"],
    commonWrongAnswers: [{ answer: "36/2 only, no meaning", misconceptionId: "MISC-FRA-006", reason: "May know procedure but not fraction-as-operator meaning." }],
    misconceptionIds: ["MISC-FRA-006"],
    representationOptions: ["bar model", "division", "scaling"],
    placeholder: "Type the answer and explanation",
    transferLevel: "near",
    evidenceCategory: "Conceptual Understanding",
    evidenceWeight: 84,
  }),
  item({
    itemId: "q10",
    strand: "Decimals",
    skillNodeId: "DEC-004",
    title: "Decimal scaling",
    itemType: "Diagnostic",
    sequence: 10,
    difficulty: 2,
    prompt: "Calculate 3.4 × 100. Explain what happens to the place value.",
    expectedAnswer: "340, because multiplying by 100 moves each digit two place-value positions greater.",
    acceptedAnswers: ["340", "three hundred forty"],
    commonWrongAnswers: [{ answer: "3.400", misconceptionId: "MISC-DEC-002", reason: "Treats ×100 as adding zeros without place-value scaling." }],
    misconceptionIds: ["MISC-DEC-002"],
    representationOptions: ["place value chart", "powers of ten", "mental scaling"],
    placeholder: "Type the answer and explanation",
    transferLevel: "none",
    evidenceCategory: "Numerical Fluency",
    evidenceWeight: 80,
  }),
  item({
    itemId: "q11",
    domain: "Number & Operations",
    strand: "Number",
    skillNodeId: "NUM-001",
    title: "Large-number place value",
    itemType: "Diagnostic",
    sequence: 11,
    difficulty: 2,
    prompt: "In 506,080, what is the value of the 6? Explain how you know.",
    expectedAnswer: "The 6 is worth 6,000 because it is in the thousands place.",
    acceptedAnswers: ["6000", "6,000", "six thousand"],
    commonWrongAnswers: [{ answer: "600", misconceptionId: "MISC-NUM-001", reason: "Reads the digit without its correct place-value column." }],
    misconceptionIds: ["MISC-NUM-001"],
    representationOptions: ["place value chart", "expanded form", "digit cards"],
    placeholder: "Value of the 6 and why",
    transferLevel: "none",
    evidenceCategory: "Conceptual Understanding",
    evidenceWeight: 76,
  }),
  item({
    itemId: "q12",
    domain: "Number & Operations",
    strand: "Operations",
    skillNodeId: "NUM-006",
    title: "Order of operations",
    itemType: "Diagnostic",
    sequence: 12,
    difficulty: 3,
    prompt: "Calculate 6 + 4 × 3. Explain the order you used.",
    expectedAnswer: "18, because multiplication is completed before addition: 4 × 3 = 12, then 6 + 12 = 18.",
    acceptedAnswers: ["18", "eighteen"],
    commonWrongAnswers: [{ answer: "30", misconceptionId: "MISC-NUM-004", reason: "Calculates strictly left-to-right instead of using operation priority." }],
    misconceptionIds: ["MISC-NUM-004"],
    representationOptions: ["operation steps", "bar model", "mental calculation"],
    placeholder: "Answer and order used",
    transferLevel: "near",
    evidenceCategory: "Numerical Fluency",
    evidenceWeight: 82,
  }),
  item({
    itemId: "q13",
    domain: "Number & Operations",
    strand: "Number properties",
    skillNodeId: "NUM-005",
    title: "Factors and multiples",
    itemType: "Diagnostic",
    sequence: 13,
    difficulty: 2,
    prompt: "List all factors of 18. Explain how you know the list is complete.",
    expectedAnswer: "1, 2, 3, 6, 9 and 18 are factors of 18 because each divides 18 exactly.",
    acceptedAnswers: ["1, 2, 3, 6, 9, 18", "1 2 3 6 9 18"],
    commonWrongAnswers: [{ answer: "18, 36, 54", misconceptionId: "MISC-NUM-003", reason: "Lists multiples instead of factors." }],
    misconceptionIds: ["MISC-NUM-003"],
    representationOptions: ["factor pairs", "array model", "division facts"],
    placeholder: "Factors and how you checked",
    transferLevel: "none",
    evidenceCategory: "Conceptual Understanding",
    evidenceWeight: 78,
  }),
  item({
    itemId: "q14",
    domain: "Ratio, Proportion & Rates",
    strand: "Ratio",
    skillNodeId: "RPR-002",
    title: "Equivalent ratio",
    itemType: "Diagnostic",
    sequence: 14,
    difficulty: 2,
    prompt: "Which ratio is equivalent to 2:3 — 4:6, 4:5, or 5:6? Explain why.",
    expectedAnswer: "4:6 is equivalent to 2:3 because both parts are multiplied by 2.",
    acceptedAnswers: ["4:6", "4 to 6", "four to six"],
    commonWrongAnswers: [{ answer: "4:5", misconceptionId: "MISC-RPR-001", reason: "Adds the same amount to both parts instead of scaling." }],
    misconceptionIds: ["MISC-RPR-001"],
    representationOptions: ["ratio table", "scaling", "double number line"],
    placeholder: "Equivalent ratio and why",
    transferLevel: "near",
    evidenceCategory: "Conceptual Understanding",
    evidenceWeight: 82,
  }),
  item({
    itemId: "q15",
    domain: "Ratio, Proportion & Rates",
    strand: "Ratio",
    skillNodeId: "RPR-003",
    title: "Sharing in a ratio",
    itemType: "Diagnostic",
    sequence: 15,
    difficulty: 3,
    prompt: "Share 40 counters in the ratio 2:3. How many counters are in each part?",
    expectedAnswer: "16 and 24, because there are 5 total parts, each part is 8, so 2 parts is 16 and 3 parts is 24.",
    acceptedAnswers: ["16 and 24", "16, 24", "24 and 16"],
    commonWrongAnswers: [{ answer: "20 and 30", misconceptionId: "MISC-RPR-003", reason: "Does not use the total number of ratio parts." }],
    misconceptionIds: ["MISC-RPR-002", "MISC-RPR-003"],
    representationOptions: ["bar model", "ratio table", "unit parts"],
    placeholder: "Two shares and method",
    transferLevel: "medium",
    evidenceCategory: "Mathematical Reasoning",
    evidenceWeight: 88,
  }),
  item({
    itemId: "q16",
    domain: "Ratio, Proportion & Rates",
    strand: "Rates",
    skillNodeId: "RPR-005",
    title: "Unit rate",
    itemType: "Diagnostic",
    sequence: 16,
    difficulty: 3,
    prompt: "Six notebooks cost $18. What is the cost per notebook? Explain the unit rate.",
    expectedAnswer: "$3 per notebook, because 18 divided by 6 is 3.",
    acceptedAnswers: ["3", "$3", "3 per notebook"],
    commonWrongAnswers: [{ answer: "18", misconceptionId: "MISC-RPR-004", reason: "Uses the total cost rather than cost per one item." }],
    misconceptionIds: ["MISC-RPR-004"],
    representationOptions: ["unit rate table", "division", "bar model"],
    placeholder: "Cost per notebook and why",
    transferLevel: "near",
    evidenceCategory: "Mathematical Modeling",
    evidenceWeight: 84,
  }),
  item({ domain: "Number & Operations", itemId: "pv2-num-001-a", strand: "Number", skillNodeId: "NUM-001", title: "Place-value column: ten-thousands", itemType: "Review", sequence: 901, difficulty: 2, prompt: "In 572,418, what is the value of the 7?", expectedAnswer: "70,000, because the 7 is in the ten-thousands place.", acceptedAnswers: ["70,000", "70000"], commonWrongAnswers: [{ answer: "7", misconceptionId: "MISC-NUM-001", reason: "This reads the digit only, but place value asks what the digit is worth." }, { answer: "7,000", misconceptionId: "MISC-NUM-001", reason: "This places the 7 in the thousands column instead of the ten-thousands column." }, { answer: "700,000", misconceptionId: "MISC-NUM-001", reason: "This moves the 7 one column too far left." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["place value chart", "expanded form", "mental columns"], placeholder: "Choose the value of the 7", transferLevel: "none", evidenceCategory: "School-Aligned Practice", evidenceWeight: 64 }),
  item({ domain: "Number & Operations", itemId: "pv2-num-001-b", strand: "Number", skillNodeId: "NUM-001", title: "Place-value column: thousands", itemType: "Review", sequence: 902, difficulty: 2, prompt: "In 930,502, what is the value of the 3?", expectedAnswer: "30,000, because the 3 is in the ten-thousands place.", acceptedAnswers: ["30,000", "30000"], commonWrongAnswers: [{ answer: "3", misconceptionId: "MISC-NUM-001", reason: "This gives the digit, not the value of the digit in its place." }, { answer: "3,000", misconceptionId: "MISC-NUM-001", reason: "This puts the 3 in the thousands place, but it is one column further left." }, { answer: "300,000", misconceptionId: "MISC-NUM-001", reason: "This puts the 3 one column too far left." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["place value chart", "expanded form", "mental columns"], placeholder: "Choose the value of the 3", transferLevel: "none", evidenceCategory: "School-Aligned Practice", evidenceWeight: 64 }),
  item({ domain: "Number & Operations", itemId: "pv2-num-001-c", strand: "Number", skillNodeId: "NUM-001", title: "Expanded form with zero placeholders", itemType: "Review", sequence: 903, difficulty: 3, prompt: "Which expanded form matches 406,205?", expectedAnswer: "400,000 + 6,000 + 200 + 5, because the zeros hold empty place-value columns.", acceptedAnswers: ["400,000 + 6,000 + 200 + 5", "400000 + 6000 + 200 + 5"], commonWrongAnswers: [{ answer: "400,000 + 60,000 + 200 + 5", misconceptionId: "MISC-NUM-001", reason: "This puts the 6 in the ten-thousands place instead of the thousands place." }, { answer: "400,000 + 6,000 + 20 + 5", misconceptionId: "MISC-NUM-001", reason: "This puts the 2 in the tens place, but it is in the hundreds place." }, { answer: "406 + 205", misconceptionId: "MISC-NUM-001", reason: "This splits the number around the comma instead of by place-value columns." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["expanded form", "place value chart", "digit cards"], placeholder: "Choose the expanded form", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 68 }),
  item({ domain: "Number & Operations", itemId: "pv2-num-002-a", strand: "Number", skillNodeId: "NUM-002", title: "Round to nearest thousand", itemType: "Review", sequence: 904, difficulty: 2, prompt: "Round 48,672 to the nearest thousand.", expectedAnswer: "49,000, because 672 means 48,672 is closer to 49,000 than 48,000.", acceptedAnswers: ["49,000", "49000"], commonWrongAnswers: [{ answer: "48,000", misconceptionId: "MISC-NUM-001", reason: "This rounds down, but the hundreds digit is 6 so the thousands should round up." }, { answer: "48,700", misconceptionId: "MISC-NUM-001", reason: "This rounds to the nearest hundred, not the nearest thousand." }, { answer: "50,000", misconceptionId: "MISC-NUM-001", reason: "This rounds to the nearest ten-thousand, not the nearest thousand." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["number line", "place value chart", "rounding rule"], placeholder: "Choose the rounded number", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 66 }),
  item({ domain: "Number & Operations", itemId: "pv2-num-002-b", strand: "Number", skillNodeId: "NUM-002", title: "Compare large numbers", itemType: "Review", sequence: 905, difficulty: 2, prompt: "Which number is larger: 507,080 or 570,008?", expectedAnswer: "570,008 is larger because its ten-thousands digit is 7, while 507,080 has 0 ten-thousands.", acceptedAnswers: ["570,008", "570008"], commonWrongAnswers: [{ answer: "507,080", misconceptionId: "MISC-NUM-001", reason: "This may come from comparing later digits before checking the ten-thousands place." }, { answer: "They are equal", misconceptionId: "MISC-NUM-001", reason: "The numbers use the same digits, but the digits are in different places." }, { answer: "Cannot tell", misconceptionId: "MISC-NUM-001", reason: "Place value lets us compare them exactly." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["place value chart", "comparison", "expanded form"], placeholder: "Choose the larger number", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 66 }),
  item({ domain: "Number & Operations", itemId: "pat2-num-008-a", strand: "Operations", skillNodeId: "NUM-008", title: "Missing number multiplication", itemType: "Review", sequence: 911, difficulty: 2, prompt: "Find the missing number: 6 × □ = 72.", expectedAnswer: "12, because 72 ÷ 6 = 12 and 6 × 12 = 72.", acceptedAnswers: ["12", "twelve"], commonWrongAnswers: [{ answer: "6", misconceptionId: "MISC-NUM-002", reason: "This uses the visible multiplier again instead of undoing the multiplication." }, { answer: "66", misconceptionId: "MISC-NUM-002", reason: "This subtracts 6 from 72 instead of using division." }, { answer: "432", misconceptionId: "MISC-NUM-002", reason: "This multiplies the known numbers instead of finding the missing factor." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["inverse operations", "times tables", "equation check"], placeholder: "Choose the missing number", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 68 }),
  item({ domain: "Number & Operations", itemId: "pat2-num-008-b", strand: "Operations", skillNodeId: "NUM-008", title: "Missing divisor puzzle", itemType: "Review", sequence: 912, difficulty: 3, prompt: "Find the missing number: 96 ÷ □ = 8.", expectedAnswer: "12, because 96 ÷ 12 = 8 and 8 × 12 = 96.", acceptedAnswers: ["12", "twelve"], commonWrongAnswers: [{ answer: "8", misconceptionId: "MISC-NUM-002", reason: "This repeats the result rather than finding what 96 was divided by." }, { answer: "88", misconceptionId: "MISC-NUM-002", reason: "This subtracts 8 from 96 instead of using inverse operations." }, { answer: "768", misconceptionId: "MISC-NUM-002", reason: "This multiplies 96 and 8 instead of finding the divisor." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["inverse operations", "division facts", "equation check"], placeholder: "Choose the missing number", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 70 }),
  item({ domain: "Number & Operations", itemId: "pat2-num-006-a", strand: "Operations", skillNodeId: "NUM-006", title: "Missing number with operation order", itemType: "Review", sequence: 913, difficulty: 3, prompt: "Find the missing number: 8 + □ × 3 = 26.", expectedAnswer: "6, because multiplication happens before addition: 6 × 3 = 18 and 8 + 18 = 26.", acceptedAnswers: ["6", "six"], commonWrongAnswers: [{ answer: "10", misconceptionId: "MISC-NUM-004", reason: "This may come from doing 8 + □ first before multiplying by 3." }, { answer: "18", misconceptionId: "MISC-NUM-004", reason: "18 is the product needed, but the missing number must be 18 ÷ 3." }, { answer: "34", misconceptionId: "MISC-NUM-004", reason: "This adds the known numbers instead of solving the missing-number equation." }], misconceptionIds: ["MISC-NUM-004"], representationOptions: ["operation steps", "inverse operations", "equation check"], placeholder: "Choose the missing number", transferLevel: "medium", evidenceCategory: "School-Aligned Practice", evidenceWeight: 74 }),
  item({ domain: "Number & Operations", itemId: "pat2-num-005-a", strand: "Number properties", skillNodeId: "NUM-005", title: "Spot the multiple pattern", itemType: "Review", sequence: 914, difficulty: 2, prompt: "What comes next in the pattern: 7, 14, 21, □ ?", expectedAnswer: "28, because the pattern adds 7 each time and lists multiples of 7.", acceptedAnswers: ["28", "twenty eight"], commonWrongAnswers: [{ answer: "24", misconceptionId: "MISC-NUM-003", reason: "This adds 3 instead of continuing the multiples-of-7 pattern." }, { answer: "27", misconceptionId: "MISC-NUM-003", reason: "This adds 6, but the previous steps added 7." }, { answer: "35", misconceptionId: "MISC-NUM-003", reason: "35 is a multiple of 7, but it skips over 28." }], misconceptionIds: ["MISC-NUM-003"], representationOptions: ["multiples", "skip counting", "pattern rule"], placeholder: "Choose the next number", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 64 }),
  item({ domain: "Number & Operations", itemId: "pat2-num-008-c", strand: "Operations", skillNodeId: "NUM-008", title: "Grid total missing number", itemType: "Review", sequence: 915, difficulty: 2, prompt: "A row in a number grid must total 30. It already has 8 and 12. What number is missing?", expectedAnswer: "10, because 8 + 12 = 20 and 30 - 20 = 10.", acceptedAnswers: ["10", "ten"], commonWrongAnswers: [{ answer: "20", misconceptionId: "MISC-NUM-002", reason: "20 is the total of the known numbers, not the missing part." }, { answer: "50", misconceptionId: "MISC-NUM-002", reason: "This adds all visible numbers instead of finding what is needed to make 30." }, { answer: "14", misconceptionId: "MISC-NUM-002", reason: "This does not make the row total 30 when checked." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["bar model", "inverse operations", "grid check"], placeholder: "Choose the missing number", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 66 }),
  item({ domain: "Number & Operations", itemId: "md2-num-003-a", strand: "Operations", skillNodeId: "NUM-003", title: "Partition multiplication", itemType: "Review", sequence: 921, difficulty: 3, prompt: "Calculate 24 × 15 using a partition strategy.", expectedAnswer: "360, because 24 × 10 = 240 and 24 × 5 = 120, so 240 + 120 = 360.", acceptedAnswers: ["360"], commonWrongAnswers: [{ answer: "240", misconceptionId: "MISC-NUM-001", reason: "This only calculates 24 × 10 and forgets the ×5 part." }, { answer: "120", misconceptionId: "MISC-NUM-001", reason: "This only calculates 24 × 5 and forgets the ×10 part." }, { answer: "39", misconceptionId: "MISC-NUM-001", reason: "This adds 24 and 15 instead of multiplying." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["partitioning", "area model", "written method"], placeholder: "Choose the product", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 70 }),
  item({ domain: "Number & Operations", itemId: "md2-num-004-a", strand: "Operations", skillNodeId: "NUM-004", title: "Division fact check", itemType: "Review", sequence: 922, difficulty: 2, prompt: "Calculate 84 ÷ 6.", expectedAnswer: "14, because 6 × 14 = 84.", acceptedAnswers: ["14", "fourteen"], commonWrongAnswers: [{ answer: "12", misconceptionId: "MISC-NUM-002", reason: "This is close, but 6 × 12 is only 72." }, { answer: "90", misconceptionId: "MISC-NUM-002", reason: "This adds 84 and 6 rather than dividing." }, { answer: "504", misconceptionId: "MISC-NUM-002", reason: "This multiplies 84 by 6 instead of dividing by 6." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["division facts", "inverse multiplication", "mental calculation"], placeholder: "Choose the quotient", transferLevel: "none", evidenceCategory: "School-Aligned Practice", evidenceWeight: 64 }),
  item({ domain: "Number & Operations", itemId: "md2-num-004-b", strand: "Operations", skillNodeId: "NUM-004", title: "Remainder in a real context", itemType: "Transfer", sequence: 923, difficulty: 3, prompt: "A table seats 8 children. How many tables are needed for 105 children?", expectedAnswer: "14 tables, because 105 ÷ 8 = 13 remainder 1, and the remaining child still needs a table.", acceptedAnswers: ["14", "14 tables"], commonWrongAnswers: [{ answer: "13", misconceptionId: "MISC-NUM-002", reason: "This drops the remainder, but one child would have no seat." }, { answer: "13.125", misconceptionId: "MISC-NUM-002", reason: "This decimal answer must be interpreted in the context; you need whole tables." }, { answer: "840", misconceptionId: "MISC-NUM-002", reason: "This multiplies children by seats instead of dividing children into tables." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["division equation", "context sentence", "bar model"], placeholder: "Choose the number of tables", transferLevel: "medium", evidenceCategory: "School-Aligned Practice", evidenceWeight: 76 }),
  item({ domain: "Number & Operations", itemId: "md2-num-003-b", strand: "Operations", skillNodeId: "NUM-003", title: "Multiply with a zero in the tens place", itemType: "Review", sequence: 924, difficulty: 3, prompt: "Calculate 302 × 6.", expectedAnswer: "1,812, because 300 × 6 = 1,800 and 2 × 6 = 12.", acceptedAnswers: ["1,812", "1812"], commonWrongAnswers: [{ answer: "1,800", misconceptionId: "MISC-NUM-001", reason: "This forgets the 2 × 6 part." }, { answer: "308", misconceptionId: "MISC-NUM-001", reason: "This adds 302 and 6 instead of multiplying." }, { answer: "18,012", misconceptionId: "MISC-NUM-001", reason: "This has a place-value error in the product." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["partitioning", "place value", "written method"], placeholder: "Choose the product", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 70 }),
  item({ itemId: "dec2-dec-001-a", strand: "Decimals", skillNodeId: "DEC-001", title: "Decimal digit value: hundredths", itemType: "Review", sequence: 931, difficulty: 2, prompt: "In 5.386, what is the value of the 8?", expectedAnswer: "0.08, because the 8 is in the hundredths place.", acceptedAnswers: ["0.08", "8 hundredths"], commonWrongAnswers: [{ answer: "8", misconceptionId: "MISC-DEC-002", reason: "This reads the digit as a whole number rather than its decimal place value." }, { answer: "0.8", misconceptionId: "MISC-DEC-002", reason: "This puts the 8 in the tenths place, but it is in the hundredths place." }, { answer: "0.008", misconceptionId: "MISC-DEC-002", reason: "This puts the 8 in the thousandths place, one column too far right." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["decimal place value chart", "expanded form", "money model"], placeholder: "Choose the value of 8", transferLevel: "none", evidenceCategory: "School-Aligned Practice", evidenceWeight: 66 }),
  item({ itemId: "dec2-dec-002-a", strand: "Decimals", skillNodeId: "DEC-002", title: "Compare decimals using thousandths", itemType: "Review", sequence: 932, difficulty: 2, prompt: "Which is larger: 0.407 or 0.47?", expectedAnswer: "0.47, because 0.47 = 0.470 and 470 thousandths is greater than 407 thousandths.", acceptedAnswers: ["0.47", "0.470"], commonWrongAnswers: [{ answer: "0.407", misconceptionId: "MISC-DEC-001", reason: "This may come from seeing 407 as larger than 47 instead of comparing decimal places." }, { answer: "They are equal", misconceptionId: "MISC-DEC-001", reason: "Adding a zero gives 0.470, not 0.407." }, { answer: "Cannot tell", misconceptionId: "MISC-DEC-001", reason: "Place value lets us compare decimals exactly." }], misconceptionIds: ["MISC-DEC-001"], representationOptions: ["thousandths", "place value chart", "number line"], placeholder: "Choose the larger decimal", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 66 }),
  item({ itemId: "dec2-dec-003-a", strand: "Decimals", skillNodeId: "DEC-003", title: "Round decimal to tenths", itemType: "Review", sequence: 933, difficulty: 2, prompt: "Round 6.78 to one decimal place.", expectedAnswer: "6.8, because the hundredths digit is 8 so the tenths digit rounds up.", acceptedAnswers: ["6.8", "6.80"], commonWrongAnswers: [{ answer: "6.7", misconceptionId: "MISC-DEC-001", reason: "This keeps the tenths but does not use the hundredths digit to round." }, { answer: "6.78", misconceptionId: "MISC-DEC-001", reason: "This is the original number, not rounded to one decimal place." }, { answer: "7", misconceptionId: "MISC-DEC-001", reason: "This rounds to a whole number, not to one decimal place." }], misconceptionIds: ["MISC-DEC-001"], representationOptions: ["number line", "decimal place value", "rounding rule"], placeholder: "Choose the rounded decimal", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 66 }),
  item({ itemId: "dec2-dec-001-b", strand: "Decimals", skillNodeId: "DEC-001", title: "Decimal digit value: thousandths", itemType: "Review", sequence: 934, difficulty: 2, prompt: "In 12.047, what is the value of the 7?", expectedAnswer: "0.007, because the 7 is in the thousandths place.", acceptedAnswers: ["0.007", "7 thousandths"], commonWrongAnswers: [{ answer: "7", misconceptionId: "MISC-DEC-002", reason: "This treats the decimal digit as a whole number." }, { answer: "0.07", misconceptionId: "MISC-DEC-002", reason: "This puts the 7 in the hundredths place, but it is in the thousandths place." }, { answer: "0.7", misconceptionId: "MISC-DEC-002", reason: "This puts the 7 in the tenths place, two columns too far left." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["decimal place value chart", "expanded form", "thousandths"], placeholder: "Choose the value of 7", transferLevel: "none", evidenceCategory: "School-Aligned Practice", evidenceWeight: 66 }),
  item({ itemId: "pow2-dec-004-a", strand: "Decimals", skillNodeId: "DEC-004", title: "Multiply decimal by 100", itemType: "Review", sequence: 941, difficulty: 2, prompt: "Calculate 3.07 × 100.", expectedAnswer: "307, because multiplying by 100 moves each digit two place-value positions larger.", acceptedAnswers: ["307"], commonWrongAnswers: [{ answer: "30.7", misconceptionId: "MISC-DEC-002", reason: "This moves one place larger, but ×100 needs two moves." }, { answer: "3.0700", misconceptionId: "MISC-DEC-002", reason: "This adds zeros without changing the place value." }, { answer: "3,700", misconceptionId: "MISC-DEC-002", reason: "This moves digits too far and changes the place value incorrectly." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "powers of ten", "mental scaling"], placeholder: "Choose the product", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 70 }),
  item({ itemId: "pow2-dec-005-a", strand: "Decimals", skillNodeId: "DEC-005", title: "Divide by 100", itemType: "Review", sequence: 942, difficulty: 2, prompt: "Calculate 720 ÷ 100.", expectedAnswer: "7.2, because dividing by 100 moves each digit two place-value positions smaller.", acceptedAnswers: ["7.2", "7.20"], commonWrongAnswers: [{ answer: "72", misconceptionId: "MISC-DEC-002", reason: "This moves one place smaller, but ÷100 needs two moves." }, { answer: "0.72", misconceptionId: "MISC-DEC-002", reason: "This moves three places smaller, one place too far." }, { answer: "72000", misconceptionId: "MISC-DEC-002", reason: "This moves in the wrong direction; it is like multiplying instead of dividing." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "powers of ten", "mental scaling"], placeholder: "Choose the quotient", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 70 }),
  item({ itemId: "pow2-dec-004-b", strand: "Decimals", skillNodeId: "DEC-004", title: "Multiply decimal by 1000", itemType: "Review", sequence: 943, difficulty: 3, prompt: "Calculate 0.064 × 1000.", expectedAnswer: "64, because multiplying by 1000 moves each digit three place-value positions larger.", acceptedAnswers: ["64"], commonWrongAnswers: [{ answer: "6.4", misconceptionId: "MISC-DEC-002", reason: "This moves two places larger, but ×1000 needs three moves." }, { answer: "640", misconceptionId: "MISC-DEC-002", reason: "This moves one place too far." }, { answer: "0.064000", misconceptionId: "MISC-DEC-002", reason: "This adds zeros without scaling the number." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "powers of ten", "mental scaling"], placeholder: "Choose the product", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 72 }),
  item({ itemId: "pow2-dec-005-b", strand: "Decimals", skillNodeId: "DEC-005", title: "Divide by 1000", itemType: "Review", sequence: 944, difficulty: 3, prompt: "Calculate 56 ÷ 1000.", expectedAnswer: "0.056, because dividing by 1000 moves each digit three place-value positions smaller.", acceptedAnswers: ["0.056"], commonWrongAnswers: [{ answer: "0.56", misconceptionId: "MISC-DEC-002", reason: "This moves two places smaller, but ÷1000 needs three moves." }, { answer: "5.6", misconceptionId: "MISC-DEC-002", reason: "This moves one place smaller, not three." }, { answer: "56,000", misconceptionId: "MISC-DEC-002", reason: "This moves in the wrong direction, like multiplying." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "powers of ten", "mental scaling"], placeholder: "Choose the quotient", transferLevel: "near", evidenceCategory: "School-Aligned Practice", evidenceWeight: 72 }),
  item({ itemId: "rev-fra-001-a", strand: "Fractions", skillNodeId: "FRA-001", title: "Equivalent fraction bridge", itemType: "Review", sequence: 101, difficulty: 2, prompt: "Complete the chain: 2/5 = __/10 = __/100. Explain what stayed the same.", expectedAnswer: "4/10 and 40/100; the value stayed the same because numerator and denominator were scaled by the same factor.", acceptedAnswers: ["4/10", "40/100"], commonWrongAnswers: [{ answer: "2/10 and 2/100", misconceptionId: "MISC-FRA-003", reason: "Changes denominator without proportional scaling." }], misconceptionIds: ["MISC-FRA-003"], representationOptions: ["scaling", "hundred grid", "multiplication facts"], placeholder: "__/10 and __/100 because...", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 60 }),
  item({ itemId: "rev-fra-004-a", strand: "Fractions", skillNodeId: "FRA-004", title: "Order unlike fractions", itemType: "Review", sequence: 102, difficulty: 3, prompt: "Order 2/3, 3/4, and 5/6 from smallest to largest. Show one method.", expectedAnswer: "2/3, 3/4, 5/6 using twelfths or twenty-fourths/benchmarks.", acceptedAnswers: ["2/3, 3/4, 5/6"], commonWrongAnswers: [{ answer: "5/6, 3/4, 2/3", misconceptionId: "MISC-FRA-001", reason: "May reverse order based on denominators only." }], misconceptionIds: ["MISC-FRA-001"], representationOptions: ["common denominator", "number line", "benchmark comparison"], placeholder: "Smallest → largest, with method", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 64 }),
  item({ itemId: "rev-fra-006-a", strand: "Fractions", skillNodeId: "FRA-006", title: "Subtract unlike denominators", itemType: "Review", sequence: 103, difficulty: 3, prompt: "Calculate 5/6 - 1/3. Explain why the denominator in your answer makes sense.", expectedAnswer: "1/2, because 1/3 is 2/6 and 5/6 - 2/6 = 3/6 = 1/2.", acceptedAnswers: ["1/2", "3/6"], commonWrongAnswers: [{ answer: "4/3", misconceptionId: "MISC-FRA-002", reason: "Subtracts numerators and denominators separately." }], misconceptionIds: ["MISC-FRA-002", "MISC-FRA-004"], representationOptions: ["common denominator", "fraction strips", "number line"], placeholder: "Answer and why", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 66 }),
  item({ itemId: "rev-dec-002-a", strand: "Decimals", skillNodeId: "DEC-002", title: "Decimal ordering to hundredths", itemType: "Review", sequence: 104, difficulty: 2, prompt: "Order 0.405, 0.45, and 0.5 from smallest to largest. Explain using place value.", expectedAnswer: "0.405, 0.45, 0.5 because 405 thousandths < 450 thousandths < 500 thousandths.", acceptedAnswers: ["0.405, 0.45, 0.5"], commonWrongAnswers: [{ answer: "0.5, 0.45, 0.405", misconceptionId: "MISC-DEC-001", reason: "Misreads length/value of decimal digits." }], misconceptionIds: ["MISC-DEC-001"], representationOptions: ["place value chart", "number line", "thousandths"], placeholder: "Smallest → largest", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 62 }),
  item({ itemId: "rev-fdp-005-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-005", title: "Benchmark percent strategy", itemType: "Review", sequence: 105, difficulty: 3, prompt: "Find 75% of 48 using a benchmark strategy, not a calculator.", expectedAnswer: "36, because 75% is three quarters and one quarter of 48 is 12, so three quarters is 36.", acceptedAnswers: ["36"], commonWrongAnswers: [{ answer: "75", misconceptionId: "MISC-PCT-001", reason: "Treats percent number as a quantity." }], misconceptionIds: ["MISC-PCT-001"], representationOptions: ["fraction equivalent", "bar model", "mental strategy"], placeholder: "Answer and method", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 64 }),
  item({ itemId: "ret-fra-001-a", strand: "Fractions", skillNodeId: "FRA-001", title: "Delayed equivalent fraction check", itemType: "Retention", sequence: 201, difficulty: 2, prompt: "Without notes, make two fractions equivalent to 3/8 and explain the pattern.", expectedAnswer: "Examples include 6/16 and 9/24; both parts are multiplied by the same factor.", acceptedAnswers: ["6/16", "9/24", "12/32"], commonWrongAnswers: [{ answer: "4/9", misconceptionId: "MISC-FRA-003", reason: "Adds the same amount rather than scaling both parts." }], misconceptionIds: ["MISC-FRA-003"], representationOptions: ["scaling", "fraction strips", "multiplication facts"], placeholder: "Two equivalents and pattern", transferLevel: "near", evidenceCategory: "Retention Evidence", evidenceWeight: 58 }),
  item({ itemId: "ret-fra-006-a", strand: "Fractions", skillNodeId: "FRA-006", title: "Delayed same-unit addition", itemType: "Retention", sequence: 202, difficulty: 3, prompt: "A week after learning it, calculate 2/5 + 1/10 and explain the common unit.", expectedAnswer: "1/2, because 2/5 is 4/10, so 4 tenths plus 1 tenth is 5 tenths.", acceptedAnswers: ["1/2", "5/10"], commonWrongAnswers: [{ answer: "3/15", misconceptionId: "MISC-FRA-002", reason: "Adds numerator and denominator separately." }], misconceptionIds: ["MISC-FRA-002", "MISC-FRA-004"], representationOptions: ["common denominator", "number line", "area model"], placeholder: "Answer and common unit", transferLevel: "near", evidenceCategory: "Retention Evidence", evidenceWeight: 68 }),
  item({ itemId: "ret-dec-004-a", strand: "Decimals", skillNodeId: "DEC-004", title: "Delayed decimal ×1000 check", itemType: "Retention", sequence: 203, difficulty: 3, prompt: "Calculate 0.036 × 1000. Explain using place value, not 'adding zeros'.", expectedAnswer: "36, because each digit becomes 1000 times as large and moves three place-value positions.", acceptedAnswers: ["36"], commonWrongAnswers: [{ answer: "0.036000", misconceptionId: "MISC-DEC-002", reason: "Adds zeros without scaling place value." }, { answer: "360", misconceptionId: "MISC-DEC-002", reason: "Moves one place too far when scaling by 1000." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "powers of ten", "mental scaling"], placeholder: "Answer and place-value explanation", transferLevel: "near", evidenceCategory: "Retention Evidence", evidenceWeight: 66 }),
  item({ itemId: "ret-fdp-001-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-001", title: "Delayed FDP equivalence check", itemType: "Retention", sequence: 204, difficulty: 2, prompt: "Write 1/5 as a decimal and a percentage, then explain the hundredths link.", expectedAnswer: "0.2 and 20%, because 1/5 = 20/100 = 0.20 = 20%.", acceptedAnswers: ["0.2", "0.20", "20%"], commonWrongAnswers: [{ answer: "0.15", misconceptionId: "MISC-FRA-003", reason: "Concatenates numerator/denominator instead of converting." }], misconceptionIds: ["MISC-FRA-003"], representationOptions: ["hundred grid", "known equivalence", "division"], placeholder: "Decimal, percentage, explanation", transferLevel: "near", evidenceCategory: "Retention Evidence", evidenceWeight: 60 }),
  item({ itemId: "ret-fdp-007-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-007", title: "Delayed base-rate comparison", itemType: "Retention", sequence: 205, difficulty: 4, prompt: "Team Red won 9 of 20 matches. Team Blue won 13 of 25. Which has the better win rate?",
    expectedAnswer: "Team Blue, because Red is 45% and Blue is 52%.", acceptedAnswers: ["Team Blue", "Blue", "52%"], commonWrongAnswers: [{ answer: "Team Red", misconceptionId: "MISC-PCT-004", reason: "May compare raw losses or use wrong whole." }], misconceptionIds: ["MISC-PCT-002", "MISC-PCT-004"], representationOptions: ["percent conversion", "ratio table", "fraction comparison"], placeholder: "Team and percentage reasoning", transferLevel: "medium", evidenceCategory: "Retention Evidence", evidenceWeight: 72 }),
  item({ itemId: "rep-fra-001-a", strand: "Fractions", skillNodeId: "FRA-001", title: "Repair equivalent fraction meaning", itemType: "Misconception Repair", sequence: 301, difficulty: 2, prompt: "A student says 4/6 is bigger than 2/3 because 4 and 6 are bigger numbers. What would you show or say to repair this idea?", expectedAnswer: "Show that both fractions cover the same amount; 2/3 scaled by 2 gives 4/6, so the value is unchanged.", acceptedAnswers: ["same amount", "scaled by 2", "equivalent"], commonWrongAnswers: [{ answer: "4/6 is bigger", misconceptionId: "MISC-FRA-003", reason: "Maintains misconception that equivalent fractions differ in value." }], misconceptionIds: ["MISC-FRA-003"], explanationRubric: { evidencePurpose: "Repair item requiring the student to confront equivalent-fraction misconception directly." }, representationOptions: ["fraction strips", "area model", "scaling"], placeholder: "Repair explanation", transferLevel: "near", evidenceCategory: "Misconception Repair Evidence", evidenceWeight: 74 }),
  item({ itemId: "rep-fra-002-a", strand: "Fractions", skillNodeId: "FRA-006", title: "Repair adding tops and bottoms", itemType: "Misconception Repair", sequence: 302, difficulty: 3, prompt: "Someone claims 1/2 + 1/3 = 2/5 because you add the top and bottom numbers. Explain why that cannot be right.", expectedAnswer: "The parts are different sizes; convert to sixths: 3/6 + 2/6 = 5/6, not 2/5.", acceptedAnswers: ["5/6", "same-sized parts", "common denominator"], commonWrongAnswers: [{ answer: "2/5", misconceptionId: "MISC-FRA-002", reason: "Treats numerator and denominator independently." }], misconceptionIds: ["MISC-FRA-002", "MISC-FRA-004"], representationOptions: ["area model", "common denominator", "fraction strips"], placeholder: "Why 2/5 cannot be right", transferLevel: "near", evidenceCategory: "Misconception Repair Evidence", evidenceWeight: 82 }),
  item({ itemId: "rep-dec-001-a", strand: "Decimals", skillNodeId: "DEC-002", title: "Repair longer decimal is larger", itemType: "Misconception Repair", sequence: 303, difficulty: 2, prompt: "A student says 0.309 is bigger than 0.4 because 309 is bigger than 4. Repair the thinking.", expectedAnswer: "0.4 is 0.400, which is 400 thousandths; 400 thousandths is greater than 309 thousandths.", acceptedAnswers: ["0.4", "0.400", "400 thousandths"], commonWrongAnswers: [{ answer: "0.309", misconceptionId: "MISC-DEC-001", reason: "Compares decimal digits as whole numbers." }], misconceptionIds: ["MISC-DEC-001"], representationOptions: ["place value chart", "number line", "thousandths"], placeholder: "Repair explanation", transferLevel: "near", evidenceCategory: "Misconception Repair Evidence", evidenceWeight: 76 }),
  item({ itemId: "rep-pct-001-a", strand: "Percentages", skillNodeId: "FDP-005", title: "Repair percent as number", itemType: "Misconception Repair", sequence: 304, difficulty: 2, prompt: "A student answers 30% of 90 as 30. What is the likely misunderstanding, and what is the correct answer?", expectedAnswer: "They treated 30% as the number 30. 30% of 90 is 27 because 10% is 9 and 30% is 3 × 9.", acceptedAnswers: ["27", "10% is 9"], commonWrongAnswers: [{ answer: "30", misconceptionId: "MISC-PCT-001", reason: "Treats the percent value as the quantity." }], misconceptionIds: ["MISC-PCT-001"], representationOptions: ["percent bar", "10% strategy", "fraction equivalent"], placeholder: "Misunderstanding and correct answer", transferLevel: "near", evidenceCategory: "Misconception Repair Evidence", evidenceWeight: 76 }),
  item({ itemId: "rep-pct-004-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-007", title: "Repair raw-count comparison", itemType: "Misconception Repair", sequence: 305, difficulty: 4, prompt: "A says 16 out of 80 is better than 9 out of 30 because 16 is more than 9. Repair this using percentages.", expectedAnswer: "16/80 is 20%, but 9/30 is 30%, so 9 out of 30 is the higher percentage despite the smaller raw count.", acceptedAnswers: ["9 out of 30", "30%", "16/80 is 20%"], commonWrongAnswers: [{ answer: "16 out of 80", misconceptionId: "MISC-PCT-004", reason: "Compares raw counts without equalising the whole." }], misconceptionIds: ["MISC-PCT-002", "MISC-PCT-004"], representationOptions: ["ratio table", "percent conversion", "bar model"], placeholder: "Repair using percentages", transferLevel: "medium", evidenceCategory: "Misconception Repair Evidence", evidenceWeight: 84 }),
  item({ itemId: "exp-fra-003-a", strand: "Fractions", skillNodeId: "FRA-003", title: "Explain common denominators", itemType: "Explanation", sequence: 401, difficulty: 3, prompt: "Why do 2/3 and 3/4 need a common denominator before they can be added or compared precisely?", expectedAnswer: "A common denominator creates same-sized parts, so the numerators count the same unit.", acceptedAnswers: ["same-sized parts", "common unit", "same denominator"], commonWrongAnswers: [{ answer: "because the rule says so", misconceptionId: "MISC-FRA-004", reason: "Procedure without common-unit meaning." }], misconceptionIds: ["MISC-FRA-004"], representationOptions: ["area model", "fraction strips", "common denominator"], placeholder: "Explain the reason, not only the rule", transferLevel: "none", evidenceCategory: "Explanation Evidence", evidenceWeight: 70 }),
  item({ itemId: "exp-fra-011-a", strand: "Fractions", skillNodeId: "FRA-011", title: "Explain fraction as division", itemType: "Explanation", sequence: 402, difficulty: 3, prompt: "Explain why 3/4 can mean 3 divided by 4 using a sharing story.", expectedAnswer: "If 3 wholes are shared equally among 4 people, each person gets 3/4 of a whole.", acceptedAnswers: ["3 divided by 4", "share 3 among 4", "3/4 each"], commonWrongAnswers: [{ answer: "only three out of four pieces", misconceptionId: "MISC-FRA-006", reason: "Keeps fraction only as part-whole, not quotient." }], misconceptionIds: ["MISC-FRA-006"], representationOptions: ["sharing model", "bar model", "division equation"], placeholder: "Sharing story", transferLevel: "near", evidenceCategory: "Explanation Evidence", evidenceWeight: 72 }),
  item({ itemId: "exp-dec-001-a", strand: "Decimals", skillNodeId: "DEC-001", title: "Explain thousandths", itemType: "Explanation", sequence: 403, difficulty: 2, prompt: "In 4.372, what is the value of the 7? Explain how you know.", expectedAnswer: "The 7 is 7 hundredths or 0.07 because it is in the hundredths place.", acceptedAnswers: ["7 hundredths", "0.07"], commonWrongAnswers: [{ answer: "7 tenths", misconceptionId: "MISC-DEC-002", reason: "Misreads decimal place-value columns." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "expanded form", "money/measure"], placeholder: "Value of 7 and why", transferLevel: "none", evidenceCategory: "Explanation Evidence", evidenceWeight: 64 }),
  item({ itemId: "exp-pct-operator-a", strand: "Percentages", skillNodeId: "V2-FDP-001", title: "Explain percent as operator", itemType: "Explanation", sequence: 404, difficulty: 3, prompt: "Explain why finding 20% of a number is the same as multiplying by 0.2 or 1/5.", expectedAnswer: "20% means 20 out of 100, which is 20/100 = 0.2 = 1/5, so it acts as a multiplier.", acceptedAnswers: ["20/100", "0.2", "1/5", "multiplier"], commonWrongAnswers: [{ answer: "subtract 20", misconceptionId: "MISC-PCT-003", reason: "Treats percent operation additively." }], misconceptionIds: ["MISC-PCT-001", "MISC-PCT-003"], representationOptions: ["hundred grid", "decimal multiplication", "bar model"], placeholder: "Explain the equivalence", transferLevel: "near", evidenceCategory: "Explanation Evidence", evidenceWeight: 74 }),
  item({ itemId: "tr-fra-009-a", strand: "Fractions", skillNodeId: "FRA-009", title: "Recipe fraction of quantity", itemType: "Transfer", sequence: 501, difficulty: 3, prompt: "A recipe uses 3/4 of a 200 g bag of flour. How much flour is used, and how do you know?", expectedAnswer: "150 g, because one quarter of 200 g is 50 g and three quarters is 150 g.", acceptedAnswers: ["150", "150 g"], commonWrongAnswers: [{ answer: "75", misconceptionId: "MISC-FRA-006", reason: "May treat fraction as two whole-number instructions rather than an operator." }], misconceptionIds: ["MISC-FRA-006"], representationOptions: ["bar model", "division then multiplication", "scaling"], placeholder: "Amount and reasoning", transferLevel: "medium", evidenceCategory: "Transfer Evidence", evidenceWeight: 82 }),
  item({ itemId: "tr-fdp-005-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-005", title: "Sale price transfer", itemType: "Transfer", sequence: 502, difficulty: 4, prompt: "A jacket costs $64. It is 25% off. What is the sale price? Explain discount amount and final price.", expectedAnswer: "The discount is $16 and the sale price is $48.", acceptedAnswers: ["48", "$48", "discount 16"], commonWrongAnswers: [{ answer: "$16", misconceptionId: "MISC-PCT-003", reason: "Gives discount amount as final price." }], misconceptionIds: ["MISC-PCT-001", "MISC-PCT-003"], representationOptions: ["percent bar", "fraction equivalent", "money model"], placeholder: "Discount and final price", transferLevel: "medium", evidenceCategory: "Transfer Evidence", evidenceWeight: 86 }),
  item({ itemId: "tr-fdp-007-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-007", title: "Survey comparison transfer", itemType: "Transfer", sequence: 503, difficulty: 4, prompt: "In one club, 14 of 35 members cycle to school. In another, 18 of 60 cycle. Which club has the larger cycling percentage?", expectedAnswer: "The first club: 14/35 is 40%, while 18/60 is 30%.", acceptedAnswers: ["first", "first club", "40%"], commonWrongAnswers: [{ answer: "second", misconceptionId: "MISC-PCT-004", reason: "Chooses larger raw count." }], misconceptionIds: ["MISC-PCT-002", "MISC-PCT-004"], representationOptions: ["percent conversion", "ratio table", "fraction comparison"], placeholder: "Club and percentages", transferLevel: "medium", evidenceCategory: "Transfer Evidence", evidenceWeight: 88 }),
  item({ itemId: "tr-dec-005-a", strand: "Decimals", skillNodeId: "DEC-005", title: "Metric conversion transfer", itemType: "Transfer", sequence: 504, difficulty: 3, prompt: "A ribbon is 325 cm long. Write this in metres and explain the division by 100.", expectedAnswer: "3.25 m, because dividing by 100 moves from centimetres to metres and each digit becomes one hundredth as large.", acceptedAnswers: ["3.25", "3.25 m"], commonWrongAnswers: [{ answer: "32.5", misconceptionId: "MISC-DEC-002", reason: "Power-of-ten place-value shift is one place instead of two." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "metric conversion", "number line"], placeholder: "Metres and explanation", transferLevel: "medium", evidenceCategory: "Transfer Evidence", evidenceWeight: 76 }),
  item({ itemId: "tr-fdp-008-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-008", title: "Mixed FDP planning problem", itemType: "Transfer", sequence: 505, difficulty: 5, prompt: "A class has 32 students. 3/8 bring lunch from home, 25% buy lunch, and the rest eat later. How many eat later?", expectedAnswer: "12 students eat later: 3/8 of 32 is 12, 25% of 32 is 8, so 20 accounted for and 12 remain.", acceptedAnswers: ["12", "12 students"], commonWrongAnswers: [{ answer: "20", misconceptionId: "MISC-PCT-002", reason: "May report accounted-for students instead of remaining whole." }], misconceptionIds: ["MISC-PCT-002", "MISC-FRA-006"], representationOptions: ["bar model", "table", "fraction-percent conversion"], placeholder: "Number eating later and reasoning", transferLevel: "far", evidenceCategory: "Transfer Evidence", evidenceWeight: 94 }),
  item({ itemId: "ch-fra-008-a", strand: "Fractions", skillNodeId: "FRA-008", title: "Fraction multiplication challenge", itemType: "Challenge", sequence: 601, difficulty: 4, prompt: "Is 2/3 × 3/5 greater than or less than 2/3? Explain without only calculating.", expectedAnswer: "Less than 2/3, because multiplying by 3/5 means taking a fraction less than one of 2/3.", acceptedAnswers: ["less", "less than 2/3", "2/5"], commonWrongAnswers: [{ answer: "greater", misconceptionId: "MISC-FRA-006", reason: "Overgeneralises multiplication as always making bigger." }], misconceptionIds: ["MISC-FRA-006"], representationOptions: ["area model", "scaling", "benchmark reasoning"], placeholder: "Greater/less and why", transferLevel: "medium", evidenceCategory: "Challenge Evidence", evidenceWeight: 86 }),
  item({ itemId: "ch-fdp-006-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-006", title: "Non-benchmark percent challenge", itemType: "Challenge", sequence: 602, difficulty: 4, prompt: "Find 37.5% of 160 using a decomposition strategy.", expectedAnswer: "60, because 37.5% is 3/8 and 1/8 of 160 is 20, so 3/8 is 60; or 25% + 12.5% = 40 + 20.", acceptedAnswers: ["60"], commonWrongAnswers: [{ answer: "37.5", misconceptionId: "MISC-PCT-001", reason: "Treats percent as the quantity." }], misconceptionIds: ["MISC-PCT-001"], representationOptions: ["fraction equivalent", "percent decomposition", "bar model"], placeholder: "Answer and decomposition", transferLevel: "medium", evidenceCategory: "Challenge Evidence", evidenceWeight: 88 }),
  item({ itemId: "ch-fdp-007-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-007", title: "Ambiguous base challenge", itemType: "Challenge", sequence: 603, difficulty: 5, prompt: "A shop sold 45 bikes in April and 54 in May. May sales were what percentage of April sales? Explain the whole/base.", expectedAnswer: "120% of April sales, because April's 45 is the whole and 54/45 = 1.2.", acceptedAnswers: ["120%", "120 percent"], commonWrongAnswers: [{ answer: "20%", misconceptionId: "MISC-PCT-002", reason: "May give percentage increase only or use wrong base." }], misconceptionIds: ["MISC-PCT-002"], representationOptions: ["ratio table", "fraction to percent", "bar model"], placeholder: "Percentage and base", transferLevel: "far", evidenceCategory: "Challenge Evidence", evidenceWeight: 92 }),
  item({ itemId: "ch-fdp-008-a", strand: "Fractions-Decimals-Percentages Connections", skillNodeId: "FDP-008", title: "Multi-step FDP challenge", itemType: "Challenge", sequence: 604, difficulty: 5, prompt: "A 2.4 km route has 1/3 uphill, 25% flat, and the rest downhill. How many kilometres are downhill?", expectedAnswer: "1.0 km downhill: uphill is 0.8 km, flat is 0.6 km, leaving 1.0 km.", acceptedAnswers: ["1", "1.0", "1 km"], commonWrongAnswers: [{ answer: "1.4", misconceptionId: "MISC-PCT-002", reason: "May combine only one part with the whole incorrectly." }], misconceptionIds: ["MISC-PCT-002", "MISC-FRA-006"], representationOptions: ["bar model", "decimal conversion", "table"], placeholder: "Downhill distance and reasoning", transferLevel: "far", evidenceCategory: "Challenge Evidence", evidenceWeight: 94 }),
  item({ itemId: "ch-dec-004-a", strand: "Decimals", skillNodeId: "DEC-004", title: "Decimal scaling challenge", itemType: "Challenge", sequence: 605, difficulty: 4, prompt: "A microscope makes an object appear 100 times larger. If the real length is 0.047 mm, what is the apparent length?", expectedAnswer: "4.7 mm, because multiplying by 100 moves each digit two places greater.", acceptedAnswers: ["4.7", "4.7 mm"], commonWrongAnswers: [{ answer: "0.04700", misconceptionId: "MISC-DEC-002", reason: "Adds zeros instead of scaling." }], misconceptionIds: ["MISC-DEC-002"], representationOptions: ["place value chart", "powers of ten", "measurement context"], placeholder: "Apparent length and why", transferLevel: "medium", evidenceCategory: "Challenge Evidence", evidenceWeight: 84 }),
  item({ domain: "Number & Operations", itemId: "rev-num-003-a", strand: "Operations", skillNodeId: "NUM-003", title: "Multi-digit multiplication check", itemType: "Review", sequence: 701, difficulty: 3, prompt: "Calculate 246 × 7 and show a method you trust.", expectedAnswer: "1722, using partitioning or a written method.", acceptedAnswers: ["1722", "1,722"], commonWrongAnswers: [{ answer: "1442", misconceptionId: "MISC-NUM-001", reason: "Place-value error while multiplying partial products." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["partitioning", "standard algorithm", "area model"], placeholder: "Answer and method", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 64 }),
  item({ domain: "Number & Operations", itemId: "rev-num-005-a", strand: "Number properties", skillNodeId: "NUM-005", title: "Common factors", itemType: "Review", sequence: 702, difficulty: 2, prompt: "Find the highest common factor of 24 and 36. Explain using factor lists or factor pairs.", expectedAnswer: "12 is the highest common factor of 24 and 36.", acceptedAnswers: ["12"], commonWrongAnswers: [{ answer: "72", misconceptionId: "MISC-NUM-003", reason: "Gives a common multiple rather than a common factor." }], misconceptionIds: ["MISC-NUM-003"], representationOptions: ["factor pairs", "factor lists", "array model"], placeholder: "HCF and how you know", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 66 }),
  item({ domain: "Number & Operations", itemId: "ret-num-004-a", strand: "Operations", skillNodeId: "NUM-004", title: "Remainder in context", itemType: "Retention", sequence: 703, difficulty: 3, prompt: "A minibus holds 9 children. How many minibuses are needed for 52 children? Explain the remainder.", expectedAnswer: "6 minibuses are needed because 52 ÷ 9 = 5 remainder 7, and the remaining 7 still need a bus.", acceptedAnswers: ["6", "six"], commonWrongAnswers: [{ answer: "5", misconceptionId: "MISC-NUM-002", reason: "Drops the remainder instead of interpreting it in context." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["division equation", "bar model", "context sentence"], placeholder: "Number of minibuses and why", transferLevel: "medium", evidenceCategory: "Retention Evidence", evidenceWeight: 70 }),
  item({ domain: "Number & Operations", itemId: "ret-num-007-a", strand: "Number", skillNodeId: "NUM-007", title: "Temperature interval", itemType: "Retention", sequence: 704, difficulty: 3, prompt: "The temperature rises from -4°C to 7°C. How many degrees warmer is it?", expectedAnswer: "11 degrees warmer, because the interval from -4 to 0 is 4 and from 0 to 7 is 7.", acceptedAnswers: ["11", "11 degrees"], commonWrongAnswers: [{ answer: "3", misconceptionId: "MISC-NUM-005", reason: "Subtracts magnitudes without reasoning across zero." }], misconceptionIds: ["MISC-NUM-005"], representationOptions: ["number line", "temperature scale", "counting interval"], placeholder: "Temperature change and method", transferLevel: "near", evidenceCategory: "Retention Evidence", evidenceWeight: 68 }),
  item({ domain: "Number & Operations", itemId: "rep-num-006-a", strand: "Operations", skillNodeId: "NUM-006", title: "Repair left-to-right operations", itemType: "Misconception Repair", sequence: 705, difficulty: 3, prompt: "A student says 8 + 2 × 5 = 50 because they went left to right. Repair the thinking and give the correct answer.", expectedAnswer: "Multiplication comes before addition, so 2 × 5 = 10 and 8 + 10 = 18.", acceptedAnswers: ["18", "multiplication first"], commonWrongAnswers: [{ answer: "50", misconceptionId: "MISC-NUM-004", reason: "Continues left-to-right calculation." }], misconceptionIds: ["MISC-NUM-004"], representationOptions: ["operation steps", "brackets", "expression tree"], placeholder: "Repair explanation and answer", transferLevel: "near", evidenceCategory: "Misconception Repair Evidence", evidenceWeight: 78 }),
  item({ domain: "Number & Operations", itemId: "exp-num-008-a", strand: "Operations", skillNodeId: "NUM-008", title: "Explain inverse check", itemType: "Explanation", sequence: 706, difficulty: 3, prompt: "Explain how you could check 473 - 189 = 284 using an inverse operation.", expectedAnswer: "Add 284 + 189 to check that it returns to 473.", acceptedAnswers: ["284 + 189", "add", "473"], commonWrongAnswers: [{ answer: "subtract again", misconceptionId: "MISC-NUM-002", reason: "Uses the same operation rather than the inverse relationship." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["inverse equation", "bar model", "number line"], placeholder: "Inverse check explanation", transferLevel: "near", evidenceCategory: "Explanation Evidence", evidenceWeight: 70 }),
  item({ domain: "Number & Operations", itemId: "tr-num-002-a", strand: "Number", skillNodeId: "NUM-002", title: "Estimate then decide", itemType: "Transfer", sequence: 707, difficulty: 3, prompt: "A family estimates 398 × 6 for a budget. Give a sensible estimate and say whether the exact answer will be close to $2,400.", expectedAnswer: "About 400 × 6 = 2400, so the exact answer should be close to $2,400.", acceptedAnswers: ["2400", "2,400", "close"], commonWrongAnswers: [{ answer: "3986", misconceptionId: "MISC-NUM-001", reason: "Concatenates numbers rather than estimating multiplication." }], misconceptionIds: ["MISC-NUM-001"], representationOptions: ["rounding", "mental calculation", "number line"], placeholder: "Estimate and decision", transferLevel: "medium", evidenceCategory: "Transfer Evidence", evidenceWeight: 82 }),
  item({ domain: "Number & Operations", itemId: "ch-num-004-a", strand: "Operations", skillNodeId: "NUM-004", title: "Best interpretation of remainder", itemType: "Challenge", sequence: 708, difficulty: 4, prompt: "A rope is 95 cm long and each bracelet needs 12 cm. How many complete bracelets can be made, and what happens to the remainder?", expectedAnswer: "7 complete bracelets can be made, with 11 cm left over, because 95 ÷ 12 = 7 remainder 11.", acceptedAnswers: ["7", "7 bracelets"], commonWrongAnswers: [{ answer: "8", misconceptionId: "MISC-NUM-002", reason: "Rounds up even though a complete bracelet cannot be made from the remainder." }], misconceptionIds: ["MISC-NUM-002"], representationOptions: ["division equation", "context sentence", "bar model"], placeholder: "Complete bracelets and remainder", transferLevel: "medium", evidenceCategory: "Challenge Evidence", evidenceWeight: 88 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "rev-rpr-002-a", strand: "Ratio", skillNodeId: "RPR-002", title: "Simplify a ratio", itemType: "Review", sequence: 801, difficulty: 2, prompt: "Simplify the ratio 12:18 and explain the common factor.", expectedAnswer: "2:3, because both parts divide by 6.", acceptedAnswers: ["2:3", "2 to 3"], commonWrongAnswers: [{ answer: "6:12", misconceptionId: "MISC-RPR-001", reason: "Subtracts a difference rather than scaling both parts." }], misconceptionIds: ["MISC-RPR-001", "MISC-NUM-003"], representationOptions: ["common factor", "ratio table", "bar model"], placeholder: "Simplified ratio and factor", transferLevel: "near", evidenceCategory: "Review Evidence", evidenceWeight: 66 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "rev-rpr-004-a", strand: "Proportion", skillNodeId: "RPR-004", title: "Scale a recipe", itemType: "Review", sequence: 802, difficulty: 3, prompt: "A recipe for 4 people uses 300 g rice. How much rice is needed for 6 people?", expectedAnswer: "450 g, because 6 people is 1.5 times as many as 4 people, and 300 × 1.5 = 450.", acceptedAnswers: ["450", "450 g"], commonWrongAnswers: [{ answer: "302", misconceptionId: "MISC-RPR-001", reason: "Uses an additive increase rather than scaling proportionally." }], misconceptionIds: ["MISC-RPR-001"], representationOptions: ["ratio table", "scaling", "double number line"], placeholder: "Amount and scaling method", transferLevel: "medium", evidenceCategory: "Review Evidence", evidenceWeight: 72 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "ret-rpr-003-a", strand: "Ratio", skillNodeId: "RPR-003", title: "Delayed ratio share", itemType: "Retention", sequence: 803, difficulty: 3, prompt: "Share 60 stickers in the ratio 1:4. Explain total parts.", expectedAnswer: "12 and 48, because there are 5 total parts and each part is 12.", acceptedAnswers: ["12 and 48", "12, 48", "48 and 12"], commonWrongAnswers: [{ answer: "15 and 45", misconceptionId: "MISC-RPR-003", reason: "Divides by one ratio number or uses equalising instead of total parts." }], misconceptionIds: ["MISC-RPR-002", "MISC-RPR-003"], representationOptions: ["bar model", "unit parts", "ratio table"], placeholder: "Shares and total-parts explanation", transferLevel: "near", evidenceCategory: "Retention Evidence", evidenceWeight: 72 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "ret-rpr-005-a", strand: "Rates", skillNodeId: "RPR-005", title: "Delayed unit price", itemType: "Retention", sequence: 804, difficulty: 3, prompt: "Five pens cost $7.50. What is the cost per pen?", expectedAnswer: "$1.50 per pen, because 7.50 divided by 5 is 1.50.", acceptedAnswers: ["1.50", "$1.50", "1.5"], commonWrongAnswers: [{ answer: "7.50", misconceptionId: "MISC-RPR-004", reason: "Uses the total rather than per-one rate." }], misconceptionIds: ["MISC-RPR-004"], representationOptions: ["unit rate table", "division", "money model"], placeholder: "Cost per pen", transferLevel: "near", evidenceCategory: "Retention Evidence", evidenceWeight: 70 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "rep-rpr-001-a", strand: "Ratio", skillNodeId: "RPR-001", title: "Repair additive ratio thinking", itemType: "Misconception Repair", sequence: 805, difficulty: 3, prompt: "A student says 2:3 is equivalent to 4:5 because both parts increased by 2. Repair the thinking.", expectedAnswer: "Equivalent ratios use multiplication, not addition. 2:3 doubled is 4:6, not 4:5.", acceptedAnswers: ["4:6", "multiplication", "multiply"], commonWrongAnswers: [{ answer: "4:5", misconceptionId: "MISC-RPR-001", reason: "Maintains additive ratio reasoning." }], misconceptionIds: ["MISC-RPR-001"], representationOptions: ["ratio table", "scaling", "bar model"], placeholder: "Repair explanation", transferLevel: "near", evidenceCategory: "Misconception Repair Evidence", evidenceWeight: 82 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "exp-rpr-003-a", strand: "Ratio", skillNodeId: "RPR-003", title: "Explain total parts", itemType: "Explanation", sequence: 806, difficulty: 3, prompt: "In a 3:5 share, why are there 8 total parts rather than 5?", expectedAnswer: "The ratio compares two parts, so the whole is 3 parts plus 5 parts, which is 8 total parts.", acceptedAnswers: ["8", "3 plus 5", "total parts"], commonWrongAnswers: [{ answer: "5", misconceptionId: "MISC-RPR-002", reason: "Treats second ratio number as the whole." }], misconceptionIds: ["MISC-RPR-002", "MISC-RPR-003"], representationOptions: ["bar model", "part-part-whole", "unit parts"], placeholder: "Why 8 total parts?", transferLevel: "none", evidenceCategory: "Explanation Evidence", evidenceWeight: 74 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "tr-rpr-006-a", strand: "Rates", skillNodeId: "RPR-006", title: "Compare running rates", itemType: "Transfer", sequence: 807, difficulty: 4, prompt: "Runner A travels 18 km in 3 hours. Runner B travels 14 km in 2 hours. Who is faster?", expectedAnswer: "Runner B is faster: A is 6 km/h and B is 7 km/h.", acceptedAnswers: ["Runner B", "B", "7 km/h"], commonWrongAnswers: [{ answer: "Runner A", misconceptionId: "MISC-RPR-004", reason: "Compares total distance without common time or unit rate." }], misconceptionIds: ["MISC-RPR-004"], representationOptions: ["unit rate", "table", "double number line"], placeholder: "Faster runner and unit rates", transferLevel: "medium", evidenceCategory: "Transfer Evidence", evidenceWeight: 88 }),
  item({ domain: "Ratio, Proportion & Rates", itemId: "ch-rpr-008-a", strand: "Proportion", skillNodeId: "RPR-008", title: "Connect percent and rate", itemType: "Challenge", sequence: 808, difficulty: 5, prompt: "A car uses 12 L of fuel for 150 km. Another uses 15 L for 225 km. Which car uses less fuel per km, and how do percentages/ratios help compare?", expectedAnswer: "The second car uses less fuel per km: 12/150 = 0.08 L/km, while 15/225 ≈ 0.067 L/km.", acceptedAnswers: ["second", "0.067", "15/225"], commonWrongAnswers: [{ answer: "first", misconceptionId: "MISC-RPR-004", reason: "Compares total fuel only without normalising by distance." }], misconceptionIds: ["MISC-RPR-004", "MISC-PCT-002"], representationOptions: ["unit rate", "ratio table", "fraction comparison"], placeholder: "Car and comparison method", transferLevel: "far", evidenceCategory: "Challenge Evidence", evidenceWeight: 94 }),
];

export type DiagnosticItem = {
  id: string;
  itemId: string;
  skillNodeId: string;
  title: string;
  prompt: string;
  placeholder: string;
  representationOptions: string[];
  competency: string;
  itemType: string;
  difficulty: number;
  transferLevel: string;
  evidenceWeight: number;
  misconceptionIds: string[];
};

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function toDiagnosticItem(item: Pick<MathItem, "itemId" | "skillNodeId" | "title" | "prompt" | "placeholder" | "representationOptions" | "evidenceCategory" | "itemType" | "difficulty" | "transferLevel" | "evidenceWeight" | "misconceptionIds">): DiagnosticItem {
  return {
    id: item.itemId,
    itemId: item.itemId,
    skillNodeId: item.skillNodeId,
    title: item.title,
    prompt: item.prompt,
    placeholder: item.placeholder,
    representationOptions: stringArray(item.representationOptions),
    competency: item.evidenceCategory,
    itemType: item.itemType,
    difficulty: item.difficulty,
    transferLevel: item.transferLevel,
    evidenceWeight: item.evidenceWeight,
    misconceptionIds: stringArray(item.misconceptionIds),
  };
}

export async function getActiveDiagnosticItems() {
  const items = await prisma.mathItem.findMany({
    where: { subject: "Mathematics", yearGroup: "Year 6", itemType: "Diagnostic", active: true },
    orderBy: [{ sequence: "asc" }, { itemId: "asc" }],
  });
  return items.map(toDiagnosticItem);
}

export async function getItemBankItems() {
  return prisma.mathItem.findMany({
    orderBy: [{ itemType: "asc" }, { sequence: "asc" }, { itemId: "asc" }],
    include: { skill: true },
  });
}
