/**
 * SuperMemo2.js - SM-2 间隔重复算法实现
 *
 * SM-2 算法简介:
 * - 由 SuperMemo 2 算法实现
 * - 根据用户的记忆质量评分调整复习间隔
 * - 核心参数:
 *   - quality: 记忆质量评分 (1-5)
 *   - repetitions: 复习次数
 *   - easeFactor: 易度因子 (EF)
 *   - interval: 复习间隔 (天)
 *
 * 评分标准:
 *   5 - 完美记忆
 *   4 - 犹豫后正确
 *   3 - 勉强回忆
 *   2 - 错误但记得
 *   1 - 完全忘记
 */

class SuperMemo2 {
    /**
     * 默认参数
     */
    static DEFAULTS = {
        easeFactor: 2.5,        // 默认易度因子
        interval: 0,            // 默认间隔(天)
        repetitions: 0,         // 默认复习次数
        minEaseFactor: 1.3      // 最小易度因子
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
        // 验证输入
        quality = Math.max(1, Math.min(5, quality));

        // 1. 计算新的易度因子
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        // 易度因子不能低于1.3
        if (newEaseFactor < this.DEFAULTS.minEaseFactor) {
            newEaseFactor = this.DEFAULTS.minEaseFactor;
        }

        // 2. 计算新的间隔和复习次数
        let newInterval;
        let newRepetitions;

        if (quality < 3) {
            // 如果评分低于3,表示记忆失败,重置复习次数和间隔
            newInterval = 1; // 1天后复习
            newRepetitions = 1;
        } else {
            // 记忆成功,增加复习次数并计算新间隔
            newRepetitions = repetitions + 1;

            if (newRepetitions === 1) {
                // 第一次复习: 1天
                newInterval = 1;
            } else if (newRepetitions === 2) {
                // 第二次复习: 6天
                newInterval = 6;
            } else {
                // 后续复习: 间隔 = 上次间隔 * EF
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
            // 从未复习过,需要学习
            return true;
        }

        if (interval === 0) {
            // 间隔为0,表示新学习内容
            return true;
        }

        const now = Date.now();
        const daysSinceReview = (now - lastReview) / (1000 * 60 * 60 * 24);

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

        return lastReview + (interval * 24 * 60 * 60 * 1000);
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

        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

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
            return '现在';
        }

        if (timeLeft.days > 0) {
            return `${timeLeft.days}天后`;
        } else if (timeLeft.hours > 0) {
            return `${timeLeft.hours}小时后`;
        } else {
            return `${timeLeft.minutes}分钟后`;
        }
    }

    /**
     * 计算复习优先级分数
     * @param {Object} progress - 学习进度对象
     * @returns {number} - 优先级分数(越高越优先)
     */
    static calculatePriority(progress) {
        let score = 0;

        if (!progress || progress.status === 'new') {
            // 新学习内容的优先级
            return 0;
        }

        // 1. 逾期天数 (权重: 3)
        if (progress.lastReview && progress.interval) {
            const now = Date.now();
            const daysSinceReview = (now - progress.lastReview) / (1000 * 60 * 60 * 24);
            const overdueDays = daysSinceReview - progress.interval;
            if (overdueDays > 0) {
                score += overdueDays * 3;
            }
        }

        // 2. 历史评分均值 (权重: 2)
        if (progress.qualityHistory && progress.qualityHistory.length > 0) {
            const avgQuality = progress.qualityHistory.reduce((sum, h) => sum + h.quality, 0) /
                             progress.qualityHistory.length;
            score += (5 - avgQuality) * 2;
        }

        // 3. 易度因子越低越优先 (权重: 1)
        if (progress.easeFactor) {
            score += (3 - progress.easeFactor);
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

        // 掌握标准:
        // 1. 复习次数 >= 5
        // 2. 易度因子 >= 2.5
        // 3. 间隔 >= 21天
        return progress.repetitions >= 5 &&
               progress.easeFactor >= 2.5 &&
               progress.interval >= 21;
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
                trend: 'none'
            };
        }

        const qualities = qualityHistory.map(h => h.quality);
        const totalReviews = qualities.length;
        const averageQuality = qualities.reduce((a, b) => a + b, 0) / totalReviews;
        const bestQuality = Math.max(...qualities);
        const worstQuality = Math.min(...qualities);

        // 计算趋势
        let trend = 'stable';
        if (totalReviews >= 3) {
            const recent = qualities.slice(-3);
            const earlier = qualities.slice(0, -3);
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

            if (recentAvg > earlierAvg + 0.5) {
                trend = 'improving';
            } else if (recentAvg < earlierAvg - 0.5) {
                trend = 'declining';
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
            5: '完美记忆',
            4: '良好记忆',
            3: '勉强回忆',
            2: '记忆困难',
            1: '完全忘记'
        };
        return labels[quality] || '未知';
    }

    /**
     * 获取质量评分的图标
     * @param {number} quality - 评分 (1-5)
     * @returns {string}
     */
    static getQualityIcon(quality) {
        const icons = {
            5: '⭐⭐⭐⭐⭐',
            4: '⭐⭐⭐⭐',
            3: '⭐⭐⭐',
            2: '⭐⭐',
            1: '⭐'
        };
        return icons[quality] || '';
    }

    /**
     * 获取质量评分的颜色类
     * @param {number} quality - 评分 (1-5)
     * @returns {string}
     */
    static getQualityColor(quality) {
        const colors = {
            5: '#4caf50', // 绿色
            4: '#8bc34a', // 浅绿
            3: '#ff9800', // 橙色
            2: '#ff5722', // 深橙
            1: '#f44336'  // 红色
        };
        return colors[quality] || '#666';
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuperMemo2;
}
