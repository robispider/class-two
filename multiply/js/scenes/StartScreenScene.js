import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import GameplayController from '../GameplayController.js';

// --- UI Layout Constants ---
const MAIN_BUTTON_SCALE = 0.4;
const MENU_BUTTON_SCALE = 0.25;
const LEVEL_MENU_SPACING = 70;
const STAGE_MENU_SPACING = 70;

class StartScreenScene extends Phaser.Scene {
    constructor() {
        super('StartScreenScene');
        
        this.selectedButtons = { level: null, stage: null };
        this.activeGlowTweens = { level: null, stage: null };
        this.helpText = null;
        this.defaultHelpText = 'একটি অপশন বাছাই করুন অথবা খেলা শুরু করুন।';
        this.particleEmitter = null;
        this.music = null;
        this.levelButtons = [];
        this.stageButtons = [];

        // --- NEW: Property to hold the loaded save data ---
        this.lastPlayedData = null;
    }

    create() {
        if (!gameState.controller) {
            gameState.controller = new GameplayController();
        }

        // --- LOGIC FIX: Enhanced loading of last played state ---
        try {
            const lastPlayedRaw = localStorage.getItem('mathGameLastPlayed');
            if (lastPlayedRaw) {
                this.lastPlayedData = JSON.parse(lastPlayedRaw);
                // Set the initial level to the last one they were actively playing
                gameState.currentLevel = this.lastPlayedData.lastActiveLevel || 1;
                // Set the initial stage based on the last stage played *for that specific level*
                gameState.currentStage = this.lastPlayedData.lastStages?.[gameState.currentLevel] || 1;
            } else {
                // First time playing, set defaults
                this.lastPlayedData = { lastActiveLevel: 1, lastStages: {} };
                gameState.currentLevel = 1;
                gameState.currentStage = 1;
            }
        } catch (error) {
            console.error('Could not load last played state, resetting.', error);
            this.lastPlayedData = { lastActiveLevel: 1, lastStages: {} };
            gameState.currentLevel = 1;
            gameState.currentStage = 1;
        }

        // --- Prepare Background Music ---
        this.music = this.sound.add('game-start-menu', { loop: true, volume: 0.4 });

        this.input.once('pointerdown', () => {
            if (this.sound.context.state === 'suspended') this.sound.resume();
            if (this.music && !this.music.isPlaying) this.music.play();
        }, this);

        const { width, height } = this.cameras.main;

        // --- Background & Title ---
        this.add.rectangle(0, 0, width, height, 0xA3D5E5).setOrigin(0);
        createBackgroundDecorations(this, width, height);
        this.add.text(width / 2, height * 0.1, 'নামতা খেলা', {
            fontSize: '64px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', stroke: '#FFF', strokeThickness: 4
        }).setOrigin(0.5);

        // --- Help Text ---
        this.helpText = this.add.text(width / 2, height * 0.95, this.defaultHelpText, {
            fontSize: '28px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: { left: 20, right: 20, top: 10, bottom: 10 }, align: 'center', wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);

        // --- Particle Emitter ---
        this.particleEmitter = this.add.particles(0, 0, 'particle', {
            speed: { min: -80, max: 80 }, angle: { min: 0, max: 360 }, scale: { start: 0.6, end: 0 }, blendMode: 'ADD', lifespan: 400, frequency: 80, emitting: false 
        });

        // --- Main Buttons ---
        const topButtonY = height * 0.25;
        this.createMainButton(width * 0.35, topButtonY, 'শুরু করুন', 'button-green', 'এই লেভেল আর স্টেজ দিয়ে খেলা শুরু করুন।', () => this.startGame());
        this.createMainButton(width * 0.65, topButtonY, 'অনুশীলন', 'button-orange', 'গুণের নামতা অনুশীলন করুন।', () => this.startPractice());

        // --- Selection Menus ---
        const panelWidth = 250;
        const panelHeight = 420;
        const panelY = height * 0.6;
        
        this.createMenuPanel(width * 0.35, panelY, panelWidth, panelHeight, 'লেভেল');
        this.levelButtons = this.createLevelMenu(width * 0.35, panelY);
        
        this.createMenuPanel(width * 0.65, panelY, panelWidth, panelHeight, 'স্টেজ');
        this.stageButtons = this.createStageMenu(width * 0.65, panelY);

        // --- Initial Selections (now uses the loaded data) ---
        const initialLevel = gameState.currentLevel;
        const initialStage = gameState.currentStage;
        
        this.updateSelectionEffect('level', this.levelButtons[initialLevel - 1], initialLevel, true);
        
        if (gameState.controller.isStageUnlocked(initialLevel, initialStage)) {
            this.updateSelectionEffect('stage', this.stageButtons[initialStage - 1], initialStage, true);
        } else {
            // Fallback if the saved stage is somehow locked
            this.updateSelectionEffect('stage', this.stageButtons[0], 1, true);
        }
    }

    shutdown() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }

    createMenuPanel(x, y, pWidth, pHeight, title) {
        const graphics = this.add.graphics();
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.8);
        graphics.fillRoundedRect(x - pWidth / 2, y - pHeight / 2, pWidth, pHeight, 32);
        graphics.lineStyle(5, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 1);
        graphics.strokeRoundedRect(x - pWidth / 2, y - pHeight / 2, pWidth, pHeight, 32);
        this.add.text(x, y - pHeight / 2 + 40, title, { fontSize: '40px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
    }

    addHoverEffects(button, helpString) { // Works for both Images and Containers
        button.on('pointerover', () => {
            this.sound.play('button-hover', { volume: 0.7 });
            // If it's a container, tint the first child (the image). Otherwise, tint the button itself.
            const target = button instanceof Phaser.GameObjects.Container ? button.getAt(0) : button;
            target.setTint(0xDDDDDD);
            this.helpText.setText(helpString);
            
            const matrix = button.getWorldTransformMatrix();
            this.particleEmitter.setPosition(matrix.tx, matrix.ty);
            const emitZone = new Phaser.Geom.Rectangle(-button.width / 2, -button.height / 2, button.width, button.height);
            this.particleEmitter.setEmitZone({ type: 'edge', source: emitZone, quantity: 1 });
            this.particleEmitter.start();
        });

        button.on('pointerout', () => {
            const target = button instanceof Phaser.GameObjects.Container ? button.getAt(0) : button;
            target.clearTint();
            this.helpText.setText(this.defaultHelpText);
            this.particleEmitter.stop();
        });
    }

    createMainButton(x, y, text, buttonImage, helpString, callback) {
        const button = this.add.image(x, y, buttonImage).setInteractive({ useHandCursor: true });
        button.setScale(MAIN_BUTTON_SCALE);
        this.add.text(x, y, text, { fontSize: '40px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
        button.on('pointerdown', () => {
            this.sound.play('button-click');
            callback();
        });
        this.addHoverEffects(button, helpString);
        return button;
    }

    // --- NECESSARY BUG FIX: Use a container to hold button image and text together ---
    createMenuButton(x, y, number, helpString, callback, isLocked = false) {
        const buttonImageKey = isLocked ? 'button-gray' : 'button-cyan';
        const buttonImage = this.add.image(0, 0, buttonImageKey).setScale(MENU_BUTTON_SCALE);
        const buttonText = this.add.text(0, 0, toBangla(number), { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
        
        // Group them in a container
        const buttonContainer = this.add.container(x, y, [buttonImage, buttonText]);
        buttonContainer.setSize(buttonImage.displayWidth, buttonImage.displayHeight);
        buttonContainer.setInteractive({ useHandCursor: !isLocked });

        if (isLocked) {
            buttonContainer.on('pointerover', () => this.helpText.setText("এই লেভেল/স্টেজটি এখনো লক করা আছে।"));
            buttonContainer.on('pointerout', () => this.helpText.setText(this.defaultHelpText));
        } else {
            buttonContainer.on('pointerdown', () => {
                this.sound.play('button-click');
                callback(buttonContainer, number); // Pass the container
            });
            this.addHoverEffects(buttonContainer, helpString);
        }
        return buttonContainer;
    }

    createLevelMenu(x, y) {
        const startY = y - 110;
        const callback = (btn, val) => this.updateSelectionEffect('level', btn, val);
        const level1 = this.createMenuButton(x, startY + (0 * LEVEL_MENU_SPACING), 1, 'সহজ প্রশ্ন দিয়ে লেভেল ১ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(1, 1));
        const level2 = this.createMenuButton(x, startY + (1 * LEVEL_MENU_SPACING), 2, 'মাঝারি প্রশ্ন দিয়ে লেভেল ২ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(2, 1));
        const level3 = this.createMenuButton(x, startY + (2 * LEVEL_MENU_SPACING), 3, 'কঠিন প্রশ্ন দিয়ে লেভেল ৩ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(3, 1));
        const level4 = this.createMenuButton(x, startY + (3 * LEVEL_MENU_SPACING), 4, 'বিশেষজ্ঞ প্রশ্ন দিয়ে লেভেল ৪ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(4, 1));
        return [level1, level2, level3, level4];
    }
    
    createStageMenu(x, y) {
        const startY = y - 110;
        const callback = (btn, val) => this.updateSelectionEffect('stage', btn, val);
        const currentLevel = gameState.currentLevel;
        const stage1 = this.createMenuButton(x, startY + (0 * STAGE_MENU_SPACING), 1, 'স্টেজ ১ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 1));
        const stage2 = this.createMenuButton(x, startY + (1 * STAGE_MENU_SPACING), 2, 'স্টেজ ২ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 2));
        const stage3 = this.createMenuButton(x, startY + (2 * STAGE_MENU_SPACING), 3, 'স্টেজ ৩ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 3));
        const stage4 = this.createMenuButton(x, startY + (3 * STAGE_MENU_SPACING), 4, 'স্টেজ ৪ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 4));
        const stage5 = this.createMenuButton(x, startY + (4 * STAGE_MENU_SPACING), 5, 'স্টেজ ৫ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 5));
        return [stage1, stage2, stage3, stage4, stage5];
    }

    updateSelectionEffect(type, newSelectedButton, value, isInitialSetup = false) {
        if (!newSelectedButton || (this.selectedButtons[type] === newSelectedButton && !isInitialSetup)) return;

        const oldSelectedButton = this.selectedButtons[type];
        if (oldSelectedButton) {
            if (this.activeGlowTweens[type]) this.activeGlowTweens[type].stop();
            const oldImage = oldSelectedButton.getAt(0); // Get image from container
            if (oldImage.postFX) oldImage.postFX.clear();

            const oldButtonIndex = (type === 'level' ? this.levelButtons : this.stageButtons).indexOf(oldSelectedButton);
            if (oldButtonIndex !== -1) {
                const oldButtonValue = oldButtonIndex + 1;
                const isLocked = !gameState.controller.isStageUnlocked(
                    type === 'level' ? oldButtonValue : gameState.currentLevel,
                    type === 'stage' ? oldButtonValue : 1
                );
                oldImage.setTexture(isLocked ? 'button-gray' : 'button-cyan');
            }
        }

        const newImage = newSelectedButton.getAt(0); // Get image from container
        newImage.setTexture('button-violet');
        const glow = newImage.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 24);
        this.activeGlowTweens[type] = this.tweens.add({ targets: glow, outerStrength: 4, yoyo: true, loop: -1, ease: 'sine.inout' });
        this.selectedButtons[type] = newSelectedButton;
        
        if (!isInitialSetup) {
            const shine = newImage.postFX.addShine(1, 0.2, 5);
            this.time.delayedCall(800, () => { if (newImage.postFX) newImage.postFX.remove(shine); });
        }

        // --- LOGIC FIX: Update stage buttons and select last played when level changes ---
        if (type === 'level') {
            gameState.currentLevel = value;
            if (!isInitialSetup) {
                // Destroy old stage button containers, which also destroys their children (image and text)
                this.stageButtons.forEach(button => button.destroy());
                
                const { width, height } = this.cameras.main;
                this.stageButtons = this.createStageMenu(width * 0.65, height * 0.6);
                
                // Auto-select the last played stage for this new level
                const stageToSelect = this.lastPlayedData.lastStages?.[value] || 1;
                const buttonToSelect = this.stageButtons[stageToSelect - 1];

                if (buttonToSelect && gameState.controller.isStageUnlocked(value, stageToSelect)) {
                    this.updateSelectionEffect('stage', buttonToSelect, stageToSelect, true);
                } else {
                    // Fallback to the first stage if the saved one is locked
                    this.updateSelectionEffect('stage', this.stageButtons[0], 1, true);
                }
            }
        } else if (type === 'stage') {
            gameState.currentStage = value;
        }
    }

    startGame() {
          try {
            // Load existing data to avoid overwriting other level progress
            const lastPlayedRaw = localStorage.getItem('mathGameLastPlayed');
            let lastPlayedData = lastPlayedRaw ? JSON.parse(lastPlayedRaw) : { lastActiveLevel: 1, lastStages: {} };

            // Update with the currently selected level and stage from the gameState
            lastPlayedData.lastActiveLevel = gameState.currentLevel;
            lastPlayedData.lastStages[gameState.currentLevel] = gameState.currentStage;

            // Save the updated object back to localStorage immediately
            localStorage.setItem('mathGameLastPlayed', JSON.stringify(lastPlayedData));
        } catch (error) {
            console.error('Failed to save last played state on game start.', error);
        }
        
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.scene.start('GameScene', {
            mode: 'stage',
            level: gameState.currentLevel,
            stage: gameState.currentStage,
            allowedTables: gameState.controller.levels[gameState.currentLevel - 1]
        });
    }

    startPractice() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.scene.start('PracticeScene');
    }
}

export default StartScreenScene;