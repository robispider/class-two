

import { Question } from "./questionBase.js";

import zim from "https://zimjs.org/cdn/018/zim_physics.js";
// import zim from "https://zimjs.org/cdn/018/zim_game";
// import zim from "https://zimjs.org/cdn/00/zim_physics";
import { gameState, config } from "./main.js";
import { toBangla, shuffle, rand } from "./utils.js";
import { createStopwatch } from "./stopwatch.js"; // Import the stopwatch creator

// google gemini
export class ShootingQuestion extends Question {
    constructor(...args) {
        super(...args);
this.SPRITE_SHEET_FACES_RIGHT = false; 
        // Game settings
        this.missileSpeed = 5; // Set a default speed (pixels per tick)
        this.numTargets = 5; // Total number of targets on screen at once
        this.questions = [];
        this.debug=true;
        this.planes=[];
        this.MissileBattery=null;
        // ZIM objects
        this.shootingArea = null;
        this.questionContainer = null;
        this.duckArea=null;
        this.targets = [];
        this.crosshair = null;
        this.physics = null;
        this.duckSpawner = null;
        this.answerOptions = [];
        this.stopwatch = null; // Add stopwatch property

        this.timeLimit=30;
        // Magazine settings
        this.magazineSize = 6;
        this.remainingBullets = this.magazineSize;
        this.isReloading = false;
        this.reloadTime = 2; // seconds
        this.magazineContainer = null;
        this.bulletIcons = [];
        this.casingEmitter = new zim.Emitter({
            obj: new zim.Rectangle(10, 20, "#DAA520", "#B8860B", 2),
            num: 1,
            life: 1,
            force: { min: 3, max: 5 },
            angle: { min: 45, max: 60 }, // Eject upwards to the right
            gravity: 8,
            wind: { min: 2, max: 5 },
            rotation: { min: -180, max: 180 },
            shrink: false,
            startPaused: true
        });
        

        // Emitters for visual feedback
        this.hitEmitter = new zim.Emitter({
            obj: new zim.Circle(10, ["#FFD700", "#FFA500", "#FF4500", "#FFFFFF"]),
            num: 30, // More particles for impact
            life: 1.2,
            force: 12,
            gravity: 6,
            wind: { min: -8, max: 8 },
            shrink: true,
            startPaused: true
        });

        this.missEmitter = new zim.Emitter({
            obj: new zim.Circle(6, ["#FFFFFF", "#DDDDDD", "#AAAAAA"]),
            num: 15,
            life: 0.7,
            force: 7,
            gravity: 3,
            shrink: true,
            startPaused: true
        });

        this.shotEmitter = new zim.Emitter({
            obj: new zim.Circle(4, ["#FFFF00", "#FFD700"]),
            num: 5,
            life: 0.3,
            force: 3,
            shrink: true,
            startPaused: true
        });
    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;

        // Generate all questions for the stage at once
        this.questionGenerator.setAllowedTables(this.allowedTables);
        const fixedB = this.gameState.mode === "practice" ? this.allowedTables[0] : null;
        this.questions = this.questionGenerator.generateBatch(this.numQuestions, fixedB, this.gameState.currentStage);
        this.currentQuestionIndex = 0;

        this.nextQuestion();
    }

    setup() {
        super.setup();
        this.planes=["plane_pack/planes/plane_1/plane_1_blue.png",
            "plane_pack/planes/plane_1/plane_1_pink.png",
            "plane_pack/planes/plane_1/plane_1_red.png",
            "plane_pack/planes/plane_1/plane_1_yellow.png",
            "plane_pack/planes/plane_2/plane_2_blue.png",
            "plane_pack/planes/plane_2/plane_2_green.png",
            "plane_pack/planes/plane_2/plane_2_red.png",
            "plane_pack/planes/plane_2/plane_2_yellow.png",
            "plane_pack/planes/plane_3/plane_3_blue.png",
            "plane_pack/planes/plane_3/plane_3_green.png",
            "plane_pack/planes/plane_3/plane_3_red.png",
            "plane_pack/planes/plane_3/plane_3_yellow.png",      
            "missilebattery.png"              
        ];
        const { a, b, target } = this.questionData;
        this.gameState.currentA = a;
        this.gameState.currentB = b;
        this.gameState.currentAnswer = target;

        this.gameState.qaRegion.removeAllChildren();

        // Layout: 10% for question, 90% for shooting area
        this.questionContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.1).addTo(this.gameState.qaRegion);
        this.shootingArea = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.9).addTo(this.gameState.qaRegion).pos(0, this.gameState.qaRegion.height * 0.1);

        this.createEnvironment();
   
        // Initialize Physics Engine with correct boundaries
        this.physics = new zim.Physics({
            gravity: 10,
            borders: new zim.Boundary(
                this.shootingArea.x,
                this.shootingArea.y,
                this.shootingArea.width,
                this.shootingArea.height
            )
        });

        new zim.Label({
            text: `${toBangla(a)} × ${toBangla(b)} = ?`,
            size: 50,
            color: config.colors.text,
            bold: true,
            align: "center"
        }).center(this.questionContainer);

        this.answerOptions = this.generateOptions(target);
        if (!this.answerOptions.includes(target)) {
            this.answerOptions[rand(0, this.answerOptions.length - 1)] = target;
        }
        shuffle(this.answerOptions);
       
        this.targets = [];
        zim.interval(rand(1.5, 3), () => {
            if (this.targets.length < this.numTargets) {
                this.spawnDuck();
            }
        }, 4, true, true); 

        
        this.duckSpawner = zim.interval(rand(1.5, 3), () => {
            if (this.targets.length < this.numTargets) {
                this.spawnDuck();
            }
        }, null, true, true);

        // Set up the stopwatch for this question
        this.setupStopwatch();
       this.MissileBattery= this.createMissileBattery();

      //   this.playerPlane = this.createPlayerPlane();
       // this.animatePlayerOnPath();
        zim.Ticker.always(this.S);

        this.setupCrosshair();
        this.setupMagazine();
        this.setupShooting();

        this.S.update();
    }
    
    // NEW METHOD: Setup stopwatch for each question
    setupStopwatch() {
        if (this.stopwatch) {
            this.stopwatch.stop();
            this.stopwatch.removeFrom();
        }
        this.stopwatch = createStopwatch(
            this.timeLimit,
            30, // height
            200, // width
            this.gameState.layoutManager,
            this.S
        );
        this.stopwatch.center(this.gameState.timerContainer);
        this.stopwatch.on("done", () => this.handleTimeUp());
        this.stopwatch.start();
    }

    // NEW METHOD: Handle per-question time up
    handleTimeUp() {
        this.gameState.streak = 0; // Reset streak
        this.callbacks.onUpdateStats();
        this.gameState.questionCount++; // Count as an attempted question

        // Immediately transition to the next question without feedback
        this.transitionToNext(null, 0); 
    }

    createEnvironment() {
        // Sky gradient
        new zim.Rectangle(this.shootingArea.width, this.shootingArea.height, new zim.GradientColor(["#87CEEB", "#B0E0E6", "#ADD8E6"]))
            .center(this.shootingArea);

        // Ground/Grass
        new zim.Rectangle(this.shootingArea.width, 100, "#228B22")
            .addTo(this.shootingArea)
            .pos(0, this.shootingArea.height - 100);

        // Simple fence
        for (let i = 0; i < 15; i++) {
            new zim.Rectangle(10, 80, "#8B4513")
                .addTo(this.shootingArea)
                .pos(i * (this.shootingArea.width / 14), this.shootingArea.height - 120);
        }
        new zim.Rectangle(this.shootingArea.width, 10, "#8B4513")
            .addTo(this.shootingArea)
            .pos(0, this.shootingArea.height - 100);
    }
    createMissileBattery() {
        const playerSprite = new zim.Rectangle(200, 160, zim.clear);
        const planeSprite = new zim.Sprite({
            image: this.S.frame.asset(this.planes[12]),
            cols: 1,
            rows: 1,
        })
            .siz(200, 160)
            .centerReg(playerSprite)
            .mov(0, 0)
            .run({ time: 0.5, loop: true });
            planeSprite.mov(600,400);

        playerSprite.hit = false;
        planeSprite.parent = playerSprite;
        playerSprite.Sprite = planeSprite;
        playerSprite.cur();
        this.shootingArea.addChild(playerSprite);
        return playerSprite;
    }

// createPlayerPlane() {
//         const playerSprite = new zim.Rectangle(80, 60, zim.clear);
//         const planeSprite = new zim.Sprite({
//             image: this.S.frame.asset(this.planes[11]),
//             cols: 1,
//             rows: 1,
//         })
//             .siz(80, 60)
//             .centerReg(playerSprite)
//             .pos(0, 0)
//             .run({ time: 0.5, loop: true });

//         playerSprite.hit = false;
//         planeSprite.parent = playerSprite;
//         playerSprite.Sprite = planeSprite;
//         playerSprite.cur();
//         this.shootingArea.addChild(playerSprite);
//         return playerSprite;
//     }

    createPlayerFlyingPath(startPos = null) {
        const playerHeight = this.shootingArea.height * 0.8;
        const margin = 100; // Keep plane within stage boundaries
        let startX, startY, endX, endY, direction;

        if (startPos) {
            // Use current position as start point, clamped to stay on-screen
            startX = Math.max(margin, Math.min(this.shootingArea.width - margin, startPos.x));
            startY = Math.max(margin, Math.min(this.shootingArea.height - margin, startPos.y));
            const endSide = rand(0, 1);
            endX = endSide === 0 ? this.shootingArea.width - margin : margin;
            endY = playerHeight + rand(-50, 50);
            direction = endX > startX ? 'right' : 'left';
        } else {
            // Initial path starts offscreen
            const startSide = rand(0, 1);
            startX = startSide === 0 ? -150 : this.shootingArea.width + 150;
            startY = playerHeight + rand(-50, 50);
            endX = startSide === 0 ? this.shootingArea.width - margin : margin;
            endY = playerHeight + rand(-50, 50);
            direction = endX > startX ? 'right' : 'left';
        }

        const numMidPoints = rand(2, 4);
        const midPoints = [];
        for (let i = 1; i <= numMidPoints; i++) {
            const midX = Math.max(margin, Math.min(this.shootingArea.width - margin, startX + (endX - startX) * (i / (numMidPoints + 1)) + rand(-100, 100)));
            const midY = Math.max(margin, Math.min(this.shootingArea.height - margin, playerHeight + rand(-100, 100)));
            midPoints.push([midX, midY]);
        }

        const allPoints = [
            [startX, startY],
            ...midPoints,
            [endX, endY]
        ];

        const path = new zim.Squiggle({
            points: allPoints,
            color: zim.clear,
            thickness: 2,
            curved: true
        }).addTo(this.shootingArea).bot();

        if (this.debug) {
            path.alpha = 0.5;
            path.color = "purple";
        } else {
            path.visible = false;
        }

        return {
            path: path,
            direction: direction
        };
    }

    // animatePlayerOnPath() {
    //     const startPos = this.playerPlane ? { x: this.playerPlane.x, y: this.playerPlane.y } : null;
    //     const { path, direction } = this.createPlayerFlyingPath(startPos);
    //     const duration = rand(5, 8); // Reduced duration for smoother patrolling

    //     if (this.playerPlane.Sprite) {
    //         const scaleMagnitude = Math.abs(this.playerPlane.Sprite.scaleX);
    //         if (this.SPRITE_SHEET_FACES_RIGHT) {
    //             this.playerPlane.Sprite.scaleX = direction === 'right' ? -scaleMagnitude : scaleMagnitude;
    //         } else {
    //             this.playerPlane.Sprite.scaleX = direction === 'right' ? scaleMagnitude : -scaleMagnitude;
    //         }
    //     }

    //     this.playerPlane.animate({
    //         props: { path: path },
    //         time: duration,
    //         ease: "linear",
    //         rewind: false,
    //         orient: false,
    //         flip: false,
    //         flipVertical: false,
    //         dynamic: true,
    //         call: () => {
    //             path.dispose();
    //             this.animatePlayerOnPath(); // Loop to new path
    //         }
    //     });
    // }

    createDuckSprite(value) {
    const puzzlePic = new zim.Pic("crowfly.jpg");

    const duckSprite = new zim.Rectangle(50, 40, zim.clear);
   


    // const crowSprite = new zim.Sprite({
    //     image: this.S.frame.asset("crowfly.png"),
    //     cols: 4,
    //     rows: 3,
    // })
    //     .siz(100, 80)
    //     .centerReg(duckSprite)
    //     .pos(0, 0)
    //     .run({ time: 0.5, loop: true });

         const crowSprite = new zim.Sprite({
        image: this.S.frame.asset(this.planes[rand(0,10)]),
        cols: 1,
        rows: 1,
    })
        .siz(50, 40)
        .centerReg(duckSprite)
        .pos(0, 0)
        .run({ time: 0.5, loop: true });


    duckSprite.hit = false;
    crowSprite.parent = duckSprite;
    duckSprite.Sprite = crowSprite;
    duckSprite.cur();

    // Create a separate container for the label
    const labelContainer = new zim.Container().addTo(this.shootingArea);
    labelContainer.scaleX = 1; // Ensure no flipping
    labelContainer.scaleY = 1;
    labelContainer.rotation = 0;

    // Define an array of colors or generate a random color
    const colors = series(
        zim.red,
        zim.blue,
        zim.green,
        zim.yellow,
        zim.purple,
        zim.orange,
        zim.pink,
        "#FF69B4", // Hot pink
        "#00CED1", // Dark turquoise
        "#FFD700"  // Gold
    );

    const label = new zim.Label({
        text: toBangla(value),
        size: 40,
        color: colors, // Use ZIM VEE series for random color selection
        bold: true,
    }).center(labelContainer).pos(0, 0);
    label.scaleX = 1; // Ensure label is not flipped
    label.scaleY = 1;
    label.rotation = 0;

    // Link the label container to the duck sprite for positioning
    duckSprite.labelContainer = labelContainer;

    return duckSprite;
}

    spawnDuck(index) {
        if (this.answerOptions===undefined || this.answerOptions.length === 0) return;
        if (index==undefined) {
            index = rand(0, this.answerOptions.length-1);
        }
    

        const answer = this.answerOptions[index];
        const duckSprite = this.createDuckSprite(answer);
        duckSprite.answerValue = answer;
        this.shootingArea.addChild(duckSprite);
        this.targets.push(duckSprite);

        this.animateDuckOnPath(duckSprite);
        this.crosshair.top();
    }
createFlyingPath() {
    // 1. Define Start and End Points
    const startSide = rand(0, 1);
    const startY = rand(50, this.shootingArea.height - 250);
    const endY = rand(50, this.shootingArea.height - 250);
    // Use a slightly larger offset to ensure the curve starts and ends smoothly off-screen
    const startX = startSide === 0 ? -150 : this.shootingArea.width + 150;
    const endX = startSide === 0 ? this.shootingArea.width + 150 : -150;

    // 2. Define 1 or 2 Intermediate "Wavy" Points
    const numMidPoints = rand(1, 2); 
    const midPoints = [];
    for (let i = 1; i <= numMidPoints; i++) {
        // Distribute midpoints somewhat evenly along the x-axis, with some randomness
        const midX = startX + (endX - startX) * (i / (numMidPoints + 1)) + rand(-100, 100);
        // Randomize the y-position to create the vertical arc/wave
        const midY = rand(50, this.shootingArea.height - 200);
        midPoints.push([midX, midY]);
    }

    // 3. Assemble the full points array for the Squiggle
    const allPoints = [
        [startX, startY],
        ...midPoints,
        [endX, endY]
    ];

    // 4. Use zim.Squiggle to create a smooth, open, curved path
    const path = new zim.Squiggle({
        points: allPoints,
        color: zim.clear,  // A Squiggle is a line, so we set its direct color
        thickness: 2,
        curved: true       // This is the key! It smooths the path through the points.
    }).addTo(this.shootingArea).bot();

    // 5. Keep the debug logic, but use the correct properties for a Squiggle
    if (this.debug) {
        path.alpha = 0.5;
        path.color = "purple"; // For a Squiggle, you set 'color', not 'borderColor'
    } else {
        path.visible = false;
    }

    // 6. Return the path and direction as before
    return {
        path: path,
        direction: (endX > startX) ? 'right' : 'left'
    };
}


    animateDuckOnPath(duckSprite) {
       
       // Get the path and the direction from our updated function.
    const { path, direction } = this.createFlyingPath();
    const duration = rand(8, 14);

    // *** THE FIX: Part 3 ***
    // Find the visual crow sprite within the main duck container.
    const crowVisual = duckSprite.getChildByName("crow_visual");

    // Flip the crow sprite based on its direction of travel.
   if (duckSprite.Sprite) {
        // *** THE FINAL, CORRECTED FLIPPING LOGIC ***

        const scaleMagnitude = Math.abs(duckSprite.Sprite.scaleX); // Preserve the sprite's current size

        // Case 1: The original sprite image faces RIGHT
        if (this.SPRITE_SHEET_FACES_RIGHT) {
            if (direction === 'right') {
                // Flying RIGHT, needs to face RIGHT. Correct, no flip.
                duckSprite.Sprite.scaleX = -scaleMagnitude; 
            } else { // direction is 'left'
                // Flying LEFT, needs to face LEFT. Flip it.
                duckSprite.Sprite.scaleX = scaleMagnitude;
            }
        } 
        // Case 2: The original sprite image faces LEFT
        else { 
            
            if (direction === 'right') {
                // Flying RIGHT, needs to face RIGHT. Flip it.
                duckSprite.Sprite.scaleX = scaleMagnitude;
            } else { // direction is 'left'
                // Flying LEFT, needs to face LEFT. Correct, no flip.
                duckSprite.Sprite.scaleX = scaleMagnitude;
            }
        }

    }


    // Animate the main duck container along the path.
    duckSprite.animate({
        props: { path: path },
        time: duration,
        ease: "linear",
        rewind:false,
         orient: false, 
         flip :false,
         flipVertical :false,
        call: () => {
            //   if (duckSprite.labelContainer) {
            //     duckSprite.labelContainer.dispose(); // Clean up label container
            this.removeDuck(duckSprite);
            path.dispose();
          
            
        },
          animateCall: () => {
            if (duckSprite.labelContainer) {
                duckSprite.labelContainer.loc(duckSprite);
            }
        }
    });

    // Animate the label container to follow the duck sprite
    // if (duckSprite.labelContainer) {
    //     duckSprite.labelContainer.animate({
    //         props: { path: path },
    //         time: duration,
    //         ease: "linear",
    //         rewind: false,
    //         flip:true,
    //         orient:true,
    //         flipVertical:false,
    //     });
    //     // Explicitly ensure labelContainer does not flip
    //     duckSprite.labelContainer.scaleX = -1;
    //     duckSprite.labelContainer.scaleY = 1;
    //     duckSprite.labelContainer.rotation = 0;
    // }

    }

    removeDuck(duckSprite) {
        const index = this.targets.indexOf(duckSprite);
        if (index > -1) {
            this.targets.splice(index, 1);
        }
          if (duckSprite.labelContainer) {
                duckSprite.labelContainer.dispose(); // Clean up label container
          }
        duckSprite.dispose();
    }
    
    setupCrosshair() {
        this.crosshair = new zim.Container(40, 40).centerReg();
        new zim.Circle(20, zim.clear, "red", 2).addTo(this.crosshair).pos(-20,-20);
        new zim.Rectangle(2, 10, "red").center(this.crosshair).pos(0, -20);
        new zim.Rectangle(2, 10, "red").center(this.crosshair).pos(0, 10);
        new zim.Rectangle(10, 2, "red").center(this.crosshair).pos(-20, 0);
        new zim.Rectangle(10, 2, "red").center(this.crosshair).pos(10, 0);
        this.crosshair.mouseEnabled = false;
        this.crosshair.center(this.shootingArea).top();

        this.S.on("stagemousemove", () => {
            const localPos = this.shootingArea.globalToLocal(this.S.mouseX, this.S.mouseY);
            this.crosshair.pos(localPos.x, localPos.y);
            this.S.update();
        });
    }

    setupMagazine() {
        this.magazineContainer = new zim.Container(200, 50).addTo(this.shootingArea).pos(20, this.shootingArea.height - 70);
        new zim.Rectangle(180, 40, "#333333", "#222222", 2).addTo(this.magazineContainer).pos(0, 5);

        this.bulletIcons = [];
        for (let i = 0; i < this.magazineSize; i++) {
            const bullet = new zim.Rectangle(10, 30, "#FFD700", "#DAA520", 1).addTo(this.magazineContainer).pos(20 + i * 25, 10);
            this.bulletIcons.push(bullet);
        }
        this.remainingBullets = this.magazineSize;
    }

  setupShooting() {
        this.S.on("stagemousedown", () => {
            if (!this.gameState.gameActive || this.isReloading) return;
            this.shotEmitter.loc(this.MissileBattery.x, this.MissileBattery.y).spurt(5); // Muzzle flash from player plane

            if (this.remainingBullets > 0) {
                this.remainingBullets--;
                this.bulletIcons[this.remainingBullets].removeFrom();
                this.casingEmitter.loc(this.MissileBattery.x + 20, this.MissileBattery.y).spurt(1); // Adjust casing position

                const hitDucks = this.targets.filter(duck => 
                    !duck.hit && duck.hitTestPoint(this.S.mouseX, this.S.mouseY)
                );
                console.log('click',hitDucks,this.targets);
                if (hitDucks.length > 0) {
                    const hitDuck = hitDucks[0];
                    hitDuck.hit = true; // Mark as hit to prevent multiple missiles
                    this.launchMissileTo(hitDuck);
                } else {
                    this.missEmitter.loc(this.S.mouseX, this.S.mouseY,).spurt(15);
                }

                if (this.remainingBullets === 0) {
                    this.reloadMagazine();
                }
            }
        });
    }
    // NEW METHOD: Launch missile to target
    launchMissileTo(target) {
    console.log('missile launching on:', target, 'missileBattery:', this.MissileBattery.x, this.MissileBattery.y, 'target:', target.x, target.y);

    // Validate coordinates
    if (!this.MissileBattery || !target || isNaN(this.MissileBattery.x) || isNaN(this.MissileBattery.y) || isNaN(target.x) || isNaN(target.y)) {
        console.error('Invalid coordinates:', {
            MissileBattery: { x: this.MissileBattery?.x, y: this.MissileBattery?.y, parent: this.MissileBattery?.parent?.name || 'no parent' },
            target: { x: target?.x, y: target?.y, parent: target?.parent?.name || 'no parent' }
        });
        return;
    }

    // Log player plane global position
    const planeLocalReg = { x: 600, y: 400 }; // Registration point
    const planeGlobalReg = this.MissileBattery.localToGlobal(planeLocalReg.x, planeLocalReg.y);
    console.log('Player plane local reg (0,0) to global:', planeGlobalReg.x, planeGlobalReg.y);

    // Convert to shootingArea local
    const planePos = this.shootingArea.globalToLocal(planeGlobalReg.x, planeGlobalReg.y);
    // console.log('Player plane position in shootingArea local:', planePos.x, planePos.y);

    if (isNaN(planePos.x) || isNaN(planePos.y)) {
        // console.error('NaN in planePos after conversion. ShootingArea pos:', this.shootingArea.x, this.shootingArea.y, 'stage:', this.S.width, this.S.height);
        return;
    }

    // Create missile: rectangle body + triangle nose in a container
    const missile = new zim.Container(40, 10).addTo(this.shootingArea).top();
//   const missileSprite = new zim.Sprite({
//         image: this.S.frame.asset("missile.png"),
//         cols: 1,
//         rows: 1,
//     })
//     //  .siz(80, 15) 
//         .centerReg(missile)
        
//         .rot(0)
//          ;// Missile image is already vertically up-facing
//         // .run({ time: 0.5, loop: true });
//     missileSprite.siz(80, 15); 
              const missilePic = new zim.Pic("missile.png")
        // .siz(200, 30) // Resize to fit container (no artifacts)
        .centerReg(missile)
        .rot(90); // Pic is vertically up-facing
    missile.centerReg();

    // const body = new zim.Rectangle(40, 10, "silver", "gray", 2).centerReg(missile, false).mov(-10, 0);
    // const nose = new zim.Triangle(15, 15, 15, "silver", "gray", 2).centerReg(missile, false).mov(20, 0);
    missile.centerReg();

    // Position missile behind the battery and set initial vertical upward rotation (-90 degrees for up)
    missile.loc(planePos.x + 180, planePos.y + 80, this.shootingArea, null, true, true); // Adjusted offset to launch "behind" (assuming right-facing battery, offset leftward in x if needed; tweak as per asset)
    missile.rotation = -90; // Initial vertical upward direction (assuming y decreases upward)
    // console.log('Missile initial position:', missile.x, missile.y);

    // Smoke trail emitter
    const smokeEmitter = new zim.Emitter({
        obj: new zim.Circle(3, ["#7c7c7cff", "#AAAAAA", "#CCCCCC"]),
        // num: 1,
        life: 0.3,
        decayTime:.3,

        // wind:-10,
        force: { min: 0.5, max: 1.5 },
        gravity: 0,
        shrink: true,
        trace:true,
        angle:{min:-90-20, max:-90+20},
        startPaused: false
    }).addTo(this.shootingArea);
this.MissileBattery.top();
    // Phase control: 0 = initial straight ascent, 1 = homing
    let phase = 0;
    const ascentDuration = 0.5; // seconds for initial straight up flight
    let ascentTimer = 0;

   const tickerFunc = (evt) => {
    if (!missile.stage || !target.stage) {
        zim.Ticker.remove(tickerFunc);
        smokeEmitter.dispose();
        missile.removeFrom();
        return;
    }
    // Log target global position
    const targetLocalReg = { x: 0, y: 0 };
    const targetGlobalReg = target.localToGlobal(targetLocalReg.x, targetLocalReg.y);
    // console.log('Target local reg (0,0) to global:', targetGlobalReg.x, targetGlobalReg.y);

    // Convert to shootingArea local
    const targetPos = this.shootingArea.globalToLocal(targetGlobalReg.x, targetGlobalReg.y);
    // console.log('Target position in shootingArea local:', targetPos.x, targetPos.y);

    if (isNaN(targetPos.x) || isNaN(targetPos.y)) {
        // console.error('NaN in targetPos after conversion.');
        zim.Ticker.remove(tickerFunc);
        smokeEmitter.dispose();
        missile.removeFrom();
        return;
    }

    const dx = targetPos.x - missile.x;
    const dy = targetPos.y - missile.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    console.log('distance, dx, dy:',dist,dx,dy);
    if (dist < 20) {
     
        zim.Ticker.remove(tickerFunc);
        smokeEmitter.dispose();
        missile.removeFrom();
           console.log('missile hit',target.hit);
        this.processHit(target, missile.x, missile.y);
    } else {
        let angle = missile.rotation; // Default to current rotation
        let vx = 0;
        let vy = 0;

        if (phase === 0) {
            // Phase 0: Straight upward flight
            ascentTimer += evt.delta / 1000; // Accumulate time in seconds
            if (ascentTimer >= ascentDuration) {
                phase = 1; // Switch to homing
            }
        } else {
            // Phase 1: Homing - calculate angle to target
            const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            let diff = targetAngle - missile.rotation;
            diff = (diff + 180) % 360 - 180; // normalize to -180 to 180
            const maxTurn = 120; // degrees per second, adjust as needed
            const turn = Math.sign(diff) * Math.min(Math.abs(diff), maxTurn * (evt.delta / 1000));
            missile.rotation += turn;
            angle = missile.rotation;
        }

        // Validate missileSpeed
        if (isNaN(this.missileSpeed) || this.missileSpeed <= 0) {
            // console.error('Invalid missileSpeed:', this.missileSpeed);
            zim.Ticker.remove(tickerFunc);
            smokeEmitter.dispose();
            missile.removeFrom();
            return;
        }
        vx = Math.cos(angle * Math.PI / 180) * this.missileSpeed;
        vy = Math.sin(angle * Math.PI / 180) * this.missileSpeed;
        if (isNaN(vx) || isNaN(vy)) {
            // console.error('NaN in vx/vy calculation. dx/dy:', dx, dy, 'angle:', angle, 'missileSpeed:', this.missileSpeed);
            return;
        }
        missile.mov(vx, vy);
        // Smoke from tail
        const tailOffset = 0;
        const smokePos = missile.localToLocal(-tailOffset,5, this.shootingArea);
        smokeEmitter.loc(smokePos.x, smokePos.y);
        smokeEmitter.angle = angle + 180 + rand(-10, 10);
        smokeEmitter.spurt(1);
        // console.log('Movement vx vy:', vx, vy, 'dist:', dist);
        //  console.log('missile pos:',  missile.x, missile.y, 'target pos:', targetPos.x, targetPos.y);
    }
};
    console.log('ticker added');
    zim.Ticker.add(tickerFunc);
}
//     // NEW METHOD: Launch missile to target
//   launchMissileTo(target) {
//     console.log('missile launching on:', target, 'missileBattery:', this.MissileBattery.x, this.MissileBattery.y, 'target:', target.x, target.y);

//     // Validate coordinates
//     if (!this.MissileBattery || !target || isNaN(this.MissileBattery.x) || isNaN(this.MissileBattery.y) || isNaN(target.x) || isNaN(target.y)) {
//         console.error('Invalid coordinates:', {
//             MissileBattery: { x: this.MissileBattery?.x, y: this.MissileBattery?.y, parent: this.MissileBattery?.parent?.name || 'no parent' },
//             target: { x: target?.x, y: target?.y, parent: target?.parent?.name || 'no parent' }
//         });
//         return;
//     }

//     // Log player plane global position
//     const planeLocalReg = { x: 600, y: 400 }; // Registration point
//     const planeGlobalReg = this.MissileBattery.localToGlobal(planeLocalReg.x, planeLocalReg.y);
//     console.log('Player plane local reg (0,0) to global:', planeGlobalReg.x, planeGlobalReg.y);

//     // Convert to shootingArea local
//     const planePos = this.shootingArea.globalToLocal(planeGlobalReg.x, planeGlobalReg.y);
//     // console.log('Player plane position in shootingArea local:', planePos.x, planePos.y);

//     if (isNaN(planePos.x) || isNaN(planePos.y)) {
//         // console.error('NaN in planePos after conversion. ShootingArea pos:', this.shootingArea.x, this.shootingArea.y, 'stage:', this.S.width, this.S.height);
//         return;
//     }

//     // Create missile: rectangle body + triangle nose in a container
//     const missile = new zim.Container(60, 15).addTo(this.shootingArea).top();
//     const body = new zim.Rectangle(40, 10, "silver", "gray", 2).centerReg(missile, false).mov(-10, 0);
//     const nose = new zim.Triangle(15, 15, 15, "silver", "gray", 2).centerReg(missile, false).mov(20, 0);
//     missile.centerReg();

//     // Position missile
//     missile.loc(planePos.x+140, planePos.y+60, this.shootingArea, null, true, true);
//     // console.log('Missile initial position:', missile.x, missile.y);

//     // Smoke trail emitter
//     const smokeEmitter = new zim.Emitter({
//         obj: new zim.Circle(5, ["#888888", "#AAAAAA", "#CCCCCC"]),
//         // num: 1,
//         life: 0.7,
//         decayTime:.7,
//         wind:-10,
//         force: { min: 0.5, max: 1.5 },
//         gravity: 0,
//         shrink: true,
//         startPaused: false
//     }).addTo(this.shootingArea);

//    const tickerFunc = () => {
//     if (!missile.stage || !target.stage) {
//         zim.Ticker.remove(tickerFunc);
//         smokeEmitter.dispose();
//         missile.removeFrom();
//         return;
//     }
//     // Log target global position
//     const targetLocalReg = { x: 0, y: 0 };
//     const targetGlobalReg = target.localToGlobal(targetLocalReg.x, targetLocalReg.y);
//     // console.log('Target local reg (0,0) to global:', targetGlobalReg.x, targetGlobalReg.y);

//     // Convert to shootingArea local
//     const targetPos = this.shootingArea.globalToLocal(targetGlobalReg.x, targetGlobalReg.y);
//     // console.log('Target position in shootingArea local:', targetPos.x, targetPos.y);

//     if (isNaN(targetPos.x) || isNaN(targetPos.y)) {
//         // console.error('NaN in targetPos after conversion.');
//         zim.Ticker.remove(tickerFunc);
//         smokeEmitter.dispose();
//         missile.removeFrom();
//         return;
//     }

//     const dx = targetPos.x - missile.x;
//     const dy = targetPos.y - missile.y;
//     const dist = Math.sqrt(dx * dx + dy * dy);
//     console.log('distance, dx, dy:',dist,dx,dy);
//     if (dist < 20) {
     
//         zim.Ticker.remove(tickerFunc);
//         smokeEmitter.dispose();
//         missile.removeFrom();
//            console.log('missile hit',target.hit);
//         this.processHit(target, missile.x, missile.y);
//     } else {
//         const angle = Math.atan2(dy, dx) * 180 / Math.PI;
//         missile.rotation = angle;
//         // Validate missileSpeed
//         if (isNaN(this.missileSpeed) || this.missileSpeed <= 0) {
//             // console.error('Invalid missileSpeed:', this.missileSpeed);
//             zim.Ticker.remove(tickerFunc);
//             smokeEmitter.dispose();
//             missile.removeFrom();
//             return;
//         }
//         const vx = Math.cos(angle * Math.PI / 180) * this.missileSpeed;
//         const vy = Math.sin(angle * Math.PI / 180) * this.missileSpeed;
//         if (isNaN(vx) || isNaN(vy)) {
//             // console.error('NaN in vx/vy calculation. dx/dy:', dx, dy, 'angle:', angle, 'missileSpeed:', this.missileSpeed);
//             return;
//         }
//         missile.mov(vx, vy);
//         // Smoke from tail
//         const tailOffset = 5;
//         const smokePos = missile.localToLocal(-tailOffset, 0, this.shootingArea);
//         smokeEmitter.loc(smokePos.x, smokePos.y);
//         smokeEmitter.angle = angle + 180 + rand(-10, 10);
//         smokeEmitter.spurt(1);
//         // console.log('Movement vx vy:', vx, vy, 'dist:', dist);
//         //  console.log('missile pos:',  missile.x, missile.y, 'target pos:', targetPos.x, targetPos.y);
//     }
// };
//     console.log('ticker added');
//     zim.Ticker.add(tickerFunc);
// }

     processHit(targetSprite, hitX, hitY) {
        if (!targetSprite.hit) return;
        const selected = targetSprite.answerValue;
        console.log(selected,this.gameState.currentAnswer);
        const correct = selected === this.gameState.currentAnswer;
        targetSprite.hit = true;
        const centerX = targetSprite.x + targetSprite.width / 2;
        const centerY = targetSprite.y + targetSprite.height / 2;

        if (correct) {
            this.hitEmitter.loc(centerX, centerY).spurt(30);
            const points = config.points.correct + this.gameState.streak * config.points.streakBonus;
            this.handleCorrect(points, "সঠিক!");
            this.showFeedbackText("সঠিক!", "green", targetSprite);
        } else {
            this.missEmitter.loc(centerX, centerY).spurt(15);
            const points = config.points.incorrect;
            this.handleIncorrect(points, "ভুল!");
            this.showFeedbackText("ভুল!", "red", targetSprite);
        }

        const visualSprite = targetSprite.Sprite;
        const currentScaleX = visualSprite.scaleX;
        const globalPos = targetSprite.localToGlobal(0, 0);
        this.shootingArea.parent.addChild(targetSprite);
        targetSprite.pos(globalPos.x, globalPos.y);

        const shotForceMultiplier = 0.5;
        const diffX = globalPos.x - hitX;
        const diffY = globalPos.y - hitY;

        targetSprite
            .addPhysics({ restitution: 0.5, friction: 0.5, density: 10, shape: "circle" })
            .impulse(diffX * shotForceMultiplier, diffY * shotForceMultiplier)
            .top();

        targetSprite.pauseAnimate();
        targetSprite.Sprite.pauseRun();

        targetSprite.animate({
            props: { alpha: 0 },
            time: 1.5,
            wait: 1,
            call: () => {
                targetSprite.removePhysics();
                this.removeDuck(targetSprite);
            }
        });
        targetSprite.labelContainer.animate({
            props: { alpha: 0, scale: 5 },
            time: 1.4,
            wait: 0
        });

        visualSprite.scaleX = currentScaleX;
        if (!correct) {
            this.gameState.questionCount++;
        }
        this.S.update();
    }

    reloadMagazine() {
        this.isReloading = true;
        zim.loop(this.magazineSize, (i) => {
            zim.timeout((i + 1) * (this.reloadTime / this.magazineSize), () => {
                const bullet = new zim.Rectangle(10, 30, "#FFD700", "#DAA520", 1).addTo(this.magazineContainer).pos(20 + i * 25, 10);
                this.bulletIcons[i] = bullet;
                if (i === this.magazineSize - 1) {
                    this.remainingBullets = this.magazineSize;
                    this.isReloading = false;
                }
            });
        });
    }

    showFeedbackText(text, color, targetSprite) {
        const feedbackLabel = new zim.Label({
            text: text,
            size: 40,
            color: color,
            bold: true,
            outlineColor: "white",
            outlineWidth: 2
        }).center(this.shootingArea).pos(targetSprite.x, targetSprite.y);

        feedbackLabel.animate({
            props: { y: feedbackLabel.y - 80, alpha: 0 },
            time: 1.5,
            call: () => feedbackLabel.removeFrom()
        });
    }

    transitionToNext(feedback, delay = 1) {
        zim.timeout(delay, () => {
             if (feedback) {
                feedback.animate({ alpha: 0 }, 0.5, () => feedback.removeFrom());
            }
            this.nextQuestion();
        });
    }

     cleanup() {
        this.S.off("stagemousemove");
        this.S.off("stagemousedown");
        if (this.crosshair) this.crosshair.removeFrom();
        if (this.stopwatch) {
            this.stopwatch.stop();
            this.stopwatch.removeFrom();
            this.stopwatch = null;
        }
        if (this.MissileBattery) {
            this.MissileBattery.dispose();
            this.MissileBattery = null;
        }
      zim.Ticker.alwaysOff(this.S);
        this.targets.forEach(target => {
            if (target.labelContainer) {
                target.labelContainer.dispose();
            }
            target.dispose();
        });
        this.targets = [];
        if (this.shootingArea) this.shootingArea.removeAllChildren();
        if (this.questionContainer) this.questionContainer.removeAllChildren();
        super.cleanup();
    }
}
