/**
 * PhraseStore.js - 语块数据管理
 * 负责语块的CRUD操作、查询、搜索等
 */

class PhraseStore {
    constructor(storage) {
        this.storage = storage;
        this.storeName = 'phrases';
    }

    /**
     * 添加语块
     * @param {Object} phraseData - 语块数据
     * @returns {Promise<number>} - 返回新语块的ID
     */
    async add(phraseData) {
        // 验证数据
        const validation = Utils.validatePhrase(phraseData);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // 准备数据
        const phrase = {
            id: phraseData.id || Date.now(),
            phrase: phraseData.phrase.trim(),
            meaning: phraseData.meaning.trim(),
            example: phraseData.example.trim(),
            keywords: phraseData.keywords || [],
            level: phraseData.level || '核心词汇',
            frequency: phraseData.frequency || '中频',
            topic: phraseData.topic || '其他',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const id = await this.storage.add(this.storeName, phrase);
        eventHub.emit(Events.PHRASE_ADDED, phrase);
        return id;
    }

    /**
     * 批量添加语块
     * @param {Object[]} phrases - 语块数组
     * @returns {Promise<number[]>}
     */
    async addBatch(phrases) {
        const operations = phrases.map(phrase => ({
            type: 'add',
            data: {
                ...phrase,
                id: phrase.id || Date.now() + Math.random(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        }));

        const results = await this.storage.batch(this.storeName, operations);
        eventHub.emit(Events.PHRASE_ADDED, phrases);
        return results;
    }

    /**
     * 获取单个语块
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        return await this.storage.get(this.storeName, id);
    }

    /**
     * 获取所有语块
     * @returns {Promise<Object[]>}
     */
    async getAll() {
        return await this.storage.getAll(this.storeName);
    }

    /**
     * 更新语块
     * @param {number} id
     * @param {Object} updates - 要更新的字段
     * @returns {Promise<boolean>}
     */
    async update(id, updates) {
        const phrase = await this.get(id);
        if (!phrase) {
            throw new Error(`Phrase with id ${id} not found`);
        }

        const updatedPhrase = {
            ...phrase,
            ...updates,
            id, // 确保ID不被修改
            updatedAt: Date.now()
        };

        await this.storage.put(this.storeName, updatedPhrase);
        eventHub.emit(Events.PHRASE_UPDATED, updatedPhrase);
        return true;
    }

    /**
     * 删除语块
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const phrase = await this.get(id);
        if (!phrase) {
            throw new Error(`Phrase with id ${id} not found`);
        }

        await this.storage.delete(this.storeName, id);
        eventHub.emit(Events.PHRASE_DELETED, { id, phrase });
        return true;
    }

    /**
     * 批量删除语块
     * @param {number[]} ids
     * @returns {Promise<number>} - 返回删除的数量
     */
    async deleteBatch(ids) {
        const operations = ids.map(id => ({ type: 'delete', key: id }));
        const results = await this.storage.batch(this.storeName, operations);
        const deletedCount = results.filter(r => r.success).length;
        eventHub.emit(Events.PHRASE_DELETED, { count: deletedCount });
        return deletedCount;
    }

    /**
     * 清空所有语块
     * @returns {Promise<boolean>}
     */
    async clear() {
        await this.storage.clear(this.storeName);
        eventHub.emit(Events.PHRASE_DELETED, { all: true });
        return true;
    }

    /**
     * ========== 查询功能 ==========

    /**
     * 按状态查询
     * @param {string} status - 'new', 'learning', 'review', 'mastered'
     * @returns {Promise<Object[]>}
     */
    async getByStatus(status) {
        const allPhrases = await this.getAll();
        return allPhrases.filter(p => p.status === status);
    }

    /**
     * 按等级查询
     * @param {string} level - '核心词汇', '进阶词汇'
     * @returns {Promise<Object[]>}
     */
    async getByLevel(level) {
        return await this.storage.getByIndex(this.storeName, 'level', level);
    }

    /**
     * 按主题查询
     * @param {string} topic
     * @returns {Promise<Object[]>}
     */
    async getByTopic(topic) {
        return await this.storage.getByIndex(this.storeName, 'topic', topic);
    }

    /**
     * 搜索语块
     * @param {string} query - 搜索关键词
     * @param {Object} options - 搜索选项
     * @returns {Promise<Object[]>}
     */
    async search(query, options = {}) {
        const {
            searchInPhrase = true,
            searchInMeaning = true,
            searchInExample = true,
            searchInKeywords = true,
            caseSensitive = false
        } = options;

        const allPhrases = await this.getAll();
        const searchTerm = caseSensitive ? query : query.toLowerCase();

        return allPhrases.filter(phrase => {
            if (searchInPhrase) {
                const text = caseSensitive ? phrase.phrase : phrase.phrase.toLowerCase();
                if (text.includes(searchTerm)) return true;
            }

            if (searchInMeaning) {
                const text = caseSensitive ? phrase.meaning : phrase.meaning.toLowerCase();
                if (text.includes(searchTerm)) return true;
            }

            if (searchInExample) {
                const text = caseSensitive ? phrase.example : phrase.example.toLowerCase();
                if (text.includes(searchTerm)) return true;
            }

            if (searchInKeywords && phrase.keywords) {
                const match = phrase.keywords.some(kw => {
                    const text = caseSensitive ? kw : kw.toLowerCase();
                    return text.includes(searchTerm);
                });
                if (match) return true;
            }

            return false;
        });
    }

    /**
     * 获取需要复习的语块
     * @param {number} userId - 用户ID
     * @returns {Promise<Object[]>}
     */
    async getDuePhrases(userId = null) {
        const progressStore = new ProgressStore(this.storage);
        const allPhrases = await this.getAll();
        const now = Date.now();

        const duePhrases = [];
        for (const phrase of allPhrases) {
            const progress = await progressStore.getByPhraseId(phrase.id, userId);
            if (!progress || progress.status === 'new') {
                // 新学习的语块
                continue;
            }

            if (progress.nextReview && progress.nextReview <= now) {
                duePhrases.push({ ...phrase, progress });
            }
        }

        return duePhrases;
    }

    /**
     * 按优先级排序语块
     * @param {Object[]} phrases
     * @returns {Object[]}
     */
    sortByPriority(phrases) {
        return phrases.sort((a, b) => {
            const scoreA = this.calculatePriority(a);
            const scoreB = this.calculatePriority(b);
            return scoreB - scoreA;
        });
    }

    /**
     * 计算语块优先级分数
     * @param {Object} phrase
     * @returns {number}
     */
    calculatePriority(phrase) {
        let score = 0;

        // 1. 逾期天数 (权重: 3)
        if (phrase.progress && phrase.progress.lastReview && phrase.progress.interval) {
            const now = Date.now();
            const daysSinceReview = (now - phrase.progress.lastReview) / (1000 * 60 * 60 * 24);
            const overdueDays = daysSinceReview - phrase.progress.interval;
            if (overdueDays > 0) {
                score += overdueDays * 3;
            }
        }

        // 2. 历史评分均值 (权重: 2)
        if (phrase.progress && phrase.progress.qualityHistory && phrase.progress.qualityHistory.length > 0) {
            const avgQuality = phrase.progress.qualityHistory.reduce((sum, h) => sum + h.quality, 0) /
                             phrase.progress.qualityHistory.length;
            score += (5 - avgQuality) * 2;
        }

        // 3. 易度因子越低越优先 (权重: 1)
        if (phrase.progress && phrase.progress.easeFactor) {
            score += (3 - phrase.progress.easeFactor);
        }

        // 4. 核心词汇优先级更高 (权重: 1)
        if (phrase.level === '核心词汇') {
            score += 1;
        }

        return score;
    }

    /**
     * 获取所有主题
     * @returns {Promise<string[]>}
     */
    async getTopics() {
        const allPhrases = await this.getAll();
        const topics = new Set(allPhrases.map(p => p.topic));
        return Array.from(topics).sort();
    }

    /**
     * 获取统计信息
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const allPhrases = await this.getAll();

        const stats = {
            total: allPhrases.length,
            byLevel: {},
            byTopic: {},
            byFrequency: {}
        };

        for (const phrase of allPhrases) {
            // 按等级统计
            stats.byLevel[phrase.level] = (stats.byLevel[phrase.level] || 0) + 1;

            // 按主题统计
            stats.byTopic[phrase.topic] = (stats.byTopic[phrase.topic] || 0) + 1;

            // 按频率统计
            stats.byFrequency[phrase.frequency] = (stats.byFrequency[phrase.frequency] || 0) + 1;
        }

        return stats;
    }

    /**
     * 导出为JSON
     * @param {Object[]} phrases
     * @returns {string}
     */
    exportToJSON(phrases = null) {
        const dataToExport = phrases || await this.getAll();
        return JSON.stringify(dataToExport, null, 2);
    }

    /**
     * 导出为CSV
     * @param {Object[]} phrases
     * @returns {string}
     */
    exportToCSV(phrases = null) {
        const dataToExport = phrases || await this.getAll();

        if (dataToExport.length === 0) return '';

        const headers = ['id', 'phrase', 'meaning', 'example', 'keywords', 'level', 'frequency', 'topic'];
        const rows = dataToExport.map(p => [
            p.id,
            `"${p.phrase.replace(/"/g, '""')}"`,
            `"${p.meaning.replace(/"/g, '""')}"`,
            `"${p.example.replace(/"/g, '""')}"`,
            `"${p.keywords.join(', ')}"`,
            p.level,
            p.frequency,
            p.topic
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
}

/**
 * ProgressStore - 学习进度存储
 * 管理用户的学习进度数据
 */
class ProgressStore {
    constructor(storage) {
        this.storage = storage;
        this.storeName = 'progress';
    }

    /**
     * 保存或更新学习进度
     * @param {Object} progressData
     * @returns {Promise<boolean>}
     */
    async save(progressData) {
        const progress = {
            phraseId: progressData.phraseId,
            userId: progressData.userId || 'default',
            status: progressData.status || 'new',
            repetitions: progressData.repetitions || 0,
            easeFactor: progressData.easeFactor || 2.5,
            interval: progressData.interval || 0,
            lastReview: progressData.lastReview || null,
            nextReview: progressData.nextReview || Date.now(),
            qualityHistory: progressData.qualityHistory || [],
            updatedAt: Date.now()
        };

        await this.storage.put(this.storeName, progress);
        return true;
    }

    /**
     * 获取单个语块的进度
     * @param {number} phraseId
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    async getByPhraseId(phraseId, userId = null) {
        const allProgress = await this.getAll(userId);
        return allProgress.find(p => p.phraseId === phraseId) || null;
    }

    /**
     * 获取用户的所有进度
     * @param {string} userId
     * @returns {Promise<Object[]>}
     */
    async getAll(userId = 'default') {
        const allProgress = await this.storage.getAll(this.storeName);
        return allProgress.filter(p => p.userId === userId);
    }

    /**
     * 删除进度
     * @param {number} phraseId
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async delete(phraseId, userId = null) {
        await this.storage.delete(this.storeName, phraseId);
        return true;
    }

    /**
     * 清空用户的所有进度
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async clearUserProgress(userId = 'default') {
        const allProgress = await this.getAll(userId);
        const operations = allProgress.map(p => ({
            type: 'delete',
            key: p.phraseId
        }));
        await this.storage.batch(this.storeName, operations);
        return true;
    }

    /**
     * 获取学习统计
     * @param {string} userId
     * @returns {Promise<Object>}
     */
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
        const todayStart = Utils.getTodayStart();
        const todayEnd = Utils.getTodayEnd();

        for (const progress of allProgress) {
            stats[progress.status] = (stats[progress.status] || 0) + 1;

            if (progress.nextReview && progress.nextReview <= now) {
                stats.dueToday++;
            }
        }

        return stats;
    }
}

/**
 * UserStore - 用户数据存储
 * 管理用户账号和配置
 */
class UserStore {
    constructor(storage) {
        this.storage = storage;
        this.storeName = 'users';
    }

    /**
     * 创建用户
     * @param {Object} userData
     * @returns {Promise<string>} - 返回用户ID
     */
    async create(userData) {
        const user = {
            id: userData.id || 'user_' + Date.now(),
            name: userData.name,
            avatar: userData.avatar || null,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            settings: userData.settings || {}
        };

        await this.storage.put(this.storeName, user);
        eventHub.emit(Events.USER_ADDED, user);
        return user.id;
    }

    /**
     * 获取用户
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    async get(userId) {
        return await this.storage.get(this.storeName, userId);
    }

    /**
     * 获取所有用户
     * @returns {Promise<Object[]>}
     */
    async getAll() {
        return await this.storage.getAll(this.storeName);
    }

    /**
     * 更新用户
     * @param {string} userId
     * @param {Object} updates
     * @returns {Promise<boolean>}
     */
    async update(userId, updates) {
        const user = await this.get(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        const updatedUser = {
            ...user,
            ...updates,
            id: userId, // 确保ID不被修改
            updatedAt: Date.now()
        };

        await this.storage.put(this.storeName, updatedUser);
        return true;
    }

    /**
     * 删除用户
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async delete(userId) {
        await this.storage.delete(this.storeName, userId);

        // 同时删除该用户的所有进度数据
        const progressStore = new ProgressStore(this.storage);
        await progressStore.clearUserProgress(userId);

        eventHub.emit(Events.USER_DELETED, { userId });
        return true;
    }

    /**
     * 更新最后登录时间
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async updateLastLogin(userId) {
        return await this.update(userId, { lastLoginAt: Date.now() });
    }
}

/**
 * VersionStore - 版本控制存储
 * 管理数据快照和版本
 */
class VersionStore {
    constructor(storage) {
        this.storage = storage;
        this.storeName = 'snapshots';
    }

    /**
     * 创建快照
     * @param {Object} snapshotData
     * @returns {Promise<number>} - 返回快照ID
     */
    async createSnapshot(snapshotData) {
        const snapshot = {
            id: null, // auto-generated
            name: snapshotData.name || `Snapshot ${Utils.formatDate(Date.now())}`,
            description: snapshotData.description || '',
            userId: snapshotData.userId || 'default',
            timestamp: Date.now(),
            phrases: snapshotData.phrases || [],
            progress: snapshotData.progress || [],
            size: JSON.stringify(snapshotData).length,
            tags: snapshotData.tags || []
        };

        const id = await this.storage.add(this.storeName, snapshot);
        eventHub.emit(Events.SNAPSHOT_CREATED, { id, ...snapshot });
        return id;
    }

    /**
     * 获取快照
     * @param {number} snapshotId
     * @returns {Promise<Object|null>}
     */
    async get(snapshotId) {
        return await this.storage.get(this.storeName, snapshotId);
    }

    /**
     * 获取用户的所有快照
     * @param {string} userId
     * @returns {Promise<Object[]>}
     */
    async getUserSnapshots(userId = 'default') {
        const allSnapshots = await this.storage.getAll(this.storeName);
        return allSnapshots
            .filter(s => s.userId === userId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * 删除快照
     * @param {number} snapshotId
     * @returns {Promise<boolean>}
     */
    async delete(snapshotId) {
        await this.storage.delete(this.storeName, snapshotId);
        return true;
    }

    /**
     * 恢复快照
     * @param {number} snapshotId
     * @returns {Promise<Object>}
     */
    async restore(snapshotId) {
        const snapshot = await this.get(snapshotId);
        if (!snapshot) {
            throw new Error(`Snapshot ${snapshotId} not found`);
        }

        // 恢复语块数据
        const phraseStore = new PhraseStore(this.storage);
        await phraseStore.clear();
        await phraseStore.addBatch(snapshot.phrases);

        // 恢复进度数据
        const progressStore = new ProgressStore(this.storage);
        await progressStore.clearUserProgress(snapshot.userId);
        for (const progress of snapshot.progress) {
            await progressStore.save(progress);
        }

        eventHub.emit(Events.SNAPSHOT_RESTORED, { snapshotId, snapshot });
        return snapshot;
    }

    /**
     * 自动创建每日快照
     * @param {string} userId
     * @returns {Promise<number|null>}
     */
    async autoDailySnapshot(userId = 'default') {
        // 检查今天是否已创建快照
        const snapshots = await this.getUserSnapshots(userId);
        const todayStart = Utils.getTodayStart();
        const todayEnd = Utils.getTodayEnd();

        const existingToday = snapshots.find(s => s.timestamp >= todayStart && s.timestamp <= todayEnd);
        if (existingToday) {
            return null; // 今天已创建
        }

        // 创建快照
        const phraseStore = new PhraseStore(this.storage);
        const progressStore = new ProgressStore(this.storage);

        return await this.createSnapshot({
            name: `Daily Backup ${Utils.formatDate(Date.now(), 'YYYY-MM-DD')}`,
            description: 'Automatic daily backup',
            userId,
            phrases: await phraseStore.getAll(),
            progress: await progressStore.getAll(userId),
            tags: ['auto', 'daily']
        });
    }
}
