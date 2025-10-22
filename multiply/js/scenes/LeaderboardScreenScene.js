// js/scenes/LeaderboardScreenScene.js
import { toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';

class LeaderboardScreenScene extends Phaser.Scene {
    constructor() {
        super('LeaderboardScreenScene');
    }

    create() {
        const { width, height } = this.scale;

        // --- Background & Title ---
        this.add.rectangle(0, 0, width, height, 0xA3D5E5).setOrigin(0);
        this.add.text(width / 2, height * 0.1, 'লিডারবোর্ড', {
            fontSize: '64px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold',
            stroke: '#FFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        // --- Back Button ---
        const backButton = this.add.text(width - 20, 20, 'পেছনে যান', {
            fontSize: '32px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: '#ffffff',
            backgroundColor: config.colors.stopButton,
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        
        backButton.on('pointerdown', () => this.scene.start('StartScreenScene'));

        // --- Score Fetching and Display ---
        const users = gameState.userManager.getUserList();
        const scores = [];

        users.forEach(user => {
            const performanceKey = `mathGame_${user}_performance`;
            const savedDataRaw = localStorage.getItem(performanceKey);
            let overallHigh = 0; // Default score is 0 for every user

            // --- *** THE FIX IS HERE *** ---
            // First, check if any data string was retrieved from localStorage.
            if (savedDataRaw) {
                try {
                    const performanceData = JSON.parse(savedDataRaw);
                    // Second, safely check if the parsed data has the score property.
                    if (performanceData && performanceData.overallHigh) {
                        overallHigh = performanceData.overallHigh;
                    }
                } catch (error) {
                    console.error(`Could not parse performance data for user: ${user}`, error);
                    // If data is corrupted, the score remains 0.
                }
            }
            // --- *** END OF FIX *** ---
            
            scores.push({ name: user, score: overallHigh });
        });

        // Sort scores from highest to lowest
        scores.sort((a, b) => b.score - a.score);

        // Display the top 10 sorted scores
        const startY = height * 0.25;
        const lineHeight = 50;
        scores.forEach((entry, index) => {
            if (index < 10) { 
                this.add.text(width * 0.2, startY + index * lineHeight, `${toBangla(index + 1)}.`, {
                    fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
                }).setOrigin(1, 0.5);

                this.add.text(width * 0.25, startY + index * lineHeight, entry.name, {
                    fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text
                }).setOrigin(0, 0.5);

                this.add.text(width * 0.8, startY + index * lineHeight, toBangla(entry.score), {
                    fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
                }).setOrigin(1, 0.5);
            }
        });
    }
}

export default LeaderboardScreenScene;