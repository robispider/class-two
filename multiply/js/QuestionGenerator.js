// js/QuestionGenerator.js
import { toBangla,shuffle } from "./utils.js";

class QuestionGenerator {
    constructor(maxNumber, performanceTracker) {
        this.maxNumber = maxNumber;
        this.performanceTracker = performanceTracker;
        this.numberOfOptions = 4;
        this.lastA = null;
        this.lastB = null;
        this.lastTarget = null;
        this.allowedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Default to prevent undefined
    }

    generateBatch(num = 50, fixedB = null, stage = 1) {
        const batch = [];
        for (let i = 0; i < num; i++) {
            batch.push(this.generateAdaptiveQuestion(fixedB, stage));
        }
        return batch;
    }

    generateAdaptiveQuestion(fixedB = null, stage = 1) {
        const stats = this.performanceTracker.getStatistics();
        let problematic = stats.problematicProblems || [];
        let prob = 0.5 + (stage - 1) * 0.1;
        prob = Math.min(0.8, prob);

        if (fixedB !== null) {
            problematic = problematic.filter(key => key.split('x')[1] == fixedB);
            prob = 0.7;
        }

        let a, b, target;
        let tries = 0;
        const maxFactor = 10;
        const maxTarget = 50;

        do {
            if (problematic.length > 0 && Math.random() < prob) {
                const randomProblem = problematic[Math.floor(Math.random() * problematic.length)];
                const parts = randomProblem.split('x').map(Number);
                a = parts[0];
                b = parts[1];
                if (fixedB !== null) b = fixedB;
            } else {
                if (fixedB !== null) {
                    b = fixedB;
                    a = Math.floor(Math.random() * maxFactor) + 1;
                } else {
                    if (Math.random() < 0.5) {
                        b = this.allowedTables[Math.floor(Math.random() * this.allowedTables.length)];
                        a = Math.floor(Math.random() * maxFactor) + 1;
                    } else {
                        a = this.allowedTables[Math.floor(Math.random() * this.allowedTables.length)];
                        b = Math.floor(Math.random() * maxFactor) + 1;
                    }
                }
            }
            target = a * b;
            tries++;
        } while (
            (a === this.lastA && b === this.lastB) ||
            target > maxTarget ||
            tries < 5
        );

        this.lastA = a;
        this.lastB = b;
        this.lastTarget = target;
        const factors = this.getFactors(target).filter(f => f <= maxFactor);

        const questionData = { a, b, target, factors };
        return questionData;
    }

    generateSpecificQuestion(a, b) {
        const maxFactor = 10;
        const target = a * b;
        const factors = this.getFactors(target).filter(f => f <= maxFactor);
        const questionData = { a, b, target, factors };
        return questionData;
    }

    getFactors(number) {
        const factors = [];
        for (let i = 1; i <= Math.sqrt(number); i++) {
            if (number % i === 0) {
                factors.push(i);
                if (i !== number / i) {
                    factors.push(number / i);
                }
            }
        }
        return factors.sort((a, b) => a - b);
    }

    generateOptions(correct, a, b) {
        const options = new Set([correct]);
        const maxTarget = 50;
        const candidates = [
            a * (b + 1),
            a * (b - 1),
            (a + 1) * b,
            (a - 1) * b,
            correct + 1,
            correct - 2,
            correct + 10
        ].filter(p => p > 0 && p <= maxTarget);

        this.shuffle(candidates);
        for (const p of candidates) {
            if (options.size >= this.numberOfOptions) break;
            if (!options.has(p)) {
                options.add(p);
            }
        }
        while (options.size < this.numberOfOptions) {
            const r = Math.floor(Math.random() * maxTarget) + 1;
            if (!options.has(r)) {
                options.add(r);
            }
        }
        return this.shuffle([...options]);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setAllowedTables(tables) {
        this.allowedTables = tables;
    }
}

export default QuestionGenerator;