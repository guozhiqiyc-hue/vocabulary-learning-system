// 合并所有已完成的批次并应用到原始数据
const fs = require('fs');

// 读取去重后的原始数据
const data = JSON.parse(fs.readFileSync('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\七上_system_unique.json', 'utf8'));

// 读取所有已完成的批次（1-6）
const batches = [];
for (let i = 1; i <= 6; i++) {
    try {
        const batch = JSON.parse(fs.readFileSync(`D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\completed\\batch_${i}.json`, 'utf8'));
        batches.push(batch);
        console.log(`✅ 加载批次${i}: ${batch.length}条`);
    } catch (e) {
        console.log(`⚠️  批次${i}加载失败: ${e.message}`);
    }
}

const totalCompleted = batches.reduce((sum, batch) => sum + batch.length, 0);
console.log(`\n总计加载: ${totalCompleted}条补全数据\n`);

// 创建映射
const completedMap = new Map();
batches.flat().forEach(item => {
    const cleanPhrase = item.phrase.replace(/\s+/g, ' ').trim();
    completedMap.set(cleanPhrase, item);
});

// 应用到原始数据
let updatedCount = 0;
data.cards.forEach(card => {
    const cleanPhrase = card.phrase.replace(/\s+/g, ' ').trim();
    if (completedMap.has(cleanPhrase)) {
        const completed = completedMap.get(cleanPhrase);
        if (!card.meaning || card.meaning.trim() === '') {
            card.meaning = completed.meaning;
        }
        if (!card.example || card.example.trim() === '') {
            card.example = completed.example;
        }
        updatedCount++;
    }
});

console.log(`✅ 成功更新: ${updatedCount}条\n`);

// 统计完成情况
const stillIncomplete = data.cards.filter(card =>
    !card.meaning || card.meaning.trim() === '' ||
    !card.example || card.example.trim() === ''
);

console.log(`📊 处理后统计:`);
console.log(`   总数: ${data.cards.length}`);
console.log(`   已完成: ${data.cards.length - stillIncomplete.length}`);
console.log(`   待补全: ${stillIncomplete.length}`);
console.log(`   进度: ${Math.round((data.cards.length - stillIncomplete.length) / data.cards.length * 100)}%`);

// 保存更新后的数据
const outputFile = 'D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6\\七上_system_progress_300.json';
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✅ 更新后的数据已保存到: ${outputFile}`);
console.log(`\n📝 下一步: 继续生成剩余${stillIncomplete.length}条`);
