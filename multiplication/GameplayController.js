export default class GameplayController {
    constructor() {
        this.levels = [
            {id: 1, maxNumber: 5},
            {id: 2, maxNumber: 10},
            {id: 3, maxNumber: 15},
            {id: 4, maxNumber: 20}
        ];
        this.stagesPerLevel = 6;
        this.initialTimeLimit = 15;
        this.timeReductionPerStage = 2;
        this.minTimeLimit = 3;
        this.questionsPerSession = 20;
        this.requiredCorrectPercent = 80;
        this.loadProgress();
    }

    getLevelMaxNumber(level) {
        const levelData = this.levels.find(l => l.id === level);
        return levelData ? levelData.maxNumber : 5;
    }

    getTimeLimit(stage) {
        return Math.max(this.minTimeLimit, this.initialTimeLimit - (stage - 1) * this.timeReductionPerStage);
    }

    loadProgress() {
        const data = localStorage.getItem('gameProgress');
        if (data) {
            const parsed = JSON.parse(data);
            this.unlockedLevels = parsed.unlockedLevels || 1;
            this.unlockedStages = parsed.unlockedStages || {1: 1};
        } else {
            this.unlockedLevels = 1;
            this.unlockedStages = {1: 1};
        }
    }

    saveProgress() {
        localStorage.setItem('gameProgress', JSON.stringify({
            unlockedLevels: this.unlockedLevels,
            unlockedStages: this.unlockedStages
        }));
    }

    unlockNextStage(level, stage) {
        if (!this.unlockedStages[level]) this.unlockedStages[level] = 1;
        if (stage < this.stagesPerLevel) {
            this.unlockedStages[level] = Math.max(this.unlockedStages[level], stage + 1);
        } else if (level < this.levels.length) {
            this.unlockedLevels = Math.max(this.unlockedLevels, level + 1);
            if (!this.unlockedStages[level + 1]) this.unlockedStages[level + 1] = 1;
        }
        this.saveProgress();
    }

    isUnlocked(level, stage) {
        if (level > this.unlockedLevels) return false;
        return stage <= (this.unlockedStages[level] || 1);
    }
}