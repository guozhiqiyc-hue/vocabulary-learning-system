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

        const newPhrases = await this.phraseStore.getByStatus('new');
        const todayNew = newPhrases.slice(0, config.dailyNewLimit);

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
            scheduleStrategy: 'balanced'
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
        // TODO: Implement settings modal
        console.log('[App] Show settings');
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
        const plan = await this.getTodayPlan();

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

        await this.showLearningModal(duePhrases.slice(0, 20));
    }

    /**
     * Show learning modal
     */
    async showLearningModal(phrases) {
        await this.learningMode.start(phrases, this.currentUserId);
    }

    /**
     * Load learning content
     */
    async loadLearningContent() {
        const container = document.getElementById('learning-container');
        if (container) {
            // TODO: Implement learning interface
            container.innerHTML = '<p>学习功能开发中...</p>';
        }
    }

    /**
     * Load review content
     */
    async loadReviewContent() {
        const container = document.getElementById('review-container');
        if (container) {
            // TODO: Implement review interface
            container.innerHTML = '<p>复习功能开发中...</p>';
        }
    }

    /**
     * Load editor content
     */
    async loadEditorContent() {
        const container = document.getElementById('editor-content');
        if (container) {
            // TODO: Implement editor interface
            container.innerHTML = '<p>编辑器功能开发中...</p>';
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
