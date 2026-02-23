/**
 * ImportExport.js - Import/Export Feature
 * 导入导出功能模块
 */

class ImportExport {
    constructor(storage, phraseStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
    }

    /**
     * 导出为JSON
     */
    async exportJSON() {
        try {
            const phrases = await this.phraseStore.getAll();
            const data = {
                version: '6.0',
                exportedAt: Date.now(),
                count: phrases.length,
                phrases: phrases
            };

            const filename = `phrases_${Utils.formatDate(Date.now(), 'YYYYMMDD_HHmmss')}.json`;
            Utils.downloadJSON(data, filename);

            return { success: true, count: phrases.length };
        } catch (error) {
            console.error('Export error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 导出为CSV
     */
    async exportCSV() {
        try {
            const phrases = await this.phraseStore.getAll();

            if (phrases.length === 0) {
                return { success: false, error: '没有数据可导出' };
            }

            const headers = ['id', 'phrase', 'meaning', 'example', 'keywords', 'level', 'frequency', 'topic'];
            const rows = phrases.map(p => [
                p.id,
                `"${p.phrase.replace(/"/g, '""')}"`,
                `"${p.meaning.replace(/"/g, '""')}"`,
                `"${p.example.replace(/"/g, '""')}"`,
                `"${p.keywords.join(', ')}"`,
                p.level,
                p.frequency,
                `"${p.topic}"`
            ]);

            const csv = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            // 添加BOM以支持Excel
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `phrases_${Utils.formatDate(Date.now(), 'YYYYMMDD_HHmmss')}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            return { success: true, count: phrases.length };
        } catch (error) {
            console.error('Export CSV error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 导入JSON
     */
    async importJSON(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // 验证数据格式
                    if (!data.phrases || !Array.isArray(data.phrases)) {
                        resolve({ success: false, error: '无效的数据格式' });
                        return;
                    }

                    // 验证语块
                    const validPhrases = [];
                    const errors = [];

                    for (let i = 0; i < data.phrases.length; i++) {
                        const phrase = data.phrases[i];

                        if (!phrase.phrase || !phrase.meaning || !phrase.example) {
                            errors.push(`第${i + 1}条: 缺少必填字段`);
                            continue;
                        }

                        validPhrases.push({
                            ...phrase,
                            id: phrase.id || Date.now() + i
                        });
                    }

                    if (validPhrases.length === 0) {
                        resolve({ success: false, error: '没有有效的语块数据', errors });
                        return;
                    }

                    // 批量添加
                    for (const phrase of validPhrases) {
                        await this.phraseStore.add(phrase);
                    }

                    resolve({
                        success: true,
                        imported: validPhrases.length,
                        total: data.phrases.length,
                        errors: errors.length > 0 ? errors : undefined
                    });
                } catch (error) {
                    resolve({ success: false, error: '解析失败: ' + error.message });
                }
            };

            reader.onerror = () => {
                resolve({ success: false, error: '文件读取失败' });
            };

            reader.readAsText(file);
        });
    }

    /**
     * 导入CSV
     */
    async importCSV(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n');

                    if (lines.length < 2) {
                        resolve({ success: false, error: 'CSV文件为空' });
                        return;
                    }

                    // 跳过标题行
                    const phrases = [];
                    const errors = [];

                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;

                        // 简单CSV解析（实际应用中应使用更健壮的解析器）
                        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                        if (!parts || parts.length < 4) {
                            errors.push(`第${i + 1}行: 格式错误`);
                            continue;
                        }

                        const phrase = {
                            phrase: parts[1]?.replace(/"/g, '')?.trim(),
                            meaning: parts[2]?.replace(/"/g, '')?.trim(),
                            example: parts[3]?.replace(/"/g, '')?.trim(),
                            keywords: parts[4]?.replace(/"/g, '')?.split(',').map(k => k.trim()).filter(k => k) || [],
                            level: parts[5]?.replace(/"/g, '')?.trim() || '核心词汇',
                            frequency: parts[6]?.replace(/"/g, '')?.trim() || '中频',
                            topic: parts[7]?.replace(/"/g, '')?.trim() || '其他'
                        };

                        if (!phrase.phrase || !phrase.meaning || !phrase.example) {
                            errors.push(`第${i + 1}行: 缺少必填字段`);
                            continue;
                        }

                        phrases.push({
                            ...phrase,
                            id: Date.now() + i
                        });
                    }

                    if (phrases.length === 0) {
                        resolve({ success: false, error: '没有有效的语块数据', errors });
                        return;
                    }

                    // 批量添加
                    for (const phrase of phrases) {
                        await this.phraseStore.add(phrase);
                    }

                    resolve({
                        success: true,
                        imported: phrases.length,
                        errors: errors.length > 0 ? errors : undefined
                    });
                } catch (error) {
                    resolve({ success: false, error: '解析失败: ' + error.message });
                }
            };

            reader.onerror = () => {
                resolve({ success: false, error: '文件读取失败' });
            };

            reader.readAsText(file);
        });
    }

    /**
     * 显示导入导出对话框
     */
    showDialog() {
        const modalHTML = `
            <div id="import-export-modal" class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📦 导入/导出</h2>
                        <button class="modal-close" onclick="window.app.importExport.closeDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- 导出部分 -->
                        <div class="card" style="margin-bottom: 20px;">
                            <div class="card-header">
                                <h3>📤 导出数据</h3>
                            </div>
                            <div class="form-actions">
                                <button class="btn-primary" onclick="window.app.importExport.handleExport('json')">
                                    导出为JSON
                                </button>
                                <button class="btn-secondary" onclick="window.app.importExport.handleExport('csv')">
                                    导出为CSV
                                </button>
                            </div>
                        </div>

                        <!-- 导入部分 -->
                        <div class="card">
                            <div class="card-header">
                                <h3>📥 导入数据</h3>
                            </div>
                            <div class="form-group">
                                <label for="import-file">选择文件</label>
                                <input type="file" id="import-file" accept=".json,.csv">
                            </div>
                            <div class="form-group">
                                <label for="import-mode">导入模式</label>
                                <select id="import-mode">
                                    <option value="append">追加 - 保留现有数据，添加新数据</option>
                                    <option value="replace">替换 - 清空现有数据，使用新数据</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button class="btn-primary" onclick="window.app.importExport.handleImport()">
                                    导入
                                </button>
                            </div>
                            <div id="import-result" style="margin-top: 15px;"></div>
                        </div>

                        <!-- 备份恢复 -->
                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <h3>💾 数据备份</h3>
                            </div>
                            <div class="form-actions">
                                <button class="btn-secondary" onclick="window.app.importExport.backupData()">
                                    创建完整备份
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除现有模态框
        let modal = document.getElementById('import-export-modal');
        if (modal) modal.remove();

        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * 关闭对话框
     */
    closeDialog() {
        const modal = document.getElementById('import-export-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 处理导出
     */
    async handleExport(format) {
        let result;

        if (format === 'json') {
            result = await this.exportJSON();
        } else if (format === 'csv') {
            result = await this.exportCSV();
        }

        if (result.success) {
            alert(`导出成功！共导出 ${result.count} 条数据`);
        } else {
            alert('导出失败: ' + result.error);
        }
    }

    /**
     * 处理导入
     */
    async handleImport() {
        const fileInput = document.getElementById('import-file');
        const mode = document.getElementById('import-mode').value;
        const resultDiv = document.getElementById('import-result');

        if (!fileInput.files || fileInput.files.length === 0) {
            resultDiv.innerHTML = '<p style="color: #f44336;">请选择文件</p>';
            return;
        }

        const file = fileInput.files[0];
        const extension = file.name.split('.').pop().toLowerCase();

        // 如果是替换模式，先清空
        if (mode === 'replace') {
            if (!confirm('替换模式将清空现有数据，确定继续吗？')) {
                return;
            }
            await this.phraseStore.clear();
        }

        let result;

        if (extension === 'json') {
            result = await this.importJSON(file);
        } else if (extension === 'csv') {
            result = await this.importCSV(file);
        } else {
            resultDiv.innerHTML = '<p style="color: #f44336;">不支持的文件格式，请使用JSON或CSV文件</p>';
            return;
        }

        // 显示结果
        if (result.success) {
            let message = `<p style="color: #4caf50;">✅ 导入成功！</p>`;
            message += `<p>已导入: ${result.imported} 条数据</p>`;

            if (result.errors && result.errors.length > 0) {
                message += `<p style="color: #ff9800;">⚠️ 部分数据未导入:</p>`;
                message += `<ul style="max-height: 100px; overflow-y: auto;">`;
                result.errors.slice(0, 10).forEach(err => {
                    message += `<li>${err}</li>`;
                });
                if (result.errors.length > 10) {
                    message += `<li>...还有 ${result.errors.length - 10} 条错误</li>`;
                }
                message += `</ul>`;
            }

            resultDiv.innerHTML = message;

            // 刷新界面
            if (window.app) {
                window.app.updateDashboard();
            }
        } else {
            resultDiv.innerHTML = `<p style="color: #f44336;">❌ 导入失败: ${result.error}</p>`;
        }
    }

    /**
     * 备份数据
     */
    async backupData() {
        try {
            const data = await this.storage.exportAll();
            const filename = `backup_${Utils.formatDate(Date.now(), 'YYYYMMDD_HHmmss')}.json`;
            Utils.downloadJSON(data, filename);
            alert('备份已创建！');
        } catch (error) {
            alert('备份失败: ' + error.message);
        }
    }
}
