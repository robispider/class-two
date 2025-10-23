import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, shuffle, rand } from '../utils.js';
import { ScoreCalculator } from '../ScoreCalculator.js';

class PracticeQuestion extends Question {
    constructor(...args) {
        super(...args);

        this.helpText = "উপরের গ্রিডটি আপনাকে নামতা মনে রাখতে সাহায্য করবে। নিচে দেখানো গুণটি সমাধান করুন এবং সঠিক উত্তর বাছাই করুন। আপনার দক্ষতার মিটারটি দেখুন এবং ১০০% করার চেষ্টা করুন!";

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
        this.music = null;

        // --- NEW: Class properties for new layout ---
        this.vizContainer = null;
        this.gridContainer = null;
        this.qaContainer = null;
         
        this.statsContainer = null;
        
        
        this.statsLabels = {};
        this.totalQuestionsTarget = 20;  // 10 sequential + 10 random
    this.questionsAnswered = 0;       // Total questions completed
    this.requiredQuestions = 20;      // Dynamic: increases on mistakes
    this.sustained90Percent = false;  // 90% over last 20 attempts

    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
        this.questionsAnswered = 0;
    this.requiredQuestions = this.totalQuestionsTarget;
    this.last20Attempts = [];  // Reset attempts tracking


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

        // --- REDESIGNED LAYOUT ---
        // The grid will take the top ~65% of the area
        
        const statsHeight = qaRegion.height * 0.10;
        const gridHeight = qaRegion.height * 0.70;
        const qaHeight = qaRegion.height * 0.20;
                 this.statsContainer = this.scene.add.container(0, 0).setSize(qaRegion.width, statsHeight);
        this.gridContainer = this.scene.add.container(0, statsHeight).setSize(qaRegion.width, gridHeight);
        this.qaContainer = this.scene.add.container(0, statsHeight + gridHeight).setSize(qaRegion.width, qaHeight);

        // The QA (question/options/skill) will take the bottom ~35%
        
        this.qaContainer = this.scene.add.container(0, gridHeight).setSize(qaRegion.width, qaHeight);

        qaRegion.add([this.statsContainer, this.gridContainer, this.qaContainer]);
        
        this.createdObjects.push(this.statsContainer, this.gridContainer, this.qaContainer);
        // Create the grid inside the top container
            this.createTopPanel(this.statsContainer);
        this.createMultiplicationGrid(this.gridContainer);
     


             

    }
//    createTopPanel(container) {
//         const { width, height } = container;
//         const padding = 20;

//         const panelBg = this.scene.add.graphics();
//         panelBg.fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.7);
//         panelBg.fillRoundedRect(padding / 2, padding / 2, width - padding, height - padding, 20);
//         panelBg.lineStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 0.8);
//         panelBg.strokeRoundedRect(padding / 2, padding / 2, width - padding, height - padding, 20);
//         container.add(panelBg);
        
//         const statsTextContainer = this.scene.add.container(padding * 2, height / 2);
//         container.add(statsTextContainer);

//         const textStyle = { fontSize: '22px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text };
        
//         this.statsLabels.total = this.scene.add.text(0, -25, `মোট প্রশ্ন: ${toBangla(0)}/${toBangla(this.numQuestions)}`, textStyle).setOrigin(0, 0.5);
//         this.statsLabels.correct = this.scene.add.text(0, 25, `সঠিক: ${toBangla(0)}`, textStyle).setOrigin(0, 0.5);
//         this.statsLabels.incorrect = this.scene.add.text(200, 25, `ভুল: ${toBangla(0)}`, textStyle).setOrigin(0, 0.5);
//         this.statsLabels.remaining = this.scene.add.text(200, -25, `বাকি আছে: ${toBangla(this.numQuestions)}`, textStyle).setOrigin(0, 0.5);

//         statsTextContainer.add(Object.values(this.statsLabels));
        
//         this.skillContainer = this.scene.add.container(width - padding * 2, height / 2);
//         container.add(this.skillContainer);
//         this.createSkillIndicator();
//     }
createTopPanel(container) {
    const { width, height } = container;
    const padding = 20;

    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.7);
    panelBg.fillRoundedRect(padding / 2, padding / 2, width - padding, height - padding, 20);
    panelBg.lineStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 0.8);
    panelBg.strokeRoundedRect(padding / 2, padding / 2, width - padding, height - padding, 20);
    container.add(panelBg);
    
    // --- KIDS FRIENDLY: One line, colorful, big icons ---
    const statsTextContainer = this.scene.add.container(padding * 2, height / 2);
    container.add(statsTextContainer);

    const textStyle = { 
        fontSize: '28px', 
        fontFamily: '"Noto Sans Bengali", sans-serif', 
        fill: '#FFD700', // GOLDEN COLOR kids love!
        fontStyle: 'bold',
        stroke: '#FF6B35', // ORANGE STROKE
        strokeThickness: 3
    };
    
    // ONE LINE: প্রশ্ন | সঠিক | ভুল
    this.statsLabels.total = this.scene.add.text(0, 0, `প্রশ্ন: ${toBangla(0)}`, textStyle).setOrigin(0, 0.5);
    this.statsLabels.correct = this.scene.add.text(140, 0, `সঠিক: ${toBangla(0)}`, textStyle).setOrigin(0, 0.5);
    this.statsLabels.incorrect = this.scene.add.text(280, 0, `ভুল: ${toBangla(0)}`, textStyle).setOrigin(0, 0.5);

    statsTextContainer.add([this.statsLabels.total, this.statsLabels.correct, this.statsLabels.incorrect]);
    
    // --- FIXED: Skill indicator position (CENTER RIGHT) ---
    this.skillContainer = this.scene.add.container(width - 200, height / 2); // MOVED LEFT 200px
    container.add(this.skillContainer);
    this.createSkillIndicator();
}
updateStats() {
    const incorrectCount = this.gameState.questionCount - this.gameState.correctCount;
    
    // FIXED: Show tried/totalRequired (not totalQuestionsTarget)
    this.statsLabels.total.setText(`প্রশ্ন: ${toBangla(this.gameState.questionCount)}/${toBangla(this.requiredQuestions)}`);
    this.statsLabels.correct.setText(`সঠিক: ${toBangla(this.gameState.correctCount)}`);
    this.statsLabels.incorrect.setText(`ভুল: ${toBangla(incorrectCount)}`);
}
    createMultiplicationGrid(container) {
        const gridLineColor = 0x666666;
        const maxHeader = Math.max(this.tableToPractice, 10);
        const numCols = maxHeader + 1;
        const numRows = 11; // Always 1-10 + header row

        // --- MODIFIED: Cell size calculation for full width ---
        const padding = 20; // Padding on the left/right of the grid
        const availableWidth = container.width - (2 * padding);
        const availableHeight = container.height - padding; // Padding on top/bottom
        const cellSize = Math.min(availableWidth / numCols, availableHeight / numRows);

        const actualGridWidth = numCols * cellSize;
        const actualGridHeight = numRows * cellSize;

        const gridDisplayContainer = this.scene.add.container(
            (container.width - actualGridWidth) / 2,
            (container.height - actualGridHeight) / 2
        );
        gridDisplayContainer.setDepth(10);
        container.add(gridDisplayContainer);
        this.createdObjects.push(gridDisplayContainer);

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
                cell.setDataEnabled();
                gridDisplayContainer.add(cell);

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
                            if (gameState.gameActive) this.checkAnswer(cell.getData('value'),false);
                        });
                }
                cell.setDepth(1);
            }
        }
        
        this.hoverOverlayContainer = this.scene.add.container(0, 0);
        this.hoverOverlayContainer.setDepth(100).setVisible(true).setAlpha(1);;
        gridDisplayContainer.add(this.hoverOverlayContainer);
    }
    
    highlightGridCross(row, col, cellSize) {
        this.clearGridCrossHighlights();

        const rowHeader = this.gridElements.rowHeaders[row];
        const colHeader = this.gridElements.colHeaders[col];

        if (!rowHeader || !colHeader) return;

        if (rowHeader) rowHeader.first.postFX.addGlow(0xffffff, 2);
        if (colHeader) colHeader.first.postFX.addGlow(0xffffff, 2);

        const rowHeaderColor = rowHeader ? rowHeader.first.fillColor : 0xFF0000;
        const colHeaderColor = colHeader ? colHeader.first.fillColor : 0x00FF00;

        if (this.gridElements.cells.length === 0) return;

        this.gridElements.cells.forEach(cell => {
            const cellData = {
                isCell: cell.getData('isCell'),
                row: cell.getData('row'),
                col: cell.getData('col')
            };
            
            if (!cellData.isCell || cellData.row === undefined || cellData.col === undefined) return;

            let overlayColor = null;
            let alpha = 0.3;

            const isInRowSegment = (cellData.row === row && cellData.col <= col);
            const isInColSegment = (cellData.col === col && cellData.row <= row);

            if (isInRowSegment) overlayColor = rowHeaderColor;
            if (isInColSegment) overlayColor = colHeaderColor;
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
    const barWidth = 180;
    const barHeight = 30;
    const padding = 10;
    
    // PINK HEART BG (with EXTRA padding)
    const bg = this.scene.add.rectangle(0, 0, barWidth + padding*2 + 10, barHeight + padding*2, 0xFF69B4).setOrigin(0.5);
    
    // FIXED: Green bar STARTS INSIDE bounds
    this.skillBar = this.scene.add.rectangle(-90, 0, 0, barHeight, 0x00FF00).setOrigin(0, 0.5);
    
    // GOLDEN FRAME (perfect fit)
    const frame = this.scene.add.rectangle(0, 0, barWidth, barHeight)
        .setOrigin(0.5)
        .setStrokeStyle(4, 0xFFD700, 1);
    
    // FUN STAR TEXT
    this.skillText = this.scene.add.text(0, barHeight + 8, `দক্ষতা ⭐ ${toBangla(0)}%`, { 
        fontSize: '22px', 
        fill: '#FF1493',
        fontStyle: 'bold',
        stroke: '#FFD700',
        strokeThickness: 2
    }).setOrigin(0.5);
    
    this.skillContainer.add([bg, this.skillBar, frame, this.skillText]);
}
  updateSkillIndicator() {
    const correctCount = this.last20Attempts.filter(Boolean).length;
    const totalAttempts = this.last20Attempts.length > 0 ? this.last20Attempts.length : 1;
    this.skillPercent = Math.floor((correctCount / totalAttempts) * 100);
    
    // FIXED: Use CORRECT barWidth (180) - WAS 300!
    this.scene.tweens.add({ 
        targets: this.skillBar, 
        width: 180 * (this.skillPercent / 100), 
        duration: 300, 
        ease: 'Power2' 
    });
    
    // FIXED: Add STAR emoji back
    this.skillText.setText(`দক্ষতা ⭐ ${toBangla(this.skillPercent)}%`);
    
    if (this.skillPercent === 100 && this.last20Attempts.length >= 20) {
        this.showCongratulation();
    }
}
    showCongratulation() {
        // Position congrats text relative to the qaContainer
        const congratsText = this.scene.add.text(this.qaContainer.width / 2, -15, "দারুণ! আপনি এই নামতায় দক্ষ হয়ে উঠেছেন!", {
            fontSize: '22px', fill: config.colors.correct, fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.qaContainer.add(congratsText);
        this.scene.tweens.add({ targets: congratsText, alpha: 0, y: '-=20', duration: 3000, ease: 'Power1', onComplete: () => congratsText.destroy() });
    }

    generateQuestionData() {
        const b = this.tableToPractice; // 'b' is the column (the multiplication table number)
        let a; // 'a' will be the row (1-10)

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
                 const switchText = this.scene.add.text(this.qaContainer.width / 2, this.qaContainer.height / 2, "খুব ভালো! এখন প্রশ্নগুলো এলোমেলোভাবে আসবে।", {
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
        // Clear only the qaContainer, leave the grid intact
        this.qaContainer.each(child => {
            // Don't destroy the skill indicator container, just its content if needed, but it updates itself.
            if (child !== this.skillContainer) {
                child.destroy();
            }
        });

        this.updateStats();
        this.updateSkillIndicator();
        this.questionData = this.generateQuestionData();
        gameState.gameActive = true;
        const { a, b, target } = this.questionData;
        gameState.currentA = a;
        gameState.currentB = b;
        gameState.currentAnswer = target;

        // --- REDESIGNED QA LAYOUT ---
        // Center position in the bottom container
        const centerX = this.qaContainer.width / 2;
        const centerY = (this.qaContainer.height - 50) / 2 + 50; // Offset for skill bar

        // The visualization is created but invisible
        this.vizContainer = this.scene.add.container(0, 0);
        this.gridContainer.add(this.vizContainer); // Add to grid container for positioning
       // this.createVisualization(this.vizContainer, a, b);
        //this.vizContainer.setVisible(false);
        
        // Question text and options are now in a single horizontal line
        const qText = this.scene.add.text(centerX - 150, centerY, `${toBangla(a)} × ${toBangla(b)} = ?`, {
            fontSize: '48px', // Smaller
            fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.qaContainer.add(qText);
        
        this.optionsContainer = this.scene.add.container(centerX + 180, centerY);
        this.qaContainer.add(this.optionsContainer);

        const options = this.generateOptions(target);
        const optionColors = shuffle([config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4]);
        
        // Smaller buttons and tighter spacing
        const buttonWidth = 100, buttonHeight = 65, spacing = 15;
        const totalButtonWidth = (options.length * buttonWidth) + ((options.length - 1) * spacing);
        const startX = -(totalButtonWidth / 2) + buttonWidth / 2;

        options.forEach((opt, index) => {
            const x = startX + index * (buttonWidth + spacing);
            const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, Phaser.Display.Color.HexStringToColor(optionColors[index]).color)
                .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color).setOrigin(0.5);
            const buttonText = this.scene.add.text(0, 0, toBangla(opt), { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
            const button = this.scene.add.container(x, 0, [buttonBg, buttonText]).setSize(buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });
            
            button.answerValue = opt;
            this.optionsContainer.add(button);

            button.on('pointerdown', () => { this.scene.sound.play('button-click'); this.checkAnswer(opt); });
            button.on('pointerover', () => { this.scene.sound.play('button-hover', { volume: 0.7 }); this.scene.tweens.add({ targets: button, scale: 1.05, duration: 150 }); });
            button.on('pointerout', () => this.scene.tweens.add({ targets: button, scale: 1, duration: 150 }));
        });

        this.highlightOptionsInGrid(options, optionColors);
    }

    createVisualization(container, numGroups, itemsPerGroup) {
        // This is based on the gridContainer's size now
        const itemIndex = rand(0, config.assets.count - 1);
        const colors = [0xEAF2F8, 0xEBF5FB, 0xF4ECF7, 0xFDEDEC, 0xFEF9E7, 0xFEF5E7];
        const contentW = this.gridContainer.width * 0.9, contentH = this.gridContainer.height * 0.9;
        const cols = Math.min(numGroups, 5), rows = Math.ceil(numGroups / cols);
        const spacing = 15;
        const groupSize = Math.min((contentW - (cols - 1) * spacing) / cols, (contentH - (rows - 1) * spacing) / rows);
        const totalGridW = cols * groupSize + (cols - 1) * spacing;
        const totalGridH = rows * groupSize + (rows - 1) * spacing;
        const startX = (this.gridContainer.width - totalGridW) / 2;
        const startY = (this.gridContainer.height - totalGridH) / 2;

        const panelPadding = 20;
        const panelX = startX - panelPadding / 2;
        const panelY = startY - panelPadding / 2;
        const panelWidth = totalGridW + panelPadding;
        const panelHeight = totalGridH + panelPadding;

        const backPanel = this.scene.add.graphics();
           const panelFillColor = Phaser.Display.Color.HexStringToColor(config.colors.panel).color;
    const panelBorderColor = Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color;

    backPanel.fillStyle(panelFillColor, 0.9); // Used the new numerical color
    backPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
    backPanel.lineStyle(4, panelBorderColor, 1); // Used the new numerical color and increased thickness/alpha
    backPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
    container.add(backPanel);


        
        for (let i = 0; i < numGroups; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const gx = startX + col * (groupSize + spacing), gy = startY + row * (groupSize + spacing);
            const groupContainer = this.scene.add.container(gx, gy);
            container.add(groupContainer);
            const bg = this.scene.add.rectangle(0, 0, groupSize, groupSize, shuffle(colors)[0]).setOrigin(0).setStrokeStyle(2, 0xcccccc);
            groupContainer.add(bg);
            const labelText = this.scene.add.text(
            groupSize/2,  // 10px from left
            0,  // 10px from top
            toBangla(i + 1),  // ১, ২, ৩, etc.
            {
                fontSize: `${groupSize * 0.1}px`,  // 25% of group size
                fontFamily: '"Noto Sans Bengali", sans-serif',
                fill: '#333333',
                fontStyle: 'bold'
            }
        ).setOrigin(0, 0);  // Top-left alignment
        
        groupContainer.add(labelText);

            groupContainer.setAlpha(0);
            this.addItemsToGroup(groupContainer, itemsPerGroup, groupSize, itemIndex);
        }
        return groupSize;
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

   checkAnswer(selected, animate=true) {
    if (!gameState.gameActive) return;
    
    const correct = selected === gameState.currentAnswer;
    this.gameState.questionCount++;
    this.questionsAnswered++;

    if (correct) {
        this.gameState.correctCount++; // Correctly increment score
        this.questionsSinceLastError++;
        
        if (!this.isRepeatingQuestion) {
            gameState.gameActive = false; // Disable input during animation

            this.last20Attempts.push(true);
            if (this.last20Attempts.length > 20) this.last20Attempts.shift();

            if (this.questionOrderMode === 'sequential') {
                this.sequentialQuestionsAnswered.add(gameState.currentA);
            }
            
            this.updateSkillIndicator();
            this.updateStats();

            this.callbacks.onCorrect(0, "সঠিক!");
            this.playSuccessAnimation(animate);
        } else { 
            this.isRepeatingQuestion = false;
            // Also track corrected mistakes in skill
            this.last20Attempts.push(true); 
            if (this.last20Attempts.length > 20) this.last20Attempts.shift();

            this.updateSkillIndicator();
            this.updateStats(); 
            this.callbacks.onCorrect(0, "এবার সঠিক হয়েছে!");
            this.playSuccessAnimation(animate);
        }
    } else { 
        this.last20Attempts.push(false);
        if (this.last20Attempts.length > 20) this.last20Attempts.shift();

        this.isRepeatingQuestion = true;
        this.questionsSinceLastError = 0;

        if (this.questionOrderMode === 'random') {
            this.problematicQuestions.push(this.questionData);
        }
        
        if (this.questionsAnswered < this.requiredQuestions) {
            this.requiredQuestions += 3;
        }
        this.updateSkillIndicator();
        this.updateStats(); 
        this.callbacks.onIncorrect(0, "ভুল! আবার চেষ্টা করুন।");
        
        this.scene.sound.play('button-shake');

        const selectedButton = this.optionsContainer.getAll().find(b => b.answerValue === selected);
        if (selectedButton) this.scene.tweens.add({ targets: selectedButton, x: '+=10', yoyo: true, duration: 50, repeat: 4 });
        
        const selectedCell = this.gridElements.cells.find(c => c.getData('value') === selected);
        if (selectedCell) this.scene.tweens.add({ targets: selectedCell, angle: 5, yoyo: true, duration: 60, repeat: 3 });
    }
}
checkGameCompletion() {
    // Check sustained 90% accuracy over last 20 attempts
    if (this.last20Attempts.length >= 20) {
        const recentCorrect = this.last20Attempts.filter(Boolean).length;
        const sustainedAccuracy = (recentCorrect / 20) * 100;
        
        if (sustainedAccuracy >= 90) {
            this.sustained90Percent = true;
            // GAME COMPLETE! Show celebration with safety check
            this.scene.time.delayedCall(1000, () => {
                if (this.callbacks && typeof this.callbacks.onComplete === 'function') {
                    this.callbacks.onComplete(100, "🎉 দারুণ! আপনি নামতায় দক্ষ হয়েছেন! 🎉");
                } else {
                    // Fallback: Show completion message in-game
                    const congratsText = this.scene.add.text(
                        this.qaContainer.width / 2, 
                        this.qaContainer.height / 2, 
                        "🎉 দারুণ! আপনি নামতায় দক্ষ হয়েছেন! 🎉", 
                        {
                            fontSize: '28px', 
                            fill: config.colors.correct, 
                            fontStyle: 'bold', 
                            backgroundColor: 'rgba(0,0,0,0.7)', 
                            padding: { x: 15, y: 10 }
                        }
                    ).setOrigin(0.5);
                    this.qaContainer.add(congratsText);
                    this.scene.tweens.add({ 
                        targets: congratsText, 
                        alpha: 0, 
                        y: '-=20', 
                        duration: 3000, 
                        ease: 'Power1', 
                        onComplete: () => congratsText.destroy() 
                    });
                }
            });
            return true;
        }
    }
    
    // Continue if not complete
    if (this.questionsAnswered < this.requiredQuestions && !this.sustained90Percent) {
        return false;
    }
    
    return true;
}
    skipSuccessAnimation() {
        if (this.isSkipping) return; // Prevent multiple clicks
        this.isSkipping = true;

        // Stop all tracked tweens and timers
        this.activeAnimations.forEach(anim => {
            if (anim.stop) anim.stop();
            if (anim.remove) anim.remove();
            if (anim.destroy && anim.scene) anim.destroy();
        });
        this.activeAnimations = [];

        // Clean up the main visualization container if it exists
        if (this.vizContainer && this.vizContainer.scene) {
            this.vizContainer.destroy();
            this.vizContainer = null;
        }

        // Immediately transition to the next question
        this.transitionToNext();
    }

playSuccessAnimation(animate=true) {
    this.isSkipping = false;
    
    this.scene.sound.play('applause', { volume: 0.6 });
    const { a, b, target } = this.questionData;

    // --- PART 1: ARROW & PARTICLE ANIMATION (Unchanged) ---
    const correctCell = this.gridElements.cells.find(c => c.getData('value') === target && c.getData('row') === a && c.getData('col') === b);
    const rowHeader = this.gridElements.rowHeaders[a];
    const colHeader = this.gridElements.colHeaders[b];

    if (!correctCell || !rowHeader || !colHeader) {
        console.warn("Could not find all grid elements. Skipping to visualization.");
        // Fallback: Start visualization from the center of the grid if arrows fail
        const fallbackOrigin = { x: this.gridContainer.width / 2, y: this.gridContainer.height / 2 };
        this.scene.time.delayedCall(500, () => this.startVisualizationAnimation(a, b, target, fallbackOrigin));
        return;
    }

    const cellMatrix = correctCell.getWorldTransformMatrix();
    const finalCellPos = this.gridContainer.getLocalPoint(cellMatrix.tx, cellMatrix.ty);

    // No changes to arrow logic, it will run as before...
    // ... (arrow creation and animation code remains here) ...
        const rowHeaderMatrix = rowHeader.getWorldTransformMatrix();
    const colHeaderMatrix = colHeader.getWorldTransformMatrix();
    const finalRowHeaderPos = this.gridContainer.getLocalPoint(rowHeaderMatrix.tx - rowHeader.width * 0.5, rowHeaderMatrix.ty);
    const finalColHeaderPos = this.gridContainer.getLocalPoint(colHeaderMatrix.tx, colHeaderMatrix.ty - colHeader.height * 0.5);

    const createAndAnimateArrow = (startX, startY, endX, endY) => {
        const arrowScale = 0.2;
        const arrowContainer = this.scene.add.container(startX, startY).setDepth(150);
        this.gridContainer.add(arrowContainer);
        const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
        const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        arrowContainer.setRotation(angle);
        const start = this.scene.add.image(0, 0, 'green-arrow-start').setOrigin(0, 0.5).setScale(arrowScale);
        const mid = this.scene.add.image(start.displayWidth, 0, 'green-arrow-mid').setOrigin(0, 0.5).setScale(arrowScale);
        const point = this.scene.add.image(start.displayWidth, 0, 'green-arrow-point').setOrigin(0, 0.5).setScale(arrowScale);
        arrowContainer.add([start, mid, point]);
        arrowContainer.setBlendMode(Phaser.BlendModes.ADD);
        const requiredMidWidth = distance - start.displayWidth - point.displayWidth;
        mid.displayWidth = 0;
        this.scene.tweens.add({
            targets: mid, displayWidth: requiredMidWidth > 0 ? requiredMidWidth : 0, duration: 500, ease: 'Sine.easeInOut',
            onUpdate: () => { point.x = start.displayWidth + mid.displayWidth; },
            onComplete: () => { this.scene.tweens.add({ targets: arrowContainer, alpha: 0, duration: 400, delay: 800, onComplete: () => arrowContainer.destroy() }); }
        });
    };

    createAndAnimateArrow(finalRowHeaderPos.x, finalRowHeaderPos.y, finalCellPos.x, finalCellPos.y);
    this.scene.time.delayedCall(150, () => {
        createAndAnimateArrow(finalColHeaderPos.x, finalColHeaderPos.y, finalCellPos.x, finalCellPos.y);
    });

    this.scene.time.delayedCall(600, () => {
        const emitter = this.scene.add.particles(finalCellPos.x, finalCellPos.y, 'particle', {
            speed: { min: 100, max: 250 }, lifespan: 900, scale: { start: 1.2, end: 0 },
            blendMode: 'ADD', emitting: false,
            emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 45), quantity: 40 }
        }).setDepth(160);
        this.gridContainer.add(emitter);
        emitter.explode(40);
        this.scene.time.delayedCall(1200, () => emitter.destroy());
    });
    
    // --- MODIFICATION: Pass the explosion position to the next function ---
    if (animate)
    {
    this.scene.time.delayedCall(1000, () => {
        this.startVisualizationAnimation(a, b, target, finalCellPos);
    });
}
else 
{
      
                            if (this.vizContainer) this.vizContainer.destroy();
                            this.vizContainer = null;
                            this.transitionToNext();
}
}

startVisualizationAnimation(a, b, target, explosionOrigin) {
    const itemsPerGroup = b;

    // --- SETUP ---
    this.vizContainer = this.scene.add.container(0, 0).setDepth(200);
    this.gridContainer.add(this.vizContainer);

    const groupSize = this.createVisualization(this.vizContainer, a, b);
    const groups = this.vizContainer.list.filter(item => item instanceof Phaser.GameObjects.Container);
    const backPanel = this.vizContainer.list.find(item => item instanceof Phaser.GameObjects.Graphics);

    if (groups.length === 0) {
        console.error("Visualization created no groups.");
        this.transitionToNext();
        return;
    }

    const vizCenterX = this.gridContainer.width / 2;
    const vizCenterY = this.gridContainer.height / 2;
 const groupOne = groups[0];

        const groupCenterX = groupOne.x + groupSize / 2;
        const groupBottomY = groupOne.y + groupSize + 40;


    const runningTotalText = this.scene.add.text(
        groupCenterX, groupBottomY, toBangla(0), {
            fontSize: '80px', fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: '#fff', stroke: '#333', strokeThickness: 6
        }
    ).setOrigin(0.5).setAlpha(0);
    this.scene.add.existing(runningTotalText);
   



    const animateNextGroup = (index) => {
        // BASE CASE: If we've animated all groups, start the final transformation.
          if (index >= groups.length) {
            // --- THE DEFINITIVE TRANSFORMATION TWEEN ---
            const finalScale = 200 / 80;
            const finalCenterX = this.qaContainer.x + this.qaContainer.width / 2;
            const finalCenterY = this.qaContainer.y + this.qaContainer.height / 2;

            runningTotalText.setDepth(1000);

            // --- SETUP FOR onUpdate INTERPOLATION ---
            // Define our color stops as Phaser Color objects for easy interpolation
            const colorStops = {
                start: Phaser.Display.Color.ValueToColor('#ffffff'), // From current white
                c1: Phaser.Display.Color.ValueToColor('#FEE12B'),    // Yellow
                c2: Phaser.Display.Color.ValueToColor('#F58D3D'),    // Orange
                c3: Phaser.Display.Color.ValueToColor('#F04E51')     // Red
            };
            const strokeStartColor = Phaser.Display.Color.ValueToColor('#333333');
            const strokeEndColor = Phaser.Display.Color.ValueToColor('#FFFFFF');

            // The main tween for position and scale. We'll hook into its onUpdate.
            this.scene.tweens.add({
                targets: runningTotalText,
                x: finalCenterX,
                y: finalCenterY,
                scale: finalScale,
                delay: 500,
                duration: 1500,
                ease: 'Cubic.easeOut',

                // THIS IS THE KEY: We use onUpdate to manually control the styles
                onUpdate: (tween) => {
                    // tween.progress is a value from 0 (start) to 1 (end)
                    const progress = tween.progress;

                    // 1. Interpolate Stroke Thickness (from 6 to 12)
                    const currentStrokeThickness = Phaser.Math.Interpolation.Linear([6, 12], progress);

                    // 2. Interpolate Stroke Color (from dark to white)
                    const newStrokeColor = Phaser.Display.Color.Interpolate.ColorWithColor(strokeStartColor, strokeEndColor, 1, progress);
                    const strokeHex = Phaser.Display.Color.RGBToString(newStrokeColor.r, newStrokeColor.g, newStrokeColor.b);

                    // Apply the interpolated stroke
                    runningTotalText.setStroke(strokeHex, currentStrokeThickness);

                    // 3. Interpolate Fill Color through multiple stops
                    let currentFillColor;
                    if (progress <= 0.33) { // Phase 1: White to Yellow
                        currentFillColor = Phaser.Display.Color.Interpolate.ColorWithColor(colorStops.start, colorStops.c1, 1, progress / 0.33);
                    } else if (progress <= 0.66) { // Phase 2: Yellow to Orange
                        currentFillColor = Phaser.Display.Color.Interpolate.ColorWithColor(colorStops.c1, colorStops.c2, 1, (progress - 0.33) / 0.33);
                    } else { // Phase 3: Orange to Red
                        currentFillColor = Phaser.Display.Color.Interpolate.ColorWithColor(colorStops.c2, colorStops.c3, 1, (progress - 0.66) / 0.34);
                    }
                    const fillHex = Phaser.Display.Color.RGBToString(currentFillColor.r, currentFillColor.g, currentFillColor.b);

                    // Apply the interpolated fill color
                    runningTotalText.setColor(fillHex);
                },

                onComplete: () => {
                    // --- FINAL FLOURISH ---
                    // Apply the true gradient and other final styles. The color will already match.
                    const gradient = runningTotalText.context.createLinearGradient(0, 0, 0, runningTotalText.height);
                    gradient.addColorStop(0, '#FEE12B');
                    gradient.addColorStop(0.5, '#F58D3D');
                    gradient.addColorStop(1, '#F04E51');
                    runningTotalText.setFill(gradient);
                    runningTotalText.setFontStyle('bold');
                    runningTotalText.setShadow(2, 2, '#333333', 2, true, true);

                    // Final pause and fade out
                    this.scene.tweens.add({
                        targets: [runningTotalText, this.vizContainer],
                        alpha: 0,
                        duration: 500,
                        delay: 800,
                        onComplete: () => {
                            runningTotalText.destroy();
                            if (this.vizContainer) this.vizContainer.destroy();
                            this.vizContainer = null;
                            this.transitionToNext();
                        }
                    });
                }
            });
            return;
        }



        // --- RECURSIVE STEP (Unchanged): Animate the current group ---
        const group = groups[index];
        const currentTotal = (index + 1) * itemsPerGroup;
        const groupCenterX = group.x + groupSize / 2;
        const groupBottomY = group.y + groupSize + 40;

        // Sequence: Group appears -> Total travels -> "+N" appears -> Total updates -> Pause -> Recurse
        this.scene.tweens.add({
            targets: group,
            alpha: { from: 0, to: 1 }, scale: { from: 0.5, to: 1 },
            duration: 200, ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: runningTotalText,
                    x: groupCenterX, y: groupBottomY,
                    duration: 200, ease: 'Cubic.easeInOut',
                    onComplete: () => {
                        const additionText = this.scene.add.text(
                            groupCenterX, group.y + groupSize / 2, `+${toBangla(itemsPerGroup)}`, {
                                fontSize: '60px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#00ff00',
                                stroke: '#ffffff', strokeThickness: 4
                            }
                        ).setOrigin(0.5).setAlpha(0).setScale(0.5);
                        this.vizContainer.add(additionText);

                        this.scene.tweens.add({
                            targets: additionText,
                            alpha: 1, scale: 1, y: '-=80',
                            duration: 200, ease: 'Back.easeOut',
                            onComplete: () => {
                                runningTotalText.setText(toBangla(currentTotal));
                                this.scene.tweens.add({
                                   targets: runningTotalText, scale: 1.25, yoyo: true, duration: 250, ease: 'Quad.easeInOut'
                                });

                                this.scene.tweens.add({
                                    targets: additionText, alpha: 0, duration: 300, delay: 200,
                                    onComplete: () => {
                                        additionText.destroy();
                                        this.scene.time.delayedCall(100, () => {
                                            animateNextGroup(index + 1);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };

    // --- KICK OFF THE ANIMATION (Unchanged) ---
    if (backPanel) {
        backPanel.setPosition(explosionOrigin.x, explosionOrigin.y).setScale(0);
        this.scene.tweens.add({
            targets: backPanel,
            x: 0, y: 0, scale: 1,
            duration: 600, ease: 'Cubic.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: runningTotalText, alpha: 1, duration: 400, ease: 'Sine.easeOut',
                    onComplete: () => {
                        this.scene.time.delayedCall(300, () => {
                             animateNextGroup(0);
                        });
                    }
                });
            }
        });
    } else {
        animateNextGroup(0);
    }
}
  
transitionToNext() {
    // Check if game should end
    if (this.checkGameCompletion() || this.questionsAnswered >= this.requiredQuestions) {
        this.scene.time.delayedCall(500, () => {
            if (this.callbacks && typeof this.callbacks.onComplete === 'function') {
                this.callbacks.onComplete(100, "🎉 অভিনন্দন! নামতা শেখা সম্পন্ন! 🎉");
            } else {
                // Fallback: Show completion message in-game
                const congratsText = this.scene.add.text(
                    this.qaContainer.width / 2, 
                    this.qaContainer.height / 2, 
                    "🎉 অভিনন্দন! নামতা শেখা সম্পন্ন! 🎉", 
                    {
                        fontSize: '28px', 
                        fill: config.colors.correct, 
                        fontStyle: 'bold', 
                        backgroundColor: 'rgba(0,0,0,0.7)', 
                        padding: { x: 15, y: 10 }
                    }
                ).setOrigin(0.5);
                this.qaContainer.add(congratsText);
                this.scene.tweens.add({ 
                    targets: congratsText, 
                    alpha: 0, 
                    y: '-=20', 
                    duration: 3000, 
                    ease: 'Power1', 
                    onComplete: () => congratsText.destroy() 
                });
            }
        });
        return;
    }
    
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
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.createdObjects.forEach(obj => { if (obj && obj.scene) obj.destroy(); });
        this.createdObjects = [];
    }
}

export { PracticeQuestion };