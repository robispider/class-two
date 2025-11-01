// js/game.js
import { config } from './config.js';
import { gameState } from './gameState.js';
import { toBangla } from './utils.js';
import PerformanceTracker from './PerformanceTracker.js';
import QuestionGenerator from './QuestionGenerator.js';
import GameplayController from './GameplayController.js';
import { showCongratsPane } from './congratsPane.js';
import { StandardQuestion } from './questions/StandardQuestion.js';
import { FactorPairsQuestion } from './questions/FactorPairsQuestion.js';
import { PuzzleQuestion } from './questions/PuzzleQuestion.js';
import { CascadeQuestion } from './questions/CascadeQuestion.js';
import { ShootingQuestion } from './questions/ShootingQuestion.js';
import { leaderboardManager } from './LeaderboardManager.js';

export function startStage(scene, mode, level, allowedTables = [1, 2, 3, 4, 5]) {
    console.log('startStage called with scene:', scene, 'mode:', mode, 'level:', level, 'stage:', gameState.currentStage, 'allowedTables:', allowedTables); // Debug
    if (!scene || !(scene instanceof Phaser.Scene)) {
        console.error('Invalid or undefined scene provided to startStage');
        return;
    }
    gameState.mode = mode;
    gameState.currentLevel = level;
    gameState.currentStage = gameState.currentStage || 1;
    gameState.currentStageName="";
    gameState.gameActive = true;
    gameState.performanceTracker = new PerformanceTracker();
    gameState.performanceTracker.loadFromLocal();
    gameState.maxNumber = gameState.controller.getLevelMaxNumber(gameState.currentLevel);
    gameState.timeLimit = gameState.controller.getTimeLimit(gameState.currentStage);
    gameState.questionGenerator = new QuestionGenerator(gameState.maxNumber, gameState.performanceTracker);
  gameState.questionGenerator.setAllLevelTables(gameState.controller.levels);

    gameState.score = 0;
    gameState.streak = 0;
    // gameState.totalBonus = 0;
    gameState.questionCount = 0;
    gameState.incorrectCount = 0;    
    gameState.correctCount = 0;
    gameState.savedTime = 0;
    gameState.bonusRemaining = 0;
    gameState.isBonus = false;
    gameState.mainAnswered = 0;

    startQuestionSet(scene, mode, gameState.currentStage, allowedTables);
    if (scene.stopwatch) {
        scene.stopwatch.setTime(gameState.timeLimit);
        scene.stopwatch.start();
    }
}

export function startQuestionSet(scene, mode, stage, allowedTables) {
    console.log('startQuestionSet called with scene:', scene, 'mode:', mode, 'stage:', stage, 'allowedTables:', allowedTables); // Debug
    if (!gameState.gameActive) {
        console.warn('Game is not active, aborting startQuestionSet');
        return;
    }
    if (gameState.currentQuestion) {
        gameState.currentQuestion.cleanup();
        gameState.currentQuestion = null;
    }
    gameState.mode = mode;
    gameState.currentStage = stage;
    gameState.fixedMultiplier = mode === "practice" ? allowedTables[0] : null;
    const callbacks = {
        onCorrect: (points, text) => {
            if (scene.feedbackLabel) {
                scene.feedbackLabel.setText(text);
                scene.feedbackLabel.setStyle({ fill: 'green' });
                scene.time.delayedCall(1000, () => {
                    if (scene.feedbackLabel) {
                        scene.feedbackLabel.setText('সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন');
                        scene.feedbackLabel.setStyle({ fill: config.colors.text });
                    }
                });
            } else {
                console.warn('feedbackLabel not found in scene');
            }
        },
        onIncorrect: (points, text) => {
            if (scene.feedbackLabel) {
                scene.feedbackLabel.setText(text);
                scene.feedbackLabel.setStyle({ fill: 'red' });
                scene.time.delayedCall(1000, () => {
                    if (scene.feedbackLabel) {
                        scene.feedbackLabel.setText('সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন');
                        scene.feedbackLabel.setStyle({ fill: config.colors.text });
                    }
                });
            } else {
                console.warn('feedbackLabel not found in scene');
            }
        },
        onScoreChange: (score) => {
            gameState.score = score;
            if (scene.scoreLabel) {
                scene.scoreLabel.setText(`স্কোর: ${toBangla(score)}`);
            }
        },
        onUpdateStats: () => {
            if (scene.statsLabels) {
                scene.statsLabels.question.setText(`প্রশ্ন: ${toBangla(gameState.questionCount)}`);
                scene.statsLabels.correct.setText(`সঠিক: ${toBangla(gameState.correctCount)}`);
                // scene.statsLabels.incorrect.setText(`ভুল: ${toBangla(gameState.questionCount - gameState.correctCount)}`);
                           scene.statsLabels.incorrect.setText(`ভুল: ${toBangla(gameState.incorrectCount)}`);
                // scene.statsLabels.bonus.setText(`বোনাস: ${toBangla(gameState.streak * config.points.streakBonus)}`);
                // scene.statsLabels.bonus.setText(`বোনাস: ${toBangla(gameState.totalBonus)}`);
                 scene.statsLabels.bonus.setText(`বোনাস: ${toBangla(gameState.streak * config.points.streakBonus)}`);
                
            }
        },
        onCompleteSet: (feedback, success) => {
            if (scene.feedbackLabel) {
                scene.feedbackLabel.setText(feedback);
                scene.feedbackLabel.setStyle({ fill: success ? 'green' : 'red' });
            }
            if (scene.stopwatch) scene.stopwatch.stop();
            scene.time.delayedCall(2000, () => {
                endStage(scene, success);
            });
        }
    };
      
         gameState.timingModel = 'per-question';
    let QuestionClass;
    //   "ছবির গুণ"
    //     "ধাঁধার ছবি"
    //     "বাক্স রহস্য"
    //     "সংখ্যার জুটি"
    //     "আকাশের প্রহরী"
    if (stage===1)
    {
QuestionClass = StandardQuestion;
gameState.currentStageName="ছবির গুণ";
    }
    else if (stage ===2) {
         QuestionClass = PuzzleQuestion;
        gameState.timingModel = 'per-set';
        gameState.currentStageName="ধাঁধার ছবি";
        
    } else if (stage === 3) {
        
        QuestionClass = StandardQuestion;
        gameState.currentStageName="বাক্স রহস্য";
    } else if (stage === 4) {
       
        QuestionClass = FactorPairsQuestion;
        gameState.currentStageName="সংখ্যার জুটি";
   
    } else if (stage === 5) {
        QuestionClass = ShootingQuestion;
        gameState.currentStageName="আকাশের প্রহরী";
    } else {
        console.error('No valid QuestionClass for stage:', stage);
        QuestionClass = StandardQuestion; // Fallback
        gameState.currentStageName="ছবির গুণ";
    }
    console.log('Selected QuestionClass:', QuestionClass.name); // Debug
    try {
        gameState.currentQuestion = new QuestionClass(
            gameState,
            scene,
            callbacks,
            gameState.timeLimit,
            config.questionsPerSession,
            allowedTables || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        );
        console.log('Question instance created:', gameState.currentQuestion); // Debug
        gameState.currentQuestion.startQuestionSet();
    } catch (error) {
        console.error('Error creating question:', error);
    }
}

export function endStage(scene, success) {
    console.log('endStage called, success:', success);
    gameState.gameActive = false;
    if (scene.stopwatch) scene.stopwatch.stop();
  // --- ADD THESE LINES ---
    const totalTimeMS = scene.time.now - scene.stageStartTime;
    const timeInSeconds = Math.round(totalTimeMS / 1000);
    // --- END ADD ---
    const sessionScore = gameState.score;
       leaderboardManager.addScore(
        gameState.currentUser,
        gameState.currentLevel,
        gameState.currentStage,
        sessionScore,
             timeInSeconds 
    );
    

    // gameState.performanceTracker.saveStageHigh(gameState.currentLevel, gameState.currentStage, sessionScore);
    gameState.performanceTracker.saveOverallHigh(sessionScore);
    // --- NEW: Accuracy Check for Unlocking ---
    // const accuracyPercentage = (gameState.correctCount / gameState.questionCount) * 100;
    // const isUnlocked = accuracyPercentage >= gameState.controller.requiredCorrectPercent;

    // if (success && isUnlocked) {
    //     // Player passed AND met the accuracy requirement
    //     gameState.controller.unlockNextStage(gameState.currentLevel, gameState.currentStage);
    //   //  showCongratsPane(scene, () => endGame(scene));
    //     showCongratsPane(scene);
    // } else {
    //     // Player either failed or did not meet the 90% accuracy
    //     endGame(scene);
    // }

      // --- MODIFIED LOGIC ---
    const accuracyPercentage = gameState.questionCount > 0 ? (gameState.correctCount / gameState.questionCount) * 100 : 0;
    const canAdvance = success && (accuracyPercentage >= gameState.controller.requiredCorrectPercent);

    if (canAdvance) {
        // Only unlock the next stage if they actually passed.
        gameState.controller.unlockNextStage(gameState.currentLevel, gameState.currentStage);
    }

    // --- ALWAYS show the summary pane, but tell it if the user won or not ---
    showCongratsPane(scene, { didWin: canAdvance, accuracy: accuracyPercentage });
}


// js/game.js

export function endGame(scene) {
    console.log('endGame called');
    gameState.gameActive = false;
    if (scene.stopwatch) scene.stopwatch.stop();
    gameState.performanceTracker.saveToLocal();

    // --- ENHANCED: Save the last played level and stage for the current user ---
    const key = `mathGame_${gameState.currentUser}_lastPlayed`;
    try {
        // Load the existing last played data, or create a new object if it doesn't exist
        const lastPlayedRaw = localStorage.getItem(key);
        let lastPlayedData = lastPlayedRaw ? JSON.parse(lastPlayedRaw) : { lastActiveLevel: 1, lastStages: {} };

        // Update the data with the session that just ended
        lastPlayedData.lastActiveLevel = gameState.currentLevel;
        lastPlayedData.lastStages[gameState.currentLevel] = gameState.currentStage;

        // Save the updated object back to localStorage
        localStorage.setItem(key, JSON.stringify(lastPlayedData));
    } catch (error) {
        console.error('Failed to save last played state.', error);
    }

    scene.scene.start('StartScreenScene');
}