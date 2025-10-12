import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla } from "./utils.js";
import { showLevelScreen } from "./levelScreen.js";
import { startStage } from "./game.js";

export function showStageScreen(level, previousContainer, S, frame) {
    previousContainer.removeFrom();
    const W = frame.width;
    const H = frame.height;
    const container = new zim.Container(W, H).addTo(S);
    new zim.Rectangle(W, H, new zim.GradientColor(config.colors.bgGradient))
        .center(container);

    const titleLabel = new zim.Label({ 
        text: `লেভেল ${toBangla(level)} স্টেজ`, 
        size: 70, 
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(container).mov(0, -200);

    const stageButtons = [];
    for (let i = 1; i <= 6; i++) {
        const stageNum = i; // Renamed to avoid shadowing
        const unlocked = gameState.controller.isUnlocked(level, stageNum);
        stageButtons.push(new zim.Button({
            label: new zim.Label({ text: `স্টেজ ${toBangla(stageNum)}`, color: config.colors.text, bold: true, size: 30 }),
            backgroundColor: unlocked ? config.colors.option3 : zim.grey,
            rollBackgroundColor: unlocked ? config.colors.option3.darken(0.2) : zim.grey,
            borderColor: config.colors.panelBorder,
            borderWidth: 4,
            corner: 20,
            width: 150,
            height: 80
        }).tap(() => {
            if (unlocked) {
                container.animate({ alpha: 0 }, 0.5, null, () => {
                    container.removeFrom();
                    gameState.mode = 'stage';
                    gameState.currentLevel = level;
                    gameState.currentStage = stageNum;
                    startStage();
                    S.update();
                });
            }
        }));
    }

    const stageTile = new zim.Tile({
        obj: zim.series(stageButtons),
        clone: false, 
        cols: 3,
        rows: 2,
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