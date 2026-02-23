// 生成第二批提示词
const fs = require('fs');

// 读取已更新的数据
const data = JSON.parse(fs.readFileSync('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\七上_system_updated.json', 'utf8'));

// 找出未完成的（跳过已完成的45条）
const incomplete = data.cards.filter(card =>
    !card.meaning || card.meaning.trim() === '' ||
    !card.example || card.example.trim() === ''
);

console.log(`剩余未完成: ${incomplete.length} 条`);

// 取第51-100条（第二批）
const batch2 = incomplete.slice(0, 50);

console.log(`\n第二批 (第51-100条): ${batch2.length} 个语块`);
console.log('====================================');

// 生成提示词
let prompt = `请为以下${batch2.length}个英语语块补全中文翻译和例句：\n\n`;
batch2.forEach((card, index) => {
    prompt += `${index + 51}. ${card.phrase}\n`;
});
prompt += `\n要求：\n`;
prompt += `1. 返回JSON数组格式\n`;
prompt += `2. 包含字段：phrase, meaning, example\n`;
prompt += `3. 例句中的关键词用 ** 包裹\n`;
prompt += `4. 不要有任何其他文字，只要JSON\n\n`;
prompt += `示例格式：\n`;
prompt += `[\n  {"phrase": "look at", "meaning": "看", "example": "Please **look at** the blackboard."},\n  ...\n]\n`;

// 保存提示词
fs.writeFileSync('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\prompt_batch2.txt', prompt, 'utf8');

console.log('\n✅ 提示词已保存到 prompt_batch2.txt');
console.log('\n前10个语块:');
batch2.slice(0, 10).forEach((card, index) => {
    console.log(`${index + 51}. ${card.phrase}`);
});
