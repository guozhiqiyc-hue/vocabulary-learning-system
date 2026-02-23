// 批量生成所有剩余批次
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\七上_system_updated.json', 'utf8'));

// 找出未完成的
const incomplete = data.cards.filter(card =>
    !card.meaning || card.meaning.trim() === '' ||
    !card.example || card.example.trim() === ''
);

console.log(`剩余未完成: ${incomplete.length} 条`);
console.log(`将生成 ${Math.ceil(incomplete.length / 50)} 个批次\n`);

// 生成所有批次的提示词
for (let i = 0; i < incomplete.length; i += 50) {
    const batchNum = Math.floor(i / 50) + 3; // 从第3批开始
    const batch = incomplete.slice(i, i + 50);

    let prompt = `请为以下${batch.length}个英语语块补全中文翻译和例句：\n\n`;
    batch.forEach((card, index) => {
        const globalIndex = i + index + 1;
        prompt += `${globalIndex}. ${card.phrase}\n`;
    });

    prompt += `\n要求：\n`;
    prompt += `1. 返回JSON数组格式\n`;
    prompt += `2. 包含字段：phrase, meaning, example\n`;
    prompt += `3. 例句中的关键词用 ** 包裹\n`;
    prompt += `4. 不要有任何其他文字，只要JSON\n\n`;

    const promptFile = `D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\prompt_batch${batchNum}.txt`;
    fs.writeFileSync(promptFile, prompt, 'utf8');

    console.log(`✅ 批次${batchNum}提示词已生成 (${batch.length}条)`);
}

console.log(`\n✅ 所有提示词已生成!`);
console.log(`\n下一批(第3批)的语块:`);
const nextBatch = incomplete.slice(0, 50);
nextBatch.slice(0, 20).forEach((card, index) => {
    console.log(`${i + index + 1}. ${card.phrase}`);
});
