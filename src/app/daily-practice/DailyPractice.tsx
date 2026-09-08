"use client";

import {
  DAILY_PROGRESS_KEY,
  type DailyPracticeRecord,
  LEGACY_DAILY_PROGRESS_KEY,
  type PracticeItemRecord,
  type PracticeTopic,
  topicLabels,
} from "@/lib/learning/practice-progress";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Topic = PracticeTopic;
type Stage = "goals" | "lesson" | "practice" | "gugudan" | "summary";
type Question = {
  id: string;
  topic: Topic;
  label: string;
  prompt: string;
  choices: string[];
  answer: string;
  answerType?: "exact" | "fraction-equivalent";
  hint: string;
  explanation: string;
  parentNote: string;
};

type Template = {
  topic: Topic;
  label: string;
  build: (seed: number) => Question;
};

type LessonRecap = {
  title: string;
  bigIdea: string;
  steps: string[];
  example: string;
  trap: string;
  visualCue?: string;
  checkPrompt?: string;
  practiceLabels?: string[];
};

const stageOrder: Stage[] = ["goals", "lesson", "practice", "gugudan"];

const topicLessons: Record<
  Topic,
  {
    goal: string;
    bigIdea: string;
    steps: string[];
    example: string;
    trap: string;
    recaps: LessonRecap[];
  }
> = {
  multiplication: {
    goal: "Use fact families to connect multiplication, division, and missing numbers.",
    bigIdea:
      "Multiplication and division are opposites. If you know one fact, you can use it in several ways.",
    steps: [
      "Find the equal groups.",
      "Write the multiplication fact.",
      "Use the opposite operation when a number is missing.",
    ],
    example: "If 7 x 8 = 56, then 56 / 7 = 8 and 56 / 8 = 7.",
    trap: "Do not guess division. Ask which multiplication fact makes the total.",
    recaps: [
      {
        title: "Fact families give free answers",
        bigIdea:
          "One multiplication fact can unlock two division facts and a missing-number problem.",
        steps: [
          "Start with the multiplication fact.",
          "Swap the factors to get the turn-around fact.",
          "Use the total divided by one factor to find the other factor.",
        ],
        example: "7 x 8 = 56, so 8 x 7 = 56, 56 / 7 = 8, and 56 / 8 = 7.",
        trap: "Do not treat division as a new fact to memorize every time.",
      },
      {
        title: "Equal groups tell you what to do",
        bigIdea:
          "When a story has the same amount repeated, multiplication finds the total.",
        steps: [
          "Circle how many groups there are.",
          "Underline how many are in each group.",
          "Multiply groups by group size.",
        ],
        example: "6 bags with 8 stickers each means 6 x 8 = 48 stickers.",
        trap: "Adding 6 + 8 only finds two numbers together, not six equal groups.",
      },
      {
        title: "Missing numbers are hidden division",
        bigIdea:
          "A missing factor asks which number makes the multiplication fact true.",
        steps: [
          "Read the total at the end.",
          "Divide the total by the known factor.",
          "Check by multiplying back.",
        ],
        example: "9 x ? = 63 means 63 / 9 = 7, so the missing number is 7.",
        trap: "Guessing can feel fast, but checking with division is calmer.",
      },
      {
        title: "Arrays make multiplication visible",
        bigIdea:
          "Rows and columns show why multiplication is equal groups arranged neatly.",
        steps: [
          "Count the rows.",
          "Count how many are in each row.",
          "Multiply rows by columns to find the total.",
        ],
        example: "5 rows of 9 seats means 5 x 9 = 45 seats.",
        trap: "Do not count only one row when the question asks for the whole array.",
      },
      {
        title: "Division can mean groups or group size",
        bigIdea:
          "A division story asks either how many groups fit or how many are in each group.",
        steps: [
          "Find the total.",
          "Find the known group number or group size.",
          "Use the matching multiplication fact to answer.",
        ],
        example: "48 stickers in bags of 6 means 48 / 6 = 8 bags.",
        trap: "Always check what the answer represents in the story.",
      },
      {
        title: "Skip counting builds a table",
        bigIdea:
          "Multiplication facts are patterns. Skip counting helps your brain hear and predict those patterns.",
        steps: [
          "Choose the table you are practicing.",
          "Say the multiples in rhythm.",
          "Stop and connect each multiple to a fact.",
        ],
        example: "For the 8 table: 8, 16, 24, 32 means 4 x 8 = 32.",
        trap: "Saying the pattern without knowing which fact you reached.",
        visualCue: "Picture stepping stones with the same jump size each time.",
        checkPrompt:
          "Say the 8 table up to 8 x 6, then ask which fact each number belongs to.",
        practiceLabels: ["Fact family", "Missing number"],
      },
      {
        title: "Break apart a hard factor",
        bigIdea:
          "A harder multiplication fact can be split into friendlier pieces.",
        steps: [
          "Keep one factor the same.",
          "Break the other factor into easy parts.",
          "Multiply each part and add them.",
        ],
        example: "7 x 12 can be 7 x 10 plus 7 x 2, so 70 + 14 = 84.",
        trap: "Breaking apart both numbers at once before you are ready.",
        visualCue:
          "Picture one big rectangle split into two smaller rectangles.",
        checkPrompt: "Explain how 6 x 14 can become 6 x 10 plus 6 x 4.",
        practiceLabels: ["Story problem", "Array model"],
      },
      {
        title: "Double and halve to make it easier",
        bigIdea:
          "Some products stay the same if one factor doubles and the other factor halves.",
        steps: [
          "Look for an even factor.",
          "Halve that factor.",
          "Double the other factor and multiply the easier pair.",
        ],
        example: "5 x 16 is the same as 10 x 8, which is 80.",
        trap: "Doubling one number without halving the other changes the answer.",
        visualCue:
          "Picture moving half the objects from one row to make twice as many shorter rows.",
        checkPrompt: "Show why 4 x 18 has the same total as 8 x 9.",
        practiceLabels: ["Array model", "Story problem"],
      },
      {
        title: "The 9s have a pattern",
        bigIdea:
          "The 9 times table has digit patterns that make checking easier.",
        steps: [
          "For 9 x n, think 10 x n first.",
          "Subtract one n.",
          "Check the digit sum for many 9s facts.",
        ],
        example: "9 x 7 is 70 - 7 = 63, and 6 + 3 = 9.",
        trap: "Using the digit pattern as a guess instead of checking the fact.",
        visualCue: "Picture 10 groups, then remove one object from each group.",
        checkPrompt:
          "Explain why 9 x 8 is close to 10 x 8 but a little smaller.",
        practiceLabels: ["Fact family", "Missing number"],
      },
      {
        title: "Estimate before exact answer",
        bigIdea:
          "A quick estimate tells whether your final multiplication or division answer makes sense.",
        steps: [
          "Round or use a nearby easy fact.",
          "Predict about how big the answer should be.",
          "Solve exactly and compare.",
        ],
        example: "11 x 8 should be close to 10 x 8 = 80, so 88 makes sense.",
        trap: "Accepting an answer that is far too small or far too large.",
        visualCue:
          "Picture a target zone before trying to hit the exact answer.",
        checkPrompt: "Before solving 12 x 9, say what size answer you expect.",
        practiceLabels: ["Story problem", "Array model", "Fact family"],
      },
      {
        title: "Division checks multiplication",
        bigIdea:
          "Every division answer can be checked by multiplying back to the total.",
        steps: [
          "Solve the division.",
          "Multiply your answer by the divisor.",
          "Check that you return to the starting total.",
        ],
        example: "72 / 9 = 8 because 8 x 9 = 72.",
        trap: "Stopping after division without checking the answer in the story.",
        visualCue:
          "Picture walking backward with division, then forward with multiplication.",
        checkPrompt:
          "Say how to check 56 / 7 without redoing the whole problem.",
        practiceLabels: ["Division story", "Fact family"],
      },
      {
        title: "Missing factor means missing partner",
        bigIdea:
          "A missing factor is asking for the partner that makes the total.",
        steps: [
          "Name the total.",
          "Name the known factor.",
          "Ask which partner completes the fact.",
        ],
        example:
          "? x 8 = 96 asks which partner of 8 makes 96, so the answer is 12.",
        trap: "Using the total as the answer instead of the missing partner.",
        visualCue:
          "Picture a pair of numbers holding up the same total together.",
        checkPrompt: "Explain why 7 is the missing partner in 6 x ? = 42.",
        practiceLabels: ["Missing number", "Fact family"],
      },
    ],
  },
  fractions: {
    goal: "Understand fractions as equal parts and use the denominator first.",
    bigIdea:
      "The denominator tells how many equal parts make the whole. The numerator tells how many parts we use.",
    steps: [
      "Ask what the whole is.",
      "Split the whole by the denominator.",
      "Take or count the numerator parts.",
    ],
    example: "3/4 of 20: first 20 / 4 = 5, then 3 x 5 = 15.",
    trap: "Do not look only at the numbers. Check the size of the equal parts.",
    recaps: [
      {
        title: "Denominator first",
        bigIdea:
          "The denominator tells how many equal parts make the whole, so it usually tells the first action.",
        steps: [
          "Name the whole.",
          "Split it by the denominator.",
          "Take the numerator number of parts.",
        ],
        example: "3/4 of 20: 20 / 4 = 5, then 3 x 5 = 15.",
        trap: "Starting with the numerator can hide what the equal parts are.",
      },
      {
        title: "Compare the size of pieces",
        bigIdea:
          "With the same whole, more equal slices means each slice is smaller.",
        steps: [
          "Check the whole is the same.",
          "Compare how many equal parts it is split into.",
          "Use a bar drawing if your eyes are unsure.",
        ],
        example: "1/4 is larger than 1/8 because fourths are bigger pieces.",
        trap: "A bigger denominator does not mean a bigger fraction.",
      },
      {
        title: "Equivalent fractions cover the same amount",
        bigIdea:
          "Equivalent fractions can look different but take up the same space on the same whole.",
        steps: [
          "Draw two same-length bars.",
          "Split them in different ways.",
          "Check whether the shaded amount lines up.",
        ],
        example: "1/2 and 2/4 are equal because they both cover half the bar.",
        trap: "Changing only the top or only the bottom changes the fraction.",
      },
      {
        title: "Simplifying keeps the value",
        bigIdea:
          "Simplifying divides the numerator and denominator by the same number so the fraction stays equal.",
        steps: [
          "Look for a common factor.",
          "Divide the top and bottom by that factor.",
          "Check the new fraction covers the same amount.",
        ],
        example: "4/8 simplifies to 1/2 because both 4 and 8 divide by 4.",
        trap: "Dividing only the numerator changes the fraction.",
      },
      {
        title: "Fractions can live on a number line",
        bigIdea:
          "A fraction is also a number, so it has a position between whole numbers.",
        steps: [
          "Find the whole interval from 0 to 1.",
          "Split it into denominator-sized equal jumps.",
          "Count numerator jumps from zero.",
        ],
        example:
          "3/4 is the third jump when 0 to 1 is split into four equal parts.",
        trap: "Unequal jumps make the number line misleading.",
      },
      {
        title: "The whole must stay the same",
        bigIdea: "A fraction only makes sense when you know what one whole is.",
        steps: [
          "Ask what object, set, or length is the whole.",
          "Keep that whole the same while comparing.",
          "Then decide what part is being described.",
        ],
        example:
          "1/2 of a small cookie is not the same amount as 1/2 of a large cake.",
        trap: "Comparing fractions from different wholes as if the wholes match.",
        visualCue:
          "Picture two bars with different lengths before shading half of each.",
        checkPrompt:
          "Say why 1/2 is not always the same amount in every story.",
        practiceLabels: ["Compare fractions", "Fraction of an amount"],
      },
      {
        title: "Unit fractions are building blocks",
        bigIdea:
          "A unit fraction has numerator 1 and shows the size of one equal part.",
        steps: [
          "Split the whole by the denominator.",
          "Name one part as the unit fraction.",
          "Build larger fractions from repeated unit fractions.",
        ],
        example:
          "If a whole is split into 6 parts, one part is 1/6 and four parts are 4/6.",
        trap: "Forgetting that 1/8 is smaller than 1/4 because the parts are thinner.",
        visualCue:
          "Picture one slice first, then count more slices of the same size.",
        checkPrompt: "Explain why 3/8 is three copies of 1/8.",
        practiceLabels: ["Number line", "Compare fractions"],
      },
      {
        title: "Fraction of a set",
        bigIdea:
          "Fractions can describe part of a group, not only part of a shape.",
        steps: [
          "Count the whole set.",
          "Divide by the denominator.",
          "Take the numerator number of equal groups.",
        ],
        example: "2/3 of 24 beads: 24 / 3 = 8, then 2 x 8 = 16 beads.",
        trap: "Taking the numerator first before making equal groups.",
        visualCue:
          "Picture 24 beads sorted into 3 equal bowls, then choose 2 bowls.",
        checkPrompt: "Tell what the denominator does in 3/5 of 40.",
        practiceLabels: ["Fraction of an amount"],
      },
      {
        title: "Multiply top and bottom together",
        bigIdea:
          "Equivalent fractions are made by scaling the numerator and denominator by the same number.",
        steps: [
          "Choose a scale factor.",
          "Multiply the numerator by it.",
          "Multiply the denominator by the same factor.",
        ],
        example: "3/5 scaled by 4 becomes 12/20.",
        trap: "Scaling only the numerator makes a different fraction.",
        visualCue:
          "Picture cutting every old slice into the same number of smaller slices.",
        checkPrompt: "Explain why 2/3 and 8/12 still cover the same amount.",
        practiceLabels: ["Equivalent fractions"],
      },
      {
        title: "Simplify in steps",
        bigIdea:
          "You can simplify a fraction little by little if you do not see the biggest common factor yet.",
        steps: [
          "Look for any common factor.",
          "Divide top and bottom by that factor.",
          "Repeat until no common factor remains.",
        ],
        example: "18/24 can become 9/12, then 3/4.",
        trap: "Thinking you failed if you did not simplify in one jump.",
        visualCue:
          "Picture folding a fraction smaller while keeping the shaded amount the same.",
        checkPrompt: "Show a two-step simplification for 12/18.",
        practiceLabels: ["Simplify fractions", "Equivalent fractions"],
      },
      {
        title: "Use half as a benchmark",
        bigIdea:
          "Many fraction comparisons become easier when you ask whether each fraction is less than, equal to, or greater than 1/2.",
        steps: [
          "Find half of the denominator.",
          "Compare the numerator with that halfway point.",
          "Use that to judge the size.",
        ],
        example:
          "5/8 is more than 1/2 because half of 8 is 4, and 5 is bigger than 4.",
        trap: "Comparing only the numerator without thinking about the denominator.",
        visualCue: "Picture a bar with the halfway line marked first.",
        checkPrompt:
          "Decide whether 3/7 is less or more than half, and say why.",
        practiceLabels: ["Compare fractions", "Number line"],
      },
      {
        title: "Fractions near one",
        bigIdea:
          "A fraction is close to one whole when the numerator is close to the denominator.",
        steps: [
          "Compare numerator and denominator.",
          "Ask how many parts are missing from one whole.",
          "Use that missing part to compare.",
        ],
        example: "7/8 is close to 1 because it is only missing 1/8.",
        trap: "Thinking 7/8 is small because 8 is a large denominator.",
        visualCue:
          "Picture a nearly full bar with only one small piece unshaded.",
        checkPrompt: "Explain why 9/10 is closer to 1 than 3/4.",
        practiceLabels: ["Compare fractions", "Number line"],
      },
    ],
  },
  decimals: {
    goal: "Use place-value columns to compare decimals and scale by 10, 100, or 1000.",
    bigIdea:
      "Decimals are place value for parts smaller than one: tenths, hundredths, and thousandths.",
    steps: [
      "Line up the decimal places.",
      "Use zeros at the end to compare if helpful.",
      "For x10, x100, and x1000, move digits through columns.",
    ],
    example: "0.7 is 0.70, so it is 70 hundredths and greater than 0.56.",
    trap: "More decimal digits does not always mean the number is bigger.",
    recaps: [
      {
        title: "Line up the decimal point",
        bigIdea:
          "Decimal places are columns. Lining up the decimal point lines up the place values.",
        steps: [
          "Write the numbers one above the other.",
          "Line up the decimal points.",
          "Add zeros at the end only if they help you compare.",
        ],
        example: "0.7 = 0.70, so 0.70 is greater than 0.56.",
        trap: "Do not compare 7 and 56 as whole numbers.",
      },
      {
        title: "Decimals are parts of one",
        bigIdea:
          "Tenths, hundredths, and thousandths are smaller place-value columns after the decimal point.",
        steps: [
          "Say the number using place-value words.",
          "Find the tenths column first.",
          "Then compare hundredths and thousandths if needed.",
        ],
        example: "0.47 means forty-seven hundredths.",
        trap: "Reading 0.47 as 'zero point four seven' can hide the place value.",
      },
      {
        title: "Multiplying by 10 moves place value",
        bigIdea:
          "When multiplying or dividing by 10, 100, or 1000, digits move through columns.",
        steps: [
          "Count how many zeros are in 10, 100, or 1000.",
          "Move that many place-value columns.",
          "Check whether the number should become larger or smaller.",
        ],
        example: "0.036 x 1000 = 36.",
        trap: "Just adding zeros can give a very wrong decimal answer.",
      },
      {
        title: "Money helps decimals make sense",
        bigIdea: "Dollars and cents are decimals: hundredths are like cents.",
        steps: [
          "Line up the decimal point.",
          "Add or subtract dollars with dollars and cents with cents.",
          "Check the answer has sensible money place value.",
        ],
        example: "HK$4.50 + HK$2.35 = HK$6.85.",
        trap: "Writing 4.5 + 2.35 as 2.80 ignores the dollars column.",
      },
      {
        title: "Zero can hold an important place",
        bigIdea: "A zero inside a decimal can hold a place-value column open.",
        steps: [
          "Read the decimal slowly.",
          "Notice zeros between non-zero digits.",
          "Compare column by column.",
        ],
        example: "2.05 is two and five hundredths, not two and five tenths.",
        trap: "Dropping the zero in 2.05 changes how the number feels.",
      },
      {
        title: "Tenths come before hundredths",
        bigIdea:
          "The first digit after the decimal is tenths, and the second digit is hundredths.",
        steps: [
          "Find the decimal point.",
          "Read the first digit after it as tenths.",
          "Read the second digit after it as hundredths.",
        ],
        example: "0.36 is 3 tenths and 6 hundredths, or 36 hundredths.",
        trap: "Calling 0.36 thirty-six tenths instead of thirty-six hundredths.",
        visualCue:
          "Picture a place-value chart with tenths as the first small column.",
        checkPrompt: "Read 0.58 using place-value words.",
        practiceLabels: ["Place value"],
      },
      {
        title: "Trailing zeros do not change value",
        bigIdea:
          "Zeros at the end of a decimal can help compare numbers without changing the value.",
        steps: [
          "Add zeros only to the end.",
          "Line up the decimal places.",
          "Compare column by column.",
        ],
        example: "0.7, 0.70, and 0.700 all have the same value.",
        trap: "Thinking 0.700 is larger because it has more digits.",
        visualCue:
          "Picture the same shaded amount written with different place-value labels.",
        checkPrompt: "Explain why 2.5 and 2.50 are equal.",
        practiceLabels: ["Decimal comparison", "Place value"],
      },
      {
        title: "Compare one column at a time",
        bigIdea:
          "Decimal comparison is calmer when you compare from left to right by place value.",
        steps: [
          "Compare the ones first.",
          "If tied, compare tenths.",
          "Continue to hundredths and thousandths only if needed.",
        ],
        example:
          "3.48 is greater than 3.407 because the tenths tie, but 8 hundredths is greater than 0 hundredths.",
        trap: "Reading the decimal part like a whole number without place value.",
        visualCue:
          "Picture two numbers stacked in columns with the decimal points lined up.",
        checkPrompt: "Compare 4.09 and 4.1 by saying each place-value column.",
        practiceLabels: ["Decimal comparison"],
      },
      {
        title: "Estimate decimal sums",
        bigIdea: "A quick estimate helps catch decimal addition mistakes.",
        steps: [
          "Round each number to a friendly nearby value.",
          "Add the estimate mentally.",
          "Check your exact answer is close.",
        ],
        example: "2.85 + 4.12 should be close to 3 + 4 = 7.",
        trap: "Accepting 2.85 + 4.12 = 6.097 because the digits look familiar.",
        visualCue:
          "Picture the exact answer sitting near a simple rounded answer.",
        checkPrompt: "Estimate 5.92 + 1.08 before adding exactly.",
        practiceLabels: ["Decimal addition"],
      },
      {
        title: "Subtract decimals by lining up",
        bigIdea:
          "Decimal subtraction works like whole-number subtraction when place values are lined up.",
        steps: [
          "Write the larger number on top.",
          "Line up decimal points.",
          "Use zeros as placeholders if a place is empty.",
        ],
        example: "5.00 - 2.35 lines up hundredths, so the answer is 2.65.",
        trap: "Subtracting digits that are not in the same place-value column.",
        visualCue:
          "Picture dollars and cents stacked neatly before subtracting.",
        checkPrompt:
          "Explain why 6.4 can be written as 6.40 before subtracting.",
        practiceLabels: ["Decimal subtraction"],
      },
      {
        title: "Multiplying by 100 means two moves",
        bigIdea: "Each zero in 10, 100, or 1000 means one place-value move.",
        steps: [
          "Count the zeros.",
          "Move digits that many columns larger for multiplication.",
          "Check that the answer is bigger.",
        ],
        example: "0.48 x 100 moves two columns larger, giving 48.",
        trap: "Moving only one place for x100.",
        visualCue:
          "Picture each digit sliding two columns left on a place-value chart.",
        checkPrompt: "Say how many moves are needed for x1000.",
        practiceLabels: ["Powers of 10"],
      },
      {
        title: "Dividing by 10 makes numbers smaller",
        bigIdea:
          "Dividing by 10, 100, or 1000 moves digits to smaller place-value columns.",
        steps: [
          "Count the zeros.",
          "Move digits that many columns smaller.",
          "Check that the answer is smaller than the starting number.",
        ],
        example: "36 / 100 = 0.36.",
        trap: "Forgetting to check whether the answer should be smaller.",
        visualCue:
          "Picture each digit sliding right into tenths and hundredths.",
        checkPrompt: "Explain why 7.2 / 10 is less than 7.2.",
        practiceLabels: ["Powers of 10", "Place value"],
      },
    ],
  },
  percentages: {
    goal: "Use benchmark percentages and always identify the whole.",
    bigIdea:
      "Percent means out of 100. A percentage only makes sense when we know the whole it refers to.",
    steps: [
      "Ask: percent of what whole?",
      "Use benchmarks: 50% is half, 25% is a quarter, 10% is one tenth.",
      "Check whether the question asks for the amount or the final value.",
    ],
    example: "25% of 80 means one quarter of 80, so 80 / 4 = 20.",
    trap: "Do not treat the percent number itself as the answer.",
    recaps: [
      {
        title: "Percent means out of 100",
        bigIdea:
          "A percent is a fraction with 100 as the whole, so it always needs a whole amount.",
        steps: [
          "Ask: percent of what?",
          "Turn the percent into a benchmark if possible.",
          "Find the amount from the whole.",
        ],
        example: "25% of 80 is one quarter of 80, which is 20.",
        trap: "25% is not 25 unless the whole is 100.",
      },
      {
        title: "Use friendly benchmarks",
        bigIdea:
          "Many percentages become easy when you know 50%, 25%, 10%, and 5%.",
        steps: [
          "50% means half.",
          "25% means one quarter.",
          "10% means one tenth, and 5% is half of 10%.",
        ],
        example: "5% of 60: 10% is 6, so 5% is 3.",
        trap: "Do not reach for a long method when a benchmark works.",
      },
      {
        title: "Discounts have two answers to watch",
        bigIdea:
          "A discount question may ask for the discount amount or the final sale price.",
        steps: [
          "Find the discount amount.",
          "Read whether the question asks for the amount off or final price.",
          "Subtract the discount from the original price for sale price.",
        ],
        example: "25% off HK$40 is HK$10 off, so the sale price is HK$30.",
        trap: "Stopping at the discount amount when the question asks for sale price.",
      },
      {
        title: "Percent, fraction, and decimal are connected",
        bigIdea: "Many common percentages have fraction and decimal partners.",
        steps: [
          "50% is 1/2 and 0.5.",
          "25% is 1/4 and 0.25.",
          "10% is 1/10 and 0.1.",
        ],
        example: "25% of 60 is the same as 1/4 of 60, which is 15.",
        trap: "Do not switch forms unless the whole stays the same.",
      },
      {
        title: "Find the whole before calculating",
        bigIdea:
          "The same percent can mean different amounts when the whole changes.",
        steps: [
          "Underline the whole.",
          "Choose a benchmark strategy.",
          "Check whether the answer is reasonable compared with the whole.",
        ],
        example: "10% of 30 is 3, but 10% of 90 is 9.",
        trap: "A percent answer without a whole is incomplete.",
      },
      {
        title: "The 100-grid meaning",
        bigIdea: "Percent means a number of parts out of 100 equal parts.",
        steps: [
          "Picture 100 equal squares.",
          "Shade the percent number of squares.",
          "Connect the shading to a fraction out of 100.",
        ],
        example: "37% means 37 out of 100 squares, or 37/100.",
        trap: "Treating a percent as a standalone number without a whole.",
        visualCue: "Picture a 10 by 10 grid and shade the percent amount.",
        checkPrompt: "Explain what 62% means using the words 'out of 100.'",
        practiceLabels: ["Percent conversion"],
      },
      {
        title: "Use 10 percent as an anchor",
        bigIdea: "Once you know 10%, you can build many other percentages.",
        steps: [
          "Find 10% by dividing by 10.",
          "Double it for 20% or triple it for 30%.",
          "Combine anchors when needed.",
        ],
        example: "30% of 80 is three lots of 8, so it is 24.",
        trap: "Multiplying by 30 instead of finding 30% of the whole.",
        visualCue: "Picture three equal 10% strips stacked together.",
        checkPrompt: "Use 10% to explain 40% of 90.",
        practiceLabels: ["Benchmark percent"],
      },
      {
        title: "One percent is a tiny anchor",
        bigIdea:
          "1% is one hundredth of the whole, so it can help with less friendly percentages.",
        steps: [
          "Find 1% by dividing the whole by 100.",
          "Multiply by the percent you need.",
          "Check whether the answer is reasonable.",
        ],
        example: "7% of 200: 1% is 2, so 7% is 14.",
        trap: "Forgetting that 1% is much smaller than 10%.",
        visualCue:
          "Picture one square from a 100-square grid, then count more squares.",
        checkPrompt: "Explain how 1% helps you find 6% of 300.",
        practiceLabels: ["Benchmark percent"],
      },
      {
        title: "Discount amount or sale price",
        bigIdea:
          "Discount questions often have two important numbers: the amount off and the price after discount.",
        steps: [
          "Find the amount off.",
          "Read what the question asks for.",
          "Subtract if it asks for the sale price.",
        ],
        example: "20% off HK$150 is HK$30 off, so the sale price is HK$120.",
        trap: "Giving the discount amount when the question asks for the sale price.",
        visualCue:
          "Picture a price tag, then cross out the discount part before reading the final price.",
        checkPrompt:
          "Say both numbers for 25% off HK$80: amount off and sale price.",
        practiceLabels: ["Discount story"],
      },
      {
        title: "Percent and fractions are partners",
        bigIdea: "A percent can often be simplified into a friendly fraction.",
        steps: [
          "Write the percent over 100.",
          "Simplify the fraction.",
          "Use the fraction if it makes the calculation easier.",
        ],
        example: "40% = 40/100 = 2/5.",
        trap: "Using an unsimplified fraction when a friendly one is available.",
        visualCue:
          "Picture 40 shaded squares becoming 2 shaded fifths of the same grid.",
        checkPrompt: "Convert 60% into a simplified fraction and explain it.",
        practiceLabels: ["Percent conversion", "Benchmark percent"],
      },
      {
        title: "Find the whole by undoing",
        bigIdea:
          "When you know the percent part, finding the whole means undoing the percent relationship.",
        steps: [
          "Name the part you know.",
          "Name the percent relationship.",
          "Use the benchmark or fraction to rebuild the whole.",
        ],
        example:
          "15 is 25% of a number. Since 25% is 1/4, the whole is 15 x 4 = 60.",
        trap: "Dividing or multiplying before identifying what the percent means.",
        visualCue:
          "Picture one known piece, then rebuild all equal pieces of the whole.",
        checkPrompt: "Explain why 12 is 20% of 60 by rebuilding the whole.",
        practiceLabels: ["Find the whole"],
      },
      {
        title: "Check percent reasonableness",
        bigIdea:
          "A percent answer should make sense compared with the whole and the size of the percent.",
        steps: [
          "Decide whether the percent is less than or more than 50%.",
          "Compare your answer with half of the whole.",
          "Recheck if the answer is not sensible.",
        ],
        example:
          "80% of 50 should be more than 25 because 80% is more than half.",
        trap: "Accepting an answer without comparing it to the whole.",
        visualCue:
          "Picture the whole bar, the halfway mark, and the percent amount.",
        checkPrompt:
          "Before calculating 15% of 200, say whether the answer should be small or large.",
        practiceLabels: ["Benchmark percent", "Discount story"],
      },
    ],
  },
};

function daySeed() {
  const now = new Date();
  return Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`,
  );
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function loadPracticeHistory() {
  try {
    const saved = window.localStorage.getItem(DAILY_PROGRESS_KEY);
    if (saved) return JSON.parse(saved).slice(0, 20) as DailyPracticeRecord[];
    const legacy = window.localStorage.getItem(LEGACY_DAILY_PROGRESS_KEY);
    if (!legacy) return [];
    return (JSON.parse(legacy) as Partial<DailyPracticeRecord>[])
      .filter((record) => record.date && record.topic)
      .map((record, index) => ({
        id: `legacy-${record.date}-${index}`,
        date: String(record.date),
        completedAt: String(record.completedAt ?? record.date),
        topic: record.topic as Topic,
        lessonTitle: "Earlier daily practice",
        total: Number(record.total ?? 0),
        correct: Number(record.correct ?? 0),
        firstTryCorrect: Number(record.correct ?? 0),
        needsReview: (record.needsReview ?? []) as Topic[],
        items: [],
      }));
  } catch {
    return [];
  }
}

function pick<T>(items: readonly T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function spread(seed: number, salt: number, modulus: number) {
  if (modulus <= 1) return 0;
  let value = Math.imul(seed ^ salt, 0x45d9f3b);
  value ^= value >>> 16;
  value = Math.imul(value, 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) % modulus;
}

function spreadPick<T>(items: readonly T[], seed: number, salt: number) {
  return items[spread(seed, salt, items.length)];
}

function options(answer: number, distractors: number[]) {
  const unique = Array.from(
    new Set(
      [answer, ...distractors].filter(
        (value) => Number.isFinite(value) && value > 0,
      ),
    ),
  );
  for (let offset = 1; unique.length < 4 && offset < 20; offset += 1) {
    const lower = answer - offset;
    const higher = answer + offset;
    if (lower > 0 && !unique.includes(lower)) unique.push(lower);
    if (!unique.includes(higher)) unique.push(higher);
  }
  return unique
    .slice(0, 4)
    .map(String)
    .sort(
      (left, right) =>
        ((Number(left) * 13 + answer) % 7) -
        ((Number(right) * 13 + answer) % 7),
    );
}

function decimalOptions(answer: string, distractors: string[]) {
  const answerValue = Number(answer);
  const unique = [answer, ...distractors].filter(
    (choice, position, all) =>
      Number.isFinite(Number(choice)) &&
      Number(choice) > 0 &&
      all.findIndex((item) => Number(item) === Number(choice)) === position,
  );
  for (let offset = 1; unique.length < 4 && offset < 20; offset += 1) {
    for (const candidate of [
      (answerValue + offset / 10).toFixed(2),
      Math.max(0.01, answerValue - offset / 10).toFixed(2),
    ]) {
      if (!unique.some((choice) => Number(choice) === Number(candidate))) {
        unique.push(candidate);
      }
    }
  }
  return unique.slice(0, 4).sort();
}

function formatDecimal(value: number, places = 2) {
  return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
}

function formatMoneyDecimal(cents: number) {
  return (cents / 100).toFixed(2);
}

function parseFraction(value: string) {
  const match = value.trim().match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (denominator === 0) return null;
  return { numerator, denominator };
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function simplifyParts(numerator: number, denominator: number) {
  const factor = gcd(numerator, denominator);
  return [numerator / factor, denominator / factor] as const;
}

const coreFractions = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [1, 6],
  [5, 6],
  [1, 7],
  [2, 7],
  [3, 7],
  [4, 7],
  [5, 7],
  [6, 7],
  [1, 8],
  [3, 8],
  [5, 8],
  [7, 8],
  [1, 9],
  [2, 9],
  [4, 9],
  [5, 9],
  [7, 9],
  [8, 9],
  [1, 10],
  [3, 10],
  [7, 10],
  [9, 10],
  [1, 12],
  [5, 12],
  [7, 12],
  [11, 12],
] as const;

function sameFraction(left: string, right: string) {
  const a = parseFraction(left);
  const b = parseFraction(right);
  if (!a || !b) return false;
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

function fractionChoices(answer: string, distractors: string[]) {
  const fill = ["Cannot tell", "1/3", "3/4", "2/5", "5/6", "4/9", "1/5"];
  const choices = [answer];
  for (const choice of [...distractors, ...fill]) {
    if (
      choices.length >= 4 ||
      choices.includes(choice) ||
      sameFraction(answer, choice)
    ) {
      continue;
    }
    choices.push(choice);
  }
  return choices.slice(0, 4).sort();
}

export function isAnswerCorrect(question: Question, selected: string) {
  if (question.answerType === "fraction-equivalent") {
    return sameFraction(question.answer, selected);
  }
  return selected === question.answer;
}

function validateQuestion(question: Question) {
  const uniqueChoices = Array.from(new Set(question.choices));
  const correctChoices = uniqueChoices.filter((choice) =>
    isAnswerCorrect(question, choice),
  );
  if (correctChoices.length !== 1 || correctChoices[0] !== question.answer) {
    throw new Error(
      `Invalid choices for ${question.id}: expected only ${question.answer}, got ${correctChoices.join(", ")}`,
    );
  }
  return { ...question, choices: uniqueChoices };
}

function rotateTemplates(source: Template[], seed: number, count: number) {
  const selected: Template[] = [];
  const limit = Math.min(count, source.length);
  let step = 2 + spread(seed, 29, Math.max(1, source.length - 1));
  while (source.length > 1 && gcd(step, source.length) !== 1) {
    step += 1;
  }
  const start = spread(seed, 31, source.length);
  for (
    let offset = 0;
    selected.length < limit && offset < source.length * 2;
    offset += 1
  ) {
    const template = source[(start + offset * step) % source.length];
    if (!selected.some((item) => item.label === template.label)) {
      selected.push(template);
    }
  }
  return selected;
}

export function inferredPracticeLabels(topic: Topic, lesson: LessonRecap) {
  if (lesson.practiceLabels?.length) {
    const labels = new Set(lesson.practiceLabels);
    for (const label of lesson.practiceLabels) {
      if (label === "Fact family") labels.add("Missing number");
      if (label === "Missing number") labels.add("Fact family");
      if (label === "Story problem") labels.add("Array model");
      if (label === "Array model") labels.add("Story problem");
      if (label === "Division story") labels.add("Fact family");
      if (label === "Fraction of an amount") labels.add("Number line");
      if (label === "Decimal comparison") labels.add("Place value");
      if (label === "Decimal addition") labels.add("Decimal subtraction");
      if (label === "Decimal subtraction") labels.add("Decimal addition");
      if (label === "Powers of 10") labels.add("Place value");
      if (label === "Place value") labels.add("Decimal comparison");
      if (label === "Number line") labels.add("Compare fractions");
      if (label === "Equivalent fractions") labels.add("Simplify fractions");
      if (label === "Simplify fractions") labels.add("Equivalent fractions");
      if (label === "Benchmark percent") labels.add("Percent conversion");
      if (label === "Percent conversion") labels.add("Benchmark percent");
      if (label === "Find the whole") labels.add("Benchmark percent");
      if (label === "Discount story") labels.add("Benchmark percent");
    }
    return Array.from(labels);
  }
  const text = `${lesson.title} ${lesson.bigIdea}`.toLowerCase();
  if (topic === "multiplication") {
    if (text.includes("array")) return ["Array model", "Story problem"];
    if (text.includes("division") || text.includes("groups")) {
      return ["Division story", "Fact family"];
    }
    if (text.includes("missing")) return ["Missing number", "Fact family"];
    return ["Fact family", "Story problem", "Missing number"];
  }
  if (topic === "fractions") {
    if (text.includes("equivalent")) {
      return ["Equivalent fractions", "Simplify fractions", "Number line"];
    }
    if (text.includes("simpl")) {
      return ["Simplify fractions", "Equivalent fractions"];
    }
    if (text.includes("number line")) {
      return ["Number line", "Compare fractions", "Equivalent fractions"];
    }
    if (text.includes("compare") || text.includes("pieces")) {
      return ["Compare fractions", "Number line"];
    }
    return ["Fraction of an amount", "Number line"];
  }
  if (topic === "decimals") {
    if (text.includes("money"))
      return ["Decimal addition", "Decimal subtraction"];
    if (text.includes("10") || text.includes("100") || text.includes("1000")) {
      return ["Powers of 10", "Place value"];
    }
    if (text.includes("compare")) return ["Decimal comparison", "Place value"];
    return ["Place value", "Decimal comparison"];
  }
  if (text.includes("discount")) return ["Discount story", "Benchmark percent"];
  if (text.includes("whole")) return ["Find the whole", "Benchmark percent"];
  if (text.includes("fraction") || text.includes("decimal")) {
    return ["Percent conversion", "Benchmark percent"];
  }
  return ["Benchmark percent", "Discount story"];
}

const topicTeachingDefaults: Record<
  Topic,
  { visualCue: string; checkPrompt: string }
> = {
  multiplication: {
    visualCue:
      "Imagine equal groups arranged in rows. The total is all the groups together, and division asks you to undo that total.",
    checkPrompt:
      "Say one multiplication fact and the two division facts that belong with it.",
  },
  fractions: {
    visualCue:
      "Picture one same-size bar. The denominator makes equal parts; the numerator counts how many of those parts are used.",
    checkPrompt:
      "Explain what the denominator does before saying what the numerator does.",
  },
  decimals: {
    visualCue:
      "Picture place-value columns on both sides of the decimal point: ones, tenths, hundredths, thousandths.",
    checkPrompt:
      "Read the decimal using place-value words before you calculate.",
  },
  percentages: {
    visualCue:
      "Picture a 100-square grid. The percent tells how many of those 100 squares are selected.",
    checkPrompt: "Start by saying, 'percent of what whole?' before solving.",
  },
};

const templates: Template[] = [
  {
    topic: "multiplication",
    label: "Fact family",
    build(seed) {
      const facts = Array.from({ length: 121 }, (_, index) => {
        const a = 2 + (index % 11);
        const b = 2 + Math.floor(index / 11);
        return [a, b] as const;
      });
      const [a, b] = spreadPick(facts, seed, 101);
      const total = a * b;
      const divideByA = spread(seed, 103, 2) === 0;
      const prompt = spreadPick(
        [
          `If ${a} x ${b} = ${total}, what is ${total} / ${divideByA ? a : b}?`,
          `${a} x ${b} makes ${total}. Which number completes ${total} / ${divideByA ? a : b}?`,
          `Use the fact family for ${a}, ${b}, and ${total}: ${total} / ${divideByA ? a : b} = ?`,
        ],
        seed,
        105,
      );
      return {
        id: `fact-family-${a}-${b}-${divideByA ? "a" : "b"}`,
        topic: "multiplication",
        label: "Fact family",
        prompt,
        choices: options(divideByA ? b : a, [
          divideByA ? a : b,
          (divideByA ? b : a) + 1,
          (divideByA ? b : a) - 1,
          total - (divideByA ? a : b),
        ]),
        answer: String(divideByA ? b : a),
        hint: "Use the same fact family. Division undoes multiplication.",
        explanation: `${a} x ${b} = ${total}, so ${total} divided by ${divideByA ? a : b} gives the missing factor ${divideByA ? b : a}.`,
        parentNote: "Ask Haim to say the full fact family aloud.",
      };
    },
  },
  {
    topic: "multiplication",
    label: "Story problem",
    build(seed) {
      const items = [
        "gymnastics ribbons",
        "cheer practice counts",
        "taekwondo kick sets",
        "craft beads",
        "drawing markers",
        "book-club stickers",
        "recipe cards",
        "K-pop photo cards",
        "science-kit pieces",
        "practice stars",
      ];
      const groups = 3 + spread(seed, 111, 8);
      const size = 4 + spread(seed, 113, 9);
      const item = spreadPick(items, seed, 115);
      const answer = groups * size;
      return {
        id: `story-multiply-${groups}-${size}`,
        topic: "multiplication",
        label: "Story problem",
        prompt: `Haim has ${groups} groups of ${size} ${item}. How many ${item} altogether?`,
        choices: options(answer, [
          groups + size,
          answer - groups,
          answer + size,
          groups * (size - 1),
        ]),
        answer: String(answer),
        hint: "Equal groups usually means multiplication.",
        explanation: `${groups} equal groups of ${size} means ${groups} x ${size} = ${answer}.`,
        parentNote:
          "Ask whether the answer is a total, a group size, or a number of groups.",
      };
    },
  },
  {
    topic: "multiplication",
    label: "Missing number",
    build(seed) {
      const a = 2 + spread(seed, 121, 11);
      const b = 2 + spread(seed, 123, 11);
      const total = a * b;
      const prompt = spreadPick(
        [
          `${a} x ? = ${total}`,
          `What number makes this true: ${a} x ? = ${total}?`,
          `Fill the missing factor: ${a} x ? = ${total}.`,
        ],
        seed,
        125,
      );
      return {
        id: `missing-${a}-${b}`,
        topic: "multiplication",
        label: "Missing number",
        prompt,
        choices: options(b, [a, b - 2, b + 2, total / 2]),
        answer: String(b),
        hint: `Ask: ${total} divided by ${a} equals what?`,
        explanation: `The missing number is ${b}, because ${a} x ${b} = ${total}.`,
        parentNote:
          "Missing-number problems become easier when she uses the inverse operation.",
      };
    },
  },
  {
    topic: "multiplication",
    label: "Division story",
    build(seed) {
      const items = [
        ["stickers", "bags"],
        ["cheer bows", "boxes"],
        ["craft beads", "bracelets"],
        ["taekwondo badges", "rows"],
        ["bookmarks", "folders"],
        ["recipe cards", "piles"],
        ["gymnastics clips", "kits"],
        ["drawing pencils", "cups"],
      ] as const;
      const groups = 3 + spread(seed, 131, 9);
      const answer = 4 + spread(seed, 133, 9);
      const total = groups * answer;
      const [item, container] = spreadPick(items, seed, 135);
      return {
        id: `division-story-${total}-${groups}`,
        topic: "multiplication",
        label: "Division story",
        prompt: `${total} ${item} are shared equally into ${groups} ${container}. How many are in each ${container.slice(0, -1)}?`,
        choices: options(answer, [
          groups,
          answer + 1,
          answer - 1,
          total - groups,
        ]),
        answer: String(answer),
        hint: `Ask which number times ${groups} makes ${total}.`,
        explanation: `${total} split into ${groups} equal groups is ${answer}, because ${groups} x ${answer} = ${total}.`,
        parentNote:
          "Ask Haim to name whether she is finding the group size or the number of groups.",
      };
    },
  },
  {
    topic: "multiplication",
    label: "Array model",
    build(seed) {
      const items = [
        "chairs",
        "drawing squares",
        "tiles",
        "stage spots",
        "garden pots",
        "notebook boxes",
        "bakery trays",
        "robot parts",
      ];
      const rows = 3 + spread(seed, 141, 8);
      const columns = 4 + spread(seed, 143, 9);
      const item = spreadPick(items, seed, 145);
      const answer = rows * columns;
      return {
        id: `array-${rows}-${columns}`,
        topic: "multiplication",
        label: "Array model",
        prompt: `There are ${rows} rows with ${columns} ${item} in each row. How many ${item} altogether?`,
        choices: options(answer, [
          rows + columns,
          answer - rows,
          answer + columns,
          rows * (columns - 1),
        ]),
        answer: String(answer),
        hint: "Rows and columns make an array, so multiply.",
        explanation: `${rows} rows of ${columns} is ${rows} x ${columns} = ${answer}.`,
        parentNote: "Arrays help connect multiplication to area later.",
      };
    },
  },
  {
    topic: "fractions",
    label: "Fraction of an amount",
    build(seed) {
      const denominators = [3, 4, 5, 6, 8, 10, 12];
      const den = spreadPick(denominators, seed, 151);
      const num = 1 + spread(seed, 153, den - 1);
      const unit = 3 + spread(seed, 155, 10);
      const whole = den * unit;
      const answer = unit * num;
      const prompt = spreadPick(
        [
          `What is ${num}/${den} of ${whole}?`,
          `Find ${num}/${den} of ${whole}.`,
          `${whole} is the whole. How much is ${num}/${den} of it?`,
        ],
        seed,
        157,
      );
      return {
        id: `fraction-amount-${num}-${den}-${whole}`,
        topic: "fractions",
        label: "Fraction of an amount",
        prompt,
        choices: options(answer, [
          unit,
          whole - answer,
          answer + den,
          den * num,
        ]),
        answer: String(answer),
        hint: `First find 1/${den} by doing ${whole} / ${den}.`,
        explanation: `${whole} / ${den} = ${unit}, so ${num}/${den} is ${num} x ${unit} = ${answer}.`,
        parentNote: "Ask: what does the denominator tell us to do first?",
      };
    },
  },
  {
    topic: "fractions",
    label: "Simplify fractions",
    build(seed) {
      const [num, den] = spreadPick(coreFractions, seed, 161);
      const scale = 2 + spread(seed, 163, 8);
      const base = `${num * scale}/${den * scale}`;
      const answer = `${num}/${den}`;
      const prompt = spreadPick(
        [
          `What is ${base} in simplest form?`,
          `Simplify ${base}.`,
          `Reduce ${base} to its simplest fraction.`,
        ],
        seed,
        165,
      );
      return {
        id: `fraction-simplify-${base}`,
        topic: "fractions",
        label: "Simplify fractions",
        prompt,
        choices: fractionChoices(answer, [
          `${num + 1}/${den}`,
          `${num}/${den + 1}`,
          `${num * scale}/${den}`,
          `${den}/${num}`,
        ]),
        answer,
        answerType: "fraction-equivalent",
        hint: "Divide the numerator and denominator by the same common factor.",
        explanation: `${base} simplifies to ${answer}. The value stays the same because both parts are scaled together.`,
        parentNote:
          "Ask Haim what common factor works for both numerator and denominator.",
      };
    },
  },
  {
    topic: "fractions",
    label: "Number line",
    build(seed) {
      const denominators = [
        3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20,
      ];
      const den = spreadPick(denominators, seed, 171);
      const num = 1 + spread(seed, 173, den - 1);
      const answer = `${num}/${den}`;
      const prompt = spreadPick(
        [
          `On a number line from 0 to 1, where do you land after ${num} equal jumps out of ${den}?`,
          `A number line from 0 to 1 is split into ${den} equal parts. Which fraction is the ${num}th tick mark?`,
          `If one whole is split into ${den} equal jumps, what point is reached after ${num} jumps?`,
          `Start at 0 and make ${num} jumps on a line split into ${den} equal parts. Where are you?`,
          `Which fraction names the point ${num} jumps from 0 when one whole has ${den} equal jumps?`,
        ],
        seed,
        175,
      );
      return {
        id: `fraction-number-line-${answer}`,
        topic: "fractions",
        label: "Number line",
        prompt,
        choices: fractionChoices(answer, [
          `${Math.max(1, num - 1)}/${den}`,
          `${Math.min(den - 1, num + 1)}/${den}`,
          `${num}/${den + 1}`,
          "1",
        ]),
        answer,
        answerType: "fraction-equivalent",
        hint: "Split the space from 0 to 1 into equal jumps.",
        explanation: `${num} equal jumps out of ${den} lands at ${answer} of the whole interval from 0 to 1.`,
        parentNote: "If unsure, draw a line from 0 to 1 and mark equal jumps.",
      };
    },
  },
  {
    topic: "fractions",
    label: "Equivalent fractions",
    build(seed) {
      const den = 2 + spread(seed, 181, 11);
      const num = 1 + spread(seed, 183, den - 1);
      const scale = 2 + spread(seed, 185, 11);
      const [simpleNum, simpleDen] = simplifyParts(num, den);
      const base = `${simpleNum}/${simpleDen}`;
      const answer = `${simpleNum * scale}/${simpleDen * scale}`;
      const prompt = spreadPick(
        [
          `Which fraction is equal to ${base}?`,
          `Multiply the top and bottom of ${base} by ${scale}. Which equivalent fraction do you get?`,
          `Which choice shows ${base} scaled by ${scale} without changing its value?`,
          `Scale ${base} by ${scale}. Which answer names the same amount?`,
          `Which fraction is a same-value version of ${base} using scale factor ${scale}?`,
        ],
        seed,
        187,
      );
      return {
        id: `fraction-equivalent-${base}-${answer}`,
        topic: "fractions",
        label: "Equivalent fractions",
        prompt,
        choices: fractionChoices(answer, [
          `${simpleNum * scale}/${simpleDen * scale + 1}`,
          `${simpleNum * scale + 1}/${simpleDen * scale}`,
          `${simpleNum}/${simpleDen + 1}`,
          `${simpleDen}/${simpleNum}`,
        ]),
        answer,
        answerType: "fraction-equivalent",
        hint: "Equivalent fractions cover the same amount of the same whole.",
        explanation: `${base} and ${answer} name the same part of the whole because the numerator and denominator changed by the same scale.`,
        parentNote:
          "Drawing two bars with the same length helps make equivalent fractions feel real.",
      };
    },
  },
  {
    topic: "fractions",
    label: "Compare fractions",
    build(seed) {
      const pattern = spread(seed, 191, 3);
      let left = "";
      let right = "";
      let answer = "";
      let reason = "";
      if (pattern === 0) {
        const num = 1 + spread(seed, 193, 4);
        const leftDen = num + 3 + spread(seed, 195, 5);
        const rightDen = leftDen + 1 + spread(seed, 197, 4);
        left = `${num}/${leftDen}`;
        right = `${num}/${rightDen}`;
        answer = left;
        reason =
          "When the numerator is the same, fewer equal parts means each part is larger.";
      } else if (pattern === 1) {
        const den = 5 + spread(seed, 199, 6);
        const leftNum = 1 + spread(seed, 201, den - 2);
        const rightNum = leftNum + 1;
        left = `${leftNum}/${den}`;
        right = `${rightNum}/${den}`;
        answer = right;
        reason =
          "When the denominator is the same, the larger numerator has more of the same-sized parts.";
      } else {
        const [num, den] = spreadPick(coreFractions, seed, 203);
        const scale = 2 + spread(seed, 205, 6);
        left = `${num}/${den}`;
        right = `${num * scale}/${den * scale}`;
        answer = "They are equal";
        reason = `${right} simplifies to ${left}.`;
      }
      const prompt = spreadPick(
        [
          `Which is larger: ${left} or ${right}?`,
          `Compare ${left} and ${right}. Which one is greater?`,
          `Choose the larger fraction: ${left} or ${right}.`,
          `Which fraction shows more of the same whole: ${left} or ${right}?`,
          `Decide whether ${left}, ${right}, or neither is greater.`,
        ],
        seed,
        207,
      );
      return {
        id: `fraction-compare-${left}-${right}`,
        topic: "fractions",
        label: "Compare fractions",
        prompt,
        choices: [left, right, "They are equal", "Cannot tell"].sort(),
        answer,
        hint: "Think about the size of the equal parts, not just the digits.",
        explanation: reason,
        parentNote: "Ask Haim to draw bars if the comparison feels unclear.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Decimal comparison",
    build(seed) {
      const leftCents = 15 + spread(seed, 211, 385);
      let rightCents = 15 + spread(seed, 213, 385);
      if (rightCents === leftCents) rightCents += 7;
      const left = formatDecimal(leftCents / 100);
      const right = formatDecimal(rightCents / 100);
      const answer = leftCents > rightCents ? left : right;
      const reason = `${left} is ${leftCents} hundredths and ${right} is ${rightCents} hundredths, so ${answer} is larger.`;
      return {
        id: `decimal-compare-${left}-${right}`,
        topic: "decimals",
        label: "Decimal comparison",
        prompt: `Which is larger: ${left} or ${right}?`,
        choices: [left, right, "They are equal", "Cannot tell"].sort(),
        answer,
        hint: "Add zeros at the end to line up place-value columns.",
        explanation: reason,
        parentNote:
          "Ask Haim to read the decimals as tenths, hundredths, or thousandths.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Decimal addition",
    build(seed) {
      const leftCents = 35 + spread(seed, 221, 565);
      const rightCents = 20 + spread(seed, 223, 380);
      const answerCents = leftCents + rightCents;
      const left = formatMoneyDecimal(leftCents);
      const right = formatMoneyDecimal(rightCents);
      const answer = formatMoneyDecimal(answerCents);
      return {
        id: `decimal-add-${left}-${right}`,
        topic: "decimals",
        label: "Decimal addition",
        prompt: `Calculate ${left} + ${right}.`,
        choices: decimalOptions(answer, [
          formatMoneyDecimal(answerCents + 10),
          formatMoneyDecimal(Math.max(1, answerCents - 10)),
          formatMoneyDecimal(leftCents + Math.floor(rightCents / 10)),
          formatMoneyDecimal(answerCents + 100),
        ]),
        answer,
        hint: "Line up the decimal points before adding.",
        explanation: `${left} + ${right} = ${answer}. The decimal point stays lined up with the place-value columns.`,
        parentNote:
          "If she rushes, ask her to rewrite the numbers with matching decimal places.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Decimal subtraction",
    build(seed) {
      const rightCents = 15 + spread(seed, 231, 285);
      const answerCents = 25 + spread(seed, 233, 475);
      const leftCents = rightCents + answerCents;
      const left = formatMoneyDecimal(leftCents);
      const right = formatMoneyDecimal(rightCents);
      const answer = formatMoneyDecimal(answerCents);
      return {
        id: `decimal-subtract-${left}-${right}`,
        topic: "decimals",
        label: "Decimal subtraction",
        prompt: `Calculate ${left} - ${right}.`,
        choices: decimalOptions(answer, [
          formatMoneyDecimal(answerCents + 10),
          formatMoneyDecimal(Math.max(1, answerCents - 10)),
          formatMoneyDecimal(leftCents - Math.floor(rightCents / 10)),
          formatMoneyDecimal(answerCents + 100),
        ]),
        answer,
        hint: "Line up decimal points and regroup by place value if needed.",
        explanation: `${left} - ${right} = ${answer}. Dollars/cents thinking can help: subtract hundredths with hundredths.`,
        parentNote:
          "Subtraction with decimals is a good place to slow down and line up columns.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Place value",
    build(seed) {
      const places = ["tenths", "hundredths", "thousandths"] as const;
      const place = spreadPick(places, seed, 241);
      const whole = spread(seed, 243, 8);
      const denominator =
        place === "tenths" ? 10 : place === "hundredths" ? 100 : 1000;
      const part = 1 + spread(seed, 245, denominator - 1);
      const partText =
        place === "tenths"
          ? String(part % 10 || 7)
          : String(part).padStart(place === "hundredths" ? 2 : 3, "0");
      const normalizedPart = Number(partText);
      const value = `${whole}.${partText}`;
      const answer =
        whole === 0
          ? `${normalizedPart} ${place}`
          : `${whole} and ${normalizedPart} ${place}`;
      const distractorA =
        place === "tenths"
          ? `${whole} and ${normalizedPart} hundredths`
          : `${whole} and ${normalizedPart} tenths`;
      const distractorB =
        place === "thousandths"
          ? `${whole} and ${Math.max(1, Math.floor(normalizedPart / 10))} hundredths`
          : `${whole}${normalizedPart} hundredths`;
      return {
        id: `decimal-place-${value}`,
        topic: "decimals",
        label: "Place value",
        prompt: `Which phrase correctly describes ${value}?`,
        choices: [answer, distractorA, distractorB, "Cannot tell"].sort(),
        answer,
        hint: "Read the final digit by its place-value column.",
        explanation: `${value} is read as ${answer}. Place-value words help prevent digit-size mistakes.`,
        parentNote:
          "Ask Haim to say the decimal in words before comparing or calculating.",
      };
    },
  },
  {
    topic: "decimals",
    label: "Powers of 10",
    build(seed) {
      const factors = [10, 100, 1000] as const;
      const factor = spreadPick(factors, seed, 251);
      const kind = spread(seed, 253, 3) === 0 ? "divide" : "multiply";
      const base = 12 + spread(seed, 255, 875);
      const value =
        kind === "divide"
          ? formatDecimal(base / 10, 1)
          : formatDecimal(base / 100, 2);
      const answer =
        kind === "divide" ? Number(value) / factor : Number(value) * factor;
      const answerText = formatDecimal(answer, 4);
      const sign = kind === "divide" ? "/" : "x";
      return {
        id: `decimal-power-${value}-${factor}-${sign}`,
        topic: "decimals",
        label: "Powers of 10",
        prompt: `Calculate ${value} ${sign} ${factor}.`,
        choices: decimalOptions(answerText, [
          formatDecimal(answer * 10, 4),
          formatDecimal(answer / 10, 4),
          formatDecimal(answer + 10, 4),
        ]),
        answer: answerText,
        hint:
          kind === "divide"
            ? "Dividing moves digits to smaller place-value columns."
            : "Multiplying moves digits to larger place-value columns.",
        explanation:
          kind === "divide"
            ? `${value} / ${factor} moves the digits to smaller place-value columns, giving ${answerText}.`
            : `${value} x ${factor} moves the digits to larger place-value columns, giving ${answerText}.`,
        parentNote: "Watch for the common mistake of just adding zeros.",
      };
    },
  },
  {
    topic: "percentages",
    label: "Benchmark percent",
    build(seed) {
      const percent = 5 + spread(seed, 261, 19) * 5;
      const [simplePercent, hundredParts] = simplifyParts(percent, 100);
      const whole = hundredParts * (4 + spread(seed, 263, 22));
      const answer = (whole * percent) / 100;
      const trick =
        percent === 50
          ? "50% is half."
          : percent === 25
            ? "25% is one quarter."
            : percent === 75
              ? "75% is three quarters."
              : `${percent}% means ${simplePercent}/${hundredParts} of the whole.`;
      const prompt = spreadPick(
        [
          `What is ${percent}% of ${whole}?`,
          `Find ${percent}% of ${whole}.`,
          `${whole} is the whole. What amount is ${percent}%?`,
          `Use a benchmark to calculate ${percent}% of ${whole}.`,
        ],
        seed,
        265,
      );
      return {
        id: `percent-${percent}-${whole}`,
        topic: "percentages",
        label: "Benchmark percent",
        prompt,
        choices: options(answer, [
          percent,
          whole - answer,
          answer + 10,
          answer * 2,
        ]),
        answer: String(answer),
        hint: trick,
        explanation: `${trick} So ${percent}% of ${whole} is ${answer}.`,
        parentNote: "Ask: percent of what whole?",
      };
    },
  },
  {
    topic: "percentages",
    label: "Discount story",
    build(seed) {
      const percent = 5 + spread(seed, 271, 18) * 5;
      const [, denominator] = simplifyParts(percent, 100);
      const price = denominator * (8 + spread(seed, 273, 28));
      const answer = price - (price * percent) / 100;
      const discount = price - answer;
      const prompt = spreadPick(
        [
          `A HK$${price} item is ${percent}% off. What is the sale price?`,
          `A price tag shows HK$${price}, then ${percent}% is taken off. What do you pay?`,
          `Find the final price after a ${percent}% discount on HK$${price}.`,
          `Haim finds an item for HK$${price} with ${percent}% off. What is the sale price?`,
        ],
        seed,
        275,
      );
      return {
        id: `percent-discount-${percent}-${price}`,
        topic: "percentages",
        label: "Discount story",
        prompt,
        choices: options(answer, [discount, price + discount, price - percent]),
        answer: String(answer),
        hint: "First find the discount amount, then subtract it from the original price.",
        explanation: `${percent}% of ${price} is ${discount}, so the sale price is ${price} - ${discount} = ${answer}.`,
        parentNote:
          "Check whether she answers the discount amount or the final sale price.",
      };
    },
  },
  {
    topic: "percentages",
    label: "Percent conversion",
    build(seed) {
      const percentValue = 1 + spread(seed, 281, 99);
      const [num, den] = simplifyParts(percentValue, 100);
      const percent = `${percentValue}%`;
      const answer = `${num}/${den}`;
      const decimal = formatDecimal(percentValue / 100, 2);
      const nearbyPercent = Math.min(95, Math.max(5, percentValue + 5));
      const [nearbyNum, nearbyDen] = simplifyParts(nearbyPercent, 100);
      const distractor = `${nearbyNum}/${nearbyDen}`;
      const prompt = spreadPick(
        [
          `Which fraction matches ${percent}?`,
          `${percent} means how much of a whole as a fraction?`,
          `Write ${percent} as a simplified fraction.`,
        ],
        seed,
        283,
      );
      return {
        id: `percent-convert-${percent}`,
        topic: "percentages",
        label: "Percent conversion",
        prompt,
        choices: fractionChoices(answer, [
          decimal,
          distractor,
          `${num}/${den + 1}`,
          "1/100",
        ]),
        answer,
        answerType: "fraction-equivalent",
        hint: "Percent means out of 100, then simplify if possible.",
        explanation: `${percent} is equivalent to ${answer}. It can also be written as ${decimal}.`,
        parentNote:
          "Ask Haim to connect the percent, fraction, and decimal form.",
      };
    },
  },
  {
    topic: "percentages",
    label: "Find the whole",
    build(seed) {
      const percent = 5 + spread(seed, 291, 19) * 5;
      const [, denominator] = simplifyParts(percent, 100);
      const answer = denominator * (8 + spread(seed, 293, 28));
      const part = (answer * percent) / 100;
      const prompt = spreadPick(
        [
          `${part} is ${percent}% of what number?`,
          `If ${percent}% equals ${part}, what is the whole?`,
          `${part} is the percent part. Rebuild the whole if it is ${percent}%.`,
          `What whole number has ${part} as ${percent}% of it?`,
        ],
        seed,
        295,
      );
      return {
        id: `percent-whole-${percent}-${part}`,
        topic: "percentages",
        label: "Find the whole",
        prompt,
        choices: options(answer, [
          part + percent,
          part * 10,
          answer / 2,
          answer + part,
        ]),
        answer: String(answer),
        hint: "Use the benchmark percent to undo the calculation.",
        explanation: `${percent}% of ${answer} is ${part}, so the whole is ${answer}.`,
        parentNote:
          "Finding the whole is harder than finding a percent of a number, so encourage a slow check.",
      };
    },
  },
];

export function buildDailySetFromSeed(seed: number) {
  const topicOrder: Topic[] = [
    "multiplication",
    "fractions",
    "decimals",
    "percentages",
  ];
  const todayTopic = topicOrder[seed % topicOrder.length];
  const lesson = spreadPick(topicLessons[todayTopic].recaps, seed, 301);
  const todayTemplates = templates.filter(
    (template) => template.topic === todayTopic,
  );
  const reviewTemplates = templates.filter(
    (template) => template.topic !== todayTopic,
  );
  const lessonLabels = new Set(inferredPracticeLabels(todayTopic, lesson));
  const lessonTemplates = todayTemplates.filter((template) =>
    lessonLabels.has(template.label),
  );
  const lessonMatchedTemplates = rotateTemplates(
    lessonTemplates.length ? lessonTemplates : todayTemplates,
    seed + 1,
    3,
  );
  const dailyTemplates = [
    ...lessonMatchedTemplates,
    ...rotateTemplates(
      todayTemplates.filter(
        (template) =>
          !lessonMatchedTemplates.some((item) => item.label === template.label),
      ),
      seed + 5,
      3 - lessonMatchedTemplates.length,
    ),
  ];
  const mixedTemplates = rotateTemplates(reviewTemplates, seed + 11, 3);
  return {
    todayTopic,
    lesson,
    questions: [...dailyTemplates, ...mixedTemplates]
      .slice(0, 6)
      .map((template, position) => template.build(seed + position * 7 + 1))
      .map(validateQuestion),
  };
}

function buildDailySet(refresh: number) {
  return buildDailySetFromSeed(daySeed() + refresh * 97);
}

function extractFirstFraction(text: string) {
  const match = text.match(/(\d+)\/(\d+)/);
  if (!match) return null;
  return {
    numerator: Number(match[1]),
    denominator: Number(match[2]),
  };
}

function extractFirstDecimal(text: string) {
  const match = text.match(/\d+\.\d+/);
  return match?.[0] ?? null;
}

function extractPercent(text: string) {
  const match = text.match(/(\d+)%/);
  return match ? Number(match[1]) : null;
}

function numbersFromId(id: string) {
  return (id.match(/\d+/g) ?? []).map(Number);
}

function VisualShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#cfded7] bg-[#f7fbf7]">
      <div className="border-b border-[#d9e7df] bg-white/70 px-4 py-2 text-sm font-semibold text-[#24495a]">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DotArray({
  rows,
  columns,
  label,
}: {
  rows: number;
  columns: number;
  label: string;
}) {
  const shownRows = Math.min(rows, 12);
  const shownColumns = Math.min(columns, 12);
  const dotClass =
    shownRows * shownColumns > 80
      ? "size-2.5 rounded-full bg-[#2f6173] shadow-sm"
      : "size-3.5 rounded-full bg-[#2f6173] shadow-sm sm:size-4";
  const dots = Array.from(
    { length: shownRows * shownColumns },
    (_, position) => ({
      id: `dot-r${Math.floor(position / shownColumns)}-c${position % shownColumns}`,
    }),
  );
  return (
    <div className="space-y-3">
      <div
        className="grid w-fit gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${shownColumns}, minmax(0, 1fr))`,
        }}
      >
        {dots.map((dot) => (
          <span key={dot.id} className={dotClass} />
        ))}
      </div>
      <p className="text-sm font-semibold text-[#41504b]">{label}</p>
    </div>
  );
}

function FractionBar({
  numerator,
  denominator,
  label,
}: {
  numerator: number;
  denominator: number;
  label: string;
}) {
  const safeDenominator = Math.max(1, Math.min(denominator, 20));
  const safeNumerator = Math.min(numerator, safeDenominator);
  const parts = Array.from({ length: safeDenominator }, (_, position) => ({
    id: `fraction-part-${position + 1}-of-${safeDenominator}`,
    isShaded: position < safeNumerator,
  }));
  return (
    <div className="space-y-3">
      <div
        className="grid overflow-hidden rounded-lg border border-[#8aa79c]"
        style={{
          gridTemplateColumns: `repeat(${safeDenominator}, minmax(0, 1fr))`,
        }}
      >
        {parts.map((part) => (
          <span
            key={part.id}
            className={`h-12 border-r border-white last:border-r-0 ${
              part.isShaded ? "bg-[#d99b4a]" : "bg-white"
            }`}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-[#41504b]">{label}</p>
    </div>
  );
}

function NumberLine({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) {
  const safeDenominator = Math.max(2, Math.min(denominator, 20));
  const position = `${Math.min(100, (numerator / denominator) * 100)}%`;
  const ticks = Array.from({ length: safeDenominator + 1 }, (_, tick) => ({
    id: `tick-${tick}-of-${safeDenominator}`,
    left: `${(tick / safeDenominator) * 100}%`,
  }));
  return (
    <div className="px-2 py-4">
      <div className="relative h-12">
        <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-[#cfded7]" />
        {ticks.map((tick) => (
          <span
            key={tick.id}
            className="absolute top-3 h-5 w-px bg-[#2f6173]"
            style={{ left: tick.left }}
          />
        ))}
        <span
          className="absolute top-0 size-7 -translate-x-1/2 rounded-full bg-[#d99b4a] ring-4 ring-white"
          style={{ left: position }}
        />
        <span className="absolute left-0 top-10 text-xs font-semibold text-[#41504b]">
          0
        </span>
        <span className="absolute right-0 top-10 text-xs font-semibold text-[#41504b]">
          1
        </span>
      </div>
    </div>
  );
}

function DecimalChart({ value }: { value: string }) {
  const [whole, decimal = ""] = value.split(".");
  const digits = decimal.padEnd(3, "0").slice(0, 3).split("");
  const columns = [
    ["ones", whole],
    ["tenths", digits[0] ?? "0"],
    ["hundredths", digits[1] ?? "0"],
    ["thousandths", digits[2] ?? "0"],
  ];
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-[#cfded7] bg-white text-center">
      {columns.map(([label, digit]) => (
        <div key={label} className="border-r border-[#e7ded0] last:border-r-0">
          <p className="bg-[#f8efe1] px-2 py-2 text-xs font-semibold text-[#754714]">
            {label}
          </p>
          <p className="py-4 text-2xl font-bold text-[#10211f]">{digit}</p>
        </div>
      ))}
    </div>
  );
}

function PercentGrid({ percent }: { percent: number }) {
  const shaded = Math.max(0, Math.min(100, Math.round(percent)));
  const squares = Array.from({ length: 100 }, (_, position) => ({
    id: `percent-row-${Math.floor(position / 10)}-col-${position % 10}`,
    isShaded: position < shaded,
  }));
  return (
    <div className="space-y-3">
      <div className="grid w-fit grid-cols-10 gap-1">
        {squares.map((square) => (
          <span
            key={square.id}
            className={`size-2.5 rounded-sm ${
              square.isShaded ? "bg-[#2f6173]" : "bg-white"
            } border border-[#d9e7df]`}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-[#41504b]">
        {shaded} out of 100 parts
      </p>
    </div>
  );
}

function LessonVisual({ topic }: { topic: Topic }) {
  if (topic === "multiplication") {
    return (
      <VisualShell title="Visual model">
        <DotArray rows={4} columns={6} label="4 equal groups of 6 make 24" />
      </VisualShell>
    );
  }
  if (topic === "fractions") {
    return (
      <VisualShell title="Visual model">
        <FractionBar numerator={3} denominator={4} label="3 of 4 equal parts" />
      </VisualShell>
    );
  }
  if (topic === "decimals") {
    return (
      <VisualShell title="Visual model">
        <DecimalChart value="2.05" />
      </VisualShell>
    );
  }
  return (
    <VisualShell title="Visual model">
      <PercentGrid percent={25} />
    </VisualShell>
  );
}

function QuestionVisual({ question }: { question: Question }) {
  if (question.topic === "multiplication") {
    const [first = 4, second = 6, third] = numbersFromId(question.id);
    const rows = question.label === "Division story" ? second : first;
    const columns =
      question.label === "Division story" ? Number(question.answer) : second;
    const total =
      question.label === "Division story" && third ? first : rows * columns;
    return (
      <VisualShell title="See the structure">
        <DotArray
          rows={rows}
          columns={columns}
          label={`${rows} x ${columns} = ${total}`}
        />
      </VisualShell>
    );
  }

  if (question.topic === "fractions") {
    const fraction =
      extractFirstFraction(question.prompt) ??
      extractFirstFraction(question.answer);
    if (!fraction) return null;
    if (question.label === "Number line") {
      return (
        <VisualShell title="See the structure">
          <NumberLine
            numerator={fraction.numerator}
            denominator={fraction.denominator}
          />
        </VisualShell>
      );
    }
    return (
      <VisualShell title="See the structure">
        <FractionBar
          numerator={fraction.numerator}
          denominator={fraction.denominator}
          label={`${fraction.numerator}/${fraction.denominator} of one whole`}
        />
      </VisualShell>
    );
  }

  if (question.topic === "decimals") {
    const decimal = extractFirstDecimal(question.prompt) ?? question.answer;
    return (
      <VisualShell title="See the structure">
        <DecimalChart value={decimal} />
      </VisualShell>
    );
  }

  const percent = extractPercent(question.prompt);
  if (percent === null) return null;
  return (
    <VisualShell title="See the structure">
      <PercentGrid percent={percent} />
    </VisualShell>
  );
}

export function DailyPractice() {
  const [refresh, setRefresh] = useState(0);
  const { todayTopic, lesson, questions } = useMemo(
    () => buildDailySet(refresh),
    [refresh],
  );
  const topicLesson = topicLessons[todayTopic];
  const lessonVisualCue =
    lesson.visualCue ?? topicTeachingDefaults[todayTopic].visualCue;
  const lessonCheckPrompt =
    lesson.checkPrompt ?? topicTeachingDefaults[todayTopic].checkPrompt;
  const [stage, setStage] = useState<Stage>("goals");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [sessionHistory, setSessionHistory] = useState<DailyPracticeRecord[]>(
    [],
  );
  const savedSummaryRef = useRef(false);
  const current = questions[index];
  const selected = answers[current.id] ?? "";
  const isChecked = checked[current.id] ?? false;
  const isCorrect = isChecked && isAnswerCorrect(current, selected);
  const completed = questions.every((question) => checked[question.id]);
  const allQuestions = questions;
  const correctCount = allQuestions.filter(
    (question) =>
      checked[question.id] &&
      isAnswerCorrect(question, answers[question.id] ?? ""),
  ).length;
  const firstTryCorrectCount = allQuestions.filter(
    (question) =>
      checked[question.id] &&
      isAnswerCorrect(question, answers[question.id] ?? "") &&
      (attempts[question.id] ?? 1) === 1,
  ).length;
  const needsReview = Array.from(
    new Set(
      allQuestions
        .filter(
          (question) =>
            checked[question.id] &&
            !isAnswerCorrect(question, answers[question.id] ?? ""),
        )
        .map((question) => question.topic),
    ),
  );
  const suggestedReview =
    needsReview[0] ??
    sessionHistory
      .flatMap((record) => record.needsReview)
      .find((topic) => topic !== todayTopic);

  useEffect(() => {
    setSessionHistory(loadPracticeHistory());
  }, []);

  useEffect(() => {
    if (!(stage === "summary" || completed) || savedSummaryRef.current) return;
    savedSummaryRef.current = true;
    const items: PracticeItemRecord[] = allQuestions.map((question) => {
      const selectedAnswer = answers[question.id] ?? "";
      return {
        id: question.id,
        topic: question.topic,
        label: question.label,
        prompt: question.prompt,
        answer: question.answer,
        selected: selectedAnswer,
        correct: isAnswerCorrect(question, selectedAnswer),
        attempts: attempts[question.id] ?? 0,
      };
    });
    const record: DailyPracticeRecord = {
      id: `${todayKey()}-${todayTopic}-${refresh}`,
      date: todayKey(),
      completedAt: new Date().toISOString(),
      topic: todayTopic,
      lessonTitle: lesson.title,
      total: allQuestions.length,
      correct: correctCount,
      firstTryCorrect: firstTryCorrectCount,
      needsReview,
      items,
    };
    const nextHistory = [
      record,
      ...sessionHistory.filter((item) => item.date !== record.date),
    ].slice(0, 20);
    setSessionHistory(nextHistory);
    try {
      window.localStorage.setItem(
        DAILY_PROGRESS_KEY,
        JSON.stringify(nextHistory),
      );
    } catch {
      // Local progress is helpful, but the practice should still work without it.
    }
  }, [
    allQuestions.length,
    allQuestions,
    answers,
    attempts,
    completed,
    correctCount,
    firstTryCorrectCount,
    lesson.title,
    needsReview,
    refresh,
    sessionHistory,
    stage,
    todayTopic,
  ]);

  function selectAnswer(answer: string) {
    if (isChecked && isAnswerCorrect(current, selected)) return;
    setAnswers((all) => ({ ...all, [current.id]: answer }));
    if (isChecked) {
      setChecked((all) => ({ ...all, [current.id]: false }));
    }
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    setStage("gugudan");
  }

  function back() {
    if (stage === "summary") {
      setStage("gugudan");
      return;
    }
    if (stage === "gugudan") {
      setStage("practice");
      setIndex(questions.length - 1);
      return;
    }
    if (stage === "practice" && index > 0) {
      setIndex((value) => value - 1);
      return;
    }
    const stageIndex = stageOrder.indexOf(stage);
    if (stageIndex > 0) {
      setStage(stageOrder[stageIndex - 1]);
    }
  }

  function restart() {
    savedSummaryRef.current = false;
    setRefresh((value) => value + 1);
    setStage("goals");
    setIndex(0);
    setAnswers({});
    setChecked({});
    setAttempts({});
    setShowHint({});
  }

  function checkCurrent() {
    if (!selected) return;
    setAttempts((all) => ({
      ...all,
      [current.id]: (all[current.id] ?? 0) + 1,
    }));
    setChecked((all) => ({ ...all, [current.id]: true }));
    if (!isAnswerCorrect(current, selected)) {
      setShowHint((all) => ({ ...all, [current.id]: true }));
    }
  }

  function tryAgain() {
    setChecked((all) => ({ ...all, [current.id]: false }));
    setAnswers((all) => {
      const nextAnswers = { ...all };
      delete nextAnswers[current.id];
      return nextAnswers;
    });
    setShowHint((all) => ({ ...all, [current.id]: true }));
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-[#10211f] p-6 text-[#f8efe1] shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d99b4a]">
              Daily practice
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
              Learn, practise, finish with 구구단.
            </h1>
          </div>
          <div className="grid size-14 place-items-center rounded-2xl bg-[#d99b4a] text-[#10211f]">
            <Sparkles className="size-7" />
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[#d8cdbb]">
          Today starts with {topicLabels[todayTopic].toLowerCase()}, then gives
          six practice questions and one 구구단 fluency finish.
        </p>
      </section>

      {stage !== "goals" ? (
        <button
          onClick={back}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8cdbb] bg-white/80 px-4 py-2 font-semibold text-[#53615c] shadow-sm"
        >
          Back
        </button>
      ) : null}

      {stage === "goals" ? (
        <section className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#dceaf0] text-[#24495a]">
              <Target className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#94652e]">
                Today&apos;s learning goal
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">
                {topicLabels[todayTopic]}
              </h2>
              <p className="mt-4 text-lg leading-7 text-[#53615c]">
                {topicLesson.goal}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Learn the idea", "Try six questions", "Finish with 구구단"].map(
              (item, position) => (
                <div key={item} className="rounded-2xl bg-[#f7fbf7] p-4">
                  <p className="text-2xl font-semibold text-[#2f6173]">
                    {position + 1}
                  </p>
                  <p className="mt-1 font-semibold">{item}</p>
                </div>
              ),
            )}
          </div>
          <button
            onClick={() => setStage("lesson")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1]"
          >
            Start today&apos;s learning
            <ArrowRight className="size-4" />
          </button>
        </section>
      ) : null}

      {stage === "lesson" ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-[#94652e]">Big idea</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
              {lesson.title}
            </h2>
            <p className="mt-4 text-lg leading-7 text-[#53615c]">
              {lesson.bigIdea}
            </p>
            <div className="mt-6 grid gap-3">
              {lesson.steps.map((step, position) => (
                <p
                  key={step}
                  className="flex gap-3 rounded-2xl bg-[#fff8e9] p-4 leading-6 text-[#53615c]"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d99b4a] text-sm font-bold text-[#10211f]">
                    {position + 1}
                  </span>
                  <span>{step}</span>
                </p>
              ))}
            </div>
          </article>
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-[#cfded7] bg-[#f7fbf7] p-6">
              <p className="flex items-center gap-2 font-semibold text-[#24495a]">
                <Lightbulb className="size-5" />
                Worked example
              </p>
              <p className="mt-4 text-lg leading-7 text-[#41504b]">
                {lesson.example}
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#cfded7] bg-white/80 p-6">
              <p className="font-semibold text-[#24495a]">Picture it</p>
              <div className="mt-4">
                <LessonVisual topic={todayTopic} />
              </div>
              <p className="mt-3 leading-6 text-[#41504b]">{lessonVisualCue}</p>
            </div>
            <div className="rounded-[2rem] border border-[#dfd3c0] bg-[#f8efe1] p-6">
              <p className="font-semibold text-[#754714]">Say it back</p>
              <p className="mt-3 leading-6 text-[#754714]">
                {lessonCheckPrompt}
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#dfd3c0] bg-[#fff3dd] p-6">
              <p className="font-semibold text-[#754714]">Common trap</p>
              <p className="mt-3 leading-6 text-[#754714]">{lesson.trap}</p>
            </div>
            <button
              onClick={() => setStage("practice")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-4 font-semibold text-[#f8efe1]"
            >
              Try practice questions
              <ArrowRight className="size-4" />
            </button>
          </aside>
        </section>
      ) : null}

      {stage === "practice" || stage === "gugudan" ? (
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-3">
            {questions.map((question, position) => {
              const done = checked[question.id];
              const right =
                done && isAnswerCorrect(question, answers[question.id] ?? "");
              return (
                <button
                  key={question.id}
                  onClick={() => setIndex(position)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    index === position
                      ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                      : "border-[#dfd3c0] bg-white/75 text-[#17211f] hover:border-[#2f6173]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Question {position + 1}</p>
                    {done ? (
                      <span
                        className={right ? "text-[#8fb57f]" : "text-[#d99b4a]"}
                      >
                        {right ? "Correct" : "Review"}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={`mt-1 text-sm ${index === position ? "text-[#d8cdbb]" : "text-[#53615c]"}`}
                  >
                    {question.label}
                  </p>
                </button>
              );
            })}
            <button
              onClick={() => setStage("gugudan")}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                stage === "gugudan"
                  ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                  : "border-[#dfd3c0] bg-white/75 text-[#17211f] hover:border-[#2f6173]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">Final step</p>
              </div>
              <p
                className={`mt-1 text-sm ${stage === "gugudan" ? "text-[#d8cdbb]" : "text-[#53615c]"}`}
              >
                구구단 finish
              </p>
            </button>
          </aside>

          {stage === "gugudan" ? (
            <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-[#94652e]">
                구구단 finish
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
                Finish with focused multiplication-table practice.
              </h2>
              <p className="mt-4 text-lg leading-7 text-[#53615c]">
                Daily Practice is done. Now open the 구구단 room and practise as
                many facts as you want, with tricks, mixed recall, hard facts,
                and reverse facts.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/gugudan"
                  className="inline-flex min-h-20 items-center justify-center rounded-2xl bg-[#10211f] px-5 py-4 text-center text-lg font-semibold text-[#f8efe1]"
                >
                  Go to 구구단 practice
                </Link>
                <button
                  onClick={() => setStage("summary")}
                  className="inline-flex min-h-20 items-center justify-center rounded-2xl border border-[#d8cdbb] bg-[#fffdf8] px-5 py-4 text-center text-lg font-semibold text-[#53615c]"
                >
                  See today&apos;s summary
                </button>
              </div>
            </article>
          ) : (
            <article className="rounded-[2rem] border border-[#dfd3c0] bg-white/80 p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#94652e]">
                    {topicLabels[current.topic]}
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight">
                    {current.prompt}
                  </h2>
                </div>
                <span className="rounded-full bg-[#dceaf0] px-4 py-2 text-sm font-semibold text-[#24495a]">
                  {index + 1} of {questions.length}
                </span>
              </div>

              <div className="mt-6">
                <QuestionVisual question={current} />
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {current.choices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => selectAnswer(choice)}
                    disabled={isChecked}
                    className={`min-h-20 rounded-2xl border p-4 text-xl font-semibold transition ${
                      selected === choice
                        ? "border-[#10211f] bg-[#10211f] text-[#f8efe1]"
                        : "border-[#d8cdbb] bg-[#fffdf8] hover:border-[#2f6173]"
                    } ${
                      isChecked && isAnswerCorrect(current, choice)
                        ? "border-[#36582e] bg-[#dfe9d6] text-[#36582e]"
                        : ""
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setShowHint((all) => ({ ...all, [current.id]: true }))
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8cdbb] bg-[#fffdf8] px-4 py-2 font-semibold text-[#53615c]"
                >
                  <Lightbulb className="size-4" />
                  Hint
                </button>
                {!isChecked ? (
                  <button
                    onClick={checkCurrent}
                    disabled={!selected}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1] disabled:opacity-50"
                  >
                    Check
                  </button>
                ) : !isCorrect && (attempts[current.id] ?? 1) < 2 ? (
                  <button
                    onClick={tryAgain}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
                  >
                    Try once more
                  </button>
                ) : index < questions.length - 1 ? (
                  <button
                    onClick={next}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
                  >
                    Next
                    <ArrowRight className="size-4" />
                  </button>
                ) : !completed ? (
                  <button
                    onClick={next}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
                  >
                    Go to 구구단
                    <ArrowRight className="size-4" />
                  </button>
                ) : null}
              </div>

              {showHint[current.id] ? (
                <p className="mt-5 rounded-2xl bg-[#fff8e9] p-4 leading-6 text-[#754714]">
                  <span className="font-semibold">Hint: </span>
                  {current.hint}
                </p>
              ) : null}

              {isChecked ? (
                <div
                  className={`mt-5 rounded-[1.5rem] p-5 ${isCorrect ? "bg-[#edf7e8] text-[#244d32]" : "bg-[#fff3dd] text-[#754714]"}`}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    {isCorrect ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <CircleAlert className="size-5" />
                    )}
                    {isCorrect
                      ? "Correct"
                      : (attempts[current.id] ?? 1) < 2
                        ? "Not quite yet. Use the hint, then try once more."
                        : `Good review moment. Answer: ${current.answer}`}
                  </p>
                  {isCorrect || (attempts[current.id] ?? 1) >= 2 ? (
                    <p className="mt-3 leading-6">{current.explanation}</p>
                  ) : null}
                  <div className="mt-4 rounded-2xl bg-white/60 p-4">
                    <p className="flex items-center gap-2 font-semibold">
                      <BookOpenCheck className="size-4" />
                      Parent note
                    </p>
                    <p className="mt-2 leading-6">{current.parentNote}</p>
                  </div>
                </div>
              ) : null}
            </article>
          )}
        </section>
      ) : null}

      {stage === "summary" || completed ? (
        <section className="rounded-[1.5rem] border border-[#cfded7] bg-[#f7fbf7] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#94652e]">
            Finished
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">
            {correctCount} out of {allQuestions.length} correct
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#36582e]">
            First-try fluency: {firstTryCorrectCount} out of{" "}
            {allQuestions.length}
          </p>
          <p className="mt-3 leading-6 text-[#53615c]">
            The most useful next step is to explain one tricky question aloud,
            then stop while the session still feels light.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold text-[#24495a]">Parent read</p>
              <p className="mt-2 leading-6 text-[#53615c]">
                {needsReview.length > 0
                  ? `Review ${needsReview.map((topic) => topicLabels[topic]).join(", ")} next.`
                  : "No obvious weak spot today. Keep the next session short and confident."}
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold text-[#24495a]">
                Suggested next focus
              </p>
              <p className="mt-2 leading-6 text-[#53615c]">
                {suggestedReview
                  ? topicLabels[suggestedReview]
                  : `${topicLabels[todayTopic]} with one harder story problem`}
              </p>
            </div>
          </div>
          {sessionHistory.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-white/70 p-4">
              <p className="font-semibold text-[#24495a]">Recent practice</p>
              <div className="mt-3 grid gap-2">
                {sessionHistory.slice(0, 3).map((record) => (
                  <p
                    key={`${record.date}-${record.topic}`}
                    className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#f7fbf7] px-3 py-2 text-sm text-[#53615c]"
                  >
                    <span>{record.date}</span>
                    <span>{topicLabels[record.topic]}</span>
                    <span>
                      {record.correct}/{record.total}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          <button
            onClick={restart}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#10211f] px-5 py-3 font-semibold text-[#f8efe1]"
          >
            <RefreshCw className="size-4" />
            Start again
          </button>
        </section>
      ) : null}
    </div>
  );
}
