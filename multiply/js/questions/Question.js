// js/questions/Question.js
import { toBangla, shuffle } from '../utils.js';
import { config } from '../config.js';
import { ScoreCalculator } from '../ScoreCalculator.js';
// import { gameState } from './gameState.js';

class Question    {
    constructor(gameState, scene, callbacks, timeLimit, numQuestions, allowedTables) {
        this.gameState = gameState;
        this.scene = scene;
        this.callbacks = callbacks || {
            onCorrect: () => {},
            onIncorrect: () => {},
            onScoreChange: () => {},
            onUpdateStats: () => {},
            onCompleteSet: () => {}
        };
        this.timeLimit = timeLimit;
        this.numQuestions = numQuestions;
        this.allowedTables = allowedTables;
        this.currentQuestionIndex = 0;
          this.questionTimer = null; // Renamed from stopwatch for clarity
        this.keyHandler = null;
        this.questionData = null;
        this.questionGenerator = gameState.questionGenerator;
        this.maxMultiplyNumber = 10;
    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
        this.nextQuestion();
    }

    generateQuestionData() {
        const b = this.gameState.mode === "practice" 
            ? this.allowedTables[0]
            : this.allowedTables[Math.floor(Math.random() * this.allowedTables.length)];
        return this.questionGenerator.generateAdaptiveQuestion(
            b, this.gameState.currentStage
        );
    }

    setup() {
        // To be overridden by child classes
    }

       cleanup() {
        if (this.questionTimer) {
            this.questionTimer.remove();
            this.questionTimer = null;
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.completeSet();
            return;
        }
        this.cleanup();
        this.questionData = this.generateQuestionData();
        this.setup();
        this.currentQuestionIndex++;
    }

     handleTimeUp() {
        // This is now ONLY called by a per-question timer.
        this.handleIncorrect(config.points.incorrect, "সময় শেষ!");
        this.transitionToNext();
    }


    generateOptions(correct) {
        const options = new Set([correct]);
        const candidates = this.questionData.a && this.questionData.b ? [
            this.questionData.a * (this.questionData.b + 1), 
            this.questionData.a * (this.questionData.b - 1), 
            (this.questionData.a + 1) * this.questionData.b, 
            (this.questionData.a - 1) * this.questionData.b,
            correct + 1, correct - 2, correct + 10
        ] : [];
        shuffle(candidates);
        for (const p of candidates) {
            if (options.size >= 4) break;
            if (p > 0 && !options.has(p)) {
                options.add(p);
            }
        }
        while (options.size < 4) {
            const r = Math.floor(Math.random() * (this.gameState.maxNumber * this.gameState.maxNumber)) + 1;
            if (!options.has(r)) {
                options.add(r);
            }
        }
        return shuffle([...options]);
    }

handleCorrect(points, feedbackText) {
        this.gameState.score = Math.max(0, this.gameState.score + points);
        this.gameState.correctCount++;
        this.gameState.streak++;
        this.callbacks.onCorrect(points, feedbackText);
        this.callbacks.onScoreChange(this.gameState.score);
        this.callbacks.onUpdateStats();
    }


    handleIncorrect(feedbackText) {
        // NEW: Get the standard penalty from the ScoreCalculator
        const points = ScoreCalculator.getIncorrectPenalty();

        this.gameState.score = Math.max(0, this.gameState.score + points);
        this.gameState.streak = 0; // Streak is always reset
        this.callbacks.onIncorrect(points, feedbackText);
        this.callbacks.onScoreChange(this.gameState.score);
        this.callbacks.onUpdateStats();
    }

   transitionToNext() {
        // Wait for 1 second (1000ms) before calling the nextQuestion method.
        this.scene.time.delayedCall(1000, this.nextQuestion, [], this);
    }


    completeSet() {
        this.cleanup();
        
        const success = (this.gameState.correctCount / this.gameState.questionCount) * 100 >= this.gameState.controller.requiredCorrectPercent;
        
        // --- FIX: Determine the feedback STRING, don't create a new text object ---
        const feedbackText = success ? "স্টেজ সম্পূর্ণ!" : "আবার চেষ্টা করুন!";

        // Pass the string to the callback, which will handle displaying it.
        this.callbacks.onCompleteSet(feedbackText, success);
    }
      update(time, delta) {
        // By default, do nothing.
    }
}

export { Question };