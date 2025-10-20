// js/scenes/LeaderboardScreenScene.js
import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';

class LeaderboardScreenScene extends Phaser.Scene {
    constructor() {
        super('LeaderboardScreenScene');
    }

    create() {
        // Add background decorations
        createBackgroundDecorations(this, this.cameras.main.width, this.cameras.main.height);

        // Title
        this.add.text(this.cameras.main.width / 2, 50, 'লিডারবোর্ড', {
            fontSize: '40px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Display leaderboard (example: top overall scores)
        let y = 150;
        const spacing = 50;
        // Placeholder for leaderboard data
        const leaderboard = [
            { name: 'প্লেয়ার ১', score: gameState.performanceTracker.data.overallHigh || 0 }
            // Add more entries if integrating with a backend
        ];
        leaderboard.forEach((entry, index) => {
            this.add.text(this.cameras.main.width / 2, y + index * spacing, `${index + 1}. ${entry.name}: ${toBangla(entry.score)}`, {
                fontSize: '30px',
                fill: config.colors.text
            }).setOrigin(0.5);
        });

        // Back Button
        const backButton = this.add.rectangle(this.cameras.main.width / 2, y + leaderboard.length * spacing + spacing, 200, 80, Phaser.Display.Color.HexStringToColor(config.colors.stopButton).color)
            .setOrigin(0.5)
            .setInteractive();
        const backText = this.add.text(this.cameras.main.width / 2, y + leaderboard.length * spacing + spacing, 'পিছনে', {
            fontSize: '30px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        backButton.on('pointerdown', () => {
            this.scene.start('LevelScreenScene');
        });
    }
}

export default LeaderboardScreenScene;