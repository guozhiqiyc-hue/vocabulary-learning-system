// 自动应用所有批次的补全数据
const fs = require('fs');
const path = require('path');

console.log('🚀 开始自动补全处理...\n');

// 读取原始数据
const inputFile = path.join('D:\\XX\\WL\\英语项目需求文档\\教材\\提取数据', '七上_system.json');
const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log(`📊 原始数据: ${data.cards.length} 条`);

// 读取所有批次
const batches = [
  require('./七上_completed_batch1.json'),
  require('./七上_completed_batch2.json')
];

console.log(`📦 已加载 ${batches.length} 个批次`);
console.log(`   批次1: ${batches[0].length} 条`);
console.log(`   批次2: ${batches[1].length} 条`);
console.log(`   总计: ${batches[0].length + batches[1].length} 条补全数据\n`);

// 合并所有批次并创建映射
const allCompleted = batches.flat();
const completedMap = new Map();

allCompleted.forEach(item => {
    // 清理短语：移除多余空格和换行
    let cleanPhrase = item.phrase.replace(/\s+/g, ' ').trim();
    completedMap.set(cleanPhrase, item);
});

console.log(`📝 创建了 ${completedMap.size} 个映射\n`);

// 应用补全数据
let updatedCount = 0;
let notFoundList = [];

data.cards.forEach((card, index) => {
    // 清理短语中的多余空白和换行符
    let cleanPhrase = card.phrase.replace(/\s+/g, ' ').trim();

    if (completedMap.has(cleanPhrase)) {
        const completed = completedMap.get(cleanPhrase);

        // 只更新缺失的字段
        if (!card.meaning || card.meaning.trim() === '') {
            card.meaning = completed.meaning;
        }
        if (!card.example || card.example.trim() === '') {
            card.example = completed.example;
        }

        updatedCount++;
    } else {
        // 记录未找到的（只记录前20个）
        if (notFoundList.length < 20) {
            notFoundList.push(`${index + 1}. ${cleanPhrase}`);
        }
    }
});

console.log(`✅ 成功更新: ${updatedCount} 条`);
console.log(`❌ 未找到匹配: ${data.cards.length - updatedCount} 条`);

if (notFoundList.length > 0) {
    console.log(`\n未找到的示例（前${notFoundList.length}个）:`);
    notFoundList.forEach(item => console.log(`  ${item}`));
}

// 统计完成情况
const stillIncomplete = data.cards.filter(card =>
    !card.meaning || card.meaning.trim() === '' ||
    !card.example || card.example.trim() === ''
);

console.log(`\n📊 处理后统计:`);
console.log(`   总数: ${data.cards.length}`);
console.log(`   已完成: ${data.cards.length - stillIncomplete.length}`);
console.log(`   仍需补全: ${stillIncomplete.length}`);

// 保存更新后的数据
const outputFile = path.join('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6', '七上_system_updated.json');
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✅ 更新后的数据已保存到:`);
console.log(`   ${outputFile}`);

console.log(`\n📝 下一步操作:`);
console.log(`   1. 使用系统的导入工具导入 七上_system_updated.json`);
console.log(`   2. 或者继续生成更多批次（还剩 ${stillIncomplete.length} 条需要补全）`);

// 生成未完成的列表，方便下一批处理
const remainingFile = path.join('D:\\XX\\WL\\学习系统\\02_English\\词汇\\每日词汇\\vocabulary-learning-system-v6', 'remaining_phrases.txt');
const remainingList = stillIncomplete.map(card => card.phrase.replace(/\s+/g, ' ').trim()).join('\n');
fs.writeFileSync(remainingFile, remainingList, 'utf8');
console.log(`\n📋 未完成的语块列表已保存到: ${remainingFile}`);
