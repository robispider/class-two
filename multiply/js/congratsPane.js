// js/congratsPane.js
import { config } from './config.js';
import { gameState } from './gameState.js';
import { toBangla } from './utils.js';
import { startStage, endGame } from './game.js';

/**
 * Creates a visually appealing, animated button with text.
 */
function createButton(scene, x, y, text, buttonKey, onClick) {
    const buttonContainer = scene.add.container(x, y);

    const buttonImage = scene.add.image(0, 0, buttonKey)
        .setScale(0.35)
        .setInteractive({ useHandCursor: true });

    const buttonText = scene.add.text(0, 0, text, {
        fontSize: '32px',
        fontFamily: '"Noto Sans Bengali", sans-serif',
        fill: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#333',
        strokeThickness: 3
    }).setOrigin(0.5);

    buttonContainer.add([buttonImage, buttonText]);
    buttonContainer.setSize(buttonImage.displayWidth, buttonImage.displayHeight);

    buttonImage.on('pointerdown', () => {
        scene.sound.play('button-click');
        onClick();
    });

    buttonImage.on('pointerover', () => {
        scene.sound.play('button-hover', { volume: 0.7 });
        scene.tweens.add({ targets: buttonContainer, scale: 1.1, duration: 150, ease: 'Sine.easeInOut' });
    });

    buttonImage.on('pointerout', () => {
        scene.tweens.add({ targets: buttonContainer, scale: 1, duration: 150, ease: 'Sine.easeInOut' });
    });

    return buttonContainer;
}


/**
 * A helper function to fade out the pane and overlay, then execute a callback.
 */
function transitionOut(scene, pane, overlay, onCompleteCallback) {
    scene.tweens.add({
        targets: [pane, overlay],
        alpha: 0,
        duration: 300,
        onComplete: () => {
            pane.destroy();
            overlay.destroy();
            if (onCompleteCallback) {
                onCompleteCallback();
            }
        }
    });
}


/**
 * Displays a celebratory "Congratulations" pane after completing a stage.
 */
export function showCongratsPane(scene, callback) {
    const overlay = scene.add.rectangle(0, 0, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.7)
        .setOrigin(0, 0)
        .setAlpha(0);
    scene.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

    const pane = scene.add.container(scene.cameras.main.width / 2, scene.cameras.main.height / 2);
    pane.setDepth(400);

    scene.sound.play('applause', { volume: 0.8 });

    const background = scene.add.graphics();
    background.fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.95);
    background.lineStyle(8, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 1);
    background.fillRoundedRect(-350, -250, 700, 500, 32);
    background.strokeRoundedRect(-350, -250, 700, 500, 32);
    pane.add(background);

    const title = scene.add.text(0, -180, "চমৎকার!", {
        fontSize: '64px',
        fontFamily: '"Noto Sans Bengali", sans-serif',
        fill: '#FFD700',
        fontStyle: 'bold',
        stroke: config.colors.panelBorder,
        strokeThickness: 6
    }).setOrigin(0.5);
    pane.add(title);

    const label = scene.add.text(0, -90, "আপনি এই স্টেজ সম্পূর্ণ করেছেন!\nএখন কী করতে চান?", {
        fontSize: '30px',
        fontFamily: '"Noto Sans Bengali", sans-serif',
        fill: config.colors.text,
        align: 'center',
        wordWrap: { width: 500 }
    }).setOrigin(0.5);
    pane.add(label);
    
    // --- *** NEW, CORRECTED BUTTON LOGIC *** ---

    // --- 1. NEXT STAGE Button ---
    const advanceButton = createButton(scene, 0, 30, "পরবর্তী স্টেজ", 'button-green', () => {
        let nextStage = gameState.currentStage + 1;
        let nextLevel = gameState.currentLevel;
        const stagesPerLevel = gameState.controller.stagesPerLevel;

        // Check if we need to advance to the next level
        if (nextStage > stagesPerLevel) {
            nextStage = 1;
            nextLevel += 1;
        }

        // Transition immediately WITHOUT a countdown
        transitionOut(scene, pane, overlay, () => {
            // CRITICAL: Update the global state *before* starting the new stage
            gameState.currentStage = nextStage;
            gameState.currentLevel = nextLevel;

            const allowedTables = gameState.controller.levels[nextLevel - 1];
            startStage(scene, gameState.mode, nextLevel, allowedTables);
        });
    });

    // --- 2. REPLAY Button ---
    const replayButton = createButton(scene, 0, 120, "আবার খেলুন", 'button-orange', () => {
        // Transition and then show the countdown
        transitionOut(scene, pane, overlay, () => {
            countdownAnimation(scene, () => {
                // Re-start the SAME stage after the countdown finishes
                startStage(scene, gameState.mode, gameState.currentLevel, gameState.controller.levels[gameState.currentLevel - 1]);
            });
        });
    });

    // --- 3. MENU Button ---
    const backButton = createButton(scene, 0, 210, "মেনু", 'button-red', () => {
        transitionOut(scene, pane, overlay, () => {
            endGame(scene);
        });
    });

    pane.add([advanceButton, replayButton, backButton]);

    // --- NEW: Handle End of Game ---
    // Check if the player has finished the very last stage of the last level
    const stagesPerLevel = gameState.controller.stagesPerLevel;
    const isLastStageOfLevel = gameState.currentStage >= stagesPerLevel;
    const isLastLevel = gameState.currentLevel >= gameState.controller.levels.length;

    if (isLastStageOfLevel && isLastLevel) {
        // Disable the "Next Stage" button if there's nowhere to advance to
        advanceButton.setAlpha(0.5);
        advanceButton.getAt(0).disableInteractive(); // Disable pointer events on the image
    }


    // --- Entrance Animation ---
    pane.setScale(0);
    scene.tweens.add({
        targets: pane,
        scale: 1,
        duration: 500,
        ease: 'Elastic.easeOut',
        easeParams: [1.1, 0.7]
    });

    // --- Celebratory Particle Effect ---
    const emitter = scene.add.particles(0, 0, 'particle', {
        x: pane.x,
        y: pane.y,
        speed: { min: -400, max: 400 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 800,
        gravityY: 100,
        quantity: 100,
        emitting: false
    });
    emitter.setDepth(401);
    emitter.explode();
}

/**
 * A robust, tween-based countdown animation.
 */
export function countdownAnimation(scene, onCompleteCallback) {
    const { width, height } = scene.cameras.main;

    const countdownText = scene.add.text(width / 2, height / 2, "", {
        fontSize: '250px',
        fontFamily: '"Noto Sans Bengali", sans-serif',
        fill: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 12
    }).setOrigin(0.5).setAlpha(0).setScale(0.5).setDepth(500);

    const playTickSound = () => scene.sound.play('button-click', { volume: 0.9 });
    const playGoSound = () => scene.sound.play('applause', { volume: 0.6, detune: 500 });

    scene.tweens.chain({
        targets: countdownText,
        onComplete: () => {
            countdownText.destroy();
            if(onCompleteCallback) onCompleteCallback();
        },
        tweens: [
            {
                onStart: () => { countdownText.setText(toBangla(3)); playTickSound(); },
                alpha: 1,
                scale: 1,
                duration: 400,
                ease: 'Back.easeOut'
            },
            {
                alpha: 0,
                scale: 0.5,
                duration: 400,
                ease: 'Back.easeIn',
                delay: 400
            },
            {
                onStart: () => { countdownText.setText(toBangla(2)); playTickSound(); },
                alpha: 1,
                scale: 1,
                duration: 400,
                ease: 'Back.easeOut'
            },
            {
                alpha: 0,
                scale: 0.5,
                duration: 400,
                ease: 'Back.easeIn',
                delay: 400
            },
            {
                onStart: () => { countdownText.setText(toBangla(1)); playTickSound(); },
                alpha: 1,
                scale: 1,
                duration: 400,
                ease: 'Back.easeOut'
            },
            {
                alpha: 0,
                scale: 0.5,
                duration: 400,
                ease: 'Back.easeIn',
                delay: 400
            },
            {
                onStart: () => {
                    countdownText.setText("শুরু!");
                    countdownText.setFontSize('200px').setColor('#00FF00');
                    playGoSound();
                },
                alpha: 1,
                scale: 1.2,
                duration: 500,
                ease: 'Elastic.easeOut'
            },
            {
                alpha: 0,
                scale: 0.5,
                duration: 400,
                ease: 'Power2',
                delay: 600
            }
        ]
    });
}