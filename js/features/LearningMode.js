/**
 * LearningMode.js - Learning Mode Feature
 * Handles the learning interface and interaction
 */

import { SuperMemo2 } from '../algorithms/SuperMemo2.js';
import { Utils } from '../core/Utils.js';

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

    /**
     * Start learning mode with given phrases
     * @param {Array} phrases - Phrases to learn
     * @param {string} userId - User ID
     */
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
        const percentage = Math.round((current / total) * 100);

        // Clean up phrase text (remove markdown markers)
        const cleanPhrase = phrase.phrase.replace(/\*\*/g, '');
        const cleanExample = phrase.example.replace(/\*\*/g, '');

        // Highlight keywords
        const phraseHTML = this.highlightKeywords(cleanPhrase, phrase.keywords);
        const exampleHTML = this.highlightKeywords(cleanExample, phrase.keywords);

        const container = document.getElementById('learning-modal-body');

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
                <div class="phrase-number">语块 #${phrase.id} ${this.getLevelBadge(phrase.level)}</div>
                <div class="phrase">${phraseHTML}</div>

                <div id="learning-answer-area" style="display: none;">
                    <div class="meaning">${phrase.meaning}</div>
                    <div class="example">${exampleHTML}</div>

                    <div class="word-details">
                        <h4>📝 重点词汇</h4>
                        <div class="keyword-list">
                            ${phrase.keywords.map(kw => `<span class="keyword-item">${kw}</span>`).join('')}
                        </div>
                        <div style="margin-top: 10px; color: #666; font-size: 12px;">
                            <strong>主题:</strong> ${phrase.topic} |
                            <strong>频率:</strong> ${phrase.frequency}
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

    /**
     * Highlight keywords in text
     */
    highlightKeywords(text, keywords) {
        let result = text;
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            result = result.replace(regex, '<span class="keyword">$1</span>');
        });
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
     * Show answer
     */
    showAnswer() {
        this.isAnswerShown = true;
        document.getElementById('learning-answer-area').style.display = 'block';
        document.getElementById('learning-actions-area').style.display = 'none';
        document.getElementById('learning-quality-area').style.display = 'flex';
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

        // Emit event
        eventHub.emit(Events.PHRASE_REVIEWED, {
            phraseId: phrase.id,
            quality,
            result: newProgress
        });

        // Move to next
        this.currentIndex++;
        this.renderLearningCard();
    }

    /**
     * Show completion screen
     */
    showComplete() {
        const container = document.getElementById('learning-modal-body');

        container.innerHTML = `
            <div class="phrase-card" style="padding: 60px 40px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">学习完成!</h2>
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

    /**
     * Show empty state
     */
    showEmptyState() {
        const container = document.getElementById('learning-modal-body');

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

    /**
     * Show learning modal
     */
    showModal() {
        const modal = document.getElementById('learning-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Hide learning modal
     */
    hideModal() {
        const modal = document.getElementById('learning-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Exit learning mode
     */
    exit() {
        this.hideModal();
        this.isActive = false;
        this.currentPhrases = [];
        this.currentIndex = 0;
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

export { LearningMode };
