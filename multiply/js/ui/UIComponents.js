// js/ui/UIComponents.js
import { toBangla } from '../utils.js';
import { config } from '../config.js';

/**
 * Creates a modern, glowing radial progress bar for the stopwatch, inspired by the reference image.
 * @param {Phaser.Scene} scene The scene to create the component in.
 * @param {number} x The x position of the container.
 * @param {number} y The y position of the container.
 * @returns {object} An object containing the container and references to updatable graphics/text and geometry.
 */
export function createStopwatchUI(scene, x, y) {
    const height = 90;
    const width = 90;
    const container = scene.add.container(x, y);

    const dialRadius = height * 0.42;
    const dialX = width / 2;
    const dialY = height / 2;
    const lineWidth = 14;

    // 1. The semi-transparent background track for the progress arc
    const track = scene.add.graphics();
    track.lineStyle(lineWidth, 0x000000, 0.2); // Dark, transparent track
    track.beginPath();
    track.arc(dialX, dialY, dialRadius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(270));
    track.strokePath();
    container.add(track);

    // 2. The glowing progress arc (this will be drawn dynamically in the GameScene's update loop)
    const progressArc = scene.add.graphics();
    container.add(progressArc);

    // 3. The small circle "cap" at the end of the progress arc
    const cap = scene.add.circle(dialX, dialY - dialRadius, lineWidth / 2, 0xffffff);
    cap.setStrokeStyle(2, 0xffffff, 0.5);
    container.add(cap);
    
    // 4. Digital time text in the center of the dial
    const timeLabel = scene.add.text(
        dialX,
        dialY,
        `০০`, // We will only show seconds
        {
            fontSize: '32px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold'
        }
    ).setOrigin(0.5);
    container.add(timeLabel);

    container.setSize(width, height);

    // Return all the dynamic parts that need to be updated every frame
    return { container, progressArc, cap, timeLabel, dialX, dialY, dialRadius };
}


/**
 * Creates a modern, glowing horizontal progress bar, inspired by the reference image.
 * @param {Phaser.Scene} scene The scene to create the component in.
 * @param {number} x The x position of the container.
 * @param {number} y The y position of the container.
 * @returns {object} An object containing the main container and a reference to the progressBar graphic.
 */
export function createGameProgressBar(scene, x, y) {
    const height = 35;
    const width = 250;
    const container = scene.add.container(x, y);

    // Background track
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.3); // Dark, transparent background
    bg.fillRoundedRect(0, 0, width, height, 17);
    container.add(bg);
    
    // The glowing progress bar fill (this will be drawn dynamically in the GameScene's update loop)
    const progressBar = scene.add.graphics();
    container.add(progressBar);

    // Label on top
    const label = scene.add.text(width / 2, height / 2, 'গেম অগ্রগতি', {
        fontSize: '18px',
        fontFamily: '"Noto Sans Bengali", sans-serif',
        fill: '#ffffff',
        fontStyle: 'bold',
        // Add a subtle shadow to make the text pop
        shadow: {
            offsetX: 1,
            offsetY: 1,
            color: '#000000',
            blur: 2,
            fill: true
        }
    }).setOrigin(0.5);
    container.add(label);
    
    container.setSize(width, height);

    // Return the dynamic part that needs to be updated
    return { container, progressBar };
}