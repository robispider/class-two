import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, shuffle, rand } from '../utils.js';
import { ScoreCalculator } from '../ScoreCalculator.js';
class PracticeQuestion extends Question {
    constructor(...args) {
        super(...args);

        this.helpText = "বাম পাশের গ্রিডটি আপনাকে নামতা মনে রাখতে সাহায্য করবে। ডান পাশে দেখানো গুণটি সমাধান করুন এবং সঠিক উত্তর বাছাই করুন। আপনার দক্ষতার মিটারটি দেখুন এবং ১০০% করার চেষ্টা করুন!";

        this.createdObjects = [];
        this.last20Attempts = [];
        this.skillPercent = 0;
        this.questionOrderMode = 'sequential';
        this.sequentialQuestionsAnswered = new Set();
        this.tableToPractice = this.allowedTables[0];

        this.gridElements = { cells: [], rowHeaders: [], colHeaders: [] };
        this.isRepeatingQuestion = false;
        this.problematicQuestions = [];
        this.optionsContainer = null;
        this.lastQuestionA = null;
        this.questionsSinceLastError = 0;
        this.hoverOverlayContainer = null;
        this.music = null; // NEW: Property to hold the music instance
    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;

        // --- NEW: Start background music ---
        if (!this.music || !this.music.isPlaying) {
            this.music = this.scene.sound.add('standard-gackground', { loop: true, volume: 0.4 });
            this.music.play();
        }
        
        this.setup();
        this.displayNextQuestion();
    }

    setup() {
        gameState.gameActive = true;
        const qaRegion = this.scene.qaRegion;

        const leftPanel = this.scene.add.container(0, 0).setSize(qaRegion.width * 0.45, qaRegion.height);
        const rightPanel = this.scene.add.container(qaRegion.width * 0.45, 0).setSize(qaRegion.width * 0.55, qaRegion.height);
        qaRegion.add([leftPanel, rightPanel]);
        this.createdObjects.push(leftPanel, rightPanel);

        this.createMultiplicationGrid(leftPanel);

        this.skillContainer = this.scene.add.container(rightPanel.width / 2, 50);
        rightPanel.add(this.skillContainer);
        this.createSkillIndicator();

        this.qaContainer = this.scene.add.container(0, 100).setSize(rightPanel.width, rightPanel.height - 100);
        rightPanel.add(this.qaContainer);

        this.createdObjects.push(this.skillContainer, this.qaContainer);
    }

    createMultiplicationGrid(container) {
        const gridLineColor = 0x666666;
        const maxHeader = Math.max(this.tableToPractice, 10);
        const numCols = maxHeader + 1;
        const numRows = 11;

        const cellSize = Math.min(container.width / numCols, container.height / numRows) * 0.95;

        const gridContainer = this.scene.add.container(
            (container.width - (numCols * cellSize)) / 2,
            (container.height - (numRows * cellSize)) / 2
        );
        gridContainer.setDepth(10);
        container.add(gridContainer);
        this.createdObjects.push(gridContainer);



        const colors = [0xFFC312, 0xF79F1F, 0xEE5A24, 0xEA2027, 0xC4E538, 0xA3CB38, 0x009432, 0x0652DD, 0x1B1464, 0x6F1E51, 0x3B3B98, 0x182C61, 0xFC427B, 0xD6A2E8, 0xBDC581, 0xFEA47F, 0x25CCF7, 0x55E6C1, 0x9AECDB, 0x58B19F];
        const textStyle = { fontSize: `${cellSize * 0.4}px`, fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', fontStyle: 'bold' };
        const innerTextStyle = { ...textStyle, fill: '#333333' };

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                let text = '';
                let bgColor = 0xFFFFFF;
                let style = innerTextStyle;
                let isHeader = false;

                const cell = this.scene.add.container(x, y).setSize(cellSize, cellSize);
                cell.setDataEnabled(); // Enable DataManager
                gridContainer.add(cell);

                const bg = this.scene.add.rectangle(0, 0, cellSize, cellSize, bgColor).setStrokeStyle(1, gridLineColor);
                cell.add(bg);

                if (row === 0 && col > 0) {
                    text = toBangla(col);
                    bgColor = colors[(col - 1) % colors.length];
                    style = textStyle;
                    this.gridElements.colHeaders[col] = cell;
                    isHeader = true;
                } else if (col === 0 && row > 0) {
                    text = toBangla(row);
                    bgColor = colors[(row - 1) % colors.length];
                    style = textStyle;
                    this.gridElements.rowHeaders[row] = cell;
                    isHeader = true;
                } else if (row > 0 && col > 0) {
                    const value = row * col;
                    text = toBangla(value);
                    cell.setData({ isCell: true, row: row, col: col, value: value });
                    
                    cell.setData('isCell', true);
                    cell.setData('row', row);
                    cell.setData('col', col);
                    cell.setData('value', value);
                    
                    this.gridElements.cells.push(cell);
                }

                bg.setFillStyle(bgColor);
                bg.setData('originalColor', bgColor);
                const cellText = this.scene.add.text(0, 0, text, style).setOrigin(0.5);
                cell.add(cellText);

                if (!isHeader && row > 0 && col > 0) {
                    cell.setInteractive({ useHandCursor: true })
                        .on('pointerover', () => this.highlightGridCross(cell.getData('row'), cell.getData('col'), cellSize))
                       .on('pointerout', () => this.clearGridCrossHighlights())
                        .on('pointerdown', () => {
                            if (gameState.gameActive) this.checkAnswer(cell.getData('value'));
                        });
                }
                cell.setDepth(1);
            }
        }
        
        this.hoverOverlayContainer = this.scene.add.container(0, 0);
        this.hoverOverlayContainer.setDepth(100).setVisible(true).setAlpha(1);;
        gridContainer.add(this.hoverOverlayContainer);
    }
    
    highlightGridCross(row, col, cellSize) {
        this.clearGridCrossHighlights();

        const rowHeader = this.gridElements.rowHeaders[row];
        const colHeader = this.gridElements.colHeaders[col];

        if (!rowHeader || !colHeader) {
            return;
        }

        if (rowHeader) rowHeader.first.postFX.addGlow(0xffffff, 2);
        if (colHeader) colHeader.first.postFX.addGlow(0xffffff, 2);

        const rowHeaderColor = rowHeader ? rowHeader.first.fillColor : 0xFF0000;
        const colHeaderColor = colHeader ? colHeader.first.fillColor : 0x00FF00;

        if (this.gridElements.cells.length === 0) {
            return;
        }

        this.gridElements.cells.forEach(cell => {
            const cellData = {
                isCell: cell.getData('isCell'),
                row: cell.getData('row'),
                col: cell.getData('col')
            };
            
            if (!cellData.isCell || cellData.row === undefined || cellData.col === undefined) {
                return;
            }

            let overlayColor = null;
            let alpha = 0.3;

            const isInRowSegment = (cellData.row === row && cellData.col <= col);
            const isInColSegment = (cellData.col === col && cellData.row <= row);

            if (isInRowSegment) {
                overlayColor = rowHeaderColor;
            }
            
            if (isInColSegment) {
                overlayColor = colHeaderColor;
            }
            
            if (isInRowSegment && isInColSegment) {
                overlayColor = 0xFFFF00;
                alpha = 0.4; 
            }

            if (overlayColor !== null) {
                const overlay = this.scene.add.rectangle(cell.x, cell.y, cellSize, cellSize, overlayColor, alpha).setDepth(100);
                overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
                this.hoverOverlayContainer.add(overlay);
            }
        });
    }

    clearGridCrossHighlights() {
        this.gridElements.rowHeaders.forEach(h => h && h.first.postFX.clear());
        this.gridElements.colHeaders.forEach(h => h && h.first.postFX.clear());
        this.hoverOverlayContainer.removeAll(true);
    }
    
    highlightOptionsInGrid(options, colors) {
        options.forEach((optValue, index) => {
            const cells = this.gridElements.cells.filter(c => c.getData('value') === optValue);
            cells.forEach(cell => {
                if (cell) {
                    const bg = cell.first;
                    bg.setFillStyle(Phaser.Display.Color.HexStringToColor(colors[index]).color);
                    bg.postFX.addGlow(Phaser.Display.Color.HexStringToColor(colors[index]).color, 4);
                }
            });
        });
    }

    clearGridHighlights() {
        this.gridElements.cells.forEach(cell => {
            const bg = cell.first;
            bg.setFillStyle(bg.getData('originalColor'));
            bg.postFX.clear();
        });
    }

    createSkillIndicator() {
        const barWidth = 300;
        const barHeight = 30;
        const bg = this.scene.add.rectangle(0, 0, barWidth, barHeight, 0x333333).setOrigin(0.5);
        this.skillBar = this.scene.add.rectangle(-(barWidth / 2), 0, 0, barHeight, 0x00ff00).setOrigin(0, 0.5);
        const frame = this.scene.add.rectangle(0, 0, barWidth, barHeight).setOrigin(0.5).setStrokeStyle(2, 0xffffff).setFillStyle();
        this.skillText = this.scene.add.text(0, 0, `দক্ষতা: ${toBangla(0)}%`, { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);
        this.skillContainer.add([bg, this.skillBar, frame, this.skillText]);
    }

    updateSkillIndicator() {
        const correctCount = this.last20Attempts.filter(Boolean).length;
        const totalAttempts = this.last20Attempts.length > 0 ? this.last20Attempts.length : 1;
        this.skillPercent = Math.floor((correctCount / totalAttempts) * 100);
        this.scene.tweens.add({ targets: this.skillBar, width: 300 * (this.skillPercent / 100), duration: 300, ease: 'Power2' });
        this.skillText.setText(`দক্ষতা: ${toBangla(this.skillPercent)}%`);
        if (this.skillPercent === 100 && this.last20Attempts.length >= 20) {
            this.showCongratulation();
        }
    }

    showCongratulation() {
        const congratsText = this.scene.add.text(this.qaContainer.width / 2, -30, "দারুণ! আপনি এই নামতায় দক্ষ হয়ে উঠেছেন!", {
            fontSize: '24px', fill: config.colors.correct, fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.qaContainer.add(congratsText);
        this.scene.tweens.add({ targets: congratsText, alpha: 0, y: '-=20', duration: 3000, ease: 'Power1', onComplete: () => congratsText.destroy() });
    }

    generateQuestionData() {
        const b = this.tableToPractice;
        let a;

        if (this.questionOrderMode === 'random' && this.problematicQuestions.length > 0 && this.questionsSinceLastError > 1 && Math.random() < 0.4) {
            const randomIndex = rand(0, this.problematicQuestions.length - 1);
            const question = this.problematicQuestions.splice(randomIndex, 1)[0];
            this.lastQuestionA = question.a;
            return question;
        }

        if (this.sequentialQuestionsAnswered.size < 10) {
            this.questionOrderMode = 'sequential';
        } else {
            if (this.questionOrderMode !== 'random') {
                 this.questionOrderMode = 'random';
                 const switchText = this.scene.add.text(this.qaContainer.width / 2, this.qaContainer.height/2, "খুব ভালো! এখন প্রশ্নগুলো এলোমেলোভাবে আসবে।", {
                    fontSize: '28px', fill: config.colors.text, fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 15, y: 10 }, align: 'center'
                }).setOrigin(0.5);
                this.qaContainer.add(switchText);
                this.scene.time.delayedCall(2500, () => switchText.destroy());
            }
        }

        if (this.questionOrderMode === 'sequential') {
            for (let i = 1; i <= 10; i++) {
                if (!this.sequentialQuestionsAnswered.has(i)) {
                    a = i;
                    break;
                }
            }
        } else { 
            let attempts = 0;
            do {
                a = rand(1, 10);
                attempts++;
            } while (a === this.lastQuestionA && attempts < 10);
            
            if (a === this.lastQuestionA) {
                a = (a % 10) + 1;
            }
        }

        this.lastQuestionA = a;
        return { a, b, target: a * b };
    }
    
    generateOptions(correct) {
        const { a, b } = this.questionData;
        const options = new Set([correct]);
        const maxHeader = Math.max(this.tableToPractice, 10);
        
        const closeMisses = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b];
        closeMisses.forEach(miss => {
            if (miss > 0 && miss <= 10 * maxHeader) options.add(miss);
        });

        let attempts = 0;
        while (options.size < 4 && attempts < 20) {
            const randRow = rand(1, 10);
            const randCol = rand(1, maxHeader);
            options.add(randRow * randCol);
            attempts++;
        }

        const finalOptions = [correct];
        options.delete(correct);
        const shuffledOptions = shuffle(Array.from(options));
        for(let i=0; i<3 && i < shuffledOptions.length; i++) {
            finalOptions.push(shuffledOptions[i]);
        }

        return shuffle(finalOptions);
    }


    displayNextQuestion() {
        this.clearGridHighlights();
        this.clearGridCrossHighlights();
        this.qaContainer.removeAll(true);

        this.questionData = this.generateQuestionData();
        gameState.gameActive = true;
        const { a, b, target } = this.questionData;
        gameState.currentA = a;
        gameState.currentB = b;
        gameState.currentAnswer = target;

        const vizContainer = this.scene.add.container(0, 0).setSize(this.qaContainer.width, this.qaContainer.height * 0.6);
        const questionTextContainer = this.scene.add.container(0, vizContainer.height).setSize(this.qaContainer.width, this.qaContainer.height * 0.15);
        this.optionsContainer = this.scene.add.container(0, vizContainer.height + questionTextContainer.height).setSize(this.qaContainer.width, this.qaContainer.height * 0.25);
        this.qaContainer.add([vizContainer, questionTextContainer, this.optionsContainer]);

        const qText = this.scene.add.text(questionTextContainer.width / 2, questionTextContainer.height / 2, `${toBangla(a)} × ${toBangla(b)} = ?`, {
            fontSize: '60px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
        }).setOrigin(0.5);
        questionTextContainer.add(qText);

        this.createVisualization(vizContainer, a, b);

        const options = this.generateOptions(target);
        const optionColors = shuffle([config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4]);
        const buttonWidth = 120, buttonHeight = 80, spacing = 20;
        const totalButtonWidth = (options.length * buttonWidth) + ((options.length - 1) * spacing);

        options.forEach((opt, index) => {
            const x = (index * (buttonWidth + spacing)) - (totalButtonWidth / 2) + (buttonWidth / 2) + this.optionsContainer.width / 2;
            const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, Phaser.Display.Color.HexStringToColor(optionColors[index]).color)
                .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color).setOrigin(0.5);
            const buttonText = this.scene.add.text(0, 0, toBangla(opt), { fontSize: '40px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
            const button = this.scene.add.container(x, this.optionsContainer.height / 2, [buttonBg, buttonText]).setSize(buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });
            
            button.answerValue = opt;
            this.optionsContainer.add(button);

            // --- MODIFIED: Added sound effects ---
            button.on('pointerdown', () => {
                this.scene.sound.play('button-click');
                this.checkAnswer(opt);
            });
            button.on('pointerover', () => {
                this.scene.sound.play('button-hover', { volume: 0.7 });
                this.scene.tweens.add({ targets: button, scale: 1.05, duration: 150 });
            });
            button.on('pointerout', () => this.scene.tweens.add({ targets: button, scale: 1, duration: 150 }));
        });

        this.highlightOptionsInGrid(options, optionColors);
    }

    createVisualization(container, numGroups, itemsPerGroup) {
        const itemIndex = rand(0, config.assets.count - 1);
        const colors = [0xEAF2F8, 0xEBF5FB, 0xF4ECF7, 0xFDEDEC, 0xFEF9E7, 0xFEF5E7];
        const contentW = container.width * 0.9, contentH = container.height * 0.9;
        const cols = Math.min(numGroups, 5), rows = Math.ceil(numGroups / cols);
        const spacing = 15;
        const groupSize = Math.min((contentW - (cols - 1) * spacing) / cols, (contentH - (rows - 1) * spacing) / rows);
        const totalGridW = cols * groupSize + (cols - 1) * spacing;
        const totalGridH = rows * groupSize + (rows - 1) * spacing;
        const startX = (container.width - totalGridW) / 2;
        const startY = (container.height - totalGridH) / 2;
        for (let i = 0; i < numGroups; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const gx = startX + col * (groupSize + spacing), gy = startY + row * (groupSize + spacing);
            const groupContainer = this.scene.add.container(gx, gy);
            container.add(groupContainer);
            const bg = this.scene.add.rectangle(0, 0, groupSize, groupSize, shuffle(colors)[0]).setOrigin(0).setStrokeStyle(2, 0xcccccc);
            groupContainer.add(bg);
            this.addItemsToGroup(groupContainer, itemsPerGroup, groupSize, itemIndex);
        }
    }

    addItemsToGroup(group, numItems, groupSize, itemIndex) {
        const innerPad = groupSize * 0.1, innerW = groupSize - 2 * innerPad, innerH = groupSize - 2 * innerPad;
        const innerCols = Math.ceil(Math.sqrt(numItems)), innerRows = Math.ceil(numItems / innerCols);
        const gap = 2;
        let itemSize = Math.min((innerW - (innerCols - 1) * gap) / innerCols, (innerH - (innerRows - 1) * gap) / innerRows);
        const totalItemsW = innerCols * itemSize + (innerCols - 1) * gap;
        const totalItemsH = innerRows * itemSize + (innerRows - 1) * gap;
        const offsetX = innerPad + (innerW - totalItemsW) / 2, offsetY = innerPad + (innerH - totalItemsH) / 2;
        for (let j = 0; j < numItems; j++) {
            const sc = j % innerCols, sr = Math.floor(j / innerCols);
            const sx = offsetX + sc * (itemSize + gap) + itemSize / 2, sy = offsetY + sr * (itemSize + gap) + itemSize / 2;
            group.add(this.scene.add.sprite(sx, sy, 'items_spritesheet', itemIndex).setDisplaySize(itemSize, itemSize).setOrigin(0.5));
        }
    }

    checkAnswer(selected) {
        if (!gameState.gameActive) return;
        
        const correct = selected === gameState.currentAnswer;

        if (correct) {
            this.questionsSinceLastError++;
            if (!this.isRepeatingQuestion) {
                gameState.gameActive = false; 
                this.last20Attempts.push(true);
                if (this.last20Attempts.length > 20) this.last20Attempts.shift();
                
                if (this.questionOrderMode === 'sequential') {
                    this.sequentialQuestionsAnswered.add(gameState.currentA);
                }
                
                this.updateSkillIndicator();
                this.callbacks.onCorrect(0, "সঠিক!");
                this.playSuccessAnimation();
            } else { 
                this.isRepeatingQuestion = false;
                this.callbacks.onCorrect(0, "এবার সঠিক হয়েছে!");
                this.playSuccessAnimation();
            }
        } else { 
            this.isRepeatingQuestion = true;
            this.questionsSinceLastError = 0;
            this.last20Attempts.push(false);
            if (this.last20Attempts.length > 20) this.last20Attempts.shift();

            if (this.questionOrderMode === 'random') {
                this.problematicQuestions.push(this.questionData);
            }
            
            this.updateSkillIndicator();
            this.callbacks.onIncorrect(0, "ভুল! আবার চেষ্টা করুন।");
            
            // --- NEW: Play incorrect answer sound ---
            this.scene.sound.play('button-shake');

            const selectedButton = this.optionsContainer.getAll().find(b => b.answerValue === selected);
            const selectedCell = this.gridElements.cells.find(c => c.getData('value') === selected);
            
            if (selectedButton) this.scene.tweens.add({ targets: selectedButton, x: '+=10', yoyo: true, duration: 50, repeat: 4 });
            if (selectedCell) this.scene.tweens.add({ targets: selectedCell, angle: 5, yoyo: true, duration: 60, repeat: 3 });
        }
    }

    playSuccessAnimation() {
        // --- NEW: Play success sound ---
        this.scene.sound.play('applause', { volume: 0.6 });
        
        const { a, b, target } = this.questionData;
        const rowFactor = a;
        const colFactor = b;

        const correctCell = this.gridElements.cells.find(c => c.getData('value') === target && c.getData('row') === rowFactor && c.getData('col') === colFactor);
        const rowHeader = this.gridElements.rowHeaders[rowFactor];
        const colHeader = this.gridElements.colHeaders[colFactor];

        if (!correctCell || !rowHeader || !colHeader) {
            console.warn("Could not find all grid elements for animation. Skipping.");
            this.transitionToNext();
            return;
        }

        const cellMatrix = correctCell.getWorldTransformMatrix(); 
        const rowHeaderMatrix = rowHeader.getWorldTransformMatrix();
        const colHeaderMatrix = colHeader.getWorldTransformMatrix();

        const finalCellPos = this.qaContainer.getLocalPoint(cellMatrix.tx, cellMatrix.ty);
        const finalRowHeaderPos = this.qaContainer.getLocalPoint(rowHeaderMatrix.tx - rowHeader.width * .5, rowHeaderMatrix.ty);
        const finalColHeaderPos = this.qaContainer.getLocalPoint(colHeaderMatrix.tx, colHeaderMatrix.ty - colHeader.height * .5);

        const createAndAnimateArrow = (startX, startY, endX, endY) => {
            const arrowScale = 0.2;
            const arrowContainer = this.scene.add.container(startX, startY).setDepth(5);
            this.qaContainer.add(arrowContainer);

            const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
            const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
            arrowContainer.setRotation(angle);

            const start = this.scene.add.image(0, 0, 'green-arrow-start').setOrigin(0, 0.5).setScale(arrowScale);
            const mid = this.scene.add.image(start.displayWidth, 0, 'green-arrow-mid').setOrigin(0, 0.5).setScale(arrowScale);
            const point = this.scene.add.image(start.displayWidth, 0, 'green-arrow-point').setOrigin(0, 0.5).setScale(arrowScale);
            
            arrowContainer.add([start, mid, point]);
            arrowContainer.setBlendMode(Phaser.BlendModes.MULTIPLY);

            const requiredMidWidth = distance - start.displayWidth - point.displayWidth;
            mid.displayWidth = 0;

            this.scene.tweens.add({
                targets: mid,
                displayWidth: requiredMidWidth > 0 ? requiredMidWidth : 0,
                duration: 400,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    point.x = start.displayWidth + mid.displayWidth;
                },
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: arrowContainer,
                        alpha: 0,
                        duration: 300,
                        delay: 1000,
                        onComplete: () => {
                            arrowContainer.destroy();
                        }
                    });
                }
            });
        };

        createAndAnimateArrow(finalRowHeaderPos.x, finalRowHeaderPos.y, finalCellPos.x, finalCellPos.y);
        this.scene.time.delayedCall(100, () => {
            createAndAnimateArrow(finalColHeaderPos.x, finalColHeaderPos.y, finalCellPos.x, finalCellPos.y);
        });

        this.scene.time.delayedCall(400, () => {
            const emitter = this.scene.add.particles(finalCellPos.x, finalCellPos.y, 'particle', {
                speed: { min: 100, max: 200 }, lifespan: 800, scale: { start: 1, end: 0 },
                blendMode: 'ADD', emitting: false,
                emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 40), quantity: 30 }
            });
            this.qaContainer.add(emitter);
            emitter.explode(30);
            this.scene.time.delayedCall(1000, () => emitter.destroy());
        });
        
        this.scene.time.delayedCall(500, () => {
            const { width, height } = this.scene.scale;
            
            const answerText = this.scene.add.text(cellMatrix.tx, cellMatrix.ty, toBangla(target), {
                fontSize: '250px', 
                fontFamily: '"Noto Sans Bengali", sans-serif',
                fontStyle: 'bold', 
                stroke: '#FFFFFF', 
                strokeThickness: 12,
                align: 'center'
            }).setOrigin(0.5).setAlpha(0).setScale(0.1).setDepth(1000); 

            const gradient = answerText.context.createLinearGradient(0, 0, 0, answerText.height);
            gradient.addColorStop(0, '#FEE12B');
            gradient.addColorStop(0.5, '#F58D3D');
            gradient.addColorStop(1, '#F04E51');
            answerText.setFill(gradient);
            
            this.scene.tweens.add({
                targets: answerText,
                x: width / 2,
                y: height / 2,
                alpha: 1, 
                scale: 1,
                duration: 800,
                ease: 'Elastic.easeOut',
                easeParams: [1.2, 0.6], 
                onComplete: () => {
                    this.scene.tweens.add({ targets: answerText, alpha: 0, duration: 500, delay: 600, onComplete: () => answerText.destroy() });
                }
            });
        });

        this.scene.time.delayedCall(2000, () => this.transitionToNext());
    }
  
    transitionToNext() {
        this.scene.tweens.add({
            targets: this.qaContainer,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.qaContainer.setAlpha(1);
                this.displayNextQuestion();
            }
        });
    }

    cleanup() {
        super.cleanup();
        // --- NEW: Stop music on cleanup ---
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.createdObjects.forEach(obj => { if (obj && obj.scene) obj.destroy(); });
        this.createdObjects = [];
    }
}

export { PracticeQuestion };