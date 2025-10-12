import { Question } from "./questionBase.js";
import zim from "https://zimjs.org/cdn/018/zim_physics.js";
// import zim from "https://zimjs.org/cdn/018/zim_game";
// import zim from "https://zimjs.org/cdn/00/zim_physics";
import { gameState, config } from "./main.js";
import { toBangla, shuffle, rand } from "./utils.js";
// google gemini
export class ShootingQuestion extends Question {
    constructor(...args) {
        super(...args);

        // Game settings
        this.numTargets = 5; // Total number of targets on screen at once
        this.questions = [];
this.debug=true;
        // ZIM objects
        this.shootingArea = null;
        this.questionContainer = null;
        this.duckArea=null;
        this.targets = [];
        this.crosshair = null;
    this.physics = null;
        this.duckSpawner = null;
        this.answerOptions = [];

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
        const { a, b, target } = this.questionData;
        this.gameState.currentA = a;
        this.gameState.currentB = b;
        this.gameState.currentAnswer = target;

        this.gameState.qaRegion.removeAllChildren();

        // Layout: 20% for question, 80% for shooting area
        this.questionContainer = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.1).addTo(this.gameState.qaRegion);
        this.shootingArea = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.9).addTo(this.gameState.qaRegion).pos(0, this.gameState.qaRegion.height * 0.1);
        // this.duckArea = new zim.Container(this.gameState.qaRegion.width, this.gameState.qaRegion.height * 0.8).addTo(this.gameState.qaRegion).pos(0, this.gameState.qaRegion.height * 0.2);
// this.duckArea.center(this.shootingArea);

        // Create the shooting range environment
        this.createEnvironment();
   // Initialize Physics Engine
        // actual global position and dimensions.
    this.physics = new zim.Physics({
        gravity: 10,
        borders: new zim.Boundary(
            this.shootingArea.x,
            this.shootingArea.y,
            this.shootingArea.width,
            this.shootingArea.height
        )
    });

        // Display the question
        new zim.Label({
            text: `${toBangla(a)} × ${toBangla(b)} = ?`,
            size: 50,
            color: config.colors.text,
            bold: true,
            align: "center"
        }).center(this.questionContainer);

        // Prepare answer options
         // Prepare answer options for the spawner

         
        this.answerOptions = this.generateOptions(target);
        if (!this.answerOptions.includes(target)) {
            this.answerOptions[rand(0, this.answerOptions.length - 1)] = target;
        }
        shuffle(this.answerOptions);

        // Create and animate targets
        // this.targets = options.map(option => {
        //     const duckSprite = this.createDuckSprite(option);
        //     duckSprite.answerValue = option;
        //     this.shootingArea.addChild(duckSprite);
        //     this.animateDuck(duckSprite);

        //     return duckSprite;
        // });
   // Start spawning ducks
        this.targets = [];
        // for (let i = 0; i < this.numTargets; i++) {
            // this.spawnDuck();
            zim.interval(rand(1.5, 3), () => {
            // console.log('spawning',this.targets.length,this.numTargets);
        if (this.targets.length < this.numTargets) {
            this.spawnDuck();
        }
    }, 4, true, true); 

        
        this.duckSpawner = zim.interval(rand(1.5, 3), () => {
            // console.log('spawning',this.targets.length,this.numTargets);
        if (this.targets.length < this.numTargets) {
            this.spawnDuck();
        }
    }, null, true, true); // The fix is applied here

        // Set up the custom crosshair
        this.setupCrosshair();

        // Set up magazine
        this.setupMagazine();

        // Set up shooting mechanics
        this.setupShooting();

        this.S.update();
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

    createDuckSprite(value) {
        // const duckSprite = new zim.Container(100, 80, zim.clear);
            const duckSprite = new zim.Rectangle(100, 80, zim.clear);

        //  new zim.Rectangle(100, 80, zim.clear).center(duckSprite);

        duckSprite.hit = false; // Custom property to track if hit

        // Duck Body (placeholder)
        const body = new zim.Triangle(80,80, 80, "#FFC107", "#A07900",4).center(duckSprite).pos(10, 20);

        // Duck Head (placeholder)
       const head = new zim.Circle(25, "#816203ff", "#A07900", 2).center(duckSprite).pos(70, 20);
        
        // Number Label
        new zim.Label({
            text: toBangla(value),
            size: 25,
            color: config.colors.text,
            bold: true,
        }).center(body);

        duckSprite.mouseChildren = false; // Clicks register on the container, not its children
        duckSprite.cur(); // Show pointer cursor on hover
        
        return duckSprite;
    }
     spawnDuck(index) {
        // console.log(this.answerOptions);
        if (this.answerOptions===undefined || this.answerOptions.length === 0) return;
        if (index==undefined)
        {
            index = rand(0, this.answerOptions.length-1);
        }
        const answer = this.answerOptions[index]; // Take an answer from the pool
        const duckSprite = this.createDuckSprite(answer);
        duckSprite.answerValue = answer;
        this.shootingArea.addChild(duckSprite);
        this.targets.push(duckSprite);

        this.animateDuckOnPath(duckSprite);
        this.crosshair.top();
    }
 createFlyingPath() {
        const startSide = rand(0, 1); // 0 for left, 1 for right
        const startY = rand(50, this.shootingArea.height - 250);
        const endY = rand(50, this.shootingArea.height - 250);
        const startX = startSide === 0 ? -100 : this.shootingArea.width + 100;
        const endX = startSide === 0 ? this.shootingArea.width + 100 : -100;
        const cp1X = startX + (endX - startX) * 0.3 + rand(-100, 100);
        const cp1Y = startY + rand(-150, 150);
        const cp2X = startX + (endX - startX) * 0.7 + rand(-100, 100);
        const cp2Y = endY + rand(-150, 150);

        const path = new zim.Blob({
            points: [
                [startX, startY, 0, 0, 0, 0, cp1X, cp1Y, "free"],
                [endX, endY, cp2X, cp2Y, 0, 0, 0, 0, "free"]
            ]
        }).addTo(this.shootingArea).bot();

        if (this.debug) {
            path.alpha = 0.5;
            path.borderColor = "purple";
            path.borderWidth = 2;
        } else {
            path.visible = false;
        }
        return path;
    }
  animateDuckOnPath(duckSprite) {
        const path = this.createFlyingPath();
        const duration = rand(8, 14);

        duckSprite.animate({
            props: { path: path },
            time: duration,
            ease: "linear",
            call: () => {
                this.removeDuck(duckSprite);
                path.dispose();
            }
        });
    }
   removeDuck(duckSprite) {
        const index = this.targets.indexOf(duckSprite);
        // console.log('removing duck');
        if (index > -1) {
            this.targets.splice(index, 1);
            //   console.log('removed duck',this.targets);
        }
        duckSprite.dispose();
    }
    animateDuck(duckSprite) {
        const pathType = rand(1, 3);
        const duration = rand(15, 25);
        const startY = rand(50, this.shootingArea.height - 200);
        const startX = -100;
        const endX = this.shootingArea.width + 100;

        duckSprite.pos(startX, startY);

        let animationProps = { x: endX };

        // Add varied flight paths
        if (pathType === 2) { // Wavy path
            animationProps.y = `~${startY - 30}~${startY + 30}~${startY}`;
        } else if (pathType === 3) { // Arcing path
            animationProps.y = [startY, startY - 80, startY];
        }

        duckSprite.animate({
            props: animationProps,
            time: duration,
            loop: true,
            ease: "linear",
            rewind: false // Duck flies off-screen and reappears
        });
    }

    setupCrosshair() {
        this.crosshair = new zim.Container(40, 40).centerReg();
        new zim.Circle(20, zim.clear, "red", 2).addTo(this.crosshair).pos(-20,-20);//keep this
        
        // Top vertical line
        new zim.Rectangle(2, 10, "red").center(this.crosshair).pos(0, -20);

        // Bottom vertical line
        new zim.Rectangle(2, 10, "red").center(this.crosshair).pos(0, 10);

        // Left horizontal line
        new zim.Rectangle(10, 2, "red").center(this.crosshair).pos(-20, 0);

        // Right horizontal line
        new zim.Rectangle(10, 2, "red").center(this.crosshair).pos(10, 0);
        this.crosshair.mouseEnabled = false;
        // this.shootingArea.addChild(this.crosshair);
        this.crosshair.center(this.shootingArea).top();

        this.S.on("stagemousemove", () => {
            const localPos = this.shootingArea.globalToLocal(this.S.mouseX, this.S.mouseY);
            this.crosshair.pos(localPos.x, localPos.y);
            this.S.update();
        });
    }

    setupMagazine() {
        this.magazineContainer = new zim.Container(200, 50).addTo(this.shootingArea).pos(20, this.shootingArea.height - 70);
        new zim.Rectangle(180, 40, "#333333", "#222222", 2).addTo(this.magazineContainer).pos(0, 5); // Magazine body

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
    //    console.log(this.gameState.gameActive , this.isReloading);
            const localMouse = this.shootingArea.globalToLocal(this.S.mouseX, this.S.mouseY);
            this.shotEmitter.loc(this.S.mouseX, this.S.mouseY,).spurt(5); // Shot feedback

            if (this.remainingBullets > 0) {
                this.remainingBullets--;
                this.bulletIcons[this.remainingBullets].removeFrom(); // Remove bullet icon

                // Eject casing
                this.casingEmitter.loc(100, this.shootingArea.height - 50).spurt(1);

                // Check for hit
                // const hitDucks = this.targets.filter(duck => !duck.hit && duck.getBounds().contains(localMouse.x - duck.x, localMouse.y - duck.y));
              if (this.debug) {
              //   new zim.Circle(10, "blue").addTo(this.shootingArea).pos(localMouse.x, localMouse.y);
            }

                //   const hitDucks = this.targets.filter(duck => !duck.hit && duck.hitTestPoint(localMouse.x, localMouse.y));
      const hitDucks = this.targets.filter(duck => 
                !duck.hit && duck.hitTestPoint(this.S.mouseX, this.S.mouseY)
            );
                console.log("hitducks",hitDucks,this.targets);
                if (hitDucks.length > 0) {
                    const hitDuck = hitDucks[0]; // Assume first hit
                     this.processHit(hitDuck, this.S.mouseX, this.S.mouseY);
                } else {
                    // Miss
                    this.missEmitter.loc(this.S.mouseX, this.S.mouseY,).spurt(15);
                }

                if (this.remainingBullets === 0) {
                    this.reloadMagazine();
                }
            }
        });
    }
processHit(targetSprite, hitX, hitY) {
    console.log('processing hit');
        if (targetSprite.hit) return; // Prevent double hits

        const selected = targetSprite.answerValue;
        const correct = selected === this.gameState.currentAnswer;
        targetSprite.hit = true;

       // Stop flight animation
        // this.removeDuck(targetSprite); // Remove from trackable targets

        const centerX = targetSprite.x + targetSprite.width / 2;
        const centerY = targetSprite.y + targetSprite.height / 2;

        if (correct) {
            this.hitEmitter.loc(centerX, centerY).spurt(30);
            const points = config.points.correct + this.gameState.streak * config.points.streakBonus;
            this.handleCorrect(points, "সঠিক!");
            this.showFeedbackText("সঠিক!", "green", targetSprite);
            // this.transitionToNext(null, 1.5);
        } else {
            this.missEmitter.loc(centerX, centerY).spurt(15);
            const points = config.points.incorrect;
            this.handleIncorrect(points, "ভুল!");
            this.showFeedbackText("ভুল!", "red", targetSprite);
        }

        // Add physics body and make it fall
        // ******************** THE FIX ********************
    // 1. Get the duck's current GLOBAL position on the stage.
    // localToGlobal converts a point from the object's local space to the stage's global space.
    // We use (0,0) to get the global position of the duck's registration point.
    const globalPos = targetSprite.localToGlobal(0, 0);

    // 2. Move the duck out of the transformed container and onto the shootingArea's parent (the main stage).
    // This is necessary because addPhysics works in global coordinates.
    this.shootingArea.parent.addChild(targetSprite);

    // 3. Set its position to the correct global coordinates.
    targetSprite.pos(globalPos.x, globalPos.y);

    // 4. NOW add physics. The body will be created at the correct global location.
  // The force multiplier. Adjust this value to get the desired "kick".
    const shotForceMultiplier = 0.5; 

    // Calculate the vector from the shot location to the duck's center.
    // This creates a "push away from the click" effect.
    const diffX = globalPos.x - hitX;
    const diffY = globalPos.y - hitY;

    // Apply the calculated impulse instead of a random one.
    targetSprite
        .addPhysics({ restitution: 0.5, friction: 0.5, density: 10, shape: "circle" })
        .impulse(diffX * shotForceMultiplier, diffY * shotForceMultiplier)
        .top(); 
         targetSprite.pauseAnimate(); 
   // Animate alpha and cleanup physics body after falling
    targetSprite.animate({
        props: { alpha: 0 },
        time: 1.5,
        wait: 1, // Wait 1 second before fading
        call: () => {
            targetSprite.removePhysics();
            this.removeDuck(targetSprite); // Remove from array and dispose
        }
    });
    //   targetSprite
    //         .addPhysics({ restitution: .5, friction: 0.5, density: 1, shape: "circle" })
    //         .impulse(rand(-2, 2), rand(-5, -10));
        // Animate alpha and cleanup physics body after falling
        // targetSprite.animate({
        //     props: { alpha: 0 },
        //     time: 1.5,
        //     wait: 20,
        //     call: () => {
        //         targetSprite.removePhysics();
        //         targetSprite.dispose();
        //     }
        // });

        this.gameState.questionCount++;
        this.S.update();
    }
    // processHit(targetSprite) {
    //     const selected = targetSprite.answerValue;
    //     const correct = selected === this.gameState.currentAnswer;
    //     targetSprite.hit = true;

    //     // Center emitters on duck
    //     const centerX = targetSprite.x + targetSprite.width / 2;
    //     const centerY = targetSprite.y + targetSprite.height / 2;

    //     if (correct) {
    //         this.hitEmitter.loc(centerX, centerY).spurt(30);
    //         const points = config.points.correct + this.gameState.streak * config.points.streakBonus;
    //         this.handleCorrect(points, "সঠিক!");
    //         this.showFeedbackText("সঠিক!", "green", targetSprite);
    //         this.transitionToNext(null, 1.5);
    //     } else {
    //         this.missEmitter.loc(centerX, centerY).spurt(15);
    //         const points = config.points.incorrect;
    //         this.handleIncorrect(points, "ভুল!");
    //         this.showFeedbackText("ভুল!", "red", targetSprite);
    //     }

    //     // Fall animation for any hit duck
    //     targetSprite.animate({
    //         props: { y: this.shootingArea.height + 100, rotation: -180 , alpha:0},
    //         time: 1.5,
           
    //     });

    //     this.gameState.questionCount++;
    //     this.S.update();
    // }

    reloadMagazine() {
        this.isReloading = true;
        // Visual reload: Add bullets one by one
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
        this.S.off("stagemousedown"); // Remove shooting listener
        if (this.crosshair) this.crosshair.removeFrom();

        this.targets.forEach(target => {
            target.dispose(); // ZIM's method to stop animations and remove
        });
        this.targets = [];
        
        if (this.shootingArea) this.shootingArea.removeAllChildren();
        if (this.questionContainer) this.questionContainer.removeAllChildren();
        
        super.cleanup();
    }
}