/**
 * App.js - English Phrase Learning System v6.0
 * Main application entry point
 */

// Import core modules
import { storage } from './core/Storage.js';
import { eventHub, Events } from './core/EventHub.js';
import { Utils } from './core/Utils.js';

// Import data stores
import { PhraseStore, ProgressStore, UserStore, VersionStore } from './data/PhraseStore.js';

// Import algorithms
import { SuperMemo2 } from './algorithms/SuperMemo2.js';

// Import features
import { DataMigration } from './features/DataMigration.js';
import { LearningMode } from './features/LearningMode.js';
import { ReviewMode } from './features/ReviewMode.js';
import { Editor } from './features/Editor.js';

/**
 * Main Application Class
 */
class App {
    constructor() {
        this.storage = storage;
        this.phraseStore = null;
        this.progressStore = null;
        this.userStore = null;
        this.versionStore = null;
        this.currentUserId = 'default';
        this.isInitialized = false;
        this.learningMode = null;
        this.reviewMode = null;
        this.editor = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('[App] Initializing application...');

            // Initialize storage
            await this.storage.init();

            // Initialize stores
            this.phraseStore = new PhraseStore(this.storage);
            this.progressStore = new ProgressStore(this.storage);
            this.userStore = new UserStore(this.storage);
            this.versionStore = new VersionStore(this.storage);

            // Load current user
            this.currentUserId = this.storage.getLocalStorage('currentUserId', 'default');

            // Initialize DataMigration
            this.dataMigration = new DataMigration(
                this.storage,
                this.phraseStore,
                this.progressStore,
                this.userStore
            );

            // Initialize LearningMode
            this.learningMode = new LearningMode(
                this.storage,
                this.phraseStore,
                this.progressStore
            );

            // Initialize ReviewMode
            this.reviewMode = new ReviewMode(
                this.storage,
                this.phraseStore,
                this.progressStore
            );

            // Initialize Editor
            this.editor = new Editor(
                this.storage,
                this.phraseStore
            );

            // Check if data migration is needed
            await this.checkMigration();

            // Load default phrases if empty
            await this.loadDefaultPhrases();

            // Initialize UI
            this.initUI();

            // Setup event listeners
            this.setupEventListeners();

            // Emit ready event
            eventHub.emit(Events.SYSTEM_READY);
            this.isInitialized = true;

            // Hide loading screen
            this.hideLoadingScreen();

            console.log('[App] Application initialized successfully');
        } catch (error) {
            console.error('[App] Initialization error:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }

    /**
     * Check if data migration from v5 is needed
     */
    async checkMigration() {
        const hasMigrated = this.storage.getLocalStorage('v6_migrated', false);

        if (!hasMigrated) {
            const hasV5Data = this.dataMigration.needsMigration();

            if (hasV5Data) {
                console.log('[App] V5 data detected, starting migration...');
                await this.migrateFromV5();
            }

            this.storage.setLocalStorage('v6_migrated', true);
        }
    }

    /**
     * Check if v5 data exists
     */
    checkV5Data() {
        return this.dataMigration.needsMigration();
    }

    /**
     * Migrate data from v5 to v6
     */
    async migrateFromV5() {
        console.log('[App] Migrating data from v5...');

        try {
            const result = await this.dataMigration.migrate();
            console.log('[App] Migration completed:', result);

            // Show migration summary
            if (result.errors.length > 0) {
                console.warn('[App] Migration completed with errors:', result.errors);
            }
        } catch (error) {
            console.error('[App] Migration error:', error);
        }
    }

    /**
     * Load default phrases if database is empty
     */
    async loadDefaultPhrases() {
        const count = await this.storage.count('phrases');

        if (count === 0) {
            console.log('[App] No phrases found, loading defaults...');

            try {
                const response = await fetch('./data/default-phrases.json');
                const data = await response.json();

                if (data.phrases && Array.isArray(data.phrases)) {
                    await this.phraseStore.addBatch(data.phrases);
                    console.log(`[App] Loaded ${data.phrases.length} default phrases`);
                }
            } catch (error) {
                console.warn('[App] Could not load default phrases:', error);
            }
        }
    }

    /**
     * Initialize UI components
     */
    initUI() {
        // Initialize config info display
        this.updateConfigInfo();

        // Initialize dashboard
        this.updateDashboard();

        // Initialize user selector
        this.updateUserSelector();

        // Load topics for editor filter
        this.loadTopics();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // User selector
        const userSelect = document.getElementById('user-select');
        if (userSelect) {
            userSelect.addEventListener('change', (e) => {
                this.switchUser(e.target.value);
            });
        }

        // Add user button
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showModal('add-user-modal');
            });
        }

        // Add user form
        const addUserForm = document.getElementById('add-user-form');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addUser();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Import/Export button
        const importExportBtn = document.getElementById('import-export-btn');
        if (importExportBtn) {
            importExportBtn.addEventListener('click', () => {
                this.showImportExport();
            });
        }

        // Backup button
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }

        // Start learning button
        const startLearningBtn = document.getElementById('start-learning-btn');
        if (startLearningBtn) {
            startLearningBtn.addEventListener('click', () => {
                this.startLearning();
            });
        }

        // Quick action buttons
        this.setupQuickActions();

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Subscribe to system events
        eventHub.on(Events.USER_SWITCHED, () => {
            this.updateDashboard();
        });

        eventHub.on(Events.PHRASE_LEARNED, () => {
            this.updateDashboard();
        });

        eventHub.on(Events.PHRASE_REVIEWED, () => {
            this.updateDashboard();
        });
    }

    /**
     * Setup quick action buttons
     */
    setupQuickActions() {
        // Quick learn
        const quickLearnBtn = document.getElementById('quick-learn-btn');
        if (quickLearnBtn) {
            quickLearnBtn.addEventListener('click', () => {
                this.startRandomLearning();
            });
        }

        // Quick review
        const quickReviewBtn = document.getElementById('quick-review-btn');
        if (quickReviewBtn) {
            quickReviewBtn.addEventListener('click', () => {
                this.startReview();
            });
        }

        // Browse all
        const browseAllBtn = document.getElementById('browse-all-btn');
        if (browseAllBtn) {
            browseAllBtn.addEventListener('click', () => {
                this.switchTab('learning');
            });
        }

        // Import PDF
        const importPdfBtn = document.getElementById('import-pdf-btn');
        if (importPdfBtn) {
            importPdfBtn.addEventListener('click', () => {
                this.showImportPDF();
            });
        }
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
            pane.style.display = 'none';
        });

        const activePane = document.getElementById(`${tabName}-tab`);
        if (activePane) {
            activePane.classList.add('active');
            activePane.style.display = 'block';
        }

        // Emit tab change event
        eventHub.emit(Events.TAB_CHANGED, tabName);

        // Load tab-specific content
        this.loadTabContent(tabName);
    }

    /**
     * Load tab-specific content
     */
    async loadTabContent(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.updateDashboard();
                break;
            case 'learning':
                await this.loadLearningContent();
                break;
            case 'review':
                await this.loadReviewContent();
                break;
            case 'editor':
                await this.loadEditorContent();
                break;
            case 'statistics':
                await this.loadStatisticsContent();
                break;
        }
    }

    /**
     * Update dashboard
     */
    async updateDashboard() {
        try {
            // Get statistics
            const allPhrases = await this.phraseStore.getAll();
            const progressStats = await this.progressStore.getStatistics(this.currentUserId);

            // Update plan stats
            const plan = await this.getTodayPlan();
            document.getElementById('plan-time').textContent = plan.estimatedTime || '--';
            document.getElementById('plan-review').textContent = (plan.reviewCount || 0) + '个';
            document.getElementById('plan-new').textContent = (plan.newCount || 0) + '个';
            document.getElementById('plan-total').textContent = (plan.total || 0) + '个';

            // Update stats
            document.getElementById('stat-total').textContent = allPhrases.length;
            document.getElementById('stat-learned').textContent = progressStats.learning + progressStats.reviewing + progressStats.mastered;
            document.getElementById('stat-mastered').textContent = progressStats.mastered;
            document.getElementById('stat-due').textContent = progressStats.dueToday;
        } catch (error) {
            console.error('[App] Error updating dashboard:', error);
        }
    }

    /**
     * Get today's learning plan
     */
    async getTodayPlan() {
        const config = this.getUserConfig();

        const duePhrases = await this.phraseStore.getDuePhrases(this.currentUserId);
        const sorted = this.phraseStore.sortByPriority(duePhrases);
        const todayReview = sorted.slice(0, config.dailyReviewLimit);

        // Get new phrases (phrases without progress records)
        const allPhrases = await this.phraseStore.getAll();
        const allProgress = await this.progressStore.getAll(this.currentUserId);
        const learnedPhraseIds = new Set(allProgress.map(p => p.phraseId));

        const newPhrases = allPhrases.filter(p => !learnedPhraseIds.has(p.id));
        const todayNew = newPhrases.slice(0, config.dailyNewLimit);

        console.log('[App] getTodayPlan - allPhrases:', allPhrases.length);
        console.log('[App] getTodayPlan - duePhrases:', duePhrases.length);
        console.log('[App] getTodayPlan - newPhrases:', newPhrases.length);

        return {
            review: todayReview,
            new: todayNew,
            reviewCount: todayReview.length,
            newCount: todayNew.length,
            total: todayReview.length + todayNew.length,
            estimatedTime: this.estimateTime(todayReview.length, todayNew.length)
        };
    }

    /**
     * Estimate learning time
     */
    estimateTime(reviewCount, newCount) {
        const config = this.getUserConfig();
        const seconds = reviewCount * config.avgTimePerReview + newCount * config.avgTimePerNew;
        const minutes = Math.ceil(seconds / 60);

        if (minutes < 1) return '30秒内';
        if (minutes < 60) return `${minutes}分钟`;

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}小时${mins}分钟`;
    }

    /**
     * Get user configuration
     */
    getUserConfig() {
        const prefix = this.storage.getUserPrefix(this.currentUserId);
        return this.storage.getLocalStorage(prefix + 'config', {
            dailyReviewLimit: 40,
            dailyNewLimit: 20,
            avgTimePerReview: 30,
            avgTimePerNew: 60,
            scheduleStrategy: 'balanced',
            selectedPreset: 'balanced'
        });
    }

    /**
     * Update user selector
     */
    async updateUserSelector() {
        const users = await this.userStore.getAll();
        const select = document.getElementById('user-select');

        if (select) {
            select.innerHTML = users.map(user =>
                `<option value="${user.id}" ${user.id === this.currentUserId ? 'selected' : ''}>
                    ${user.name}
                </option>`
            ).join('');
        }
    }

    /**
     * Load topics
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
     * Switch user
     */
    async switchUser(userId) {
        if (userId === this.currentUserId) return;

        this.currentUserId = userId;
        this.storage.setLocalStorage('currentUserId', userId);

        await this.userStore.updateLastLogin(userId);

        eventHub.emit(Events.USER_SWITCHED, userId);
        console.log('[App] Switched to user:', userId);
    }

    /**
     * Add user
     */
    async addUser() {
        const nameInput = document.getElementById('new-user-name');
        const name = nameInput.value.trim();

        if (!name) {
            alert('请输入用户名称');
            return;
        }

        try {
            const userId = await this.userStore.create({ name });
            this.hideModal('add-user-modal');
            await this.updateUserSelector();

            // Ask if user wants to switch
            if (confirm(`用户"${name}"创建成功！是否切换到该用户？`)) {
                await this.switchUser(userId);
                document.getElementById('user-select').value = userId;
            }

            nameInput.value = '';
        } catch (error) {
            alert('创建用户失败: ' + error.message);
        }
    }

    /**
     * Show settings
     */
    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('active');
            this.initSettingsValues();
        }
    }

    /**
     * Close settings
     */
    closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Initialize settings values
     */
    initSettingsValues() {
        const config = this.getUserConfig();
        const reviewInput = document.getElementById('setting-review-limit');
        const newInput = document.getElementById('setting-new-limit');

        if (reviewInput) reviewInput.value = config.dailyReviewLimit;
        if (newInput) newInput.value = config.dailyNewLimit;

        const reviewValue = document.getElementById('setting-review-value');
        const newValue = document.getElementById('setting-new-value');

        if (reviewValue) reviewValue.textContent = config.dailyReviewLimit + '个';
        if (newValue) newValue.textContent = config.dailyNewLimit + '个';

        this.updateConfigInfo();

        // Update mode card selection
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
        if (config.selectedPreset) {
            const activeCard = document.getElementById(`mode-${config.selectedPreset}`);
            if (activeCard) {
                activeCard.classList.add('active');
            }
        }
    }

    /**
     * Select mode preset
     */
    selectModePreset(mode) {
        const presets = {
            balanced: { dailyReviewLimit: 40, dailyNewLimit: 20, dailyTime: '30-40分钟' },
            review: { dailyReviewLimit: 60, dailyNewLimit: 10, dailyTime: '35-45分钟' },
            new: { dailyReviewLimit: 20, dailyNewLimit: 40, dailyTime: '35-50分钟' }
        };

        const preset = presets[mode];
        if (!preset) return;

        const config = this.getUserConfig();
        config.dailyReviewLimit = preset.dailyReviewLimit;
        config.dailyNewLimit = preset.dailyNewLimit;
        config.scheduleStrategy = mode;
        config.selectedPreset = mode;

        const reviewInput = document.getElementById('setting-review-limit');
        const newInput = document.getElementById('setting-new-limit');

        if (reviewInput) reviewInput.value = preset.dailyReviewLimit;
        if (newInput) newInput.value = preset.dailyNewLimit;

        const reviewValue = document.getElementById('setting-review-value');
        const newValue = document.getElementById('setting-new-value');

        if (reviewValue) reviewValue.textContent = preset.dailyReviewLimit + '个';
        if (newValue) newValue.textContent = preset.dailyNewLimit + '个';

        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
        const activeCard = document.getElementById(`mode-${mode}`);
        if (activeCard) {
            activeCard.classList.add('active');
        }

        this.updateConfigInfo();
    }

    /**
     * Update setting value display
     */
    updateSettingValue(type, value) {
        if (type === 'review') {
            const reviewValue = document.getElementById('setting-review-value');
            if (reviewValue) reviewValue.textContent = value + '个';
        } else if (type === 'new') {
            const newValue = document.getElementById('setting-new-value');
            if (newValue) newValue.textContent = value + '个';
        }

        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
    }

    /**
     * Update config info display
     */
    updateConfigInfo() {
        const config = this.getUserConfig();
        const review = config.dailyReviewLimit;
        const newCount = config.dailyNewLimit;
        const total = review + newCount;

        let timeText = '30-40分钟';
        if (config.selectedPreset) {
            const presets = {
                balanced: '30-40分钟',
                review: '35-45分钟',
                new: '35-50分钟'
            };
            timeText = presets[config.selectedPreset] || '30-40分钟';
        }

        const infoReview = document.getElementById('info-review');
        const infoNew = document.getElementById('info-new');
        const infoTotal = document.getElementById('info-total');
        const infoTime = document.getElementById('info-time');

        if (infoReview) infoReview.textContent = review + '个';
        if (infoNew) infoNew.textContent = newCount + '个';
        if (infoTotal) infoTotal.textContent = total + '个';
        if (infoTime) infoTime.textContent = timeText;
    }

    /**
     * Save settings
     */
    saveSettings() {
        const config = this.getUserConfig();

        const reviewInput = document.getElementById('setting-review-limit');
        const newInput = document.getElementById('setting-new-limit');

        if (reviewInput) config.dailyReviewLimit = parseInt(reviewInput.value);
        if (newInput) config.dailyNewLimit = parseInt(newInput.value);

        const prefix = this.storage.getUserPrefix(this.currentUserId);
        this.storage.setLocalStorage(prefix + 'config', config);

        this.updateConfigInfo();
        this.updateDashboard();
        this.closeSettings();

        console.log('[App] Settings saved:', config);
    }

    /**
     * Show import/export dialog
     */
    showImportExport() {
        // TODO: Implement import/export modal
        console.log('[App] Show import/export');
    }

    /**
     * Create backup
     */
    async createBackup() {
        try {
            const data = await this.storage.exportAll();
            const filename = `backup_${Utils.formatDate(Date.now(), 'YYYYMMDD_HHmmss')}.json`;
            Utils.downloadJSON(data, filename);
            alert('备份已创建！');
        } catch (error) {
            alert('创建备份失败: ' + error.message);
        }
    }

    /**
     * Start learning
     */
    async startLearning() {
        console.log('[App] Starting today\'s learning...');
        const plan = await this.getTodayPlan();

        console.log('[App] Today\'s plan:', plan);

        if (plan.total === 0) {
            alert('今天没有需要学习的内容！');
            return;
        }

        // Show learning modal
        await this.showLearningModal([...plan.review, ...plan.new]);
    }

    /**
     * Start random learning
     */
    async startRandomLearning() {
        const allPhrases = await this.phraseStore.getAll();
        const randomPhrase = allPhrases[Math.floor(Math.random() * allPhrases.length)];

        if (randomPhrase) {
            await this.showLearningModal([randomPhrase]);
        }
    }

    /**
     * Start review
     */
    async startReview() {
        const duePhrases = await this.phraseStore.getDuePhrases(this.currentUserId);

        if (duePhrases.length === 0) {
            alert('太棒了！没有需要复习的内容。');
            return;
        }

        await this.showReviewModal(duePhrases.slice(0, 50));
    }

    /**
     * Show review modal
     */
    async showReviewModal(phrases) {
        await this.reviewMode.start(phrases, this.currentUserId);
    }

    /**
     * Show learning modal
     */
    async showLearningModal(phrases) {
        await this.learningMode.start(phrases, this.currentUserId);
    }

    /**
     * Speak text using Text-to-Speech
     * @param {string} text - Text to speak
     * @param {string} lang - Language code (default: 'en-US')
     */
    speakPhrase(text, lang = 'en-US') {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            // Try to get a good English voice
            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported');
        }
    }

    /**
     * Load learning content
     */
    async loadLearningContent() {
        const container = document.getElementById('learning-container');
        if (container) {
            // Get phrases to learn (new phrases not yet learned)
            const allPhrases = await this.phraseStore.getAll();
            const allProgress = await this.progressStore.getAll(this.currentUserId);
            const learnedPhraseIds = new Set(allProgress.map(p => p.phraseId));

            // New phrases - no progress record
            const newPhrases = allPhrases.filter(p => !learnedPhraseIds.has(p.id));

            // In progress phrases
            const inProgressPhrases = allProgress.filter(p => p.status === 'learning' || p.status === 'reviewing');
            const learningPhrases = [];

            for (const progress of inProgressPhrases) {
                const phrase = await this.phraseStore.get(progress.phraseId);
                if (phrase) {
                    learningPhrases.push({ ...phrase, progress });
                }
            }

            container.innerHTML = `
                <div class="learning-content">
                    <div class="learning-header">
                        <h2>📚 学习中心</h2>
                        <p class="subtitle">选择一个学习模式开始</p>
                    </div>

                    <div class="learning-cards">
                        <div class="learning-card" data-mode="new">
                            <div class="card-icon">🆕</div>
                            <h3>学习新语块</h3>
                            <p class="card-description">开始学习新的语块，扩展你的词汇量</p>
                            <div class="card-stats">
                                <span class="stat">待学习: ${newPhrases.length} 个</span>
                            </div>
                            <button class="btn-primary" id="learn-new-btn" ${newPhrases.length === 0 ? 'disabled' : ''}>
                                开始学习
                            </button>
                        </div>

                        <div class="learning-card" data-mode="continue">
                            <div class="card-icon">📖</div>
                            <h3>继续学习</h3>
                            <p class="card-description">继续学习正在进行的语块</p>
                            <div class="card-stats">
                                <span class="stat">学习中: ${learningPhrases.length} 个</span>
                            </div>
                            <button class="btn-primary" id="continue-learning-btn" ${learningPhrases.length === 0 ? 'disabled' : ''}>
                                继续学习
                            </button>
                        </div>

                        <div class="learning-card" data-mode="random">
                            <div class="card-icon">🎲</div>
                            <h3>随机学习</h3>
                            <p class="card-description">随机选择一个语块进行学习</p>
                            <div class="card-stats">
                                <span class="stat">总语块数: ${await this.phraseStore.count()}</span>
                            </div>
                            <button class="btn-primary" id="random-learn-btn">
                                随机学习
                            </button>
                        </div>
                    </div>

                    <div class="learning-tips">
                        <h4>💡 学习提示</h4>
                        <ul>
                            <li>建议每天学习 10-20 个新语块</li>
                            <li>使用 <kbd>空格</kbd> 或 <kbd>回车</kbd> 显示答案</li>
                            <li>使用 <kbd>1-5</kbd> 数字键快速评分</li>
                            <li>诚实评分有助于系统更好地安排复习</li>
                        </ul>
                    </div>
                </div>
            `;

            // Attach event listeners
            const learnNewBtn = document.getElementById('learn-new-btn');
            if (learnNewBtn && newPhrases.length > 0) {
                learnNewBtn.addEventListener('click', () => {
                    const config = this.getUserConfig();
                    this.showLearningModal(newPhrases.slice(0, config.dailyNewLimit));
                });
            }

            const continueBtn = document.getElementById('continue-learning-btn');
            if (continueBtn && learningPhrases.length > 0) {
                continueBtn.addEventListener('click', () => {
                    this.showLearningModal(learningPhrases.slice(0, 20));
                });
            }

            const randomBtn = document.getElementById('random-learn-btn');
            if (randomBtn) {
                randomBtn.addEventListener('click', () => this.startRandomLearning());
            }
        }
    }

    /**
     * Load review content
     */
    async loadReviewContent() {
        const container = document.getElementById('review-container');
        if (container) {
            const duePhrases = await this.phraseStore.getDuePhrases(this.currentUserId);
            const progressStats = await this.progressStore.getStatistics(this.currentUserId);

            // Sort by priority
            const sortedDue = this.phraseStore.sortByPriority(duePhrases);

            container.innerHTML = `
                <div class="review-content">
                    <div class="review-header">
                        <h2>🔄 复习中心</h2>
                        <p class="subtitle">复习到期的语块，巩固记忆</p>
                    </div>

                    <div class="review-summary-cards">
                        <div class="summary-card due">
                            <div class="card-icon">⏰</div>
                            <div class="card-value">${progressStats.dueToday}</div>
                            <div class="card-label">待复习</div>
                        </div>
                        <div class="summary-card learning">
                            <div class="card-icon">📚</div>
                            <div class="card-value">${progressStats.learning}</div>
                            <div class="card-label">学习中</div>
                        </div>
                        <div class="summary-card reviewing">
                            <div class="card-icon">🔄</div>
                            <div class="card-value">${progressStats.reviewing}</div>
                            <div class="card-label">复习中</div>
                        </div>
                        <div class="summary-card mastered">
                            <div class="card-icon">⭐</div>
                            <div class="card-value">${progressStats.mastered}</div>
                            <div class="card-label">已掌握</div>
                        </div>
                    </div>

                    ${duePhrases.length > 0 ? `
                        <div class="review-action-section">
                            <div class="review-alert">
                                <span class="alert-icon">📢</span>
                                <span class="alert-text">有 <strong>${duePhrases.length}</strong> 个语块需要复习</span>
                            </div>
                            <button class="btn-primary btn-large" id="start-review-btn">
                                🚀 开始复习 (${duePhrases.length} 个)
                            </button>
                        </div>

                        <div class="review-list">
                            <h3>待复习列表</h3>
                            <div class="phrase-list">
                                ${sortedDue.slice(0, 10).map(item => {
                                    const phrase = item;
                                    const progress = item.progress || {};
                                    const timeUntil = SuperMemo2.getTimeUntilReview(progress.nextReview);
                                    return `
                                        <div class="phrase-list-item">
                                            <div class="phrase-info">
                                                <span class="phrase-text">${phrase.phrase}</span>
                                                <span class="phrase-meaning">${phrase.meaning}</span>
                                            </div>
                                            <div class="phrase-meta">
                                                <span class="review-count">${progress.repetitions || 0}次</span>
                                                ${timeUntil.isDue ?
                                                    '<span class="due-badge">到期</span>' :
                                                    `<span class="next-review">${SuperMemo2.formatReviewTime(progress.nextReview)}</span>`
                                                }
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                                ${duePhrases.length > 10 ? `
                                    <div class="more-items">
                                        还有 ${duePhrases.length - 10} 个语块...
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="review-empty">
                            <div class="empty-icon">🎉</div>
                            <h3>太棒了！</h3>
                            <p>暂时没有需要复习的内容</p>
                            <p class="empty-hint">当有语块到期复习时，会在这里显示</p>
                        </div>
                    `}

                    <div class="review-tips">
                        <h4>💡 复习提示</h4>
                        <ul>
                            <li>按时复习能有效巩固长期记忆</li>
                            <li>评分标准：5=完美, 4=良好, 3=勉强, 2=困难, 1=忘记</li>
                            <li>系统会根据你的评分自动调整下次复习时间</li>
                            <li>连续5次评分4+的语块会被标记为"已掌握"</li>
                        </ul>
                    </div>
                </div>
            `;

            // Attach event listeners
            const startReviewBtn = document.getElementById('start-review-btn');
            if (startReviewBtn) {
                startReviewBtn.addEventListener('click', () => {
                    this.showReviewModal(sortedDue.slice(0, 50));
                });
            }
        }
    }

    /**
     * Load editor content
     */
    async loadEditorContent() {
        // Initialize editor if needed
        if (this.editor) {
            await this.editor.init();
        }
    }

    /**
     * Load statistics content
     */
    async loadStatisticsContent() {
        const container = document.getElementById('statistics-content');
        if (container) {
            // TODO: Implement statistics interface
            container.innerHTML = '<p>统计功能开发中...</p>';
        }
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            eventHub.emit(Events.MODAL_OPENED, modalId);
        }
    }

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            eventHub.emit(Events.MODAL_CLOSED, modalId);
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');

        if (loadingScreen && app) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';

            setTimeout(() => {
                loadingScreen.style.display = 'none';
                app.style.display = 'flex';
            }, 500);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <h2>出错了</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;
        }
    }
}

// Create and initialize app
const app = new App();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for global access
window.app = app;
