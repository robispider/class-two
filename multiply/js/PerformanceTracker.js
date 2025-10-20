// js/PerformanceTracker.js

/**
 * A resilient data management class for tracking player performance.
 * It handles logging responses, managing problematic questions, and persisting data
 * to local storage with error handling. It is designed as a pure data layer,
 * separate from scoring logic.
 */
class PerformanceTracker {
    constructor() {
        this.data = {
            stageHigh: {},
            levelHigh: {},
            overallHigh: 0,
            // Uses a Set for efficient add/delete/has checks, preventing duplicates.
            problematicProblems: new Set(),
            statistics: {},
        };
        this.responses = []; // For session-specific detailed logging, if needed.

        this.loadFromLocal();
    }

    /**
     * Loads player data from localStorage.
     * Includes error handling to prevent game crashes from corrupted data.
     */
    loadFromLocal() {
        try {
            const saved = localStorage.getItem('mathGameData');
            if (saved) {
                const parsedData = JSON.parse(saved);
                this.data = {
                    ...this.data, // Keep defaults
                    ...parsedData, // Overwrite with saved data
                    // Ensure problematicProblems is always a Set, converting from array if needed.
                    problematicProblems: new Set(parsedData.problematicProblems || [])
                };
            }
        } catch (error) {
            console.error("Failed to load or parse performance data. Starting fresh.", error);
            // In case of corruption, we start with a fresh data object.
            localStorage.removeItem('mathGameData');
        }
    }

    /**
     * Saves the current performance data to localStorage.
     * Converts the Set to an Array for JSON compatibility.
     */
    saveToLocal() {
        try {
            // Convert Set to Array for JSON serialization
            const dataToSave = {
                ...this.data,
                problematicProblems: Array.from(this.data.problematicProblems)
            };
            localStorage.setItem('mathGameData', JSON.stringify(dataToSave));
        } catch (error) {
            console.error("Failed to save performance data.", error);
        }
    }

    /**
     * Logs a single question response. If the answer is incorrect,
     * it's automatically added to the problematic set.
     */
    logResponse(a, b, timeTaken, isCorrect) {
        this.responses.push({ a, b, timeTaken, isCorrect, timestamp: Date.now() });

        if (!isCorrect) {
            this.addProblematic(a, b);
        }
    }

    /**
     * Checks if a specific problem is currently marked as problematic.
     * @returns {boolean} True if the problem is on the list.
     */
    isProblematic(a, b) {
        const key = `${a}x${b}`;
        return this.data.problematicProblems.has(key);
    }

    /**
     * Adds a problem to the problematic list.
     * The use of a Set automatically handles duplicates.
     */
    addProblematic(a, b) {
        const key = `${a}x${b}`;
        this.data.problematicProblems.add(key);
        console.log(`Added to problematic: ${key}. Current list:`, this.data.problematicProblems);
    }

    /**
     * Removes a problem from the problematic list, typically after a correct answer.
     * This signifies that the user has "mastered" it.
     */
    resolveProblematic(a, b) {
        const key = `${a}x${b}`;
        if (this.data.problematicProblems.has(key)) {
            this.data.problematicProblems.delete(key);
            console.log(`Resolved problematic problem: ${key}`);
            return true; // Indicate that a mastery bonus should be awarded
        }
        return false;
    }
    
  /**
     * NEW METHOD: Returns the current list of problematic problems as an array.
     * This provides a clean interface for other parts of the game, like the
     * QuestionGenerator, to access this specific data.
     * @returns {string[]} An array of problem keys (e.g., ["7x6", "9x8"]).
     */
    getProblematicProblems() {
        // Convert the Set to an Array for consumers that need to iterate or pick randomly.
        return Array.from(this.data.problematicProblems);
    }

    // --- High Score Methods ---

    saveStageHigh(level, stage, score) {
        const key = `${level}-${stage}`;
        if (!this.data.stageHigh[key] || score > this.data.stageHigh[key]) {
            this.data.stageHigh[key] = score;
        }
    }

    saveLevelHigh(level, score) {
        if (!this.data.levelHigh[level] || score > this.data.levelHigh[level]) {
            this.data.levelHigh[level] = score;
        }
    }

    saveOverallHigh(score) {
        if (score > this.data.overallHigh) {
            this.data.overallHigh = score;
        }
    }
}

export default PerformanceTracker;