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
            // REMOVED: stageHigh and levelHigh are no longer tracked here.
            overallHigh: 0,
            problematicProblems: new Set(),
            statistics: {},
        };
        this.responses = [];
        this.userName = null;
    }
    
    _getUserKey() {
        if (!this.userName) return null;
        return `mathGame_${this.userName}_performance`;
    }

    loadFromLocal(userName) {
        this.userName = userName;
        const key = this._getUserKey();
        if (!key) return;

        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsedData = JSON.parse(saved);
                // Only load relevant data
                this.data.overallHigh = parsedData.overallHigh || 0;
                this.data.problematicProblems = new Set(parsedData.problematicProblems || []);
            } else {
                // Fresh start for a new user's data
                this.data = { overallHigh: 0, problematicProblems: new Set(), statistics: {} };
            }
        } catch (error) {
            console.error(`Failed to load or parse performance data for ${this.userName}. Starting fresh.`, error);
            this.data = { overallHigh: 0, problematicProblems: new Set(), statistics: {} };
            localStorage.removeItem(key);
        }
    }

    saveToLocal() {
        const key = this._getUserKey();
        if (!key) return;

        try {
            const dataToSave = {
                overallHigh: this.data.overallHigh,
                problematicProblems: Array.from(this.data.problematicProblems)
            };
            localStorage.setItem(key, JSON.stringify(dataToSave));
        } catch (error) {
            console.error(`Failed to save performance data for ${this.userName}.`, error);
        }
    }
    
    // REMOVED: saveStageHigh and saveLevelHigh methods are gone.

    saveOverallHigh(score) {
        if (score > this.data.overallHigh) {
            this.data.overallHigh = score;
        }
    }

    // ... (logResponse, isProblematic, addProblematic, resolveProblematic, getProblematicProblems remain the same) ...
    logResponse(a, b, timeTaken, isCorrect) {
        this.responses.push({ a, b, timeTaken, isCorrect, timestamp: Date.now() });

        if (!isCorrect) {
            this.addProblematic(a, b);
        }
    }
    isProblematic(a, b) {
        const key = `${a}x${b}`;
        return this.data.problematicProblems.has(key);
    }
    addProblematic(a, b) {
        const key = `${a}x${b}`;
        this.data.problematicProblems.add(key);
    }
    resolveProblematic(a, b) {
        const key = `${a}x${b}`;
        if (this.data.problematicProblems.has(key)) {
            this.data.problematicProblems.delete(key);
            return true;
        }
        return false;
    }
    getProblematicProblems() {
        return Array.from(this.data.problematicProblems);
    }
}

export default PerformanceTracker;
