import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';
import questions from './addHardDifficultyQuestions.js'; // Note: it will pull the modified (incorrect) strings, which is perfect because we want to delete THOSE from the DB.

dotenv.config();

const reverse = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const questionsText = questions.map(q => q.question);
        
        const res = await Question.deleteMany({ question: { $in: questionsText } });
        console.log('Deleted inserted questions:', res.deletedCount);
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};

reverse();
