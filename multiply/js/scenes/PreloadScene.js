// js/scenes/PreloadScene.js
import { planes } from '../config.js';
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }
    preload() {
        // Load all assets: fruitvegeset.png, planes, openbox.png, closebox.png, puzzel1.jpg, crowfly.png, missilebattery.png, missile.png, etc.
        this.load.image('fruitvegeset', 'assets/fruitvegeset.png');
        // Load planes
        planes.forEach(plane => this.load.image(plane, `assets/${plane}`));
        this.load.image('openbox', 'assets/openbox.png');
        this.load.image('closebox', 'assets/closebox.png');
        this.load.image('puzzel1', 'assets/puzzel1.jpg');
        this.load.image('crowfly', 'assets/crowfly.png');
        // Assume particle textures like 'particle', 'smoke', 'casing', 'cloud', 'crosshair'
        this.load.image('particle', 'assets/particle.png');
        this.load.image('smoke', 'assets/smoke.png');
        this.load.image('casing', 'assets/casing.png');
        this.load.image('cloud', 'assets/cloud.png');
        this.load.image('crosshair', 'assets/crosshair.png');
        this.load.image('missilebattery', 'assets/missilebattery.png');
        this.load.image('missile', 'assets/missile.png');
        // Load other assets as needed
    }
    create() {
        this.scene.start('StartScreenScene');
    }
}

export default PreloadScene;