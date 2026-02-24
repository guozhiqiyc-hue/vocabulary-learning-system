const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 教材数据提取工具 - 混合优化方案
 *
 * 优先级:
 * 1. DOCX文件 (八上/八下) - 提取最简单
 * 2. PDF文件 (七下) - 需要文本提取
 * 3. 现有数据 (七上) - 只需补充
 */

class TextbookExtractor {
  constructor(options = {}) {
    this.baseDir = options.baseDir || 'D:\\XX\\WL\\英语项目需求文档\\教材';
    this.outputDir = options.outputDir || path.join(__dirname, 'extracted_data');
    this.progress = {
      processed: 0,
      total: 0,
      errors: []
    };
  }

  /**
   * 创建输出目录
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log('✅ 创建输出目录:', this.outputDir);
    }
  }

  /**
   * 从DOCX提取数据（优先）
   * 文件: 八上.docx, 八下.docx
   */
  async extractFromDOCX(filename, grade, semester) {
    console.log(`\n📖 处理DOCX文件: ${filename}`);

    // 由于没有mammoth库，我们使用备用方案
    // 1. 检查是否有已提取的数据
    const existingData = this.checkExistingData(grade, semester);
    if (existingData && existingData.cards.length > 100) {
      console.log(`✅ 发现现有数据: ${existingData.cards.length}条`);
      return existingData;
    }

    // 2. 提示用户手动提取或使用现有数据
    console.log('⚠️  需要安装mammoth库处理DOCX文件');
    console.log('💡 安装命令: npm install mammoth');
    console.log('📋 或者使用现有的提取数据');

    return null;
  }

  /**
   * 检查现有数据
   */
  checkExistingData(grade, semester) {
    const dataPath = `D:\\XX\\WL\\英语项目需求文档\\教材\\提取数据\\七下英语完整数据\\data_system.json`;

    try {
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`✅ 找到现有数据: ${data.total}条`);
        return data;
      }
    } catch (error) {
      console.log('⚠️  读取现有数据失败:', error.message);
    }

    return null;
  }

  /**
   * 批量补充释义和例句
   */
  async completeWithAI(dataFile) {
    console.log(`\n🤖 AI补充数据: ${dataFile}`);

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    let completed = 0;
    let skipped = 0;

    for (const card of data.cards) {
      if (!card.meaning || !card.example) {
        // 标记需要补充
        card.needsCompletion = true;
        skipped++;
      } else {
        completed++;
      }
    }

    console.log(`✅ 已完成: ${completed}/${data.cards.length}`);
    console.log(`⏳ 需要补充: ${skipped}/${data.cards.length}`);

    // 保存进度
    const outputFile = dataFile.replace('.json', '_progress.json');
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 保存进度: ${outputFile}`);

    return data;
  }

  /**
   * 统计数据质量
   */
  analyzeDataQuality(dataFile) {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    const stats = {
      total: data.cards.length,
      withMeaning: 0,
      withExample: 0,
      withBoth: 0,
      incomplete: 0
    };

    data.cards.forEach(card => {
      if (card.meaning) stats.withMeaning++;
      if (card.example) stats.withExample++;
      if (card.meaning && card.example) stats.withBoth++;
      if (!card.meaning || !card.example) stats.incomplete++;
    });

    console.log('\n📊 数据质量分析:');
    console.log(`   总数: ${stats.total}`);
    console.log(`   有释义: ${stats.withMeaning} (${(stats.withMeaning/stats.total*100).toFixed(1)}%)`);
    console.log(`   有例句: ${stats.withExample} (${(stats.withExample/stats.total*100).toFixed(1)}%)`);
    console.log(`   完整: ${stats.withBoth} (${(stats.withBoth/stats.total*100).toFixed(1)}%)`);
    console.log(`   待补全: ${stats.incomplete} (${(stats.incomplete/stats.total*100).toFixed(1)}%)`);

    return stats;
  }

  /**
   * 主执行函数
   */
  async run() {
    console.log('🚀 开始执行混合优化方案\n');
    console.log('=' .repeat(60));

    this.ensureOutputDir();

    // 步骤1: 检查现有数据
    console.log('\n📂 步骤1: 检查现有数据');
    const existingData = this.checkExistingData('七下', '完整数据');

    if (existingData) {
      // 步骤2: 分析数据质量
      console.log('\n📊 步骤2: 分析数据质量');
      const stats = this.analyzeDataQuality(
        'D:\\XX\\WL\\英语项目需求文档\\教材\\提取数据\\七下英语完整数据\\data_system.json'
      );

      // 步骤3: 生成待补充列表
      if (stats.incomplete > 0) {
        console.log('\n📝 步骤3: 生成待补充列表');
        await this.completeWithAI(
          'D:\\XX\\WL\\英语项目需求文档\\教材\\提取数据\\七下英语完整数据\\data_system.json'
        );
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 第一阶段完成！');
    console.log('\n📋 下一步:');
    console.log('   1. 为七下数据补充释义和例句（使用AI批量生成）');
    console.log('   2. 提取八上/八下数据（使用DOCX格式）');
    console.log('   3. 合并所有数据到统一格式');
  }
}

// 执行
const extractor = new TextbookExtractor();
extractor.run().catch(console.error);
