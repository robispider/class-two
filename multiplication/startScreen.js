
import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla } from "./utils.js";
import { countdownAnimation } from "./congratsPane.js";

// Displays the start screen with buttons to test countdown animations
export function createStartScreen(S, W, H, showLevelScreen, showStatsScreen, showLeaderboardScreen, startStage) {
    console.log("createStartScreen: Starting");
    const container = new zim.Container(W, H).addTo(S);
    new zim.Rectangle(W, H, new zim.GradientColor(config.colors.bgGradient))
        .center(container);
    console.log("createStartScreen: Background rectangle created");

    const titleLabel = new zim.Label({ 
        text: "নামতার খেলা", 
        size: 70,
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(container).mov(0, -200);
    console.log("createStartScreen: Title label created");

    const overallRunButton = new zim.Button({
        label: new zim.Label({ text: "ওভারঅল রান", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option1,
        rollBackgroundColor: config.colors.option1.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 0);
    overallRunButton.tap(() => {
        console.log("createStartScreen: Overall Run button tapped");
        container.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
            container.removeFrom();
            gameState.mode = 'overall_run';
            gameState.currentLevel = 1;
            gameState.currentStage = 1;
            gameState.overallScore = 0;
            gameState.levelRunScore = 0;
            startStage();
            S.update();
        });
    });
    console.log("createStartScreen: Overall Run button created");

    const levelButtons = new zim.Tile({
        obj: zim.series(gameState.controller.levels.map((lev, i) => {
            const level = i + 1;
            const unlocked = level <= gameState.controller.unlockedLevels;
            return new zim.Button({
                label: new zim.Label({ text: `লেভেল ${toBangla(level)}${unlocked ? '' : ' (লকড)'}`, color: config.colors.text, bold: true, size: 30 }),
                backgroundColor: unlocked ? config.colors.option2 : zim.grey,
                rollBackgroundColor: unlocked ? config.colors.option2.darken(0.2) : zim.grey,
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                corner: 20,
                width: 300,
                height: 80
            }).tap(() => {
                if (unlocked) {
                    console.log(`createStartScreen: Level ${level} button tapped`);
                    showLevelScreen(level, container, S, S.frame);
                }
            });
        })),
        cols: 2,
        rows: 2,
        spacingH: 20,
        spacingV: 20,
        clone: false
    }).center(container).mov(0, 100);
    console.log("createStartScreen: Level buttons tile created");

    const statsButton = new zim.Button({
        label: new zim.Label({ text: "পারফরম্যান্স দেখুন", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option3,
        rollBackgroundColor: config.colors.option3.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 350);
    statsButton.tap(() => {
        console.log("createStartScreen: Stats button tapped");
        showStatsScreen();
    });
    console.log("createStartScreen: Stats button created");

    const leaderboardButton = new zim.Button({
        label: new zim.Label({ text: "লিডারবোর্ড", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option4,
        rollBackgroundColor: config.colors.option4.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(container).mov(0, 450);
    leaderboardButton.tap(() => {
        console.log("createStartScreen: Leaderboard button tapped");
        showLeaderboardScreen();
    });
    console.log("createStartScreen: Leaderboard button created");

    // Add test buttons for countdown animations
    const testButtons = new zim.Tile({
        obj: zim.series([
            new zim.Button({
                label: new zim.Label({ text: "টেস্ট কাউন্টডাউন ১", color: config.colors.text, bold: true, size: 10 }),
                backgroundColor: config.colors.option1,
                rollBackgroundColor: config.colors.option1.darken(0.2),
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                corner: 20,
                width: 100,
                height: 80
            }).tap(() => {
                console.log("createStartScreen: Test Countdown 1 button tapped");
                container.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
                    container.removeFrom();
                    countdownAnimation(() => {
                        console.log("createStartScreen: Restoring start screen after Countdown 1");
                        const newContainer = createStartScreen(S, W, H, showLevelScreen, showStatsScreen, showLeaderboardScreen, startStage);
                        newContainer.alp(0).animate({ alpha: 1 }, 0.5); // 0.5 seconds
                        S.update();
                    }, 1, true); // transitionCode 1, debug true
                });
            }),
            new zim.Button({
                label: new zim.Label({ text: "টেস্ট কাউন্টডাউন ২", color: config.colors.text, bold: true, size: 10 }),
                backgroundColor: config.colors.option2,
                rollBackgroundColor: config.colors.option2.darken(0.2),
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                corner: 20,
                width: 100,
                height: 80
            }).tap(() => {
                console.log("createStartScreen: Test Countdown 2 button tapped");
                container.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
                    container.removeFrom();
                    countdownAnimation(() => {
                        console.log("createStartScreen: Restoring start screen after Countdown 2");
                        const newContainer = createStartScreen(S, W, H, showLevelScreen, showStatsScreen, showLeaderboardScreen, startStage);
                        newContainer.alp(0).animate({ alpha: 1 }, 0.5); // 0.5 seconds
                        S.update();
                    }, 2, true); // transitionCode 2, debug true
                });
            }),
            new zim.Button({
                label: new zim.Label({ text: "টেস্ট কাউন্টডাউন ৩", color: config.colors.text, bold: true, size: 10 }),
                backgroundColor: config.colors.option3,
                rollBackgroundColor: config.colors.option3.darken(0.2),
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                corner: 20,
                width: 100,
                height: 80
            }).tap(() => {
                console.log("createStartScreen: Test Countdown 3 button tapped");
                container.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
                    container.removeFrom();
                    countdownAnimation(() => {
                        console.log("createStartScreen: Restoring start screen after Countdown 3");
                        const newContainer = createStartScreen(S, W, H, showLevelScreen, showStatsScreen, showLeaderboardScreen, startStage);
                        newContainer.alp(0).animate({ alpha: 1 }, 0.5); // 0.5 seconds
                        S.update();
                    }, 3, true); // transitionCode 3, debug true
                });
            }),
            new zim.Button({
                label: new zim.Label({ text: "টেস্ট কাউন্টডাউন ৪", color: config.colors.text, bold: true, size: 10 }),
                backgroundColor: config.colors.option3,
                rollBackgroundColor: config.colors.option3.darken(0.2),
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                corner: 20,
                width: 100,
                height: 80
            }).tap(() => {
                console.log("createStartScreen: Test Countdown 3 button tapped");
                container.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
                    container.removeFrom();
                    countdownAnimation(() => {
                        console.log("createStartScreen: Restoring start screen after Countdown 3");
                        const newContainer = createStartScreen(S, W, H, showLevelScreen, showStatsScreen, showLeaderboardScreen, startStage);
                        newContainer.alp(0).animate({ alpha: 1 }, 0.5); // 0.5 seconds
                        S.update();
                    }, 4, true); // transitionCode 3, debug true
                });
            })
        ]),
        cols: 4,
        rows: 1,
        spacingH: 20,
        spacingV: 20,
        clone: false
    }).center(container).mov(0, -250);
    console.log("createStartScreen: Test countdown buttons tile created");

    return container;
}
