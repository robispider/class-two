import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla } from "./utils.js";
import { showLevelScreen } from "./levelScreen.js";
import { startStage } from "./game.js";

export function showStageScreen(level, previousContainer, S, frame, allowedTables = [1, 2, 3, 4, 5]) {
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

    // Define question types and their descriptions, ordered by difficulty
    const stageInfo = [
        { stage: 1, type: "Standard", label: "মৌলিক গুণ" },
        { stage: 2, type: "Standard", label: "আংশিক গুণ" },
        { stage: 3, type: "FactorPairs", label: "ফ্যাক্টর জোড়া" },
        { stage: 4, type: "Puzzle", label: "পাজল মিল" },
        { stage: 5, type: "Cascade", label: "ক্রমিক গুণিতক" },
         { stage: 6, type: "Shooting", label: "শুটিং" }
    ];

    const stageButtons = [];
    for (let i = 0; i < stageInfo.length; i++) {
        const { stage, label } = stageInfo[i];
        const unlocked =true;//gameState.controller.isUnlocked(level, stage);
        stageButtons.push(new zim.Button({
            label: new zim.Label({ 
                text: `স্টেজ ${toBangla(stage)}: ${label}`, 
                color: config.colors.text, 
                bold: true, 
                size: 30 
            }),
            backgroundColor: unlocked ? config.colors.option3 : zim.grey,
            rollBackgroundColor: unlocked ? config.colors.option3.darken(0.2) : zim.grey,
            borderColor: config.colors.panelBorder,
            borderWidth: 4,
            corner: 20,
            width: 300, // Wider to accommodate longer labels
            height: 80
        }).tap(() => {
            if (unlocked) {
                container.animate({ alpha: 0 }, 0.5, null, () => {
                    container.removeFrom();
                    gameState.mode = 'stage';
                    gameState.currentLevel = level;
                    gameState.currentStage = stage;
                    startStage('stage', stage, allowedTables);
                    S.update();
                });
            }
        }));
    }

    const stageTile = new zim.Tile({
        obj: zim.series(stageButtons),
        clone: false, 
        cols: 2, // Adjusted for wider buttons
        rows: Math.ceil(stageButtons.length / 2),
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
        container.animate({ alpha: 0 }, 0.5, () => {
            container.removeFrom();
            showLevelScreen(level, container, S, frame);
        });
    });

    S.update();
}