
import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config, emitter } from "./main.js";
import { toBangla, shuffle, rand } from "./utils.js";
import { updateVisualization ,clearVisualization} from "./visualization.js";
import { showCongratsPane, countdownAnimation } from "./congratsPane.js";
import PerformanceTracker from "./performanceTracker.js";
import QuestionGenerator from "./questionGenerator.js";
import { showLevelScreen } from "./levelScreen.js";
import { HealthBar } from "./healthBar.js";

// Initializes a new stage or practice session
export function startStage() {
    const S = gameState.gameContainer.stage;
    console.log("startStage: mode =", gameState.mode);
    try {
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
            gameState.titleLabel.text = `প্র্যাকটিস: গুণ ${toBangla(gameState.fixedMultiplier)}`;
            gameState.scoreContainer.removeAllChildren();
            gameState.scoreLabel.text = "";
            gameState.healthBar = new HealthBar().center(gameState.scoreContainer);
            gameState.healthBar.initialize(S, () => {
                console.log("HealthBar initialized");
                updateHealthBar(S);
                generateQuestion();
            });
            if (gameState.statsLabels?.bonus) {
                gameState.statsLabels.bonus.visible = false;
            }
        }

        updateStatsLabel(S);
        S.on("keydown", handleKeyDown, null, true); // Single event listener
        S.frame.canvas.focus();
        console.log('resize called');
        gameState.layoutManager.resize();
        S.update();
    } catch (e) {
        console.error("startStage failed:", e);
        gameState.feedbackLabel.text = "গেম শুরু করতে ত্রুটি। মেনুতে ফিরে যাচ্ছে।";
        S.update();
        setTimeout(endGame, 2000);
    }
}
export function startQuestionSet(mode, level, allowedTables) {
    const S = gameState.gameContainer.stage;
    console.log("startQuestionSet called", { mode, level, allowedTables });
    if (!gameState.gameActive) {
        console.log("Game not active, skipping startQuestionSet");
        return;
    }
    try {
        // Clear existing question if any
        if (gameState.currentQuestion) {
            gameState.currentQuestion.cleanup();
            gameState.currentQuestion = null;
        }

        gameState.mode = mode; // "practice" or "level"
        gameState.currentStage = level; // 1, 2, 3, 4, 5
        gameState.fixedMultiplier = mode === "practice" ? allowedTables[0] : null;

        const callbacks = {
            onCorrect: (points, feedbackText) => {
                // Additional logic if needed
                console.log(`Correct: ${points} points, ${feedbackText}`);
            },
            onIncorrect: (points, feedbackText) => {
                // Additional logic if needed
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
        }

        gameState.currentQuestion = new QuestionClass(
            gameState,
            S,
            callbacks,
            config.timeLimit || 30, // Default 30 seconds per question
            config.questionsPerSession || 20, // Default 20 questions
            allowedTables // e.g., [1, 2, 3, 4, 5] or [2] for practice
        );
        gameState.currentQuestion.startQuestionSet();
        S.update();
    } catch (e) {
        console.error("startQuestionSet failed:", e);
    }
}
// Generates a new question and answer options
export function generateQuestion() {
    const S = gameState.gameContainer.stage;
    console.log("generateQuestion called");
    if (!gameState.gameActive) {
        console.log("Game not active, skipping generateQuestion");
        return;
    }
    try {
        if (gameState.optionTile) {
            gameState.optionTile.removeFrom();
            gameState.optionTile = null;
        }
// if (gameState.questionLabel)
// {
//      gameState.questionLabel.removeFrom();
//             gameState.questionLabel = null;
// }
//  gameState.questionLabel = new zim.Label({ 
//         text: "...", 
//         size: 60, 
//         color: config.colors.text, 
//         align: "center", 
//         bold: true 
//     }).center(gameState.qaRegion).alp(0);
  if (gameState.questionContainer) {
            gameState.questionContainer.removeFrom();
            gameState.questionContainer = null;
        }

    if (gameState.questionTitle)
{
     gameState.questionTitle.removeFrom();
            gameState.questionTitle = null;
}
const colors = [purple,pink];
 gameState.questionTitle = new zim.Label({ 
        text: "", 
        size: 30, 
        color:  new GradientColor(colors,0), 
        align: "center", 
        bold: true ,
          // qaRegion এর প্রস্থ থেকে 40 পিক্সেল কম জায়গা দেওয়া হয়েছে যাতে লেখাটি কন্টেইনারের ভেতরে থাকে
            lineWidth: gameState.qaRegion.width - 40
    }).center(gameState.qaRegion).alp(0);
	// gameState.questionTitle.loop(letter=>{
	// 	// shadow: color, x, y, blur 
	// 	// wiggle: prop, start, min, max, minTime, maxTime
	// 	letter.sha(colors().toAlpha(.5),8,8,0).wiggle("rotation",0,5,10,.2,.4);
	// });
//     gameState.questionTitle .animate({
//       props:{scale:1.1, rotation:-5},
//       wait:.5,
//       time:.2,
//       sequence:.05,
//       rewind:true
//    }).wiggle("rotation",0,1,3,.2,.4);
    //.center(gameState.qaRegion).mov(0, -150);


        let a, b;
        if (gameState.mode === "practice") {
            ({ a, b } = gameState.questionGenerator.generateAdaptiveQuestion(gameState.fixedMultiplier, 3));
        } else {
            ({ a, b } = gameState.questionGenerator.generateAdaptiveQuestion(null, gameState.currentStage));
        }

           // Pick a random item index from your new asset configuration
            const randomItemIndex = rand(0, config.assets.count - 1);
    // You can now access the name of the displayed item if needed for UI
            const currentItemName = config.assets.itemNames[randomItemIndex];
             gameState.questionTitle.text =`কতগুলি ${currentItemName} দেখা যাচ্ছে?`;

        gameState.currentA = a;
        gameState.currentB = b;
        gameState.currentAnswer = a * b;
        // gameState.questionLabel.text = `${toBangla(a)} × ${toBangla(b)} = ?`;
        // --- START: নতুন প্রশ্ন তৈরির পদ্ধতি ---
        // একটি কন্টেইনার তৈরি করা হচ্ছে যেখানে লেবেল এবং ছবি থাকবে
        gameState.questionContainer = new zim.Container(gameState.qaRegion.width, 100)
            .center(gameState.qaRegion)
            .alp(0);

        // ১. প্রথম লেবেল
        const labelPart1 = new zim.Label({
            text: `${toBangla(a)} × ${toBangla(b)} = ?`,
            size: 60,
            color: config.colors.text,
            bold: true
        }).center(gameState.questionContainer);

        // // ২. আইটেমের ছবি (Sprite)
        // const itemSprite = new zim.Sprite({
        //     image: S.frame.asset(config.assets.fileName),
        //     cols: config.assets.cols,
        //     rows: config.assets.rows,
        //     count: config.assets.count
        // }).center(gameState.questionContainer).mov(120);

        // itemSprite.gotoAndStop(randomItemIndex);
        // itemSprite.siz(70, 70, true); // লেখার সাইজের সাথে মিলিয়ে ছবির সাইজ ঠিক করা হয়েছে

        // // ৩. শেষ লেবেল
        // const labelPart2 = new zim.Label({
        //     text: " ?",
        //     size: 60,
        //     color: config.colors.text,
        //     bold: true
        // }).center(gameState.questionContainer).mov(150);

        // Layout এর মাধ্যমে অংশগুলোকে পাশাপাশি সাজানো হয়েছে
    //    const q=  new zim.Layout({
    //         holder: gameState.questionContainer,
    //         regions: [
    //             { object: labelPart1 },
    //             { object: itemSprite },
    //             { object: labelPart2 }
    //         ],
    //         valign: "center", // সবগুলো অংশকে উল্লম্বভাবে মাঝে রাখা হয়েছে
    //         marginH: 2,     // অংশগুলোর মাঝে ১০ পিক্সেল ফাঁকা জায়গা
    //         vertical: false, // পাশাপাশি সাজানোর জন্য
    //         lastMargin: false
    //     });

        // gameState.layoutManager.add(q);


        // --- END: নতুন প্রশ্ন তৈরির পদ্ধতি ---


        gameState.questionTitle.animate(
            {
                props:{alpha:1,scale:1, x:250,y:80},
                time:1, // will be the default time for the inner animations
            ease:"backOut",
            }
        );

        gameState.questionContainer.animate(
            {
                props:{alpha:1,scale:1, x:0,y:150},
                time:1, // will be the default time for the inner animations
            ease:"backOut",
            }
        );


        try {
            // updateVisualization(a, b, S.frame,4);
         
            
            // Call updateVisualization with the random item index
            updateVisualization(a, b, S.frame, randomItemIndex);
            
        
            console.log("Visualizing item:", currentItemName); // Example of using the name
        } catch (e) {
            console.error("updateVisualization failed:", e);
            gameState.vizRegion.removeAllChildren();
        }

        let options = gameState.questionGenerator.generateOptions(gameState.currentAnswer, a, b);
        while (options.length < config.numberOfOptions) {
            const r = rand(1, gameState.maxNumber * gameState.maxNumber);
            if (!options.includes(r) && r !== gameState.currentAnswer) {
                options.push(r);
            }
        }
        options = shuffle(options);

        const tileCols = config.numberOfOptions === 4 ? 2 : 1;
        const tileRows = config.numberOfOptions === 4 ? 2 : config.numberOfOptions;
        const spacingH = config.numberOfOptions === 4 ? 20 : 0;
        const spacingV = 20;
        const buttonWidth = config.numberOfOptions === 4 ? 180 : 250;
        const buttonHeight = config.numberOfOptions === 4 ? 100 : 80;
        const movY = config.numberOfOptions === 4 ? 100 : 50;

        const optionColorList = [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4];
        const optionColors = zim.series(optionColorList);

        const buttons = options.map(opt => {
            const bgColor = optionColors();
            const button = new zim.Button({
                width: buttonWidth,
                height: buttonHeight,
                backgroundColor: bgColor,
                rollBackgroundColor: bgColor.darken(0.2),
                label: new zim.Label({ text: toBangla(opt), size: 40, color: config.colors.text, bold: true }),
                corner: 40,
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                shadowColor: "rgba(0,0,0,0.2)",
                shadowBlur: 4
            }).alp(0);
            button.answerValue = opt;
            return button;
        });

        gameState.optionTile = new zim.Tile({
            obj: zim.series(buttons),
            clone: false,
            cols: tileCols,
            rows: tileRows,
            spacingH: spacingH,
            spacingV: spacingV
        }).center(gameState.qaRegion).mov(0, movY);



zim.loop(buttons, (button, i) => {
    button.alp(0).sca(0);
    button.animate({
        props: { alpha: 1, scale: 1 },
         time: 0.5,
// sequence: 0.5, // Wait 0.1 seconds before starting the animation on the next button
     ease: "backOut" // A nice easing for a little bounce effect
    });
    
}, false,.2);


        gameState.optionTile.on("click", (e) => {
            if (!gameState.gameActive || !e.target || e.target.answerValue === undefined) return;
            console.log("Option clicked:", e.target.answerValue);
            const timeTaken = gameState.stopwatch.getElapsedTime();
            gameState.stopwatch.stop();
               e.target.alp(1).sca(1);
                e.target.animate({
                    props: { alpha: 0, scale: 0 },
                    time: 0.5,

                ease: "backOut" // A nice easing for a little bounce effect
                });

                 zim.loop(gameState.optionTile.items, (button, i) => {
                    // button.alp(1).sca(1);
                    button.animate({
                        props: { alpha: 0, scale: 0 },
                        time: 0.5,

                    ease: "backOut" // A nice easing for a little bounce effect
                    });
                    
                }, false,.1);
                gameState.questionContainer.animate(
                    {
                        props:{alpha:0,scale:0},
                        time:1, // will be the default time for the inner animations
                    ease:"backOut",
                    }
                );
                     gameState.questionTitle.animate(
                    {
                        props:{alpha:0,scale:0},
                        time:1, // will be the default time for the inner animations
                    ease:"backOut",
                    }
                );
                clearVisualization();


            checkAnswer(e.target.answerValue, timeTaken);
        }, null, true);

        gameState.answerString = "";
        gameState.typedLabel.text = "";
        gameState.feedbackLabel.text = "সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন";
        gameState.stopwatch.setTime(gameState.timeLimit);
        gameState.stopwatch.start();
        gameState.startTime = Date.now();
        S.update();
    } catch (e) {
        console.error("generateQuestion failed:", e);
        gameState.feedbackLabel.text = "প্রশ্ন তৈরিতে ত্রুটি। খেলা শেষ হচ্ছে।";
        S.update();
        setTimeout(endGame, 2000);
    }
}

// Handles keyboard input for answering questions
export function handleKeyDown(e) {
    const S = gameState.gameContainer.stage;
    if (!gameState.gameActive || !gameState.optionTile) {
        console.log("handleKeyDown: game not active or no optionTile");
        return;
    }
    console.log("handleKeyDown:", e.keyCode);
    try {
        if (e.keyCode >= 48 && e.keyCode <= 57) {
            gameState.answerString += String.fromCharCode(e.keyCode);
        } else if (e.keyCode === 8) {
            gameState.answerString = gameState.answerString.slice(0, -1);
        } else if (e.keyCode === 13 && gameState.answerString !== "") {
            const ans = parseInt(gameState.answerString);
            if (!isNaN(ans)) {
                console.log("Enter pressed, answer:", ans);
                const timeTaken = gameState.stopwatch.getElapsedTime();
                gameState.stopwatch.stop();
                checkAnswer(ans, timeTaken);
            }
        }
        gameState.typedLabel.text = toBangla(gameState.answerString);
        S.update();
    } catch (e) {
        console.error("handleKeyDown failed:", e);
        gameState.feedbackLabel.text = "ইনপুট ত্রুটি। পুনরায় চেষ্টা করুন।";
        S.update();
    }
}

// Checks the user's answer and updates game state
export function checkAnswer(answer, timeTaken) {
    const S = gameState.gameContainer.stage;
    console.log(`checkAnswer: Starting with answer=${answer}, timeTaken=${timeTaken}, gameActive=${gameState.gameActive}, mode=${gameState.mode}`);
    if (!gameState.gameActive) {
        console.log("checkAnswer: Game not active, exiting");
        return;
    }
    try {
        console.log(`checkAnswer: Current question: ${gameState.currentA} x ${gameState.currentB} = ${gameState.currentAnswer}`);
        const correct = answer === gameState.currentAnswer;
        console.log(`checkAnswer: Answer correct=${correct}`);

        console.log("checkAnswer: Logging response to performanceTracker");
        gameState.performanceTracker.logResponse(gameState.currentA, gameState.currentB, answer, timeTaken, correct);
        
        let points = correct ? config.points.correct + gameState.streak * config.points.streakBonus : config.points.incorrect;
        console.log(`checkAnswer: Calculated points=${points}, streak=${gameState.streak}, correctPoints=${config.points.correct}, streakBonus=${config.points.streakBonus}, incorrectPoints=${config.points.incorrect}`);

        console.log("checkAnswer: Creating feedback label");
        const feedback = new zim.Label({
            size: 60,
            color: correct ? "green" : "red",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15,
            alpha: 1
        }).center(S);
        console.log("checkAnswer: Feedback label created and centered");

        if (correct) {
            console.log("checkAnswer: Processing correct answer");
            gameState.streak++;
            gameState.correctCount++;
            console.log(`checkAnswer: Updated streak=${gameState.streak}, correctCount=${gameState.correctCount}`);
            if (gameState.mode !== "practice") {
                gameState.score += points;
                console.log(`checkAnswer: Updated score=${gameState.score}`);
            }
            feedback.text = `দারুণ!`;
            console.log("checkAnswer: Set feedback text to 'দারুণ!'");
            emitter.loc(gameState.questionLabel).spurt(30);
            console.log("checkAnswer: Emitted particle effect at questionLabel");
            if (!gameState.isBonus && gameState.mode !== "practice") {
                gameState.savedTime += Math.floor(gameState.timeLimit - timeTaken);
                console.log(`checkAnswer: Updated savedTime=${gameState.savedTime}, timeLimit=${gameState.timeLimit}`);
            }
        } else {
            console.log("checkAnswer: Processing incorrect answer");
            gameState.streak = 0;
            console.log(`checkAnswer: Reset streak=${gameState.streak}`);
            if (gameState.mode !== "practice") {
                gameState.score = Math.max(0, gameState.score + config.points.incorrect);
                console.log(`checkAnswer: Updated score=${gameState.score} (ensured non-negative)`);
            }
            feedback.text = `সঠিক উত্তর: ${toBangla(gameState.currentAnswer)}`;
            console.log(`checkAnswer: Set feedback text to 'সঠিক উত্তর: ${toBangla(gameState.currentAnswer)}'`);
        }
        gameState.mainAnswered++;
        console.log(`checkAnswer: Incremented mainAnswered=${gameState.mainAnswered}`);

        if (gameState.mode !== "practice") {
            gameState.scoreLabel.text = `স্কোর: ${toBangla(gameState.score)}`;
            console.log(`checkAnswer: Updated scoreLabel to 'স্কোর: ${toBangla(gameState.score)}'`);
        } else {
            console.log("checkAnswer: Updating health bar for practice mode");
            try {
                updateHealthBar(S);
                console.log("checkAnswer: Health bar updated successfully");
            } catch (e) {
                console.error("checkAnswer: Error in updateHealthBar:", e);
                feedback.text = "ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।";
                console.log("checkAnswer: Set feedback text to error message due to health bar failure");
            }
        }

   

        console.log("checkAnswer: Updating stats label");
        updateStatsLabel(S);
        console.log("checkAnswer: Stats label updated");

        console.log("checkAnswer: Animating feedback label");
        feedback.animate({
            props: { alpha: 0 },
            time: 1, // Display for 1 second
            call: () => {
                console.log("checkAnswer: Feedback animation completed, removing feedback");
                feedback.removeFrom();
                console.log("checkAnswer: Checking practice mode completion");
                if (gameState.mode === "practice" && correct && gameState.streak >= 15) {
                    console.log(`checkAnswer: Practice mode complete: streak=${gameState.streak}`);
                    showPracticeCompletePane(S);
                } else {
                    console.log("checkAnswer: Transitioning to next question");
                    transitionToNextQuestion();
                }
            }
        });
        S.update();
        console.log("checkAnswer: Stage updated after feedback animation started");
    } catch (e) {
        console.error("checkAnswer: Fatal error:", e);
        console.log("checkAnswer: Creating error feedback label");
        const errorFeedback = new zim.Label({
            text: "ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।",
            size: 60,
            color: "red",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15
        }).center(S);
        console.log("checkAnswer: Error feedback label created and centered");
        errorFeedback.animate({
            props: { alpha: 0 },
            time: 1000,
            call: () => {
                console.log("checkAnswer: Removing error feedback and generating new question");
                errorFeedback.removeFrom();
                gameState.gameActive = true;
                generateQuestion();
                S.update();
                console.log("checkAnswer: Stage updated after error recovery");
            }
        });
    }
}

// Updates the health bar in practice mode
function updateHealthBar(S) {
    if (!gameState.healthBar) {
        console.error("HealthBar not initialized");
        return;
    }
    console.log("updateHealthBar: streak =", gameState.streak);
    gameState.healthBar.update(gameState.streak, S);
}
// Transitions to the next question
// Transitions to the next question
export function transitionToNextQuestion() {
    const S = gameState.gameContainer.stage;
    console.log(`transitionToNextQuestion: Starting with gameActive=${gameState.gameActive}, mode=${gameState.mode}, questionCount=${gameState.questionCount}, bonusRemaining=${gameState.bonusRemaining}, isBonus=${gameState.isBonus}`);
    try {
        console.log("transitionToNextQuestion: Setting feedbackLabel and typedLabel");
        gameState.feedbackLabel.text = "সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন";
        gameState.typedLabel.text = "";
        gameState.gameActive = true;
        console.log(`transitionToNextQuestion: Updated gameActive=${gameState.gameActive}, feedbackLabel.text='${gameState.feedbackLabel.text}', typedLabel.text='${gameState.typedLabel.text}'`);

        if (gameState.mode === "practice") {
            console.log("transitionToNextQuestion: In practice mode, calling generateQuestion");
            generateQuestion();
        } else {
            if (gameState.isBonus) {
                gameState.bonusRemaining--;
                console.log(`transitionToNextQuestion: Bonus mode, decremented bonusRemaining=${gameState.bonusRemaining}`);
            } else {
                gameState.questionCount++;
                console.log(`transitionToNextQuestion: Incremented questionCount=${gameState.questionCount}`);
            }
            if (gameState.questionCount < gameState.controller.questionsPerSession) {
                console.log(`transitionToNextQuestion: questionCount=${gameState.questionCount} < questionsPerSession=${gameState.controller.questionsPerSession}, calling generateQuestion`);
                generateQuestion();
            } else if (!gameState.isBonus && gameState.bonusRemaining === 0) {
                const percent = (gameState.correctCount / gameState.controller.questionsPerSession) * 100;
                const success = percent >= gameState.controller.requiredCorrectPercent;
                console.log(`transitionToNextQuestion: Calculated percent=${percent.toFixed(2)}%, success=${success}, requiredCorrectPercent=${gameState.controller.requiredCorrectPercent}`);
                if (success && gameState.savedTime > 0) {
                    gameState.bonusRemaining = Math.floor(gameState.savedTime / gameState.timeLimit);
                    gameState.isBonus = true;
                    console.log(`transitionToNextQuestion: Success with savedTime=${gameState.savedTime}, timeLimit=${gameState.timeLimit}, set bonusRemaining=${gameState.bonusRemaining}, isBonus=${gameState.isBonus}, calling generateQuestion`);
                    generateQuestion();
                } else {
                    console.log(`transitionToNextQuestion: Ending stage with success=${success}`);
                    endStage(success);
                }
            } else if (gameState.bonusRemaining > 0) {
                console.log(`transitionToNextQuestion: bonusRemaining=${gameState.bonusRemaining} > 0, calling generateQuestion`);
                generateQuestion();
            } else {
                console.log("transitionToNextQuestion: Ending stage with success=true");
                endStage(true);
            }
        }
        console.log("transitionToNextQuestion: Updating stats label");
        updateStatsLabel(S);
        console.log("transitionToNextQuestion: Updating stage");
        S.update();
    } catch (e) {
        console.error("transitionToNextQuestion: Fatal error:", e);
        console.log("transitionToNextQuestion: Setting feedbackLabel to error message");
        gameState.feedbackLabel.text = "প্রশ্ন লোড করতে ত্রুটি। খেলা শেষ হচ্ছে।";
        S.update();
        console.log("transitionToNextQuestion: Stage updated with error message");
        setTimeout(() => {
            console.log("transitionToNextQuestion: Calling endGame");
            endGame();
        }, 2000);
    }
}
// Updates the stats labels (question, correct, incorrect, bonus)
export function updateStatsLabel(S) {
    console.log("updateStatsLabel called");
    try {
        if (!gameState.statsLabels) {
            console.error("Stats labels not initialized");
            return;
        }
        const incorrect = gameState.mainAnswered - gameState.correctCount;
        gameState.statsLabels.question.text = `প্রশ্ন: ${toBangla(gameState.mainAnswered)}`;
        gameState.statsLabels.correct.text = `সঠিক: ${toBangla(gameState.correctCount)}`;
        gameState.statsLabels.incorrect.text = `ভুল: ${toBangla(incorrect)}`;
        if (gameState.mode !== "practice" && gameState.statsLabels.bonus) {
            gameState.statsLabels.bonus.text = `বোনাস: ${toBangla(gameState.bonusRemaining)}`;
        }
        S.update();
    } catch (e) {
        console.error("updateStatsLabel failed:", e);
    }
}

// Displays a pane when practice mode is completed
export function showPracticeCompletePane(S) {
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
            countdownAnimation(startStage);
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

// Returns to the level selection screen
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

// Ends the current stage and handles progression
export function endStage(success) {
    const S = gameState.gameContainer.stage;
    console.log("endStage called: success =", success);
    try {
        gameState.gameActive = false;
        gameState.stopwatch.stop();
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
                        startStage();
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
                            startStage();
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
        }
        endGame();
    } catch (e) {
        console.error("endStage failed:", e);
        endGame();
    }
}

// Ends the game and returns to the start screen
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
