// js/questions/ShootingQuestion.js
import { Question } from './Question.js';
import { config, planes } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, shuffle, rand } from '../utils.js';

class ShootingQuestion extends Question {
    constructor(...args) {
        super(...args);
        console.log('ShootingQuestion constructor called with args:', args); // Debug
        if (!this.scene || !(this.scene instanceof Phaser.Scene)) {
            console.error('Invalid or undefined scene in ShootingQuestion constructor. Args:', args);
            throw new Error('Valid Phaser.Scene is required for ShootingQuestion');
        }
        console.log('Scene in constructor:', this.scene); // Debug
        this.missileSpeed = 0.0002;
        this.numTargets = 5;
        this.questions = [];
        this.debug = true;
        this.planes = planes; // Imported from config.js
        this.MissileBattery = null;
        this.shootingArea = null;
        this.questionContainer = null;
        this.duckArea = null;
        this.targets = [];
        this.crosshair = null;
        this.missiles = [];
        this.answerOptions = [];
        this.magazineSize = 6;
        this.remainingBullets = this.magazineSize;
        this.isReloading = false;
        this.reloadTime = 2;
        this.magazineContainer = null;
        this.bulletIcons = [];

             this.handleCollision = null;
        // const graphics = new Phaser.GameObjects.Graphics();
        // const rect=graphics.fillRect(50, 50, 400, 200);
       // this.uiLayer.add(rect);
        // console.log(this.uiLayer);
    }

    startQuestionSet() {
        console.log('startQuestionSet called, scene:', this.scene, 'stage:', gameState.currentStage); // Debug
        if (!this.scene) {
            console.error('Scene is undefined in startQuestionSet');
            throw new Error('Scene is undefined in startQuestionSet');
        }
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
        const fixedB = this.gameState.mode === 'practice' ? this.allowedTables[0] : null;
        this.questions = this.questionGenerator.generateBatch(this.numQuestions, fixedB, this.gameState.currentStage);
        this.currentQuestionIndex = 0;
        this.nextQuestion();
    }
setup() {
        console.log('setup called, scene:', this.scene);
        if (!this.scene) {
            console.error('Scene is undefined in setup');
            throw new Error('Scene is undefined in setup');
        }
        super.setup();
        const { a, b, target } = this.questionData;
        this.gameState.currentA = a;
        this.gameState.currentB = b;
        this.gameState.currentAnswer = target;
//  const graphics = this.scene.make.graphics(); // Use make, as it won't be added to the scene automatically
//         graphics.fillGradientStyle(
//             Phaser.Display.Color.HexStringToColor('#87CEEB').color,
//             Phaser.Display.Color.HexStringToColor('#87CEEB').color,
//             Phaser.Display.Color.HexStringToColor('#A3D5E5').color,
//             Phaser.Display.Color.HexStringToColor('#A3D5E5').color,
//             1
//         );
//         graphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
          // Initialize layers
              this.backgroundLayer = this.scene.add.layer().setDepth(0); // Sky, clouds, farground
        this.midgroundLayer = this.scene.add.layer().setDepth(5);  // Midground mountains & trees
        this.duckLayer = this.scene.add.layer().setDepth(10);       // Planes, missiles, DEBRIS
        this.foregroundLayer = this.scene.add.layer().setDepth(20); // Foreground mountains, trees, ground

        // this.environmentLayer = this.scene.add.layer();
        // this.environmentLayer.setDepth(0)
     
        // this.duckLayer = this.scene.add.layer();
        // this.duckLayer.setDepth(10);
        this.crosshairLayer = this.scene.add.layer();
        this.crosshairLayer.setDepth(100);
        this.uiLayer = this.scene.add.layer().setDepth(50);
        this.uiLayer.setDepth(50);

        // Create environment
        this.createEnvironment();

        // Set up physics world
        

        
this.scene.matter.world.setBounds(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height, 32, false, false, false, true);
// this.scene.matter.world.setBounds(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height, 32, {
//     left: false,    // No left wall
//     right: false,   // No right wall
//     top: false,     // No top wall
//     bottom: true    // Keep the ground
// });
        // Crosshair (scaled)
        this.crosshair = this.scene.add.image(0, 0, 'crosshair').setOrigin(0.5).setVisible(true).setScale(0.5);
        this.crosshairLayer.add(this.crosshair);
        this.scene.input.on('pointermove', (pointer) => {
            this.crosshair.setPosition(pointer.x, pointer.y);
        });

        // Missile battery
        this.MissileBattery = this.scene.add.image(
            (this.scene.cameras.main.width *.45),
            this.scene.cameras.main.height - 30,
            'missilebattery'
        ).setOrigin(0.5, 1).setScale(0.75);
        this.foregroundLayer.add(this.MissileBattery);

        // Magazine
        this.magazineContainer = this.scene.add.container(20, this.scene.cameras.main.height - 50);
        this.bulletIcons = [];
        for (let i = 0; i < this.magazineSize; i++) {
            const bullet = this.scene.add.rectangle(i * 25, 0, 10, 30, 0xFFD700).setStrokeStyle(1, 0xDAA520);
            this.magazineContainer.add(bullet);
            this.bulletIcons.push(bullet);
        }
        this.uiLayer.add(this.magazineContainer);

        // Particle emitters
        this.hitEmitter = this.scene.add.particles(0, 0, 'particle', {
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            lifespan: 1200,
            blendMode: 'ADD',
            scale: { start: 1, end: 0 },
            tint: [0xFFD700, 0xFFA500, 0xFF4500, 0xFFFFFF],
            quantity: 30,
            emitting: false
        });
        this.missEmitter = this.scene.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            lifespan: 700,
            blendMode: 'ADD',
            scale: { start: 1, end: 0 },
            tint: [0xFFFFFF, 0xDDDDDD, 0xAAAAAA],
            quantity: 15,
            emitting: false
        });
        this.shotEmitter = this.scene.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            lifespan: 300,
            blendMode: 'ADD',
            scale: { start: 1, end: 0 },
            tint: [0xFFFF00, 0xFFD700],
            quantity: 5,
            emitting: false
        });
        this.casingEmitter = this.scene.add.particles(0, 0, 'casing', {
            speed: { min: 300, max: 500 },
            angle: { min: 45, max: 60 },
            gravityY: 800,
            lifespan: 1000,
            scale: { start: 1, end: 0 },
            quantity: 1,
            emitting: false
        });
        this.smokeEmitter = this.scene.add.particles(0, 0, 'smoke', {
            speed: { min: 100, max: 300 },
            angle: { min: -10, max: 10 },
            lifespan: 500,
            blendMode: 'NORMAL',
            scale: { start: 0.5, end: 0 },
            tint: 0x808080,
            quantity: 1,
            emitting: false
        });
        this.trailEmitter = this.scene.add.particles(0, 0, 'smoke', {
            speed: { min: 50, max: 100 },
            angle: { min: 170, max: 190 },
            lifespan: 800,
            blendMode: 'NORMAL',
            scale: { start: 0.3, end: 0 },
            tint: 0xFFFFFF,
            alpha: { start: 0.5, end: 0 },
            frequency: 50,
            emitting: false
        });
        this.duckLayer.add([this.hitEmitter, this.missEmitter, this.shotEmitter, this.casingEmitter, this.smokeEmitter, this.trailEmitter]);

            this.debrisEmitter = this.scene.add.particles(0, 0, 'particle', { // 'particle' is a placeholder texture
            lifespan: 2000,
            speed: { min: 150, max: 250 },
            angle: { min: 0, max: 360 },
            gravityY: 300,
            scale: { start: 1, end: 0 },
            blendMode: 'NORMAL',
            emitting: false // IMPORTANT: We will trigger this manually
        });
        this.duckLayer.add(this.debrisEmitter);

        // Question text
        this.questionText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            50,
            `${toBangla(a)} × ${toBangla(b)} = ?`,
            { fontSize: '50px', fill: config.colors.text, fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.uiLayer.add(this.questionText);

        // Spawn targets (planes)
        this.duckSpawner = this.scene.time.addEvent({
            delay: 2000,
            callback: () => {
                console.log('spawnDuck called, targets:', this.targets.length);
                this.spawnDuck();
            },
            callbackScope: this,
            loop: true,
            startAt: 0
        });

        // Input handling
        this.scene.input.on('pointerdown', this.shoot, this);

        // Collision detection
     // --- NEW: BUILT-IN COLLISION DETECTION ---
      this.handleCollision = (event) => {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        const isMissileAndPlane =
            (bodyA.label === 'missile' && bodyB.label === 'plane') ||
            (bodyB.label === 'missile' && bodyA.label === 'plane');

        if (isMissileAndPlane) {
            const planeBody = bodyA.label === 'plane' ? bodyA : bodyB;
            const missileBody = bodyA.label === 'missile' ? bodyA : bodyB;

            const targetSprite = planeBody.gameObject;
            const missileSprite = missileBody.gameObject;

            // Ensure we have valid game objects and the target hasn't already been hit
            if (targetSprite && !targetSprite.hit && missileSprite && missileSprite.active) {

                // --- KEY CHANGE #2: THE TARGET LOCK CHECK ---
                // Only process the hit if the collided plane is the missile's intended target.
                if (missileSprite.targetPlane === targetSprite) {
                    const collisionPoint = pair.collision.supports[0];

                    // Immediately hide and schedule the destruction of the missile
                    missileSprite.setVisible(false);
                    missileSprite.active = false; // Prevent re-triggering
                    if (missileSprite.trailEmitter) {
                        missileSprite.trailEmitter.stop();
                    }
                    this.scene.matter.world.remove(missileBody);
                    this.scene.time.delayedCall(100, () => {
                        if (missileSprite.trailEmitter) missileSprite.trailEmitter.destroy();
                        if (missileSprite) missileSprite.destroy();
                    });

                    // Now, process the successful hit on the correct target.
                    this.processHit(targetSprite, collisionPoint.x, collisionPoint.y);
                }
                // If it's NOT the target, we do nothing. The sensor missile continues on its path.
            }
        }
    });
};

        this.scene.matter.world.on('collisionstart', this.handleCollision);
         if (gameState.timingModel === 'per-question') {
            this.questionTimer = this.scene.time.delayedCall(
                this.timeLimit * 1000*2,
                this.handleTimeUp,
                [],
                this
            );
        }

    }
     // js/questions/ShootingQuestion.js

  // js/questions/ShootingQuestion.js

   createEnvironment() {
        const { width, height } = this.scene.cameras.main;
     


        // --- 1. Static Sky Colors (Bottom Layer) ---
        this.backgroundLayer.add(
            this.scene.add.image(0, 0, 'sky_color_top').setOrigin(0, 0).setDisplaySize(width, height)
        );
        this.backgroundLayer.add(
            this.scene.add.image(0, 0, 'sky_color_1').setOrigin(0, 0).setDisplaySize(width, height)
        );
            // --- 3. Stationary Cloud ---
        // this.environmentLayer.add(
        //     this.scene.add.image(width * 0.5, height * 0.5, 'mid_ground_cloud_1').setOrigin(0.5, 0.5).setAlpha(0.9)
        // );

    const farcloudHeight = this.scene.textures.get('mid_ground_cloud_1').getSourceImage().height;
        // ==============================

        this.scrollingCloudFar = this.scene.add.tileSprite(0, height * 0.5, width, farcloudHeight, 'mid_ground_cloud_1')
            .setOrigin(0, 0.5);
            
        this.scrollingCloudFar.scrollSpeed = 0.04;
        this.backgroundLayer.add(this.scrollingCloudFar);


        
        // Access the texture manager via `this.scene.textures` instead of `this.textures`
        const cloudHeight = this.scene.textures.get('mid_ground_cloud_2').getSourceImage().height;
        // ==============================

        this.scrollingCloud = this.scene.add.tileSprite(0, height * 0.6, width, cloudHeight, 'mid_ground_cloud_2')
            .setOrigin(0, 0.5);
            
        this.scrollingCloud.scrollSpeed = 0.08;
        this.backgroundLayer.add(this.scrollingCloud);


         const groundTexture = this.scene.add.tileSprite(
            0,
            height * 0.8, // Start 80% of the way down the screen
            width,
            height * 0.2, // Cover the bottom 20% of the screen
            'groundcolor' // Your new texture key
        ).setOrigin(0, 0);
        this.foregroundLayer.add(groundTexture);

  
          // --- 4. The ONLY Moving Cloud Layer 

       

        // --- 2. Stationary Mountains (Painted from back to front) ---
        const fargroundMountains = this.scene.add.image(-rand(0,2048-width), height-100, 'farground_mountains').setOrigin(0, 1);
        //   fargroundMountains.setTint(0xcccccc);
        // fargroundMountains.displayWidth = width;
        this.backgroundLayer.add(fargroundMountains);

        const fargroundForestConfig = {
            treeAssets: ['tree1', 'tree2', 'tree3'],
            yRange: {
                start:0 ,
                end:fargroundMountains.height-300
            },
            scaleRange: {
                start: 0.02,
                end: 0.05
            },
            treeCount: 200,
            hazeColor: 0x406a73
        };

        // Pass the configuration to the paintForest method
           this.paintForest(this.backgroundLayer, fargroundMountains, 'farground_mountains', fargroundForestConfig);


    const hazeGraphics = this.scene.make.graphics();

        // Get the dimensions of the mountains we want to cover.
        const hazeWidth = fargroundMountains.displayWidth;
        const hazeHeight = fargroundMountains.displayHeight;
        const hazeColor = 0x6295c6; // The color of the haze (white)
        const maxAlpha = 1;       // The haze intensity at the very bottom (0.0 to 1.0)

        // Loop from top to bottom, drawing thin horizontal lines.
        for (let y = 0; y < hazeHeight; y++) {
            // Calculate the alpha for this line. It will be 0 at the top (y=0)
            // and maxAlpha at the bottom (y=hazeHeight).
            const alpha = (maxAlpha * (y / hazeHeight));
            
            hazeGraphics.fillStyle(hazeColor, alpha);
            hazeGraphics.fillRect(0, y, hazeWidth, 1); // Draw a 1-pixel-high line
        }

        // Add the completed graphics object to the scene, positioning it
        // exactly over the farground mountains.
        this.backgroundLayer.add(
            hazeGraphics.setPosition(fargroundMountains.x, fargroundMountains.y - hazeHeight)
        );

   

        const midgroundMountains = this.scene.add.image(-rand(0,2048-width), height-150, 'midground_mountains').setOrigin(0, 1);
        
        // midgroundMountains.displayWidth = width;
        this.midgroundLayer.add(midgroundMountains);

                // --- PLANT BACKGROUND TREES (SCARCE & SMALL) ---
       const backgroundForestConfig = {
            treeAssets: ['tree1', 'tree2', 'tree3'],
            yRange: {
                start:0 ,
                end:midgroundMountains.height-110
            },
            scaleRange: {
                start: 0.05,
                end: 0.10
            },
            treeCount: 400,
            hazeColor: 0x406a73
        };

        // Pass the configuration to the paintForest method
           this.paintForest(this.foregroundLayer, midgroundMountains, 'midground_mountains', backgroundForestConfig);

        const foregroundMountains = this.scene.add.image(-rand(0,2048-width), height-70, 'foreground_mountains').setOrigin(0, 1);
        // foregroundMountains.displayWidth = width;
        this.foregroundLayer.add(foregroundMountains);

     const foregroundForestConfig = {
            treeAssets: ['tree1', 'tree2', 'tree3'],
            yRange: {
                start:0 ,
                end:foregroundMountains.height-100
            },
            scaleRange: {
                start: 0.15,
                end: 0.5
            },
            treeCount:10,
            hazeColor: 0x406a73
        };

          this.paintForest(this.foregroundLayer, foregroundMountains, 'foreground_mountains', foregroundForestConfig);
       const groundPlantingSurface = this.scene.add.image(0, 0, 'groundcolor')
            .setOrigin(0, 0)
            .setVisible(false); // Make it invisible!
        this.foregroundLayer.add(groundPlantingSurface); // Add it to the scene

  const foregroundBushConfig = {
            treeAssets: ['plents1'],
            yRange: {
                start:0,
                end:groundPlantingSurface.height
            },
            scaleRange: {
                start: 0.05,
                end: 0.1
            },
            treeCount:200,
            hazeColor: 0x406a73
        };

          this.paintForest(this.foregroundLayer, groundPlantingSurface, 'groundcolor', foregroundBushConfig);

        // --- 5. Static Ground (Top Layer) ---
        //The Physics Ground (a simple, invisible rectangle at the very bottom)
        this.ground = this.scene.add.rectangle(500, height-70, width, 200, 0, 0).setOrigin(0, 1);
        this.scene.matter.add.gameObject(this.ground, { isStatic: true });
        this.midgroundLayer.add(this.ground);

        this.clouds = [];
    }
    // js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js

    // js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js

    // js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js

  // js/questions/ShootingQuestion.js

    /**
Procedurally paints a multi-layered forest onto a target image, avoiding transparent areas.
@param {Phaser.GameObjects.Layer} layer - The Layer GameObject to add the trees to.
@param {Phaser.GameObjects.Image} targetImage - The image to plant the trees on.
@param {string} textureKey - The string key of the target image's texture.
@param {object} config - A configuration object to control the forest's appearance.
*/
paintForest(layer, targetImage, textureKey, config = {}) {
const { width, height } = this.scene.cameras.main;
// --- 1. Get Image Bounds ---
// This correctly calculates the world-space rectangle of the entire target image.
const bounds = new Phaser.Geom.Rectangle(
targetImage.x - targetImage.displayWidth * targetImage.originX,
targetImage.y - targetImage.displayHeight * targetImage.originY,
targetImage.displayWidth,
targetImage.displayHeight
);
// --- 2. Configuration (remains the same) ---
const defaultConfig = {
treeAssets: ['tree1', 'tree2', 'tree3'],
yRange: { start: 0.1, end: 1.0 },
scaleRange: { start: 0.05, end: 0.13 },
treeCount: 50,
minSpacing: 10,
disableHaze: false,
hazeColor: 0x406a73,
endColor: 0xffffff
};
const finalConfig = { ...defaultConfig, ...config };
const { treeAssets, yRange, scaleRange, treeCount, minSpacing, disableHaze, hazeColor, endColor } = finalConfig;
const startColorRGB = disableHaze
? Phaser.Display.Color.IntegerToColor(endColor)
: Phaser.Display.Color.IntegerToColor(hazeColor);
const endColorRGB = Phaser.Display.Color.IntegerToColor(endColor);
// --- 3. The Smart Painting Loop ---
const usedPositions = [];
for (let i = 0; i < treeCount; i++) {
let placeX, placeY, scale, tint;
let attempts = 0;

while (attempts < 50) { // Increased attempts for denser scenes
// === CORRECTED LOGIC: ALWAYS PICK A SPOT ON SCREEN FIRST ===
const potentialX = Phaser.Math.RND.between(0, width); // Only pick X on the visible screen
const yProgress = Phaser.Math.RND.realInRange(yRange.start, yRange.end);
const potentialY = bounds.y + bounds.height * yProgress;

// --- NEW VALIDATION STEP ---
 // Check if our chosen on-screen spot is actually within the mountain image's bounds.
 // This prevents trying to plant on empty space if the mountain doesn't fill the screen.
 if (!bounds.contains(potentialX, potentialY)) {
     attempts++;
     continue; // This spot is not on the mountain image, try again.
 }
 
 // Now that we know the point is on the image, assign it.
 placeX = potentialX;
 placeY = potentialY;

 if (usedPositions.some(pos => Phaser.Math.Distance.Between(placeX, placeY, pos.x, pos.y) < minSpacing)) {
     attempts++;
     continue; // Too close to another tree, try again.
 }

 // --- PIXEL CHECK ---
 // This calculation is now guaranteed to be valid because we checked bounds.contains()
 const textureX = Math.floor((placeX - bounds.x) / targetImage.scaleX);
 const textureY = Math.floor((placeY - bounds.y) / targetImage.scaleY);
 
 // Get the alpha value. No need for the frame argument, it defaults correctly.
 const alpha = this.scene.textures.getPixelAlpha(textureX, textureY, textureKey);
 
 if (alpha && alpha > 10) { // Check if alpha is not null and reasonably opaque
     const progress = (placeY - bounds.y) / bounds.height;
     scale = scaleRange.start + (scaleRange.end - scaleRange.start) * progress;
     const colorObj = Phaser.Display.Color.Interpolate.ColorWithColor(startColorRGB, endColorRGB, 100, Math.floor(progress * 100));
     tint = Phaser.Display.Color.GetColor(colorObj.r, colorObj.g, colorObj.b);
     break; // We found a perfect spot!
 }
 attempts++;
}

if (placeX && placeY) {
usedPositions.push({ x: placeX, y: placeY,scale: scale * (rand(90, 110) / 100), tint:tint});

}

}
usedPositions.sort((a, b) => a.y - b.y);
// console.log(usedPositions);
 usedPositions.forEach(point => {
            const treeKey = Phaser.Math.RND.pick(treeAssets);
            const tree = this.scene.add.image(point.x, point.y, treeKey)
                .setOrigin(0.5, 1)
                .setScale(point.scale ) // Add a little random variance
                .setTint(point.tint);
            
            layer.add(tree);
        });
}
//    createEnvironment() {
//         // Sky gradient
//         const graphics = this.scene.make.graphics();
//         graphics.fillGradientStyle(
//             Phaser.Display.Color.HexStringToColor('#87CEEB').color,
//             Phaser.Display.Color.HexStringToColor('#87CEEB').color,
//             Phaser.Display.Color.HexStringToColor('#A3D5E5').color,
//             Phaser.Display.Color.HexStringToColor('#A3D5E5').color,
//             1
//         );
//         graphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
//         console.log('environment created',graphics,this.environmentLayer);

//         this.environmentLayer.add(graphics);

//         // Ground
//         this.ground = this.scene.add.rectangle(
//             0,
//             this.scene.cameras.main.height - 50,
//             this.scene.cameras.main.width,
//             50,
//             0x228B22
//         ).setOrigin(0, 0);
//         this.scene.matter.add.gameObject(this.ground, { isStatic: true });

//         this.environmentLayer.add(this.ground);
        
//                     const farground_mountains = this.scene.add.image(
//                 rand(0, this.scene.cameras.main.width),
//                 rand(0, this.scene.cameras.main.height / 2),
//                 'farground_mountains'
//             ).setScale(1);
            
            
//            this.environmentLayer.add(farground_mountains);


//         // Clouds
//         this.clouds = [];

//         // for (let i = 0; i < 5; i++) {
//         //     const cloud = this.scene.add.image(
//         //         rand(0, this.scene.cameras.main.width),
//         //         rand(0, this.scene.cameras.main.height / 2),
//         //         'cloud'
//         //     ).setScale(0.5);
//         //     cloud.speed = rand(1, 3) / 10;
//         //     this.clouds.push(cloud);
//         //     this.environmentLayer.add(cloud);
//         // }
//     }

    spawnDuck() {
        const activePlanes = this.targets.filter(t => t.active && !t.isStale);

        if (activePlanes.length >= this.numTargets) {
            return;
        }


        // if (this.targets.length >= this.numTargets) {
        //     console.log('Max targets reached:', this.numTargets);
        //     return;
        // }

        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -10 : this.scene.cameras.main.width + 10;

        const y = rand(100, this.scene.cameras.main.height / 2);
        const planeKey = shuffle(this.planes.filter(p => p.includes('plane_')))[0];
        console.log('Spawning plane with key:', planeKey);

        const plane = this.scene.add.sprite(x, y, planeKey);

  // 2. Add the Matter.js body to it
    this.scene.matter.add.gameObject(plane, {
        shape: 'rectangle',
        label: 'plane',
           collisionFilter: {
        group: -1 // This is the key! Objects with the same negative group never collide.
    }
    });
    
    // 3. NOW, scale the sprite. This will scale BOTH the texture and the physics body.
    const newScale = 0.06;
    plane.setScale(newScale);



        if (!fromLeft) plane.flipX = true;
        
        plane.body.ignoreGravity = true;
          // Set ONLY the initial horizontal velocity
    const horizontalSpeed = fromLeft ? rand(2, 4) : -rand(2, 4);
    plane.setVelocityX(horizontalSpeed);

    // --- NEW: Add custom properties for flight behavior ---
    plane.flyTime = rand(0, 1000); // A random start time for the sine wave to vary paths
    plane.flyAmplitude = rand(0.5, 1.5); // How high/low the wave is
    plane.flyFrequency = rand(0.01, 0.03); // How fast the wave is

        // plane.setVelocity(fromLeft ? rand(.05, 0.15) : -rand(0.05, 0.15), Math.random() * 2 - 1);
        // plane.setVelocity(fromLeft ? rand(2, 4) : -rand(2, 4), Math.random() * 2 - 1);
          const correctIsOnScreen = activePlanes.some(p => p.answerValue === this.gameState.currentAnswer);
        const isLastChance = activePlanes.length >= this.numTargets - 1;

        let answerValue;

        if (!correctIsOnScreen && isLastChance) {
            // If the correct answer isn't flying and this is the last chance, force it.
            answerValue = this.gameState.currentAnswer;
        } else {
            // Otherwise, pick randomly from the generated options.
            const options = this.generateOptions(this.gameState.currentAnswer);
            answerValue = options[rand(0, 3)];
        }

        const label = this.scene.add.text(0, 0, toBangla(answerValue), {
            fontSize: '30px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const labelContainer = this.scene.add.container(plane.x, plane.y , [label]);
//    labelContainer.setScale(newScale);


        plane.labelContainer = labelContainer;
        plane.answerValue = answerValue;
        plane.hit = false;
        this.targets.push(plane);

        // Add plane and label container to duckLayer
        this.duckLayer.add([plane, labelContainer]);
    }
 shoot(pointer) {
        if (this.remainingBullets <= 0 || this.isReloading) return;
        this.remainingBullets--;
        if (this.bulletIcons[this.remainingBullets]) this.bulletIcons[this.remainingBullets].destroy();
        if (this.remainingBullets === 0) this.reloadMagazine();

        // const testMissile = this.scene.add.image(
        // this.MissileBattery.x,
        // this.MissileBattery.y - 100,
        // 'missile'
        // ).setScale(1).setOrigin(0.5, 0.5);
        // testMissile.setRotation();


        // Create the missile using the Matter factory for better control
        const missile = this.scene.matter.add.image(
            this.MissileBattery.x,
            this.MissileBattery.y - (this.MissileBattery.height * 0.75), // Adjust spawn position
            'missile'
        ).setScale(1).setOrigin(0.5, 0.5);

        // Configure the physics body
    // missile.setBody({
    //     type: 'rectangle',
    //     width: 40, // Match image width
    //     height: 15 // Match image height
    // }, { label: 'missile' });
       missile.setBody({
            type: 'rectangle',
            width: missile.width * 0.15,
            height: missile.height * 0.15
        }, { label: 'missile' });
 missile.setSensor(true);

        missile.setFrictionAir(0.2);
        missile.setMass(50);
        missile.setFixedRotation(); // We control rotation manually
missile.body.ignoreGravity = true;

        // Set custom properties for our update loop
        missile.ascentTime = 20; // Frames for vertical ascent
        missile.targetPlane = null;

// Set initial rotation and physics body angle to point upward
    missile.setRotation(-Math.PI/2); // Nose up (assuming image nose is up)
    

        // missile.setAngle(0);

        // Find and assign a target
        let closest = null;
        let minDist = 100; // Target lock-on range
        this.targets.forEach(t => {
            // if (!t.active) return;
              if (!t.active || t.hit || t.isStale) return;
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, t.x, t.y);
            if (dist < minDist) {
                minDist = dist;
                closest = t;
            }
        });
        missile.targetPlane = closest;

        // Create and attach the trail emitter
        const trail = this.scene.add.particles(0, 17, 'smoke', {
            speed: { min: 10, max: 30 },
            angle: { min: 80, max: 100 }, // Emits upwards relative to the particle system
            lifespan: 500,
            scale: { start: 0.1, end: 0 },
            blendMode: 'ADD',
            tint: [0xFF8800, 0xFFFF00, 0xFFFFFF], // Fire and smoke colors
            frequency: 50,
        });
        trail.startFollow(missile,0,0);
        missile.trailEmitter = trail; // Store reference for cleanup
        this.duckLayer.add(trail);

        this.missiles.push(missile);
        this.duckLayer.add(missile);
        // this.duckLayer.add(testMissile);
    }


    reloadMagazine() {
        this.isReloading = true;
        this.scene.time.delayedCall(this.reloadTime * 1000, () => {
            this.remainingBullets = this.magazineSize;
            this.isReloading = false;
            this.bulletIcons.forEach(b => b.destroy());
            this.bulletIcons = [];
            for (let i = 0; i < this.magazineSize; i++) {
                const bullet = this.scene.add.rectangle(i * 25, 0, 10, 30, 0xFFD700).setStrokeStyle(1, 0xDAA520);
                this.magazineContainer.add(bullet);
                this.bulletIcons.push(bullet);
            }
        });
    }

    processHit(targetSprite, hitX, hitY) {
        if (!targetSprite || targetSprite.hit) return;
        targetSprite.hit = true;
        const selected = targetSprite.answerValue;
        const correct = selected === this.gameState.currentAnswer;
        const centerX = targetSprite.x;
        const centerY = targetSprite.y;

        // Feedback and scoring
        const points = correct
            ? config.points.correct + this.gameState.streak * config.points.streakBonus
            : config.points.incorrect;
        const feedbackText = correct ? 'সঠিক!' : 'ভুল!';
        if (correct) {
            this.hitEmitter.emitParticleAt(centerX, centerY, 30);
            this.handleCorrect(points, feedbackText);
        } else {
            this.missEmitter.emitParticleAt(centerX, centerY, 15);
            this.handleIncorrect(points, feedbackText);
            if (this.gameState.mode === 'practice') {
                this.gameState.performanceTracker.addProblematic(this.gameState.currentA, this.gameState.currentB);
            }
        }
        this.showFeedbackText(feedbackText, correct ? 'green' : 'red', targetSprite);

        // Target physics
        // targetSprite.body.ignoreGravity = false;

        // targetSprite.setVelocity(0, 0);
        // targetSprite.setAngularVelocity(0.1);
        // const diffX = centerX - hitX;
        // const diffY = centerY - hitY;
        // targetSprite.applyForce({ x: diffX * 0.001, y: diffY * 0.001 });


  // 1. Immediately hide the original plane and its label
  if (targetSprite )
  {
        targetSprite.setVisible(false);
        if (targetSprite.labelContainer)
        {
        targetSprite.labelContainer.setVisible(false);
        }

        // 2. Disable the physics body of the original plane
        targetSprite.body.destroy();

      // 3. Trigger the shatter visual effect.
    this.shatterPlane(targetSprite);
  }

        // 4. A bright flash for impact
        if (correct) {
             this.hitEmitter.emitParticleAt(centerX, centerY, 50); // A bigger burst
        } else {
             this.missEmitter.emitParticleAt(centerX, centerY, 25);
        }
    // 5. Clean up the original (now invisible) sprites after a delay
        this.scene.time.delayedCall(2000, () => {
            if (targetSprite.labelContainer)
            {
            targetSprite.labelContainer.destroy();
            }
            targetSprite.destroy();

            
            this.removeDuck(targetSprite);
        });



        // Animation
        // this.scene.tweens.add({
        //     targets: targetSprite,
        //     alpha: 0,
        //     duration: 1500,
        //     delay: 1000,
        //     onComplete: () => {
        //         targetSprite.destroy();
        //         targetSprite.labelContainer.destroy();
        //         this.removeDuck(targetSprite);
        //     }
        // });
        // this.scene.tweens.add({
        //     targets: targetSprite.labelContainer,
        //     alpha: 0,
        //     scale: 5,
        //     duration: 1400
        // });

        // Progress
        // this.gameState.questionCount++;
        // if (correct) {
        //     this.transitionToNext(null);
        // }
    }

showFeedbackText(text, color, targetSprite) {
        const feedbackLabel = this.scene.add.text(targetSprite.x, targetSprite.y, text, {
            fontSize: '40px',
            fill: color,
            stroke: '#FFFFFF',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.uiLayer.add(feedbackLabel);
        this.scene.tweens.add({
            targets: feedbackLabel,
            y: feedbackLabel.y - 80,
            alpha: 0,
            duration: 1500,
            onComplete: () => feedbackLabel.destroy()
        });
    }

    removeDuck(target) {
        const index = this.targets.indexOf(target);
        if (index > -1) this.targets.splice(index, 1);
    }

    // handleTimeUp() {
    //    // this.callbacks.onCompleteSet('সময় শেষ!', false);
    // }
 // js/questions/ShootingQuestion.js

// js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js

// js/questions/ShootingQuestion.js

// js/questions/ShootingQuestion.js
// js/questions/ShootingQuestion.js


/**
 * Creates a shatter effect by replacing a sprite with physics-enabled, cropped fragments.
 * @param {Phaser.GameObjects.Sprite} plane The original plane sprite to shatter.
 */
shatterPlane(plane) {
    const textureKey = plane.texture.key;
    const frame = plane.frame;

    // Use the plane's actual displayed size for accurate positioning
    const w = plane.displayWidth;
    const h = plane.displayHeight;

    // How many fragments to create (e.g., 2x2 grid = 4 pieces)
    const pieceCount=rand(1,5);
    const piecesX = pieceCount;
    const piecesY = pieceCount;

    // Calculate the size of each piece based on the source texture's frame
    const pieceWidth = frame.width / piecesX;
    const pieceHeight = frame.height / piecesY;

    const fragments = [];

    for (let y = 0; y < piecesY; y++) {
        for (let x = 0; x < piecesX; x++) {
            // Calculate the initial position for this fragment relative to the plane's center
            const offsetX = (x - (piecesX - 1) / 2) * (w / piecesX);
            const offsetY = (y - (piecesY - 1) / 2) * (h / piecesY);
            const fragmentX = plane.x + offsetX;
            const fragmentY = plane.y + offsetY;

            // Create a new physics image for the fragment
            const fragment = this.scene.matter.add.image(fragmentX, fragmentY, textureKey, null, {
                // --- CHANGE #1: Custom physics body that matches the visual piece size ---
                shape: {
                    type: 'rectangle',
                    width: pieceWidth,  // Use the calculated piece width
                    height: pieceHeight // Use the calculated piece height
                },
                // --- CHANGE #2: Collision filter to prevent hitting other planes/fragments ---
                collisionFilter: {
                    group: -2 // A new group just for fragments. They won't hit planes (group -1) or each other.
                },
                restitution: 0.5, // How bouncy it is
                friction: .05,
                frictionAir: .08
            });

            // Set its visual scale to match the original plane
            fragment.setScale(plane.scaleX, plane.scaleY);

            // CROP the visual image to show only its piece of the texture
            fragment.setCrop(
                x * pieceWidth,
                y * pieceHeight,
                pieceWidth,
                pieceHeight
            );

            // Calculate a force vector pointing from the plane's center to the fragment's center
            const forceDirection = new Phaser.Math.Vector2(offsetX, offsetY).normalize();
            const thrust = Phaser.Math.RND.realInRange(0.003, 0.005); // Randomize explosion force

            // Apply the force to send it flying outwards
            fragment.applyForce(forceDirection.scale(thrust));

            // Give it a random spin
            fragment.setAngularVelocity(Phaser.Math.RND.realInRange(-0.1, 0.1));

            // Add to our list for later cleanup
            fragments.push(fragment);
            this.midgroundLayer.add(fragment);
        }
    }

    // After a short delay, fade out and destroy the fragments
    this.scene.tweens.add({
        targets: fragments,
        alpha: { from: 1, to: 0 },
        scale: { from: plane.scale, to: .05 },
        duration: 1000,
        delay: 1500, // Wait 1.5 seconds before starting to fade
        onComplete: () => {
            fragments.forEach(f => f.destroy());
        }
    });
}
      update(time, delta) { // Accept time and delta, good practice
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.scene.cameras.main.width + cloud.width / 2) {
                cloud.x = -cloud.width / 2;
            }
        });

            if (this.scrollingCloud) {
            this.scrollingCloud.tilePositionX += this.scrollingCloud.scrollSpeed;
        }
        
          if (this.scrollingCloudFar) {
            this.scrollingCloudFar.tilePositionX -= this.scrollingCloud.scrollSpeed;
        }
     // --- CORRECTED MISSILE UPDATE LOOP ---
        this.missiles.forEach((missile, index) => {
            if (!missile.active || !missile.body) {
                // Clean up destroyed missiles from the array
                if (missile.trailEmitter) missile.trailEmitter.destroy();
                this.missiles.splice(index, 1);
                return;
            }

            // --- Phase 1: Vertical Ascent ---
            if (missile.ascentTime > 0) {
                const upwardForce = 0.2;
                // Apply force straight up, regardless of rotation
                missile.applyForce(new Phaser.Math.Vector2(0, -upwardForce));
                missile.ascentTime--;
            }
            // --- Phase 2: Homing ---
            else if (missile.targetPlane && missile.targetPlane.active) {
                const targetAngle = Phaser.Math.Angle.Between(
                    missile.x, missile.y,
                    missile.targetPlane.x, missile.targetPlane.y
                );

                // Calculate the shortest angle difference to the target
                const angleDifference = Phaser.Math.Angle.Wrap(targetAngle - missile.rotation);

                // Set angular velocity to turn the missile.
                // This creates a smooth turning motion.
                const turnSpeed = 0.09; // Adjust for how fast the missile turns
                missile.setAngularVelocity(angleDifference * turnSpeed);

                // Apply thrust in the direction the missile is currently facing
                const thrustForce = 0.2; // Adjust for missile speed
                const force = new Phaser.Math.Vector2();
                force.x = Math.cos(missile.rotation) * thrustForce;
                force.y = Math.sin(missile.rotation) * thrustForce;
                missile.applyForce(force);
            }
            // --- Phase 3: No target, fly straight ---
            else {
                 // Continue applying thrust in the current direction
                const thrustForce = 0.1;
                const force = new Phaser.Math.Vector2();
                force.x = Math.cos(missile.rotation) * thrustForce;
                force.y = Math.sin(missile.rotation) * thrustForce;
                missile.applyForce(force);
            }

            // Cleanup off-screen missiles
            if (missile.y < -50 || missile.x < -50 || missile.x > this.scene.cameras.main.width + 50) {
                if (missile.trailEmitter) missile.trailEmitter.destroy();
                missile.destroy();
            }
        });
        

        // --- CONSOLIDATED AND CORRECTED PLANE UPDATE LOOP ---
        if (this.targets)
        {
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const plane = this.targets[i];

            if (!plane.active || !plane.body) {
                this.targets.splice(i, 1);
                continue;
            }

            // Continuous Flying Logic
            plane.flyTime++;
            const verticalVelocity = plane.flyAmplitude * Math.sin(plane.flyTime * plane.flyFrequency);
            plane.setVelocityY(verticalVelocity);
            plane.setVelocityX(plane.body.velocity.x > 0 ? 2: -2);
            // if ( plane.flipX === true)
            // {
            // plane.setVelocityX(-0.9);
            // }
            // else 
            // {
            //     plane.setVelocityX(0.9);
            // }

            // Update label position correctly
             if (plane.labelContainer) {
                plane.labelContainer.x = plane.x;
                // Position the container's center slightly above the plane's center
                plane.labelContainer.y = plane.y - (plane.displayHeight * 0.75); 
            }

            // Cleanup: Remove planes that fly off-screen
            const buffer = 100;
            if (plane.x < -buffer || plane.x > this.scene.cameras.main.width + buffer) {
                if (plane.labelContainer) plane.labelContainer.destroy();
                plane.destroy();
            }
        }
    }

        // --- THIS REDUNDANT LOOP IS NOW REMOVED ---
        // this.targets.forEach(target => {
        //     if (target.labelContainer) {
        //         target.labelContainer.x = target.x;
        //         target.labelContainer.y = target.y - 50;
        //     }
        // });
    }
      handleTimeUp() {
        // this.cleanup(); // Clean the screen of all planes
        this.handleIncorrect(config.points.incorrect, "সময় শেষ!");
        this.transitionToNext();
    }
   nextQuestion() {
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.completeSet();
            return;
        }
        
       
        this.questionData = this.generateQuestionData();
        if (this.currentQuestionIndex==0)
        {
              this.cleanup();
         this.setup();
        }
        else 
        {
             this.Partialcleanup();
             this.updateQuestion();
             //like change the 
        }
        this.currentQuestionIndex++;
    }
// js/questions/ShootingQuestion.js

    Partialcleanup() {
        // 1. Immediately remove any in-flight missiles from the previous question.
        this.missiles.forEach(missile => {
            if (missile.trailEmitter) missile.trailEmitter.destroy();
            if (missile.active) missile.destroy();
        });
        this.missiles = []; // Clear the array

        // 2. Mark all existing, un-hit planes as "stale".
        // They will continue to fly but will become non-interactive.
        this.targets.forEach(target => {
            if (target.active && !target.hit) {
                target.isStale = true;

                // It's good practice to fade out the old answer labels
                if (target.labelContainer) {
                    this.scene.tweens.add({
                        targets: target.labelContainer,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            if (target && target.labelContainer)
                            {
                            target.labelContainer.destroy();
                            target.labelContainer = null; // Clean up reference
                            }
                        }
                    });
                }
            }
        });

        // 3. (Optional but recommended) Briefly pause the spawner to create a rhythm.
        if (this.duckSpawner) {
            this.duckSpawner.paused = true;
            // Resume spawning new planes (with the new answers) after a short delay.
            this.scene.time.delayedCall(500, () => { // 2.5-second pause
                if (this.duckSpawner) {
                   this.duckSpawner.paused = false;
                }
            });
        }
    }
// js/questions/ShootingQuestion.js

    updateQuestion() {
        // Get the new data that was prepared in nextQuestion()
        const { a, b, target } = this.questionData;

        // Update the global game state so new planes and hits are correct
        this.gameState.currentA = a;
        this.gameState.currentB = b;
        this.gameState.currentAnswer = target;

        // Update the question text object that is already on the screen
        this.questionText.setText(`${toBangla(a)} × ${toBangla(b)} = ?`);

        // Reset the question timer if you are using one
        if (this.questionTimer) {
            this.questionTimer.remove();
        }
        if (gameState.timingModel === 'per-question') {
            this.questionTimer = this.scene.time.delayedCall(
                this.timeLimit * 1000 * 2,
                this.handleTimeUp,
                [],
                this
            );
        }
    }

cleanup() {
     super.cleanup(); 
             // Stop creating new planes
        if (this.duckSpawner) {
            this.duckSpawner.remove();
            this.duckSpawner = null;
        }

        // Remove all active planes and missiles immediately
        this.targets.forEach(target => {
            if (target.labelContainer) target.labelContainer.destroy();
            if (target.active) target.destroy();
        });
        this.targets = [];

        this.missiles.forEach(missile => {
            if (missile.active) missile.destroy();
        });
        this.missiles = [];

        // Clean up everything else
        if (this.handleCollision) {
            this.scene.matter.world.off('collisionstart', this.handleCollision);
            this.handleCollision = null;
        }

        this.scene.input.off('pointermove');
        this.scene.input.off('pointerdown');
        if (this.duckSpawner) this.duckSpawner.remove();
        
        // Destroy layers and their contents
        if (this.environmentLayer)
            this.environmentLayer.destroy();
        if (this.duckLayer)
            this.duckLayer.destroy();
        if (this.crosshairLayer)
            this.crosshairLayer.destroy();
        if (this.uiLayer)
            this.uiLayer.destroy();

            if (this.backgroundLayer) this.backgroundLayer.destroy();
     if (this.midgroundLayer) this.midgroundLayer.destroy();
     if (this.duckLayer) this.duckLayer.destroy();
     if (this.foregroundLayer) this.foregroundLayer.destroy();
     if (this.crosshairLayer) this.crosshairLayer.destroy();
     if (this.uiLayer) this.uiLayer.destroy();



        // Reset arrays and references
        this.targets = [];
        this.missiles = [];
        this.bulletIcons = [];
        this.clouds = [];
        this.MissileBattery = null;
        this.crosshair = null;
        this.questionText = null;
        this.magazineContainer = null;
        this.hitEmitter = null;
        this.missEmitter = null;
        this.shotEmitter = null;
        this.casingEmitter = null;
        this.smokeEmitter = null;
        this.trailEmitter = null;

        // super.cleanup();
    }
}

export { ShootingQuestion };