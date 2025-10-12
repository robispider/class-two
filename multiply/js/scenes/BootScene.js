// js/scenes/BootScene.js
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    preload() {
        // Load fonts if needed
    }
    create() {
        this.scene.start('PreloadScene');
    }
}

export default BootScene;