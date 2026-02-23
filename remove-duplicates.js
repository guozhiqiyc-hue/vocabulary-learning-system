// 去重脚本 - 移除完全重复的语块
const fs = require('fs');

const inputFile = 'D:\\XX\\WL\\英语项目需求文档\\教材\\提取数据\\七上_system.json';
const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log(`原始数据: ${data.cards.length} 条`);

// 使用Map去重（按清理后的短语）
const uniqueMap = new Map();
const duplicates = [];

data.cards.forEach((card, index) => {
    const cleanPhrase = card.phrase.replace(/\s+/g, ' ').trim();

    if (uniqueMap.has(cleanPhrase)) {
        duplicates.push({
            phrase: cleanPhrase,
            originalIndex: index + 1,
            existingIndex: uniqueMap.get(cleanPhrase).index + 1
        });
    } else {
        uniqueMap.set(cleanPhrase, { ...card, index });
    }
});

// 转换回数组
const uniqueCards = Array.from(uniqueMap.values()).map(({ index, ...card }) => card);

console.log(`去重后: ${uniqueCards.length} 条`);
console.log(`发现重复: ${duplicates.length} 条`);

if (duplicates.length > 0) {
    console.log(`\n重复的语块示例（前20个）:`);
    duplicates.slice(0, 20).forEach(d => {
        console.log(`  "${d.phrase}" - 原位置:${d.originalIndex}, 已存在:${d.existingIndex}`);
    });
}

// 保存去重后的数据
const uniqueData = {
    source: data.source,
    total: uniqueCards.length,
    cards: uniqueCards
};

const outputFile = 'D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\七上_system_unique.json';
fs.writeFileSync(outputFile, JSON.stringify(uniqueData, null, 2), 'utf8');

console.log(`\n✅ 去重后的数据已保存到: ${outputFile}`);

// 统计需要补全的数量
const incomplete = uniqueCards.filter(card =>
    !card.meaning || card.meaning.trim() === '' ||
    !card.example || card.example.trim() === ''
);

console.log(`\n📊 需要补全: ${incomplete.length} 条`);
console.log(`📊 已完成: ${uniqueCards.length - incomplete.length} 条`);
console.log(`📊 进度: ${Math.round((uniqueCards.length - incomplete.length) / uniqueCards.length * 100)}%`);
