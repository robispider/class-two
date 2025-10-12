import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config, emitter } from "./main.js";
import { toBangla, shuffle, rand } from "./utils.js";
import { updateVisualization, clearVisualization } from "./visualization.js";
import { showCongratsPane, countdownAnimation } from "./congratsPane.js";
import PerformanceTracker from "./performanceTracker.js";
import QuestionGenerator from "./questionGenerator.js";
import { showLevelScreen } from "./levelScreen.js";
import { HealthBar } from "./healthBar.js";
import { StandardQuestion } from "./standardQuestion.js";
import { FactorPairsQuestion } from "./factorPairsQuestion.js";
import { PuzzleQuestion } from "./puzzleQuestion.js";
import { CascadeQuestion } from "./cascadeQuestion.js";
import { ShootingQuestion } from "./ShootingQuestion.js";


export function startStage(mode, level, allowedTables = [1, 2, 3, 4, 5]) {
    const S = gameState.gameContainer.stage;
    console.log("startStage: mode =", mode);
    try {
        gameState.mode = mode;
        gameState.currentLevel = level;
        gameState.currentStage = gameState.currentStage || 1;
        gameState.gameContainer.visible = true;
        gameState.layoutManager.resize();
        gameState.performanceTracker = new PerformanceTracker();
        gameState.performanceTracker.loadFromLocal();
        gameState.maxNumber = gameState.controller.getLevelMaxNumber(gameState.currentLevel);
        gameState.timeLimit = gameState.controller.getTimeLimit(gameState.currentStage);
        gameState.questionGenerator = new QuestionGenerator(gameState.maxNumber, gameState.performanceTracker);
        gameState.score = 0;
        gameState.streak = 0;
        gameState.questionCount = 0;
        gameState.correctCount = 0;
        gameState.savedTime = 0;
        gameState.bonusRemaining = 0;
        gameState.isBonus = false;
        gameState.mainAnswered = 0;
        gameState.gameActive = true;

        if (gameState.mode !== "practice") {
            gameState.titleLabel.text = `লেভেল ${toBangla(gameState.currentLevel)} - স্টেজ ${toBangla(gameState.currentStage)}`;
            gameState.scoreLabel.text = `স্কোর: ০`;
            if (gameState.statsLabels?.bonus) {
                gameState.statsLabels.bonus.visible = true;
            }
        } else {
            gameState.titleLabel.text = `প্র্যাকটিস: গুণ ${toBangla(gameState.fixedMultiplier || allowedTables[0])}`;
            gameState.scoreContainer.removeAllChildren();
            gameState.scoreLabel.text = "";
            gameState.healthBar = new HealthBar().center(gameState.scoreContainer);
            gameState.healthBar.initialize(S, () => {
                console.log("HealthBar initialized");
                updateHealthBar(S);
            });
            if (gameState.statsLabels?.bonus) {
                gameState.statsLabels.bonus.visible = false;
            }
        }

        updateStatsLabel(S);
        S.frame.canvas.focus();
        console.log('resize called');
        gameState.layoutManager.resize();
        S.update();

        startQuestionSet(mode, gameState.currentStage, allowedTables);
    } catch (e) {
        console.error("startStage failed:", e);
        gameState.feedbackLabel.text = "গেম শুরু করতে ত্রুটি। মেনুতে ফিরে যাচ্ছে।";
        S.update();
        setTimeout(endGame, 2000);
    }
}

export function startQuestionSet(mode, stage, allowedTables) {
    const S = gameState.gameContainer.stage;
    console.log("startQuestionSet called", { mode, stage, allowedTables });
    if (!gameState.gameActive) {
        console.log("Game not active, skipping startQuestionSet");
        return;
    }
    try {
        if (gameState.currentQuestion) {
            gameState.currentQuestion.cleanup();
            gameState.currentQuestion = null;
        }

        gameState.mode = mode;
        gameState.currentStage = stage;
        gameState.fixedMultiplier = mode === "practice" ? allowedTables[0] : null;

        const callbacks = {
            onCorrect: (points, feedbackText) => {
                console.log(`Correct: ${points} points, ${feedbackText}`);
            },
            onIncorrect: (points, feedbackText) => {
                console.log(`Incorrect: ${points} points, ${feedbackText}`);
            },
            onScoreChange: (score) => {
                if (gameState.mode !== "practice") {
                    gameState.scoreLabel.text = `স্কোর: ${toBangla(score)}`;
                }
            },
            onUpdateStats: () => {
                updateStatsLabel(S);
            },
            onCompleteSet: (feedback, success) => {
                zim.timeout(1, () => {
                    feedback.animate({ alpha: 0 }, 1, () => {
                        feedback.removeFrom();
                        endStage(success);
                        S.update();
                    });
                });
            }
        };

        let QuestionClass;
        if (gameState.currentStage <= 2 || (mode === "practice" && gameState.currentStage <= 3)) {
            QuestionClass = StandardQuestion;
        } else if (gameState.currentStage === 3) {
            QuestionClass = FactorPairsQuestion;
        } else if (gameState.currentStage === 4) {
            QuestionClass = PuzzleQuestion;
        } else if (gameState.currentStage === 5) {
            QuestionClass = CascadeQuestion;
        } else if (gameState.currentStage === 5) {
            QuestionClass = StandardQuestion;
        }else if (gameState.currentStage === 6) {
            QuestionClass = ShootingQuestion;
        }

        gameState.currentQuestion = new QuestionClass(
            gameState,
            S,
            callbacks,
            gameState.timeLimit,
            gameState.controller.questionsPerSession || 20,
            allowedTables
        );
        gameState.currentQuestion.startQuestionSet();
        S.update();
    } catch (e) {
        console.error("startQuestionSet failed:", e);
    }
}

function updateHealthBar(S) {
    S.update();
}

export function updateStatsLabel(S) {
    gameState.statsLabels.question.text = `প্রশ্ন: ${toBangla(gameState.questionCount)}`;
    gameState.statsLabels.correct.text = `সঠিক: ${toBangla(gameState.correctCount)}`;
    gameState.statsLabels.incorrect.text = `ভুল: ${toBangla(gameState.questionCount - gameState.correctCount)}`;
    gameState.statsLabels.bonus.text = `বোনাস: ${toBangla(gameState.bonusRemaining)}`;
    S.update();
}

function showPracticeCompletePane(S) {
    console.log("showPracticeCompletePane called");
    try {
        gameState.gameActive = false;
        gameState.stopwatch.stop();
        S.off("keydown");
        const pane = new zim.Pane({
            width: 600,
            height: 400,
            label: new zim.Label({
                text: "অভিনন্দন! আপনি এই প্র্যাকটিস সম্পূর্ণ করেছেন।\n\nপুনরায় প্র্যাকটিস করতে চান?",
                size: 30,
                color: config.colors.text,
                align: "center"
            }),
            backgroundColor: config.colors.panel,
            backdropColor: zim.black.toAlpha(0.8),
            close: false
        }).show();

        const replayButton = new zim.Button({
            label: new zim.Label({ text: "পুনরায় প্র্যাকটিস করুন", color: config.colors.text, bold: true, size: 30 }),
            backgroundColor: config.colors.option1,
            rollBackgroundColor: config.colors.option1.darken(0.2),
            borderColor: config.colors.panelBorder,
            borderWidth: 4,
            corner: 20,
            width: 300,
            height: 80
        }).center(pane).mov(0, 100).tap(() => {
            console.log("Replay practice clicked");
            pane.hide();
            countdownAnimation(() => startStage(gameState.mode, gameState.currentLevel, [gameState.fixedMultiplier]));
        });

        const backButton = new zim.Button({
            label: new zim.Label({ text: "পিছনে", color: config.colors.text, bold: true, size: 30 }),
            backgroundColor: config.colors.stopButton,
            rollBackgroundColor: config.colors.stopButton.darken(0.2),
            borderColor: config.colors.panelBorder,
            borderWidth: 4,
            corner: 20,
            width: 300,
            height: 80
        }).center(pane).mov(0, 190).tap(() => {
            console.log("Back to level screen clicked");
            pane.hide();
            returnToLevel(S);
        });
    } catch (e) {
        console.error("showPracticeCompletePane failed:", e);
        endGame();
    }
}

function returnToLevel(S) {
    console.log("returnToLevel called");
    try {
        gameState.gameContainer.visible = false;
        gameState.performanceTracker.saveToLocal();
        const container = new zim.Container(S.frame.width, S.frame.height).addTo(S);
        showLevelScreen(gameState.currentLevel, container, S, S.frame, showStageScreen, showPracticeScreen, showStatsScreen, showLeaderboardScreen, startStage);
        S.update();
    } catch (e) {
        console.error("returnToLevel failed:", e);
        endGame();
    }
}

export function endStage(success) {
    const S = gameState.gameContainer.stage;
    console.log("endStage called: success =", success, gameState.stopwatch);
    try {
        gameState.gameActive = false;
        if (gameState.stopwatch!=null)
        {
        gameState.stopwatch.stop();
        }
        S.off("keydown");
        const sessionScore = gameState.score;
        gameState.performanceTracker.saveStageHigh(gameState.currentLevel, gameState.currentStage, sessionScore);
        if (success) {
            gameState.controller.unlockNextStage(gameState.currentLevel, gameState.currentStage);
            if (gameState.mode === "level_run" || gameState.mode === "overall_run") {
                gameState.levelRunScore += sessionScore;
                if (gameState.currentStage < gameState.controller.stagesPerLevel) {
                    showCongratsPane(() => {
                        gameState.currentStage++;
                        startStage(gameState.mode, gameState.currentLevel);
                    });
                    return;
                } else {
                    gameState.performanceTracker.saveLevelHigh(gameState.currentLevel, gameState.levelRunScore);
                    if (gameState.mode === "overall_run" && gameState.currentLevel < gameState.controller.levels.length) {
                        showCongratsPane(() => {
                            gameState.overallScore += gameState.levelRunScore;
                            gameState.currentLevel++;
                            gameState.currentStage = 1;
                            gameState.levelRunScore = 0;
                            startStage(gameState.mode, gameState.currentLevel);
                        });
                        return;
                    } else if (gameState.mode === "overall_run") {
                        gameState.performanceTracker.saveOverallHigh(gameState.overallScore);
                    }
                }
            } else {
                showCongratsPane(endGame);
                return;
            }
        } else if (gameState.mode === "practice") {
            showPracticeCompletePane(S);
            return;
        }
        endGame();
    } catch (e) {
        console.error("endStage failed:", e);
        endGame();
    }
}

export function endGame() {
    const S = gameState.gameContainer.stage;
    console.log("endGame called");
    try {
        gameState.gameActive = false;
        gameState.gameContainer.visible = false;
        gameState.performanceTracker.saveToLocal();
        gameState.startScreen = createStartScreen(S, S.frame.width, S.frame.height, (level, container) => showLevelScreen(level, container, S, S.frame, showStageScreen, showPracticeScreen, showStatsScreen, showLeaderboardScreen, startStage), showStatsScreen, showLeaderboardScreen, startStage);
        S.update();
    } catch (e) {
        console.error("endGame failed:", e);
    }
}