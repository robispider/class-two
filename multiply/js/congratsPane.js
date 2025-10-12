// js/congratsPane.js
import { config } from './config.js';
import { gameState } from './gameState.js';
import { startStage, endGame } from './game.js';

export function showCongratsPane(scene, callback) {
    const pane = scene.add.container(scene.cameras.main.width / 2, scene.cameras.main.height / 2);
    const background = scene.add.rectangle(0, 0, 600, 400, Phaser.Display.Color.HexStringToColor(config.colors.panel).color).setOrigin(0.5);
    pane.add(background);
    const label = scene.add.text(0, -100, "অভিনন্দন! আপনি এই স্টেজ সম্পূর্ণ করেছেন।\n\nপরবর্তী স্টেজে যেতে চান?", {
        fontSize: '30px',
        fill: config.colors.text,
        align: 'center'
    }).setOrigin(0.5);
    pane.add(label);
    const advanceButton = scene.add.rectangle(0, 100, 300, 80, Phaser.Display.Color.HexStringToColor(config.colors.option1).color).setOrigin(0.5);
    const advanceText = scene.add.text(0, 100, "পরবর্তী স্টেজে যান", { fontSize: '30px', fill: config.colors.text }).setOrigin(0.5);
    advanceButton.setInteractive();
    advanceButton.on('pointerdown', () => {
        pane.destroy();
        countdownAnimation(scene, callback, 1);
    });
    pane.add(advanceButton);
    pane.add(advanceText);
    // Add replay and back buttons similarly...
    const replayButton = scene.add.rectangle(0, 190, 300, 80, Phaser.Display.Color.HexStringToColor(config.colors.option2).color).setOrigin(0.5);
    const replayText = scene.add.text(0, 190, "পুনরায় খেলুন", { fontSize: '30px', fill: config.colors.text }).setOrigin(0.5);
    replayButton.setInteractive();
    replayButton.on('pointerdown', () => {
        pane.destroy();
        countdownAnimation(scene, callback, 2);
    });
    pane.add(replayButton);
    pane.add(replayText);
    const backButton = scene.add.rectangle(0, 280, 300, 80, Phaser.Display.Color.HexStringToColor(config.colors.stopButton).color).setOrigin(0.5);
    const backText = scene.add.text(0, 280, "পিছনে", { fontSize: '30px', fill: config.colors.text }).setOrigin(0.5);
    backButton.setInteractive();
    backButton.on('pointerdown', () => {
        pane.destroy();
        endGame(scene);
    });
    pane.add(backButton);
    pane.add(backText);
}

export function countdownAnimation(scene, callback, transitionCode = 4) {
    // Implement countdown with particles and tweens...
    const countdownLabel = scene.add.text(scene.cameras.main.width / 2, scene.cameras.main.height / 2, "৩", {
        fontSize: '200px',
        fill: config.colors.text
    }).setOrigin(0.5).setScale(0);
    scene.tweens.add({
        targets: countdownLabel,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.out'
    });
    // Sequence for 3,2,1,শুরু! with tweens
    scene.time.delayedCall(1000, () => {
        scene.tweens.add({
            targets: countdownLabel,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            onComplete: () => {
                countdownLabel.text = "২";
                scene.tweens.add({
                    targets: countdownLabel,
                    alpha: 1,
                    scale: 1,
                    duration: 300,
                    ease: 'Back.out'
                });
            }
        });
    });
    // Add more delayed calls for 1 and শুরু!
    // At end, call callback
    scene.time.delayedCall(4000, callback);
}