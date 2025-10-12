import { Question } from "./questionBase.js";
import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla, shuffle, rand } from "./utils.js";
import { createStopwatch } from "./stopwatch.js";

export class FactorPairsQuestion extends Question {
    constructor(...args) {
        super(...args);
        this.numQuestions = gameState.controller.numQuestions || 20;
        this.totalTimeLimit = this.timeLimit * this.numQuestions;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedCard = null;
        this.board = null;
        this.cards = [];
        this.labels = [];
        this.bonusTiles = [];
        this.questionBonusTiles = new Map();
        this.activeTileCount = 0;
        this.isProcessingCorrectAnswer = false;
        this.nextQuestionTimeout = null;
        this.requiredFactors = new Set(); // Track all required factors
    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
        this.gameState.bonusRemaining = 60;
        this.gameState.maxNumber=arrayMinMax(this.allowedTables).max*10;
        console.log(this.allowedTables);
        // Generate batch of 50 questions
        this.questionGenerator.setAllowedTables(this.allowedTables);
        const batch = [];
       // Iterate through each number in your allowed tables (e.g., 3, 4, 5)
this.allowedTables.forEach(tableNumber => {
    // For each table, create the multiplication questions from 1 to 10
    for (let multiplier = 1; multiplier <= 10; multiplier++) {
        
        // Use the new, direct method to generate the question
        const q = this.questionGenerator.generateSpecificQuestion(multiplier, tableNumber);

        // You can still add a check if needed, although it's less likely to fail here
        if (q.target <= 50 && q.a <= 10 && q.b <= 10) {
            batch.push(q);
        }
    }
});
    let shuffledBatch = shuffle(batch);
        this.questions = shuffledBatch.slice(0, this.numQuestions);
        console.log(`Selected ${this.questions.length} questions for the round.`, this.questions);

   // --- NEW: Simplified "Best Effort" Grid Generation ---
        const gridTargetSize = 60;
        const maxFactor=  arrayMinMax([10, arrayMinMax(this.allowedTables).max]).max;
        // 1. Get a flat list of all factors needed for all questions.
        let allRequiredFactors = [];
        this.questions.forEach(q => {
            q.factors.forEach(f => {
                if (f <= maxFactor) {
                    allRequiredFactors.push(f);
                }
            });
        });

        // 2. Start building the grid with the most essential numbers.
        let gridNumbers = [];
        
        // Add unique required factors first to ensure variety.
        const uniqueFactors = [...new Set(allRequiredFactors)];
        gridNumbers.push(...uniqueFactors);
         this.requiredFactors=uniqueFactors;
        // 3. Fill up to 50 slots with remaining required factors to prioritize frequency.
        let requiredIndex = 0;
        while (gridNumbers.length < 50 && requiredIndex < allRequiredFactors.length) {
            gridNumbers.push(allRequiredFactors[requiredIndex]);
            requiredIndex++;
        }
        
        // 4. Fill the rest of the grid with random numbers.
        while (gridNumbers.length < gridTargetSize) {
            gridNumbers.push(rand(1, maxFactor));
        }

        gridNumbers = shuffle(gridNumbers).slice(0, gridTargetSize);
        this.activeTileCount = gridNumbers.length;
        console.log(`Initial grid created with ${gridNumbers.length} tiles.`);

        // Assign bonus tiles to top 10%, next 10%, third 10% questions
        // const sortedQuestions = [...this.questions].map((q, i) => ({ index: i, target: q.target }))
        //     .sort((a, b) => b.target - a.target);
        // const mostHardIndex = sortedQuestions[0].index;
        // const secondHardIndex = sortedQuestions[1].index;
        // const thirdHardIndex = sortedQuestions[2].index;
        // this.questionBonusTiles.set(mostHardIndex, 30);
        // this.questionBonusTiles.set(secondHardIndex, 18);
        // this.questionBonusTiles.set(thirdHardIndex, 12);

        // Setup total stopwatch
        try {
            this.setupStopwatch();
        } catch (e) {
            console.error("Failed to setup stopwatch:", e);
            this.gameState.feedbackLabel.text = "টাইমার তৈরিতে ত্রুটি। গেম চলবে।";
            this.S.update();
        }
        // Create grid
        this.createGrid(gridNumbers);
        // Start first question
        this.nextQuestion();
    }

    setupStopwatch() {
        if (typeof createStopwatch !== "function") {
            throw new ReferenceError("createStopwatch is not defined");
        }
        if (this.stopwatch) {
            this.stopwatch.stop();
            this.stopwatch.removeFrom();
        }
        this.stopwatch = createStopwatch(
            this.totalTimeLimit,
            30,
            200,
            this.gameState.layoutManager,
            this.S
        );
        this.stopwatch.center(this.gameState.timerContainer);
        this.stopwatch.on("done", () => this.handleTimeUp());
        this.stopwatch.start();
    }

    nextQuestion() {
        if (this.isProcessingCorrectAnswer) return;
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.completeSet();
            return;
        }
        this.gameState.currentTarget = this.questions[this.currentQuestionIndex].target;
        // Check if factors exist for the current target
        // const targetFactors = this.questions[this.currentQuestionIndex].factors.filter(f => f <= this.gameState.maxNumber);
        // const availableFactors = new Set(this.cards.filter(c => c && c.active && c.num).map(c => c.num));
        // const hasFactors = targetFactors.some(f => availableFactors.has(f) && availableFactors.has(this.gameState.currentTarget / f));
        // if (!hasFactors) {
        //     console.warn(`No valid factor pair for target ${this.gameState.currentTarget}. Adding factor.`);
        //     // Find a factor pair (e.g., 4 and 10 for 40)
        //     const factor = targetFactors.find(f => f <= 10) || targetFactors[0];
        //     const otherFactor = this.gameState.currentTarget / factor;
        //     const inactiveIndex = this.cards.findIndex(c => !c || !c.active);
        //     if (inactiveIndex !== -1) {
        //         // Replace an inactive tile
        //         this.cards[inactiveIndex].num = factor;
        //         this.cards[inactiveIndex].active = true;
        //         this.cards[inactiveIndex].color = config.colors.option1;
        //         this.cards[inactiveIndex].alpha = 1;
        //         this.cards[inactiveIndex].rotation = 0;
        //         this.cards[inactiveIndex].mouseEnabled = true;
        //         this.labels[inactiveIndex].text = toBangla(factor);
        //         this.activeTileCount++;
        //         console.log(`Added factor ${factor} at index ${inactiveIndex}`);
        //     }
        // }
        this.questionTitle.text = `দুটি সংখ্যা খুঁজুন যা গুণ করে ${toBangla(this.gameState.currentTarget)} হয়!`;
        this.S.update();
        this.currentQuestionIndex++;
        console.log(`Advancing to question ${this.currentQuestionIndex}`);
    }

    createGrid(gridNumbers) {
        this.vizContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.9);
        this.questionContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.1);
        this.cards = [];
        this.labels = [];
        this.bonusTiles = [];

        this.gameState.qaRegion.removeAllChildren();
        this.vizContainer.addTo(this.gameState.qaRegion);
        this.questionContainer.addTo(this.gameState.qaRegion);

        this.qaLayout = new zim.Layout({
            holder: this.gameState.qaRegion,
            regions: [
                { object: this.vizContainer, maxHeight: 90, align: "center", valign: "top" },
                { object: this.questionContainer, maxHeight: 10, align: "center", valign: "bottom" }
            ],
            showRegions: false,
            vertical: true
        });
        this.gameState.layoutManager.add(this.qaLayout);

        this.questionTitle = new zim.Label({ 
            text: "", 
            size: 30, 
            color: config.colors.text, 
            align: "center", 
            bold: true,
            lineWidth: this.questionContainer.width - 40
        }).center(this.questionContainer);

        const panelPadding = config.panelPadding || 10;
        const panelMargin = 2;
        const panelW = this.vizContainer.width - 2 * (panelMargin + panelPadding);
        const panelH = this.vizContainer.height - 2 * (panelMargin + panelPadding);
        const panelBorderWidth = 10;

        const panel = new zim.Rectangle({
            width: panelW,
            height: panelH,
            color: clear,
            borderColor: config.colors.panelBorder,
            borderWidth: panelBorderWidth,
            corner: 30
        }).centerReg(this.vizContainer);

        const contentW = panelW - panelBorderWidth * 2;
        const contentH = panelH - panelBorderWidth * 2;
        const puzzlePic = new zim.Pic("puzzel1.jpg")
            .centerReg(panel)
            .siz(contentW, null);

        const mask = new zim.Rectangle({
            width: contentW,
            height: contentH,
            color: clear
        }).centerReg(panel);
        puzzlePic.setMask(mask);

        puzzlePic.on("complete", () => {
            console.debug(`Puzzle image loaded: width=${puzzlePic.width}, height=${puzzlePic.height}, mask: width=${contentW}, height=${contentH}`);

            const cols = 10;
            const rows = 6;
            const spacing = 0;
            const tileW = contentW / cols;
            const tileH = contentH / rows;

            this.board = new zim.Tile(new zim.Rectangle({
                width: tileW,
                height: tileH,
                color: config.colors.option1,
                borderColor: config.colors.panelBorder,
                borderWidth: 1,
                corner: 0
            }), cols, rows, spacing, spacing)
                .center(this.vizContainer)
                .cur()
                .top();

            const noise = new zim.Noise();

            this.board.loop((tile, i) => {
                tile.num = gridNumbers[i];
                tile.selected = false;
                tile.active = true;
                tile.index = i;

                const tileX = (i % cols) * tileW;
                const tileY = Math.floor(i / cols) * tileH;
                const tileBitmap = new zim.Bitmap(puzzlePic, tileW, tileH, tileX, tileY)
                    .addBitmapData()
                    .effect(new zim.ColorEffect({ saturation: -100 }))
                    .ble("screen")
                    .center(tile);
                tileBitmap.hue = 0;

                for (let y = 0; y < tileH; y++) {
                    for (let x = 0; x < tileW; x++) {
                        let value = (noise.simplex2D(x / 50, y / 50) + 1) / 2 * 255;
                        let idx = (x + y * tileW) * 4;
                        tileBitmap.imageData.data[idx] = value;
                        tileBitmap.imageData.data[idx + 1] = value;
                        tileBitmap.imageData.data[idx + 2] = value;
                        tileBitmap.imageData.data[idx + 3] = 255;
                    }
                }
                tileBitmap.drawImageData();

                this.cards.push(tile);
                const label = new zim.Label({
                    text: toBangla(gridNumbers[i]),
                    size: Math.min(40, tileW * 0.5),
                    color: config.colors.text,
                    align: "center",
                    valign: "center",
                    bold: true,
                    labelWidth: tileW * 0.5,
                    labelHeight: tileH * 0.5
                }).center(tile);
                this.labels.push(label);
            });

            // Assign bonus tiles to specific questions
            // const activeTiles = shuffle([...this.cards]);
            // let tileIndex = 0;
            // for (const [questionIndex, tileCount] of this.questionBonusTiles) {
            //     const tiles = activeTiles.slice(tileIndex, tileIndex + tileCount);
            //     this.questionBonusTiles.set(questionIndex, tiles);
            //     this.bonusTiles.push(...tiles);
            //     tileIndex += tileCount;
            //     console.log(`Assigned ${tileCount} bonus tiles to question ${questionIndex}`);
            // }

            const boardPos = this.board.localToGlobal(0, 0);
            console.debug(`Tile board placed: global x=${boardPos.x}, y=${boardPos.y}, width=${contentW}, height=${contentH}`);

            this.S.on("stagemousemove", () => {
                const index = this.board.hitTestGrid(contentW, contentH, cols, rows, this.S.mouseX, this.S.mouseY, 0, 0, spacing, spacing);
                if (index >= 0 && index < this.cards.length) {
                    const tile = this.cards[index];
                    if (tile && tile.active && !tile.selected && tile.color !== clear) {
                        tile.color = "blue";
                        this.S.update();
                    }
                }
                this.cards.forEach(tile => {
                    if (tile && tile.active && !tile.selected && tile.color !== config.colors.option1 && tile.color !== clear) {
                        tile.color = config.colors.option1;
                    }
                });
                this.S.update();
            });

            this.board.on("click", (e) => {
                if (!gameState.gameActive || this.isProcessingCorrectAnswer) return;
                const index = this.board.hitTestGrid(contentW, contentH, cols, rows, e.stageX, e.stageY, 0, 0, spacing, spacing);
                if (index < 0 || index >= this.cards.length) return;
                const card = this.cards[index];
                if (!card || !card.active || !card.num) return;

                console.log(`Tile clicked: index=${index}, num=${card.num}`);

                if (card.selected) {
                    card.selected = false;
                    card.sha(null);
                    this.selectedCard = null;
                    this.S.update();
                    return;
                }

                if (this.selectedCard) {
                    const product = this.selectedCard.num * card.num;
                    if (product === this.gameState.currentTarget) {
                        this.isProcessingCorrectAnswer = true;
                        const points = config.points.correct + this.gameState.streak * config.points.streakBonus;
                        this.handleCorrect(points, "সঠিক মিল!");
                        this.gameState.questionCount++;
                        this.gameState.correctCount++;
                        this.gameState.score += points;
                        this.callbacks.onScoreChange(this.gameState.score);

                        // Create emitter for glitter effects
                        let emitter;
                        try {
                            emitter = new zim.Emitter({
                                obj: new zim.Circle(5, "yellow"),
                                num: 10,
                                interval: 0.05,
                                life: 1,
                                sink: true,
                                gravity: 10,
                                force: { min: 5, max: 10 },
                                angle: { min: 0, max: 360 },
                                scale: { min: 0.5, max: 1.5 },
                                rotation: { min: -180, max: 180 },
                                startPaused: true
                            }).addTo(this.S);
                        } catch (e) {
                            console.error("Failed to create emitter:", e);
                            emitter = null;
                        }

                        // Start all animations in parallel (fire-and-forget)
                        const selectedPos = this.selectedCard.localToGlobal(this.selectedCard.width / 2, this.selectedCard.height / 2);
                        const cardPos = card.localToGlobal(card.width / 2, card.height / 2);
                        if (emitter && typeof emitter.spurt === "function") {
                            try {
                                emitter.loc(selectedPos.x, selectedPos.y).spurt(10);
                                emitter.loc(cardPos.x, cardPos.y).spurt(10);
                            } catch (e) {
                                console.error("Failed to emit particles for solution tiles:", e);
                            }
                        }

                        this.selectedCard.active = false;
                        card.active = false;
                          if (this.selectedCard) this.selectedCard.sha(null);
                        if (card) card.sha(null);
                        const selectedIndex = this.cards.indexOf(this.selectedCard);
                        const cardIndex = this.cards.indexOf(card);
                        this.activeTileCount -= 2;

                        // Animate solution tiles
                        // this.selectedCard.animate({ rotation: 180, alpha: 0 }, 0.3, "backIn", () => {
                        //     if (this.selectedCard) {
                        //         this.selectedCard.color = clear;
                        //         this.selectedCard.removeFrom();
                        //         this.selectedCard.mouseEnabled = false;
                        //         if (selectedIndex !== -1) {
                        //             this.cards[selectedIndex] = null;
                        //         }
                        //         this.selectedCard = null;
                        //     }
                        // });
                        // card.animate({ rotation: 180, alpha: 0 }, 0.3, "backIn", () => {
                        //     if (card) {
                        //         card.color = clear;
                        //         card.removeFrom();
                        //         card.mouseEnabled = false;
                        //         if (cardIndex !== -1) {
                        //             this.cards[cardIndex] = null;
                        //         }
                        //     }
                        // });
                        this.selectedCard.animate({ rotation: 180, alpha: 0 }, 0.3, "backIn", () => {
                             if(this.selectedCard) 
                             {
                                this.selectedCard.mouseEnabled = false;
                                this.selectedCard.vis(false);
                             }
                        });
                        card.animate({ rotation: 180, alpha:0}, 0.3, "backIn", () => {
                             if(card) 
                             {
                                card.mouseEnabled = false;
                                card.vis(false);
                             }
                        });
                        // Animate bonus tiles in parallel
                        // const bonusTiles = this.questionBonusTiles.get(this.currentQuestionIndex - 1) || [];
                        // if (bonusTiles.length > 0) {
                        //     this.gameState.bonusRemaining -= bonusTiles.length;
                        //     this.callbacks.onUpdateStats();
                        //     bonusTiles.forEach(bonusTile => {
                        //         if (bonusTile && bonusTile.active) {
                        //             bonusTile.active = false;
                        //             this.activeTileCount--;
                        //             const bonusPos = bonusTile.localToGlobal(bonusTile.width / 2, bonusTile.height / 2);
                        //             if (emitter && typeof emitter.spurt === "function") {
                        //                 try {
                        //                     emitter.loc(bonusPos.x, bonusPos.y).spurt(10);
                        //                 } catch (e) {
                        //                     console.error("Failed to emit particles for bonus tile:", e);
                        //                 }
                        //             }
                        //             bonusTile.animate({ rotation: 180, alpha: 0 }, 0.3, "backIn", () => {
                        //                 bonusTile.color = clear;
                        //                 bonusTile.removeFrom();
                        //                 const tileIndex = this.cards.indexOf(bonusTile);
                        //                 if (tileIndex !== -1) {
                        //                     this.cards[tileIndex] = null;
                        //                 }
                        //             });
                        //         }
                        //     });
                        //     // Bonus text animation
                        //     const bonusText = new zim.Label({
                        //         text: "বোনাস!",
                        //         size: 60,
                        //         color: "yellow",
                        //         align: "center",
                        //         backgroundColor: "rgba(0,0,0,0.7)",
                        //         padding: 20,
                        //         corner: 15
                        //     }).center(this.S);
                        //     const textPos = bonusText.localToGlobal(bonusText.width / 2, bonusText.height / 2);
                        //     if (emitter && typeof emitter.spurt === "function") {
                        //         try {
                        //             emitter.loc(textPos.x, textPos.y).spurt(10);
                        //         } catch (e) {
                        //             console.error("Failed to emit particles for bonus text:", e);
                        //         }
                        //     }
                        //     bonusText.animate({ y: bonusText.y - 200, alpha: 0 }, 1, "linear", () => {
                        //         bonusText.removeFrom();
                        //     });
                        // } else {
                            // Show correct feedback if no bonus tiles
                            const feedback = new zim.Label({
                                size: 60,
                                color: "green",
                                align: "center",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                padding: 20,
                                corner: 15,
                                text: "সঠিক মিল!"
                            }).center(this.S);
                            feedback.animate({ alpha: 0 }, 1, "linear", () => {
                                feedback.removeFrom();
                            });
                        // }

                         // --- NEW DYNAMIC HEALING LOGIC ---
                     

                        // Fire-and-forget: Schedule nextQuestion and emitter cleanup after 1s
                        if (this.nextQuestionTimeout) {
                            this.nextQuestionTimeout.clear();
                        }
                        this.nextQuestionTimeout = zim.timeout(1, () => {
                            if (emitter) {
                                try {
                                    emitter.pauseEmitter(true);
                                    emitter.dispose();
                                } catch (e) {
                                    console.error("Failed to dispose emitter:", e);
                                }
                            }
                            console.log('hit check and heal');
                              // Check if future questions are still solvable and heal if not.
                            this.checkAndHealFutureQuestions();
                            this.isProcessingCorrectAnswer = false;
                            if (this.currentQuestionIndex < this.numQuestions) {
                                this.nextQuestion();
                            } else {
                                  // If it IS the last question, trigger the board clear.
                                console.log("Last question answered! Clearing the board.");
                                const remainingTiles = this.cards.filter(c => c && c.active);
                                
                                // Animate all remaining active tiles away
                                zim.animate({
                                    target: remainingTiles,
                                    props: { alpha: 0, scale: 0.5, rotation: rand(-90, 90) },
                                    time: 0.5,
                                    sequence: 0.02, // Stagger animation for a cool cascade effect
                                    ease: "backIn",
                                    call: () => {
                                        // After the animation is done, call completeSet.
                                        this.completeSet();
                                    }
                                });
                            }
                        });

                        this.checkIfComplete();
                    } else {
                        this.handleIncorrect(0, "ভুল মিল!");
                        if (this.selectedCard && this.selectedCard.active) {
                            this.selectedCard.sha("red", 5, 5, 5);
                        }
                        if (card && card.active) {
                            card.sha("red", 5, 5, 5);
                        }
                        zim.timeout(0.5, () => {
                            if (this.selectedCard && this.selectedCard.active) {
                                this.selectedCard.sha(null);
                            }
                            if (card && card.active) {
                                card.sha(null);
                            }
                            const feedback = new zim.Label({
                                size: 60,
                                color: "red",
                                align: "center",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                padding: 20,
                                corner: 15,
                                text: "ভুল মিল!"
                            }).center(this.S);
                            feedback.animate({ alpha: 0 }, 1, () => {
                                feedback.removeFrom();
                            });
                        });
                        if (this.gameState.mode === "practice") {
                            this.gameState.healthBar.reduceHealth();
                            if (this.gameState.healthBar.currentHealth <= 0) {
                                this.completeSet();
                                return;
                            }
                        }
                    }
                    if (this.selectedCard && this.selectedCard.active) {
                        this.selectedCard.selected = false;
                        this.selectedCard.sha(null);
                    }
                    this.selectedCard = null;
                } else {
                    this.selectedCard = card;
                    card.selected = true;
                    if (card.active) {
                        card.sha("green", 5, 5, 5);
                    }
                }
                this.S.update();
            });

            zim.animate({
                target: this.cards,
                props: { alpha: 1, scale: 1 },
                from: { alpha: 0, scale: 0 },
                time: 0.5,
                sequence: 0.05,
                ease: "backOut"
            });

            this.S.update();
        });
    }
/**
     * NEW METHOD
     * Checks if a given question is solvable with the currently active tiles.
     */
    isQuestionSolvable(question, availableTiles) {
        // console.log('checking solution: ',question);
        const target = question.target;
        const factors = question.factors;
        const tileCounts = availableTiles.reduce((acc, num) => {
            acc[num] = (acc[num] || 0) + 1;
            return acc;
        }, {});

        for (const factor of factors) {
            if (target % factor === 0) {
                const otherFactor = target / factor;
                if (factor === otherFactor) {
                    // Requires two of the same tile (e.g., 5x5=25)
                    if (tileCounts[factor] && tileCounts[factor] >= 2) {
                        return true;
                    }
                } else {
                    // Requires one of each different tile
                    if (tileCounts[factor] && tileCounts[otherFactor]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * NEW METHOD
     * Finds the next unsolvable question and adds a missing factor to the board.
     */
    checkAndHealFutureQuestions() {
        // console.log(this.currentQuestionIndex,"checkandheal begin");
        const remainingQuestions = this.questions.slice(this.currentQuestionIndex);
        if (remainingQuestions.length === 0) return;
        console.log(remainingQuestions);

        // Get a snapshot of the currently available numbers on the board.
        const availableTiles = this.cards.filter(c => c && c.active).map(c => c.num);
// console.log('available tiles')
        for (const futureQuestion of remainingQuestions) {
            if (!this.isQuestionSolvable(futureQuestion, availableTiles)) {
                console.warn(`Future question (Target: ${futureQuestion.target}) is unsolvable. Healing the board.`);
                
                // --- Healing Logic ---
                let candidates = {
                    perfectPartial: null, // Best: A partial match, adding a non-trivial factor (not 1 or target)
                    goodPartial: null,    // OK: A partial match, but might have to add 1 or target
                    goodNew: null,        // OK: A factor from a completely new pair, non-trivial
                    anyNew: null          // Fallback: The first valid factor we can find
                };

                // Iterate through all possible factor pairs for the unsolvable question.
                // We only need to check up to the square root for efficiency.
                for (const f of futureQuestion.factors) {
                    if (f > Math.sqrt(futureQuestion.target)) continue;

                    const otherFactor = futureQuestion.target / f;
                    
                    // --- Constraint Checks ---
                    // 1. Ensure it's a valid integer pair.
                    if (futureQuestion.target % f !== 0) continue;
                    // 2. Both factors of a pair must be part of the game's original design.
                    if (!this.requiredFactors.includes(f) || !this.requiredFactors.includes(otherFactor)) continue;

                    const fExists = availableTiles.includes(f);
                    const otherExists = availableTiles.includes(otherFactor);

                    // --- Candidate Selection ---
                    if (fExists && !otherExists) { // Case 1: Partial match. We need to add `otherFactor`.
                        if (otherFactor !== 1 && otherFactor !== futureQuestion.target) {
                            if (candidates.perfectPartial === null) candidates.perfectPartial = otherFactor; // Found the best type of candidate
                        } else {
                            if (candidates.goodPartial === null) candidates.goodPartial = otherFactor;
                        }
                    } else if (!fExists && otherExists) { // Case 2: Partial match. We need to add `f`.
                         if (f !== 1 && f !== futureQuestion.target) {
                            if (candidates.perfectPartial === null) candidates.perfectPartial = f; // Found the best type of candidate
                        } else {
                            if (candidates.goodPartial === null) candidates.goodPartial = f;
                        }
                    } else if (!fExists && !otherExists) { // Case 3: No factors exist. We need to add one.
                        // We prefer to add the smaller factor (`f`) from a non-trivial pair.
                        if (f !== 1 && f !== futureQuestion.target) {
                             if (candidates.goodNew === null) candidates.goodNew = f;
                        } else { // This pair includes 1 and the target itself
                             if (candidates.anyNew === null) candidates.anyNew = f; // Usually `f` will be 1 here
                        }
                    }
                }

                // --- Final Decision ---
                // Choose the best candidate we found, in order of priority.
               // --- FIX IS HERE: Use 'let' instead of 'const' ---
                let factorToAdd = candidates.perfectPartial || candidates.goodPartial || candidates.goodNew || candidates.anyNew;

                // **REFINED FALLBACK LOGIC:**
                // This is a cleaner way to handle the fallback. If after all that searching,
                // factorToAdd is STILL null, only then do we assign the first possible factor.
                if (factorToAdd === null && futureQuestion.factors.length > 0) {
                     // Ensure the fallback factor is at least from the original set
                    factorToAdd = futureQuestion.factors.find(f => this.requiredFactors.includes(f)) || null;
                }


                // 2. Find an inactive tile slot to revive.
                if (factorToAdd !== null) {
                    // const inactiveTileIndex = this.cards.findIndex(c => c && !c.active);
                    // 1. Find ALL inactive tile indices.
                    const inactiveIndices = [];
                    this.cards.forEach((card, index) => {
                        if (card && !card.active) {
                            inactiveIndices.push(index);
                        }
                    });

                    if (inactiveIndices.length > 0) {
                        const randomInactiveIndex = inactiveIndices[rand(0, inactiveIndices.length - 1)];
                        
                        const tileToRevive = this.cards[randomInactiveIndex];
                        const labelToRevive = this.labels[randomInactiveIndex];
                        
                        console.log(`Adding missing factor ${factorToAdd} to RANDOMLY chosen tile at index ${randomInactiveIndex}.`);


                        
                        // console.log(`Adding missing factor ${factorToAdd} to tile at index ${inactiveTileIndex}.`);

                        // 3. Update the tile's properties and animate it back.
                        tileToRevive.num = factorToAdd;
                        tileToRevive.active = true;
                        tileToRevive.mouseEnabled = true;
                        tileToRevive.vis(true);
                        labelToRevive.text = toBangla(factorToAdd);

                        tileToRevive.animate({ alpha: 1, rotation: 0 }, 0.5, "backOut");
                        
                        // We only heal one question at a time. Return after the first heal.
                        return; 
                    } else {
                         console.error("Board Healing Failed: No inactive tiles available to revive.");
                    }
                }
            }
        }
    }
    checkIfComplete() {
        if (this.isProcessingCorrectAnswer) return;
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.completeSet();
        }
    }

    completeSet() {
        if (this.stopwatch) {
            this.stopwatch.stop();
        }
        if (this.nextQuestionTimeout) {
            this.nextQuestionTimeout.clear();
        }
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.cards.forEach((card, i) => {
                if (card && card.active) {
                    card.active = false;
                    card.animate({ alpha: 0 }, 0.3, "backIn", () => {
                        card.color = clear;
                        card.removeFrom();
                        this.cards[i] = null;
                    });
                    this.activeTileCount--;
                }
            });
        }
        this.cleanup();
        const success = this.currentQuestionIndex >= this.numQuestions;
        const feedbackText = success ? "স্টেজ সম্পূর্ণ!" : "সময় শেষ! আবার চেষ্টা করুন।";
        const feedback = new zim.Label({
            size: 60,
            color: success ? "green" : "red",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15,
            text: feedbackText
        }).center(this.S);
        this.callbacks.onCompleteSet(feedback, success);
    }

    handleTimeUp() {
        this.completeSet();
    }

    handleIncorrect(points, feedbackText) {
        console.log(`Incorrect: ${feedbackText}`);
        this.gameState.streak = 0;
        this.callbacks.onUpdateStats();
    }

    cleanup() {
        if (this.nextQuestionTimeout) {
            this.nextQuestionTimeout.clear();
        }
        if (this.vizContainer) {
            this.vizContainer.removeAllChildren();
            if (this.vizContainer.hasEventListener("click")) {
                this.vizContainer.off("click");
            }
        }
        if (this.questionContainer) {
            this.questionContainer.removeAllChildren();
        }
        if (this.gameState.qaRegion) {
            this.gameState.qaRegion.removeAllChildren();
        }
        if (this.qaLayout) {
            this.gameState.layoutManager.remove(this.qaLayout);
        }
        if (this.cards) {
            this.cards.forEach(card => {
                if (card && card.hasEventListener("click")) {
                    card.off("click");
                }
            });
        }
        if (this.board && this.board.hasEventListener("click")) {
            this.board.off("click");
        }
        if (this.S && this.S.hasEventListener("stagemousemove")) {
            this.S.off("stagemousemove");
        }
        this.board = null;
        this.cards = [];
        this.labels = [];
        this.bonusTiles = [];
        this.questionBonusTiles.clear();
        this.requiredFactors.clear();
        this.selectedCard = null;
        this.questions = [];
        this.isProcessingCorrectAnswer = false;
        this.nextQuestionTimeout = null;

        super.cleanup();
        this.S.update();
    }
}