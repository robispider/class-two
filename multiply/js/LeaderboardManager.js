// js/LeaderboardManager.js

const LEADERBOARD_KEY = 'mathGameGlobalLeaderboard';
const MAX_ENTRIES_PER_BOARD = 10;

class LeaderboardManager {
    constructor() {
        this.leaderboardData = {};
        this.load();
    }

    /**
     * Loads the global leaderboard from localStorage.
     */
    load() {
        try {
            const savedData = localStorage.getItem(LEADERBOARD_KEY);
            if (savedData) {
                this.leaderboardData = JSON.parse(savedData);
            } else {
                this.leaderboardData = {}; // Initialize if it doesn't exist
            }
        } catch (error) {
            console.error('Failed to load global leaderboard.', error);
            this.leaderboardData = {};
        }
    }

    /**
     * Saves the global leaderboard to localStorage.
     */
    save() {
        try {
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboardData));
        } catch (error) {
            console.error('Failed to save global leaderboard.', error);
        }
    }

   /**
     * Adds a new score entry for a specific user, level, and stage.
     * @param {string} user - The name of the user.
     * @param {number} level - The level number.
     * @param {number} stage - The stage number.
     * @param {number} score - The score achieved.
     * @param {number} timeTaken - The time taken in seconds for the stage.
     */
    addScore(user, level, stage, score, timeTaken) { // --- FIX: Added 'timeTaken' parameter
        if (!user || score <= 0) {
            return; // Don't save empty entries
        }

        const boardKey = `${level}-${stage}`;
        if (!this.leaderboardData[boardKey]) {
            this.leaderboardData[boardKey] = [];
        }

        const newEntry = {
            user: user,
            score: score,
            date: new Date().toISOString(), // Store date in a standard format
            timeTaken: timeTaken || 0      // --- FIX: Added 'timeTaken' to the new entry object
        };

        const board = this.leaderboardData[boardKey];
        board.push(newEntry);

        // Sort by score (highest first), then by date (most recent first) for tie-breaking
        board.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // --- NEW: As a secondary sort, faster times are better
            if (a.timeTaken && b.timeTaken) {
                if (a.timeTaken !== b.timeTaken) {
                    return a.timeTaken - b.timeTaken;
                }
            }
            return new Date(b.date) - new Date(a.date);
        });

        // Keep only the top scores
        this.leaderboardData[boardKey] = board.slice(0, MAX_ENTRIES_PER_BOARD);

        this.save();
    }

    /**
     * Retrieves the sorted list of scores for a specific level and stage.
     * @param {number} level - The level number.
     * @param {number} stage - The stage number.
     * @returns {Array<{user: string, score: number, date: string}>}
     */
    getScores(level, stage) {
        const boardKey = `${level}-${stage}`;
        return this.leaderboardData[boardKey] || [];
    }
}

// Export a singleton instance so the whole game uses the same manager
export const leaderboardManager = new LeaderboardManager();