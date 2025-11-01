// js/QuestionGenerator.js
import { toBangla, shuffle } from "./utils.js";
import { gameState } from "./gameState.js"; // Import gameState to access the controller

class QuestionGenerator {
    constructor(maxNumber, performanceTracker) {
        this.maxNumber = maxNumber;
        this.performanceTracker = performanceTracker;
        this.numberOfOptions = 4;
        this.lastA = null;
        this.lastB = null;
        this.lastTarget = null;
        this.allowedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.allLevelTables = [];
    }

    setAllowedTables(tables) {
        this.allowedTables = tables;
    }
    
    setAllLevelTables(allTables) {
        this.allLevelTables = allTables;
    }

    generateBatch(num = 50, fixedB = null, stage = 1) {
        const batch = [];
        for (let i = 0; i < num; i++) {
            batch.push(this.generateAdaptiveQuestion(fixedB, stage));
        }
        return batch;
    }

    generateAdaptiveQuestion(fixedB = null, stage = 1) {
        let question;
        
        // ✅ --- THIS IS THE CRITICAL FIX ---
        // Instead of calculating the level from 'stage', we directly use the correct
        // global state variable, which holds the player's selected level.
        const currentLevel = gameState.currentLevel;

        if (fixedB !== null) {
            const a = Math.floor(Math.random() * 10) + 1;
            return this.generateSpecificQuestion(a, fixedB);
        }

        const problematic = this.getRelevantProblematicQuestions(currentLevel);
        const rand = Math.random();

        // 15% chance to get a relevant past mistake.
        if (problematic.length > 0 && rand < 0.15) {
            const randomProblem = problematic[Math.floor(Math.random() * problematic.length)];
            const parts = randomProblem.split('x').map(Number);
            question = this.generateSpecificQuestion(parts[0], parts[1]);
        } else {
            // 85% chance for a new question, strongly biased towards the current level.
            const currentTables = this.allLevelTables[currentLevel - 1];
            if (!currentTables || currentTables.length === 0) {
                return this.generateSpecificQuestion(1, 1); // Failsafe
            }

            // The first number is ALWAYS from the current level's tables.
            let a = currentTables[Math.floor(Math.random() * currentTables.length)];
            let b;

            // 75% chance for the second number to ALSO be from the current level ("pure").
            if (currentLevel > 1 && Math.random() < 0.75) {
                 b = currentTables[Math.floor(Math.random() * currentTables.length)];
            } else {
                // For Level 1, or for the 25% "mixed review" chance, pick from 1-10.
                b = Math.floor(Math.random() * 10) + 1;
            }
            
            if (Math.random() < 0.5) {
                [a, b] = [b, a];
            }

            question = this.generateSpecificQuestion(a, b);
        }

        // Failsafe to ensure no question is null
        if (!question) {
            question = this.generateSpecificQuestion(1, 1);
        }
        
        this.lastA = question.a;
        this.lastB = question.b;
        this.lastTarget = question.target;
        
        return question;
    }

    getRelevantProblematicQuestions(currentLevel) {
        const currentLevelTables = this.allLevelTables[currentLevel - 1] || [];
        const allProblematic = this.performanceTracker.getProblematicProblems();

        return allProblematic.filter(key => {
            const [a, b] = key.split('x').map(Number);
            return currentLevelTables.includes(a) || currentLevelTables.includes(b);
        });
    }

    generateSpecificQuestion(a, b) {
        const target = a * b;
        const factors = this.getFactors(target);
        return { a, b, target, factors };
    }

    getFactors(number) {
        const factors = new Set();
        for (let i = 1; i <= Math.sqrt(number); i++) {
            if (number % i === 0) {
                factors.add(i);
                if (i * i !== number) {
                    factors.add(number / i);
                }
            }
        }
        return Array.from(factors).sort((a, b) => a - b);
    }

    generateOptions(correct, a, b) {
        const options = new Set([correct]);
        const maxTarget = 20 * 10; // Max possible product
        const candidates = [
            a * (b + 1), a * (b - 1),
            (a + 1) * b, (a - 1) * b,
            correct + 10, correct - 10,
            correct + 1, correct - 1,
        ].filter(p => p > 0 && p <= maxTarget && p !== correct);

        shuffle(candidates);
        for (const p of candidates) {
            if (options.size >= 4) break;
            options.add(p);
        }
        while (options.size < 4) {
            const r = Math.floor(Math.random() * Math.max(correct + 20, 40)) + 1;
            if (!options.has(r)) {
                options.add(r);
            }
        }
        return shuffle([...options]);
    }
}

export default QuestionGenerator;