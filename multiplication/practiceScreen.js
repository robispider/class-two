import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla } from "./utils.js";
import { showLevelScreen } from "./levelScreen.js";
import { startStage } from "./game.js";

export function showPracticeScreen(level, previousContainer, S, frame) {
    previousContainer.removeFrom();
    const W = frame.width;
    const H = frame.height;
    const container = new zim.Container(W, H).addTo(S);
    new zim.Rectangle(W, H, new zim.GradientColor(config.colors.bgGradient))
        .center(container);

    const titleLabel = new zim.Label({ 
        text: `লেভেল ${toBangla(level)} প্র্যাকটিস`, 
        size: 70, 
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(container).mov(0, -200);

    const maxNum = gameState.controller.getLevelMaxNumber(level);
    const practiceButtons = [];
    for (let i = 1; i <= maxNum; i++) {
        const multiplier = i;
        practiceButtons.push(new zim.Button({
            label: new zim.Label({ text: `গুণ ${toBangla(multiplier)}`, color: config.colors.text, bold: true, size: 30 }),
            backgroundColor: config.colors.option1,
            rollBackgroundColor: config.colors.option1.darken(0.2),
            borderColor: config.colors.panelBorder,
            borderWidth: 4,
            corner: 20,
            width: 150,
            height: 80
        }).tap(() => {
            container.animate({ alpha: 0 }, 0.5, null, () => {
                container.removeFrom();
                gameState.mode = 'practice';
                gameState.currentLevel = level;
                gameState.fixedMultiplier = multiplier;
                startStage();
                S.update();
            });
        }));
    }

    const practiceTile = new zim.Tile({
        obj: zim.series(practiceButtons),
        clone: false, 
        cols: Math.min(maxNum, 5),
        rows: Math.ceil(maxNum / 5),
        spacingH: 20,
        spacingV: 20
    }).center(container).mov(0, 0);

    const backButton = new zim.Button({
        label: new zim.Label({ text: "পিছনে", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.stopButton,
        rollBackgroundColor: config.colors.stopButton.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 250);

    backButton.tap(() => {
        container.removeFrom();
        showLevelScreen(level, container, S, frame);
    });

    S.update();
}