import zim from "https://zimjs.org/cdn/018/zim_game";
import { config } from "./main.js";

// HealthBar component
export class HealthBar {
    constructor(width = 300, height = 40) {
        this.container = new zim.Container(width, height);
        this.width = width;
        this.height = height;

        // Background
        new zim.Rectangle(width, height, "#CCCCCC").addTo(this.container);

        // Gradient fill (red → yellow → green)
        const gradient = new zim.GradientColor(
            ["red", "yellow", "green"],
            [0, 0.5, 1], // color stops
            0 // angle = left to right
        );

        this.fill = new zim.Rectangle(width, height, gradient).addTo(this.container);

        // Mask must be a ZIM Rectangle (not Shape) so setMask works
        this.mask = new zim.Rectangle(width, height, clear).addTo(this.container);
        this.mask.regX = 0; // anchor on left edge
        this.mask.scaleX = 1; // start full
        this.fill.setMask(this.mask, true);

        // Label
        this.label = new zim.Label({
            text: "100%",
            size: 30,
            color: config.colors.text
        }).center(this.container).mov(0, height + 10);

        // Border
        new zim.Rectangle(width, height, null, config.colors.panelBorder, 4).addTo(this.container);
    }

    // Start full
    initialize(stage, callback) {
        this.mask.scaleX = 1;
        this.label.text = "100%";
        stage.update();
        if (callback) callback();
    }

    // Update health (streak 0 → 15)
    update(streak, stage) {
        const percent = Math.min((streak / 15) * 100, 100);
        const targetScaleX = percent / 100;

        this.mask.animate({
            props: { scaleX: targetScaleX },
            time: 0.5,
            ease: "linear",
            call: () => {
                this.label.text = `${Math.round(percent)}%`;
                stage.update();
            },
            animateCall: (val) => {
                this.label.text = `${Math.round(val.scaleX * 100)}%`;
                stage.update();
            }
        });
    }

    addTo(parent) {
        this.container.addTo(parent);
        return this;
    }

    center(parent) {
        this.container.center(parent);
        return this;
    }
}
