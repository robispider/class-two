// js/ScoreCalculator.js
import { gameState } from './gameState.js';
import { config } from './config.js';

/**
 * A static utility class that centralizes all scoring logic based on the
 * Fluency & Mastery Scoring (FMS) system.
 */
export class ScoreCalculator {

    static MAX_FLUENCY_BONUS_TIME = 3.0; // Seconds

    /**
     * Calculates the total score for a given answer.
     * @param {object} questionData - The question object, containing {a, b, target}.
     * @param {number} timeTaken - The time in seconds the player took to answer.
     * @param {PerformanceTracker} tracker - The instance of the performance tracker.
     * @returns {number} The total calculated points for a correct answer.
     */
    static calculateCorrectScore(questionData, timeTaken, tracker) {
        const { a, b } = questionData;
        let totalScore = 0;

        // 1. Base Score (Difficulty-Weighted)
        const baseScore = 10 + Math.floor((a * b) / 5);
        totalScore += baseScore;

        // 2. Fluency Bonus (Time-Based)
        if (timeTaken < this.MAX_FLUENCY_BONUS_TIME) {
            const fluencyBonus = Math.round((this.MAX_FLUENCY_BONUS_TIME - timeTaken) * 5);
            totalScore += fluencyBonus;
        }

        // 3. Streak Bonus
        const streakBonus = gameState.streak * 3; // Assuming streak is incremented *after* this
        totalScore += streakBonus;

        // 4. Mastery Bonus (Retrieval Practice)
        // We check if the problem *was* problematic *before* resolving it.
        if (tracker.isProblematic(a, b)) {
            totalScore += 50; // Award the large mastery bonus
            tracker.resolveProblematic(a, b); // Now, mark it as resolved
        }

        return totalScore;
    }

    /**
     * Returns the point value for an incorrect answer.
     * @returns {number} The negative point value for a penalty.
     */
    static getIncorrectPenalty() {
        return -5;
    }
    
    /**
     * Calculates the end-of-set bonus for modes without per-question timers.
     * @param {number} timeLimitPerQuestion - The time allotted for each question.
     * @param {number} numQuestions - The total number of questions in the set.
     * @param {number} totalTimeTaken - The total elapsed time for the set in seconds.
     * @returns {number} The calculated bonus score.
     */
    static calculateSetCompletionBonus(timeLimitPerQuestion, numQuestions, totalTimeTaken) {
        const totalTimeAllotted = timeLimitPerQuestion * numQuestions;
        if (totalTimeTaken < totalTimeAllotted) {
            const timeSaved = totalTimeAllotted - totalTimeTaken;
            return Math.round(timeSaved * 2);
        }
        return 0;
    }
}