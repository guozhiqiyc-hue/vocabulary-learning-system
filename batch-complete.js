// 批量补全工具 - 分批处理七上数据
const fs = require('fs');
const path = require('path');

const inputFile = path.join('D:\\XX\\WL\\英语项目需求文档\\教材\\提取数据', '七上_system.json');
const outputFile = path.join('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6', '七上_completed_batch.json');

// 读取原始数据
const rawData = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(rawData);

console.log(`总语块数: ${data.total}`);
console.log(`需要处理的语块数: ${data.cards.length}`);

// 过滤出需要补全的语块
const incompleteCards = data.cards.filter(card =>
    !card.meaning || card.meaning.trim() === '' || !card.example || card.example.trim() === ''
);

console.log(`需要补全的语块数: ${incompleteCards.length}`);

// 取前50个作为第一批
const firstBatch = incompleteCards.slice(0, 50);

console.log(`\n第一批处理: ${firstBatch.length} 个语块`);
console.log('====================================');

// 生成提示词
let prompt = '请为以下英语语块补全中文翻译和例句：\n\n';
firstBatch.forEach((card, index) => {
    prompt += `${index + 1}. ${card.phrase}\n`;
});
prompt += '\n要求：\n';
prompt += '1. 返回JSON数组格式\n';
prompt += '2. 包含字段：phrase, meaning, example\n';
prompt += '3. 例句中的关键词用 ** 包裹\n';
prompt += '4. 不要有任何其他文字，只要JSON\n\n';
prompt += '示例格式：\n';
prompt += '[\n  {"phrase": "look at", "meaning": "看", "example": "Please **look at** the blackboard."},\n  {"phrase": "be ready to", "meaning": "准备好做某事", "example": "I am **ready to** go."}\n]';

// 将提示词保存到文件
fs.writeFileSync('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\prompt_batch1.txt', prompt, 'utf8');

console.log('\n✅ 提示词已生成！');
console.log('请将 prompt_batch1.txt 的内容发送给Claude AI');
console.log('然后将返回的JSON数据保存为 completed_batch1.json');

// 同时输出前20个语块供查看
console.log('\n前20个语块预览：');
console.log('====================================');
firstBatch.slice(0, 20).forEach((card, index) => {
    console.log(`${index + 1}. ${card.phrase} (Unit: ${card.unit || 'N/A'})`);
});

// 输出统计
const units = {};
firstBatch.forEach(card => {
    const unit = card.unit || 'Unknown';
    units[unit] = (units[unit] || 0) + 1;
});

console.log('\n按单元分布：');
console.log('====================================');
Object.entries(units).forEach(([unit, count]) => {
    console.log(`${unit}: ${count}个`);
});
