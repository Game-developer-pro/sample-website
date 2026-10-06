import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";

dotenv.config();

const questions = [
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Simplify (2³ X 2²) / 2⁴.', 'options': ['1', '2', '4', '8'], 'answer': '2', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Evaluate log₂ (8) + log₂ (4).', 'options': ['3', '4', '5', '6'], 'answer': '5', 'difficulty': 'easy'},
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If 3x + 2 = 11, find x.', 'options': ['2', '3', '4', '5'], 'answer': '3', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the nth term of the sequence 2, 5, 8, 11...', 'options': ['3n-1', '2n+3', '3n+1', 'n+3'], 'answer': '3n-1', 'difficulty': 'easy'},
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Convert 1101₂ to base 10.', 'options': ['11', '12', '13', '14'], 'answer': '13', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'What is the slope of the line 2y = 4x + 6?', 'options': ['1', '2', '3', '4'], 'answer': '2', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the derivative of y = x² + 3x.', 'options': ['x+3', '2x+3', '2x+1', 'x²'], 'answer': '2x+3', 'difficulty': 'easy'},
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If A = {1, 2, 3} and B = {3, 4, 5}, find A U B.', 'options': ['{3}', '{1, 2, 3, 4, 5}', '{1, 2, 4, 5}', '{1, 2, 3}'], 'answer': '{1, 2, 3, 4, 5}', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Solve for x: x² - 5x + 6 = 0.', 'options': ['x=1, 6', 'x=2, 3', 'x=-2, -3', 'x=1, 5'], 'answer': 'x=2, 3', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'The sum of angles in a triangle is:', 'options': ['90', '180', '270', '360'], 'answer': '180', 'difficulty': 'easy'},
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Calculate the area of a circle with radius 7cm (take π = 22/7).', 'options': ['44cm²', '154cm²', '150cm²', '88cm²'], 'answer': '154cm²', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If sin θ = 3/5, find cos θ.', 'options': ['2/5', '3/5', '4/5', '1'], 'answer': '4/5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the median of: 3, 1, 4, 1, 5, 9, 2.', 'options': ['1', '2', '3', '4'], 'answer': '3', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Simplify √20 + √45.', 'options': ['5√5', '2√5', '3√5', '6√5'], 'answer': '5√5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'A bag contains 3 red and 2 blue balls. Probability of picking red is:', 'options': ['2/5', '3/5', '1/5', '1'], 'answer': '3/5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the value of x if 2^x = 16.', 'options': ['2', '3', '4', '8'], 'answer': '4', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the equation of a line passing through (0,0) and (1,1).', 'options': ['y=x', 'y=2x', 'y=x+1', 'x=y+1'], 'answer': 'y=x', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Factorize x² - 9.', 'options': ['(x-3)²', '(x-9)(x+1)', '(x-3)(x+3)', '(x+9)(x-1)'], 'answer': '(x-3)(x+3)', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If y varies directly as x and y=4 when x=2, find y when x=5.', 'options': ['8', '10', '12', '6'], 'answer': '10', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the matrix determinant: [[1, 2], [3, 4]].', 'options': ['-2', '2', '10', '-10'], 'answer': '-2', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'What is the next number in 1, 4, 9, 16...?', 'options': ['20', '25', '30', '36'], 'answer': '25', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the simple interest on N1000 for 2 years at 5%.', 'options': ['N50', 'N100', 'N200', 'N500'], 'answer': 'N100', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the circumference of a circle with diameter 14cm (π = 22/7).', 'options': ['22cm', '44cm', '88cm', '154cm'], 'answer': '44cm', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Solve for x: log₁₀(x) = 2.', 'options': ['10', '20', '100', '200'], 'answer': '100', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Calculate (a+b)². ', 'options': ['a²+b²', 'a²+ab+b²', 'a²+2ab+b²', 'a²+b²+2a'], 'answer': 'a²+2ab+b²', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'A polygon with 5 sides is a:', 'options': ['Quadrilateral', 'Pentagon', 'Hexagon', 'Heptagon'], 'answer': 'Pentagon', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If tan θ = 1, find θ.', 'options': ['30', '45', '60', '90'], 'answer': '45', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the range of 10, 2, 5, 8, 1.', 'options': ['7', '8', '9', '10'], 'answer': '9', 'difficulty': 'easy'},
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If f(x) = 2x+1, find f(3).', 'options': ['5', '6', '7', '8'], 'answer': '7', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Solve for x in 5x - 3 = 2x + 9.', 'options': ['2', '3', '4', '5'], 'answer': '4', 'difficulty': 'easy'},
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the area of a triangle with base 10cm and height 5cm.', 'options': ['25cm²', '50cm²', '15cm²', '75cm²'], 'answer': '25cm²', 'difficulty': 'easy'},
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Express 0.05 as a percentage.', 'options': ['0.5%', '5%', '50%', '500%'], 'answer': '5%', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Evaluate 3° + 2°. ', 'options': ['0', '1', '2', '5'], 'answer': '2', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If set P = {even numbers < 10}, find P.', 'options': ['{2, 4, 6, 8}', '{1, 3, 5, 7, 9}', '{0, 2, 4, 6, 8}', '{2, 4, 6, 8, 10}'], 'answer': '{2, 4, 6, 8}', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the distance between (0,0) and (3,4).', 'options': ['3', '4', '5', '7'], 'answer': '5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If 1/x = 0.2, find x.', 'options': ['2', '4', '5', '10'], 'answer': '5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the mode of 2, 3, 3, 4, 5.', 'options': ['2', '3', '4', '5'], 'answer': '3', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Simplify 2x + 3y - x + y.', 'options': ['x+2y', 'x+4y', '3x+2y', '3x+4y'], 'answer': 'x+4y', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'What is the probability of tossing a fair coin and getting heads?', 'options': ['1/4', '1/2', '3/4', '1'], 'answer': '1/2', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the product of (x+2)(x-2).', 'options': ['x²+4', 'x²-4', 'x²+2x-4', 'x²-2x+4'], 'answer': 'x²-4', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'How many seconds are in 1 hour?', 'options': ['60', '600', '3600', '36000'], 'answer': '3600', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find x if 3/x = 9/15.', 'options': ['3', '5', '6', '9'], 'answer': '5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'The angle in a semi-circle is:', 'options': ['45', '90', '180', '270'], 'answer': '90', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Evaluate integral of 2x dx.', 'options': ['x', 'x²', '2x²', 'x²+c'], 'answer': 'x²+c', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'If logₓ (9) = 2, find x.', 'options': ['2', '3', '4', '9'], 'answer': '3', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'A right-angled triangle has sides 3, 4, x. Find x.', 'options': ['5', '6', '7', '8'], 'answer': '5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find 25% of 200.', 'options': ['25', '50', '75', '100'], 'answer': '50', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'What is the square root of 64?', 'options': ['4', '6', '8', '16'], 'answer': '8', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Find the value of x in 2x - 10 = 0.', 'options': ['2', '5', '8', '10'], 'answer': '5', 'difficulty': 'easy'}, 
    {'examType': 'JAMB', 'subject': 'Mathematics', 'question': 'Calculate the perimeter of a rectangle with length 5 and width 3.', 'options': ['8', '15', '16', '20'], 'answer': '16', 'difficulty': 'easy'}
];


const addNewQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await Question.find().select("question").lean();
    const existingSet = new Set(existing.map((q) => q.question));

    const newQuestions = questions.filter((q) => !existingSet.has(q.question));

    if (newQuestions.length === 0) {
      console.log("✅ No new questions to insert; all already exist.");
    } else {
      // ordered: false — skip duplicates and continue inserting remaining docs
      let insertedCount = 0;
      try {
        const result = await Question.insertMany(newQuestions, { ordered: false });
        insertedCount = result.length;
      } catch (bulkErr) {
        if (bulkErr.code === 11000 || bulkErr.name === "MongoBulkWriteError") {
          insertedCount = bulkErr.result?.insertedCount ?? 0;
          console.log(`⚠️  Skipped ${bulkErr.writeErrors?.length ?? 0} duplicate(s).`);
        } else {
          throw bulkErr;
        }
      }
      console.log(`✅ Inserted ${insertedCount} new question(s) successfully!`);

      // Print breakdown
      const jambCount = newQuestions.filter(q => q.examType === "JAMB").length;
      const waecCount = newQuestions.filter(q => q.examType === "WEAC_NECO").length;
      console.log(`   📚 JAMB: ${jambCount} questions`);
      console.log(`   📚 WAEC/NECO: ${waecCount} questions`);
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding questions:", err);
    process.exit(1);
  }
};

addNewQuestions();
