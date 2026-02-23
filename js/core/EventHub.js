/**
 * EventHub.js - 事件总线
 * 实现发布订阅模式，用于模块间通信
 */

class EventHub {
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

        // 返回取消订阅函数
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
            // 移除特定的回调
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        } else {
            // 移除该事件的所有回调
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

        this.events[eventName].forEach(callback => {
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

        const promises = this.events[eventName].map(callback => {
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
}

// 定义系统事件名称常量
const Events = {
    // 数据相关事件
    PHRASE_ADDED: 'phrase:added',
    PHRASE_UPDATED: 'phrase:updated',
    PHRASE_DELETED: 'phrase:deleted',
    PHRASE_LEARNED: 'phrase:learned',
    PHRASE_REVIEWED: 'phrase:reviewed',

    // 用户相关事件
    USER_ADDED: 'user:added',
    USER_SWITCHED: 'user:switched',
    USER_DELETED: 'user:deleted',

    // 学习相关事件
    LEARNING_STARTED: 'learning:started',
    LEARNING_PAUSED: 'learning:paused',
    LEARNING_RESUMED: 'learning:resumed',
    LEARNING_COMPLETED: 'learning:completed',
    LEARNING_PROGRESS_UPDATED: 'learning:progress:updated',

    // 复习相关事件
    REVIEW_STARTED: 'review:started',
    REVIEW_COMPLETED: 'review:completed',
    REVIEW_CARD_SHOWN: 'review:card:shown',

    // 配置相关事件
    CONFIG_UPDATED: 'config:updated',
    SETTINGS_CHANGED: 'settings:changed',

    // 数据管理事件
    DATA_EXPORTED: 'data:exported',
    DATA_IMPORTED: 'data:imported',
    DATA_BACKUP_CREATED: 'data:backup:created',
    DATA_RESTORED: 'data:restored',

    // 版本控制事件
    SNAPSHOT_CREATED: 'snapshot:created',
    SNAPSHOT_RESTORED: 'snapshot:restored',

    // UI相关事件
    TAB_CHANGED: 'ui:tab:changed',
    MODAL_OPENED: 'ui:modal:opened',
    MODAL_CLOSED: 'ui:modal:closed',

    // 系统事件
    SYSTEM_READY: 'system:ready',
    SYSTEM_ERROR: 'system:error'
};

// 导出单例实例
const eventHub = new EventHub();
