/**
 * Statistics.js - Statistics Dashboard Feature
 * 统计面板功能模块
 */

class Statistics {
    constructor(storage, phraseStore, progressStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
        this.progressStore = progressStore;
    }

    /**
     * 初始化统计面板
     */
    async init() {
        await this.render();
    }

    /**
     * 渲染统计面板
     */
    async render() {
        const container = document.getElementById('statistics-content');
        if (!container) return;

        // 获取统计数据
        const allPhrases = await this.phraseStore.getAll();
        const stats = await this.progressStore.getStatistics('default');
        const allProgress = await this.progressStore.getAll('default');

        // 计算各种统计
        const masteredCount = stats.mastered || 0;
        const learningCount = stats.learning || 0;
        const newCount = allPhrases.length - masteredCount - learningCount;
        const totalReviews = allProgress.reduce((sum, p) => sum + (p.repetitions || 0), 0);
        const avgQuality = this.calculateAverageQuality(allProgress);

        container.innerHTML = `
            <!-- 总览卡片 -->
            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-value">${allPhrases.length}</div>
                    <div class="stat-label">总语块数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${masteredCount}</div>
                    <div class="stat-label">已掌握</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${learningCount}</div>
                    <div class="stat-label">学习中</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.dueToday || 0}</div>
                    <div class="stat-label">待复习</div>
                </div>
            </div>

            <!-- 学习进度环形图 -->
            <div class="card">
                <div class="card-header">
                    <h3>学习进度</h3>
                </div>
                <div class="progress-ring-container">
                    ${this.renderProgressRing(allPhrases.length, masteredCount + learningCount)}
                </div>
            </div>

            <!-- 学习统计 -->
            <div class="charts-section">
                <div class="chart-card">
                    <h3>学习状态分布</h3>
                    <div class="bar-chart">
                        ${this.renderStatusBar('新学习', newCount, allPhrases.length, '#f44336')}
                        ${this.renderStatusBar('学习中', learningCount, allPhrases.length, '#ff9800')}
                        ${this.renderStatusBar('已掌握', masteredCount, allPhrases.length, '#4caf50')}
                    </div>
                </div>

                <div class="chart-card">
                    <h3>词汇等级分布</h3>
                    <div class="bar-chart">
                        ${this.renderLevelBar(allPhrases)}
                    </div>
                </div>
            </div>

            <!-- 详细统计 -->
            <div class="card">
                <div class="card-header">
                    <h3>详细统计</h3>
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">${totalReviews}</div>
                        <div class="stat-label">总复习次数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${avgQuality.toFixed(1)}</div>
                        <div class="stat-label">平均评分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.calculateStreak()}</div>
                        <div class="stat-label">连续学习天数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.getTodayLearned()}</div>
                        <div class="stat-label">今日学习</div>
                    </div>
                </div>
            </div>

            <!-- 活动时间线 -->
            <div class="card">
                <div class="card-header">
                    <h3>最近活动</h3>
                </div>
                <ul class="activity-timeline">
                    ${this.renderActivityTimeline(allProgress)}
                </ul>
            </div>

            <!-- 导出按钮 -->
            <div class="export-section">
                <button class="export-btn" onclick="window.app.statistics.exportData()">
                    📊 导出学习数据
                </button>
            </div>
        `;
    }

    /**
     * 渲染进度环
     */
    renderProgressRing(total, learned) {
        const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (percentage / 100) * circumference;

        return `
            <div class="progress-ring">
                <svg class="progress-ring-svg" width="200" height="200">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#667eea"/>
                            <stop offset="100%" style="stop-color:#764ba2"/>
                        </linearGradient>
                    </defs>
                    <circle class="progress-ring-circle" stroke="#e0e0e0" stroke-width="12" fill="transparent" r="90" cx="100" cy="100"/>
                    <circle class="progress-ring-progress" stroke="url(#gradient)" stroke-width="12" fill="transparent"
                            r="90" cx="100" cy="100"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"
                            style="transition: stroke-dashoffset 0.5s"/>
                </svg>
                <div class="progress-ring-text">
                    <div class="progress-ring-percentage">${percentage}%</div>
                    <div class="progress-ring-label">学习进度</div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染状态条形图
     */
    renderStatusBar(label, value, total, color) {
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        return `
            <div class="bar-chart-item">
                <div class="bar-chart-bar" style="height: ${percentage * 2}px; background: ${color};" data-value="${value}"></div>
                <div class="bar-chart-label">${label}</div>
            </div>
        `;
    }

    /**
     * 渲染等级条形图
     */
    renderLevelBar(allPhrases) {
        const coreCount = allPhrases.filter(p => p.level === '核心词汇').length;
        const advancedCount = allPhrases.filter(p => p.level === '进阶词汇').length;

        return `
            <div class="bar-chart-item">
                <div class="bar-chart-bar" style="height: ${Math.min(coreCount * 10, 150)}px; background: #1976d2;" data-value="${coreCount}"></div>
                <div class="bar-chart-label">核心</div>
            </div>
            <div class="bar-chart-item">
                <div class="bar-chart-bar" style="height: ${Math.min(advancedCount * 10, 150)}px; background: #7b1fa2;" data-value="${advancedCount}"></div>
                <div class="bar-chart-label">进阶</div>
            </div>
        `;
    }

    /**
     * 计算平均质量
     */
    calculateAverageQuality(allProgress) {
        if (allProgress.length === 0) return 0;

        let totalQuality = 0;
        let count = 0;

        allProgress.forEach(progress => {
            if (progress.qualityHistory && progress.qualityHistory.length > 0) {
                progress.qualityHistory.forEach(h => {
                    totalQuality += h.quality;
                    count++;
                });
            }
        });

        return count > 0 ? totalQuality / count : 0;
    }

    /**
     * 计算连续学习天数
     */
    calculateStreak() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let currentDate = today;

        // 检查最近连续天数
        for (let i = 0; i < 365; i++) {
            const dateKey = Utils.formatDate(currentDate, 'YYYY-MM-DD');
            const hasActivity = localStorage.getItem(`v6_activity_${dateKey}`);

            if (hasActivity) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (i === 0) {
                // 今天没有活动，检查昨天
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * 获取今日学习数量
     */
    getTodayLearned() {
        const todayKey = Utils.formatDate(Date.now(), 'YYYY-MM-DD');
        return parseInt(localStorage.getItem(`v6_learned_${todayKey}`) || '0');
    }

    /**
     * 渲染活动时间线
     */
    renderActivityTimeline(allProgress) {
        // 获取最近的活动记录
        const activities = [];

        allProgress.forEach(progress => {
            if (progress.qualityHistory && progress.qualityHistory.length > 0) {
                const lastActivity = progress.qualityHistory[progress.qualityHistory.length - 1];
                activities.push({
                    phraseId: progress.phraseId,
                    date: lastActivity.date,
                    quality: lastActivity.quality
                });
            }
        });

        // 按日期排序并取最近10条
        activities.sort((a, b) => b.date - a.date);
        const recentActivities = activities.slice(0, 10);

        if (recentActivities.length === 0) {
            return '<li class="activity-timeline-item"><div class="activity-timeline-content">暂无学习记录</div></li>';
        }

        return recentActivities.map(activity => `
            <li class="activity-timeline-item">
                <div class="activity-timeline-date">
                    ${Utils.formatDate(activity.date, 'MM-DD HH:mm')}
                </div>
                <div class="activity-timeline-icon">⭐</div>
                <div class="activity-timeline-content">
                    <div class="activity-timeline-title">
                        语块 #${activity.phraseId} - 评分: ${activity.quality}/5
                    </div>
                </div>
            </li>
        `).join('');
    }

    /**
     * 导出数据
     */
    async exportData() {
        try {
            const data = {
                exportedAt: Date.now(),
                phrases: await this.phraseStore.getAll(),
                progress: await this.progressStore.getAll('default'),
                statistics: await this.progressStore.getStatistics('default')
            };

            const filename = `statistics_${Utils.formatDate(Date.now(), 'YYYYMMDD_HHmmss')}.json`;
            Utils.downloadJSON(data, filename);
            alert('导出成功！');
        } catch (error) {
            alert('导出失败: ' + error.message);
        }
    }
}
