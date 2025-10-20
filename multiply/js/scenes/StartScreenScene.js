import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import GameplayController from '../GameplayController.js';

// --- UI Layout Constants ---
const MAIN_BUTTON_SCALE = 0.25;
const MENU_BUTTON_SCALE = 0.25;
const LEVEL_MENU_SPACING = 70;
const STAGE_MENU_SPACING = 70;

class StartScreenScene extends Phaser.Scene {
    constructor() {
        super('StartScreenScene');
        
        // --- Properties to manage UI state ---
        this.selectedButtons = { level: null, stage: null };
        this.activeGlowTweens = { level: null, stage: null };
        this.helpText = null;
        this.defaultHelpText = 'একটি অপশন বাছাই করুন অথবা খেলা শুরু করুন।';
        this.particleEmitter = null;
        this.music = null;
    }

    create() {
        if (!gameState.controller) {
            gameState.controller = new GameplayController();
        }

        // --- Prepare Background Music (but don't play it yet) ---
        this.music = this.sound.add('game-start-menu', { loop: true, volume: 0.4 });

        // --- SOLVES THE AUDIO CONTEXT ERROR ---
        this.input.once('pointerdown', () => {
            if (this.sound.context.state === 'suspended') {
                this.sound.resume();
            }
            if (this.music && !this.music.isPlaying) {
                this.music.play();
            }
        }, this);

        const { width, height } = this.cameras.main;

        // --- Background & Title ---
        this.add.rectangle(0, 0, width, height, 0xA3D5E5).setOrigin(0);
        createBackgroundDecorations(this, width, height);
        this.add.text(width / 2, height * 0.1, 'গুণের অভিযান', {
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

        // --- Initial Selections ---
        const initialLevel = gameState.currentLevel || 1;
        const initialStage = gameState.currentStage || 1;
        this.updateSelectionEffect('level', this.levelButtons[initialLevel - 1], initialLevel, true);
        this.updateSelectionEffect('stage', this.stageButtons[initialStage - 1], initialStage, true);
    }

    shutdown() {
        // Fallback to ensure music stops if the scene is shut down by other means.
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

    addHoverEffects(button, helpString) {
        button.on('pointerover', () => {
            this.sound.play('button-hover', { volume: 0.7 });
            button.setTint(0xDDDDDD);
            this.helpText.setText(helpString);
            
            const matrix = button.getWorldTransformMatrix();
            this.particleEmitter.setPosition(matrix.tx, matrix.ty);
            
            const worldWidth = button.width * button.scaleX;
            const worldHeight = button.height * button.scaleY;

            const emitZone = new Phaser.Geom.Rectangle(-worldWidth / 2, -worldHeight / 2, worldWidth, worldHeight);

            this.particleEmitter.setEmitZone({ type: 'edge', source: emitZone, quantity: 1 });
            this.particleEmitter.start();
        });

        button.on('pointerout', () => {
            button.clearTint();
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

    createMenuButton(x, y, number, helpString, callback) {
        const button = this.add.image(x, y, 'button-cyan').setInteractive({ useHandCursor: true });
        button.setScale(MENU_BUTTON_SCALE);
        this.add.text(x, y, toBangla(number), { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
        
        button.on('pointerdown', () => {
            this.sound.play('button-click');
            callback(button, number);
        });

        this.addHoverEffects(button, helpString);
        return button;
    }

    createLevelMenu(x, y) {
        const startY = y - 80;
        const level1 = this.createMenuButton(x, startY, 1, 'সহজ প্রশ্ন দিয়ে লেভেল ১ শুরু করুন।', (btn, val) => this.updateSelectionEffect('level', btn, val));
        const level2 = this.createMenuButton(x, startY + LEVEL_MENU_SPACING, 2, 'মাঝারি প্রশ্ন দিয়ে লেভেল ২ শুরু করুন।', (btn, val) => this.updateSelectionEffect('level', btn, val));
        const level3 = this.createMenuButton(x, startY + (2 * LEVEL_MENU_SPACING), 3, 'কঠিন প্রশ্ন দিয়ে লেভেল ৩ শুরু করুন।', (btn, val) => this.updateSelectionEffect('level', btn, val));
        return [level1, level2, level3];
    }
    
    createStageMenu(x, y) {
        const startY = y - 110;
        const stage1 = this.createMenuButton(x, startY, 1, 'স্টেজ ১ বাছাই করুন।', (btn, val) => this.updateSelectionEffect('stage', btn, val));
        const stage2 = this.createMenuButton(x, startY + STAGE_MENU_SPACING, 2, 'স্টেজ ২ বাছাই করুন।', (btn, val) => this.updateSelectionEffect('stage', btn, val));
        const stage3 = this.createMenuButton(x, startY + (2 * STAGE_MENU_SPACING), 3, 'স্টেজ ৩ বাছাই করুন।', (btn, val) => this.updateSelectionEffect('stage', btn, val));
        const stage4 = this.createMenuButton(x, startY + (3 * STAGE_MENU_SPACING), 4, 'স্টেজ ৪ বাছাই করুন।', (btn, val) => this.updateSelectionEffect('stage', btn, val));
        const stage5 = this.createMenuButton(x, startY + (4 * STAGE_MENU_SPACING), 5, 'স্টেজ ৫ বাছাই করুন।', (btn, val) => this.updateSelectionEffect('stage', btn, val));
        return [stage1, stage2, stage3, stage4, stage5];
    }

    updateSelectionEffect(type, newSelectedButton, value, isInitialSetup = false) {
        if (type === 'level') gameState.currentLevel = value;
        else if (type === 'stage') gameState.currentStage = value;

        const oldSelectedButton = this.selectedButtons[type];
        if (oldSelectedButton === newSelectedButton) return;

        if (oldSelectedButton) {
            if (this.activeGlowTweens[type]) this.activeGlowTweens[type].stop();
            if (oldSelectedButton.postFX) oldSelectedButton.postFX.clear();
            oldSelectedButton.setTexture('button-cyan');
        }
        
        newSelectedButton.setTexture('button-violet');
        
        const glow = newSelectedButton.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 24);
        this.activeGlowTweens[type] = this.tweens.add({ targets: glow, outerStrength: 4, yoyo: true, loop: -1, ease: 'sine.inout' });

        if (!isInitialSetup) {
            const shine = newSelectedButton.postFX.addShine(1, 0.2, 5);
            this.time.delayedCall(800, () => { if (shine) newSelectedButton.postFX.remove(shine); });
        }

        this.selectedButtons[type] = newSelectedButton;
    }

    startGame() {
        // --- FIX: Explicitly stop the music before starting the next scene ---
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.scene.start('GameScene', {
            mode: 'stage',
            level: gameState.currentLevel || 1,
            stage: gameState.currentStage || 1,
            allowedTables: gameState.controller.levels[(gameState.currentLevel || 1) - 1]
        });
    }

    startPractice() {
        // --- FIX: Explicitly stop the music before starting the next scene ---
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.scene.start('PracticeScene');
    }
}

export default StartScreenScene;