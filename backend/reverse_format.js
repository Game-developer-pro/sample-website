import fs from 'fs';

let content = fs.readFileSync('addHardDifficultyQuestions.js', 'utf8');

// The array
let arrayStr = content.match(/const question = (\[[\s\S]*\]);/)[1];
let questions = eval(arrayStr);

const reverseSuperscripts = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
};

const reverseSuperscriptMatch = (str) => {
    return str.replace(/\^([0-9\+\-\=\(\)]+)/g, (match, p1) => {
        return p1.split('').map(char => reverseSuperscripts[char] || char).join('');
    });
};

for (let q of questions) {
    const unfixSymbols = (str) => {
        if (typeof str !== 'string') return str;
        str = reverseSuperscriptMatch(str);
        return str
            .replace(/He-4/g, '⁴₂He')
            .replace(/sqrt\(([^)]+)\)/g, '√$1')
            .replace(/sqrt/g, '√')
            .replace(/pi/g, 'π')
            .replace(/\bu\b/g, 'μ') // Note: this might replace normal 'u', but wait, I used `u` so let's hope it's fine. Wait, previously I replaced μ with u. A word boundary might be okay for unit μC but not 'u' in other words.
            .replace(/ohms/g, 'Ω')
            .replace(/ deg /g, '°');
    };
    
    // We only replaced μ with u. Let's fix specific occurrences like uC to μC
    // In our context: μC, μF, μm
    const safeUnfixSymbols = (str) => {
        if (typeof str !== 'string') return str;
        str = reverseSuperscriptMatch(str);
        return str
            .replace(/He-4/g, '⁴₂He')
            .replace(/sqrt\(([^)]+)\)/g, '√$1')
            .replace(/sqrt/g, '√')
            .replace(/pi/g, 'π')
            .replace(/uC/g, 'μC')
            .replace(/uF/g, 'μF')
            .replace(/um/g, 'μm')
            .replace(/ohms/g, 'Ω')
            .replace(/ deg C/g, '°C')
            .replace(/ deg /g, '°');
    };
    
    q.question = safeUnfixSymbols(q.question);
    q.options = q.options.map(safeUnfixSymbols);
    q.answer = safeUnfixSymbols(q.answer);
}

const newContent = 'const question = ' + JSON.stringify(questions, null, 2) + ';\n\nexport default question;';
fs.writeFileSync('addHardDifficultyQuestions.js', newContent);
console.log('File reversed successfully');
