/**
 * Editor.js - Phrase Editor Feature
 * 语块编辑器功能模块
 */

class Editor {
    constructor(storage, phraseStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
        this.currentPhrases = [];
        this.selectedPhraseId = null;
        this.filter = {
            search: '',
            level: '',
            topic: ''
        };
    }

    /**
     * 初始化编辑器
     */
    async init() {
        await this.loadPhrases();
        await this.loadTopics();
        this.render();
        this.setupEventListeners();
    }

    /**
     * 加载语块列表
     */
    async loadPhrases() {
        let phrases = await this.phraseStore.getAll();

        // 应用过滤
        if (this.filter.search) {
            const search = this.filter.search.toLowerCase();
            phrases = phrases.filter(p =>
                p.phrase.toLowerCase().includes(search) ||
                p.meaning.toLowerCase().includes(search) ||
                p.keywords.some(k => k.toLowerCase().includes(search))
            );
        }

        if (this.filter.level) {
            phrases = phrases.filter(p => p.level === this.filter.level);
        }

        if (this.filter.topic) {
            phrases = phrases.filter(p => p.topic === this.filter.topic);
        }

        this.currentPhrases = phrases;
    }

    /**
     * 加载主题列表
     */
    async loadTopics() {
        const topics = await this.phraseStore.getTopics();
        const select = document.getElementById('editor-topic-filter');

        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">全部主题</option>' +
                topics.map(topic => `<option value="${topic}">${topic}</option>`).join('');
            select.value = currentValue;
        }
    }

    /**
     * 渲染编辑器
     */
    render() {
        const container = document.getElementById('editor-content');
        if (!container) return;

        if (this.currentPhrases.length === 0) {
            container.innerHTML = `
                <div class="editor-empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>暂无语块</h3>
                    <p>点击"添加语块"开始添加</p>
                    <button class="btn-primary" onclick="window.app.editor.showAddForm()" style="margin-top: 20px;">
                        ➕ 添加语块
                    </button>
                </div>
            `;
            return;
        }

        const itemsHTML = this.currentPhrases.map(phrase => `
            <div class="phrase-item ${this.selectedPhraseId === phrase.id ? 'selected' : ''}"
                 data-id="${phrase.id}" onclick="window.app.editor.selectPhrase(${phrase.id})">
                <div class="phrase-item-header">
                    <div class="phrase-item-content">
                        <div class="phrase-item-text">${this.escapeHTML(phrase.phrase)}</div>
                        <div class="phrase-item-meaning">${this.escapeHTML(phrase.meaning)}</div>
                        <div class="phrase-item-example">${this.escapeHTML(phrase.example).replace(/\*\*/g, '')}</div>
                        <div class="tags">
                            <span class="tag level ${phrase.level === '进阶词汇' ? 'level-进阶' : ''}">${phrase.level}</span>
                            <span class="tag topic">${phrase.topic}</span>
                            <span class="tag frequency">${phrase.frequency}</span>
                        </div>
                    </div>
                    <div class="phrase-item-actions">
                        <button class="icon-btn-small" onclick="event.stopPropagation(); window.app.editor.editPhrase(${phrase.id})" title="编辑">
                            ✏️
                        </button>
                        <button class="icon-btn-small danger" onclick="event.stopPropagation(); window.app.editor.deletePhrase(${phrase.id})" title="删除">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="editor-list">
                ${itemsHTML}
            </div>
        `;
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 搜索框
        const searchInput = document.getElementById('editor-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filter.search = e.target.value;
                this.loadPhrases();
                this.render();
            }, 300));
        }

        // 等级筛选
        const levelFilter = document.getElementById('editor-level-filter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.filter.level = e.target.value;
                this.loadPhrases();
                this.render();
            });
        }

        // 主题筛选
        const topicFilter = document.getElementById('editor-topic-filter');
        if (topicFilter) {
            topicFilter.addEventListener('change', (e) => {
                this.filter.topic = e.target.value;
                this.loadPhrases();
                this.render();
            });
        }

        // 添加按钮
        const addBtn = document.getElementById('add-phrase-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddForm());
        }
    }

    /**
     * 选中语块
     */
    selectPhrase(id) {
        this.selectedPhraseId = id;
        this.render();
    }

    /**
     * 显示添加表单
     */
    showAddForm() {
        this.showModal('add');
    }

    /**
     * 编辑语块
     */
    async editPhrase(id) {
        const phrase = await this.phraseStore.get(id);
        if (!phrase) {
            alert('语块不存在');
            return;
        }
        this.showModal('edit', phrase);
    }

    /**
     * 删除语块
     */
    async deletePhrase(id) {
        if (!confirm('确定要删除这个语块吗？')) {
            return;
        }

        try {
            await this.phraseStore.delete(id);
            await this.loadPhrases();
            this.render();
            await this.loadTopics();
            alert('删除成功');
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }

    /**
     * 显示模态框
     */
    showModal(mode, phrase = null) {
        const isEdit = mode === 'edit';
        const title = isEdit ? '编辑语块' : '添加语块';

        const modalHTML = `
            <div id="editor-modal" class="modal active">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="window.app.editor.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="phrase-form">
                            <div class="form-group">
                                <label for="edit-phrase">语块 *</label>
                                <input type="text" id="edit-phrase" required
                                       value="${isEdit ? this.escapeHTML(phrase.phrase) : ''}"
                                       placeholder="例如: be good at doing">
                            </div>

                            <div class="form-group">
                                <label for="edit-meaning">释义 *</label>
                                <input type="text" id="edit-meaning" required
                                       value="${isEdit ? this.escapeHTML(phrase.meaning) : ''}"
                                       placeholder="例如: 擅长做某事">
                            </div>

                            <div class="form-group">
                                <label for="edit-example">例句 *</label>
                                <textarea id="edit-example" required rows="3"
                                          placeholder="例如: He is good at playing basketball.">${isEdit ? this.escapeHTML(phrase.example) : ''}</textarea>
                                <small style="color: #666;">用 ** 包裹关键词，如: He is **good at** playing.</small>
                            </div>

                            <div class="form-group">
                                <label for="edit-keywords">关键词 *</label>
                                <input type="text" id="edit-keywords" required
                                       value="${isEdit ? phrase.keywords.join(', ') : ''}"
                                       placeholder="例如: good, play (用逗号分隔)">
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-level">等级</label>
                                    <select id="edit-level">
                                        <option value="核心词汇" ${isEdit && phrase.level === '核心词汇' ? 'selected' : ''}>核心词汇</option>
                                        <option value="进阶词汇" ${isEdit && phrase.level === '进阶词汇' ? 'selected' : ''}>进阶词汇</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="edit-frequency">频率</label>
                                    <select id="edit-frequency">
                                        <option value="高频" ${isEdit && phrase.frequency === '高频' ? 'selected' : ''}>高频</option>
                                        <option value="中频" ${isEdit && phrase.frequency === '中频' ? 'selected' : ''}>中频</option>
                                        <option value="低频" ${isEdit && phrase.frequency === '低频' ? 'selected' : ''}>低频</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="edit-topic">主题</label>
                                <input type="text" id="edit-topic" list="topics-list"
                                       value="${isEdit ? this.escapeHTML(phrase.topic) : ''}"
                                       placeholder="例如: 能力描述">
                                <datalist id="topics-list">
                                    <option value="能力描述">
                                    <option value="兴趣表达">
                                    <option value="情感表达">
                                    <option value="习惯表达">
                                    <option value="行动建议">
                                </datalist>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    ${isEdit ? '保存' : '添加'}
                                </button>
                                <button type="button" class="btn-secondary" onclick="window.app.editor.closeModal()">
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // 添加模态框到页面
        let modal = document.getElementById('editor-modal');
        if (modal) {
            modal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 设置表单提交
        const form = document.getElementById('phrase-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePhrase(isEdit ? phrase.id : null);
        });
    }

    /**
     * 保存语块
     */
    async savePhrase(id) {
        const phrase = {
            phrase: document.getElementById('edit-phrase').value.trim(),
            meaning: document.getElementById('edit-meaning').value.trim(),
            example: document.getElementById('edit-example').value.trim(),
            keywords: document.getElementById('edit-keywords').value.split(',').map(k => k.trim()).filter(k => k),
            level: document.getElementById('edit-level').value,
            frequency: document.getElementById('edit-frequency').value,
            topic: document.getElementById('edit-topic').value.trim() || '其他'
        };

        // 验证
        if (!phrase.phrase || !phrase.meaning || !phrase.example) {
            alert('请填写所有必填字段');
            return;
        }

        if (phrase.keywords.length === 0) {
            alert('请至少添加一个关键词');
            return;
        }

        try {
            if (id) {
                // 更新
                await this.phraseStore.update(id, phrase);
                alert('更新成功');
            } else {
                // 添加
                await this.phraseStore.add(phrase);
                alert('添加成功');
            }

            this.closeModal();
            await this.loadPhrases();
            await this.loadTopics();
            this.render();

            // 更新仪表盘
            if (window.app) {
                window.app.updateDashboard();
            }
        } catch (error) {
            alert('保存失败: ' + error.message);
        }
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('editor-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * HTML转义
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
