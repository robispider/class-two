// js/ui/Stopwatch.js
import { toBangla } from '../utils.js';
import { config } from '../config.js';

export class Stopwatch {
    constructor(scene, x, y) {
        this.scene = scene;

        // --- State Properties ---
        this.timerEvent = null;
        this.timeLimit = 0;
        this.currentColor = 0xffffff; // Holds the current color for the emitter

        // --- Create UI Components ---
        this._createStopwatchUI(scene, x, y);
        this._createGameProgressBar(scene, x, y);
    }

    /**
     * Creates the modern, glowing radial progress bar for the stopwatch.
     * @private
     */
    _createStopwatchUI(scene, x, y) {
        const height = 60;
        const width = 60;
        this.stopwatchContainer = scene.add.container(x, y);

        const dialRadius = height * 0.42;
        const dialX =0;// width / 2;
        const dialY =0;// height / 2;
        const lineWidth = 14;

        // The dark, semi-transparent background track
        const track = scene.add.graphics();
        track.lineStyle(lineWidth, 0x000000, 0.2);
        track.arc(dialX, dialY, dialRadius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(270), false);
        track.strokePath();
        this.stopwatchContainer.add(track);

        // The graphics object that will draw the colored progress arc
        this.progressArc = scene.add.graphics();
        this.stopwatchContainer.add(this.progressArc);

        // The moving cap at the end of the arc
        this.cap = scene.add.circle(dialX, dialY - dialRadius, lineWidth / 2, 0xffffff);
        this.cap.setStrokeStyle(2, 0xffffff, 0.5);
        this.stopwatchContainer.add(this.cap);
        
        // The text label showing remaining seconds
        this.timeLabel = scene.add.text(dialX, dialY, `০০`, {
            fontSize: '26px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.stopwatchContainer.add(this.timeLabel);

        // Store geometry for use in the update loop
        this.stopwatchGeom = { dialX, dialY, dialRadius };

        // --- CORRECTED Emitter Creation ---
        // Ensure you have loaded 'flarewatch' in your PreloadScene
        this.capemitter = scene.add.particles(0, 0, 'flarewatch', {
            frequency: 200,
            lifespan:3000,
            scale: { start: 0.08, end: 0.02 },
                  speed: { min: 1, max: 3 },
                angle: {max:-80,min:90},

            blendMode: 'ADD',
            // Use an onEmit callback to set the particle's tint dynamically
            onEmit: (particle) => {
                particle.tint = this.currentColor;
            }
        });
         this.hsv = Phaser.Display.Color.HSVColorWheel();
        this.i = 0;
        // Make the emitter follow the cap object automatically
        this.capemitter.startFollow(this.cap);
        this.stopwatchContainer.add(this.capemitter);
    }

    /**
     * Creates the modern, glowing horizontal progress bar.
     * @private
     */
    _createGameProgressBar(scene, x, y) {
        const height = 35;
        const width = 150;
        // Position the progress bar container centered below the stopwatch
        const progressBarX = x + 30;
        const progressBarY = y -25;
        
        this.progressBarContainer = scene.add.container(progressBarX, progressBarY);

        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.3);
        bg.fillRoundedRect(0, 0, width, height, 17);
        this.progressBarContainer.add(bg);
        
        this.progressBar = scene.add.graphics();
        this.progressBarContainer.add(this.progressBar);

        const label = scene.add.text(width / 2, height / 2, 'গেম অগ্রগতি', {
            fontSize: '18px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#ffffff', fontStyle: 'bold',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setOrigin(0.5);
        this.progressBarContainer.add(label);
    }

    // --- PUBLIC METHODS ---

    /**
     * Starts a new timer event for the stopwatch.
     * @param {number} duration - The duration of the timer in seconds.
     * @param {function} onComplete - The callback function to execute when the timer finishes.
     */
    start(duration, onComplete) {
        this.stop(); // Stop any previous timer
        this.timeLimit = duration;
        
        // --- FIXED Callback Logic ---
        this.timerEvent = this.scene.time.addEvent({
            delay: duration * 1000,
            // The callback is an anonymous function that handles cleanup and then calls the original onComplete
            callback: () => {
                this.stop(); // Stop the emitter
                if (onComplete) {
                    onComplete();
                }
            },
            callbackScope: this.scene
        });
        const lifespan=Math.min(duration*150,15*150);
        if (this.capemitter) {
            this.capemitter.setParticleLifespan(lifespan);
            this.capemitter.start();
        }
    }

    /** Stops and clears the current timer event and particle emitter. */
    stop() {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }
        if (this.capemitter) {
            this.capemitter.stop();
        }
    }
   /**
     * Stops the timer and returns the time elapsed since it started.
     * This is essential for calculating time-based scoring bonuses.
     * @returns {number} The elapsed time in seconds. Returns 0 if no timer was active.
     */
    stopAndGetElapsedTime() {
        if (!this.timerEvent) {
            return 0; // Return 0 if the timer wasn't running
        }

        // 1. Get the elapsed time BEFORE destroying the timer event
        const elapsedSeconds = this.timerEvent.getElapsedSeconds();

        // 2. Use the existing stop() method to perform all cleanup
        this.stop();

        // 3. Return the captured value
        return elapsedSeconds;
    }
     /**
     * NEW METHOD: Gets the current elapsed time of the timer *without* stopping it.
     * Useful for logging events that don't end the question.
     * @returns {number} The elapsed time in seconds.
     */
    getElapsedTime() {
        if (this.timerEvent) {
            return this.timerEvent.getElapsedSeconds();
        }
        return 0;
    }
    /**
     * Updates the visual representation of the game progress bar.
     * @param {number} current - The current question number.
     * @param {number} total - The total number of questions in the session.
     */
    updateGameProgress(current, total) {
        if (!this.progressBar) return;

        const progress = Phaser.Math.Clamp(current / total, 0, 1);
        const barWidth = 240; // Inner width
        const barHeight = 25; // Inner height

        this.progressBar.clear();
        this.progressBar.fillGradientStyle(0x80F2FF, 0x80F2FF, 0x00A2FF, 0x00A2FF, 1);
        this.progressBar.fillRoundedRect(5, 5, barWidth * progress, barHeight, 12);
    }

    /** This method should be called every frame from the scene's main update loop. */
    update() {
        if (!this.timerEvent || !this.progressArc) return;

        const elapsed = this.timerEvent.getElapsedSeconds();
        const remaining = Math.max(0, this.timeLimit - elapsed);
        const progress = elapsed / this.timeLimit;

        this.timeLabel.setText(`${toBangla(Math.ceil(remaining)).padStart(2, '০')}`);

        const { dialX, dialY, dialRadius } = this.stopwatchGeom;
        this.progressArc.clear();

        // --- CORRECTED Tint Logic ---
        // Interpolate color and store it in a property for the emitter to use
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0x4caf50), // Green
            Phaser.Display.Color.ValueToColor(0xff0000), // Red
            100, progress * 100
        );
        this.currentColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        this.progressArc.lineStyle(14, this.currentColor, 1);
        this.progressArc.beginPath();
        this.progressArc.arc(dialX, dialY, dialRadius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + progress * 360));
        this.progressArc.strokePath();

        // Update the cap's position. The emitter will follow automatically.
        const capAngle = Phaser.Math.DegToRad(-90 + progress * 360);
        this.cap.x = dialX + Math.cos(capAngle) * dialRadius;
        this.cap.y = dialY + Math.sin(capAngle) * dialRadius;
        this.cap.setFillStyle(this.currentColor);

        // this.i++;

        // if (this.i === 360)
        // {
        //     this.i = 0;
        // }

        // this.capemitter.particleTint = this.hsv[this.i].color;

    }

    /** Destroys all UI components created by this class. */
    destroy() {
        this.stop();
        if (this.stopwatchContainer) this.stopwatchContainer.destroy();
        if (this.progressBarContainer) this.progressBarContainer.destroy();
    }
}