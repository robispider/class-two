// js/GameplayController.js
import { config } from './config.js';
import { gameState } from './gameState.js';
class GameplayController {
    constructor() {
        this.levels = [1, 2, 3, 4, 5];
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
        return config.initialTimeLimit - (stage - 1) * config.timeReduction;
    }

    get questionsPerSession() {
        return config.questionsPerSession;
    }
}

export default GameplayController;