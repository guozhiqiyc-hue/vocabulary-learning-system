/**
 * Data Converter - 转换教材数据格式为系统格式
 */

// 将七上_system.json格式转换为系统格式
function convertTextbookDataToSystemFormat(textbookData) {
    const convertedPhrases = [];

    if (!textbookData.cards || !Array.isArray(textbookData.cards)) {
        return { success: false, error: '无效的数据格式' };
    }

    for (const card of textbookData.cards) {
        // 跳过没有phrase或phrase为空的卡片
        if (!card.phrase || card.phrase.trim() === '') {
            continue;
        }

        const phrase = {
            phrase: card.phrase.trim(),
            meaning: card.meaning && card.meaning.trim() !== ''
                ? card.meaning.trim()
                : card.phrase + '的释义', // 如果没有释义，使用默认
            example: card.example && card.example.trim() !== ''
                ? card.example.trim()
                : 'Example for: ' + card.phrase, // 如果没有例句，生成默认例句
            keywords: card.keywords && Array.isArray(card.keywords) ? card.keywords : [],
            level: card.level || '核心词汇',
            frequency: '高频', // 默认高频
            topic: extractTopic(card.unit || '', card.type || 'phrase')
        };

        // 清理短语中的换行符和多余空格
        phrase.phrase = phrase.phrase.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
        phrase.example = phrase.example.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();

        convertedPhrases.push(phrase);
    }

    return {
        success: true,
        source: textbookData.source,
        total: textbookData.total,
        imported: convertedPhrases.length,
        phrases: convertedPhrases
    };
}

// 从单元标题提取主题
function extractTopic(unitTitle, type) {
    if (!unitTitle) return '其他';

    // 提取Unit编号
    const unitMatch = unitTitle.match(/Unit (\d+)/);
    if (unitMatch) {
        const unitNum = unitMatch[1];
        const unitTopics = {
            '1': '新学校新朋友',
            '2': '兴趣爱好',
            '3': '学校生活',
            '4': '日常活动',
            '5': '特殊日子',
            '6': '食物与健康',
            '7': '购物',
            '8': '自然世界'
        };
        return unitTopics[unitNum] || `Unit ${unitNum}`;
    }

    // 根据类型返回主题
    if (type === 'word') {
        return '词汇';
    } else if (type === 'phrase') {
        return '语块';
    }

    return '其他';
}

// 批量导入教材数据
async function importTextbookData(system, phraseStore, fileData) {
    try {
        const data = JSON.parse(fileData);
        const conversionResult = convertTextbookDataToSystemFormat(data);

        if (!conversionResult.success) {
            return {
                success: false,
                error: conversionResult.error
            };
        }

        // 批量添加到数据库
        let addedCount = 0;
        const errors = [];

        for (const phrase of conversionResult.phrases) {
            try {
                // 检查是否已存在相同的phrase
                const existing = await phraseStore.getByPhrase(phrase.phrase);
                if (!existing) {
                    await phraseStore.add(phrase);
                    addedCount++;
                }
            } catch (error) {
                errors.push({
                    phrase: phrase.phrase,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            source: conversionResult.source,
            total: conversionResult.total,
            converted: conversionResult.imported,
            added: addedCount,
            skipped: conversionResult.imported - addedCount,
            errors: errors.length > 0 ? errors : undefined
        };

    } catch (error) {
        return {
            success: false,
            error: '解析失败: ' + error.message
        };
    }
}

// 导出到HTML用于预览
function previewImport(conversionResult) {
    if (!conversionResult.success) {
        return `<div class="error">${conversionResult.error}</div>`;
    }

    let html = `
        <div class="import-preview">
            <h3>导入预览</h3>
            <div class="preview-stats">
                <p><strong>数据源:</strong> ${conversionResult.source}</p>
                <p><strong>原始数量:</strong> ${conversionResult.total}</p>
                <p><strong>可导入:</strong> ${conversionResult.imported}</p>
            </div>
            <div class="preview-list">
                <h4>前10条预览:</h4>
    `;

    const previewPhrases = conversionResult.phrases.slice(0, 10);
    previewPhrases.forEach((phrase, index) => {
        html += `
            <div class="preview-item">
                <div class="preview-number">${index + 1}</div>
                <div class="preview-content">
                    <div class="preview-phrase"><strong>${escapeHTML(phrase.phrase)}</strong></div>
                    <div class="preview-meaning">${escapeHTML(phrase.meaning)}</div>
                    <div class="preview-meta">
                        <span class="tag">${phrase.level}</span>
                        <span class="tag">${phrase.topic}</span>
                        <span class="tag">${phrase.keywords.join(', ')}</span>
                    </div>
                </div>
            </div>
        `;
    });

    if (conversionResult.imported > 10) {
        html += `<p style="text-align:center;color:#666;">... 还有 ${conversionResult.imported - 10} 条数据</p>`;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 导出到文件供下载
function exportConvertedData(conversionResult) {
    const data = {
        version: '6.0',
        source: conversionResult.source,
        exportedAt: Date.now(),
        count: conversionResult.imported,
        phrases: conversionResult.phrases
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${conversionResult.source.replace('.pdf', '')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
