const fs = require('fs');
const path = require('path');

const completedFile = path.join(__dirname, '七上_system_completed.json');
const data = JSON.parse(fs.readFileSync(completedFile, 'utf8'));

// 提取未完成的条目
const incomplete = data.cards.filter(card =>
  !card.meaning || card.meaning === '' || !card.example || card.example === ''
);

console.log(`找到 ${incomplete.length} 条未完成数据\n`);
console.log('未完成的语块：\n');

incomplete.slice(0, 30).forEach((card, index) => {
  const cleanPhrase = card.phrase.replace(/\s+/g, ' ').trim();
  console.log(`${index + 1}. ${cleanPhrase}`);
});

if (incomplete.length > 30) {
  console.log(`\n... 还有 ${incomplete.length - 30} 条`);
}

// 保存未完成列表
const outputFile = path.join(__dirname, 'incomplete_phrases.txt');
const content = incomplete.map(card => {
  const cleanPhrase = card.phrase.replace(/\s+/g, ' ').trim();
  return `${cleanPhrase}`;
}).join('\n');

fs.writeFileSync(outputFile, content, 'utf8');
console.log(`\n已保存到: ${outputFile}`);
