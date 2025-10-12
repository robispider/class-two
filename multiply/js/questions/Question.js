// js/questions/Question.js
import { toBangla, shuffle } from '../utils.js';
class Question {
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
        this.stopwatch = null;
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
        // To be overridden by child classes
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
        const points = config.points.incorrect;
        this.gameState.streak = 0;
        this.handleIncorrect(points, "সময় শেষ!");
        this.gameState.questionCount++;
        const feedback = this.scene.add.text(this.scene.cameras.main.width / 2, this.scene.cameras.main.height / 2, "সময় শেষ!", {
            fontSize: '60px',
            fill: 'red',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { left: 20, right: 20, top: 20, bottom: 20 }
        }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            duration: 1000,
            onComplete: () => feedback.destroy()
        });
        this.transitionToNext(feedback);
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

    handleIncorrect(points, feedbackText) {
        this.gameState.score = Math.max(0, this.gameState.score + points);
        this.gameState.streak = 0;
        this.callbacks.onIncorrect(points, feedbackText);
        this.callbacks.onScoreChange(this.gameState.score);
        this.callbacks.onUpdateStats();
    }

    transitionToNext(feedback) {
        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                feedback.destroy();
                this.nextQuestion();
            }
        });
    }

    completeSet() {
        this.cleanup();
        const success = this.gameState.correctCount / this.gameState.questionCount * 100 >= this.gameState.controller.requiredCorrectPercent;
        const feedback = this.scene.add.text(this.scene.cameras.main.width / 2, this.scene.cameras.main.height / 2, success ? "স্টেজ সম্পূর্ণ!" : "আবার চেষ্টা করুন!", {
            fontSize: '60px',
            fill: success ? 'green' : 'red',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { left: 20, right: 20, top: 20, bottom: 20 }
        }).setOrigin(0.5);
        this.callbacks.onCompleteSet(feedback, success);
    }
}

export { Question };