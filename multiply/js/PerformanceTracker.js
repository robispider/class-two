// js/PerformanceTracker.js
class PerformanceTracker {
    constructor() {
        this.data = {
            stageHigh: {},
            levelHigh: {},
            overallHigh: 0,
            problematicProblems: [],
            statistics: {}
        };
        this.loadFromLocal();
    }

    loadFromLocal() {
        const saved = localStorage.getItem('mathGameData');
        if (saved) {
            this.data = JSON.parse(saved);
        }
    }

    saveToLocal() {
        localStorage.setItem('mathGameData', JSON.stringify(this.data));
    }

    getStatistics() {
        return this.data.statistics || { problematicProblems: this.data.problematicProblems };
    }

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

    addProblematic(a, b) {
        const key = `${a}x${b}`;
        if (!this.data.problematicProblems.includes(key)) {
            this.data.problematicProblems.push(key);
        }
    }
}

export default PerformanceTracker;