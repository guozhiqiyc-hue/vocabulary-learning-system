// 应用补全数据的工具
const fs = require('fs');
const path = require('path');

// 读取原始数据
const inputFile = path.join('D:\\XX\\WL\\英语项目需求文档\\教材\\提取数据', '七上_system.json');
const rawData = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(rawData);

// 读取补全数据（批次1）
const completedBatch = require('./七上_completed_batch1.json');

console.log(`原始数据: ${data.cards.length} 条`);
console.log(`补全数据: ${completedBatch.length} 条`);

// 创建一个映射，方便查找
const completedMap = new Map();
completedBatch.forEach(item => {
    // 清理短语中的多余空白和换行
    const cleanPhrase = item.phrase.replace(/\s+/g, ' ').trim();
    completedMap.set(cleanPhrase, item);
});

// 应用补全数据
let updatedCount = 0;
let notFoundCount = 0;

data.cards.forEach(card => {
    // 清理短语
    const cleanPhrase = card.phrase.replace(/\s+/g, ' ').trim();

    if (completedMap.has(cleanPhrase)) {
        const completed = completedMap.get(cleanPhrase);

        // 更新缺失的字段
        if (!card.meaning || card.meaning.trim() === '') {
            card.meaning = completed.meaning;
        }
        if (!card.example || card.example.trim() === '') {
            card.example = completed.example;
        }

        updatedCount++;
        console.log(`✓ 更新: ${cleanPhrase}`);
    } else {
        notFoundCount++;
        if (notFoundCount <= 5) {
            console.log(`✗ 未找到: ${cleanPhrase}`);
        }
    }
});

console.log(`\n统计:`);
console.log(`成功更新: ${updatedCount} 条`);
console.log(`未找到匹配: ${notFoundCount} 条`);

// 保存更新后的数据
const outputFile = path.join('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6', '七上_system_updated.json');
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✅ 更新后的数据已保存到: ${outputFile}`);
console.log(`\n下一步: 使用导入工具将 七上_system_updated.json 导入到数据库`);
