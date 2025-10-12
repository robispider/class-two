import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla } from "./utils.js";
import { createStartScreen } from "./startScreen.js";
import { startStage } from "./game.js";

export function showLevelScreen(level, previousContainer, S, frame, showStageScreen, showPracticeScreen, showStatsScreen, showLeaderboardScreen, startStage) {
    previousContainer.removeFrom();
    const W = frame.width;
    const H = frame.height;
    const container = new zim.Container(W, H).addTo(S);
    new zim.Rectangle(W, H, new zim.GradientColor(config.colors.bgGradient))
        .center(container);

    const titleLabel = new zim.Label({ 
        text: `লেভেল ${toBangla(level)}`, 
        size: 70, 
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(container).mov(0, -200);

    const levelRunButton = new zim.Button({
        label: new zim.Label({ text: "লেভেল রান", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option1,
        rollBackgroundColor: config.colors.option1.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 0);

    levelRunButton.tap(() => {
        container.animate({ alpha: 0 }, 0.5, null, () => {
            container.removeFrom();
            gameState.mode = 'level_run';
            gameState.currentLevel = level;
            gameState.currentStage = 1;
            gameState.levelRunScore = 0;
            startStage();
            S.update();
        });
    });

    const stagesButton = new zim.Button({
        label: new zim.Label({ text: "ইন্ডিভিজুয়াল স্টেজ", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option2,
        rollBackgroundColor: config.colors.option2.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 80);

    stagesButton.tap(() => {
        showStageScreen(level, container, S, frame);
    });

    const practiceButton = new zim.Button({
        label: new zim.Label({ text: "ইন্ডিভিজুয়াল প্র্যাকটিস", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option3,
        rollBackgroundColor: config.colors.option3.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 160);

    practiceButton.tap(() => {
        showPracticeScreen(level, container, S, frame);
    });

    const backButton = new zim.Button({
        label: new zim.Label({ text: "পিছনে", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.stopButton,
        rollBackgroundColor: config.colors.stopButton.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 240);

    backButton.tap(() => {
        container.removeFrom();
        gameState.startScreen = createStartScreen(S, W, H, config, gameState, { toBangla, shuffle, rand }, (level, container) => showLevelScreen(level, container, S, frame, showStageScreen, showPracticeScreen, showStatsScreen, showLeaderboardScreen, startStage), showStatsScreen, showLeaderboardScreen, startStage);
    });

    S.update();
}