// 大规模自动补全 - 生成所有批次
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\七上_system_unique.json', 'utf8'));

const incomplete = data.cards.filter(card =>
    !card.meaning || card.meaning.trim() === '' ||
    !card.example || card.example.trim() === ''
);

console.log(`需要补全: ${incomplete.length} 条\n`);

// 分成19批（每批50条）
const BATCH_SIZE = 50;
const totalBatches = Math.ceil(incomplete.length / BATCH_SIZE);

console.log(`总共需要生成 ${totalBatches} 个批次\n`);
console.log('🚀 开始生成所有批次的提示词...\n');

const allPrompts = [];

for (let i = 0; i < incomplete.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = incomplete.slice(i, i + BATCH_SIZE);
    const startIdx = i + 1;
    const endIdx = Math.min(i + BATCH_SIZE, incomplete.length);

    let prompt = `请为以下${batch.length}个英语语块补全中文翻译和例句（第${batchNum}批，第${startIdx}-${endIdx}条）：\n\n`;

    batch.forEach((card, index) => {
        prompt += `${startIdx + index}. ${card.phrase}\n`;
    });

    prompt += `\n要求：\n`;
    prompt += `1. 返回JSON数组格式\n`;
    prompt += `2. 包含字段：phrase, meaning, example\n`;
    prompt += `3. 例句中的关键词用 ** 包裹（如: He is **good at** **playing**）\n`;
    prompt += `4. 翻译要准确简洁\n`;
    prompt += `5. 例句要实用自然，适合初中生理解\n`;
    prompt += `6. 不要有任何其他文字，只要JSON数组\n\n`;
    prompt += `格式示例：\n`;
    prompt += `[\n  {"phrase": "look at", "meaning": "看", "example": "Please **look at** the blackboard."}\n]\n`;

    allPrompts.push({
        batchNum,
        startIdx,
        endIdx,
        count: batch.length,
        prompt
    });

    // 保存提示词文件
    const promptFile = `D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\prompts\\batch_${batchNum}.txt`;
    const promptDir = 'D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\prompts';

    // 创建目录
    if (!fs.existsSync(promptDir)) {
        fs.mkdirSync(promptDir);
    }

    fs.writeFileSync(promptFile, prompt, 'utf8');

    console.log(`✅ 批次${batchNum} (第${startIdx}-${endIdx}条, 共${batch.length}条)`);
}

// 保存批次索引
const indexFile = 'D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\batch_index.json';
fs.writeFileSync(indexFile, JSON.stringify({
    total: incomplete.length,
    batches: totalBatches,
    batchSize: BATCH_SIZE,
    prompts: allPrompts.map(p => ({
        batch: p.batchNum,
        start: p.startIdx,
        end: p.endIdx,
        count: p.count
    }))
}, null, 2), 'utf8');

console.log(`\n✅ 所有${totalBatches}个批次的提示词已生成！`);
console.log(`📁 保存位置: D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\prompts\\`);
console.log(`\n📋 批次索引已保存到: ${indexFile}`);

// 显示前3批的内容供查看
console.log(`\n📝 前3批预览：\n`);
allPrompts.slice(0, 3).forEach(p => {
    console.log(`\n批次${p.batchNum} (第${p.startIdx}-${p.endIdx}条):`);
    console.log('─'.repeat(60));
    const lines = p.prompt.split('\n');
    lines.slice(0, 25).forEach(line => console.log(line));
    console.log('...');
});
