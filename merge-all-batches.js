const fs = require('fs');
const path = require('path');

// 文件路径
const sourceFile = path.join(__dirname, '七上_system_unique.json');
const completedDir = path.join(__dirname, 'completed');
const outputFile = path.join(__dirname, '七上_system_completed.json');

console.log('🚀 开始合并所有批次数据（智能匹配模式）...\n');

// 1. 读取源数据
console.log('📖 读取源数据文件...');
const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
console.log(`✅ 源数据总数: ${sourceData.cards.length} 条\n`);

// 2. 读取所有批次数据
console.log('📚 读取所有批次文件...');
const batchFiles = fs.readdirSync(completedDir)
  .filter(f => f.startsWith('batch_') && f.endsWith('.json'))
  .sort((a, b) => {
    const matchA = a.match(/batch_(\d+)/);
    const matchB = b.match(/batch_(\d+)/);
    if (!matchA || !matchB) return 0;
    const numA = parseInt(matchA[1]);
    const numB = parseInt(matchB[1]);
    return numA - numB;
  });

console.log(`✅ 找到 ${batchFiles.length} 个批次文件\n`);

// 3. 清理和标准化函数
function normalizePhrase(phrase) {
  return phrase
    .replace(/\s+/g, ' ')      // 多个空格替换为单个空格
    .replace(/\n+/g, ' ')       // 换行符替换为空格
    .trim()
    .toLowerCase();
}

function fuzzyMatch(phrase1, phrase2) {
  const p1 = normalizePhrase(phrase1);
  const p2 = normalizePhrase(phrase2);

  // 完全匹配
  if (p1 === p2) return 1.0;

  // 包含关系匹配
  if (p1.includes(p2) || p2.includes(p1)) return 0.9;

  // 编辑距离匹配
  const len = Math.max(p1.length, p2.length);
  if (len === 0) return 0;

  let distance = 0;
  const maxLen = Math.min(p1.length, p2.length);
  for (let i = 0; i < maxLen; i++) {
    if (p1[i] !== p2[i]) distance++;
  }
  distance += Math.abs(p1.length - p2.length);

  const similarity = 1 - (distance / len);
  return similarity > 0.8 ? similarity : 0;
}

// 4. 创建源数据映射（使用清理后的phrase作为key）
const sourceMap = new Map();

sourceData.cards.forEach((card, index) => {
  const cleanPhrase = normalizePhrase(card.phrase);

  if (!sourceMap.has(cleanPhrase)) {
    sourceMap.set(cleanPhrase, []);
  }

  sourceMap.get(cleanPhrase).push({
    ...card,
    originalIndex: index
  });
});

console.log(`📋 创建了 ${sourceMap.size} 条唯一语块映射\n`);

// 5. 合并所有批次数据
let totalApplied = 0;
let totalProcessed = 0;
let fuzzyMatches = 0;

batchFiles.forEach((file, fileIndex) => {
  const batchPath = path.join(completedDir, file);
  const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

  let batchApplied = 0;
  let batchFuzzy = 0;

  batchData.forEach(item => {
    totalProcessed++;
    const cleanPhrase = normalizePhrase(item.phrase);

    // 精确匹配
    if (sourceMap.has(cleanPhrase)) {
      const cards = sourceMap.get(cleanPhrase);

      cards.forEach(card => {
        let updated = false;

        if (!card.meaning || card.meaning === '') {
          card.meaning = item.meaning;
          updated = true;
        }

        if (!card.example || card.example === '') {
          card.example = item.example;
          updated = true;
        }

        if (updated) {
          batchApplied++;
          totalApplied++;
        }
      });
    } else {
      // 模糊匹配
      for (const [key, cards] of sourceMap.entries()) {
        if (cards[0].meaning && cards[0].example) continue; // 已完成

        const similarity = fuzzyMatch(cleanPhrase, key);
        if (similarity > 0.85) {
          cards.forEach(card => {
            let updated = false;

            if (!card.meaning || card.meaning === '') {
              card.meaning = item.meaning;
              updated = true;
            }

            if (!card.example || card.example === '') {
              card.example = item.example;
              updated = true;
            }

            if (updated) {
              batchFuzzy++;
              fuzzyMatches++;
              totalApplied++;
            }
          });
          break;
        }
      }
    }
  });

  console.log(`✅ 批次 ${fileIndex + 1}: ${batchApplied} 精确 + ${batchFuzzy} 模糊 = ${batchApplied + batchFuzzy}/${batchData.length} 条已应用`);
});

console.log(`\n📊 合并统计:`);
console.log(`   - 总处理条数: ${totalProcessed}`);
console.log(`   - 成功应用: ${totalApplied}`);
console.log(`   - 精确匹配: ${totalApplied - fuzzyMatches}`);
console.log(`   - 模糊匹配: ${fuzzyMatches}`);
console.log(`   - 应用率: ${(totalApplied / sourceData.cards.length * 100).toFixed(1)}%\n`);

// 6. 生成最终数据
const completedCards = sourceData.cards.map((card, index) => {
  // 从映射表中获取更新后的数据
  const cleanPhrase = normalizePhrase(card.phrase);
  if (sourceMap.has(cleanPhrase)) {
    const updatedCards = sourceMap.get(cleanPhrase);
    const updatedCard = updatedCards.find(c => c.originalIndex === index);
    if (updatedCard) {
      const { originalIndex, ...cardData } = updatedCard;
      return cardData;
    }
  }
  return card;
});

// 7. 统计完成情况
let withMeaning = 0;
let withExample = 0;
let withBoth = 0;

completedCards.forEach(card => {
  if (card.meaning && card.meaning !== '') withMeaning++;
  if (card.example && card.example !== '') withExample++;
  if (card.meaning && card.meaning !== '' && card.example && card.example !== '') withBoth++;
});

console.log('📈 完成情况统计:');
console.log(`   - 有meaning: ${withMeaning}/${completedCards.length} (${(withMeaning/completedCards.length*100).toFixed(1)}%)`);
console.log(`   - 有example: ${withExample}/${completedCards.length} (${(withExample/completedCards.length*100).toFixed(1)}%)`);
console.log(`   - 两者都有: ${withBoth}/${completedCards.length} (${(withBoth/completedCards.length*100).toFixed(1)}%)\n`);

// 8. 保存完成数据
const outputData = {
  metadata: sourceData.metadata || {},
  total: completedCards.length,
  completed: withBoth,
  percentage: (withBoth / completedCards.length * 100).toFixed(1),
  lastUpdated: new Date().toISOString(),
  mergeMethod: 'fuzzy-matching',
  cards: completedCards
};

fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf8');

console.log('💾 数据已保存到:');
console.log(`   ${outputFile}\n`);

// 9. 显示未完成项目
if (withBoth < completedCards.length) {
  const incomplete = completedCards.filter(card =>
    !card.meaning || card.meaning === '' || !card.example || card.example === ''
  );

  console.log(`⚠️  还有 ${incomplete.length} 条未完成:`);
  incomplete.slice(0, 15).forEach(card => {
    const displayPhrase = card.phrase.replace(/\s+/g, ' ').trim();
    console.log(`   - ${displayPhrase.substring(0, 50)}`);
  });

  if (incomplete.length > 15) {
    console.log(`   ... 还有 ${incomplete.length - 15} 条`);
  }
  console.log('');
}

console.log('🎉 合并完成！');
