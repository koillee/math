export type OlympiadVisual =
  | "cycles"
  | "line-up"
  | "rectangles"
  | "ratios"
  | "digits"
  | "backwards"
  | "perimeter"
  | "routes";

export type OlympiadChallenge = {
  id: string;
  session: number;
  week: number;
  title: string;
  strategy: string;
  expectedMinutes: number;
  visual: OlympiadVisual;
  warmUp: {
    prompt: string;
    acceptedAnswers: string[];
    answer: string;
    explanation: string;
  };
  mainPrompt: string;
  hints: string[];
  answer: string;
  solution: string;
  alternative: string;
  stretch: {
    prompt: string;
    answer: string;
  };
};

export const olympiadChallenges: OlympiadChallenge[] = [
  {
    id: "cycles-common-beats",
    session: 1,
    week: 1,
    title: "Cycles and Common Beats",
    strategy: "Look for what repeats",
    expectedMinutes: 20,
    visual: "cycles",
    warmUp: {
      prompt:
        "A stage-light pattern repeats: star, circle, triangle, circle. What shape appears at position 37?",
      acceptedAnswers: ["star", "a star"],
      answer: "Star",
      explanation:
        "The block has length 4. Since 36 is a multiple of 4, position 37 begins a new block and matches position 1.",
    },
    mainPrompt:
      "Team Spark makes a move every 6 beats. Team Wave makes a move every 8 beats. Between beats 1 and 96 inclusive: (a) What is the first beat when both teams move? (b) How many times do they move together? (c) What is the next shared beat after 96?",
    hints: [
      "Mark each team's moves only as far as beat 30. Where do the marks first meet?",
      "Write the multiples of 6 and 8 side by side and find numbers in both lists.",
      "The first common beat is 24. Use the same interval to move forward.",
    ],
    answer: "Beat 24; 4 shared moves; next shared beat 120.",
    solution:
      "The first common multiple of 6 and 8 is 24. Shared beats through 96 are 24, 48, 72 and 96, so there are 4. One more interval of 24 gives 120.",
    alternative:
      "Think in blocks of 24 beats. Every block ends with a shared move, and 96 / 24 = 4 blocks.",
    stretch: {
      prompt:
        "Three stage lights flash every 6, 8 and 9 seconds. They flash together at time 0. When will they next flash together, and how many shared flashes occur from 0 through 216 seconds?",
      answer:
        "They next meet at 72 seconds. Shared flashes are 0, 72, 144 and 216: 4 in total.",
    },
  },
  {
    id: "logic-line-up",
    session: 2,
    week: 1,
    title: "Logic Line-Up",
    strategy: "Use every clue",
    expectedMinutes: 20,
    visual: "line-up",
    warmUp: {
      prompt:
        "A new operation is defined by a STAR b = 2a + b. If x STAR 7 = 25, what is x?",
      acceptedAnswers: ["9", "x=9", "x = 9"],
      answer: "9",
      explanation:
        "2x + 7 = 25, so 2x = 18 and x = 9. Check: 2(9) + 7 = 25.",
    },
    mainPrompt:
      "Five students - Aria, Ben, Chloe, Diego and Haim - stand in positions 1 to 5. Haim is in the middle. Aria is immediately left of Ben. Chloe is somewhere to the right of Ben. Diego is not at either end. Find the only possible order and show how each clue is used.",
    hints: [
      "Place Haim in position 3 first.",
      "Treat Aria-Ben as one two-position block whose order cannot change.",
      "Place Aria-Ben in positions 1-2, then use the clue that Diego cannot be at an end.",
    ],
    answer: "Aria, Ben, Haim, Diego, Chloe.",
    solution:
      "Haim occupies position 3. Aria-Ben must fit as a fixed block, and Chloe must remain to Ben's right. With Aria-Ben in positions 1-2, Diego and Chloe take positions 4-5. Diego cannot be at an end, so Diego is 4 and Chloe is 5.",
    alternative:
      "Use a five-column table. Fix Haim, place the Aria-Ben block, and cross out every placement that breaks a clue.",
    stretch: {
      prompt:
        "Remove the clue 'Chloe is somewhere to the right of Ben.' Find a different order that now works. What does this show?",
      answer:
        "One alternative is Chloe, Diego, Haim, Aria, Ben. The removed clue is necessary to make the original answer unique.",
    },
  },
  {
    id: "rectangle-hunt",
    session: 3,
    week: 2,
    title: "Rectangle Hunt",
    strategy: "Count without missing or repeating",
    expectedMinutes: 25,
    visual: "rectangles",
    warmUp: {
      prompt:
        "How many squares are in a 2 by 2 grid? Remember that a square can be larger than one small cell.",
      acceptedAnswers: ["5", "5 squares"],
      answer: "5 squares",
      explanation:
        "There are four 1 by 1 squares and one 2 by 2 square: 4 + 1 = 5.",
    },
    mainPrompt:
      "The diagram is a 2 by 4 grid. (a) How many rectangles are there altogether? (b) How many are squares? (c) How many are non-square rectangles? Create a system that proves you did not miss or double-count a shape.",
    hints: [
      "Count rectangles that are one row high first, then rectangles that are two rows high.",
      "Make a table for widths 1, 2, 3 and 4. How many positions can each width occupy?",
      "Height 1 gives 8 + 6 + 4 + 2. Height 2 gives 4 + 3 + 2 + 1.",
    ],
    answer: "30 rectangles; 11 squares; 19 non-square rectangles.",
    solution:
      "For height 1, widths 1, 2, 3 and 4 give 8, 6, 4 and 2 rectangles. For height 2, they give 4, 3, 2 and 1. That is 30 altogether. Eight 1 by 1 squares and three 2 by 2 squares make 11 squares, leaving 19 non-squares.",
    alternative:
      "Choose two of the 5 vertical boundary lines and two of the 3 horizontal boundary lines: 10 x 3 = 30 rectangles.",
    stretch: {
      prompt:
        "Predict the totals for a 3 by 4 grid: all rectangles, squares and non-square rectangles.",
      answer:
        "60 rectangles. There are 20 squares, so 40 are non-square rectangles.",
    },
  },
  {
    id: "changing-ratios",
    session: 4,
    week: 2,
    title: "Changing Ratios",
    strategy: "Work backwards from what changed",
    expectedMinutes: 25,
    visual: "ratios",
    warmUp: {
      prompt:
        "A jar has red and blue counters in the ratio 3:2. There are 40 counters altogether. How many are red and how many are blue?",
      acceptedAnswers: ["24 red 16 blue", "24,16", "24 and 16"],
      answer: "24 red and 16 blue",
      explanation:
        "There are 5 equal ratio parts. Each part is 40 / 5 = 8, so red is 3 x 8 = 24 and blue is 2 x 8 = 16.",
    },
    mainPrompt:
      "A craft box contains star and heart stickers in the ratio 3:2. Haim gives away 9 star stickers and adds 6 heart stickers. The box now has the same number of stars and hearts. How many of each sticker were in the box at first? How many stickers were there altogether?",
    hints: [
      "How many ratio parts larger is the star amount at the beginning?",
      "Giving away 9 stars and adding 6 hearts closes the gap by how many stickers altogether?",
      "The one-part gap was 9 + 6 = 15. Use that to find three parts and two parts.",
    ],
    answer: "45 stars, 30 hearts; 75 stickers altogether.",
    solution:
      "The original difference is one ratio part. The two changes close the gap by 9 + 6 = 15, so one part is 15. Stars were 3 x 15 = 45 and hearts were 2 x 15 = 30. Check: 45 - 9 = 36 and 30 + 6 = 36.",
    alternative:
      "Let one part be k. Then 3k - 9 = 2k + 6, so k = 15.",
    stretch: {
      prompt:
        "A second box has stars and hearts in the ratio 5:3. After 14 stars are given away and 4 hearts are added, the amounts are equal. Find the original amounts and total.",
      answer: "45 stars and 27 hearts; 72 stickers altogether.",
    },
  },
  {
    id: "number-detective",
    session: 5,
    week: 3,
    title: "The Number Detective",
    strategy: "Satisfy every clue",
    expectedMinutes: 25,
    visual: "digits",
    warmUp: {
      prompt:
        "A two-digit number has a tens digit that is 3 greater than its ones digit. The digits add to 11. What is the number?",
      acceptedAnswers: ["74"],
      answer: "74",
      explanation:
        "The ones digit is 4 and the tens digit is 7. The difference is 3 and the sum is 11.",
    },
    mainPrompt:
      "Find the three-digit number. Its digits are all different. The digits add to 12. The hundreds digit is twice the ones digit. The number is divisible by 4. Prove that your answer is the only possibility.",
    hints: [
      "Try ones digits 1, 2, 3 and 4, then write the matching hundreds digit.",
      "For each pair, calculate the tens digit needed to make a digit sum of 12.",
      "The possible distinct-digit numbers are 291, 462 and 804. Test the last two digits for divisibility by 4.",
    ],
    answer: "804.",
    solution:
      "Possible hundreds-ones pairs are 2-1, 4-2, 6-3 and 8-4. Completing the sum gives 291, 462, 633 and 804; reject 633 because its digits repeat. Only 04 is divisible by 4, so 804 is the unique answer.",
    alternative:
      "Use a table with columns for ones, hundreds, required tens, distinct digits and divisibility by 4.",
    stretch: {
      prompt:
        "Remove the divisibility-by-4 clue. Find every number that satisfies the remaining clues.",
      answer: "291, 462 and 804.",
    },
  },
  {
    id: "work-backwards",
    session: 6,
    week: 3,
    title: "Work Backwards",
    strategy: "Start from the ending",
    expectedMinutes: 25,
    visual: "backwards",
    warmUp: {
      prompt:
        "A number is multiplied by 3, then 5 is added. The result is 32. What was the starting number?",
      acceptedAnswers: ["9"],
      answer: "9",
      explanation:
        "Reverse the operations: 32 - 5 = 27, then 27 / 3 = 9.",
    },
    mainPrompt:
      "Haim starts with some craft beads. She gives one third of them to a friend. Then she uses 8 of the remaining beads. Exactly half of the original number is left. How many beads did she have at the start?",
    hints: [
      "Draw the original amount as a bar split into 6 equal parts.",
      "After one third is given away, 4 parts remain. Half of the original is 3 parts.",
      "Using 8 beads changed 4 parts into 3 parts, so one part represents 8 beads.",
    ],
    answer: "48 beads.",
    solution:
      "Two thirds of the original remain after the gift. The difference between two thirds and one half is one sixth, and that difference is the 8 beads used. One sixth is 8, so the whole is 48.",
    alternative:
      "Use a six-part bar: 4 parts remain after the gift, then 8 beads are removed to leave 3 parts.",
    stretch: {
      prompt:
        "One quarter of a second box is given away, then 15 beads are used. Half of the original amount remains. Find the starting amount.",
      answer: "60 beads.",
    },
  },
  {
    id: "same-area-new-perimeter",
    session: 7,
    week: 4,
    title: "Same Area, New Perimeter",
    strategy: "Trace every exposed edge",
    expectedMinutes: 25,
    visual: "perimeter",
    warmUp: {
      prompt:
        "A 3 by 3 square grid has its centre square removed. Each small side is 1 unit. What is the perimeter, including the inside boundary?",
      acceptedAnswers: ["16", "16 units"],
      answer: "16 units",
      explanation:
        "The outer boundary is 12 units. The new inner boundary adds 4 units, making 16.",
    },
    mainPrompt:
      "Start with a 4 by 4 grid. Shape A has its four corner squares removed. Shape B has its central 2 by 2 block removed. Both shapes contain 12 unit squares. Find both perimeters and explain why they are different.",
    hints: [
      "The inside edge of a hole counts as perimeter too.",
      "Removing one corner loses two outer edges but exposes two new edges.",
      "Shape A remains 16. Shape B has outer perimeter 16 plus an inner perimeter of 8.",
    ],
    answer: "Shape A: 16 units. Shape B: 24 units.",
    solution:
      "Each removed corner replaces two outer edges with two newly exposed edges, so Shape A keeps perimeter 16. Shape B keeps the outer perimeter 16 and gains the 8-unit boundary of the central hole, giving 24.",
    alternative:
      "Count four edges for every remaining square, then subtract two for every shared edge.",
    stretch: {
      prompt:
        "Make another connected 12-square shape inside a 4 by 4 grid with perimeter 20. Shade the four squares you remove.",
      answer:
        "One example removes the two leftmost squares of the top row, then the second and third squares of the next row.",
    },
  },
  {
    id: "route-mapper",
    session: 8,
    week: 4,
    title: "Route Mapper",
    strategy: "Count paths systematically",
    expectedMinutes: 25,
    visual: "routes",
    warmUp: {
      prompt:
        "On a 2 by 2 street grid, travel from the bottom-left to the top-right using only moves right or up. How many shortest routes are possible?",
      acceptedAnswers: ["6", "6 routes"],
      answer: "6 routes",
      explanation:
        "Every shortest route uses two right moves and two up moves. There are 6 different orders.",
    },
    mainPrompt:
      "On a 3 by 3 street grid, travel from START to FINISH using only moves right or up. The marked intersection, one step right and one step up from START, is closed. How many shortest routes avoid it? Show a method that counts every route once.",
    hints: [
      "Write the number of ways to reach each intersection. Put 1 at START.",
      "Each open intersection receives the sum from its left and below. Write 0 at the closed point.",
      "Fill the bottom and left edges first, then work towards FINISH. The final count is 8.",
    ],
    answer: "8 routes.",
    solution:
      "An open 3 by 3 grid has 20 shortest routes. Twelve pass through the blocked point: 2 ways to reach it and 6 ways to continue. Therefore 20 - 12 = 8.",
    alternative:
      "Build a route-count table. Each open point is left + below, while the blocked point stays at 0.",
    stretch: {
      prompt:
        "Close a second intersection two steps right and two steps up from START. How many shortest routes avoid both closed points?",
      answer: "4 routes.",
    },
  },
];
