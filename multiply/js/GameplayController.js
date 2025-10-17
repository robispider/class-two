// js/GameplayController.js
import { config } from './config.js';
import { gameState } from './gameState.js';
class GameplayController {
    constructor() {
                this.levels = [
            [1, 2, 3, 4, 5],      // Tables for Level 1
            [5, 6, 7, 8, 9, 10], // Tables for Level 2
            [11, 12, 13, 14, 15], // Tables for Level 3
            [16, 17, 18, 19, 20]  // Tables for Level 4
        ];
        this.stagesPerLevel = 6;
        this.requiredCorrectPercent = 80;
        this.unlocked = {};
    }

    unlockNextStage(level, stage) {
        if (!this.unlocked[level]) this.unlocked[level] = 1;
        if (stage >= this.unlocked[level]) this.unlocked[level] = stage + 1;
    }

    getLevelMaxNumber(level) {
        return 10;
    }

    getTimeLimit(stage) {
        return config.initialTimeLimit;
    }

    get questionsPerSession() {
        return config.questionsPerSession;
    }
}

export default GameplayController;