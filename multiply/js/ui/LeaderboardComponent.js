// js/ui/LeaderboardComponent.js

import { toBangla } from '../utils.js';
import { config } from '../config.js';
import { leaderboardManager } from '../LeaderboardManager.js';
import { gameState } from '../gameState.js';

/**
 * Formats seconds into a MM:SS string.
 * @param {number} seconds - The total seconds.
 * @returns {string} The formatted time string.
 */
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return toBangla('০০:০০');
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const paddedMins = String(mins).padStart(2, '0');
    const paddedSecs = String(secs).padStart(2, '0');
    return `${toBangla(paddedMins)}:${toBangla(paddedSecs)}`;
}


export class LeaderboardComponent {

    constructor(scene) {
        this.scene = scene;
        this.modalGroup = null;
    }

    show(options = {}) {
        if (this.modalGroup) return;

        const { level, stage } = options;
        if (!level || !stage) {
            console.error("LeaderboardComponent.show() requires a level and stage.");
            return;
        }

        const { width, height } = this.scene.cameras.main;
        this.modalGroup = this.scene.add.group();
        
        const modalWidth = 750;
        const modalHeight = 580;

        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000, 0.7).setOrigin(0).setInteractive();
        
        const panel = this.scene.add.graphics()
            .fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.95)
            .fillRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, 32)
            .lineStyle(8, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 1)
            .strokeRoundedRect(width / 2 - modalWidth / 2, height / 2 - modalHeight / 2, modalWidth, modalHeight, 32);
            
        const closeButton = this.scene.add.text(width / 2 + modalWidth / 2 - 40, height / 2 - modalHeight / 2 + 40, 'X', {
            fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', backgroundColor: config.colors.stopButton, padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const titleText = `লিডারবোর্ড: লেভেল ${toBangla(level)} - স্টেজ ${toBangla(stage)}`;
        const title = this.scene.add.text(width / 2, height / 2 - modalHeight / 2 + 50, titleText, {
            fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFD700', fontStyle: 'bold', stroke: config.colors.panelBorder, strokeThickness: 6
        }).setOrigin(0.5);
        
        const star1 = this.scene.add.image(title.x - title.width / 2 - 40, title.y, 'star-icon').setScale(0.8).setAngle(-15);
        const star2 = this.scene.add.image(title.x + title.width / 2 + 40, title.y, 'star-icon').setScale(0.8).setAngle(15);
        
        this.modalGroup.addMultiple([overlay, panel, title, star1, star2, closeButton]);

        const headerY = height / 2 - modalHeight / 2 + 110;
        const headerStyle = { fontSize: '20px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' };

        // --- *** THE FIX IS HERE *** ---
        // First, create the header text objects.
        const rankHeader = this.scene.add.text(width / 2 - 280, headerY, 'ক্রম', headerStyle).setOrigin(0.5, 0.5);
        const nameHeader = this.scene.add.text(width / 2 - 200, headerY, 'খেলোয়াড়', headerStyle).setOrigin(0.5, 0.5);
        const scoreHeader = this.scene.add.text(width / 2 , headerY, 'স্কোর', headerStyle).setOrigin(0.5, 0.5);
      
        // const timeHeader = this.scene.add.text(width / 2 + 270, headerY, 'সময়', headerStyle).setOrigin(0.5, 0.5);
        const timeHeader = this.scene.add.text(width / 2 + 90 , headerY, 'সময়কাল', headerStyle).setOrigin(0.5, 0.5);
          const dateHeader = this.scene.add.text(width /2 + 230, headerY, 'তারিখ ও সময়', headerStyle).setOrigin(0.5, 0.5);

        // Second, add all of them to the modalGroup so they get managed correctly.
        this.modalGroup.addMultiple([rankHeader, nameHeader, scoreHeader,  timeHeader,dateHeader]);
        // --- *** END OF FIX *** ---

        const startY = headerY + 50;
        
        const topScores = leaderboardManager.getScores(level, stage);
        const currentUser = gameState.currentUser;

        if (topScores.length === 0) {
            const noScoresText = this.scene.add.text(width/2, height/2, "এখনো কোনো স্কোর নেই!", {
                 fontSize: '28px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text
            }).setOrigin(0.5);
            this.modalGroup.add(noScoresText);
        } else {
            topScores.forEach((entry, index) => {
                const yPos = startY + index * 48;
                
                const isCurrentUser = entry.user === currentUser;
                let bgColor = (index % 2 === 0) ? 0x000000 : 0x333333;
                if (isCurrentUser) {
                    bgColor = 0x5a2d75;
                }
                const rowBg = this.scene.add.rectangle(width / 2, yPos, modalWidth - 50, 44, bgColor, 0.1).setOrigin(0.5);
                 const rankObjects = [];

                let rankIcon;
                if (index === 0) {
                    rankIcon = this.scene.add.image(width / 2 - 320, yPos, 'medal-gold').setScale(0.5);
                } else if (index === 1) {
                    rankIcon = this.scene.add.image(width / 2 - 320, yPos, 'medal-silver').setScale(0.5);
                } else if (index === 2) {
                    rankIcon = this.scene.add.image(width / 2 - 320, yPos, 'medal-bronze').setScale(0.5);
                } else {
                    // rankIcon = this.scene.add.image(width / 2 - 320, yPos, 'star-icon').setScale(0.5);
                    // this.scene.add.text(rankIcon.x, yPos, toBangla(index + 1), { fontSize: '18px', fill: '#5C2626', fontStyle: 'bold' }).setOrigin(0.5);
                     rankIcon = this.scene.add.image(width / 2 - 320, yPos, 'star-cyan')
                        .setScale(0.5);
                        // .setTint(0xCCCCCC); // Apply a light gray (steel) tint

                   
                }
                      const rankText = this.scene.add.text(rankIcon.x+40, yPos, toBangla(index + 1), { fontSize: '18px', fill: '#5C2626', fontStyle: 'bold' }).setOrigin(0.5);
                    
                    // Add BOTH objects to the temporary array
                    rankObjects.push(rankIcon, rankText);

               
                 const entryStyle = { fontSize: '22px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text };
                
                const nameText = this.scene.add.text(width / 2 - 240, yPos, entry.user.name, entryStyle).setOrigin(0, 0.5);
                const scoreText = this.scene.add.text(width / 2 + 30, yPos, toBangla(entry.score), { ...entryStyle, fontStyle: 'bold' }).setOrigin(1, 0.5);

                   const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const formattedTimeOfDay = timeString.replace('PM', 'পিএম').replace('AM', 'এএম');
                const fullDateTimeString = `${toBangla(formattedDate)}  ${toBangla(formattedTimeOfDay)}`;
                // const formattedTime = timeString.replace('PM', 'পিএম').replace('AM', 'এএম');
                 let        formattedTimeTaken="-";
console.log(entry.timeTaken);
                if (entry.timeTaken!=undefined && entry.timeTaken>0)
                {
                       
                    formattedTimeTaken = `${formatTime(entry.timeTaken)}`;
                }
 
                // const dateText = this.scene.add.text(width / 2 + 200, yPos, toBangla(formattedDate), { ...entryStyle, fontSize: '20px' }).setOrigin(1, 0.5);
                // const timeText = this.scene.add.text(width / 2 + 330, yPos, toBangla(formattedTime), { ...entryStyle, fontSize: '20px' }).setOrigin(1, 0.5);
                       const durationText = this.scene.add.text(width / 2 + 120, yPos, formattedTimeTaken, { ...entryStyle, fontSize: '20px' }).setOrigin(1, 0.5);
                const dateTimeText = this.scene.add.text(width / 2 + 320, yPos, fullDateTimeString, { ...entryStyle, fontSize: '14px' }).setOrigin(1, 0.5);
                
                const rowContainer = this.scene.add.container(0, 0, [rowBg, ...rankObjects, nameText, scoreText, durationText, dateTimeText]);
                rowContainer.setAlpha(0).setX(-width);
                
                this.scene.tweens.add({
                    targets: rowContainer,
                    x: 0,
                    alpha: 1,
                    duration: 500,
                    ease: 'Cubic.easeOut',
                    delay: 100 + index * 80
                });

                this.modalGroup.add(rowContainer);
            });
        }
        
        this.modalGroup.setDepth(500);

        closeButton.on('pointerdown', () => this.destroy());
        overlay.on('pointerdown', () => this.destroy());
    }

    destroy() {
        if (this.modalGroup) {
            this.modalGroup.destroy(true);
            this.modalGroup = null;
        }
    }
}