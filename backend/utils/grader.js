export const calculateScore = (answers, questions) => {
  let score = 0;
  answers.forEach((ans) => {
    const q = questions.find((q) => q.id === ans.questionId);
    if (q && q.correctAnswer === ans.selectedOption) score++;
  });
  return (score / questions.length) * 100;
};
