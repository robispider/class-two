
import { Question } from "./questionBase.js";
import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla, shuffle } from "./utils.js";
import { createStopwatch } from "./stopwatch.js";

export class PuzzleQuestion extends Question {
    constructor(...args) {
        super(...args);
        this.puzzleCols = 4; // Columns for sprite and answer grid (from logs)
        this.puzzleRows = 3; // Rows for sprite and answer grid (from logs)
        this.numQuestions = this.puzzleCols * this.puzzleRows; // Dynamic question count (12)
        this.totalTimeLimit = this.timeLimit * this.numQuestions; // Total time
        this.questions = []; // Store batch of questions
        this.answerBlockQuestions=[];
        this.currentQuestionIndex = 0;
        this.leftContainer = null;
        this.rightContainer = null;
        this.sprite = null;
        this.emptyBlocks = [];
        this.answerBlocks = [];
        this.questionRows = [];
        this.rowLayouts = []; // Store per-row layouts
        this.vizContainer = null;
        this.questionContainer = null;
        this.qaLayout = null;
        this.panelLayout = null;
        this.stopwatch = null;
    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
        // Set allowedTables on questionGenerator
        const numUniqueQuestionsRequired = this.numQuestions; // e.g., 12
        const maxAttempts = 200; // Safety limit for tries
        let uniqueQuestions = [];
        const usedAnswers = new Set();

        this.questionGenerator.setAllowedTables(this.allowedTables);
        const fixedB = this.gameState.mode === "practice" ? this.allowedTables[0] : null;

        for (let i = 0; i < maxAttempts && uniqueQuestions.length < numUniqueQuestionsRequired; i++) {
            const candidateQuestion = this.questionGenerator.generateAdaptiveQuestion(
                fixedB,
                this.gameState.currentStage
            );
            if (!usedAnswers.has(candidateQuestion.target)) {
                usedAnswers.add(candidateQuestion.target);
                uniqueQuestions.push(candidateQuestion);
            }
        }
         uniqueQuestions=  shuffle(uniqueQuestions);//.slice(numUniqueQuestionsRequired);
        if (uniqueQuestions.length < numUniqueQuestionsRequired) {
            console.warn(
                `Could only generate ${uniqueQuestions.length} / ${numUniqueQuestionsRequired} unique questions ` +
                `after ${maxAttempts} attempts. The question pool may be too small.`
            );
        }
                // Create sub-containers for question text and empty block


         // 2. Create a shuffled version for the question list on the LEFT.
        this.questions = shuffle(uniqueQuestions.slice());

        // 3. Create a SEPARATE, independently shuffled version for the answer grid on the RIGHT.
        this.answerBlockQuestions = shuffle(uniqueQuestions.slice());
        
        console.log("Shuffled questions for left panel:", this.questions.map(q => q.target));
        console.log("Shuffled answers for right panel:", this.answerBlockQuestions.map(q => q.target));

        // Setup total stopwatch
        try {
            this.setupStopwatch();
        } catch (e) {
            console.error("Failed to setup stopwatch:", e);
            this.gameState.feedbackLabel.text = "টাইমার তৈরিতে ত্রুটি। গেম চলবে।";
            this.S.update();
        }
        // Create puzzle layout
        this.createPuzzleLayout();
        // Start first question
        this.nextQuestion();
    }

    setupStopwatch() {
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

    createPuzzleLayout() {
        // Clear qaRegion
        this.gameState.qaRegion.removeAllChildren();

        // Create sub-containers
        this.vizContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.9);
        this.questionContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.1);
        this.vizContainer.addTo(this.gameState.qaRegion);
        this.questionContainer.addTo(this.gameState.qaRegion);

        // Set up vertical layout for qaRegion
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

        // Question title
        new zim.Label({ 
            text: "প্রশ্নের উত্তর মিলিয়ে ছবি সম্পূর্ণ করুন!", 
            size: 30, 
            color: config.colors.text, 
            align: "center", 
            bold: true,
            lineWidth: this.questionContainer.width - 40
        }).center(this.questionContainer);

        // Create panel
        const panelPadding = config.panelPadding || 10;
        const panelMargin = 2;
        const panelW = this.vizContainer.width - 2 * (panelMargin + panelPadding);
        const panelH = this.vizContainer.height - 2 * (panelMargin + panelPadding);
        const panelBorderWidth = 10;

        const panel = new zim.Rectangle({
            width: panelW,
            height: panelH,
            color: "transparent",
            borderColor: config.colors.panelBorder,
            borderWidth: panelBorderWidth,
            corner: 30
        }).centerReg(this.vizContainer);

        // Horizontal layout for left and right containers
        const contentW = panelW - panelBorderWidth * 2;
        const contentH = panelH - panelBorderWidth * 2;
        this.leftContainer = new zim.Container(contentW / 2, contentH);
        this.rightContainer = new zim.Container(contentW / 2, contentH);
        
        this.rightContainer.addTo(this.vizContainer);
this.leftContainer.addTo(this.vizContainer).top();
        this.panelLayout = new zim.Layout({
            holder: panel,
            regions: [
                { object: this.leftContainer, maxWidth: 50, align: "left", valign: "center" },
                { object: this.rightContainer, maxWidth: 50, align: "right", valign: "center" }
            ],
            showRegions: false,
            vertical: false
        });
        this.gameState.layoutManager.add(this.panelLayout);

        // Load puzzle image
        const puzzlePic = new zim.Pic("puzzel1.jpg");
        puzzlePic.on("complete", () => {
            console.debug(`Puzzle image loaded: width=${puzzlePic.width}, height=${puzzlePic.height}`);
            if (puzzlePic.width <= 0 || puzzlePic.height <= 0) {
                console.error("Invalid image dimensions");
                this.gameState.feedbackLabel.text = "ছবি লোডে ত্রুটি। গেম চলবে।";
                this.S.update();
                return;
            }

            // Create sprite with identical rows and cols as answer grid
            this.sprite = new zim.Sprite({
                image: puzzlePic,
                cols: this.puzzleCols,
                rows: this.puzzleRows,
                width: contentW / 2,
                height: contentH
            });
            const numbers = this.questions.map(q => q.target);
            // Create right answer grid (rows x cols)
            const blockW = (contentW / 2) / this.puzzleCols;
            const blockH = contentH / this.puzzleRows;
            let objs=[];
              for (let i = 0; i < (this.puzzleCols * this.puzzleRows); i++) {
                const questionForBlock = this.answerBlockQuestions[i];
               // console.log( this.answerBlockQuestions,questionForBlock);

                        const obj=new Container();
                         obj.num = questionForBlock.target; // The correct answer value
                obj.q = questionForBlock;   
                obj.isCorrect = false;
                obj.active = true;
                obj.mouseEnabled=true;


                        const rect=new zim.Rectangle({
                            width: blockW,
                            height: blockH,
                            color: config.colors.option1,
                            borderColor: 1,
                            borderWidth: 0,
                            corner:0
                        }).center(obj);
                        obj.rect=rect;
                         const label = new zim.Label({
                    text: toBangla(questionForBlock.target), // Display the answer
                    size: Math.min(40, blockW * 0.5),
                    color: config.colors.text,
                    align: "center",
                    valign: "center",
                    bold: true,
                    labelWidth: blockW * 0.5,
                    labelHeight: blockH * 0.5,
                    mouseEnabled:false,
                    active:false,
                }).center(obj);
                obj.label = label; // Store reference for swapping

            objs.push(obj);
                    }
  this.answerBlocks = objs;

                const answerGrid = new zim.Tile({obj:zim.series( objs), cols:this.puzzleCols, rows:this.puzzleRows,spacingH: 0,spacingV: 0, clone:false})
                .center(this.rightContainer)
                .cur();
            // Assign target numbers to answer blocks
            // const numbers = shuffle(this.questions.map(q => q.target));
         
            // answerGrid.loop((block, i) => {
              
                
                
            //     // this.answerBlocks.push(block);

               
            // });

            // Create left question list (1 x numQuestions) with nested horizontal layouts
            const leftCols = 1;
            const leftRows = this.numQuestions;
            const leftTileW = contentW / 2;
            const leftTileH = contentH / leftRows;
            const leftTile = new zim.Tile(new zim.Container(leftTileW, leftTileH), leftCols, leftRows, 0, 5)
                .center(this.leftContainer);

            this.questionRows = [];
            this.emptyBlocks = [];
            this.rowLayouts = [];
            
            this.questions.forEach((q, i) => {
                const row = leftTile.getChildAt(i);
                this.questionRows.push(row);


                // Create sub-containers for question text and empty block
                const questionTextContainer = new zim.Container(leftTileW / 2, leftTileH);
                const emptyBlockContainer = new zim.Container(leftTileW / 2, leftTileH);
                questionTextContainer.addTo(row);
                emptyBlockContainer.addTo(row);

                // Horizontal layout for each row
                const rowLayout = new zim.Layout({
                    holder: row,
                    regions: [
                        { object: questionTextContainer, maxWidth: 50, align: "left", valign: "center" },
                        { object: emptyBlockContainer, maxWidth: 50, align: "right", valign: "center" }
                    ],
                    showRegions: false,
                    vertical: false
                });
                this.gameState.layoutManager.add(rowLayout);
                this.rowLayouts.push(rowLayout);

                // Add question text
                new zim.Label({
                    text: `${toBangla(q.a)} × ${toBangla(q.b)} = `,
                    size: 30,
                    color: config.colors.text,
                    bold: true,
                    align: "left",
                    valign: "center"
                }).center(questionTextContainer);

                // Add empty block with sprite piece
                const empty = new zim.Container(leftTileW / 2 - 10, leftTileH - 10)
                    .center(emptyBlockContainer);
              
                empty.q = q;
                empty.index = i;
                empty.homeX = empty.x; // Store home position
                empty.homeY = empty.y;
                this.emptyBlocks.push(empty);
                empty.originalParent =emptyBlockContainer;

                // Add drag with drop targets
                empty.drag({
                     dropTargets: this.answerBlocks,
                    dropBack: false, // Return to home if not dropped on valid target
                    dropEnd: false, // Allow dragging after dropping
                    dropFull: false, // Prevent dropping on filled targets
                    dropSnap :false,
                    all:true,
                    
                });
            });
            //connect the sprite here
            for (let i=0;i<this.answerBlockQuestions.length;i++)
            {
                  const questionForBlock = this.answerBlockQuestions[i];
                  //select empty
                   const empty = this.emptyBlocks.find(e => e.q.target === questionForBlock.target);

                // console.log("Shuffled questions for left panel:", this.questions.map(q => q.target));
                  const piece = this.sprite.clone();
                // piece.frame = i; // Set to specific frame
                piece.frame = i; 

                piece.scaleTo(empty, 100, 100, "fit").center(empty).top();
                // piece.siz( piece.width , empty.height, true).center(empty); // Maintain aspect ratio
                empty.sprite=piece;
            }
                this.emptyBlocks.forEach(empty => {

                empty.on("mousedown", () => {
                        console.log(empty);
                    
                        // empty.top(); 
                    empty.originalX =  empty.x;
                    empty.originalY = empty.y;
                    // empty.originalParent = empty.parent;
                    console.log(empty.originalParent,empty.parent, empty.originalParent==empty.parent);
                       empty.homePoint = empty.parent.localToGlobal(empty.x, empty.y);
                       empty.addTo(S);
                    console.log(empty);
                });

            // Handle drag-and-drop
             // --- NEW, REWRITTEN PRESSUP HANDLER ---
            //   empty.on("mousedown", () => {
            //         const globalDragPoint = empty.localToGlobal(empty.x , empty.y );
            //     console.log(`MOUSEDOWN empty global pos "${globalDragPoint.x} x ${globalDragPoint.y}"`);
            //         console.log(`MOUSEDOWN on piece "${empty.q.a} x ${empty.q.b}"`);
            //         empty.originalX = globalDragPoint.x;
            //         empty.originalY = globalDragPoint.y;
            //         empty.originalParent = empty.parent;
            //     });

              empty.on("pressup", () => {
                    console.group(`PRESSUP Event on Piece: "${empty.q.a} x ${empty.q.b}"`);
                    
                    if (!gameState.gameActive) {
                        console.warn("- Game not active, ignoring drop.");
                        console.groupEnd();
                        return;
                    }

                    let droppedOnSlot = null;
                     // Convert the center of the dragged piece to global coordinates.
                  // This is the most important change for fixing hit detection.
                        const globalDropPoint = { x: this.S.mouseX, y: this.S.mouseY };
                        
                        console.log('Global Drop Point:', globalDropPoint);
                        // new Circle(10, "red").centerReg(this.S).loc(globalDropPoint.x, globalDropPoint.y).animate({alpha:0}, 0.5, null, (c) => c.removeFrom());

                    // Loop through the answer blocks to see if the dragged piece's BOUNDS are hitting any of them.
                    for (const block of this.answerBlocks) {
                        // hitTestRectBounds works in GLOBAL coordinates, solving the parent issue.
                        // Use hitTestPoint with the global coordinates for a reliable, cross-container hit test.
                        if (block.active && block.hitTestPoint(globalDropPoint.x, globalDropPoint.y)) {
                            droppedOnSlot = block;
                            break;
                        }
                    }
                    empty.noDrag();
                     
                      if (droppedOnSlot) {
            // Check if the answer is correct.
                        if (droppedOnSlot.num === empty.q.target) {
                            console.log(`%c==> CORRECT ANSWER!`, "color: green; font-weight: bold;",droppedOnSlot);
                            this.isProcessingCorrectAnswer = true;
                            // empty.noDrag();
                            droppedOnSlot.active = false;
                            droppedOnSlot.mouseEnabled = false;
                            // droppedOnSlot.label.alpha = 0;
                           
                            // empty.mouseEnabled=false;

                            // Fade the question text to show it has been answered.
                           // empty.originalParent.parent.getChildAt(0).alpha = 0.3;

                            // To snap correctly, move the piece to the answers' container.
                            //droppedOnSlot.center(this.rightContainer);
                            // empty.center(droppedOnSlot);
                           
                            //   empty.scaleTo(droppedOnSlot, 100, 100, FIT).center(droppedOnSlot);
                                   

                            // Animate the piece to the exact location of the answer slot.
                            // empty.animate({ props: { alpha: 1 }}, 0.2, "quadOut", () => {
                            
                                
                                      
                                
                                // empty.sprite.scaleTo(droppedOnSlot,100,100,FIT);
                                // empty.sprite.scaleTo(droppedOnSlot, 100, 100, "fit").center(droppedOnSlot);
                                empty.sprite.center(droppedOnSlot);
                                    empty.sprite.animate({
                                            props: {
                                                scale: 1,
                                                x:-droppedOnSlot.width/2,
                                                y:-droppedOnSlot.height/2,
                                                
                                            },
                                            time: 0.8,
                                            ease: "backOut"});

                                //  empty.top();
                                // empty.sprite.height=droppedOnSlot.height;
                                droppedOnSlot.label.center(empty);
                                                                
                                empty.animate({
                                            props: {
                                                x: empty.homePoint.x,
                                                y: empty.homePoint.y
                                            },
                                            time: 0.8,
                                            ease: "backOut"});
                                console.log('correct animation complete',empty);
                                this.isProcessingCorrectAnswer = false;
                                this.currentQuestionIndex++;
                                this.handleCorrect(config.points.correct, "সঠিক!");
                                this.checkIfComplete();
                                //new Rectangle(empty.width,empty.height, "blue").center(empty).top().animate({alpha:0}, 3, null, (c) => c.removeFrom());

                            // });
                            

                            // Hide the number label and make the slot transparent to reveal the puzzle piece.
                           
                          droppedOnSlot.rect.color = "transparent";


                        } else {
                            // Incorrect answer.
                            console.log(`%c==> INCORRECT ANSWER.`, "color: red; font-weight: bold;");
                           
                            // droppedOnSlot.shake(10, 5, 0.1, 4);
// this.S.update();
//                             // --- FIX 2: Simplified and corrected return animation ---
//                              empty.addTo(empty.originalParent); // Re-parent it first.
//                             // this.S.update();
//                             console.log(empty.homePoint, empty.originalX, empty.originalY, `parent check: ${empty.originalParent==empty.parent}`);
//                             empty.animate({ x: empty.originalX, y: empty.originalY }, 0.3, "backOut"); // Animate to stored LOCAL coords.

                            // Animate the piece (which is still on the Stage) back to its original GLOBAL position.
                   zim.timeout(0, () => {
            returnToHome(this.answerBlocks);
        });


                            // new Circle(10, "red").centerReg(empty.originalParent).loc(empty.originalX,  empty.originalX).animate({alpha:0}, 0.5, null, (c) => c.removeFrom());
                         this.handleIncorrect(config.points.incorrect, "ভুল!");
                        }
                    } else {
                        // Dropped on an empty space.
                        console.log("- Piece dropped on an empty area. Animating back.");
                        this.handleIncorrect(0, "Dropped on empty space");
        zim.timeout(0, () => {
            returnToHome(this.answerBlocks);
        });

                    }
                    function returnToHome(answerBlocks) {
        // Animate the piece back to its original GLOBAL position.
        //empty.addTo(originalParent);
        console.log(empty.homePoint, empty.originalX, empty.originalY, `parent check: ${empty.originalParent==empty.parent}`);
        // empty.addTo();
        // new Circle(5, "blue").addTo().loc(empty.homePoint.x,  empty.homePoint.y).animate({alpha:0}, 2, null, (c) => c.removeFrom());

        empty.animate({
            props: {
                x: empty.homePoint.x,
                y: empty.homePoint.y
            },
            time: 0.6,
            ease: "backOut",
            // AFTER it arrives, fix the parenting and re-enable dragging.
            call: () => {
                console.log('animation has completed for the block');
                empty.addTo(empty.originalParent);
                // empty.pos(empty.originalX, empty.originalY);
                // Re-enable drag so the user can try again.
                // empty.drag({ dropBack: false });
                empty.drag({
                     dropTargets: answerBlocks,
                    dropBack: false, // Return to home if not dropped on valid target
                    dropEnd: false, // Allow dragging after dropping
                    dropFull: false, // Prevent dropping on filled targets
                    dropSnap :false,
                    all:true,
                    
                });
                // new Circle(5, "blue").center(empty).animate({alpha:0}, 2, null, (c) => c.removeFrom());

                // this.S.update();
            }
        });
    }
                    console.groupEnd();
                });
            });


            // Animate appearance
            // zim.animate({
            //     target: this.emptyBlocks.concat(this.answerBlocks),
            //     props: { alpha: 1, scale: 1 },
            //     from: { alpha: 0, scale: 0 },
            //     time: 0.5,
            //     sequence: 0.05,
            //     ease: "backOut"
            // });

            this.S.update();
        });
    }

    checkIfComplete() {
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.completeSet();
        }
    }

    nextQuestion() {
        // All questions displayed at once; no per-question transition
        this.S.update();
    }

    completeSet() {
        if (this.stopwatch) {
            this.stopwatch.stop();
        }
        this.cleanup();
        const success = this.currentQuestionIndex >= this.numQuestions;
        const feedbackText = success ? "স্টেজ সম্পূর্ণ!" : "সময় শেষ! আবার চেষ্টা করুন।";
        const feedback = new zim.Label({
            text: feedbackText,
            size: 60,
            color: success ? "green" : "red",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15
        }).center(this.S);
        if (success) {
            // Fireworks effect
            const emitter = new zim.Emitter({
                obj: new zim.Circle(5, ["red", "yellow", "blue", "green"]),
                startPaused: true,
                random: {
                    scale: { min: 1, max: 4 },
                    rotation: { min: 0, max: 360 }
                },
                angle: { min: 0, max: 360 },
                force: { min: 4, max: 8 },
                num: 5,
                life: 2,
                gravity: 2
            }).center(this.S);
            emitter.spurt(150);
            zim.timeout(3, () => emitter.removeFrom());
        }
        this.callbacks.onCompleteSet(feedback, success);
    }

    handleTimeUp() {
        this.completeSet();
    }

    cleanup() {
          this.answerBlocks.forEach(block => {
            block.removeAllChildren();
            if (block && typeof block.dispose === 'function') {
                block.dispose();
            }
        });
        this.answerBlocks = [];
        if (this.vizContainer) this.vizContainer.removeAllChildren();
        if (this.questionContainer) this.questionContainer.removeAllChildren();
        if (this.gameState.qaRegion) this.gameState.qaRegion.removeAllChildren();
        if (this.qaLayout) this.gameState.layoutManager.remove(this.qaLayout);
        if (this.panelLayout) this.gameState.layoutManager.remove(this.panelLayout);
        if (this.rowLayouts) {
            this.rowLayouts.forEach(layout => this.gameState.layoutManager.remove(layout));
            this.rowLayouts = [];
        }

        if (this.sprite) {
            this.sprite.dispose();
            this.sprite = null;
        }
        this.emptyBlocks.forEach(block => {
            block.noDrag();
            block.off("pressup");
        });
        if (this.S && this.S.hasEventListener("stagemousemove")) this.S.off("stagemousemove");
        this.emptyBlocks = [];
        this.answerBlocks = [];
        this.questionRows = [];
        this.questions = [];
        this.S.update();
    }
}
