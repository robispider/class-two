import { Question } from "./questionBase.js";
import { toBangla, rand } from "./utils.js";
import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";

export class StandardQuestion extends Question {
    setup() {
        super.setup();
        const { a, b } = this.questionData;
        this.gameState.currentA = a;
        this.gameState.currentB = b;
        this.gameState.currentAnswer = a * b;
        // this.gameState.questionType = type;

        const randomItemIndex = rand(0, config.assets.count - 1);
        const currentItemName = config.assets.itemNames[randomItemIndex];

            // Descriptive title for visualization in questionContainer
   const types = ['standard', 'partial'];

// Randomly select an index (0 or 1)
let randomTypeIndex = Math.floor(Math.random() * types.length);
if ( a===1 || b===1)
{
    randomTypeIndex=0;
}
// Assign the randomly selected type
const type = types[randomTypeIndex];

let titleText;
console.log(type);
this.gameState.questionType=type;
if (type === 'standard') {
    titleText = `কতগুলি ${currentItemName} দেখা যাচ্ছে?`;
} else if (type === 'partial') {
    titleText = `সব বাক্সে একই সংখ্যক ${currentItemName} আছে। মোট কতগুলি ${currentItemName} আছে?`;
}


        // Clear qaRegion and set up sub-regions with layout
        this.gameState.qaRegion.removeAllChildren();

        // Create sub-containers for visualization (70%), question (12%), and answer (18%)
        this.vizContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.8);
        this.questionContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.2 * 0.4);
        this.answerContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.2 * 0.6);

        // Add sub-containers to qaRegion
        this.vizContainer.addTo(this.gameState.qaRegion);
        this.questionContainer.addTo(this.gameState.qaRegion);
        this.answerContainer.addTo(this.gameState.qaRegion);

        // Set up vertical layout for qaRegion
        this.qaLayout = new zim.Layout({
            holder: this.gameState.qaRegion,
            regions: [
                { object: this.vizContainer, maxHeight: 90, align: "center", valign: "top" },
                { object: this.questionContainer, maxHeight: 5, align: "center", valign: "middle" },
                { object: this.answerContainer, maxHeight: 5, align: "center", valign: "bottom" }
            ],showRegions:false,
            vertical: true
        });
        this.gameState.layoutManager.add(this.qaLayout);

        // Split answerContainer into two sub-regions: question (40%) and options (60%)
        this.answerQuestionContainer = new zim.Container(this.answerContainer.width, this.answerContainer.height * 0.4);
        this.answerOptionsContainer = new zim.Container(this.answerContainer.width, this.answerContainer.height * 0.6);

        // Add sub-containers to answerContainer
        this.answerQuestionContainer.addTo(this.answerContainer);
        this.answerOptionsContainer.addTo(this.answerContainer);

        // Set up vertical layout for answerContainer
        this.answerLayout = new zim.Layout({
            holder: this.answerContainer,
            regions: [
                { object: this.answerQuestionContainer, maxWidth: 40, align: "left", valign: "center" },
                { object: this.answerOptionsContainer, maxWidth: 100, align: "center", valign: "center" }
            ],
            vertical: false
        });
        this.gameState.layoutManager.add(this.answerLayout);

        // Explicit multiplication question in answerQuestionContainer
        let explicitText=`${toBangla(a)} × ${toBangla(b)} = ?`;
        if (type === 'partial') {
    explicitText = `${toBangla(a)} × ◼ = ?`;
}
        new zim.Label({ 
            text: explicitText, 
            size: 60, 
            color: config.colors.text,
            bold: true,
            align: "center"
        }).center(this.answerQuestionContainer);

    
         this.gameState.questionTitle== new zim.Label({ 
                 text: titleText, 
                 size: 30, 
                 color:config.colors.text, 
                 align: "center", 
                 bold: true ,
                 lineWidth: this.questionContainer.width - 40
                 
             }).center(this.questionContainer);
        //            new zim.Label({ 
        //     text: `${toBangla(a)} × ${toBangla(b)} = ?`, 
        //     size: 60, 
        //     color: config.colors.text,
        //     bold: true,
        //     align: "center"
        // }).center(this.questionContainer);
  // qaRegion এর প্রস্থ থেকে 40 পিক্সেল কম জায়গা দেওয়া হয়েছে যাতে লেখাটি কন্টেইনারের ভেতরে থাকে
                    //  lineWidth: this.questionContainer.width - 40
        // this.gameState.questionTitle.text = titleText;
        this.gameState.questionTitle.animate({
           props:{alpha:1},
                time:1, // will be the default time for the inner animations
            ease:"backOut"
        });//.wiggle("rotation", 0, 1, 3, 0.2, 0.4);
// new Rectangle({width:200, height:100, color:blue, corner:20}).center(this.questionContainer);
        // Visualization setup (adapted from updateVisualization)
const panelPadding = config.panelPadding || 20;
        const panelMargin = 2;
        const panelW = this.vizContainer.width - 2 * (panelMargin + panelPadding);
        const panelH = this.vizContainer.height - 2 * (panelMargin + panelPadding);
        const panelBorderWidth = 15; // Store border width for easier use

        const panel = new zim.Rectangle({
            width: panelW,
            height: panelH,
            color: config.colors.panel,
            borderColor: config.colors.panelBorder,
            borderWidth: panelBorderWidth,
            corner: 30
        }).center(this.vizContainer);

        // ---  CORRECTION 1: Define the Content Area ---
        // Calculate the actual usable space inside the panel's border.
        const contentW = panelW - panelBorderWidth * 2;
        const contentH = panelH - panelBorderWidth * 2;

        const shapeFactory = (size) => {
            const assetImage = this.S.frame.asset(config.assets.fileName);
            if (!assetImage) {
                zog(`Warning: ${config.assets.fileName} not loaded. Falling back to default shape.`);
                return new zim.Circle(size / 2, "gray");
            }
            const itemSprite = new zim.Sprite({
                image: assetImage,
                cols: config.assets.cols,
                rows: config.assets.rows,
                count: config.assets.count
            });
            itemSprite.gotoAndStop(randomItemIndex);
            itemSprite.siz(size, size, true);
            itemSprite.centerReg();
            return itemSprite;
        };

        const maxCols = Math.min(b, 3);
        const cols = maxCols;
        const rows = Math.ceil(b / cols);
        let spacingH = 18;
        let spacingV = 18;
        const groupMargin = 10;

       const totalSpacingW = (cols - 1) * spacingH;
const totalSpacingH = (rows - 1) * spacingV;

// --- CORRECTION: CALCULATE A SINGLE SQUARE GROUP SIZE ---
// 1. Calculate the maximum possible size for a group based on width and height constraints.
const potentialGroupW = Math.floor((contentW - totalSpacingW) / cols);
const potentialGroupH = Math.floor((contentH - totalSpacingH) / rows);

// 2. Use the smaller of the two potentials to ensure the square fits in both dimensions.
let groupSize = Math.min(potentialGroupW, potentialGroupH);

// 3. Enforce a minimum size.
const minGroupSize = 32*6;
groupSize = Math.min(minGroupSize, groupSize);

// 4. Set both width and height to the same value.
const groupW = groupSize;
const groupH = groupSize;

// The scaling factor block is no longer needed, as our calculation above prevents overflow.

// Recalculate total grid dimensions for centering.
const totalW = cols * groupW + (cols - 1) * spacingH;
const totalH = rows * groupH + (rows - 1) * spacingV;

// --- CORRECTION 3: Adjust Start Position for Border ---
// Center the grid within the content area, then add the border width as an offset.
const startX = panelBorderWidth + (contentW - totalW) / 2;
const startY = panelBorderWidth + (contentH - totalH) / 2;

const groups = [];

        for (let i = 0; i < b; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const gx = startX + col * (groupW + spacingH);
            const gy = startY + row * (groupH + spacingV);

            // This part is now correct because the parent is the panel and gx/gy are calculated correctly.
            const group = new zim.Container(groupW, groupH)
                .addTo(panel)
                .pos(gx, gy);
            // const openbox=new Bitmap (gameState.openboxTile.bitmapData  );
            // openbox.width=groupW;
            // openbox.height=groupH;
            //     openbox.center(group);

            // new zim.Rectangle({
            //     width: groupW,
            //     height: groupH,
            //     color: config.colors.panel.lighten(0.1),
            //     borderColor: config.colors.panelBorder,
            //     borderWidth: 2,
            //     corner: 12
            // }).center(group).sha("rgba(0,0,0,0.1)", 3, 3, 5);

            const innerPad = Math.max(groupMargin, Math.min(groupW * 0.1, groupH * 0.1));
            const innerW = groupW - 2 * innerPad;
            const innerH = groupH - 2 * innerPad;
            const innerCols = Math.ceil(Math.sqrt(a));
            const innerRows = Math.ceil(a / innerCols);
            const gap = Math.min(6, Math.min(innerW / innerCols, innerH / innerRows) * 0.2);
            let shapeSize = Math.min(64, Math.min(
                Math.floor((innerW - (innerCols - 1) * gap) / innerCols),
                Math.floor((innerH - (innerRows - 1) * gap) / innerRows)
            ));
            
            const totalShapeWidth = innerCols * shapeSize + (innerCols - 1) * gap;
            const totalShapeHeight = innerRows * shapeSize + (innerRows - 1) * gap;
            const offsetX = innerPad + (innerW - totalShapeWidth) / 2;
            const offsetY = innerPad + (innerH - totalShapeHeight) / 2;

            if (type === 'partial' && i > 0) {
            const closebox = new zim.Bitmap(gameState.closeboxTile)
            .siz(groupW, groupH) // Size it to fill the group
            .center(group);     // Center it within the group

                new zim.Label({
                    text: "?",
                    size: Math.min(groupW, groupH) * 0.8,
                    color: config.colors.text,
                    bold: true
                }).center(group).alp(0);
            } else {
                  const openbox = new zim.Bitmap(gameState.openboxTile)
            .siz(groupW, groupH) // Size it to fill the group
            .center(group);     // Center it within the group
                for (let j = 0; j < a; j++) {
                    const sc = j % innerCols;
                    const sr = Math.floor(j / innerCols);
                    const sx = offsetX + sc * (shapeSize + gap);
                    const sy = offsetY + sr * (shapeSize + gap);
                    shapeFactory(shapeSize).addTo(group).pos(sx, sy, "left", "top").alp(0);
                }
            }
            groups.push(group);
        }

        // Animation (no changes needed here)
        zim.loop(groups, (group, i) => {
            group.alp(0).sca(0.5);
            group.animate({
                props: { alpha: 1, scale: 1 },
                time: 0.4,
                wait: i * 0.1,
                ease: "backOut",
                call: () => {
                    const shapesInGroup = group.children.slice(1);
                    zim.animate({
                        target: shapesInGroup,
                        props: { alpha: 1 },
                        time: 0.3,
                        sequence: 0.02,
                        ease: "linear",
                        call: () => {
                            shapesInGroup.forEach(shape => {
                                // Wiggle only shapes, not the '?' Label
                                if (shape instanceof zim.Sprite || shape instanceof zim.Circle) {
                                    shape.wiggle("rotation", 0, -5, 5, 0.4, 0.8);
                                }
                            });
                        }
                    });
                }
            });
        });
    

        const options = this.generateOptions(this.gameState.currentAnswer);
        const optionColorsButton = [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4];

        const buttons = options.map((opt, index) => {
            const button = new zim.Button({
                backgroundColor: optionColorsButton[index],
                rollBackgroundColor: optionColorsButton[index].darken(0.2),
                label: new zim.Label({ text: toBangla(opt), size: 40, color: config.colors.text, bold: true }),
                corner: 30,
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                shadowColor: "rgba(0,0,0,0.2)",
                shadowBlur: 4
            }).alp(1);
            button.answerValue = opt;
            return button;
        });

        this.gameState.optionTile = new zim.Tile({
            obj: zim.series(buttons),
            clone: false,
            cols: 4,
            rows: 1,
            spacingH: 20,
            spacingV: 20
        }).center(this.answerOptionsContainer);

        // Click event for options
        this.gameState.optionTile.on("click", (e) => {
            if (!gameState.gameActive || !e.target || e.target.answerValue === undefined) return;
            const selected = e.target.answerValue;
            console.log("Option clicked:", selected);
            const timeTaken = this.stopwatch.getElapsedTime();
            this.stopwatch.stop();

            // Animate out elements
            let animationsRemaining = 3; // Options, answerQuestionContainer, vizContainer
            const completeAnimation = () => {
                animationsRemaining--;
                if (animationsRemaining === 0) {
                    this.vizContainer.removeAllChildren();
                    this.questionContainer.removeAllChildren();
                    this.answerQuestionContainer.removeAllChildren();
                    this.answerOptionsContainer.removeAllChildren();
                    this.S.update();
                    this.checkAnswer(selected);
                }
            };

            zim.loop(this.gameState.optionTile.items, (button, i) => {
                button.animate({
                    props: { alpha: 0, scale: 0 },
                    time: 0.5,
                    ease: "backOut",
                    call: completeAnimation
                });
            }, false, 0.1);

            this.answerQuestionContainer.animate({
                props: { alpha: 0, scale: 0 },
                time: 1,
                ease: "backOut",
                call: completeAnimation
            });

            const vizContainers = this.vizContainer.children.filter(child => child.type === "Container");
            if (vizContainers.length > 0) {
                let vizAnimationsRemaining = vizContainers.length;
                zim.loop(vizContainers, (cont) => {
                    cont.animate({
                        props: { alpha: 0, scale: 0 },
                        time: 0.3,
                        ease: "backIn",
                        sequence: 0.1,
                        call: () => {
                            vizAnimationsRemaining--;
                            if (vizAnimationsRemaining === 0) completeAnimation();
                        }
                    });
                });
            } else {
                completeAnimation();
            }
        }, null, true);

        this.gameState.answerString = "";
        this.gameState.typedLabel.text = "";
        this.gameState.typedLabel.center(this.answerOptionsContainer).mov(0, 150);

        this.keyHandler = (e) => {
            const key = e.keyCode;
            if (key >= 48 && key <= 57) { // 0-9
                this.gameState.answerString += String.fromCharCode(key);
            } else if (key === 8) { // Backspace
                this.gameState.answerString = this.gameState.answerString.slice(0, -1);
            } else if (key === 13) { // Enter
                const selected = parseInt(this.gameState.answerString);
                if (!isNaN(selected)) {
                    this.stopwatch.stop();
                    this.checkAnswer(selected);
                }
            }
            this.gameState.typedLabel.text = toBangla(this.gameState.answerString);
            this.S.update();
        };
        this.S.on("keydown", this.keyHandler, null, true);

        this.S.update();
    }

    checkAnswer(selected) {
        const timeTaken = this.stopwatch ? this.stopwatch.getElapsedTime() : 0;
        const correct = selected === this.gameState.currentAnswer;

        this.gameState.performanceTracker.logResponse(this.gameState.currentA, this.gameState.currentB, selected, timeTaken, correct);

        let feedbackColor = correct ? "green" : "red";
        let feedbackText = correct ? "সঠিক!" : `ভুল! সঠিক উত্তর: ${toBangla(this.gameState.currentAnswer)}`;
        let points = correct 
            ? config.points.correct + this.gameState.streak * config.points.streakBonus 
            : config.points.incorrect;

        if (correct) {
            this.handleCorrect(points, feedbackText);
        } else {
            if (this.gameState.mode === "practice") {
                this.gameState.healthBar.reduceHealth();
                if (this.gameState.healthBar.currentHealth <= 0) {
                    this.completeSet();
                    return;
                }
            }
            this.handleIncorrect(points, feedbackText);
        }

        this.gameState.questionCount++;
        const feedback = new zim.Label({
            size: 60,
            color: feedbackColor,
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15,
            text: feedbackText
        }).center(this.S);
        this.transitionToNext(feedback);
    }

    cleanup() {
        // Clear qaRegion and remove layouts
        if (this.vizContainer) this.vizContainer.removeAllChildren();
        if (this.questionContainer) this.questionContainer.removeAllChildren();
        if (this.answerQuestionContainer) this.answerQuestionContainer.removeAllChildren();
        if (this.answerOptionsContainer) this.answerOptionsContainer.removeAllChildren();
        if (this.gameState.qaRegion) this.gameState.qaRegion.removeAllChildren();
        if (this.qaLayout) this.gameState.layoutManager.remove(this.qaLayout);
        if (this.answerLayout) this.gameState.layoutManager.remove(this.answerLayout);

        super.cleanup();
        if (this.gameState.optionTile) {
            this.gameState.optionTile.removeFrom();
            this.gameState.optionTile = null;
        }
        this.S.update();
    }
}