import { Question } from "./questionBase.js";
import { toBangla, rand, shuffle } from "./utils.js";
import { config } from "./main.js";

export class CascadeQuestion extends Question {
    setup() {
        super.setup();
        this.gameState.questionTitle.text = `যথাক্রমে ${toBangla(this.questionData.multiplier)} এর গুণিতকগুলো খুঁজুন!`;
        this.gameState.questionTitle.animate({ alpha: 1 });

        this.currentMultiple = 1;
        this.currentLabel = new zim.Label({
            text: `খুঁজুন: ${toBangla(this.questionData.multiplier * this.currentMultiple)}`,
            size: 40,
            color: config.colors.text
        }).center(this.gameState.vizRegion).mov(0, -200);

        this.grid = this.generateGrid();
    }

    generateGrid() {
        const multiples = Array.from({length: this.questionData.maxMultiple}, (_, i) => (i + 1) * this.questionData.multiplier);
        const distractors = [];
        while (distractors.length < 20 - multiples.length) {
            const r = rand(1, this.gameState.maxNumber * this.gameState.maxNumber);
            if (!multiples.includes(r) && !distractors.includes(r)) distractors.push(r);
        }
        const numbers = shuffle([...multiples, ...distractors]);

        const grid = new zim.Tile({
            obj: numbers.map(num => {
                const block = new zim.Container(80, 80).tap((e) => this.handleTap(e));
                new zim.Rectangle(80, 80, rand([zim.blue, zim.green, zim.yellow])).addTo(block);
                new zim.Label(toBangla(num), 30, config.colors.text).center(block);
                block.num = num;
                return block;
            }),
            cols: 5,
            rows: 4,
            spacingH: 10,
            spacingV: 10,
            clone: false
        }).center(this.gameState.qaRegion);
        return grid;
    }

    handleTap(e) {
        const block = e.target;
        if (block.num === this.questionData.multiplier * this.currentMultiple) {
            block.animate({ alpha: 0, scale: 0 }, 0.3, () => block.removeFrom());
            this.currentMultiple++;
            const points = config.points.correct;
            this.handleCorrect(points, "সঠিক!");
            if (this.currentMultiple > this.questionData.maxMultiple) {
                this.gameState.questionCount++;
                const feedback = new zim.Label({ text: "চেইন সম্পূর্ণ!", size: 60, color: "green" }).center(this.S);
                this.transitionToNext(feedback);
            } else {
                this.currentLabel.text = `খুঁজুন: ${toBangla(this.questionData.multiplier * this.currentMultiple)}`;
                if (!this.grid.children.some(c => c.num === this.questionData.multiplier * this.currentMultiple)) {
                    this.grid.children.forEach(c => c.animate({ alpha: 0, rotation: rand(-90, 90) }, 0.5, () => c.removeFrom()));
                    zim.timeout(0.5, () => {
                        this.grid = this.generateGrid();
                        this.currentMultiple = 1;
                        this.currentLabel.text = `খুঁজুন: ${toBangla(this.questionData.multiplier * this.currentMultiple)}`;
                        const points = config.points.incorrect;
                        this.handleIncorrect(points, "গ্রিড রিসেট!");
                        if (this.gameState.mode === "practice") {
                            this.gameState.healthBar.reduceHealth();
                            if (this.gameState.healthBar.currentHealth <= 0) {
                                this.completeSet();
                                return;
                            }
                        }
                    });
                }
            }
        } else {
            block.sha("red", 5, 5, 5);
            zim.timeout(0.5, () => block.sha(null));
            const points = config.points.incorrect;
            this.handleIncorrect(points, "ভুল!");
            if (this.gameState.mode === "practice") {
                this.gameState.healthBar.reduceHealth();
                if (this.gameState.healthBar.currentHealth <= 0) {
                    this.completeSet();
                    return;
                }
            }
        }
        this.S.update();
    }

    cleanup() {
        super.cleanup();
        if (this.currentLabel) {
            this.currentLabel.removeFrom();
            this.currentLabel = null;
        }
        if (this.grid) {
            this.grid.removeFrom();
            this.grid = null;
        }
    }
}