/**
 * ReviewMode.js - Review Mode Feature
 * Handles reviewing phrases that are due for review
 */

import { SuperMemo2 } from '../algorithms/SuperMemo2.js';
import { eventHub, Events } from '../core/EventHub.js';

class ReviewMode {
    constructor(storage, phraseStore, progressStore) {
        this.storage = storage;
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
    async start(phrases, userId = 'default') {
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
        const percentage = Math.round((current / total) * 100);

        // Get progress info
        const progress = phrase.progress || {};

        // Clean up phrase text
        const cleanPhrase = phrase.phrase.replace(/\*\*/g, '');
        const cleanExample = (phrase.example || '').replace(/\*\*/g, '');

        // Highlight keywords
        const phraseHTML = this.highlightKeywords(cleanPhrase, phrase.keywords);
        const exampleHTML = this.highlightKeywords(cleanExample, phrase.keywords);

        const container = document.getElementById('review-modal-body');

        container.innerHTML = `
            <div class="progress-section">
                <div class="progress-info">
                    <span>复习进度</span>
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
                    <span class="label">上次复习</span>
                    <span class="value">${this.formatDate(progress.lastReview)}</span>
                </div>
                <div class="review-info-item">
                    <span class="label">间隔</span>
                    <span class="value">${progress.interval || 0} 天</span>
                </div>
                <div class="review-info-item">
                    <span class="label">复习次数</span>
                    <span class="value">${progress.repetitions || 0} 次</span>
                </div>
            </div>

            <div class="phrase-card">
                <div class="phrase-number">语块 #${phrase.id} ${this.getLevelBadge(phrase.level)}</div>
                <div class="phrase">${phraseHTML}</div>

                <div id="review-answer-area" style="display: none;">
                    <div class="meaning">${phrase.meaning || ''}</div>
                    ${phrase.example ? `<div class="example">${exampleHTML}</div>` : ''}

                    <div class="word-details">
                        <h4>📝 重点词汇</h4>
                        <div class="keyword-list">
                            ${(phrase.keywords || []).map(kw => `<span class="keyword-item">${kw}</span>`).join('')}
                        </div>
                        <div style="margin-top: 10px; color: #666; font-size: 12px;">
                            <strong>主题:</strong> ${phrase.topic || '其他'} |
                            <strong>频率:</strong> ${phrase.frequency || '中频'}
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <button class="tts-button" data-action="speak-phrase" data-text="${this.escapeHTML(cleanPhrase)}">
                        🔊 播放语块
                    </button>
                    ${phrase.example ? `
                        <button class="tts-button" data-action="speak-example" data-text="${this.escapeHTML(cleanExample)}">
                            🔊 播放例句
                        </button>
                    ` : ''}
                </div>
            </div>

            <div id="review-actions-area" class="learning-actions">
                <button class="btn-primary btn-large" id="show-answer-btn">
                    💡 显示答案
                </button>
            </div>

            <div id="review-quality-area" class="quality-buttons" style="display: none;">
                <p style="text-align: center; margin-bottom: 15px; color: #666;">
                    👆 评分您的记忆质量
                </p>
                <button class="quality-btn quality-5" data-quality="5">
                    ⭐⭐⭐⭐⭐<br>完美
                </button>
                <button class="quality-btn quality-4" data-quality="4">
                    ⭐⭐⭐⭐<br>良好
                </button>
                <button class="quality-btn quality-3" data-quality="3">
                    ⭐⭐⭐<br>勉强
                </button>
                <button class="quality-btn quality-2" data-quality="2">
                    ⭐⭐<br>困难
                </button>
                <button class="quality-btn quality-1" data-quality="1">
                    ⭐<br>忘记
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
            keywords.forEach(keyword => {
                const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                result = result.replace(regex, '<span class="keyword">$1</span>');
            });
        }
        return result;
    }

    /**
     * Get level badge HTML
     */
    getLevelBadge(level) {
        const className = level === '核心词汇' ? 'level-核心' : 'level-进阶';
        return `<span class="level-badge ${className}">${level}</span>`;
    }

    /**
     * Escape HTML for safe use in attributes
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML.replace(/'/g, '&#39;');
    }

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        if (!timestamp) return '从未';
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
        return `${Math.floor(diffDays / 30)}月前`;
    }

    /**
     * Attach event listeners to the current card
     */
    attachCardEventListeners() {
        // TTS buttons
        document.querySelectorAll('[data-action^="speak-"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.dataset.text;
                this.speakPhrase(text);
            });
        });

        // Show answer button
        const showAnswerBtn = document.getElementById('show-answer-btn');
        if (showAnswerBtn) {
            showAnswerBtn.addEventListener('click', () => this.showAnswer());
        }

        // Quality buttons
        document.querySelectorAll('[data-quality]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quality = parseInt(e.target.closest('[data-quality]').dataset.quality);
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

            // Space or Enter to show answer
            if ((e.code === 'Space' || e.code === 'Enter') && !this.isAnswerShown) {
                e.preventDefault();
                this.showAnswer();
                return;
            }

            // Number keys 1-5 for rating
            if (this.isAnswerShown && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                this.rate(parseInt(e.key));
                return;
            }

            // Escape to exit
            if (e.code === 'Escape') {
                e.preventDefault();
                this.exit();
                return;
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    /**
     * Remove keyboard shortcuts
     */
    removeKeyboardShortcuts() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    }

    /**
     * Show answer
     */
    showAnswer() {
        this.isAnswerShown = true;
        document.getElementById('review-answer-area').style.display = 'block';
        document.getElementById('review-actions-area').style.display = 'none';
        document.getElementById('review-quality-area').style.display = 'flex';
    }

    /**
     * Rate the current phrase and move to next
     */
    async rate(quality) {
        const phrase = this.currentPhrases[this.currentIndex];

        // Get current progress
        const progress = await this.progressStore.getByPhraseId(phrase.id, this.userId);

        // Apply SM-2 algorithm
        const result = SuperMemo2.calculate(
            quality,
            progress?.repetitions || 0,
            progress?.easeFactor || 2.5,
            progress?.interval || 0
        );

        // Update progress
        const newProgress = {
            phraseId: phrase.id,
            userId: this.userId,
            status: SuperMemo2.isMastered(result) ? 'mastered' : (result.repetitions > 0 ? 'reviewing' : 'learning'),
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

        // Store result for summary
        this.reviewResults.push({
            phraseId: phrase.id,
            phrase: phrase.phrase,
            quality,
            result: newProgress
        });

        // Emit event
        eventHub.emit(Events.PHRASE_REVIEWED, {
            phraseId: phrase.id,
            quality,
            result: newProgress
        });

        // Move to next
        this.currentIndex++;
        this.renderReviewCard();
    }

    /**
     * Show completion screen with summary
     */
    showComplete() {
        const container = document.getElementById('review-modal-body');

        // Calculate statistics
        const avgQuality = this.reviewResults.length > 0
            ? (this.reviewResults.reduce((sum, r) => sum + r.quality, 0) / this.reviewResults.length).toFixed(1)
            : 0;

        const qualityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        this.reviewResults.forEach(r => {
            qualityCounts[r.quality]++;
        });

        container.innerHTML = `
            <div class="phrase-card" style="padding: 40px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">复习完成!</h2>

                <div class="review-summary">
                    <p style="font-size: 18px; color: #666; margin-bottom: 20px;">
                        今天共复习了 <strong>${this.reviewResults.length}</strong> 个语块
                    </p>

                    <div class="review-stats">
                        <div class="stat-row">
                            <span class="stat-label">平均评分:</span>
                            <span class="stat-value">${avgQuality} / 5.0</span>
                        </div>
                        <div class="quality-distribution">
                            ${Object.entries(qualityCounts).map(([q, count]) => `
                                <div class="quality-bar">
                                    <span class="q-label">${'⭐'.repeat(parseInt(q))}</span>
                                    <div class="q-bar-container">
                                        <div class="q-bar" style="width: ${(count / this.reviewResults.length * 100)}%; background: ${SuperMemo2.getQualityColor(parseInt(q))}"></div>
                                    </div>
                                    <span class="q-count">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <button class="btn-primary btn-large" id="complete-exit-btn" style="margin-top: 30px;">
                    🏠 返回主界面
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

        // Attach exit button listener
        const exitBtn = document.getElementById('complete-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exit());
        }

        this.removeKeyboardShortcuts();
        this.isActive = false;
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const container = document.getElementById('review-modal-body');

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎉</div>
                <p style="font-size: 18px; margin-bottom: 10px;">太棒了!</p>
                <p>暂时没有需要复习的内容</p>
                <button class="btn-primary" id="empty-exit-btn" style="margin-top: 20px;">
                    返回
                </button>
            </div>
        `;

        // Attach exit button listener
        const exitBtn = document.getElementById('empty-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exit());
        }

        this.removeKeyboardShortcuts();
        this.isActive = false;
    }

    /**
     * Show review modal
     */
    showModal() {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Hide review modal
     */
    hideModal() {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.classList.remove('active');
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

export { ReviewMode };
