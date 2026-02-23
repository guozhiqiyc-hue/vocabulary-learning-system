/**
 * Storage.js - 存储抽象层
 * 实现混合存储策略: localStorage + IndexedDB
 *
 * 策略:
 * - 配置数据 → localStorage (快速访问, <50KB)
 * - 学习进度 → IndexedDB (结构化, 数MB)
 * - 语块库 → IndexedDB (大数据, 数十MB)
 */

class Storage {
    constructor() {
        this.dbName = 'PhraseLearningDB';
        this.dbVersion = 1;
        this.db = null;
    }

    /**
     * 初始化存储系统
     */
    async init() {
        await this.initIndexedDB();
        console.log('[Storage] Storage system initialized');
    }

    /**
     * 初始化 IndexedDB
     */
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

    /**
     * 创建对象存储
     */
    createStores(db) {
        // 语块存储
        if (!db.objectStoreNames.contains('phrases')) {
            const phraseStore = db.createObjectStore('phrases', { keyPath: 'id', autoIncrement: true });
            phraseStore.createIndex('status', 'status', { unique: false });
            phraseStore.createIndex('level', 'level', { unique: false });
            phraseStore.createIndex('topic', 'topic', { unique: false });
            phraseStore.createIndex('lastReview', 'lastReview', { unique: false });
            phraseStore.createIndex('nextReview', 'nextReview', { unique: false });
            console.log('[Storage] Created phrases store');
        }

        // 用户数据存储
        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id' });
            userStore.createIndex('name', 'name', { unique: false });
            console.log('[Storage] Created users store');
        }

        // 用户学习进度存储
        if (!db.objectStoreNames.contains('progress')) {
            const progressStore = db.createObjectStore('progress', { keyPath: 'phraseId' });
            progressStore.createIndex('userId', 'userId', { unique: false });
            progressStore.createIndex('status', 'status', { unique: false });
            progressStore.createIndex('nextReview', 'nextReview', { unique: false });
            console.log('[Storage] Created progress store');
        }

        // 版本快照存储
        if (!db.objectStoreNames.contains('snapshots')) {
            const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
            snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
            snapshotStore.createIndex('userId', 'userId', { unique: false });
            console.log('[Storage] Created snapshots store');
        }

        // 批量操作日志
        if (!db.objectStoreNames.contains('operations')) {
            const operationStore = db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
            operationStore.createIndex('timestamp', 'timestamp', { unique: false });
            operationStore.createIndex('type', 'type', { unique: false });
            console.log('[Storage] Created operations store');
        }
    }

    /**
     * ========== LocalStorage 操作 ==========
     */

    /**
     * 保存数据到 localStorage
     */
    setLocalStorage(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(key, data);
            return true;
        } catch (error) {
            console.error('[Storage] localStorage set error:', error);
            return false;
        }
    }

    /**
     * 从 localStorage 获取数据
     */
    getLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('[Storage] localStorage get error:', error);
            return defaultValue;
        }
    }

    /**
     * 删除 localStorage 数据
     */
    removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('[Storage] localStorage remove error:', error);
            return false;
        }
    }

    /**
     * 获取用户特定的数据前缀
     */
    getUserPrefix(userId = null) {
        const currentUserId = userId || this.getLocalStorage('currentUserId', 'default');
        return `v6_user_${currentUserId}_`;
    }

    /**
     * ========== IndexedDB 通用操作 ==========
     */

    /**
     * 执行事务
     */
    async transaction(storeName, mode, callback) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);

            callback(store, transaction)
                .then(result => resolve(result))
                .catch(error => reject(error));
        });
    }

    /**
     * 添加记录
     */
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取记录
     */
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 更新记录
     */
    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除记录
     */
    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 清空存储
     */
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有记录
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 通过索引查询
     */
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

    /**
     * 范围查询
     */
    async getRange(storeName, indexName, lowerBound, upperBound) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.bound(lowerBound, upperBound);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 批量操作
     */
    async batch(storeName, operations) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const results = [];

            operations.forEach((op, index) => {
                const request = op.type === 'add' ? store.add(op.data) :
                               op.type === 'put' ? store.put(op.data) :
                               op.type === 'delete' ? store.delete(op.key) : null;

                if (request) {
                    request.onsuccess = () => results.push({ index, success: true });
                    request.onerror = () => results.push({ index, success: false, error: request.error });
                }
            });

            transaction.oncomplete = () => resolve(results);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * 统计记录数
     */
    async count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 导出所有数据
     */
    async exportAll() {
        const stores = ['phrases', 'users', 'progress', 'snapshots', 'operations'];
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

    /**
     * 清理过期数据
     */
    async cleanup() {
        // 可以在这里实现定期清理逻辑
        // 例如删除旧的操作日志等
        console.log('[Storage] Cleanup completed');
    }
}

// 导出单例实例
const storage = new Storage();
