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
        this.stagesPerLevel = 5;
        this.requiredCorrectPercent = 90; // MODIFIED: Set to 90% as requested
        
        // MODIFIED: This will hold the highest stage unlocked for each level.
        // e.g., { 1: 3, 2: 1 } means Level 1 is unlocked up to Stage 3, and Level 2 up to Stage 1.
        this.unlockedStages = {};
        this.loadProgress(); // NEW: Load progress when the game starts.
    }

    // --- NEW: Methods for Saving and Loading Progress ---

    loadProgress() {
        try {
            const savedProgress = localStorage.getItem('mathGameProgress');
            if (savedProgress) {
                this.unlockedStages = JSON.parse(savedProgress);
            } else {
                // Default state for a new player: only Level 1, Stage 1 is unlocked.
                this.unlockedStages = { '1': 1 };
            }
        } catch (error) {
            console.error('Failed to load progress, resetting.', error);
            this.unlockedStages = { '1': 1 };
        }
    }

    saveProgress() {
        try {
            localStorage.setItem('mathGameProgress', JSON.stringify(this.unlockedStages));
        } catch (error) {
            console.error('Failed to save progress.', error);
        }
    }

    // --- MODIFIED: More robust unlock logic ---

    /**
     * Unlocks the next stage or level after successful completion.
     * @param {number} completedLevel - The level the player just finished.
     * @param {number} completedStage - The stage the player just finished.
     */
    unlockNextStage(completedLevel, completedStage) {
        const currentMaxStage = this.unlockedStages[completedLevel] || 0;

        // Only update if they've beaten a new highest stage for that level
        if (completedStage >= currentMaxStage) {
            if (completedStage < this.stagesPerLevel) {
                // Unlock the next stage in the current level
                this.unlockedStages[completedLevel] = completedStage + 1;
            } else {
                // They beat the last stage, unlock the first stage of the next level
                const nextLevel = completedLevel + 1;
                if (nextLevel <= this.levels.length) {
                    // Make sure the next level is initialized if it's not present
                    if (!this.unlockedStages[nextLevel]) {
                        this.unlockedStages[nextLevel] = 1;
                    }
                }
            }
            this.saveProgress(); // Save changes immediately
        }
    }

    /**
     * NEW: A public method to check if a specific stage is accessible.
     * @param {number} level - The level to check.
     * @param {number} stage - The stage to check.
     * @returns {boolean}
     */
    isStageUnlocked(level, stage) {
        const maxUnlockedStage = this.unlockedStages[level] || 0;
        return stage <= maxUnlockedStage;
    }

    // --- Existing methods are unchanged ---

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