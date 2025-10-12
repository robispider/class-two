import zim from "https://zimjs.org/cdn/018/zim_game";
import { config } from "./main.js";
import { toBangla, shuffle, rand } from "./utils.js";
import { createStopwatch } from "./stopwatch.js";

export class Question {
    constructor(gameState, S, callbacks, timeLimit, numQuestions, allowedTables) {
        this.gameState = gameState;
        this.S = S;
        this.callbacks = callbacks || {
            onCorrect: () => {},
            onIncorrect: () => {},
            onScoreChange: () => {},
            onUpdateStats: () => {},
            onCompleteSet: () => {}
        };
        this.timeLimit = timeLimit; // Time limit per question in seconds
        this.numQuestions = numQuestions; // Total questions in the set
        this.allowedTables = allowedTables; // Array of allowed multiplication tables, e.g., [1, 2, 3, 4, 5]
        this.currentQuestionIndex = 0;
        this.stopwatch = null;
        this.keyHandler = null;
        this.questionData = null;
        this.questionGenerator = gameState.questionGenerator;
        this.maxMultiplyNumber=10;
    }

    startQuestionSet() {
        this.currentQuestionIndex = 0;
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
        this.setupStopwatch();
        this.nextQuestion();
    }

    setupStopwatch() {
        if (this.stopwatch) {
            this.stopwatch.stop();
            this.stopwatch.removeFrom();
        }
        this.stopwatch = createStopwatch(
            this.timeLimit, // Total time in seconds
            30, // Height
            200, // Width
            this.gameState.layoutManager, // Layout manager from gameState
            this.S // Stage
        );
        this.stopwatch.center(this.gameState.timerContainer);
        this.stopwatch.on("done", () => this.handleTimeUp());
        this.stopwatch.start();
    }

    generateQuestionData() {
        const b = this.gameState.mode === "practice" 
            ? this.allowedTables[0] // Use first table in practice mode
            : this.allowedTables[Math.floor(Math.random() * this.allowedTables.length)];
        return this.questionGenerator.generateAdaptiveQuestion(
            b, this.gameState.currentStage
        );
    }

    setup() {
        this.gameState.qaRegion.removeAllChildren();
        if (this.gameState.questionTitle) {
            this.gameState.questionTitle.removeFrom();
            this.gameState.questionTitle = null;
        }
        const colors = [zim.purple, zim.pink];
        this.gameState.questionTitle = new zim.Label({ 
            text: "", 
            size: 30, 
            color: new zim.GradientColor(colors, 0), 
            align: "center", 
            bold: true,
            lineWidth: this.gameState.qaRegion.width - 40
        }).center(this.gameState.qaRegion).alp(0);
    }

    cleanup() {
        this.gameState.qaRegion.removeAllChildren();
        if (this.keyHandler) {
            this.S.off("keydown", this.keyHandler);
            this.keyHandler = null;
        }
        if (this.gameState.questionTitle) {
            this.gameState.questionTitle.removeFrom();
            this.gameState.questionTitle = null;
        }
        if (this.stopwatch) {
            this.stopwatch.stop();
            this.stopwatch.removeFrom();
            this.stopwatch = null;
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
        this.setupStopwatch();
        this.currentQuestionIndex++;
        this.S.update();
    }

    handleTimeUp() {
        const points = config.points.incorrect;
        this.gameState.streak = 0;
        this.handleIncorrect(points, "সময় শেষ!");
        if (this.gameState.mode === "practice") {
            this.gameState.healthBar.reduceHealth();
            if (this.gameState.healthBar.currentHealth <= 0) {
                this.completeSet();
                return;
            }
        }
        this.gameState.questionCount++;
        const feedback = new zim.Label({
            size: 60,
            color: "red",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15,
            text: "সময় শেষ!"
        }).center(this.S);
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
        feedback.animate({ alpha: 0 }, 1, () => {
            feedback.removeFrom();
            this.nextQuestion();
        });
    }

    completeSet() {
        this.cleanup();
        const success = this.gameState.correctCount / this.gameState.questionCount * 100 >= this.gameState.controller.requiredCorrectPercent;
        const feedback = new zim.Label({
            size: 60,
            color: success ? "green" : "red",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15,
            text: success ? "স্টেজ সম্পূর্ণ!" : "আবার চেষ্টা করুন!"
        }).center(this.S);
        this.callbacks.onCompleteSet(feedback, success);
    }
}