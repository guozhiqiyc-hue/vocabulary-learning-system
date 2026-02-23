/**
 * Utils.js - 工具函数库
 * 提供通用的工具函数
 */

const Utils = {
    /**
     * ========== 日期时间相关 ==========
     */

    /**
     * 格式化日期
     * @param {number|Date} timestamp - 时间戳或日期对象
     * @param {string} format - 格式化模板
     * @returns {string}
     */
    formatDate(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
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

    /**
     * 获取今天的开始时间戳
     * @returns {number}
     */
    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.getTime();
    },

    /**
     * 获取今天的结束时间戳
     * @returns {number}
     */
    getTodayEnd() {
        const today = new Date();
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
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },

    /**
     * 计算两个时间戳之间的天数差
     * @param {number} timestamp1
     * @param {number} timestamp2
     * @returns {number}
     */
    daysBetween(timestamp1, timestamp2) {
        const diff = Math.abs(timestamp2 - timestamp1);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },

    /**
     * 格式化相对时间
     * @param {number} timestamp
     * @returns {string}
     */
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return this.formatDate(timestamp, 'YYYY-MM-DD');
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
        return num.toLocaleString('zh-CN', {
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
        if (total === 0) return '0%';
        const percent = (value / total) * 100;
        return `${percent.toFixed(decimals)}%`;
    },

    /**
     * 格式化文件大小
     * @param {number} bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
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
            errors.push('语块内容不能为空');
        }

        if (!phrase.meaning || phrase.meaning.trim().length === 0) {
            errors.push('释义不能为空');
        }

        if (!phrase.example || phrase.example.trim().length === 0) {
            errors.push('例句不能为空');
        }

        if (!phrase.keywords || !Array.isArray(phrase.keywords) || phrase.keywords.length === 0) {
            errors.push('关键词不能为空');
        }

        if (!phrase.level || !['核心词汇', '进阶词汇'].includes(phrase.level)) {
            errors.push('词汇等级必须是"核心词汇"或"进阶词汇"');
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
        const div = document.createElement('div');
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
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
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
    truncate(text, maxLength, suffix = '...') {
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
        const seen = new Set();
        return arr.filter(item => {
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
    sortBy(arr, key, order = 'asc') {
        return [...arr].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return order === 'asc' ? comparison : -comparison;
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
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
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
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    /**
     * 获取嵌套属性值
     * @param {Object} obj
     * @param {string} path - 点分隔的路径，如 'a.b.c'
     * @param {any} defaultValue
     * @returns {any}
     */
    get(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
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
        return new Promise(resolve => setTimeout(resolve, ms));
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
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
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
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                const strValue = typeof value === 'string' ? value : JSON.stringify(value);
                return `"${strValue.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
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
        return this.readFile(file).then(content => JSON.parse(content));
    }
};
