const fs = require('fs');
let content = fs.readFileSync('backend/seedAllQuestions.js', 'utf8');

const regex = /(\{\s*examType:\s*"JAMB",\s*subject:\s*"English",\s*question:\s*")(.*?)("\s*,.*?\})/g;
let counter = 0;
content = content.replace(regex, (match, p1, p2, p3) => {
  counter++;
  if (counter > 40) {
    return p1 + p2 + ' (Bonus)' + p3;
  }
  return match;
});

fs.writeFileSync('backend/seedAllQuestions.js', content);
console.log('Modified 20 English questions with Bonus tag.');
