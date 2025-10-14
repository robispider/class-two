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
 this.load.image('groundcolor',"assets/groundcolor.png");

        this.load.image('tree1',"assets/tree/tree1.png");
        this.load.image('tree2',"assets/tree/tree2.png");
        this.load.image('tree3',"assets/tree/tree3.png");
        this.load.image('plents1',"assets/tree/plents1.png");



        this.load.image('farground_cloud_1',"assets/sky_background/parallax_parts/farground_cloud_1.png");
        this.load.image('farground_cloud_2',"assets/sky_background/parallax_parts/farground_cloud_2.png");
        this.load.image('mid_ground_cloud_1',"assets/sky_background/parallax_parts/mid_ground_cloud_1.png");
        this.load.image('mid_ground_cloud_2',"assets/sky_background/parallax_parts/mid_ground_cloud_2.png");
        
        this.load.image('sky_color_top',"assets/sky_background/parallax_parts/sky_color_top.png");
        this.load.image('sky_color_1',"assets/sky_background/parallax_parts/sky_color.png");
        this.load.image('farground_mountains',"assets/sky_background/parallax_parts/mountain_with_hills/farground_mountains.png");
        this.load.image('foreground_mountains',"assets/sky_background/parallax_parts/mountain_with_hills/foreground_mountains.png");
        this.load.image('midground_mountains',"assets/sky_background/parallax_parts/mountain_with_hills/midground_mountains.png");

    }
    create() {
        this.scene.start('StartScreenScene');
    }
}

export default PreloadScene;