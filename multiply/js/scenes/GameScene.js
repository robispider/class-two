// js/scenes/GameScene.js
import { gameState } from '../gameState.js';
import { config } from '../config.js';
import { toBangla } from '../utils.js';
import { startStage } from '../game.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create(data) {
        console.log('GameScene create called with data:', data); // Debug
        // Set stage from data or default to 1
        gameState.currentStage = data.stage || gameState.currentStage || 1;
        gameState.currentLevel = data.level || gameState.currentLevel || 1;
        gameState.mode = data.mode || gameState.mode || 'stage';

        // Background gradient
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[0]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[0]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[1]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[1]).color,
            1
        );
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // Padding
        const padding = this.cameras.main.width * config.padding;
        const W = this.cameras.main.width - 2 * padding;
        const H = this.cameras.main.height - 2 * padding;

        // Header container
        this.headerContainer = this.add.container(padding, padding).setSize(W, 100);

        // Help container (left side)
        this.helpContainer = this.add.container(0, 0).setSize(W * 0.5, 100);
        this.headerContainer.add(this.helpContainer);

        // Score and timer container (right side)
        this.scoreTimerContainer = this.add.container(W * 0.5, 0).setSize(W * 0.5, 100);
        this.headerContainer.add(this.scoreTimerContainer);

        // Score container
        this.scoreContainer = this.add.container(0, 0).setSize(W * 0.5, 50);
        this.scoreTimerContainer.add(this.scoreContainer);

        // Timer container
        this.timerContainer = this.add.container(0, 50).setSize(W * 0.5, 50);
        this.scoreTimerContainer.add(this.timerContainer);

        // Title label
        this.titleLabel = this.add.text(
            0,
            -25,
            `লেভেল ${toBangla(gameState.currentLevel)} - স্টেজ ${toBangla(gameState.currentStage)}`,
            { fontSize: '40px', fill: config.colors.text, fontStyle: 'bold', stroke: config.colors.textOutline, strokeThickness: 2 }
        ).setOrigin(0.5, 0.5);
        this.helpContainer.add(this.titleLabel);

        // Stats panel container
        this.statsContainer = this.add.container(0, 25).setSize(350, 50);
        this.add.rectangle(0, 0, 350, 50, Phaser.Display.Color.HexStringToColor(config.colors.panel).color)
            .setOrigin(0.5)
            .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color);
        this.helpContainer.add(this.statsContainer);

        // Stats labels
        this.statsLabels = {
            question: this.add.text(10, 10, `প্রশ্ন: ${toBangla(gameState.questionCount)}`, {
                fontSize: '20px',
                fill: config.colors.text
            }),
            correct: this.add.text(100, 10, `সঠিক: ${toBangla(gameState.correctCount)}`, {
                fontSize: '20px',
                fill: config.colors.text
            }),
            incorrect: this.add.text(190, 10, `ভুল: ${toBangla(gameState.questionCount - gameState.correctCount)}`, {
                fontSize: '20px',
                fill: config.colors.text
            }),
            bonus: this.add.text(280, 10, `বোনাস: ${toBangla(gameState.streak * config.points.streakBonus)}`, {
                fontSize: '20px',
                fill: config.colors.text
            })
        };
        this.statsContainer.add(Object.values(this.statsLabels));

        // Score label
        this.scoreLabel = this.add.text(
            0,
            0,
            `স্কোর: ${toBangla(gameState.score)}`,
            { fontSize: '30px', fill: config.colors.text, fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.scoreContainer.add(this.scoreLabel);

        // Stopwatch (replicating ZIM.js createStopwatch)
        this.createStopwatch(30, 50, W * 0.5); // Matches ShootingQuestion timeLimit

        // Footer container
        this.footerContainer = this.add.container(padding, H - 100 + padding).setSize(W, 100);

        // Owl container (left, placeholder for future use)
        this.owlContainer = this.add.container(0, 0).setSize(300, 100);
        this.footerContainer.add(this.owlContainer);

        // Stop container (right)
        this.stopContainer = this.add.container(W - 200, 0).setSize(200, 100);
        this.footerContainer.add(this.stopContainer);

        // Stats container (center, for feedback)
        this.statsFooterContainer = this.add.container(300, 0).setSize(W - 500, 100);
        this.footerContainer.add(this.statsFooterContainer);

        // Stop button
        this.stopButton = this.add.text(
            0,
            0,
            'X',
            {
                fontSize: '50px',
                fill: 'white',
                backgroundColor: config.colors.stopButton,
                padding: { left: 20, right: 20, top: 20, bottom: 20 },
                fixedWidth: 80,
                fixedHeight: 80,
                align: 'center'
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.stopButton.on('pointerdown', () => {
            gameState.gameActive = false;
            if (this.stopwatch) this.stopwatch.remove();
            gameState.performanceTracker.saveToLocal();
            gameState.score = 0;
            gameState.streak = 0;
            gameState.timeLimit = config.initialTimeLimit;
            this.scene.start('StartScreenScene');
        });
        this.stopContainer.add(this.stopButton);

        // Help button
        this.helpButton = this.add.text(
            50,
            50,
            '?',
            {
                fontSize: '15px',
                fill: config.colors.text,
                backgroundColor: config.colors.panelBorder,
                padding: { left: 10, right: 10, top: 10, bottom: 10 }
            }
        ).setOrigin(1, 1).setInteractive({ useHandCursor: true });
        this.owlContainer.add(this.helpButton);
        this.helpButton.on('pointerdown', () => {
            const paneBackground = this.add.rectangle(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                600,
                400,
                Phaser.Display.Color.HexStringToColor(config.colors.panel).color
            ).setOrigin(0.5).setInteractive();
            const paneText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                "গুণের অভিযানে স্বাগতম!\n\n" +
                "কীভাবে খেলবেন:\n" +
                "১. একটি লেভেল এবং স্টেজ বা প্র্যাকটিস মোড বাছাই করুন।\n" +
                "২. গুণের প্রশ্নের উত্তর বাছাই করুন বা কীবোর্ডে টাইপ করে এন্টার চাপুন।\n" +
                "৩. সঠিক উত্তরের জন্য ১০ পয়েন্ট এবং পরপর সঠিক উত্তরে বোনাস পয়েন্ট পান।\n" +
                "৪. ভুল উত্তরে ৫ পয়েন্ট হারান।\n" +
                "৫. স্টেজ মোডে ২০টি প্রশ্নের মধ্যে ৮০% সঠিক উত্তর দিয়ে পরবর্তী স্টেজ আনলক করুন।\n" +
                "৬. লেভেল রান বা ওভারঅল রানে সব স্টেজ খেলে উচ্চ স্কোর অর্জন করুন।\n" +
                "৭. প্র্যাকটিস মোডে নির্দিষ্ট গুণের টেবিল অনুশীলন করুন।\n\n" +
                "শুভকামনা!",
                {
                    fontSize: '24px',
                    fill: config.colors.text,
                    align: 'center',
                    wordWrap: { width: 580 }
                }
            ).setOrigin(0.5);
            const closeButton = this.add.text(
                this.cameras.main.width / 2 + 270,
                this.cameras.main.height / 2 - 180,
                'X',
                { fontSize: '30px', fill: config.colors.text }
            ).setInteractive({ useHandCursor: true });
            closeButton.on('pointerdown', () => {
                paneBackground.destroy();
                paneText.destroy();
                closeButton.destroy();
            });
            this.add.existing(paneBackground);
            this.add.existing(paneText);
            this.add.existing(closeButton);
        });

        // Typed label
        this.typedLabel = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 150,
            '',
            { fontSize: '50px', fill: 'green' }
        ).setOrigin(0.5);

        // Feedback label
        this.feedbackLabel = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            'সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন',
            { fontSize: '20px', fill: config.colors.text }
        ).setOrigin(0.5);
        this.statsFooterContainer.add(this.feedbackLabel);

        // QA region
        this.qaRegion = this.add.container(padding, 100 + padding).setSize(W, H - 200);

        // Start the game logic
        startStage(
            this,
            gameState.mode,
            gameState.currentLevel,
            data.allowedTables || gameState.controller.levels[gameState.currentLevel - 1] || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        );

        // Start stopwatch
        if (this.stopwatch) {
            this.stopwatch.paused = false;
        }
    }

    createStopwatch(totalTime, height, width) {
        const colors = {
            pink: "#E55B86",
            cream: "#FDF0D5",
            orangeRed: "#F26D5B",
            darkBrown: "#5C2626",
            yellow: "#FDBF5A",
            panel: "rgba(0,0,0,0.1)"
        };

        // Time holder
        this.timeHolder = this.add.container(0, 0).setSize(width * 0.5, height);
        this.timerContainer.add(this.timeHolder);

        // Pink rectangle background
        this.add.rectangle(-17, 0, width, height, Phaser.Display.Color.HexStringToColor(colors.pink).color)
            .setOrigin(0, 0.5);

        // Time label
        this.timeLabel = this.add.text(
            10,
            0,
            `সময়: ${toBangla(0)}:${toBangla(0).padStart(2, '0')}`,
            {
                fontSize: `${height * 0.7}px`,
                fill: colors.darkBrown,
                fontFamily: 'arial',
                fontStyle: 'bold',
                stroke: colors.cream,
                strokeThickness: 1
            }
        ).setOrigin(0, 0.5);
        this.timeHolder.add(this.timeLabel);

        // Score holder (already handled by scoreContainer, but add star)
        this.add.polygon(
            0,
            -height * 0.1,
            [0, 0, 10, 30, 40, 30, 15, 45, 25, 70, 0, 50, -25, 70, -15, 45, -40, 30, -10, 30],
            Phaser.Display.Color.HexStringToColor(colors.yellow).color
        ).setOrigin(0.5).setScale(height * 0.22 / 50).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(colors.darkBrown).color);
        this.scoreContainer.add(this.scoreLabel);

        // Dial
        this.dialHolder = this.add.container(0, 0).setSize(height, height);
        this.timerContainer.add(this.dialHolder);

        // Simulate ZIM Dial with Phaser graphics
        this.dialBackground = this.add.circle(0, 0, height * 0.4, Phaser.Display.Color.HexStringToColor(colors.pink).color)
            .setOrigin(0.5);
        this.dialInner = this.add.circle(0, 0, height * 0.3, Phaser.Display.Color.HexStringToColor(colors.cream).darken(10).color)
            .setOrigin(0.5);
        this.dialIndicator = this.add.rectangle(0, -height * 0.35, 2, height * 0.1, Phaser.Display.Color.HexStringToColor(colors.darkBrown).color)
            .setOrigin(0.5, 1);
        this.dialHolder.add([this.dialBackground, this.dialInner, this.dialIndicator]);

        // Stopwatch logic
        this.stopwatch = this.time.addEvent({
            delay: 1000,
            callback: () => {
                gameState.elapsed = (gameState.elapsed || 0) + 1;
                const percent = (gameState.elapsed / totalTime) * 100;
                this.dialIndicator.rotation = (percent / 100) * 2 * Math.PI;
                const minutes = Math.floor((totalTime - gameState.elapsed) / 60);
                const seconds = (totalTime - gameState.elapsed) % 60;
                this.timeLabel.setText(`সময়: ${toBangla(minutes)}:${toBangla(seconds).padStart(2, '0')}`);
                if (gameState.elapsed >= totalTime) {
                    this.stopwatch.remove();
                    this.timeLabel.setText(`সময়: ${toBangla(0)}:${toBangla(0).padStart(2, '0')}`);
                    gameState.currentQuestion?.handleTimeUp();
                }
            },
            callbackScope: this,
            loop: true,
            startAt: 0,
            paused: true
        });

        // Stopwatch methods
        this.stopwatch.setTime = (seconds) => {
            totalTime = seconds;
            this.stopwatch.reset({
                delay: 1000,
                callback: this.stopwatch.callback,
                callbackScope: this,
                loop: true,
                startAt: 0,
                paused: true
            });
            gameState.elapsed = 0;
            this.dialIndicator.rotation = 0;
            this.timeLabel.setText(`সময়: ${toBangla(Math.floor(seconds / 60))}:${toBangla(seconds % 60).padStart(2, '0')}`);
        };

        this.stopwatch.start = () => {
            gameState.elapsed = 0;
            this.stopwatch.paused = false;
        };

        this.stopwatch.stop = () => {
            this.stopwatch.paused = true;
        };

        this.stopwatch.reset = () => {
            this.stopwatch.stop();
            gameState.elapsed = 0;
            this.dialIndicator.rotation = 0;
            this.timeLabel.setText(`সময়: ${toBangla(Math.floor(totalTime / 60))}:${toBangla(totalTime % 60).padStart(2, '0')}`);
        };

        this.stopwatch.getElapsedTime = () => gameState.elapsed || 0;

        this.stopwatch.reset();
        gameState.stopwatch = this.stopwatch; // Store for access in game.js
    }

    update() {
        if (gameState.currentQuestion) {
            gameState.currentQuestion.update();
        }
        this.scoreLabel.setText(`স্কোর: ${toBangla(gameState.score)}`);
        this.statsLabels.question.setText(`প্রশ্ন: ${toBangla(gameState.questionCount)}`);
        this.statsLabels.correct.setText(`সঠিক: ${toBangla(gameState.correctCount)}`);
        this.statsLabels.incorrect.setText(`ভুল: ${toBangla(gameState.questionCount - gameState.correctCount)}`);
        this.statsLabels.bonus.setText(`বোনাস: ${toBangla(gameState.streak * config.points.streakBonus)}`);
    }
}

export default GameScene;