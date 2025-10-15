// js/scenes/GameScene.js
import { gameState } from '../gameState.js';
import { config } from '../config.js';
import { toBangla } from '../utils.js';
import { startStage, endStage } from '../game.js'; // Ensure endStage is imported

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.UiDepth=300;
    }

    create(data) {
        // --- 1. Responsive Layout Setup ---
        const { width, height } = this.scale;
        const padding = Math.min(width, height) * 0.02; // SafeArea padding

        // Define responsive UI region heights
        const headerHeight = height * 0.12;
        const footerHeight = height * 0.10;
        const qaHeight = height - headerHeight - footerHeight;

        // --- Background ---
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[0]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[0]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[1]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[1]).color,
            1
        );
        graphics.fillRect(0, 0, width, height);

        // --- Initialize Game State ---
        gameState.currentStage = data.stage || gameState.currentStage || 1;
        gameState.currentLevel = data.level || gameState.currentLevel || 1;
        gameState.mode = data.mode || gameState.mode || 'stage';

        // --- 2. Header Redesign ---
        this.headerContainer = this.add.container(0, 0).setDepth(200);

        // Title Label (Left Aligned)
        this.titleLabel = this.add.text(
            padding,
            headerHeight *.2,
            `লেভেল ${toBangla(gameState.currentLevel)}: স্টেজ ${toBangla(gameState.currentStage)}`, {
                fontSize: '30px',
                 fontFamily: '"Noto Sans Bengali", sans-serif', 
                fill: config.colors.text,
                fontStyle: 'bold',
                stroke: config.colors.textOutline,
                strokeThickness: 2
            }
        ).setOrigin(0, 0);
        this.headerContainer.add(this.titleLabel);

        // Score Label (Right of Title)
        this.scoreLabel = this.add.text(
            width-(width / 4),
            headerHeight * 0.25,
            `স্কোর: ${toBangla(gameState.score)}`, {
                fontSize: '28px',
                 fontFamily: '"Noto Sans Bengali", sans-serif', 
                fill: config.colors.text,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5, 0.5);
        this.headerContainer.add(this.scoreLabel);

        // Stats Panel (Below Score)
        this.createStatsPanel(padding, headerHeight * 0.60);


        // --- 3. Footer Section ---
        this.footerContainer = this.add.container(0, height - footerHeight).setDepth(this.UiDepth);

        // Stop Button (Right Aligned)
        this.stopButton = this.add.text(
            width - padding,
            footerHeight / 2,
            'X', {
                fontSize: '40px',
                fill: 'white',
                 fontFamily: '"Noto Sans Bengali", sans-serif', 
                backgroundColor: config.colors.stopButton,
                padding: { left: 15, right: 15, top: 5, bottom: 5 },
                align: 'center'
            }
        ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.stopButton.on('pointerdown', () => {
            gameState.gameActive = false;
            if (this.masterStopwatch) this.masterStopwatch.remove();
            gameState.performanceTracker.saveToLocal();
            // Reset core stats
            gameState.score = 0;
            gameState.streak = 0;
            gameState.timeLimit = config.initialTimeLimit;
            this.scene.start('StartScreenScene');
        });
        this.footerContainer.add(this.stopButton);

        // Feedback Label (Center Aligned)
        this.feedbackLabel = this.add.text(
            width / 2,
            footerHeight / 2,
            'সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন', {
                fontSize: '24px',
                 fontFamily: '"Noto Sans Bengali", sans-serif', 
                fill: config.colors.text
            }
        ).setOrigin(0.5, 0.5);
        this.footerContainer.add(this.feedbackLabel);

        // --- 4. Help Button ---
        this.helpButton = this.add.text(padding, padding, '?', {
            fontSize: '24px',
             fontFamily: '"Noto Sans Bengali", sans-serif', 
            fill: config.colors.text,
            backgroundColor: config.colors.option1,
            padding: { left: 12, right: 12, top: 6, bottom: 6 }
        }).setOrigin(0, 0).setInteractive({ useHandCursor: true }).setDepth(201);

        this.helpButton.on('pointerdown', () => {
            this.showHelpModal();
        });

        this.footerContainer.add(this.helpButton);


        // --- 5. QA Region ---
        this.qaRegion = this.add.container(0, headerHeight).setSize(width, qaHeight);


        // --- 6. Start Game Logic & Timers ---
        // Stopwatch UI is created here, but logic starts after startStage sets the time limit
        if (gameState.timingModel === 'per-set') {
            const stopwatchWidth = width * 0.25;
            const stopwatchHeight = headerHeight * 0.8;
            this.stopwatchUI = this.createStopwatchUI(width - padding, headerHeight / 2, stopwatchWidth, stopwatchHeight);
            this.stopwatchUI.container.setOrigin(1, 0.5); // Align to the right
            this.headerContainer.add(this.stopwatchUI.container);
        }

        startStage(
            this,
            gameState.mode,
            gameState.currentLevel,
            data.allowedTables || gameState.controller.levels[gameState.currentLevel - 1] || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        );

        // Now that gameState.timeLimit is set, create the timer logic
        if (gameState.timingModel === 'per-set' && this.stopwatchUI) {
            this.setupPerSetTimer(gameState.timeLimit, this.stopwatchUI);
            if (this.masterStopwatch) {
                this.masterStopwatch.start();
            }
        }
    }

    createStatsPanel(x, y) {
        const panelWidth = 400;
        const panelHeight = 30;

        this.statsContainer = this.add.container(x, y);
        this.headerContainer.add( this.statsContainer);

        const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, Phaser.Display.Color.HexStringToColor(config.colors.panel).color)
            .setOrigin(0,0)
            .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color);
            panelBg.setAlpha(0.8);
        this.statsContainer.add(panelBg);

        this.statsLabels = {
            question: this.add.text(20, panelHeight/2, `প্রশ্ন: ${toBangla(gameState.questionCount)}`, { fontSize: '18px',  fontFamily: '"Noto Sans Bengali", sans-serif',  fill: config.colors.text }).setOrigin(0,0.5 ),
            correct: this.add.text(100, panelHeight/2, `সঠিক: ${toBangla(gameState.correctCount)}`, { fontSize: '18px', fontFamily: '"Noto Sans Bengali", sans-serif',  fill: config.colors.text }).setOrigin(0, 0.5),
            incorrect: this.add.text(200, panelHeight/2, `ভুল: ${toBangla(gameState.questionCount - gameState.correctCount)}`, { fontSize: '18px', fontFamily: '"Noto Sans Bengali", sans-serif',  fill: config.colors.text }).setOrigin(0, 0.5),
            bonus: this.add.text(305, panelHeight/2, `বোনাস: ${toBangla(gameState.streak * config.points.streakBonus)}`, { fontSize: '18px',   fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text }).setOrigin(0, 0.5)
        };
        this.statsContainer.add(Object.values(this.statsLabels));
    }


    showHelpModal() {
        const { width, height } = this.scale;
        const modalWidth = Math.min(width * 0.8, 600);
        const modalHeight = Math.min(height * 0.8, 450);

        const defaultHelpText = "গুণের অভিযানে স্বাগতম!\n\n" +
            "কীভাবে খেলবেন:\n" + "১. একটি লেভেল এবং স্টেজ বা প্র্যাকটিস মোড বাছাই করুন।\n" +
            "২. গুণের প্রশ্নের উত্তর বাছাই করুন বা কীবোর্ডে টাইপ করে এন্টার চাপুন।\n" +
            "৩. সঠিক উত্তরের জন্য ১০ পয়েন্ট এবং পরপর সঠিক উত্তরে বোনাস পয়েন্ট পান।\n" +
            "৪. ভুল উত্তরে ৫ পয়েন্ট হারান।\n" +
            "৫. স্টেজ মোডে ২০টি প্রশ্নের মধ্যে ৮০% সঠিক উত্তর দিয়ে পরবর্তী স্টেজ আনলক করুন।\n" +
            "৬. লেভেল রান বা ওভারঅল রানে সব স্টেজ খেলে উচ্চ স্কোর অর্জন করুন।\n" +
            "৭. প্র্যাকটিস মোডে নির্দিষ্ট গুণের টেবিল অনুশীলন করুন।\n\n" +
            "শুভকামনা!";

        // Use dynamic help text if available, otherwise use default
        const helpText = (gameState.currentQuestion && gameState.currentQuestion.helpText) ?
        gameState.currentQuestion.helpText :
        defaultHelpText;

        const modalGroup = this.add.group();

        const dimBackground = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0, 0).setInteractive();
        const paneBackground = this.add.rectangle(width / 2, height / 2, modalWidth, modalHeight, Phaser.Display.Color.HexStringToColor(config.colors.panel).color)
            .setOrigin(0.5)
            .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color);

        const paneText = this.add.text(width / 2, height / 2, helpText, {
            fontSize: '22px',
             fontFamily: '"Noto Sans Bengali", sans-serif', 
            fill: config.colors.text,
            align: 'center',
            wordWrap: { width: modalWidth - 20 }
        }).setOrigin(0.5);

        const closeButton = this.add.text(width / 2 + modalWidth / 2 - 20, height / 2 - modalHeight / 2 + 20, 'X', {
            fontSize: '30px',
             fontFamily: '"Noto Sans Bengali", sans-serif', 
            fill: config.colors.text,
            backgroundColor: config.colors.stopButton,
            padding: { left: 8, right: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        modalGroup.addMultiple([dimBackground, paneBackground, paneText, closeButton]);
        modalGroup.setDepth(300);

        const closeModal = () => {
            modalGroup.destroy(true);
        };

        closeButton.on('pointerdown', closeModal);
        dimBackground.on('pointerdown', closeModal);
    }


    createStopwatchUI(x, y, width, height) {
        const container = this.add.container(x, y);
        const dialRadius = height / 2;
        const colors = {
            pink: "#E55B86",
            cream: "#FDF0D5",
            darkBrown: "#5C2626"
        };

        const dialHolder = this.add.container(-width / 2 + dialRadius, 0);
        container.add(dialHolder);

        const dialBackground = this.add.circle(0, 0, dialRadius * 0.9, Phaser.Display.Color.HexStringToColor(colors.pink).color);
        const dialInner = this.add.circle(0, 0, dialRadius * 0.7, Phaser.Display.Color.HexStringToColor(colors.cream).darken(10).color);
        const dialIndicator = this.add.rectangle(0, -dialRadius * 0.35, 3, dialRadius * 0.7, Phaser.Display.Color.HexStringToColor(colors.darkBrown).color).setOrigin(0.5, 1);
        dialHolder.add([dialBackground, dialInner, dialIndicator]);

        const timeHolder = this.add.container(dialRadius - width / 2 + 10, 0);
        container.add(timeHolder);

        const timeBg = this.add.rectangle(0, 0, width - dialRadius * 2, height, Phaser.Display.Color.HexStringToColor(colors.pink).color).setOrigin(0, 0.5);
        const timeLabel = this.add.text(10, 0, ``, {
            fontSize: `${height * 0.6}px`,
            fill: colors.darkBrown,
             fontFamily: '"Noto Sans Bengali", sans-serif', 
            fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        timeHolder.add([timeBg, timeLabel]);

        return { container, dialIndicator, timeLabel };
    }


    setupPerSetTimer(totalTime, ui) {
        gameState.elapsed = 0;
        this.masterStopwatch = this.time.addEvent({
            delay: 1000,
            callback: () => {
                gameState.elapsed++;
                const remaining = totalTime - gameState.elapsed;
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                ui.timeLabel.setText(`সময়: ${toBangla(minutes)}:${toBangla(seconds).toString().padStart(2, '0')}`);

                if (remaining <= 0) {
                    this.masterStopwatch.remove();
                    this.masterStopwatch = null;
                    endStage(this, false); // End the stage with failure
                }
            },
            callbackScope: this,
            loop: true,
            paused: true
        });

        // Helper methods for the timer
        this.masterStopwatch.start = () => { this.masterStopwatch.paused = false; };
        this.masterStopwatch.stop = () => { this.masterStopwatch.paused = true; };
        this.masterStopwatch.reset = () => {
            this.masterStopwatch.paused = true;
            gameState.elapsed = 0;
            if (ui && ui.dialIndicator) ui.dialIndicator.rotation = 0;
            const minutes = Math.floor(totalTime / 60);
            const seconds = totalTime % 60;
            if (ui && ui.timeLabel) ui.timeLabel.setText(`সময়: ${toBangla(minutes)}:${toBangla(seconds).toString().padStart(2, '0')}`);
        };

        this.masterStopwatch.reset(); // Set initial text
    }


    update(time, delta) {
        if (gameState.gameActive) {
            // Update current question logic (e.g., for animations within a question)
            if (gameState.currentQuestion) {
                gameState.currentQuestion.update(time, delta);
            }

            // --- Smooth Stopwatch Animation ---
            if (this.masterStopwatch && !this.masterStopwatch.paused) {
                // Get elapsed time since the last 1-second tick
                const elapsedSinceTick = this.masterStopwatch.getElapsed();
                // Total elapsed time in fractional seconds
                const totalElapsedSeconds = gameState.elapsed + (elapsedSinceTick / 1000);
                const totalDuration = this.masterStopwatch.delay * this.masterStopwatch.loop / 1000;
                const percent = totalElapsedSeconds / gameState.timeLimit;
                
                if (this.stopwatchUI && this.stopwatchUI.dialIndicator) {
                    // Smoothly rotate the dial
                    this.stopwatchUI.dialIndicator.rotation = percent * 2 * Math.PI;
                }
            }
        }
    }
}

export default GameScene;