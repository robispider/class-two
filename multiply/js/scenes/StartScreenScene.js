// js/StartScreenScene.js
import { AvatarSelectionComponent } from '../ui/AvatarSelectionComponent.js';
import { LeaderboardComponent } from '../ui/LeaderboardComponent.js';
import { UserSelectionComponent } from '../ui/UserSelectionComponent.js'; // NEW IMPORT
import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config, avatars } from '../config.js';
import { gameState } from '../gameState.js';
import GameplayController from '../GameplayController.js';
import { loadedAssetKeys, assetManifest } from '../AssetManager.js';

// --- UI Layout Constants ---
const MAIN_BUTTON_SCALE = 0.35;
const MENU_BUTTON_SCALE = 0.4;
const MENU_BUTTON_SCALE_X = 0.35;
const MENU_BUTTON_SCALE_Y = 0.25;
const LEVEL_MENU_SPACING = 70;
const STAGE_MENU_SPACING = 70;

class StartScreenScene extends Phaser.Scene {
    constructor() {
        super('StartScreenScene');
    }

    init() {
        // Reset all properties
        this.leaderboardComponent = null;
        this.selectedButtons = { level: null, stage: null };
        this.activeGlowTweens = { level: null, stage: null };
        this.helpText = null;
        this.defaultHelpText = 'একটি অপশন বাছাই করুন অথবা খেলা শুরু করুন।';
        this.particleEmitter = null;
        this.music = null;
        this.levelButtons = [];
        this.stageButtons = [];
        this.lastPlayedData = null;
        this.mainMenuContainer = null;
    }

    create() {
        this.leaderboardComponent = new LeaderboardComponent(this);
//  this.load.audio("game-start-menu","assets/sounds/game-start-menu.mp3");
const testSound = this.sound.add('game-start-menu', { loop: true, volume: 1 });

// Check if file was actually loaded
if (!testSound || !testSound.key) {
    console.error('Sound key missing!');
}

// Listen for decode success/failure
testSound.on('loaderror', () => {
    console.error('DECODE FAILED for game-start-menu.mp3');
});
testSound.on('decoded', () => {
    console.log('DECODED SUCCESSFULLY');
});

console.log('game-start-menu exists?',this.cache.audio.exists('game-start-menu')); 

   

console.log('music created – using HTML5 Audio');

    // First gesture: Resume (for any WebAudio remnants) + play
    this.input.once('pointerdown', () => {
    console.log('First click – resuming context (if needed)');
    this.sound.unlock();
     this.music = this.sound.add('game-start-menu', { loop: true, volume: 0.4 });
    this.userHasInteracted = true; // ADD THIS

    if (this.sound.context && this.sound.context.state === 'suspended') {
        this.sound.context.resume();
    }

    if (this.music && !this.music.isPlaying) {
        const played = this.music.play();
        console.log('music.play() returned:', played, 'isPlaying:', this.music.isPlaying);
        if (this.music._sound && this.music._sound.readyState >= 2) {
            console.log('HTML5 audio ready and playing');
        } else {
            console.warn('HTML5 audio not ready – check file');
        }
    }
}, this);

        const { width, height } = this.cameras.main;

        // --- Always create the background and title ---
        this.add.rectangle(0, 0, width, height, 0xA3D5E5).setOrigin(0);
        createBackgroundDecorations(this, width, height);
        this.add.text(width / 2, height * 0.1, 'নামতা খেলা', {
            fontSize: '64px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', stroke: '#FFF', strokeThickness: 4
        }).setOrigin(0.5);

        // --- NEW, CLEANER LOGIC ---
        if (gameState.currentUser) {
            // If a user is already selected, go straight to the main menu.
            this.initializeMainMenu();
        } else {
            // Otherwise, show the user selection modal first.
            const userModal = new UserSelectionComponent(this, () => {
                // This callback function is executed ONLY after a user is selected in the modal.
                this.initializeMainMenu();
            });
            userModal.show();
        }
    }

 // --------------------------------------------------------------
    //  Resume AudioContext → Load audio → Decode → Play
    // --------------------------------------------------------------
    async resumeAndLoadAudio() {
        // 1. Resume the AudioContext
        if (this.sound.context.state === 'suspended') {
            await this.sound.context.resume();
            console.log('AudioContext resumed');
        }

        // 2. Load the *menu* audio files (now the context is running)
        const menuAudio = assetManifest.menu.filter(a => a.type === 'audio');
        for (const a of menuAudio) {
            if (!loadedAssetKeys.has(a.key)) {
                this.load.audio(a.key, a.path);
                loadedAssetKeys.add(a.key);
            }
        }

        // If nothing to load, decode what we already have (should be none)
        if (menuAudio.length === 0) {
            this.startMusic();
            return;
        }

        // 3. Start the loader (it will fire 'complete' when done)
        this.load.once('complete', () => {
            this.decodeMenuAudioAndPlay();
        });

        this.load.start(); // <-- important!
    }

    // --------------------------------------------------------------
    //  Decode every loaded menu audio file
    // --------------------------------------------------------------
    decodeMenuAudioAndPlay() {
        const keys = assetManifest.menu
            .filter(a => a.type === 'audio')
            .map(a => a.key);

        const toDecode = keys
            .map(key => {
                const data = this.cache.audio.get(key);
                if (data instanceof ArrayBuffer) return { key, data };
                console.warn(`No ArrayBuffer for ${key} – skipping`);
                return null;
            })
            .filter(Boolean);

        if (toDecode.length === 0) {
            console.warn('Nothing to decode – using HTML5 fallback (no WebAudio sound)');
            this.startMusic(); // will still work with HTML5
            return;
        }

        console.log(`Decoding ${toDecode.length} WebAudio file(s)…`);
        this.sound.decodeAudio(toDecode);

        this.sound.once('decodedall', () => {
            console.log('All menu audio decoded');
            keys.forEach(k => {
                const s = this.sound.get(k);
                console.log(`${k} → isDecoded:${s.isDecoded} duration:${s.duration}`);
            });
            this.startMusic();
        });
    }

    // --------------------------------------------------------------
    //  Create the music object and play it
    // --------------------------------------------------------------
    startMusic() {
        if (this.music) return; // already created

        this.music = this.sound.add('game-start-menu', { loop: true, volume: 0.4 });
        console.log('music object created – isDecoded?', this.music.isDecoded);

        if (!this.music.isPlaying) {
            const ok = this.music.play();
            console.log('music.play() returned:', ok);
        }
    }
    // REMOVED: createUserSelectionMenu and selectUser are now inside the component.

      createCurrentUserDisplay() {
        // --- NEW: Clean up the old display before creating a new one ---
        if (this.userDisplayContainer) {
            this.userDisplayContainer.destroy();
        }

        const padding = 20;
        const user = gameState.currentUser;
        if (!user) return;

        this.userDisplayContainer = this.add.container(padding, padding);
        
        const bg = this.add.graphics()
            .fillStyle(0xffffff, 0.5).fillRoundedRect(0, 0, 280, 80, 20)
            .lineStyle(2, 0x5C2626, 0.7).strokeRoundedRect(0, 0, 280, 80, 20);

        // --- MODIFIED: The avatar is now the primary button for editing ---
        const avatar = this.add.image(padding + 35, 40, `avatar-${user.avatar}`)
            .setScale(1)
            .setInteractive({ useHandCursor: true });
            
        const nameText = this.add.text(avatar.x + 60, 40, user.name, {
            fontSize: '28px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        const changeUserButton = this.add.image(280 - 40, 40, 'switch-icon').setScale(1).setInteractive({ useHandCursor: true });
        
        // --- NEW: Avatar click handler ---
        avatar.on('pointerdown', () => {
             if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
            const avatarModal = new AvatarSelectionComponent(this, user, (newAvatar) => {
                // This is the onSave callback
                gameState.userManager.updateUserAvatar(user.name, newAvatar);
                gameState.currentUser = gameState.userManager.getCurrentUser(); // Refresh global state
                this.createCurrentUserDisplay(); // Re-render the display with the new avatar
            });
            avatarModal.show();
        });
        
        changeUserButton.on('pointerdown', () => this.handleChangeUser());
        
        this.userDisplayContainer.add([bg, avatar, nameText, changeUserButton]);
        this.mainMenuContainer.add(this.userDisplayContainer);
    }

    handleChangeUser() {
        gameState.userManager.clearCurrentUser();
        gameState.currentUser = null;
        if (this.music) this.music.stop();
        this.scene.start('StartScreenScene');
    }

    initializeMainMenu() {
        this.mainMenuContainer = this.add.container(0, 0); // Create the container
        this.mainMenuContainer.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.mainMenuContainer, alpha: 1, duration: 500 });
        
        gameState.controller = new GameplayController();
        gameState.controller.loadProgress(gameState.currentUser.name);

        this.createCurrentUserDisplay();

        try {
            const key = `mathGame_${gameState.currentUser.name}_lastPlayed`;
            const lastPlayedRaw = localStorage.getItem(key);
            if (lastPlayedRaw) {
                this.lastPlayedData = JSON.parse(lastPlayedRaw);
                gameState.currentLevel = this.lastPlayedData.lastActiveLevel || 1;
                gameState.currentStage = this.lastPlayedData.lastStages?.[gameState.currentLevel] || 1;
            } else {
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

        const { width, height } = this.cameras.main;

        this.helpText = this.add.text(width / 2, height * 0.95, this.defaultHelpText, {
            fontSize: '28px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: { left: 20, right: 20, top: 10, bottom: 10 }, align: 'center', wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);
        this.mainMenuContainer.add(this.helpText);

        this.particleEmitter = this.add.particles(0, 0, 'particle', {
            speed: { min: -80, max: 80 }, angle: { min: 0, max: 360 }, scale: { start: 0.6, end: 0 }, blendMode: 'ADD', lifespan: 400, frequency: 80, emitting: false 
        });
        this.mainMenuContainer.add(this.particleEmitter);

        const topButtonY = height * 0.25;
        this.mainMenuContainer.add(this.createMainButton(width * 0.25, topButtonY, 'শুরু করুন', 'button-green', 'এই লেভেল আর স্টেজ দিয়ে খেলা শুরু করুন।', () => this.startGame()));
        this.mainMenuContainer.add(this.createMainButton(width * 0.5, topButtonY, 'অনুশীলন', 'button-orange', 'গুণের নামতা অনুশীলন করুন।', () => this.startPractice()));
        
        this.mainMenuContainer.add(this.createMainButton(width * 0.75, topButtonY, 'লিডারবোর্ড', 'button-red', 'সবার হাই স্কোর দেখুন।', () => {
            this.leaderboardComponent.show({
                level: gameState.currentLevel,
                stage: gameState.currentStage
            });
        }));

        const panelWidth = 280;
        const panelHeight = 420;
        const panelY = height * 0.6;
        
        this.createMenuPanel(width * 0.35, panelY, panelWidth, panelHeight, 'লেভেল');
        this.levelButtons = this.createLevelMenu(width * 0.35, panelY);
        this.mainMenuContainer.add(this.levelButtons);
        
        this.createMenuPanel(width * 0.65, panelY, panelWidth, panelHeight, 'স্টেজ');
        this.stageButtons = this.createStageMenu(width * 0.65, panelY);
        this.mainMenuContainer.add(this.stageButtons);

        const initialLevel = gameState.currentLevel;
        const initialStage = gameState.currentStage;
        
        if (this.levelButtons[initialLevel - 1]) {
            this.updateSelectionEffect('level', this.levelButtons[initialLevel - 1], initialLevel, true);
        }
        
        if (this.stageButtons[initialStage - 1] && gameState.controller.isStageUnlocked(initialLevel, initialStage)) {
            this.updateSelectionEffect('stage', this.stageButtons[initialStage - 1], initialStage, true);
        } else if (this.stageButtons[0]) {
            this.updateSelectionEffect('stage', this.stageButtons[0], 1, true);
        }
        //   this._startBackgroundLoading();
    }
 /**
     * NEW METHOD
     * Silently starts loading all game assets in the background.
     */
    _startBackgroundLoading() {
        console.log("StartScreen: Starting background asset loading...");

        this.load.once('complete', () => {
            console.log("StartScreen: Background asset loading complete!");
        });

        for (const groupName in assetManifest) {
            if (groupName === 'menu') continue; // Skip menu assets, they are already loaded
            const assets = assetManifest[groupName];
            for (const asset of assets) {
                if (!loadedAssetKeys.has(asset.key)) {
                    this.load[asset.type](asset.key, asset.path, asset.options);
                    loadedAssetKeys.add(asset.key);
                }
            }
        }
        
        this.load.start();
    }

    // ... (The rest of the file: shutdown, createMenuPanel, addHoverEffects, createMainButton, createMenuButton, createLevelMenu, createStageMenu, updateSelectionEffect, startGame, startPractice) remains exactly the same as your "fixed" version.
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
        const titleText = this.add.text(x, y - pHeight / 2 + 40, title, { fontSize: '40px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
        this.mainMenuContainer.add([graphics, titleText]);
    }

    addHoverEffects(button, helpString) {
        button.on('pointerover', () => {
             if (this.sound.context && this.sound.context.state != 'suspended') {
         this.sound.play('button-hover', { volume: 0.7 });
    }
                        // console.log('sound context hover',this.sound.context.state);
          
            const target = button instanceof Phaser.GameObjects.Container ? button.getAt(0) : button;
            target.setTint(0xDDDDDD);
            if(this.helpText) this.helpText.setText(helpString);
            
            if (this.particleEmitter) {
                const matrix = button.getWorldTransformMatrix();
                this.particleEmitter.setPosition(matrix.tx, matrix.ty);
                const emitZone = new Phaser.Geom.Rectangle(-button.width / 2, -button.height / 2, button.width, button.height);
                this.particleEmitter.setEmitZone({ type: 'edge', source: emitZone, quantity: 1 });
                this.particleEmitter.start();
            }
        });

        button.on('pointerout', () => {
            const target = button instanceof Phaser.GameObjects.Container ? button.getAt(0) : button;
            target.clearTint();
            if(this.helpText) this.helpText.setText(this.defaultHelpText);
            if (this.particleEmitter) this.particleEmitter.stop();
        });
    }

    createMainButton(x, y, text, buttonImage, helpString, callback) {
        const button = this.add.image(x, y, buttonImage).setInteractive({ useHandCursor: true });
        button.setScale(MAIN_BUTTON_SCALE);
        const btnText = this.add.text(x, y, text, { fontSize: '40px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
        button.on('pointerdown', () => {
            this.sound.play('button-click');
            callback();
        });
        this.addHoverEffects(button, helpString);
        return [button, btnText];
    }

    createMenuButton(x, y, label, number, helpString, callback, isLocked = false) {
        const buttonImageKey = isLocked ? 'button-gray' : 'button-cyan';
        const buttonImage = this.add.image(0, 0, buttonImageKey).setScale(MENU_BUTTON_SCALE_X,MENU_BUTTON_SCALE_Y);
        const buttonText = this.add.text(0, 0, label, { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
        
        const buttonContainer = this.add.container(x, y, [buttonImage, buttonText]);
        buttonContainer.setSize(buttonImage.displayWidth, buttonImage.displayHeight);
        buttonContainer.setInteractive({ useHandCursor: !isLocked });

        if (isLocked) {
            buttonContainer.on('pointerover', () => this.helpText.setText("এই লেভেল/স্টেজটি এখনো লক করা আছে।"));
            buttonContainer.on('pointerout', () => this.helpText.setText(this.defaultHelpText));
        } else {
            buttonContainer.on('pointerdown', () => {
                this.sound.play('button-click');
                callback(buttonContainer, number);
            });
            this.addHoverEffects(buttonContainer, helpString);
        }
        return buttonContainer;
    }

    createLevelMenu(x, y) {
        const startY = y - 110;
        const callback = (btn, val) => this.updateSelectionEffect('level', btn, val);
        const level1 = this.createMenuButton(x, startY + (0 * LEVEL_MENU_SPACING),toBangla(1),1, '১-৫ এর নামতা দিয়ে লেভেল ১ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(1, 1));
        const level2 = this.createMenuButton(x, startY + (1 * LEVEL_MENU_SPACING), toBangla(2),2, '৬-১০ এর নামতা দিয়ে লেভেল ২ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(2, 1));
        const level3 = this.createMenuButton(x, startY + (2 * LEVEL_MENU_SPACING), toBangla(3),3, '১১-১৫ এর নামতা দিয়ে লেভেল ৩ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(3, 1));
        const level4 = this.createMenuButton(x, startY + (3 * LEVEL_MENU_SPACING), toBangla(4),4, '১৬-২০ এর নামতা দিয়ে লেভেল ৪ শুরু করুন।', callback, !gameState.controller.isStageUnlocked(4, 1));
        return [level1, level2, level3, level4];
    }
    
    createStageMenu(x, y) {
        const startY = y - 110;
        const callback = (btn, val) => this.updateSelectionEffect('stage', btn, val);
        const currentLevel = gameState.currentLevel;
        const stage1 = this.createMenuButton(x, startY + (0 * STAGE_MENU_SPACING),"ছবির গুণ", 1, 'স্টেজ ১ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 1));
        const stage2 = this.createMenuButton(x, startY + (1 * STAGE_MENU_SPACING), "ধাঁধার ছবি",2, 'স্টেজ ২ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 2));
        const stage3 = this.createMenuButton(x, startY + (2 * STAGE_MENU_SPACING),"বাক্স রহস্য", 3, 'স্টেজ ৩ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 3));
        const stage4 = this.createMenuButton(x, startY + (3 * STAGE_MENU_SPACING), "সংখ্যার জুটি",4, 'স্টেজ ৪ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 4));
        const stage5 = this.createMenuButton(x, startY + (4 * STAGE_MENU_SPACING),"আকাশের প্রহরী", 5, 'স্টেজ ৫ বাছাই করুন।', callback, !gameState.controller.isStageUnlocked(currentLevel, 5));
        return [stage1, stage2, stage3, stage4, stage5];
    }

    updateSelectionEffect(type, newSelectedButton, value, isInitialSetup = false) {
        if (!newSelectedButton || (this.selectedButtons[type] === newSelectedButton && !isInitialSetup)) return;

        const oldSelectedButton = this.selectedButtons[type];
        if (oldSelectedButton) {
            if (this.activeGlowTweens[type]) this.activeGlowTweens[type].stop();
            const oldImage = oldSelectedButton.getAt(0);
            
            if (oldImage && oldImage.postFX) oldImage.postFX.clear();

            const oldButtonIndex = (type === 'level' ? this.levelButtons : this.stageButtons).indexOf(oldSelectedButton);
            if (oldButtonIndex !== -1) {
                const oldButtonValue = oldButtonIndex + 1;
                const isLocked = !gameState.controller.isStageUnlocked(
                    type === 'level' ? oldButtonValue : gameState.currentLevel,
                    type === 'stage' ? oldButtonValue : 1
                );
                if (oldImage) oldImage.setTexture(isLocked ? 'button-gray' : 'button-cyan');
            }
        }

        const newImage = newSelectedButton.getAt(0);
        if (newImage && newImage.postFX) {
            newImage.setTexture('button-violet');
            const glow = newImage.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 24);
            this.activeGlowTweens[type] = this.tweens.add({ targets: glow, outerStrength: 4, yoyo: true, loop: -1, ease: 'sine.inout' });
            this.selectedButtons[type] = newSelectedButton;
            
            if (!isInitialSetup) {
                const shine = newImage.postFX.addShine(1, 0.2, 5);
                this.time.delayedCall(800, () => { if (newImage.postFX) newImage.postFX.remove(shine); });
            }
        } else if (newImage) { // Fallback if postFX pipeline not available
            newImage.setTexture('button-violet');
            this.selectedButtons[type] = newSelectedButton;
        }

        if (type === 'level') {
            gameState.currentLevel = value;
            if (!isInitialSetup) {
                this.stageButtons.forEach(button => button.destroy());
                
                const { width, height } = this.cameras.main;
                this.stageButtons = this.createStageMenu(width * 0.65, height * 0.6);
                this.mainMenuContainer.add(this.stageButtons);
                
                const stageToSelect = this.lastPlayedData.lastStages?.[value] || 1;
                const buttonToSelect = this.stageButtons[stageToSelect - 1];

                if (buttonToSelect && gameState.controller.isStageUnlocked(value, stageToSelect)) {
                    this.updateSelectionEffect('stage', buttonToSelect, stageToSelect, true);
                } else {
                    this.updateSelectionEffect('stage', this.stageButtons[0], 1, true);
                }
            }
        } else if (type === 'stage') {
            gameState.currentStage = value;
        }
    }

    startGame() {
          try {
            const key = `mathGame_${gameState.currentUser.name}_lastPlayed`;
            const lastPlayedRaw = localStorage.getItem(key);
            let lastPlayedData = lastPlayedRaw ? JSON.parse(lastPlayedRaw) : { lastActiveLevel: 1, lastStages: {} };

            lastPlayedData.lastActiveLevel = gameState.currentLevel;
            lastPlayedData.lastStages[gameState.currentLevel] = gameState.currentStage;

            localStorage.setItem(key, JSON.stringify(lastPlayedData));
        } catch (error) {
            console.error('Failed to save last played state on game start.', error);
        }
        
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
            // --- LAUNCH THE LOADER SCENE ---
        this.scene.start('LoaderScene', {
            // Tell it which assets to load for the main game
            assetGroups: ['common', 'standard', 'puzzle', 'shooting'],
            // Tell it which scene to go to after loading
            targetScene: 'GameScene',
            // Pass along the game data
            gameData: {
                mode: 'stage',
                level: gameState.currentLevel,
                stage: gameState.currentStage,
                allowedTables: gameState.controller.levels[gameState.currentLevel - 1]
            }
        });
    }

    startPractice() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
          this.scene.start('LoaderScene', {
            assetGroups: ['common', 'standard'], // Practice mode only needs these
            targetScene: 'PracticeScene',
            gameData: {
                mode: 'practice'
                // PracticeScene will handle picking the table
            }
        });
    }
}

export default StartScreenScene;