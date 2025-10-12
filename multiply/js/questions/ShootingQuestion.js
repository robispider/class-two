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
        this.missileSpeed = 10;
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
        console.log('setup called, scene:', this.scene); // Debug
        if (!this.scene) {
            console.error('Scene is undefined in setup');
            throw new Error('Scene is undefined in setup');
        }
        super.setup();
        const { a, b, target } = this.questionData;
        this.gameState.currentA = a;
        this.gameState.currentB = b;
        this.gameState.currentAnswer = target;

        // Create environment
        this.createEnvironment();

        // Set up physics world
        this.scene.matter.world.setBounds(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);

        // Crosshair (scaled)
        this.crosshair = this.scene.add.image(0, 0, 'crosshair').setOrigin(0.5).setVisible(true).setScale(0.5).setDepth(100);
        this.scene.input.on('pointermove', (pointer) => {
            this.crosshair.setPosition(pointer.x, pointer.y);
        });

        // Missile battery
        this.MissileBattery = this.scene.add.image(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height - 100,
            'missilebattery'
        ).setOrigin(0.5, 1).setScale(0.75);

        // Magazine
        this.magazineContainer = this.scene.add.container(20, this.scene.cameras.main.height - 50);
        this.bulletIcons = [];
        for (let i = 0; i < this.magazineSize; i++) {
            const bullet = this.scene.add.rectangle(i * 25, 0, 10, 30, 0xFFD700).setStrokeStyle(1, 0xDAA520);
            this.magazineContainer.add(bullet);
            this.bulletIcons.push(bullet);
        }

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

        // Question text
        this.questionText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            50,
            `${toBangla(a)} × ${toBangla(b)} = ?`,
            { fontSize: '50px', fill: config.colors.text, fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(10);

        // Spawn targets (planes)
        this.duckSpawner = this.scene.time.addEvent({
            delay: 2000,
            callback: () => {
                console.log('spawnDuck called, targets:', this.targets.length); // Debug
                this.spawnDuck();
            },
            callbackScope: this,
            loop: true,
            startAt: 0
        });

        // Input handling
        this.scene.input.on('pointerdown', this.shoot, this);

        // Collision detection
        this.scene.matterCollision.addOnCollideStart({
            objectA: this.missiles.map(m => m.body),
            objectB: this.targets.map(t => t.body),
            callback: (event) => {
                const pair = event.pairs[0];
                const missile = pair.bodyA.gameObject || pair.bodyB.gameObject;
                const target = pair.bodyB.gameObject || pair.bodyA.gameObject;
                if (missile && target && missile.label === 'missile' && target.label === 'plane') {
                    this.processHit(target, pair.collision.supports[0].x, pair.collision.supports[0].y);
                }
            }
        });
    }

    createEnvironment() {
        // Sky gradient
        const graphics = this.scene.add.graphics();
        graphics.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor('#87CEEB').color,
            Phaser.Display.Color.HexStringToColor('#87CEEB').color,
            Phaser.Display.Color.HexStringToColor('#A3D5E5').color,
            Phaser.Display.Color.HexStringToColor('#A3D5E5').color,
            1
        );
        graphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height).setDepth(0);

        // Ground
        this.ground = this.scene.add.rectangle(
            0,
            this.scene.cameras.main.height - 50,
            this.scene.cameras.main.width,
            50,
            0x228B22
        ).setOrigin(0, 0).setDepth(1);
        this.scene.matter.add.gameObject(this.ground, { isStatic: true });

        // Clouds
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            const cloud = this.scene.add.image(
                rand(0, this.scene.cameras.main.width),
                rand(0, this.scene.cameras.main.height / 2),
                'cloud'
            ).setScale(0.5).setDepth(2);
            cloud.speed = rand(1, 3) / 10;
            this.clouds.push(cloud);
        }
    }

    spawnDuck() {
        if (this.targets.length >= this.numTargets) {
            console.log('Max targets reached:', this.numTargets); // Debug
            return;
        }
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -50 : this.scene.cameras.main.width + 50;
        const y = rand(100, this.scene.cameras.main.height / 2);
        const planeKey = shuffle(this.planes.filter(p => p.includes('plane_')))[0];
        console.log('Spawning plane with key:', planeKey); // Debug
        const plane = this.scene.add.sprite(x, y, planeKey).setScale(0.75).setDepth(5);
        if (!fromLeft) plane.flipX = true;
        this.scene.matter.add.gameObject(plane, { shape: 'rectangle', label: 'plane' });
        plane.body.ignoreGravity = true;
        plane.setVelocity(fromLeft ? rand(2, 4) : -rand(2, 4), Math.random() * 2 - 1);
        const options = this.generateOptions(this.gameState.currentAnswer);
        const answerValue = options[this.targets.length % options.length];
        const label = this.scene.add.text(0, 0, toBangla(answerValue), {
            fontSize: '30px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);
        const labelContainer = this.scene.add.container(plane.x, plane.y - 50, [label]).setDepth(6);
        plane.labelContainer = labelContainer;
        plane.answerValue = answerValue;
        plane.hit = false;
        this.targets.push(plane);
    }

    shoot(pointer) {
        if (this.remainingBullets <= 0 || this.isReloading) return;
        this.remainingBullets--;
        this.bulletIcons[this.remainingBullets].destroy();
        if (this.remainingBullets === 0) this.reloadMagazine();

        // Create missile
        const missile = this.scene.add.sprite(
            this.MissileBattery.x,
            this.MissileBattery.y - this.MissileBattery.height / 2,
            'missile'
        ).setScale(0.5).setDepth(5);
        this.scene.matter.add.gameObject(missile, { shape: 'rectangle', label: 'missile' });
        missile.body.ignoreGravity = true;
        missile.setFrictionAir(0);
        missile.setVelocity(0, -this.missileSpeed);
        missile.rotation = -Math.PI / 2;
        missile.homing = false;
        missile.target = null;

        // Find closest target to pointer
        let closest = null;
        let minDist = Infinity;
        this.targets.forEach(t => {
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, t.x, t.y);
            if (dist < minDist) {
                minDist = dist;
                closest = t;
            }
        });
        if (closest && minDist < 100) {
            missile.target = closest;
        }

        // Start homing after vertical ascent
        this.scene.time.delayedCall(1000, () => {
            if (missile && missile.active) missile.homing = true;
        });

        // Trail emitter
        missile.trailEmitter = this.scene.add.particles(0, 0, 'smoke', {
            speed: { min: 50, max: 100 },
            angle: { min: 170, max: 190 },
            lifespan: 800,
            blendMode: 'NORMAL',
            scale: { start: 0.3, end: 0 },
            tint: 0xFFFFFF,
            alpha: { start: 0.5, end: 0 },
            frequency: 50
        }).setDepth(4);
        missile.trailEmitter.startFollow(missile, 0, missile.height / 2);

        // Shot and casing effects
        this.shotEmitter.emitParticleAt(
            this.MissileBattery.x,
            this.MissileBattery.y - this.MissileBattery.height / 2,
            5
        );
        this.casingEmitter.emitParticleAt(
            this.MissileBattery.x + 20,
            this.MissileBattery.y - 50,
            1
        );
        this.smokeEmitter.emitParticleAt(
            this.MissileBattery.x,
            this.MissileBattery.y - this.MissileBattery.height / 2,
            1
        );

        this.missiles.push(missile);
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
        targetSprite.body.ignoreGravity = false;
        targetSprite.setVelocity(0, 0);
        targetSprite.setAngularVelocity(0.1);
        const diffX = centerX - hitX;
        const diffY = centerY - hitY;
        targetSprite.applyForce({ x: diffX * 0.001, y: diffY * 0.001 });

        // Animation
        this.scene.tweens.add({
            targets: targetSprite,
            alpha: 0,
            duration: 1500,
            delay: 1000,
            onComplete: () => {
                targetSprite.destroy();
                targetSprite.labelContainer.destroy();
                this.removeDuck(targetSprite);
            }
        });
        this.scene.tweens.add({
            targets: targetSprite.labelContainer,
            alpha: 0,
            scale: 5,
            duration: 1400
        });

        // Progress
        this.gameState.questionCount++;
        if (correct) {
            this.transitionToNext(null);
        }
    }

    showFeedbackText(text, color, targetSprite) {
        const feedbackLabel = this.scene.add.text(targetSprite.x, targetSprite.y, text, {
            fontSize: '40px',
            fill: color,
            stroke: '#FFFFFF',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);
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

    handleTimeUp() {
        this.callbacks.onCompleteSet('সময় শেষ!', false);
    }

    update() {
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.scene.cameras.main.width + cloud.width / 2) {
                cloud.x = -cloud.width / 2;
            }
        });

        // Update missiles for homing
        this.missiles.forEach(missile => {
            if (missile.active && missile.homing && missile.target && missile.target.active) {
                const dx = missile.target.x - missile.x;
                const dy = missile.target.y - missile.y;
                const angle = Math.atan2(dy, dx);
                missile.setVelocity(Math.cos(angle) * this.missileSpeed, Math.sin(angle) * this.missileSpeed);
                missile.rotation = angle + Math.PI / 2;
            }
        });

        // Update target labels
        this.targets.forEach(target => {
            if (target.labelContainer) {
                target.labelContainer.x = target.x;
                target.labelContainer.y = target.y - 50;
            }
        });
    }

    cleanup() {
        this.scene.input.off('pointermove');
        this.scene.input.off('pointerdown');
        if (this.crosshair) this.crosshair.destroy();
        if (this.MissileBattery) this.MissileBattery.destroy();
        this.targets.forEach(t => {
            if (t.labelContainer) t.labelContainer.destroy();
            t.destroy();
        });
        this.missiles.forEach(m => {
            if (m.trailEmitter) m.trailEmitter.destroy();
            m.destroy();
        });
        this.targets = [];
        this.missiles = [];
        if (this.questionText) this.questionText.destroy();
        if (this.magazineContainer) this.magazineContainer.destroy();
        if (this.duckSpawner) this.duckSpawner.remove();
        if (this.hitEmitter) this.hitEmitter.destroy();
        if (this.missEmitter) this.missEmitter.destroy();
        if (this.shotEmitter) this.shotEmitter.destroy();
        if (this.casingEmitter) this.casingEmitter.destroy();
        if (this.smokeEmitter) this.smokeEmitter.destroy();
        if (this.trailEmitter) this.trailEmitter.destroy();
        super.cleanup();
    }
}

export { ShootingQuestion };