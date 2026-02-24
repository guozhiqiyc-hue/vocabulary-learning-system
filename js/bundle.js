/** English Phrase Learning System v6.0 - Bundled Version */
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // js/algorithms/SuperMemo2.js
  var require_SuperMemo2 = __commonJS({
    "js/algorithms/SuperMemo2.js"(exports, module) {
      var SuperMemo24 = class {
        /**
         * 默认参数
         */
        static DEFAULTS = {
          easeFactor: 2.5,
          // 默认易度因子
          interval: 0,
          // 默认间隔(天)
          repetitions: 0,
          // 默认复习次数
          minEaseFactor: 1.3
          // 最小易度因子
        };
        /**
         * 计算下一次复习参数
         * @param {number} quality - 记忆质量评分 (1-5)
         * @param {number} repetitions - 当前复习次数
         * @param {number} easeFactor - 当前易度因子
         * @param {number} interval - 当前间隔(天)
         * @returns {Object} - { interval, repetitions, easeFactor }
         */
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
        /**
         * 检查是否需要复习
         * @param {number} lastReview - 上次复习时间戳
         * @param {number} interval - 复习间隔(天)
         * @returns {boolean}
         */
        static isDue(lastReview, interval) {
          if (!lastReview) {
            return true;
          }
          if (interval === 0) {
            return true;
          }
          const now = Date.now();
          const daysSinceReview = (now - lastReview) / (1e3 * 60 * 60 * 24);
          return daysSinceReview >= interval;
        }
        /**
         * 获取下次复习时间
         * @param {number} lastReview - 上次复习时间戳
         * @param {number} interval - 复习间隔(天)
         * @returns {number} - 下次复习时间戳
         */
        static getNextReviewTime(lastReview, interval) {
          if (!lastReview) {
            return Date.now();
          }
          return lastReview + interval * 24 * 60 * 60 * 1e3;
        }
        /**
         * 计算距离下次复习的剩余时间
         * @param {number} nextReview - 下次复习时间戳
         * @returns {Object} - { days, hours, minutes, isDue }
         */
        static getTimeUntilReview(nextReview) {
          const now = Date.now();
          const diff = nextReview - now;
          if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, isDue: true };
          }
          const days = Math.floor(diff / (24 * 60 * 60 * 1e3));
          const hours = Math.floor(diff % (24 * 60 * 60 * 1e3) / (60 * 60 * 1e3));
          const minutes = Math.floor(diff % (60 * 60 * 1e3) / (60 * 1e3));
          return { days, hours, minutes, isDue: false };
        }
        /**
         * 格式化复习时间
         * @param {number} nextReview - 下次复习时间戳
         * @returns {string}
         */
        static formatReviewTime(nextReview) {
          const timeLeft = this.getTimeUntilReview(nextReview);
          if (timeLeft.isDue) {
            return "\u73B0\u5728";
          }
          if (timeLeft.days > 0) {
            return `${timeLeft.days}\u5929\u540E`;
          } else if (timeLeft.hours > 0) {
            return `${timeLeft.hours}\u5C0F\u65F6\u540E`;
          } else {
            return `${timeLeft.minutes}\u5206\u949F\u540E`;
          }
        }
        /**
         * 计算复习优先级分数
         * @param {Object} progress - 学习进度对象
         * @returns {number} - 优先级分数(越高越优先)
         */
        static calculatePriority(progress) {
          let score = 0;
          if (!progress || progress.status === "new") {
            return 0;
          }
          if (progress.lastReview && progress.interval) {
            const now = Date.now();
            const daysSinceReview = (now - progress.lastReview) / (1e3 * 60 * 60 * 24);
            const overdueDays = daysSinceReview - progress.interval;
            if (overdueDays > 0) {
              score += overdueDays * 3;
            }
          }
          if (progress.qualityHistory && progress.qualityHistory.length > 0) {
            const avgQuality = progress.qualityHistory.reduce((sum, h) => sum + h.quality, 0) / progress.qualityHistory.length;
            score += (5 - avgQuality) * 2;
          }
          if (progress.easeFactor) {
            score += 3 - progress.easeFactor;
          }
          return score;
        }
        /**
         * 判断是否已掌握
         * @param {Object} progress - 学习进度对象
         * @returns {boolean}
         */
        static isMastered(progress) {
          if (!progress) {
            return false;
          }
          return progress.repetitions >= 5 && progress.easeFactor >= 2.5 && progress.interval >= 21;
        }
        /**
         * 生成学习报告
         * @param {Object[]} qualityHistory - 质量评分历史
         * @returns {Object}
         */
        static generateReport(qualityHistory) {
          if (!qualityHistory || qualityHistory.length === 0) {
            return {
              totalReviews: 0,
              averageQuality: 0,
              bestQuality: 0,
              worstQuality: 0,
              trend: "none"
            };
          }
          const qualities = qualityHistory.map((h) => h.quality);
          const totalReviews = qualities.length;
          const averageQuality = qualities.reduce((a, b) => a + b, 0) / totalReviews;
          const bestQuality = Math.max(...qualities);
          const worstQuality = Math.min(...qualities);
          let trend = "stable";
          if (totalReviews >= 3) {
            const recent = qualities.slice(-3);
            const earlier = qualities.slice(0, -3);
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
            if (recentAvg > earlierAvg + 0.5) {
              trend = "improving";
            } else if (recentAvg < earlierAvg - 0.5) {
              trend = "declining";
            }
          }
          return {
            totalReviews,
            averageQuality: Math.round(averageQuality * 10) / 10,
            bestQuality,
            worstQuality,
            trend
          };
        }
        /**
         * 获取质量评分的文本描述
         * @param {number} quality - 评分 (1-5)
         * @returns {string}
         */
        static getQualityLabel(quality) {
          const labels = {
            5: "\u5B8C\u7F8E\u8BB0\u5FC6",
            4: "\u826F\u597D\u8BB0\u5FC6",
            3: "\u52C9\u5F3A\u56DE\u5FC6",
            2: "\u8BB0\u5FC6\u56F0\u96BE",
            1: "\u5B8C\u5168\u5FD8\u8BB0"
          };
          return labels[quality] || "\u672A\u77E5";
        }
        /**
         * 获取质量评分的图标
         * @param {number} quality - 评分 (1-5)
         * @returns {string}
         */
        static getQualityIcon(quality) {
          const icons = {
            5: "\u2B50\u2B50\u2B50\u2B50\u2B50",
            4: "\u2B50\u2B50\u2B50\u2B50",
            3: "\u2B50\u2B50\u2B50",
            2: "\u2B50\u2B50",
            1: "\u2B50"
          };
          return icons[quality] || "";
        }
        /**
         * 获取质量评分的颜色类
         * @param {number} quality - 评分 (1-5)
         * @returns {string}
         */
        static getQualityColor(quality) {
          const colors = {
            5: "#4caf50",
            // 绿色
            4: "#8bc34a",
            // 浅绿
            3: "#ff9800",
            // 橙色
            2: "#ff5722",
            // 深橙
            1: "#f44336"
            // 红色
          };
          return colors[quality] || "#666";
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = SuperMemo24;
      }
    }
  });

  // js/core/Storage.js
  var Storage = class {
    constructor() {
      this.dbName = "PhraseLearningDB";
      this.dbVersion = 1;
      this.db = null;
    }
    /**
     * 初始化存储系统
     */
    async init() {
      await this.initIndexedDB();
      console.log("[Storage] Storage system initialized");
    }
    /**
     * 初始化 IndexedDB
     */
    async initIndexedDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        request.onerror = () => {
          console.error("[Storage] IndexedDB open error:", request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          this.db = request.result;
          console.log("[Storage] IndexedDB opened successfully");
          resolve(this.db);
        };
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          this.createStores(db);
          console.log("[Storage] IndexedDB schema upgraded");
        };
      });
    }
    /**
     * 创建对象存储
     */
    createStores(db) {
      if (!db.objectStoreNames.contains("phrases")) {
        const phraseStore = db.createObjectStore("phrases", { keyPath: "id", autoIncrement: true });
        phraseStore.createIndex("status", "status", { unique: false });
        phraseStore.createIndex("level", "level", { unique: false });
        phraseStore.createIndex("topic", "topic", { unique: false });
        phraseStore.createIndex("lastReview", "lastReview", { unique: false });
        phraseStore.createIndex("nextReview", "nextReview", { unique: false });
        console.log("[Storage] Created phrases store");
      }
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "id" });
        userStore.createIndex("name", "name", { unique: false });
        console.log("[Storage] Created users store");
      }
      if (!db.objectStoreNames.contains("progress")) {
        const progressStore = db.createObjectStore("progress", { keyPath: "phraseId" });
        progressStore.createIndex("userId", "userId", { unique: false });
        progressStore.createIndex("status", "status", { unique: false });
        progressStore.createIndex("nextReview", "nextReview", { unique: false });
        console.log("[Storage] Created progress store");
      }
      if (!db.objectStoreNames.contains("snapshots")) {
        const snapshotStore = db.createObjectStore("snapshots", { keyPath: "id", autoIncrement: true });
        snapshotStore.createIndex("timestamp", "timestamp", { unique: false });
        snapshotStore.createIndex("userId", "userId", { unique: false });
        console.log("[Storage] Created snapshots store");
      }
      if (!db.objectStoreNames.contains("operations")) {
        const operationStore = db.createObjectStore("operations", { keyPath: "id", autoIncrement: true });
        operationStore.createIndex("timestamp", "timestamp", { unique: false });
        operationStore.createIndex("type", "type", { unique: false });
        console.log("[Storage] Created operations store");
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
        console.error("[Storage] localStorage set error:", error);
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
        console.error("[Storage] localStorage get error:", error);
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
        console.error("[Storage] localStorage remove error:", error);
        return false;
      }
    }
    /**
     * 获取用户特定的数据前缀
     */
    getUserPrefix(userId = null) {
      const currentUserId = userId || this.getLocalStorage("currentUserId", "default");
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
        callback(store, transaction).then((result) => resolve(result)).catch((error) => reject(error));
      });
    }
    /**
     * 添加记录
     */
    async add(storeName, data) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeName, "readwrite");
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
        const transaction = this.db.transaction(storeName, "readonly");
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
        const transaction = this.db.transaction(storeName, "readwrite");
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
        const transaction = this.db.transaction(storeName, "readwrite");
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
        const transaction = this.db.transaction(storeName, "readwrite");
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
        const transaction = this.db.transaction(storeName, "readonly");
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
        const transaction = this.db.transaction(storeName, "readonly");
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
        const transaction = this.db.transaction(storeName, "readonly");
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
        const transaction = this.db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const results = [];
        operations.forEach((op, index) => {
          const request = op.type === "add" ? store.add(op.data) : op.type === "put" ? store.put(op.data) : op.type === "delete" ? store.delete(op.key) : null;
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
        const transaction = this.db.transaction(storeName, "readonly");
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
      const stores = ["phrases", "users", "progress", "snapshots", "operations"];
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
      console.log("[Storage] Cleanup completed");
    }
  };
  var storage = new Storage();

  // js/core/EventHub.js
  var EventHub = class {
    constructor() {
      this.events = {};
    }
    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} - 取消订阅的函数
     */
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(callback);
      return () => this.off(eventName, callback);
    }
    /**
     * 订阅一次性事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    once(eventName, callback) {
      const onceCallback = (...args) => {
        callback(...args);
        this.off(eventName, onceCallback);
      };
      this.on(eventName, onceCallback);
    }
    /**
     * 取消订阅
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
      if (!this.events[eventName]) {
        return;
      }
      if (callback) {
        this.events[eventName] = this.events[eventName].filter((cb) => cb !== callback);
      } else {
        delete this.events[eventName];
      }
    }
    /**
     * 触发事件
     * @param {string} eventName - 事件名称
     * @param {...any} args - 传递给回调的参数
     */
    emit(eventName, ...args) {
      if (!this.events[eventName]) {
        return;
      }
      this.events[eventName].forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[EventHub] Error in event handler for "${eventName}":`, error);
        }
      });
    }
    /**
     * 异步触发事件
     * @param {string} eventName - 事件名称
     * @param {...any} args - 传递给回调的参数
     */
    async emitAsync(eventName, ...args) {
      if (!this.events[eventName]) {
        return;
      }
      const promises = this.events[eventName].map((callback) => {
        try {
          return Promise.resolve(callback(...args));
        } catch (error) {
          console.error(`[EventHub] Error in async event handler for "${eventName}":`, error);
          return Promise.reject(error);
        }
      });
      await Promise.allSettled(promises);
    }
    /**
     * 检查是否有特定事件的监听器
     * @param {string} eventName - 事件名称
     * @returns {boolean}
     */
    has(eventName) {
      return !!this.events[eventName] && this.events[eventName].length > 0;
    }
    /**
     * 获取事件的监听器数量
     * @param {string} eventName - 事件名称
     * @returns {number}
     */
    listenerCount(eventName) {
      return this.events[eventName] ? this.events[eventName].length : 0;
    }
    /**
     * 清除所有事件监听器
     */
    clear() {
      this.events = {};
    }
    /**
     * 清除特定事件的所有监听器
     * @param {string} eventName - 事件名称
     */
    clearEvent(eventName) {
      delete this.events[eventName];
    }
  };
  var Events2 = {
    // 数据相关事件
    PHRASE_ADDED: "phrase:added",
    PHRASE_UPDATED: "phrase:updated",
    PHRASE_DELETED: "phrase:deleted",
    PHRASE_LEARNED: "phrase:learned",
    PHRASE_REVIEWED: "phrase:reviewed",
    // 用户相关事件
    USER_ADDED: "user:added",
    USER_SWITCHED: "user:switched",
    USER_DELETED: "user:deleted",
    // 学习相关事件
    LEARNING_STARTED: "learning:started",
    LEARNING_PAUSED: "learning:paused",
    LEARNING_RESUMED: "learning:resumed",
    LEARNING_COMPLETED: "learning:completed",
    LEARNING_PROGRESS_UPDATED: "learning:progress:updated",
    // 复习相关事件
    REVIEW_STARTED: "review:started",
    REVIEW_COMPLETED: "review:completed",
    REVIEW_CARD_SHOWN: "review:card:shown",
    // 配置相关事件
    CONFIG_UPDATED: "config:updated",
    SETTINGS_CHANGED: "settings:changed",
    // 数据管理事件
    DATA_EXPORTED: "data:exported",
    DATA_IMPORTED: "data:imported",
    DATA_BACKUP_CREATED: "data:backup:created",
    DATA_RESTORED: "data:restored",
    // 版本控制事件
    SNAPSHOT_CREATED: "snapshot:created",
    SNAPSHOT_RESTORED: "snapshot:restored",
    // UI相关事件
    TAB_CHANGED: "ui:tab:changed",
    MODAL_OPENED: "ui:modal:opened",
    MODAL_CLOSED: "ui:modal:closed",
    // 系统事件
    SYSTEM_READY: "system:ready",
    SYSTEM_ERROR: "system:error"
  };
  var eventHub2 = new EventHub();

  // js/core/Utils.js
  var Utils2 = {
    /**
     * ========== 日期时间相关 ==========
     */
    /**
     * 格式化日期
     * @param {number|Date} timestamp - 时间戳或日期对象
     * @param {string} format - 格式化模板
     * @returns {string}
     */
    formatDate(timestamp, format = "YYYY-MM-DD HH:mm:ss") {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return format.replace("YYYY", year).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
    },
    /**
     * 获取今天的开始时间戳
     * @returns {number}
     */
    getTodayStart() {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime();
    },
    /**
     * 获取今天的结束时间戳
     * @returns {number}
     */
    getTodayEnd() {
      const today = /* @__PURE__ */ new Date();
      today.setHours(23, 59, 59, 999);
      return today.getTime();
    },
    /**
     * 检查是否是今天
     * @param {number} timestamp
     * @returns {boolean}
     */
    isToday(timestamp) {
      const date = new Date(timestamp);
      const today = /* @__PURE__ */ new Date();
      return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    },
    /**
     * 计算两个时间戳之间的天数差
     * @param {number} timestamp1
     * @param {number} timestamp2
     * @returns {number}
     */
    daysBetween(timestamp1, timestamp2) {
      const diff = Math.abs(timestamp2 - timestamp1);
      return Math.floor(diff / (1e3 * 60 * 60 * 24));
    },
    /**
     * 格式化相对时间
     * @param {number} timestamp
     * @returns {string}
     */
    formatRelativeTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / (1e3 * 60));
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (minutes < 1) return "\u521A\u521A";
      if (minutes < 60) return `${minutes}\u5206\u949F\u524D`;
      if (hours < 24) return `${hours}\u5C0F\u65F6\u524D`;
      if (days < 7) return `${days}\u5929\u524D`;
      return this.formatDate(timestamp, "YYYY-MM-DD");
    },
    /**
     * ========== 数据格式化 ==========
     */
    /**
     * 格式化数字
     * @param {number} num
     * @param {number} decimals - 小数位数
     * @returns {string}
     */
    formatNumber(num, decimals = 0) {
      return num.toLocaleString("zh-CN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    },
    /**
     * 格式化百分比
     * @param {number} value
     * @param {number} total
     * @param {number} decimals - 小数位数
     * @returns {string}
     */
    formatPercent(value, total, decimals = 1) {
      if (total === 0) return "0%";
      const percent = value / total * 100;
      return `${percent.toFixed(decimals)}%`;
    },
    /**
     * 格式化文件大小
     * @param {number} bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    },
    /**
     * ========== 数据验证 ==========
     */
    /**
     * 验证邮箱地址
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    },
    /**
     * 验证URL
     * @param {string} url
     * @returns {boolean}
     */
    isValidURL(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    /**
     * 验证语块数据
     * @param {Object} phrase
     * @returns {Object} - { valid: boolean, errors: string[] }
     */
    validatePhrase(phrase) {
      const errors = [];
      if (!phrase.phrase || phrase.phrase.trim().length === 0) {
        errors.push("\u8BED\u5757\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (!phrase.meaning || phrase.meaning.trim().length === 0) {
        errors.push("\u91CA\u4E49\u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (!phrase.example || phrase.example.trim().length === 0) {
        errors.push("\u4F8B\u53E5\u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (!phrase.keywords || !Array.isArray(phrase.keywords) || phrase.keywords.length === 0) {
        errors.push("\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (!phrase.level || !["\u6838\u5FC3\u8BCD\u6C47", "\u8FDB\u9636\u8BCD\u6C47"].includes(phrase.level)) {
        errors.push('\u8BCD\u6C47\u7B49\u7EA7\u5FC5\u987B\u662F"\u6838\u5FC3\u8BCD\u6C47"\u6216"\u8FDB\u9636\u8BCD\u6C47"');
      }
      return {
        valid: errors.length === 0,
        errors
      };
    },
    /**
     * ========== 字符串处理 ==========
     */
    /**
     * 转义HTML特殊字符
     * @param {string} text
     * @returns {string}
     */
    escapeHTML(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },
    /**
     * 高亮关键词
     * @param {string} text
     * @param {string[]} keywords
     * @returns {string}
     */
    highlightKeywords(text, keywords) {
      let result = text;
      keywords.forEach((keyword) => {
        const regex = new RegExp(`(${keyword})`, "gi");
        result = result.replace(regex, '<span class="keyword">$1</span>');
      });
      return result;
    },
    /**
     * 截断文本
     * @param {string} text
     * @param {number} maxLength
     * @param {string} suffix
     * @returns {string}
     */
    truncate(text, maxLength, suffix = "...") {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - suffix.length) + suffix;
    },
    /**
     * 生成唯一ID
     * @returns {string}
     */
    generateId() {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
    /**
     * ========== 数组操作 ==========
     */
    /**
     * 数组去重
     * @param {Array} arr
     * @param {string} key - 对象数组去重的键
     * @returns {Array}
     */
    unique(arr, key = null) {
      if (!key) {
        return [...new Set(arr)];
      }
      const seen = /* @__PURE__ */ new Set();
      return arr.filter((item) => {
        const k = item[key];
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    },
    /**
     * 数组分组
     * @param {Array} arr
     * @param {string} key - 分组键
     * @returns {Object}
     */
    groupBy(arr, key) {
      return arr.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
          result[group] = [];
        }
        result[group].push(item);
        return result;
      }, {});
    },
    /**
     * 数组排序
     * @param {Array} arr
     * @param {string} key - 排序键
     * @param {string} order - 'asc' 或 'desc'
     * @returns {Array}
     */
    sortBy(arr, key, order = "asc") {
      return [...arr].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return order === "asc" ? comparison : -comparison;
      });
    },
    /**
     * 数组随机打乱
     * @param {Array} arr
     * @returns {Array}
     */
    shuffle(arr) {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    /**
     * 数组分块
     * @param {Array} arr
     * @param {number} size
     * @returns {Array[]}
     */
    chunk(arr, size) {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    },
    /**
     * ========== 对象操作 ==========
     */
    /**
     * 深度克隆
     * @param {any} obj
     * @returns {any}
     */
    deepClone(obj) {
      if (obj === null || typeof obj !== "object") return obj;
      if (obj instanceof Date) return new Date(obj);
      if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
      if (obj instanceof Object) {
        const cloned = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = this.deepClone(obj[key]);
          }
        }
        return cloned;
      }
    },
    /**
     * 深度合并对象
     * @param {Object} target
     * @param {Object[]} sources
     * @returns {Object}
     */
    deepMerge(target, ...sources) {
      if (!sources.length) return target;
      const source = sources.shift();
      if (this.isObject(target) && this.isObject(source)) {
        for (const key in source) {
          if (this.isObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            this.deepMerge(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
        }
      }
      return this.deepMerge(target, ...sources);
    },
    /**
     * 检查是否是对象
     * @param {any} item
     * @returns {boolean}
     */
    isObject(item) {
      return item && typeof item === "object" && !Array.isArray(item);
    },
    /**
     * 获取嵌套属性值
     * @param {Object} obj
     * @param {string} path - 点分隔的路径，如 'a.b.c'
     * @param {any} defaultValue
     * @returns {any}
     */
    get(obj, path, defaultValue = void 0) {
      const keys = path.split(".");
      let result = obj;
      for (const key of keys) {
        if (result && typeof result === "object" && key in result) {
          result = result[key];
        } else {
          return defaultValue;
        }
      }
      return result;
    },
    /**
     * ========== 性能工具 ==========
     */
    /**
     * 防抖函数
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    debounce(func, wait = 300) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    /**
     * 节流函数
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    throttle(func, wait = 300) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, wait);
        }
      };
    },
    /**
     * 延迟执行
     * @param {number} ms
     * @returns {Promise}
     */
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    /**
     * ========== DOM工具 ==========
     */
    /**
     * 查询元素
     * @param {string} selector
     * @param {Element} parent
     * @returns {Element|null}
     */
    $(selector, parent = document) {
      return parent.querySelector(selector);
    },
    /**
     * 查询所有元素
     * @param {string} selector
     * @param {Element} parent
     * @returns {NodeList}
     */
    $$(selector, parent = document) {
      return parent.querySelectorAll(selector);
    },
    /**
     * 添加事件监听
     * @param {Element} element
     * @param {string} event
     * @param {Function} handler
     * @param {Object} options
     */
    on(element, event, handler, options = {}) {
      element.addEventListener(event, handler, options);
    },
    /**
     * 移除事件监听
     * @param {Element} element
     * @param {string} event
     * @param {Function} handler
     */
    off(element, event, handler) {
      element.removeEventListener(event, handler);
    },
    /**
     * 添加CSS类
     * @param {Element} element
     * @param {string} className
     */
    addClass(element, className) {
      element.classList.add(className);
    },
    /**
     * 移除CSS类
     * @param {Element} element
     * @param {string} className
     */
    removeClass(element, className) {
      element.classList.remove(className);
    },
    /**
     * 切换CSS类
     * @param {Element} element
     * @param {string} className
     */
    toggleClass(element, className) {
      element.classList.toggle(className);
    },
    /**
     * ========== 存储工具 ==========
     */
    /**
     * 下载JSON文件
     * @param {Object} data
     * @param {string} filename
     */
    downloadJSON(data, filename) {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    /**
     * 下载CSV文件
     * @param {Array} data - 对象数组
     * @param {string} filename
     */
    downloadCSV(data, filename) {
      if (!data || data.length === 0) return;
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map((row) => headers.map((header) => {
          const value = row[header];
          const strValue = typeof value === "string" ? value : JSON.stringify(value);
          return `"${strValue.replace(/"/g, '""')}"`;
        }).join(","))
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    /**
     * 读取文件内容
     * @param {File} file
     * @returns {Promise<string>}
     */
    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    },
    /**
     * 解析JSON文件
     * @param {File} file
     * @returns {Promise<Object>}
     */
    parseJSONFile(file) {
      return this.readFile(file).then((content) => JSON.parse(content));
    }
  };

  // js/data/PhraseStore.js
  var PhraseStore = class {
    constructor(storage2) {
      this.storage = storage2;
      this.storeName = "phrases";
    }
    /**
     * 添加语块
     * @param {Object} phraseData - 语块数据
     * @returns {Promise<number>} - 返回新语块的ID
     */
    async add(phraseData) {
      const validation = Utils.validatePhrase(phraseData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }
      const phrase = {
        id: phraseData.id || Date.now(),
        phrase: phraseData.phrase.trim(),
        meaning: phraseData.meaning.trim(),
        example: phraseData.example.trim(),
        keywords: phraseData.keywords || [],
        level: phraseData.level || "\u6838\u5FC3\u8BCD\u6C47",
        frequency: phraseData.frequency || "\u4E2D\u9891",
        topic: phraseData.topic || "\u5176\u4ED6",
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
      const operations = phrases.map((phrase) => ({
        type: "add",
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
        id,
        // 确保ID不被修改
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
      const operations = ids.map((id) => ({ type: "delete", key: id }));
      const results = await this.storage.batch(this.storeName, operations);
      const deletedCount = results.filter((r) => r.success).length;
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
     * 获取语块总数
     * @returns {Promise<number>}
     */
    async count() {
      const allPhrases = await this.getAll();
      return allPhrases.length;
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
      return allPhrases.filter((p) => p.status === status);
    }
    /**
     * 按等级查询
     * @param {string} level - '核心词汇', '进阶词汇'
     * @returns {Promise<Object[]>}
     */
    async getByLevel(level) {
      return await this.storage.getByIndex(this.storeName, "level", level);
    }
    /**
     * 按主题查询
     * @param {string} topic
     * @returns {Promise<Object[]>}
     */
    async getByTopic(topic) {
      return await this.storage.getByIndex(this.storeName, "topic", topic);
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
      return allPhrases.filter((phrase) => {
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
          const match = phrase.keywords.some((kw) => {
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
        if (!progress || progress.status === "new") {
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
      if (phrase.progress && phrase.progress.lastReview && phrase.progress.interval) {
        const now = Date.now();
        const daysSinceReview = (now - phrase.progress.lastReview) / (1e3 * 60 * 60 * 24);
        const overdueDays = daysSinceReview - phrase.progress.interval;
        if (overdueDays > 0) {
          score += overdueDays * 3;
        }
      }
      if (phrase.progress && phrase.progress.qualityHistory && phrase.progress.qualityHistory.length > 0) {
        const avgQuality = phrase.progress.qualityHistory.reduce((sum, h) => sum + h.quality, 0) / phrase.progress.qualityHistory.length;
        score += (5 - avgQuality) * 2;
      }
      if (phrase.progress && phrase.progress.easeFactor) {
        score += 3 - phrase.progress.easeFactor;
      }
      if (phrase.level === "\u6838\u5FC3\u8BCD\u6C47") {
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
      const topics = new Set(allPhrases.map((p) => p.topic));
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
        stats.byLevel[phrase.level] = (stats.byLevel[phrase.level] || 0) + 1;
        stats.byTopic[phrase.topic] = (stats.byTopic[phrase.topic] || 0) + 1;
        stats.byFrequency[phrase.frequency] = (stats.byFrequency[phrase.frequency] || 0) + 1;
      }
      return stats;
    }
    /**
     * 导出为JSON
     * @param {Object[]} phrases
     * @returns {string}
     */
    async exportToJSON(phrases = null) {
      const dataToExport = phrases || await this.getAll();
      return JSON.stringify(dataToExport, null, 2);
    }
    /**
     * 导出为CSV
     * @param {Object[]} phrases
     * @returns {string}
     */
    async exportToCSV(phrases = null) {
      const dataToExport = phrases || await this.getAll();
      if (dataToExport.length === 0) return "";
      const headers = ["id", "phrase", "meaning", "example", "keywords", "level", "frequency", "topic"];
      const rows = dataToExport.map((p) => [
        p.id,
        `"${p.phrase.replace(/"/g, '""')}"`,
        `"${p.meaning.replace(/"/g, '""')}"`,
        `"${p.example.replace(/"/g, '""')}"`,
        `"${p.keywords.join(", ")}"`,
        p.level,
        p.frequency,
        p.topic
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }
  };
  var ProgressStore = class {
    constructor(storage2) {
      this.storage = storage2;
      this.storeName = "progress";
    }
    /**
     * 保存或更新学习进度
     * @param {Object} progressData
     * @returns {Promise<boolean>}
     */
    async save(progressData) {
      const progress = {
        phraseId: progressData.phraseId,
        userId: progressData.userId || "default",
        status: progressData.status || "new",
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
      return allProgress.find((p) => p.phraseId === phraseId) || null;
    }
    /**
     * 获取用户的所有进度
     * @param {string} userId
     * @returns {Promise<Object[]>}
     */
    async getAll(userId = "default") {
      const allProgress = await this.storage.getAll(this.storeName);
      return allProgress.filter((p) => p.userId === userId);
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
    async clearUserProgress(userId = "default") {
      const allProgress = await this.getAll(userId);
      const operations = allProgress.map((p) => ({
        type: "delete",
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
    async getStatistics(userId = "default") {
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
  };
  var UserStore = class {
    constructor(storage2) {
      this.storage = storage2;
      this.storeName = "users";
    }
    /**
     * 创建用户
     * @param {Object} userData
     * @returns {Promise<string>} - 返回用户ID
     */
    async create(userData) {
      const user = {
        id: userData.id || "user_" + Date.now(),
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
        id: userId,
        // 确保ID不被修改
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
  };
  var VersionStore = class {
    constructor(storage2) {
      this.storage = storage2;
      this.storeName = "snapshots";
    }
    /**
     * 创建快照
     * @param {Object} snapshotData
     * @returns {Promise<number>} - 返回快照ID
     */
    async createSnapshot(snapshotData) {
      const snapshot = {
        id: null,
        // auto-generated
        name: snapshotData.name || `Snapshot ${Utils.formatDate(Date.now())}`,
        description: snapshotData.description || "",
        userId: snapshotData.userId || "default",
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
    async getUserSnapshots(userId = "default") {
      const allSnapshots = await this.storage.getAll(this.storeName);
      return allSnapshots.filter((s) => s.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
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
      const phraseStore = new PhraseStore(this.storage);
      await phraseStore.clear();
      await phraseStore.addBatch(snapshot.phrases);
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
    async autoDailySnapshot(userId = "default") {
      const snapshots = await this.getUserSnapshots(userId);
      const todayStart = Utils.getTodayStart();
      const todayEnd = Utils.getTodayEnd();
      const existingToday = snapshots.find((s) => s.timestamp >= todayStart && s.timestamp <= todayEnd);
      if (existingToday) {
        return null;
      }
      const phraseStore = new PhraseStore(this.storage);
      const progressStore = new ProgressStore(this.storage);
      return await this.createSnapshot({
        name: `Daily Backup ${Utils.formatDate(Date.now(), "YYYY-MM-DD")}`,
        description: "Automatic daily backup",
        userId,
        phrases: await phraseStore.getAll(),
        progress: await progressStore.getAll(userId),
        tags: ["auto", "daily"]
      });
    }
  };

  // js/app.js
  var import_SuperMemo23 = __toESM(require_SuperMemo2());

  // js/features/DataMigration.js
  var DataMigration = class {
    constructor(storage2, phraseStore, progressStore, userStore) {
      this.storage = storage2;
      this.phraseStore = phraseStore;
      this.progressStore = progressStore;
      this.userStore = userStore;
    }
    /**
     * Check if migration is needed
     * @returns {boolean}
     */
    needsMigration() {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("phrase_") || key.startsWith("v5_user_"))) {
          return true;
        }
      }
      return false;
    }
    /**
     * Run migration
     * @returns {Promise<Object>} - Migration result
     */
    async migrate() {
      console.log("[DataMigration] Starting migration from v5 to v6...");
      const result = {
        phrasesMigrated: 0,
        usersMigrated: 0,
        progressMigrated: 0,
        errors: []
      };
      try {
        await this.migrateUsers(result);
        await this.migratePhrases(result);
        await this.migrateProgress(result);
        this.storage.setLocalStorage("v6_migration_complete", true);
        this.storage.setLocalStorage("v6_migration_date", Date.now());
        console.log("[DataMigration] Migration completed:", result);
        return result;
      } catch (error) {
        console.error("[DataMigration] Migration error:", error);
        result.errors.push(error.message);
        throw error;
      }
    }
    /**
     * Migrate users
     */
    async migrateUsers(result) {
      const v5UsersKey = "v5_users";
      const v5UsersData = this.storage.getLocalStorage(v5UsersKey);
      if (v5UsersData && Array.isArray(v5UsersData)) {
        for (const user of v5UsersData) {
          try {
            const existing = await this.userStore.get(user.id);
            if (!existing) {
              await this.userStore.create({
                id: user.id,
                name: user.name,
                createdAt: user.createdAt || Date.now()
              });
              result.usersMigrated++;
            }
          } catch (error) {
            result.errors.push(`Failed to migrate user ${user.id}: ${error.message}`);
          }
        }
      }
    }
    /**
     * Migrate phrases
     */
    async migratePhrases(result) {
      const v5PhrasesKey = "v5_phrase_data";
      const v5PhrasesData = this.storage.getLocalStorage(v5PhrasesKey);
      if (v5PhrasesData && Array.isArray(v5PhrasesData)) {
        for (const phrase of v5PhrasesData) {
          try {
            const existing = await this.phraseStore.get(phrase.id);
            if (!existing) {
              await this.phraseStore.add(phrase);
              result.phrasesMigrated++;
            }
          } catch (error) {
            result.errors.push(`Failed to migrate phrase ${phrase.id}: ${error.message}`);
          }
        }
      }
    }
    /**
     * Migrate progress data
     */
    async migrateProgress(result) {
      const users = await this.userStore.getAll();
      for (const user of users) {
        const prefix = user.id === "default" ? "" : `v5_user_${user.id}_`;
        const progressKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${prefix}phrase_`)) {
            progressKeys.push(key);
          }
        }
        for (const key of progressKeys) {
          try {
            const progressData = this.storage.getLocalStorage(key);
            if (progressData) {
              const phraseId = parseInt(key.replace(`${prefix}phrase_`, ""));
              await this.progressStore.save({
                phraseId,
                userId: user.id,
                ...progressData
              });
              result.progressMigrated++;
            }
          } catch (error) {
            result.errors.push(`Failed to migrate progress ${key}: ${error.message}`);
          }
        }
      }
    }
    /**
     * Export v5 data for backup
     * @returns {Object}
     */
    exportV5Data() {
      const data = {
        users: [],
        phrases: [],
        progress: {},
        exportedAt: Date.now()
      };
      const v5Users = this.storage.getLocalStorage("v5_users");
      if (v5Users) {
        data.users = v5Users;
      }
      const v5Phrases = this.storage.getLocalStorage("v5_phrase_data");
      if (v5Phrases) {
        data.phrases = v5Phrases;
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("phrase_") && !key.includes("v5_phrase_data")) {
          data.progress[key] = this.storage.getLocalStorage(key);
        }
      }
      return data;
    }
    /**
     * Clean up v5 data after successful migration
     * @returns {number} - Number of keys removed
     */
    cleanupV5Data() {
      let removedCount = 0;
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("v5_") || key.startsWith("phrase_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        this.storage.removeLocalStorage(key);
        removedCount++;
      });
      console.log(`[DataMigration] Cleaned up ${removedCount} v5 data keys`);
      return removedCount;
    }
    /**
     * Rollback migration
     * @returns {Promise<boolean>}
     */
    async rollback() {
      console.log("[DataMigration] Rolling back migration...");
      try {
        await this.phraseStore.clear();
        await this.progressStore.clearUserProgress("default");
        this.storage.removeLocalStorage("v6_migration_complete");
        this.storage.removeLocalStorage("v6_migration_date");
        console.log("[DataMigration] Rollback completed");
        return true;
      } catch (error) {
        console.error("[DataMigration] Rollback error:", error);
        return false;
      }
    }
    /**
     * Get migration status
     * @returns {Object}
     */
    getStatus() {
      return {
        complete: this.storage.getLocalStorage("v6_migration_complete", false),
        date: this.storage.getLocalStorage("v6_migration_date", null),
        needsMigration: this.needsMigration()
      };
    }
  };

  // js/features/LearningMode.js
  var import_SuperMemo2 = __toESM(require_SuperMemo2());
  var LearningMode = class {
    constructor(storage2, phraseStore, progressStore) {
      this.storage = storage2;
      this.phraseStore = phraseStore;
      this.progressStore = progressStore;
      this.currentPhrases = [];
      this.currentIndex = 0;
      this.isActive = false;
      this.isAnswerShown = false;
    }
    /**
     * Start learning mode with given phrases
     * @param {Array} phrases - Phrases to learn
     * @param {string} userId - User ID
     */
    async start(phrases, userId = "default") {
      this.currentPhrases = phrases;
      this.currentIndex = 0;
      this.userId = userId;
      this.isActive = true;
      this.isAnswerShown = false;
      if (phrases.length === 0) {
        this.showEmptyState();
        return;
      }
      this.setupKeyboardShortcuts();
      this.renderLearningCard();
      this.showModal();
    }
    /**
     * Render the current learning card
     */
    renderLearningCard() {
      if (this.currentIndex >= this.currentPhrases.length) {
        this.showComplete();
        return;
      }
      const phrase = this.currentPhrases[this.currentIndex];
      const total = this.currentPhrases.length;
      const current = this.currentIndex + 1;
      const percentage = Math.round(current / total * 100);
      const cleanPhrase = phrase.phrase.replace(/\*\*/g, "");
      const cleanExample = phrase.example.replace(/\*\*/g, "");
      const phraseHTML = this.highlightKeywords(cleanPhrase, phrase.keywords);
      const exampleHTML = this.highlightKeywords(cleanExample, phrase.keywords);
      const container = document.getElementById("learning-modal-body");
      container.innerHTML = `
            <div class="progress-section">
                <div class="progress-info">
                    <span>\u5B66\u4E60\u8FDB\u5EA6</span>
                    <span>${current} / ${total}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
            </div>

            <div class="phrase-card">
                <div class="phrase-number">\u8BED\u5757 #${phrase.id} ${this.getLevelBadge(phrase.level)}</div>
                <div class="phrase">${phraseHTML}</div>

                <div id="learning-answer-area" style="display: none;">
                    <div class="meaning">${phrase.meaning}</div>
                    <div class="example">${exampleHTML}</div>

                    <div class="word-details">
                        <h4>\u{1F4DD} \u91CD\u70B9\u8BCD\u6C47</h4>
                        <div class="keyword-list">
                            ${phrase.keywords.map((kw) => `<span class="keyword-item">${kw}</span>`).join("")}
                        </div>
                        <div style="margin-top: 10px; color: #666; font-size: 12px;">
                            <strong>\u4E3B\u9898:</strong> ${phrase.topic} |
                            <strong>\u9891\u7387:</strong> ${phrase.frequency}
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <button class="tts-button" data-action="speak-phrase" data-text="${this.escapeHTML(cleanPhrase)}">
                        \u{1F50A} \u64AD\u653E\u8BED\u5757
                    </button>
                    <button class="tts-button" data-action="speak-example" data-text="${this.escapeHTML(cleanExample)}">
                        \u{1F50A} \u64AD\u653E\u4F8B\u53E5
                    </button>
                </div>
            </div>

            <div id="learning-actions-area" class="learning-actions">
                <button class="btn-primary btn-large" id="show-answer-btn">
                    \u{1F4A1} \u663E\u793A\u7B54\u6848
                </button>
            </div>

            <div id="learning-quality-area" class="quality-buttons" style="display: none;">
                <p style="text-align: center; margin-bottom: 15px; color: #666;">
                    \u{1F446} \u8BC4\u5206\u60A8\u7684\u8BB0\u5FC6\u8D28\u91CF
                </p>
                <button class="quality-btn quality-5" data-quality="5">
                    \u2B50\u2B50\u2B50\u2B50\u2B50<br>\u5B8C\u7F8E
                </button>
                <button class="quality-btn quality-4" data-quality="4">
                    \u2B50\u2B50\u2B50\u2B50<br>\u826F\u597D
                </button>
                <button class="quality-btn quality-3" data-quality="3">
                    \u2B50\u2B50\u2B50<br>\u52C9\u5F3A
                </button>
                <button class="quality-btn quality-2" data-quality="2">
                    \u2B50\u2B50<br>\u56F0\u96BE
                </button>
                <button class="quality-btn quality-1" data-quality="1">
                    \u2B50<br>\u5FD8\u8BB0
                </button>
            </div>
        `;
      this.attachCardEventListeners();
      this.isAnswerShown = false;
    }
    /**
     * Highlight keywords in text
     */
    highlightKeywords(text, keywords) {
      let result = text;
      if (keywords && keywords.length > 0) {
        keywords.forEach((keyword) => {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
          result = result.replace(regex, '<span class="keyword">$1</span>');
        });
      }
      return result;
    }
    /**
     * Get level badge HTML
     */
    getLevelBadge(level) {
      const className = level === "\u6838\u5FC3\u8BCD\u6C47" ? "level-\u6838\u5FC3" : "level-\u8FDB\u9636";
      return `<span class="level-badge ${className}">${level}</span>`;
    }
    /**
     * Escape HTML for safe use in attributes
     */
    escapeHTML(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML.replace(/'/g, "&#39;");
    }
    /**
     * Attach event listeners to the current card
     */
    attachCardEventListeners() {
      document.querySelectorAll('[data-action^="speak-"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const text = e.target.dataset.text;
          this.speakPhrase(text);
        });
      });
      const showAnswerBtn = document.getElementById("show-answer-btn");
      if (showAnswerBtn) {
        showAnswerBtn.addEventListener("click", () => this.showAnswer());
      }
      document.querySelectorAll("[data-quality]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const quality = parseInt(e.target.closest("[data-quality]").dataset.quality);
          this.rate(quality);
        });
      });
    }
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
      this.keyHandler = (e) => {
        if (!this.isActive) return;
        if ((e.code === "Space" || e.code === "Enter") && !this.isAnswerShown) {
          e.preventDefault();
          this.showAnswer();
          return;
        }
        if (this.isAnswerShown && e.key >= "1" && e.key <= "5") {
          e.preventDefault();
          this.rate(parseInt(e.key));
          return;
        }
        if (e.code === "Escape") {
          e.preventDefault();
          this.exit();
          return;
        }
      };
      document.addEventListener("keydown", this.keyHandler);
    }
    /**
     * Remove keyboard shortcuts
     */
    removeKeyboardShortcuts() {
      if (this.keyHandler) {
        document.removeEventListener("keydown", this.keyHandler);
        this.keyHandler = null;
      }
    }
    /**
     * Show answer
     */
    showAnswer() {
      this.isAnswerShown = true;
      document.getElementById("learning-answer-area").style.display = "block";
      document.getElementById("learning-actions-area").style.display = "none";
      document.getElementById("learning-quality-area").style.display = "flex";
    }
    /**
     * Rate the current phrase and move to next
     */
    async rate(quality) {
      const phrase = this.currentPhrases[this.currentIndex];
      const progress = await this.progressStore.getByPhraseId(phrase.id, this.userId);
      const result = import_SuperMemo2.SuperMemo2.calculate(
        quality,
        progress?.repetitions || 0,
        progress?.easeFactor || 2.5,
        progress?.interval || 0
      );
      const newProgress = {
        phraseId: phrase.id,
        userId: this.userId,
        status: result.repetitions >= 5 && result.easeFactor >= 2.5 ? "mastered" : "learning",
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        interval: result.interval,
        lastReview: Date.now(),
        nextReview: import_SuperMemo2.SuperMemo2.getNextReviewTime(Date.now(), result.interval),
        qualityHistory: [
          ...progress?.qualityHistory || [],
          { quality, date: Date.now() }
        ]
      };
      await this.progressStore.save(newProgress);
      eventHub2.emit(Events2.PHRASE_REVIEWED, {
        phraseId: phrase.id,
        quality,
        result: newProgress
      });
      this.currentIndex++;
      this.renderLearningCard();
    }
    /**
     * Show completion screen
     */
    showComplete() {
      const container = document.getElementById("learning-modal-body");
      container.innerHTML = `
            <div class="phrase-card" style="padding: 60px 40px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">\u{1F389}</div>
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">\u5B66\u4E60\u5B8C\u6210!</h2>
                <p style="font-size: 18px; color: #666; margin-bottom: 30px;">
                    \u4ECA\u5929\u5171\u5B66\u4E60\u4E86 <strong>${this.currentPhrases.length}</strong> \u4E2A\u8BED\u5757
                </p>
                <button class="btn-primary btn-large" id="complete-exit-btn">
                    \u{1F3E0} \u8FD4\u56DE\u4E3B\u754C\u9762
                </button>
            </div>
        `;
      const exitBtn = document.getElementById("complete-exit-btn");
      if (exitBtn) {
        exitBtn.addEventListener("click", () => this.exit());
      }
      this.removeKeyboardShortcuts();
      this.isActive = false;
    }
    /**
     * Show empty state
     */
    showEmptyState() {
      const container = document.getElementById("learning-modal-body");
      container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">\u{1F4ED}</div>
                <p>\u6CA1\u6709\u9700\u8981\u5B66\u4E60\u7684\u5185\u5BB9</p>
                <button class="btn-primary" id="empty-exit-btn" style="margin-top: 20px;">
                    \u8FD4\u56DE
                </button>
            </div>
        `;
      const exitBtn = document.getElementById("empty-exit-btn");
      if (exitBtn) {
        exitBtn.addEventListener("click", () => this.exit());
      }
      this.removeKeyboardShortcuts();
      this.isActive = false;
    }
    /**
     * Show learning modal
     */
    showModal() {
      const modal = document.getElementById("learning-modal");
      if (modal) {
        modal.classList.add("active");
      }
    }
    /**
     * Hide learning modal
     */
    hideModal() {
      const modal = document.getElementById("learning-modal");
      if (modal) {
        modal.classList.remove("active");
      }
    }
    /**
     * Exit learning mode
     */
    exit() {
      this.removeKeyboardShortcuts();
      this.hideModal();
      this.isActive = false;
      this.currentPhrases = [];
      this.currentIndex = 0;
      this.isAnswerShown = false;
    }
    /**
     * Speak text using TTS
     */
    speakPhrase(text) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // js/features/ReviewMode.js
  var import_SuperMemo22 = __toESM(require_SuperMemo2());
  var ReviewMode = class {
    constructor(storage2, phraseStore, progressStore) {
      this.storage = storage2;
      this.phraseStore = phraseStore;
      this.progressStore = progressStore;
      this.currentPhrases = [];
      this.currentIndex = 0;
      this.isActive = false;
      this.isAnswerShown = false;
      this.reviewResults = [];
    }
    /**
     * Start review mode with given phrases
     * @param {Array} phrases - Phrases to review
     * @param {string} userId - User ID
     */
    async start(phrases, userId = "default") {
      this.currentPhrases = phrases;
      this.currentIndex = 0;
      this.userId = userId;
      this.isActive = true;
      this.isAnswerShown = false;
      this.reviewResults = [];
      if (phrases.length === 0) {
        this.showEmptyState();
        return;
      }
      this.setupKeyboardShortcuts();
      this.renderReviewCard();
      this.showModal();
    }
    /**
     * Render the current review card
     */
    renderReviewCard() {
      if (this.currentIndex >= this.currentPhrases.length) {
        this.showComplete();
        return;
      }
      const phrase = this.currentPhrases[this.currentIndex];
      const total = this.currentPhrases.length;
      const current = this.currentIndex + 1;
      const percentage = Math.round(current / total * 100);
      const progress = phrase.progress || {};
      const cleanPhrase = phrase.phrase.replace(/\*\*/g, "");
      const cleanExample = (phrase.example || "").replace(/\*\*/g, "");
      const phraseHTML = this.highlightKeywords(cleanPhrase, phrase.keywords);
      const exampleHTML = this.highlightKeywords(cleanExample, phrase.keywords);
      const container = document.getElementById("review-modal-body");
      container.innerHTML = `
            <div class="progress-section">
                <div class="progress-info">
                    <span>\u590D\u4E60\u8FDB\u5EA6</span>
                    <span>${current} / ${total}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
            </div>

            <div class="review-info">
                <div class="review-info-item">
                    <span class="label">\u4E0A\u6B21\u590D\u4E60</span>
                    <span class="value">${this.formatDate(progress.lastReview)}</span>
                </div>
                <div class="review-info-item">
                    <span class="label">\u95F4\u9694</span>
                    <span class="value">${progress.interval || 0} \u5929</span>
                </div>
                <div class="review-info-item">
                    <span class="label">\u590D\u4E60\u6B21\u6570</span>
                    <span class="value">${progress.repetitions || 0} \u6B21</span>
                </div>
            </div>

            <div class="phrase-card">
                <div class="phrase-number">\u8BED\u5757 #${phrase.id} ${this.getLevelBadge(phrase.level)}</div>
                <div class="phrase">${phraseHTML}</div>

                <div id="review-answer-area" style="display: none;">
                    <div class="meaning">${phrase.meaning || ""}</div>
                    ${phrase.example ? `<div class="example">${exampleHTML}</div>` : ""}

                    <div class="word-details">
                        <h4>\u{1F4DD} \u91CD\u70B9\u8BCD\u6C47</h4>
                        <div class="keyword-list">
                            ${(phrase.keywords || []).map((kw) => `<span class="keyword-item">${kw}</span>`).join("")}
                        </div>
                        <div style="margin-top: 10px; color: #666; font-size: 12px;">
                            <strong>\u4E3B\u9898:</strong> ${phrase.topic || "\u5176\u4ED6"} |
                            <strong>\u9891\u7387:</strong> ${phrase.frequency || "\u4E2D\u9891"}
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <button class="tts-button" data-action="speak-phrase" data-text="${this.escapeHTML(cleanPhrase)}">
                        \u{1F50A} \u64AD\u653E\u8BED\u5757
                    </button>
                    ${phrase.example ? `
                        <button class="tts-button" data-action="speak-example" data-text="${this.escapeHTML(cleanExample)}">
                            \u{1F50A} \u64AD\u653E\u4F8B\u53E5
                        </button>
                    ` : ""}
                </div>
            </div>

            <div id="review-actions-area" class="learning-actions">
                <button class="btn-primary btn-large" id="show-answer-btn">
                    \u{1F4A1} \u663E\u793A\u7B54\u6848
                </button>
            </div>

            <div id="review-quality-area" class="quality-buttons" style="display: none;">
                <p style="text-align: center; margin-bottom: 15px; color: #666;">
                    \u{1F446} \u8BC4\u5206\u60A8\u7684\u8BB0\u5FC6\u8D28\u91CF
                </p>
                <button class="quality-btn quality-5" data-quality="5">
                    \u2B50\u2B50\u2B50\u2B50\u2B50<br>\u5B8C\u7F8E
                </button>
                <button class="quality-btn quality-4" data-quality="4">
                    \u2B50\u2B50\u2B50\u2B50<br>\u826F\u597D
                </button>
                <button class="quality-btn quality-3" data-quality="3">
                    \u2B50\u2B50\u2B50<br>\u52C9\u5F3A
                </button>
                <button class="quality-btn quality-2" data-quality="2">
                    \u2B50\u2B50<br>\u56F0\u96BE
                </button>
                <button class="quality-btn quality-1" data-quality="1">
                    \u2B50<br>\u5FD8\u8BB0
                </button>
            </div>
        `;
      this.isAnswerShown = false;
      this.attachCardEventListeners();
    }
    /**
     * Highlight keywords in text
     */
    highlightKeywords(text, keywords) {
      let result = text;
      if (keywords && keywords.length > 0) {
        keywords.forEach((keyword) => {
          const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
          result = result.replace(regex, '<span class="keyword">$1</span>');
        });
      }
      return result;
    }
    /**
     * Get level badge HTML
     */
    getLevelBadge(level) {
      const className = level === "\u6838\u5FC3\u8BCD\u6C47" ? "level-\u6838\u5FC3" : "level-\u8FDB\u9636";
      return `<span class="level-badge ${className}">${level}</span>`;
    }
    /**
     * Escape HTML for safe use in attributes
     */
    escapeHTML(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML.replace(/'/g, "&#39;");
    }
    /**
     * Format date for display
     */
    formatDate(timestamp) {
      if (!timestamp) return "\u4ECE\u672A";
      const date = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diffDays = Math.floor((now - date) / (1e3 * 60 * 60 * 24));
      if (diffDays === 0) return "\u4ECA\u5929";
      if (diffDays === 1) return "\u6628\u5929";
      if (diffDays < 7) return `${diffDays}\u5929\u524D`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}\u5468\u524D`;
      return `${Math.floor(diffDays / 30)}\u6708\u524D`;
    }
    /**
     * Attach event listeners to the current card
     */
    attachCardEventListeners() {
      document.querySelectorAll('[data-action^="speak-"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const text = e.target.dataset.text;
          this.speakPhrase(text);
        });
      });
      const showAnswerBtn = document.getElementById("show-answer-btn");
      if (showAnswerBtn) {
        showAnswerBtn.addEventListener("click", () => this.showAnswer());
      }
      document.querySelectorAll("[data-quality]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const quality = parseInt(e.target.closest("[data-quality]").dataset.quality);
          this.rate(quality);
        });
      });
    }
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
      this.keyHandler = (e) => {
        if (!this.isActive) return;
        if ((e.code === "Space" || e.code === "Enter") && !this.isAnswerShown) {
          e.preventDefault();
          this.showAnswer();
          return;
        }
        if (this.isAnswerShown && e.key >= "1" && e.key <= "5") {
          e.preventDefault();
          this.rate(parseInt(e.key));
          return;
        }
        if (e.code === "Escape") {
          e.preventDefault();
          this.exit();
          return;
        }
      };
      document.addEventListener("keydown", this.keyHandler);
    }
    /**
     * Remove keyboard shortcuts
     */
    removeKeyboardShortcuts() {
      if (this.keyHandler) {
        document.removeEventListener("keydown", this.keyHandler);
        this.keyHandler = null;
      }
    }
    /**
     * Show answer
     */
    showAnswer() {
      this.isAnswerShown = true;
      document.getElementById("review-answer-area").style.display = "block";
      document.getElementById("review-actions-area").style.display = "none";
      document.getElementById("review-quality-area").style.display = "flex";
    }
    /**
     * Rate the current phrase and move to next
     */
    async rate(quality) {
      const phrase = this.currentPhrases[this.currentIndex];
      const progress = await this.progressStore.getByPhraseId(phrase.id, this.userId);
      const result = import_SuperMemo22.SuperMemo2.calculate(
        quality,
        progress?.repetitions || 0,
        progress?.easeFactor || 2.5,
        progress?.interval || 0
      );
      const newProgress = {
        phraseId: phrase.id,
        userId: this.userId,
        status: import_SuperMemo22.SuperMemo2.isMastered(result) ? "mastered" : result.repetitions > 0 ? "reviewing" : "learning",
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        interval: result.interval,
        lastReview: Date.now(),
        nextReview: import_SuperMemo22.SuperMemo2.getNextReviewTime(Date.now(), result.interval),
        qualityHistory: [
          ...progress?.qualityHistory || [],
          { quality, date: Date.now() }
        ]
      };
      await this.progressStore.save(newProgress);
      this.reviewResults.push({
        phraseId: phrase.id,
        phrase: phrase.phrase,
        quality,
        result: newProgress
      });
      eventHub2.emit(Events2.PHRASE_REVIEWED, {
        phraseId: phrase.id,
        quality,
        result: newProgress
      });
      this.currentIndex++;
      this.renderReviewCard();
    }
    /**
     * Show completion screen with summary
     */
    showComplete() {
      const container = document.getElementById("review-modal-body");
      const avgQuality = this.reviewResults.length > 0 ? (this.reviewResults.reduce((sum, r) => sum + r.quality, 0) / this.reviewResults.length).toFixed(1) : 0;
      const qualityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      this.reviewResults.forEach((r) => {
        qualityCounts[r.quality]++;
      });
      container.innerHTML = `
            <div class="phrase-card" style="padding: 40px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">\u{1F389}</div>
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">\u590D\u4E60\u5B8C\u6210!</h2>

                <div class="review-summary">
                    <p style="font-size: 18px; color: #666; margin-bottom: 20px;">
                        \u4ECA\u5929\u5171\u590D\u4E60\u4E86 <strong>${this.reviewResults.length}</strong> \u4E2A\u8BED\u5757
                    </p>

                    <div class="review-stats">
                        <div class="stat-row">
                            <span class="stat-label">\u5E73\u5747\u8BC4\u5206:</span>
                            <span class="stat-value">${avgQuality} / 5.0</span>
                        </div>
                        <div class="quality-distribution">
                            ${Object.entries(qualityCounts).map(([q, count]) => `
                                <div class="quality-bar">
                                    <span class="q-label">${"\u2B50".repeat(parseInt(q))}</span>
                                    <div class="q-bar-container">
                                        <div class="q-bar" style="width: ${count / this.reviewResults.length * 100}%; background: ${import_SuperMemo22.SuperMemo2.getQualityColor(parseInt(q))}"></div>
                                    </div>
                                    <span class="q-count">${count}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                </div>

                <button class="btn-primary btn-large" id="complete-exit-btn" style="margin-top: 30px;">
                    \u{1F3E0} \u8FD4\u56DE\u4E3B\u754C\u9762
                </button>
            </div>

            <style>
                .review-summary {
                    text-align: left;
                    background: var(--bg-primary);
                    padding: 20px;
                    border-radius: 12px;
                    margin: 20px 0;
                }
                .review-stats {
                    margin-top: 15px;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }
                .stat-label {
                    color: #666;
                    font-size: 14px;
                }
                .stat-value {
                    font-weight: bold;
                    color: var(--primary-color);
                }
                .quality-distribution {
                    margin-top: 15px;
                }
                .quality-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }
                .q-label {
                    min-width: 60px;
                    font-size: 12px;
                }
                .q-bar-container {
                    flex: 1;
                    height: 8px;
                    background: #f0f0f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .q-bar {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .q-count {
                    min-width: 30px;
                    text-align: right;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        `;
      const exitBtn = document.getElementById("complete-exit-btn");
      if (exitBtn) {
        exitBtn.addEventListener("click", () => this.exit());
      }
      this.removeKeyboardShortcuts();
      this.isActive = false;
    }
    /**
     * Show empty state
     */
    showEmptyState() {
      const container = document.getElementById("review-modal-body");
      container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">\u{1F389}</div>
                <p style="font-size: 18px; margin-bottom: 10px;">\u592A\u68D2\u4E86!</p>
                <p>\u6682\u65F6\u6CA1\u6709\u9700\u8981\u590D\u4E60\u7684\u5185\u5BB9</p>
                <button class="btn-primary" id="empty-exit-btn" style="margin-top: 20px;">
                    \u8FD4\u56DE
                </button>
            </div>
        `;
      const exitBtn = document.getElementById("empty-exit-btn");
      if (exitBtn) {
        exitBtn.addEventListener("click", () => this.exit());
      }
      this.removeKeyboardShortcuts();
      this.isActive = false;
    }
    /**
     * Show review modal
     */
    showModal() {
      const modal = document.getElementById("review-modal");
      if (modal) {
        modal.classList.add("active");
      }
    }
    /**
     * Hide review modal
     */
    hideModal() {
      const modal = document.getElementById("review-modal");
      if (modal) {
        modal.classList.remove("active");
      }
    }
    /**
     * Exit review mode
     */
    exit() {
      this.removeKeyboardShortcuts();
      this.hideModal();
      this.isActive = false;
      this.currentPhrases = [];
      this.currentIndex = 0;
      this.isAnswerShown = false;
      this.reviewResults = [];
    }
    /**
     * Speak text using TTS
     */
    speakPhrase(text) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // js/features/Editor.js
  var Editor = class {
    constructor(storage2, phraseStore) {
      this.storage = storage2;
      this.phraseStore = phraseStore;
      this.currentPhrases = [];
      this.selectedPhraseId = null;
      this.filter = {
        search: "",
        level: "",
        topic: ""
      };
      this.eventListeners = [];
      this.isInitialized = false;
    }
    /**
     * 初始化编辑器
     */
    async init() {
      this.removeEventListeners();
      await this.loadPhrases();
      await this.loadTopics();
      this.render();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      this.isInitialized = true;
    }
    /**
     * 移除事件监听器
     */
    removeEventListeners() {
      this.eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventListeners = [];
    }
    /**
     * 添加事件监听器（追踪）
     */
    addTrackedListener(element, event, handler) {
      element.addEventListener(event, handler);
      this.eventListeners.push({ element, event, handler });
    }
    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
      const escHandler = (e) => {
        if (e.key === "Escape") {
          const modal = document.getElementById("editor-modal");
          if (modal) {
            this.closeModal();
          }
        }
      };
      document.addEventListener("keydown", escHandler);
      this.eventListeners.push({ element: document, event: "keydown", handler: escHandler });
    }
    /**
     * 加载语块列表
     */
    async loadPhrases() {
      let phrases = await this.phraseStore.getAll();
      if (this.filter.search) {
        const search = this.filter.search.toLowerCase();
        phrases = phrases.filter(
          (p) => p.phrase.toLowerCase().includes(search) || p.meaning.toLowerCase().includes(search) || p.keywords.some((k) => k.toLowerCase().includes(search))
        );
      }
      if (this.filter.level) {
        phrases = phrases.filter((p) => p.level === this.filter.level);
      }
      if (this.filter.topic) {
        phrases = phrases.filter((p) => p.topic === this.filter.topic);
      }
      this.currentPhrases = phrases;
    }
    /**
     * 加载主题列表
     */
    async loadTopics() {
      const topics = await this.phraseStore.getTopics();
      const select = document.getElementById("editor-topic-filter");
      if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">\u5168\u90E8\u4E3B\u9898</option>' + topics.map((topic) => `<option value="${topic}">${topic}</option>`).join("");
        select.value = currentValue;
      }
    }
    /**
     * 渲染编辑器
     */
    render() {
      const container = document.getElementById("editor-content");
      if (!container) return;
      if (this.currentPhrases.length === 0) {
        container.innerHTML = `
                <div class="editor-empty-state">
                    <div class="empty-state-icon">\u{1F4DD}</div>
                    <h3>\u6682\u65E0\u8BED\u5757</h3>
                    <p>\u70B9\u51FB"\u6DFB\u52A0\u8BED\u5757"\u5F00\u59CB\u6DFB\u52A0</p>
                    <button class="btn-primary" onclick="window.app.editor.showAddForm()" style="margin-top: 20px;">
                        \u2795 \u6DFB\u52A0\u8BED\u5757
                    </button>
                </div>
            `;
        return;
      }
      const itemsHTML = this.currentPhrases.map((phrase) => `
            <div class="phrase-item ${this.selectedPhraseId === phrase.id ? "selected" : ""}"
                 data-id="${phrase.id}" onclick="window.app.editor.selectPhrase(${phrase.id})">
                <div class="phrase-item-header">
                    <div class="phrase-item-content">
                        <div class="phrase-item-text">${this.escapeHTML(phrase.phrase)}</div>
                        <div class="phrase-item-meaning">${this.escapeHTML(phrase.meaning)}</div>
                        <div class="phrase-item-example">${this.escapeHTML(phrase.example).replace(/\*\*/g, "")}</div>
                        <div class="tags">
                            <span class="tag level ${phrase.level === "\u8FDB\u9636\u8BCD\u6C47" ? "level-\u8FDB\u9636" : ""}">${phrase.level}</span>
                            <span class="tag topic">${phrase.topic}</span>
                            <span class="tag frequency">${phrase.frequency}</span>
                        </div>
                    </div>
                    <div class="phrase-item-actions">
                        <button class="icon-btn-small" onclick="event.stopPropagation(); window.app.editor.editPhrase(${phrase.id})" title="\u7F16\u8F91">
                            \u270F\uFE0F
                        </button>
                        <button class="icon-btn-small danger" onclick="event.stopPropagation(); window.app.editor.deletePhrase(${phrase.id})" title="\u5220\u9664">
                            \u{1F5D1}\uFE0F
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
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
      const searchInput = document.getElementById("editor-search");
      if (searchInput) {
        const debouncedSearch = Utils2.debounce((e) => {
          this.filter.search = e.target.value;
          this.loadPhrases();
          this.render();
        }, 300);
        this.addTrackedListener(searchInput, "input", debouncedSearch);
      }
      const levelFilter = document.getElementById("editor-level-filter");
      if (levelFilter) {
        const handler = (e) => {
          this.filter.level = e.target.value;
          this.loadPhrases();
          this.render();
        };
        this.addTrackedListener(levelFilter, "change", handler);
      }
      const topicFilter = document.getElementById("editor-topic-filter");
      if (topicFilter) {
        const handler = (e) => {
          this.filter.topic = e.target.value;
          this.loadPhrases();
          this.render();
        };
        this.addTrackedListener(topicFilter, "change", handler);
      }
      const addBtn = document.getElementById("add-phrase-btn");
      if (addBtn) {
        const handler = () => this.showAddForm();
        this.addTrackedListener(addBtn, "click", handler);
      }
      const batchEditBtn = document.getElementById("batch-edit-btn");
      if (batchEditBtn) {
        const handler = () => alert("\u6279\u91CF\u7F16\u8F91\u529F\u80FD\u5373\u5C06\u63A8\u51FA\uFF01");
        this.addTrackedListener(batchEditBtn, "click", handler);
      }
      const exportBtn = document.getElementById("export-editor-btn");
      if (exportBtn) {
        const handler = () => alert("\u5BFC\u51FA\u529F\u80FD\u5373\u5C06\u63A8\u51FA\uFF01");
        this.addTrackedListener(exportBtn, "click", handler);
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
      this.showModal("add");
    }
    /**
     * 编辑语块
     */
    async editPhrase(id) {
      const phrase = await this.phraseStore.get(id);
      if (!phrase) {
        alert("\u8BED\u5757\u4E0D\u5B58\u5728");
        return;
      }
      this.showModal("edit", phrase);
    }
    /**
     * 删除语块
     */
    async deletePhrase(id) {
      if (!confirm("\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u8BED\u5757\u5417\uFF1F")) {
        return;
      }
      try {
        await this.phraseStore.delete(id);
        await this.loadPhrases();
        this.render();
        await this.loadTopics();
        alert("\u5220\u9664\u6210\u529F");
      } catch (error) {
        alert("\u5220\u9664\u5931\u8D25: " + error.message);
      }
    }
    /**
     * 显示模态框
     */
    showModal(mode, phrase = null) {
      const isEdit = mode === "edit";
      const title = isEdit ? "\u7F16\u8F91\u8BED\u5757" : "\u6DFB\u52A0\u8BED\u5757";
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
                                <label for="edit-phrase">\u8BED\u5757 *</label>
                                <input type="text" id="edit-phrase" required
                                       value="${isEdit ? this.escapeHTML(phrase.phrase) : ""}"
                                       placeholder="\u4F8B\u5982: be good at doing">
                            </div>

                            <div class="form-group">
                                <label for="edit-meaning">\u91CA\u4E49 *</label>
                                <input type="text" id="edit-meaning" required
                                       value="${isEdit ? this.escapeHTML(phrase.meaning) : ""}"
                                       placeholder="\u4F8B\u5982: \u64C5\u957F\u505A\u67D0\u4E8B">
                            </div>

                            <div class="form-group">
                                <label for="edit-example">\u4F8B\u53E5 *</label>
                                <textarea id="edit-example" required rows="3"
                                          placeholder="\u4F8B\u5982: He is good at playing basketball.">${isEdit ? this.escapeHTML(phrase.example) : ""}</textarea>
                                <small style="color: #666;">\u7528 ** \u5305\u88F9\u5173\u952E\u8BCD\uFF0C\u5982: He is **good at** playing.</small>
                            </div>

                            <div class="form-group">
                                <label for="edit-keywords">\u5173\u952E\u8BCD *</label>
                                <input type="text" id="edit-keywords" required
                                       value="${isEdit ? phrase.keywords.join(", ") : ""}"
                                       placeholder="\u4F8B\u5982: good, play (\u7528\u9017\u53F7\u5206\u9694)">
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-level">\u7B49\u7EA7</label>
                                    <select id="edit-level">
                                        <option value="\u6838\u5FC3\u8BCD\u6C47" ${isEdit && phrase.level === "\u6838\u5FC3\u8BCD\u6C47" ? "selected" : ""}>\u6838\u5FC3\u8BCD\u6C47</option>
                                        <option value="\u8FDB\u9636\u8BCD\u6C47" ${isEdit && phrase.level === "\u8FDB\u9636\u8BCD\u6C47" ? "selected" : ""}>\u8FDB\u9636\u8BCD\u6C47</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="edit-frequency">\u9891\u7387</label>
                                    <select id="edit-frequency">
                                        <option value="\u9AD8\u9891" ${isEdit && phrase.frequency === "\u9AD8\u9891" ? "selected" : ""}>\u9AD8\u9891</option>
                                        <option value="\u4E2D\u9891" ${isEdit && phrase.frequency === "\u4E2D\u9891" ? "selected" : ""}>\u4E2D\u9891</option>
                                        <option value="\u4F4E\u9891" ${isEdit && phrase.frequency === "\u4F4E\u9891" ? "selected" : ""}>\u4F4E\u9891</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="edit-topic">\u4E3B\u9898</label>
                                <input type="text" id="edit-topic" list="topics-list"
                                       value="${isEdit ? this.escapeHTML(phrase.topic) : ""}"
                                       placeholder="\u4F8B\u5982: \u80FD\u529B\u63CF\u8FF0">
                                <datalist id="topics-list">
                                    <option value="\u80FD\u529B\u63CF\u8FF0">
                                    <option value="\u5174\u8DA3\u8868\u8FBE">
                                    <option value="\u60C5\u611F\u8868\u8FBE">
                                    <option value="\u4E60\u60EF\u8868\u8FBE">
                                    <option value="\u884C\u52A8\u5EFA\u8BAE">
                                </datalist>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    ${isEdit ? "\u4FDD\u5B58" : "\u6DFB\u52A0"}
                                </button>
                                <button type="button" class="btn-secondary" onclick="window.app.editor.closeModal()">
                                    \u53D6\u6D88
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
      let modal = document.getElementById("editor-modal");
      if (modal) {
        modal.remove();
      }
      document.body.insertAdjacentHTML("beforeend", modalHTML);
      const form = document.getElementById("phrase-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.savePhrase(isEdit ? phrase.id : null);
      });
    }
    /**
     * 保存语块
     */
    async savePhrase(id) {
      const phrase = {
        phrase: document.getElementById("edit-phrase").value.trim(),
        meaning: document.getElementById("edit-meaning").value.trim(),
        example: document.getElementById("edit-example").value.trim(),
        keywords: document.getElementById("edit-keywords").value.split(",").map((k) => k.trim()).filter((k) => k),
        level: document.getElementById("edit-level").value,
        frequency: document.getElementById("edit-frequency").value,
        topic: document.getElementById("edit-topic").value.trim() || "\u5176\u4ED6"
      };
      if (!phrase.phrase || !phrase.meaning || !phrase.example) {
        alert("\u8BF7\u586B\u5199\u6240\u6709\u5FC5\u586B\u5B57\u6BB5");
        return;
      }
      if (phrase.keywords.length === 0) {
        alert("\u8BF7\u81F3\u5C11\u6DFB\u52A0\u4E00\u4E2A\u5173\u952E\u8BCD");
        return;
      }
      const submitBtn = document.querySelector('#phrase-form button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "\u4FDD\u5B58\u4E2D...";
      try {
        if (id) {
          await this.phraseStore.update(id, phrase);
          alert("\u66F4\u65B0\u6210\u529F");
        } else {
          await this.phraseStore.add(phrase);
          alert("\u6DFB\u52A0\u6210\u529F");
        }
        this.closeModal();
        await this.loadPhrases();
        await this.loadTopics();
        this.render();
        if (window.app) {
          await window.app.updateDashboard();
        }
      } catch (error) {
        console.error("[Editor] Save error:", error);
        alert("\u4FDD\u5B58\u5931\u8D25: " + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
    /**
     * 关闭模态框
     */
    closeModal() {
      const modal = document.getElementById("editor-modal");
      if (modal) {
        modal.remove();
      }
    }
    /**
     * HTML转义
     */
    escapeHTML(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // js/app.js
  var App = class {
    constructor() {
      this.storage = storage;
      this.phraseStore = null;
      this.progressStore = null;
      this.userStore = null;
      this.versionStore = null;
      this.currentUserId = "default";
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
        console.log("[App] Initializing application...");
        await this.storage.init();
        this.phraseStore = new PhraseStore(this.storage);
        this.progressStore = new ProgressStore(this.storage);
        this.userStore = new UserStore(this.storage);
        this.versionStore = new VersionStore(this.storage);
        this.currentUserId = this.storage.getLocalStorage("currentUserId", "default");
        this.dataMigration = new DataMigration(
          this.storage,
          this.phraseStore,
          this.progressStore,
          this.userStore
        );
        this.learningMode = new LearningMode(
          this.storage,
          this.phraseStore,
          this.progressStore
        );
        this.reviewMode = new ReviewMode(
          this.storage,
          this.phraseStore,
          this.progressStore
        );
        this.editor = new Editor(
          this.storage,
          this.phraseStore
        );
        await this.checkMigration();
        await this.loadDefaultPhrases();
        this.initUI();
        this.setupEventListeners();
        eventHub2.emit(Events2.SYSTEM_READY);
        this.isInitialized = true;
        this.hideLoadingScreen();
        console.log("[App] Application initialized successfully");
      } catch (error) {
        console.error("[App] Initialization error:", error);
        this.showError("\u521D\u59CB\u5316\u5931\u8D25: " + error.message);
      }
    }
    /**
     * Check if data migration from v5 is needed
     */
    async checkMigration() {
      const hasMigrated = this.storage.getLocalStorage("v6_migrated", false);
      if (!hasMigrated) {
        const hasV5Data = this.dataMigration.needsMigration();
        if (hasV5Data) {
          console.log("[App] V5 data detected, starting migration...");
          await this.migrateFromV5();
        }
        this.storage.setLocalStorage("v6_migrated", true);
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
      console.log("[App] Migrating data from v5...");
      try {
        const result = await this.dataMigration.migrate();
        console.log("[App] Migration completed:", result);
        if (result.errors.length > 0) {
          console.warn("[App] Migration completed with errors:", result.errors);
        }
      } catch (error) {
        console.error("[App] Migration error:", error);
      }
    }
    /**
     * Load default phrases if database is empty
     */
    async loadDefaultPhrases() {
      const count = await this.storage.count("phrases");
      if (count === 0) {
        console.log("[App] No phrases found, loading defaults...");
        try {
          const response = await fetch("./data/default-phrases.json");
          const data = await response.json();
          if (data.phrases && Array.isArray(data.phrases)) {
            await this.phraseStore.addBatch(data.phrases);
            console.log(`[App] Loaded ${data.phrases.length} default phrases`);
          }
        } catch (error) {
          console.warn("[App] Could not load default phrases:", error);
        }
      }
    }
    /**
     * Initialize UI components
     */
    initUI() {
      this.updateConfigInfo();
      this.updateDashboard();
      this.updateUserSelector();
      this.loadTopics();
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
      document.querySelectorAll(".nav-tab").forEach((tab) => {
        tab.addEventListener("click", (e) => {
          const tabName = e.currentTarget.dataset.tab;
          this.switchTab(tabName);
        });
      });
      const userSelect = document.getElementById("user-select");
      if (userSelect) {
        userSelect.addEventListener("change", (e) => {
          this.switchUser(e.target.value);
        });
      }
      const addUserBtn = document.getElementById("add-user-btn");
      if (addUserBtn) {
        addUserBtn.addEventListener("click", () => {
          this.showModal("add-user-modal");
        });
      }
      const addUserForm = document.getElementById("add-user-form");
      if (addUserForm) {
        addUserForm.addEventListener("submit", (e) => {
          e.preventDefault();
          this.addUser();
        });
      }
      const settingsBtn = document.getElementById("settings-btn");
      if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
          this.showSettings();
        });
      }
      const importExportBtn = document.getElementById("import-export-btn");
      if (importExportBtn) {
        importExportBtn.addEventListener("click", () => {
          this.showImportExport();
        });
      }
      const backupBtn = document.getElementById("backup-btn");
      if (backupBtn) {
        backupBtn.addEventListener("click", () => {
          this.createBackup();
        });
      }
      const startLearningBtn = document.getElementById("start-learning-btn");
      if (startLearningBtn) {
        startLearningBtn.addEventListener("click", () => {
          this.startLearning();
        });
      }
      this.setupQuickActions();
      document.querySelectorAll(".modal-close").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const modal = e.target.closest(".modal");
          if (modal) {
            this.hideModal(modal.id);
          }
        });
      });
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            this.hideModal(modal.id);
          }
        });
      });
      eventHub2.on(Events2.USER_SWITCHED, () => {
        this.updateDashboard();
      });
      eventHub2.on(Events2.PHRASE_LEARNED, () => {
        this.updateDashboard();
      });
      eventHub2.on(Events2.PHRASE_REVIEWED, () => {
        this.updateDashboard();
      });
    }
    /**
     * Setup quick action buttons
     */
    setupQuickActions() {
      const quickLearnBtn = document.getElementById("quick-learn-btn");
      if (quickLearnBtn) {
        quickLearnBtn.addEventListener("click", () => {
          this.startRandomLearning();
        });
      }
      const quickReviewBtn = document.getElementById("quick-review-btn");
      if (quickReviewBtn) {
        quickReviewBtn.addEventListener("click", () => {
          this.startReview();
        });
      }
      const browseAllBtn = document.getElementById("browse-all-btn");
      if (browseAllBtn) {
        browseAllBtn.addEventListener("click", () => {
          this.switchTab("learning");
        });
      }
      const importPdfBtn = document.getElementById("import-pdf-btn");
      if (importPdfBtn) {
        importPdfBtn.addEventListener("click", () => {
          this.showImportPDF();
        });
      }
    }
    /**
     * Switch tab
     */
    switchTab(tabName) {
      document.querySelectorAll(".nav-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === tabName);
      });
      document.querySelectorAll(".tab-pane").forEach((pane) => {
        pane.classList.remove("active");
        pane.style.display = "none";
      });
      const activePane = document.getElementById(`${tabName}-tab`);
      if (activePane) {
        activePane.classList.add("active");
        activePane.style.display = "block";
      }
      eventHub2.emit(Events2.TAB_CHANGED, tabName);
      this.loadTabContent(tabName);
    }
    /**
     * Load tab-specific content
     */
    async loadTabContent(tabName) {
      switch (tabName) {
        case "dashboard":
          await this.updateDashboard();
          break;
        case "learning":
          await this.loadLearningContent();
          break;
        case "review":
          await this.loadReviewContent();
          break;
        case "editor":
          await this.loadEditorContent();
          break;
        case "statistics":
          await this.loadStatisticsContent();
          break;
      }
    }
    /**
     * Update dashboard
     */
    async updateDashboard() {
      try {
        const allPhrases = await this.phraseStore.getAll();
        const progressStats = await this.progressStore.getStatistics(this.currentUserId);
        const plan = await this.getTodayPlan();
        document.getElementById("plan-time").textContent = plan.estimatedTime || "--";
        document.getElementById("plan-review").textContent = (plan.reviewCount || 0) + "\u4E2A";
        document.getElementById("plan-new").textContent = (plan.newCount || 0) + "\u4E2A";
        document.getElementById("plan-total").textContent = (plan.total || 0) + "\u4E2A";
        document.getElementById("stat-total").textContent = allPhrases.length;
        document.getElementById("stat-learned").textContent = progressStats.learning + progressStats.reviewing + progressStats.mastered;
        document.getElementById("stat-mastered").textContent = progressStats.mastered;
        document.getElementById("stat-due").textContent = progressStats.dueToday;
      } catch (error) {
        console.error("[App] Error updating dashboard:", error);
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
      const allPhrases = await this.phraseStore.getAll();
      const allProgress = await this.progressStore.getAll(this.currentUserId);
      const learnedPhraseIds = new Set(allProgress.map((p) => p.phraseId));
      const newPhrases = allPhrases.filter((p) => !learnedPhraseIds.has(p.id));
      const todayNew = newPhrases.slice(0, config.dailyNewLimit);
      console.log("[App] getTodayPlan - allPhrases:", allPhrases.length);
      console.log("[App] getTodayPlan - duePhrases:", duePhrases.length);
      console.log("[App] getTodayPlan - newPhrases:", newPhrases.length);
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
      if (minutes < 1) return "30\u79D2\u5185";
      if (minutes < 60) return `${minutes}\u5206\u949F`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}\u5C0F\u65F6${mins}\u5206\u949F`;
    }
    /**
     * Get user configuration
     */
    getUserConfig() {
      const prefix = this.storage.getUserPrefix(this.currentUserId);
      return this.storage.getLocalStorage(prefix + "config", {
        dailyReviewLimit: 40,
        dailyNewLimit: 20,
        avgTimePerReview: 30,
        avgTimePerNew: 60,
        scheduleStrategy: "balanced",
        selectedPreset: "balanced"
      });
    }
    /**
     * Update user selector
     */
    async updateUserSelector() {
      const users = await this.userStore.getAll();
      const select = document.getElementById("user-select");
      if (select) {
        select.innerHTML = users.map(
          (user) => `<option value="${user.id}" ${user.id === this.currentUserId ? "selected" : ""}>
                    ${user.name}
                </option>`
        ).join("");
      }
    }
    /**
     * Load topics
     */
    async loadTopics() {
      const topics = await this.phraseStore.getTopics();
      const select = document.getElementById("editor-topic-filter");
      if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">\u5168\u90E8\u4E3B\u9898</option>' + topics.map((topic) => `<option value="${topic}">${topic}</option>`).join("");
        select.value = currentValue;
      }
    }
    /**
     * Switch user
     */
    async switchUser(userId) {
      if (userId === this.currentUserId) return;
      this.currentUserId = userId;
      this.storage.setLocalStorage("currentUserId", userId);
      await this.userStore.updateLastLogin(userId);
      eventHub2.emit(Events2.USER_SWITCHED, userId);
      console.log("[App] Switched to user:", userId);
    }
    /**
     * Add user
     */
    async addUser() {
      const nameInput = document.getElementById("new-user-name");
      const name = nameInput.value.trim();
      if (!name) {
        alert("\u8BF7\u8F93\u5165\u7528\u6237\u540D\u79F0");
        return;
      }
      try {
        const userId = await this.userStore.create({ name });
        this.hideModal("add-user-modal");
        await this.updateUserSelector();
        if (confirm(`\u7528\u6237"${name}"\u521B\u5EFA\u6210\u529F\uFF01\u662F\u5426\u5207\u6362\u5230\u8BE5\u7528\u6237\uFF1F`)) {
          await this.switchUser(userId);
          document.getElementById("user-select").value = userId;
        }
        nameInput.value = "";
      } catch (error) {
        alert("\u521B\u5EFA\u7528\u6237\u5931\u8D25: " + error.message);
      }
    }
    /**
     * Show settings
     */
    showSettings() {
      const modal = document.getElementById("settings-modal");
      if (modal) {
        modal.classList.add("active");
        this.initSettingsValues();
      }
    }
    /**
     * Close settings
     */
    closeSettings() {
      const modal = document.getElementById("settings-modal");
      if (modal) {
        modal.classList.remove("active");
      }
    }
    /**
     * Initialize settings values
     */
    initSettingsValues() {
      const config = this.getUserConfig();
      const reviewInput = document.getElementById("setting-review-limit");
      const newInput = document.getElementById("setting-new-limit");
      if (reviewInput) reviewInput.value = config.dailyReviewLimit;
      if (newInput) newInput.value = config.dailyNewLimit;
      const reviewValue = document.getElementById("setting-review-value");
      const newValue = document.getElementById("setting-new-value");
      if (reviewValue) reviewValue.textContent = config.dailyReviewLimit + "\u4E2A";
      if (newValue) newValue.textContent = config.dailyNewLimit + "\u4E2A";
      this.updateConfigInfo();
      document.querySelectorAll(".mode-card").forEach((card) => {
        card.classList.remove("active");
      });
      if (config.selectedPreset) {
        const activeCard = document.getElementById(`mode-${config.selectedPreset}`);
        if (activeCard) {
          activeCard.classList.add("active");
        }
      }
    }
    /**
     * Select mode preset
     */
    selectModePreset(mode) {
      const presets = {
        balanced: { dailyReviewLimit: 40, dailyNewLimit: 20, dailyTime: "30-40\u5206\u949F" },
        review: { dailyReviewLimit: 60, dailyNewLimit: 10, dailyTime: "35-45\u5206\u949F" },
        new: { dailyReviewLimit: 20, dailyNewLimit: 40, dailyTime: "35-50\u5206\u949F" }
      };
      const preset = presets[mode];
      if (!preset) return;
      const config = this.getUserConfig();
      config.dailyReviewLimit = preset.dailyReviewLimit;
      config.dailyNewLimit = preset.dailyNewLimit;
      config.scheduleStrategy = mode;
      config.selectedPreset = mode;
      const reviewInput = document.getElementById("setting-review-limit");
      const newInput = document.getElementById("setting-new-limit");
      if (reviewInput) reviewInput.value = preset.dailyReviewLimit;
      if (newInput) newInput.value = preset.dailyNewLimit;
      const reviewValue = document.getElementById("setting-review-value");
      const newValue = document.getElementById("setting-new-value");
      if (reviewValue) reviewValue.textContent = preset.dailyReviewLimit + "\u4E2A";
      if (newValue) newValue.textContent = preset.dailyNewLimit + "\u4E2A";
      document.querySelectorAll(".mode-card").forEach((card) => {
        card.classList.remove("active");
      });
      const activeCard = document.getElementById(`mode-${mode}`);
      if (activeCard) {
        activeCard.classList.add("active");
      }
      this.updateConfigInfo();
    }
    /**
     * Update setting value display
     */
    updateSettingValue(type, value) {
      if (type === "review") {
        const reviewValue = document.getElementById("setting-review-value");
        if (reviewValue) reviewValue.textContent = value + "\u4E2A";
      } else if (type === "new") {
        const newValue = document.getElementById("setting-new-value");
        if (newValue) newValue.textContent = value + "\u4E2A";
      }
      document.querySelectorAll(".mode-card").forEach((card) => {
        card.classList.remove("active");
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
      let timeText = "30-40\u5206\u949F";
      if (config.selectedPreset) {
        const presets = {
          balanced: "30-40\u5206\u949F",
          review: "35-45\u5206\u949F",
          new: "35-50\u5206\u949F"
        };
        timeText = presets[config.selectedPreset] || "30-40\u5206\u949F";
      }
      const infoReview = document.getElementById("info-review");
      const infoNew = document.getElementById("info-new");
      const infoTotal = document.getElementById("info-total");
      const infoTime = document.getElementById("info-time");
      if (infoReview) infoReview.textContent = review + "\u4E2A";
      if (infoNew) infoNew.textContent = newCount + "\u4E2A";
      if (infoTotal) infoTotal.textContent = total + "\u4E2A";
      if (infoTime) infoTime.textContent = timeText;
    }
    /**
     * Save settings
     */
    saveSettings() {
      const config = this.getUserConfig();
      const reviewInput = document.getElementById("setting-review-limit");
      const newInput = document.getElementById("setting-new-limit");
      if (reviewInput) config.dailyReviewLimit = parseInt(reviewInput.value);
      if (newInput) config.dailyNewLimit = parseInt(newInput.value);
      const prefix = this.storage.getUserPrefix(this.currentUserId);
      this.storage.setLocalStorage(prefix + "config", config);
      this.updateConfigInfo();
      this.updateDashboard();
      this.closeSettings();
      console.log("[App] Settings saved:", config);
    }
    /**
     * Show import/export dialog
     */
    showImportExport() {
      console.log("[App] Show import/export");
    }
    /**
     * Create backup
     */
    async createBackup() {
      try {
        const data = await this.storage.exportAll();
        const filename = `backup_${Utils2.formatDate(Date.now(), "YYYYMMDD_HHmmss")}.json`;
        Utils2.downloadJSON(data, filename);
        alert("\u5907\u4EFD\u5DF2\u521B\u5EFA\uFF01");
      } catch (error) {
        alert("\u521B\u5EFA\u5907\u4EFD\u5931\u8D25: " + error.message);
      }
    }
    /**
     * Start learning
     */
    async startLearning() {
      console.log("[App] Starting today's learning...");
      const plan = await this.getTodayPlan();
      console.log("[App] Today's plan:", plan);
      if (plan.total === 0) {
        alert("\u4ECA\u5929\u6CA1\u6709\u9700\u8981\u5B66\u4E60\u7684\u5185\u5BB9\uFF01");
        return;
      }
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
        alert("\u592A\u68D2\u4E86\uFF01\u6CA1\u6709\u9700\u8981\u590D\u4E60\u7684\u5185\u5BB9\u3002");
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
    speakPhrase(text, lang = "en-US") {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn("Speech synthesis not supported");
      }
    }
    /**
     * Load learning content
     */
    async loadLearningContent() {
      const container = document.getElementById("learning-container");
      if (container) {
        const allPhrases = await this.phraseStore.getAll();
        const allProgress = await this.progressStore.getAll(this.currentUserId);
        const learnedPhraseIds = new Set(allProgress.map((p) => p.phraseId));
        const newPhrases = allPhrases.filter((p) => !learnedPhraseIds.has(p.id));
        const inProgressPhrases = allProgress.filter((p) => p.status === "learning" || p.status === "reviewing");
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
                        <h2>\u{1F4DA} \u5B66\u4E60\u4E2D\u5FC3</h2>
                        <p class="subtitle">\u9009\u62E9\u4E00\u4E2A\u5B66\u4E60\u6A21\u5F0F\u5F00\u59CB</p>
                    </div>

                    <div class="learning-cards">
                        <div class="learning-card" data-mode="new">
                            <div class="card-icon">\u{1F195}</div>
                            <h3>\u5B66\u4E60\u65B0\u8BED\u5757</h3>
                            <p class="card-description">\u5F00\u59CB\u5B66\u4E60\u65B0\u7684\u8BED\u5757\uFF0C\u6269\u5C55\u4F60\u7684\u8BCD\u6C47\u91CF</p>
                            <div class="card-stats">
                                <span class="stat">\u5F85\u5B66\u4E60: ${newPhrases.length} \u4E2A</span>
                            </div>
                            <button class="btn-primary" id="learn-new-btn" ${newPhrases.length === 0 ? "disabled" : ""}>
                                \u5F00\u59CB\u5B66\u4E60
                            </button>
                        </div>

                        <div class="learning-card" data-mode="continue">
                            <div class="card-icon">\u{1F4D6}</div>
                            <h3>\u7EE7\u7EED\u5B66\u4E60</h3>
                            <p class="card-description">\u7EE7\u7EED\u5B66\u4E60\u6B63\u5728\u8FDB\u884C\u7684\u8BED\u5757</p>
                            <div class="card-stats">
                                <span class="stat">\u5B66\u4E60\u4E2D: ${learningPhrases.length} \u4E2A</span>
                            </div>
                            <button class="btn-primary" id="continue-learning-btn" ${learningPhrases.length === 0 ? "disabled" : ""}>
                                \u7EE7\u7EED\u5B66\u4E60
                            </button>
                        </div>

                        <div class="learning-card" data-mode="random">
                            <div class="card-icon">\u{1F3B2}</div>
                            <h3>\u968F\u673A\u5B66\u4E60</h3>
                            <p class="card-description">\u968F\u673A\u9009\u62E9\u4E00\u4E2A\u8BED\u5757\u8FDB\u884C\u5B66\u4E60</p>
                            <div class="card-stats">
                                <span class="stat">\u603B\u8BED\u5757\u6570: ${await this.phraseStore.count()}</span>
                            </div>
                            <button class="btn-primary" id="random-learn-btn">
                                \u968F\u673A\u5B66\u4E60
                            </button>
                        </div>
                    </div>

                    <div class="learning-tips">
                        <h4>\u{1F4A1} \u5B66\u4E60\u63D0\u793A</h4>
                        <ul>
                            <li>\u5EFA\u8BAE\u6BCF\u5929\u5B66\u4E60 10-20 \u4E2A\u65B0\u8BED\u5757</li>
                            <li>\u4F7F\u7528 <kbd>\u7A7A\u683C</kbd> \u6216 <kbd>\u56DE\u8F66</kbd> \u663E\u793A\u7B54\u6848</li>
                            <li>\u4F7F\u7528 <kbd>1-5</kbd> \u6570\u5B57\u952E\u5FEB\u901F\u8BC4\u5206</li>
                            <li>\u8BDA\u5B9E\u8BC4\u5206\u6709\u52A9\u4E8E\u7CFB\u7EDF\u66F4\u597D\u5730\u5B89\u6392\u590D\u4E60</li>
                        </ul>
                    </div>
                </div>
            `;
        const learnNewBtn = document.getElementById("learn-new-btn");
        if (learnNewBtn && newPhrases.length > 0) {
          learnNewBtn.addEventListener("click", () => {
            const config = this.getUserConfig();
            this.showLearningModal(newPhrases.slice(0, config.dailyNewLimit));
          });
        }
        const continueBtn = document.getElementById("continue-learning-btn");
        if (continueBtn && learningPhrases.length > 0) {
          continueBtn.addEventListener("click", () => {
            this.showLearningModal(learningPhrases.slice(0, 20));
          });
        }
        const randomBtn = document.getElementById("random-learn-btn");
        if (randomBtn) {
          randomBtn.addEventListener("click", () => this.startRandomLearning());
        }
      }
    }
    /**
     * Load review content
     */
    async loadReviewContent() {
      const container = document.getElementById("review-container");
      if (container) {
        const duePhrases = await this.phraseStore.getDuePhrases(this.currentUserId);
        const progressStats = await this.progressStore.getStatistics(this.currentUserId);
        const sortedDue = this.phraseStore.sortByPriority(duePhrases);
        container.innerHTML = `
                <div class="review-content">
                    <div class="review-header">
                        <h2>\u{1F504} \u590D\u4E60\u4E2D\u5FC3</h2>
                        <p class="subtitle">\u590D\u4E60\u5230\u671F\u7684\u8BED\u5757\uFF0C\u5DE9\u56FA\u8BB0\u5FC6</p>
                    </div>

                    <div class="review-summary-cards">
                        <div class="summary-card due">
                            <div class="card-icon">\u23F0</div>
                            <div class="card-value">${progressStats.dueToday}</div>
                            <div class="card-label">\u5F85\u590D\u4E60</div>
                        </div>
                        <div class="summary-card learning">
                            <div class="card-icon">\u{1F4DA}</div>
                            <div class="card-value">${progressStats.learning}</div>
                            <div class="card-label">\u5B66\u4E60\u4E2D</div>
                        </div>
                        <div class="summary-card reviewing">
                            <div class="card-icon">\u{1F504}</div>
                            <div class="card-value">${progressStats.reviewing}</div>
                            <div class="card-label">\u590D\u4E60\u4E2D</div>
                        </div>
                        <div class="summary-card mastered">
                            <div class="card-icon">\u2B50</div>
                            <div class="card-value">${progressStats.mastered}</div>
                            <div class="card-label">\u5DF2\u638C\u63E1</div>
                        </div>
                    </div>

                    ${duePhrases.length > 0 ? `
                        <div class="review-action-section">
                            <div class="review-alert">
                                <span class="alert-icon">\u{1F4E2}</span>
                                <span class="alert-text">\u6709 <strong>${duePhrases.length}</strong> \u4E2A\u8BED\u5757\u9700\u8981\u590D\u4E60</span>
                            </div>
                            <button class="btn-primary btn-large" id="start-review-btn">
                                \u{1F680} \u5F00\u59CB\u590D\u4E60 (${duePhrases.length} \u4E2A)
                            </button>
                        </div>

                        <div class="review-list">
                            <h3>\u5F85\u590D\u4E60\u5217\u8868</h3>
                            <div class="phrase-list">
                                ${sortedDue.slice(0, 10).map((item) => {
          const phrase = item;
          const progress = item.progress || {};
          const timeUntil = import_SuperMemo23.SuperMemo2.getTimeUntilReview(progress.nextReview);
          return `
                                        <div class="phrase-list-item">
                                            <div class="phrase-info">
                                                <span class="phrase-text">${phrase.phrase}</span>
                                                <span class="phrase-meaning">${phrase.meaning}</span>
                                            </div>
                                            <div class="phrase-meta">
                                                <span class="review-count">${progress.repetitions || 0}\u6B21</span>
                                                ${timeUntil.isDue ? '<span class="due-badge">\u5230\u671F</span>' : `<span class="next-review">${import_SuperMemo23.SuperMemo2.formatReviewTime(progress.nextReview)}</span>`}
                                            </div>
                                        </div>
                                    `;
        }).join("")}
                                ${duePhrases.length > 10 ? `
                                    <div class="more-items">
                                        \u8FD8\u6709 ${duePhrases.length - 10} \u4E2A\u8BED\u5757...
                                    </div>
                                ` : ""}
                            </div>
                        </div>
                    ` : `
                        <div class="review-empty">
                            <div class="empty-icon">\u{1F389}</div>
                            <h3>\u592A\u68D2\u4E86\uFF01</h3>
                            <p>\u6682\u65F6\u6CA1\u6709\u9700\u8981\u590D\u4E60\u7684\u5185\u5BB9</p>
                            <p class="empty-hint">\u5F53\u6709\u8BED\u5757\u5230\u671F\u590D\u4E60\u65F6\uFF0C\u4F1A\u5728\u8FD9\u91CC\u663E\u793A</p>
                        </div>
                    `}

                    <div class="review-tips">
                        <h4>\u{1F4A1} \u590D\u4E60\u63D0\u793A</h4>
                        <ul>
                            <li>\u6309\u65F6\u590D\u4E60\u80FD\u6709\u6548\u5DE9\u56FA\u957F\u671F\u8BB0\u5FC6</li>
                            <li>\u8BC4\u5206\u6807\u51C6\uFF1A5=\u5B8C\u7F8E, 4=\u826F\u597D, 3=\u52C9\u5F3A, 2=\u56F0\u96BE, 1=\u5FD8\u8BB0</li>
                            <li>\u7CFB\u7EDF\u4F1A\u6839\u636E\u4F60\u7684\u8BC4\u5206\u81EA\u52A8\u8C03\u6574\u4E0B\u6B21\u590D\u4E60\u65F6\u95F4</li>
                            <li>\u8FDE\u7EED5\u6B21\u8BC4\u52064+\u7684\u8BED\u5757\u4F1A\u88AB\u6807\u8BB0\u4E3A"\u5DF2\u638C\u63E1"</li>
                        </ul>
                    </div>
                </div>
            `;
        const startReviewBtn = document.getElementById("start-review-btn");
        if (startReviewBtn) {
          startReviewBtn.addEventListener("click", () => {
            this.showReviewModal(sortedDue.slice(0, 50));
          });
        }
      }
    }
    /**
     * Load editor content
     */
    async loadEditorContent() {
      if (this.editor) {
        await this.editor.init();
      }
    }
    /**
     * Load statistics content
     */
    async loadStatisticsContent() {
      const container = document.getElementById("statistics-content");
      if (container) {
        container.innerHTML = "<p>\u7EDF\u8BA1\u529F\u80FD\u5F00\u53D1\u4E2D...</p>";
      }
    }
    /**
     * Show modal
     */
    showModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add("active");
        eventHub2.emit(Events2.MODAL_OPENED, modalId);
      }
    }
    /**
     * Hide modal
     */
    hideModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove("active");
        eventHub2.emit(Events2.MODAL_CLOSED, modalId);
      }
    }
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
      const loadingScreen = document.getElementById("loading-screen");
      const app2 = document.getElementById("app");
      if (loadingScreen && app2) {
        loadingScreen.style.opacity = "0";
        loadingScreen.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          loadingScreen.style.display = "none";
          app2.style.display = "flex";
        }, 500);
      }
    }
    /**
     * Show error message
     */
    showError(message) {
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) {
        loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div style="font-size: 48px; margin-bottom: 20px;">\u274C</div>
                    <h2>\u51FA\u9519\u4E86</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
                        \u91CD\u65B0\u52A0\u8F7D
                    </button>
                </div>
            `;
      }
    }
  };
  var app = new App();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => app.init());
  } else {
    app.init();
  }
  window.app = app;
})();
