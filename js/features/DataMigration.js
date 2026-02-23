/**
 * DataMigration.js - Data migration from v5 to v6
 * Handles migrating localStorage data from v5 to IndexedDB in v6
 */

class DataMigration {
    constructor(storage, phraseStore, progressStore, userStore) {
        this.storage = storage;
        this.phraseStore = phraseStore;
        this.progressStore = progressStore;
        this.userStore = userStore;
    }

    /**
     * Check if migration is needed
     * @returns {boolean}
     */
    needsMigration() {
        // Check for v5 data in localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('phrase_') || key.startsWith('v5_user_'))) {
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
        console.log('[DataMigration] Starting migration from v5 to v6...');

        const result = {
            phrasesMigrated: 0,
            usersMigrated: 0,
            progressMigrated: 0,
            errors: []
        };

        try {
            // Migrate users first
            await this.migrateUsers(result);

            // Migrate phrases
            await this.migratePhrases(result);

            // Migrate progress data
            await this.migrateProgress(result);

            // Mark migration as complete
            this.storage.setLocalStorage('v6_migration_complete', true);
            this.storage.setLocalStorage('v6_migration_date', Date.now());

            console.log('[DataMigration] Migration completed:', result);
            return result;
        } catch (error) {
            console.error('[DataMigration] Migration error:', error);
            result.errors.push(error.message);
            throw error;
        }
    }

    /**
     * Migrate users
     */
    async migrateUsers(result) {
        // Get v5 users
        const v5UsersKey = 'v5_users';
        const v5UsersData = this.storage.getLocalStorage(v5UsersKey);

        if (v5UsersData && Array.isArray(v5UsersData)) {
            for (const user of v5UsersData) {
                try {
                    // Check if user already exists
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
        // Get v5 phrase data
        const v5PhrasesKey = 'v5_phrase_data';
        const v5PhrasesData = this.storage.getLocalStorage(v5PhrasesKey);

        if (v5PhrasesData && Array.isArray(v5PhrasesData)) {
            for (const phrase of v5PhrasesData) {
                try {
                    // Check if phrase already exists
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
        // Get all users
        const users = await this.userStore.getAll();

        for (const user of users) {
            const prefix = user.id === 'default' ? '' : `v5_user_${user.id}_`;

            // Get all progress keys for this user
            const progressKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${prefix}phrase_`)) {
                    progressKeys.push(key);
                }
            }

            // Migrate each progress entry
            for (const key of progressKeys) {
                try {
                    const progressData = this.storage.getLocalStorage(key);
                    if (progressData) {
                        // Extract phrase ID from key
                        const phraseId = parseInt(key.replace(`${prefix}phrase_`, ''));

                        // Migrate progress
                        await this.progressStore.save({
                            phraseId,
                            userId: user.id,
                            ...progressData
                        });

                        result.progressMigrated++;

                        // Optionally remove old data
                        // this.storage.removeLocalStorage(key);
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

        // Export users
        const v5Users = this.storage.getLocalStorage('v5_users');
        if (v5Users) {
            data.users = v5Users;
        }

        // Export phrases
        const v5Phrases = this.storage.getLocalStorage('v5_phrase_data');
        if (v5Phrases) {
            data.phrases = v5Phrases;
        }

        // Export progress data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('phrase_') && !key.includes('v5_phrase_data')) {
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
            if (key && (key.startsWith('v5_') || key.startsWith('phrase_'))) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
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
        console.log('[DataMigration] Rolling back migration...');

        try {
            // Clear all v6 data
            await this.phraseStore.clear();
            await this.progressStore.clearUserProgress('default');

            // Clear migration flag
            this.storage.removeLocalStorage('v6_migration_complete');
            this.storage.removeLocalStorage('v6_migration_date');

            console.log('[DataMigration] Rollback completed');
            return true;
        } catch (error) {
            console.error('[DataMigration] Rollback error:', error);
            return false;
        }
    }

    /**
     * Get migration status
     * @returns {Object}
     */
    getStatus() {
        return {
            complete: this.storage.getLocalStorage('v6_migration_complete', false),
            date: this.storage.getLocalStorage('v6_migration_date', null),
            needsMigration: this.needsMigration()
        };
    }
}

export { DataMigration };
