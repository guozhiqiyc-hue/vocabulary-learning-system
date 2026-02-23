/**
 * English Phrase Learning System v6.0 - Bundled Version
 * 单文件版本，支持直接打开使用
 */

// ========== Core: Storage.js ==========
class Storage {
    constructor() {
        this.dbName = 'PhraseLearningDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        await this.initIndexedDB();
        console.log('[Storage] Storage system initialized');
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('[Storage] IndexedDB open error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[Storage] IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
                console.log('[Storage] IndexedDB schema upgraded');
            };
        });
    }

    createStores(db) {
        if (!db.objectStoreNames.contains('phrases')) {
            const phraseStore = db.createObjectStore('phrases', { keyPath: 'id', autoIncrement: true });
            phraseStore.createIndex('status', 'status', { unique: false });
            phraseStore.createIndex('level', 'level', { unique: false });
            phraseStore.createIndex('topic', 'topic', { unique: false });
            console.log('[Storage] Created phrases store');
        }

        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id' });
            console.log('[Storage] Created users store');
        }

        if (!db.objectStoreNames.contains('progress')) {
            const progressStore = db.createObjectStore('progress', { keyPath: 'phraseId' });
            progressStore.createIndex('userId', 'userId', { unique: false });
            progressStore.createIndex('nextReview', 'nextReview', { unique: false });
            console.log('[Storage] Created progress store');
        }
    }

    setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('[Storage] localStorage set error:', error);
            return false;
        }
    }

    getLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('[Storage] localStorage get error:', error);
            return defaultValue;
        }
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async exportAll() {
        const stores = ['phrases', 'users', 'progress'];
        const data = {};
        for (const storeName of stores) {
            try {
                data[storeName] = await this.getAll(storeName);
            } catch (error) {
                console.error(`[Storage] Error exporting ${storeName}:`, error);
                data[storeName] = [];
            }
        }
        return data;
    }

    getUserPrefix(userId = null) {
        const currentUserId = userId || this.getLocalStorage('currentUserId', 'default');
        return `v6_user_${currentUserId}_`;
    }
}

const storage = new Storage();

// ========== Core: EventHub.js ==========
class EventHub {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
        return () => this.off(eventName, callback);
    }

    emit(eventName, ...args) {
        if (!this.events[eventName]) {
            return;
        }
        this.events[eventName].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`[EventHub] Error in event handler for "${eventName}":`, error);
            }
        });
    }

    clear() {
        this.events = {};
    }
}

const Events = {
    PHRASE_ADDED: 'phrase:added',
    PHRASE_UPDATED: 'phrase:updated',
    PHRASE_DELETED: 'phrase:deleted',
    PHRASE_REVIEWED: 'phrase:reviewed',
    USER_SWITCHED: 'user:switched',
    SYSTEM_READY: 'system:ready',
    TAB_CHANGED: 'ui:tab:changed'
};

const eventHub = new EventHub();

// ========== Core: Utils.js ==========
const Utils = {
    formatDate(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.getTime();
    },

    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// ========== Algorithms: SuperMemo2.js ==========
class SuperMemo2 {
    static DEFAULTS = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        minEaseFactor: 1.3
    };

    static calculate(quality, repetitions = 0, easeFactor = this.DEFAULTS.easeFactor, interval = this.DEFAULTS.interval) {
        quality = Math.max(1, Math.min(5, quality));
        let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (newEaseFactor < this.DEFAULTS.minEaseFactor) {
            newEaseFactor = this.DEFAULTS.minEaseFactor;
        }

        let newInterval;
        let newRepetitions;

        if (quality < 3) {
            newInterval = 1;
            newRepetitions = 1;
        } else {
            newRepetitions = repetitions + 1;
            if (newRepetitions === 1) {
                newInterval = 1;
            } else if (newRepetitions === 2) {
                newInterval = 6;
            } else {
                newInterval = Math.round(interval * newEaseFactor);
            }
        }

        return {
            interval: newInterval,
            repetitions: newRepetitions,
            easeFactor: newEaseFactor
        };
    }

    static isDue(lastReview, interval) {
        if (!lastReview) return true;
        const now = Date.now();
        const daysSinceReview = (now - lastReview) / (1000 * 60 * 60 * 24);
        return daysSinceReview >= interval;
    }

    static getNextReviewTime(lastReview, interval) {
        if (!lastReview) return Date.now();
        return lastReview + (interval * 24 * 60 * 60 * 1000);
    }

    static isMastered(progress) {
        if (!progress) return false;
        return progress.repetitions >= 5 &&
               progress.easeFactor >= 2.5 &&
               progress.interval >= 21;
    }
}

// ========== Data: PhraseStore.js ==========
class PhraseStore {
    constructor(storage) {
        this.storage = storage;
        this.storeName = 'phrases';
    }

    async add(phraseData) {
        const phrase = {
            ...phraseData,
            id: phraseData.id || Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const id = await this.storage.add(this.storeName, phrase);
        return id;
    }

    async addBatch(phrases) {
        const results = [];
        for (const phrase of phrases) {
            const id = await this.add(phrase);
            results.push(id);
        }
        return results;
    }

    async get(id) {
        return await this.storage.get(this.storeName, id);
    }

    async getAll() {
        return await this.storage.getAll(this.storeName);
    }

    async getByPhrase(phraseText) {
        const allPhrases = await this.getAll();
        return allPhrases.find(p => p.phrase === phraseText);
    }

    async update(id, updates) {
        const phrase = await this.get(id);
        if (!phrase) {
            throw new Error(`Phrase with id ${id} not found`);
        }
        const updatedPhrase = {
            ...phrase,
            ...updates,
            id,
            updatedAt: Date.now()
        };
        await this.storage.put(this.storeName, updatedPhrase);
        return true;
    }

    async delete(id) {
        await this.storage.delete(this.storeName, id);
        return true;
    }

    async clear() {
        return new Promise((resolve, reject) => {
            const tx = this.storage.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getByStatus(status) {
        const allPhrases = await this.getAll();
        return allPhrases.filter(p => (p.status || 'new') === status);
    }

    async getByLevel(level) {
        return await this.storage.getByIndex(this.storeName, 'level', level);
    }

    async getByTopic(topic) {
        return await this.storage.getByIndex(this.storeName, 'topic', topic);
    }

    async getDuePhrases(userId = null) {
        const allPhrases = await this.getAll();
        const now = Date.now();
        const duePhrases = [];

        for (const phrase of allPhrases) {
            const progressKey = `${userId || 'default'}_phrase_${phrase.id}`;
            const progress = this.storage.getLocalStorage(progressKey);

            if (!progress || progress.status === 'new') {
                continue;
            }

            if (progress.nextReview && progress.nextReview <= now) {
                duePhrases.push({ ...phrase, progress });
            }
        }

        return duePhrases;
    }

    sortByPriority(phrases) {
        return phrases.sort((a, b) => {
            const scoreA = this.calculatePriority(a);
            const scoreB = this.calculatePriority(b);
            return scoreB - scoreA;
        });
    }

    calculatePriority(phrase) {
        let score = 0;
        if (phrase.progress && phrase.progress.lastReview && phrase.progress.interval) {
            const now = Date.now();
            const daysSinceReview = (now - phrase.progress.lastReview) / (1000 * 60 * 60 * 24);
            const overdueDays = daysSinceReview - phrase.progress.interval;
            if (overdueDays > 0) {
                score += overdueDays * 3;
            }
        }
        if (phrase.level === '核心词汇') {
            score += 1;
        }
        return score;
    }

    async getTopics() {
        const allPhrases = await this.getAll();
        const topics = new Set(allPhrases.map(p => p.topic));
        return Array.from(topics).sort();
    }
}

class ProgressStore {
    constructor(storage) {
        this.storage = storage;
    }

    async save(progressData) {
        const userId = progressData.userId || 'default';
        const key = `${userId}_phrase_${progressData.phraseId}`;
        const progress = {
            phraseId: progressData.phraseId,
            userId: userId,
            status: progressData.status || 'new',
            repetitions: progressData.repetitions || 0,
            easeFactor: progressData.easeFactor || 2.5,
            interval: progressData.interval || 0,
            lastReview: progressData.lastReview || null,
            nextReview: progressData.nextReview || Date.now(),
            qualityHistory: progressData.qualityHistory || []
        };
        this.storage.setLocalStorage(key, progress);
        return true;
    }

    async getByPhraseId(phraseId, userId = null) {
        const key = `${userId || 'default'}_phrase_${phraseId}`;
        return this.storage.getLocalStorage(key);
    }

    async getAll(userId = 'default') {
        const allProgress = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${userId}_phrase_`)) {
                const progress = this.storage.getLocalStorage(key);
                if (progress) {
                    allProgress.push(progress);
                }
            }
        }
        return allProgress;
    }

    async getStatistics(userId = 'default') {
        const allProgress = await this.getAll(userId);
        const stats = {
            total: allProgress.length,
            new: 0,
            learning: 0,
            reviewing: 0,
            mastered: 0,
            dueToday: 0
        };

        const now = Date.now();
        for (const progress of allProgress) {
            if (progress.status) {
                stats[progress.status] = (stats[progress.status] || 0) + 1;
            }
            if (progress.nextReview && progress.nextReview <= now) {
                stats.dueToday++;
            }
        }

        return stats;
    }
}

class UserStore {
    constructor(storage) {
        this.storage = storage;
    }

    async create(userData) {
        const user = {
            id: userData.id || 'user_' + Date.now(),
            name: userData.name,
            createdAt: Date.now(),
            lastLoginAt: Date.now()
        };
        const users = this.storage.getLocalStorage('v6_users', []);
        users.push(user);
        this.storage.setLocalStorage('v6_users', users);
        return user.id;
    }

    async get(userId) {
        const users = this.storage.getLocalStorage('v6_users', []);
        return users.find(u => u.id === userId) || null;
    }

    async getAll() {
        return this.storage.getLocalStorage('v6_users', [
            { id: 'default', name: '默认用户', createdAt: Date.now() }
        ]);
    }

    async updateLastLogin(userId) {
        const users = this.storage.getLocalStorage('v6_users', []);
        const user = users.find(u => u.id === userId);
        if (user) {
            user.lastLoginAt = Date.now();
            this.storage.setLocalStorage('v6_users', users);
        }
        return true;
    }
}

// ========== Features: LearningMode.js ==========
class LearningMode {
    constructor(storage, phraseStore, progressStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
        this.progressStore = progressStore;
        this.currentPhrases = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.isAnswerShown = false;
    }

    async start(phrases, userId = 'default') {
        this.currentPhrases = phrases;
        this.currentIndex = 0;
        this.userId = userId;
        this.isActive = true;
        this.isAnswerShown = false;

        if (phrases.length === 0) {
            this.showEmptyState();
            return;
        }

        this.renderLearningCard();
        this.showModal();
    }

    renderLearningCard() {
        if (this.currentIndex >= this.currentPhrases.length) {
            this.showComplete();
            return;
        }

        const phrase = this.currentPhrases[this.currentIndex];
        const total = this.currentPhrases.length;
        const current = this.currentIndex + 1;
        const percentage = Math.round((current / total) * 100);

        const cleanPhrase = phrase.phrase.replace(/\*\*/g, '');
        const cleanExample = phrase.example.replace(/\*\*/g, '');

        const container = document.getElementById('learning-modal-body');
        if (!container) return;

        container.innerHTML = `
            <div class="progress-section">
                <div class="progress-info">
                    <span>学习进度</span>
                    <span>${current} / ${total}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
            </div>

            <div class="phrase-card">
                <div class="phrase-number">语块 #${phrase.id}</div>
                <div class="phrase">${cleanPhrase}</div>

                <div id="learning-answer-area" style="display: none;">
                    <div class="meaning">${phrase.meaning}</div>
                    <div class="example">${cleanExample}</div>

                    <div class="word-details">
                        <h4>📝 重点词汇</h4>
                        <div class="keyword-list">
                            ${phrase.keywords.map(kw => `<span class="keyword-item">${kw}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <button class="tts-button" onclick="window.app.speakPhrase('${cleanPhrase.replace(/'/g, "\\'")}')">
                        🔊 播放语块
                    </button>
                    <button class="tts-button" onclick="window.app.speakPhrase('${cleanExample.replace(/'/g, "\\'")}')">
                        🔊 播放例句
                    </button>
                </div>
            </div>

            <div id="learning-actions-area" class="learning-actions">
                <button class="btn-primary btn-large" onclick="window.app.learningMode.showAnswer()">
                    💡 显示答案
                </button>
            </div>

            <div id="learning-quality-area" class="quality-buttons" style="display: none;">
                <p style="text-align: center; margin-bottom: 15px; color: #666;">
                    👆 评分您的记忆质量
                </p>
                <button class="quality-btn quality-5" onclick="window.app.learningMode.rate(5)">
                    ⭐⭐⭐⭐⭐<br>完美
                </button>
                <button class="quality-btn quality-4" onclick="window.app.learningMode.rate(4)">
                    ⭐⭐⭐⭐<br>良好
                </button>
                <button class="quality-btn quality-3" onclick="window.app.learningMode.rate(3)">
                    ⭐⭐⭐<br>勉强
                </button>
                <button class="quality-btn quality-2" onclick="window.app.learningMode.rate(2)">
                    ⭐⭐<br>困难
                </button>
                <button class="quality-btn quality-1" onclick="window.app.learningMode.rate(1)">
                    ⭐<br>忘记
                </button>
            </div>
        `;

        this.isAnswerShown = false;
    }

    showAnswer() {
        this.isAnswerShown = true;
        document.getElementById('learning-answer-area').style.display = 'block';
        document.getElementById('learning-actions-area').style.display = 'none';
        document.getElementById('learning-quality-area').style.display = 'flex';
    }

    async rate(quality) {
        const phrase = this.currentPhrases[this.currentIndex];
        const progress = await this.progressStore.getByPhraseId(phrase.id, this.userId);

        const result = SuperMemo2.calculate(
            quality,
            progress?.repetitions || 0,
            progress?.easeFactor || 2.5,
            progress?.interval || 0
        );

        const newProgress = {
            phraseId: phrase.id,
            userId: this.userId,
            status: result.repetitions >= 5 && result.easeFactor >= 2.5 ? 'mastered' : 'learning',
            repetitions: result.repetitions,
            easeFactor: result.easeFactor,
            interval: result.interval,
            lastReview: Date.now(),
            nextReview: SuperMemo2.getNextReviewTime(Date.now(), result.interval),
            qualityHistory: [
                ...(progress?.qualityHistory || []),
                { quality, date: Date.now() }
            ]
        };

        await this.progressStore.save(newProgress);
        eventHub.emit(Events.PHRASE_REVIEWED, { phraseId: phrase.id, quality, result: newProgress });

        this.currentIndex++;
        this.renderLearningCard();
    }

    showComplete() {
        const container = document.getElementById('learning-modal-body');
        if (!container) return;

        container.innerHTML = `
            <div class="phrase-card" style="padding: 60px 40px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #667eea; margin-bottom: 20px;">学习完成!</h2>
                <p style="font-size: 18px; color: #666; margin-bottom: 30px;">
                    今天共学习了 <strong>${this.currentPhrases.length}</strong> 个语块
                </p>
                <button class="btn-primary btn-large" onclick="window.app.learningMode.exit()">
                    🏠 返回主界面
                </button>
            </div>
        `;

        this.isActive = false;
    }

    showEmptyState() {
        const container = document.getElementById('learning-modal-body');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>没有需要学习的内容</p>
                <button class="btn-primary" onclick="window.app.learningMode.exit()" style="margin-top: 20px;">
                    返回
                </button>
            </div>
        `;

        this.isActive = false;
    }

    showModal() {
        const modal = document.getElementById('learning-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal() {
        const modal = document.getElementById('learning-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    exit() {
        this.hideModal();
        this.isActive = false;
        this.currentPhrases = [];
        this.currentIndex = 0;
    }
}

// ========== Main App ==========
class App {
    constructor() {
        this.storage = storage;
        this.phraseStore = null;
        this.progressStore = null;
        this.userStore = null;
        this.learningMode = null;
        this.editor = null;
        this.statistics = null;
        this.importExport = null;
        this.currentUserId = 'default';
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('[App] Initializing application...');

            await this.storage.init();

            this.phraseStore = new PhraseStore(this.storage);
            this.progressStore = new ProgressStore(this.storage);
            this.userStore = new UserStore(this.storage);
            this.learningMode = new LearningMode(this.storage, this.phraseStore, this.progressStore);
            this.editor = new Editor(this.storage, this.phraseStore);
            this.statistics = new Statistics(this.storage, this.phraseStore, this.progressStore);
            this.importExport = new ImportExport(this.storage, this.phraseStore);

            this.currentUserId = this.storage.getLocalStorage('currentUserId', 'default');

            await this.loadDefaultPhrases();
            this.initUI();
            this.setupEventListeners();

            eventHub.emit(Events.SYSTEM_READY);
            this.isInitialized = true;

            this.hideLoadingScreen();
            console.log('[App] Application initialized successfully');
        } catch (error) {
            console.error('[App] Initialization error:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }

    async loadDefaultPhrases() {
        const count = await this.storage.count('phrases');

        if (count === 0) {
            console.log('[App] No phrases found, loading defaults...');

            const defaultPhrases = [
                {"id": 1, "phrase": "be good at doing", "meaning": "擅长做某事", "example": "He is **good at** **playing** basketball.", "keywords": ["good", "play"], "level": "核心词汇", "frequency": "高频", "topic": "能力描述"},
                {"id": 2, "phrase": "be interested in doing", "meaning": "对做某事感兴趣", "example": "She is **interested in** **reading** novels.", "keywords": ["interested", "read"], "level": "核心词汇", "frequency": "高频", "topic": "兴趣表达"},
                {"id": 3, "phrase": "look forward to doing", "meaning": "期待做某事", "example": "I **look forward to** **seeing** you soon.", "keywords": ["forward", "see"], "level": "核心词汇", "frequency": "高频", "topic": "期待表达"},
                {"id": 4, "phrase": "give up doing", "meaning": "放弃做某事", "example": "Don't **give up** **trying**.", "keywords": ["give", "try"], "level": "核心词汇", "frequency": "高频", "topic": "行动建议"},
                {"id": 5, "phrase": "keep doing", "meaning": "一直做某事", "example": "He **kept** **working** all night.", "keywords": ["keep", "work"], "level": "核心词汇", "frequency": "高频", "topic": "持续动作"},
                {"id": 6, "phrase": "enjoy doing", "meaning": "享受做某事", "example": "I **enjoy** **listening** to music.", "keywords": ["enjoy", "listen"], "level": "核心词汇", "frequency": "高频", "topic": "喜好表达"},
                {"id": 7, "phrase": "practice doing", "meaning": "练习做某事", "example": "You need to **practice** **speaking** English every day.", "keywords": ["practice", "speak"], "level": "核心词汇", "frequency": "高频", "topic": "学习行动"},
                {"id": 8, "phrase": "finish doing", "meaning": "完成做某事", "example": "Have you **finished** **reading** the book?", "keywords": ["finish", "read"], "level": "核心词汇", "frequency": "高频", "topic": "完成动作"},
                {"id": 9, "phrase": "avoid doing", "meaning": "避免做某事", "example": "You should **avoid** **eating** too much junk food.", "keywords": ["avoid", "eat"], "level": "核心词汇", "frequency": "中频", "topic": "建议劝告"},
                {"id": 10, "phrase": "mind doing", "meaning": "介意做某事", "example": "Do you **mind** **opening** the window?", "keywords": ["mind", "open"], "level": "核心词汇", "frequency": "高频", "topic": "礼貌询问"}
            ];

            for (const phrase of defaultPhrases) {
                await this.phraseStore.add(phrase);
            }

            console.log(`[App] Loaded ${defaultPhrases.length} default phrases`);
        }
    }

    initUI() {
        this.updateDashboard();
        this.updateUserSelector();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        const startLearningBtn = document.getElementById('start-learning-btn');
        if (startLearningBtn) {
            startLearningBtn.addEventListener('click', () => this.startLearning());
        }

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        eventHub.on(Events.PHRASE_REVIEWED, () => {
            this.updateDashboard();
        });

        // Import/Export button
        const importExportBtn = document.getElementById('import-export-btn');
        if (importExportBtn) {
            importExportBtn.addEventListener('click', () => {
                this.importExport.showDialog();
            });
        }

        // Backup button
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.importExport.backupData();
            });
        }
    }

    async updateDashboard() {
        try {
            const allPhrases = await this.phraseStore.getAll();
            const progressStats = await this.progressStore.getStatistics(this.currentUserId);

            const plan = await this.getTodayPlan();
            document.getElementById('plan-time').textContent = plan.estimatedTime || '--';
            document.getElementById('plan-new').textContent = (plan.newCount || 0) + '个';
            document.getElementById('plan-total').textContent = (plan.total || 0) + '个';

            // Calculate overdue count for highlighting
            const overdueCount = await this.getOverdueCount(plan.review);
            const planReviewEl = document.getElementById('plan-review');
            if (overdueCount > 0) {
                planReviewEl.innerHTML = `${plan.reviewCount}个 <span style="color: #ffc107; font-size: 12px;">(逾期${overdueCount}个)</span>`;
            } else {
                planReviewEl.textContent = (plan.reviewCount || 0) + '个';
            }

            document.getElementById('stat-total').textContent = allPhrases.length;
            document.getElementById('stat-learned').textContent = (progressStats.learning || 0) + (progressStats.reviewing || 0) + (progressStats.mastered || 0);
            document.getElementById('stat-mastered').textContent = progressStats.mastered || 0;
            document.getElementById('stat-due').textContent = progressStats.dueToday || 0;

            // Update config info display
            this.updateConfigInfo();
        } catch (error) {
            console.error('[App] Error updating dashboard:', error);
        }
    }

    async getOverdueCount(reviewPhrases) {
        if (!reviewPhrases || reviewPhrases.length === 0) return 0;

        let overdueCount = 0;
        for (const phrase of reviewPhrases) {
            const progress = await this.progressStore.get(this.currentUserId, phrase.id);
            if (progress && progress.lastReview && progress.interval) {
                const daysSinceReview = (Date.now() - progress.lastReview) / (1000 * 60 * 60 * 24);
                if (daysSinceReview > progress.interval) {
                    overdueCount++;
                }
            }
        }
        return overdueCount;
    }

    async getTodayPlan() {
        const config = this.getUserConfig();
        console.log('[App] 用户配置:', config);

        const duePhrases = await this.phraseStore.getDuePhrases(this.currentUserId);
        console.log('[App] 待复习语块数:', duePhrases.length);
        const sorted = this.phraseStore.sortByPriority(duePhrases);
        const todayReview = sorted.slice(0, config.dailyReviewLimit);

        const newPhrases = await this.phraseStore.getByStatus('new');
        console.log('[App] 新语块数:', newPhrases.length);
        const todayNew = newPhrases.slice(0, config.dailyNewLimit);

        const plan = {
            review: todayReview,
            new: todayNew,
            reviewCount: todayReview.length,
            newCount: todayNew.length,
            total: todayReview.length + todayNew.length,
            estimatedTime: this.estimateTime(todayReview.length, todayNew.length)
        };
        console.log('[App] 今日计划:', plan);
        return plan;
    }

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

    getUserConfig() {
        return this.storage.getLocalStorage('v6_config', {
            dailyReviewLimit: 20,
            dailyNewLimit: 10,
            avgTimePerReview: 30,
            avgTimePerNew: 60
        });
    }

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

    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
            pane.style.display = 'none';
        });

        const activePane = document.getElementById(`${tabName}-tab`);
        if (activePane) {
            activePane.classList.add('active');
            activePane.style.display = 'block';
        }

        eventHub.emit(Events.TAB_CHANGED, tabName);

        // Initialize tab-specific features
        if (tabName === 'editor') {
            this.editor.init();
        } else if (tabName === 'statistics') {
            this.statistics.init();
        }
    }

    async startLearning() {
        console.log('[App] 开始学习计划...');
        const plan = await this.getTodayPlan();
        console.log('[App] 今日学习计划:', plan);

        if (plan.total === 0) {
            // 检查数据库中是否有语块
            const allPhrases = await this.phraseStore.getAll();
            console.log('[App] 数据库中语块总数:', allPhrases.length);

            if (allPhrases.length === 0) {
                alert('数据库中无语块数据！请先导入教材数据。');
            } else {
                alert('今天没有需要学习的内容！所有语块都已学习。');
            }
            return;
        }

        await this.showLearningModal([...plan.review, ...plan.new]);
    }

    async showLearningModal(phrases) {
        await this.learningMode.start(phrases, this.currentUserId);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

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

    // ========== Settings Methods ==========
    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('active');
            this.initSettingsValues();
        }
    }

    closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    initSettingsValues() {
        const config = this.getUserConfig();
        document.getElementById('setting-review-limit').value = config.dailyReviewLimit;
        document.getElementById('setting-new-limit').value = config.dailyNewLimit;
        document.getElementById('setting-review-value').textContent = config.dailyReviewLimit + '个';
        document.getElementById('setting-new-value').textContent = config.dailyNewLimit + '个';
        this.updateConfigInfo();
    }

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

        document.getElementById('setting-review-limit').value = preset.dailyReviewLimit;
        document.getElementById('setting-new-limit').value = preset.dailyNewLimit;
        document.getElementById('setting-review-value').textContent = preset.dailyReviewLimit + '个';
        document.getElementById('setting-new-value').textContent = preset.dailyNewLimit + '个';

        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
        const activeCard = document.getElementById(`mode-${mode}`);
        if (activeCard) {
            activeCard.classList.add('active');
        }

        this.updateConfigInfo();
    }

    updateSettingValue(type, value) {
        if (type === 'review') {
            document.getElementById('setting-review-value').textContent = value + '个';
        } else if (type === 'new') {
            document.getElementById('setting-new-value').textContent = value + '个';
        }

        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
    }

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

    saveSettings() {
        const config = this.getUserConfig();
        config.dailyReviewLimit = parseInt(document.getElementById('setting-review-limit').value);
        config.dailyNewLimit = parseInt(document.getElementById('setting-new-limit').value);

        this.storage.setLocalStorage('v6_config', config);

        this.updateConfigInfo();
        this.updateDashboard();
        this.closeSettings();
    }

    speakPhrase(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    }
}

// ========== Features: Editor.js ==========
class Editor {
    constructor(storage, phraseStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
        this.currentPhrases = [];
        this.selectedPhraseId = null;
        this.filter = { search: '', level: '', topic: '' };
    }

    async init() {
        await this.loadPhrases();
        await this.loadTopics();
        this.render();
        this.setupEventListeners();
    }

    async loadPhrases() {
        let phrases = await this.phraseStore.getAll();
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

    async loadTopics() {
        const topics = await this.phraseStore.getTopics();
        const select = document.getElementById('editor-topic-filter');
        if (select) {
            select.innerHTML = '<option value="">全部主题</option>' +
                topics.map(topic => `<option value="${topic}">${topic}</option>`).join('');
        }
    }

    render() {
        const container = document.getElementById('editor-content');
        if (!container) return;
        if (this.currentPhrases.length === 0) {
            container.innerHTML = `<div class="editor-empty-state"><div class="empty-state-icon">📝</div><h3>暂无语块</h3><p>点击"添加语块"开始添加</p><button class="btn-primary" onclick="window.app.editor.showAddForm()" style="margin-top:20px;">➕ 添加语块</button></div>`;
            return;
        }
        const itemsHTML = this.currentPhrases.map(phrase => `
            <div class="phrase-item ${this.selectedPhraseId === phrase.id ? 'selected' : ''}" data-id="${phrase.id}" onclick="window.app.editor.selectPhrase(${phrase.id})">
                <div class="phrase-item-header">
                    <div class="phrase-item-content">
                        <div class="phrase-item-text">${this.escapeHTML(phrase.phrase)}</div>
                        <div class="phrase-item-meaning">${this.escapeHTML(phrase.meaning)}</div>
                        <div class="phrase-item-example">${this.escapeHTML(phrase.example).replace(/\*\*/g, '')}</div>
                        <div class="tags">
                            <span class="tag level">${phrase.level}</span>
                            <span class="tag topic">${phrase.topic}</span>
                        </div>
                    </div>
                    <div class="phrase-item-actions">
                        <button class="icon-btn-small" onclick="event.stopPropagation(); window.app.editor.editPhrase(${phrase.id})">✏️</button>
                        <button class="icon-btn-small danger" onclick="event.stopPropagation(); window.app.editor.deletePhrase(${phrase.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
        container.innerHTML = `<div class="editor-list">${itemsHTML}</div>`;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('editor-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filter.search = e.target.value;
                this.loadPhrases();
                this.render();
            });
        }
        const levelFilter = document.getElementById('editor-level-filter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.filter.level = e.target.value;
                this.loadPhrases();
                this.render();
            });
        }
    }

    selectPhrase(id) {
        this.selectedPhraseId = id;
        this.render();
    }

    showAddForm() {
        this.showModal('add');
    }

    async editPhrase(id) {
        const phrase = await this.phraseStore.get(id);
        if (!phrase) return;
        this.showModal('edit', phrase);
    }

    async deletePhrase(id) {
        if (!confirm('确定要删除这个语块吗？')) return;
        try {
            await this.phraseStore.delete(id);
            await this.loadPhrases();
            this.render();
            alert('删除成功');
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }

    showModal(mode, phrase = null) {
        const isEdit = mode === 'edit';
        const modalHTML = `
            <div id="editor-modal" class="modal active">
                <div class="modal-content" style="max-width:600px;">
                    <div class="modal-header">
                        <h2>${isEdit ? '编辑语块' : '添加语块'}</h2>
                        <button class="modal-close" onclick="window.app.editor.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="phrase-form">
                            <div class="form-group">
                                <label>语块 *</label>
                                <input type="text" id="edit-phrase" required value="${isEdit ? this.escapeHTML(phrase.phrase) : ''}" placeholder="例如: be good at doing">
                            </div>
                            <div class="form-group">
                                <label>释义 *</label>
                                <input type="text" id="edit-meaning" required value="${isEdit ? this.escapeHTML(phrase.meaning) : ''}" placeholder="例如: 擅长做某事">
                            </div>
                            <div class="form-group">
                                <label>例句 *</label>
                                <textarea id="edit-example" required rows="3">${isEdit ? this.escapeHTML(phrase.example) : ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label>关键词 *</label>
                                <input type="text" id="edit-keywords" required value="${isEdit ? phrase.keywords.join(', ') : ''}" placeholder="good, play">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>等级</label>
                                    <select id="edit-level">
                                        <option value="核心词汇" ${isEdit && phrase.level === '核心词汇' ? 'selected' : ''}>核心词汇</option>
                                        <option value="进阶词汇" ${isEdit && phrase.level === '进阶词汇' ? 'selected' : ''}>进阶词汇</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>频率</label>
                                    <select id="edit-frequency">
                                        <option value="高频" ${isEdit && phrase.frequency === '高频' ? 'selected' : ''}>高频</option>
                                        <option value="中频" ${isEdit && phrase.frequency === '中频' ? 'selected' : ''}>中频</option>
                                        <option value="低频" ${isEdit && phrase.frequency === '低频' ? 'selected' : ''}>低频</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>主题</label>
                                <input type="text" id="edit-topic" value="${isEdit ? this.escapeHTML(phrase.topic) : ''}" placeholder="能力描述">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">${isEdit ? '保存' : '添加'}</button>
                                <button type="button" class="btn-secondary" onclick="window.app.editor.closeModal()">取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        let modal = document.getElementById('editor-modal');
        if (modal) modal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('phrase-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePhrase(isEdit ? phrase.id : null);
        });
    }

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
        if (!phrase.phrase || !phrase.meaning || !phrase.example) {
            alert('请填写所有必填字段');
            return;
        }
        try {
            if (id) {
                await this.phraseStore.update(id, phrase);
                alert('更新成功');
            } else {
                await this.phraseStore.add(phrase);
                alert('添加成功');
            }
            this.closeModal();
            await this.loadPhrases();
            this.render();
            if (window.app) window.app.updateDashboard();
        } catch (error) {
            alert('保存失败: ' + error.message);
        }
    }

    closeModal() {
        const modal = document.getElementById('editor-modal');
        if (modal) modal.remove();
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========== Features: Statistics.js ==========
class Statistics {
    constructor(storage, phraseStore, progressStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
        this.progressStore = progressStore;
    }

    async init() {
        await this.render();
    }

    async render() {
        const container = document.getElementById('statistics-content');
        if (!container) return;
        const allPhrases = await this.phraseStore.getAll();
        const stats = await this.progressStore.getStatistics('default');
        const allProgress = await this.progressStore.getAll('default');
        const masteredCount = stats.mastered || 0;
        const learningCount = stats.learning || 0;
        const newCount = allPhrases.length - masteredCount - learningCount;
        const totalReviews = allProgress.reduce((sum, p) => sum + (p.repetitions || 0), 0);
        const learnedTotal = masteredCount + learningCount;
        const percentage = allPhrases.length > 0 ? Math.round((learnedTotal / allPhrases.length) * 100) : 0;

        container.innerHTML = `
            <div class="stats-overview">
                <div class="stat-card"><div class="stat-value">${allPhrases.length}</div><div class="stat-label">总语块数</div></div>
                <div class="stat-card"><div class="stat-value">${masteredCount}</div><div class="stat-label">已掌握</div></div>
                <div class="stat-card"><div class="stat-value">${learningCount}</div><div class="stat-label">学习中</div></div>
                <div class="stat-card"><div class="stat-value">${stats.dueToday || 0}</div><div class="stat-label">待复习</div></div>
            </div>
            <div class="card" style="margin-top:20px;">
                <div class="card-header"><h3>学习进度</h3></div>
                <div style="text-align:center;padding:40px;">
                    <div style="font-size:48px;font-weight:bold;color:#667eea;">${percentage}%</div>
                    <div style="color:#666;margin-top:10px;">已完成 ${learnedTotal} / ${allPhrases.length}</div>
                </div>
            </div>
            <div class="card" style="margin-top:20px;">
                <div class="card-header"><h3>详细统计</h3></div>
                <div class="stats-grid">
                    <div class="stat-item"><div class="stat-number">${totalReviews}</div><div class="stat-label">总复习次数</div></div>
                    <div class="stat-item"><div class="stat-number">${newCount}</div><div class="stat-label">待学习</div></div>
                </div>
            </div>
        `;
    }
}

// ========== Features: ImportExport.js ==========
class ImportExport {
    constructor(storage, phraseStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
    }

    async exportJSON() {
        try {
            const phrases = await this.phraseStore.getAll();
            const data = { version: '6.0', exportedAt: Date.now(), count: phrases.length, phrases: phrases };
            const filename = `phrases_${Utils.formatDate(Date.now(), 'YYYYMMDD_HHmmss')}.json`;
            Utils.downloadJSON(data, filename);
            alert(`导出成功！共导出 ${phrases.length} 条数据`);
        } catch (error) {
            alert('导出失败: ' + error.message);
        }
    }

    async exportCSV() {
        try {
            const phrases = await this.phraseStore.getAll();
            if (phrases.length === 0) {
                alert('没有数据可导出');
                return;
            }
            const headers = ['phrase', 'meaning', 'example', 'keywords', 'level', 'frequency', 'topic'];
            const rows = phrases.map(p => [
                `"${p.phrase.replace(/"/g, '""')}"`,
                `"${p.meaning.replace(/"/g, '""')}"`,
                `"${p.example.replace(/"/g, '""')}"`,
                `"${p.keywords.join(', ')}"`,
                p.level,
                p.frequency,
                `"${p.topic}"`
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `phrases_${Utils.formatDate(Date.now(), 'YYYYMMDD_HHmmss')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            alert(`导出成功！共导出 ${phrases.length} 条数据`);
        } catch (error) {
            alert('导出失败: ' + error.message);
        }
    }

    showDialog() {
        const modalHTML = `
            <div id="import-export-modal" class="modal active">
                <div class="modal-content" style="max-width:700px;">
                    <div class="modal-header">
                        <h2>📦 导入/导出</h2>
                        <button class="modal-close" onclick="window.app.importExport.closeDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="card" style="margin-bottom:20px;">
                            <div class="card-header"><h3>📤 导出数据</h3></div>
                            <div class="form-actions">
                                <button class="btn-primary" onclick="window.app.importExport.exportJSON()">导出为JSON</button>
                                <button class="btn-secondary" onclick="window.app.importExport.exportCSV()">导出为CSV</button>
                            </div>
                        </div>
                        <div class="card" style="margin-bottom:20px;">
                            <div class="card-header"><h3>📥 导入教材数据</h3></div>
                            <div class="form-group">
                                <label><strong>支持教材格式:</strong></label>
                                <div style="font-size:12px;color:#666;margin-bottom:10px;">
                                    • 七上_system.json (950条)<br>
                                    • 七下_system.json<br>
                                    • 八上_system.json<br>
                                    • 八下_system.json
                                </div>
                            </div>
                            <div class="form-group">
                                <label>选择文件</label>
                                <input type="file" id="import-file" accept=".json,.csv">
                            </div>
                            <div class="form-group">
                                <label>导入模式</label>
                                <select id="import-mode">
                                    <option value="append">追加 - 保留现有数据</option>
                                    <option value="replace">替换 - 清空现有数据</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button class="btn-primary" onclick="window.app.importExport.handleImport()">导入数据</button>
                            </div>
                            <div id="import-result" style="margin-top:15px;"></div>
                        </div>
                        <div class="card">
                            <div class="card-header"><h3>💾 数据备份</h3></div>
                            <div class="form-actions">
                                <button class="btn-secondary" onclick="window.app.importExport.backupData()">创建完整备份</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        let modal = document.getElementById('import-export-modal');
        if (modal) modal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeDialog() {
        const modal = document.getElementById('import-export-modal');
        if (modal) modal.remove();
    }

    async handleImport() {
        const fileInput = document.getElementById('import-file');
        const resultDiv = document.getElementById('import-result');

        if (!fileInput.files || fileInput.files.length === 0) {
            resultDiv.innerHTML = '<p style="color:#f44336;">❌ 请选择文件</p>';
            return;
        }

        const mode = document.getElementById('import-mode')?.value || 'append';
        const file = fileInput.files[0];

        resultDiv.innerHTML = '<p style="color:#2196f3;">⏳ 正在读取文件...</p>';

        const reader = new FileReader();

        reader.onerror = () => {
            resultDiv.innerHTML = '<p style="color:#f44336;">❌ 文件读取失败</p>';
        };

        reader.onload = async (e) => {
            try {
                console.log('[Import] File content length:', e.target.result.length);
                const data = JSON.parse(e.target.result);
                console.log('[Import] Parsed data:', data);

                // 检查是否是教材数据格式
                const isTextbookFormat = data.cards && Array.isArray(data.cards);
                const isSystemFormat = data.phrases && Array.isArray(data.phrases);

                console.log('[Import] isTextbookFormat:', isTextbookFormat);
                console.log('[Import] isSystemFormat:', isSystemFormat);

                if (mode === 'replace') {
                    resultDiv.innerHTML = '<p style="color:#ff9800;">⚠️ 正在清空现有数据...</p>';
                    await this.phraseStore.clear();
                    resultDiv.innerHTML = '<p style="color:#2196f3;">⏳ 正在导入...</p>';
                }

                let imported = 0;
                let skipped = 0;
                let errors = [];

                if (isTextbookFormat) {
                    // 教材数据格式 (如七上_system.json)
                    resultDiv.innerHTML = `<p style="color:#2196f3;">📚 检测到教材数据: ${data.source || '未知'} (${data.total}条)</p>`;
                    resultDiv.innerHTML += `<p style="color:#2196f3;">⏳ 正在导入...</p>`;

                    const totalCards = data.cards.length;
                    const batchSize = 50; // 每批处理50条

                    for (let i = 0; i < totalCards; i++) {
                        const card = data.cards[i];

                        if (!card.phrase || card.phrase.trim() === '') {
                            continue;
                        }

                        // 清理语块文本
                        const cleanPhrase = card.phrase.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();

                        // 检查是否已存在
                        try {
                            const existing = await this.phraseStore.getByPhrase(cleanPhrase);
                            if (existing) {
                                skipped++;
                                continue;
                            }

                            const phrase = {
                                phrase: cleanPhrase,
                                meaning: card.meaning && card.meaning.trim() !== '' ? card.meaning.trim() : cleanPhrase,
                                example: card.example && card.example.trim() !== '' ? card.example.trim() : cleanPhrase,
                                keywords: card.keywords && Array.isArray(card.keywords) ? card.keywords : [],
                                level: card.level || '核心词汇',
                                frequency: '高频',
                                topic: this.extractTopic(card.unit || '', card.type || 'phrase'),
                                status: 'new'  // 设置初始状态为new
                            };

                            await this.phraseStore.add(phrase);
                            imported++;

                            // 每处理100条更新一次进度
                            if (imported % 100 === 0) {
                                resultDiv.innerHTML = `
                                    <p style="color:#2196f3;">📚 ${data.source || '未知'} (${data.total}条)</p>
                                    <p style="color:#2196f3;">⏳ 进度: ${i + 1}/${totalCards} - 已导入: ${imported}</p>
                                `;
                            }

                        } catch (error) {
                            errors.push({
                                phrase: cleanPhrase,
                                error: error.message
                            });
                        }
                    }

                    // 显示最终结果
                    let resultHTML = `
                        <p style="color:#4caf50;">✅ 导入完成！</p>
                        <p><strong>数据源:</strong> ${data.source || '未知'}</p>
                        <p><strong>原始数量:</strong> ${data.total}</p>
                        <p><strong>成功导入:</strong> ${imported}</p>
                        <p><strong>已跳过:</strong> ${skipped} (重复数据)</p>
                    `;

                    if (errors.length > 0) {
                        resultHTML += `<p style="color:#ff9800;">⚠️ ${errors.length} 条导入失败</p>`;
                    }

                    resultDiv.innerHTML = resultHTML;

                } else if (isSystemFormat) {
                    // 系统格式
                    for (const phrase of data.phrases) {
                        if (phrase.phrase && phrase.meaning && phrase.example) {
                            await this.phraseStore.add({ ...phrase, id: phrase.id || Date.now() + Math.random() });
                            imported++;
                        }
                    }
                    resultDiv.innerHTML = `<p style="color:#4caf50;">✅ 导入成功！已导入 ${imported} 条数据</p>`;
                } else {
                    resultDiv.innerHTML = `
                        <p style="color:#f44336;">❌ 无效的数据格式</p>
                        <p style="font-size:12px;color:#666;">请确保文件包含 'cards' 或 'phrases' 数组</p>
                    `;
                    return;
                }

                if (window.app) {
                    window.app.updateDashboard();
                }

            } catch (error) {
                console.error('[Import] Error:', error);
                resultDiv.innerHTML = `
                    <p style="color:#f44336;">❌ 导入失败: ${error.message}</p>
                    <p style="font-size:12px;color:#666;">请检查文件格式是否正确</p>
                `;
            }
        };

        reader.readAsText(file);
    }

    extractTopic(unitTitle, type) {
        if (!unitTitle) return '其他';
        const unitMatch = unitTitle.match(/Unit (\d+)/);
        if (unitMatch) {
            const unitNum = unitMatch[1];
            const topics = { '1': '新学校新朋友', '2': '兴趣爱好', '3': '学校生活', '4': '日常活动', '5': '特殊日子', '6': '食物与健康', '7': '购物', '8': '自然世界' };
            return topics[unitNum] || `Unit ${unitNum}`;
        }
        return type === 'word' ? '词汇' : '语块';
    }

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

// ========== Initialize app ==========
const app = new App();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

window.app = app;
