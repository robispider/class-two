import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { toBangla } from "./utils.js";
import { createStartScreen } from "./startScreen.js";
import { showLevelScreen } from "./levelScreen.js";
import { showPracticeScreen } from "./practiceScreen.js";
import { showStageScreen } from "./stageScreen.js";
import { showStatsScreen } from "./statsScreen.js";
import { showLeaderboardScreen } from "./leaderboardScreen.js";
import { startStage, endGame } from "./game.js";

export function createGameScreen(W, H, S, config, gameState, createStopwatch, showLeaderboardScreen, showStatsScreen, endGame) {
    const gameContainer = new zim.Container(W, H).center(S);
    gameContainer.setBounds(0, 0, W, H);
    gameContainer.visible = false;

    new zim.Rectangle(W, H, new zim.GradientColor(config.colors.bgGradient))
        .center(gameContainer).mouseEnabled = false;

    const padding = W * config.padding;
    const layoutHolder = new zim.Container(W - 2 * padding, H - 2 * padding).center(gameContainer);

    gameState.headerContainer = new zim.Container(W, 100).addTo(layoutHolder);
    gameState.headerContainer.type = "Region";
    const helpContainer = new zim.Container(400, 100).addTo(gameState.headerContainer);
    helpContainer.type = "Region";
    const scoreTimerContainer = new zim.Container(400, 100).addTo(gameState.headerContainer);
    scoreTimerContainer.type = "Region";

    gameState.scoreContainer = new zim.Container(400, 50).addTo(scoreTimerContainer);
    gameState.scoreContainer.type = "Region";

    gameState.timerContainer = new zim.Container(400, 50).addTo(scoreTimerContainer);
    gameState.timerContainer.type = "Region";

    const scoreTimerLayout = new zim.Layout({
        holder: scoreTimerContainer,
        regions: [
            { object: gameState.scoreContainer, maxHeight: 40, align: "center", valign: "top" },
            { object: gameState.timerContainer, maxHeight: 50, align: "center", valign: "bottom" }
        ],showRegions:false,
        vertical: true
    });

    const headerLayout = new zim.Layout({
        holder: gameState.headerContainer,
        regions: [
            { object: helpContainer, align: "left", valign: "center", maxWidth: 50 },
            { object: scoreTimerContainer, align: "right", valign: "center", maxWidth: 50 }
        ],showRegions:false,
        vertical: false
    });

    gameState.titleLabel = new zim.Label({ 
        text: `লেভেল ${toBangla(gameState.currentLevel)} - স্টেজ ${toBangla(gameState.currentStage)}`, 
        size: 40, 
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(helpContainer).mov(0, -25);

    // Stats panel container
    gameState.statsContainer = new zim.Container(350, 50).center(helpContainer).mov(0, 25);
    new zim.Rectangle({
        width: 350,
        height: 50,
        color: config.colors.panel,
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 12
    }).center(gameState.statsContainer);

    gameState.statsLabels = {
        question: new zim.Label({ text: `প্রশ্ন: ${toBangla(0)}`, size: 20, color: config.colors.text }).pos(10, 10, "left", null, gameState.statsContainer),
        correct: new zim.Label({ text: `সঠিক: ${toBangla(0)}`, size: 20, color: config.colors.text }).pos(100, 10, "left", null, gameState.statsContainer),
        incorrect: new zim.Label({ text: `ভুল: ${toBangla(0)}`, size: 20, color: config.colors.text }).pos(190, 10, "left", null, gameState.statsContainer),
        bonus: new zim.Label({ text: `বোনাস: ${toBangla(0)}`, size: 20, color: config.colors.text }).pos(280, 10, "left", null, gameState.statsContainer)
    };

    gameState.scoreLabel = new zim.Label({
        text: `স্কোর: ${toBangla(0)}`,
        size: 30,
        color: config.colors.text,
        bold: true
    }).center(gameState.scoreContainer);

    // Unified qaRegion for both question and visualization
    gameState.qaRegion = new zim.Container(W - 2 * padding, H - 200).addTo(layoutHolder);
    gameState.qaRegion.type = "Region";

  gameState.footerContainer = new zim.Container(W, 100).addTo(layoutHolder);
     gameState.footerContainer.type = "Region";
     const owlContainer = new zim.Container(300, 100).addTo(gameState.footerContainer);
     owlContainer.type = "Region";
     const stopContainer = new zim.Container(200, 100).addTo(gameState.footerContainer);
     stopContainer.type = "Region";
     const statsContainer = new zim.Container(W - 500, 100).addTo(gameState.footerContainer);
     statsContainer.type = "Region";
 
     const footerLayout = new zim.Layout({
         holder: gameState.footerContainer,
         regions: [
             { object: stopContainer, align: "right", valign: "center", maxWidth: 30 },
            
             { object: statsContainer, align: "center", valign: "center", maxWidth: 40 },
             { object: owlContainer, align: "left", valign: "center", maxWidth: 30 }
         ], showRegions:false,
         vertical: false
     });


    const mainLayout = new zim.Layout({
        holder: layoutHolder,
        regions: [
            { object: gameState.headerContainer, maxHeight: 15, align: "center", valign: "top" },
            { object: gameState.qaRegion, maxHeight: 75, align: "center", valign: "center" },
            { object: gameState.footerContainer, maxHeight: 10, align: "center", valign: "bottom" }
        ], showRegions:false,
        vertical: true
    });

    gameState.layoutManager = new zim.LayoutManager([mainLayout, headerLayout, scoreTimerLayout]);

    const stopButton = new zim.Button({
        label: new zim.Label({ text: "X", size: 50, color: "white" }),
        backgroundColor: config.colors.stopButton,
        width: 80, height: 80, corner: 40,
        shadowColor: "rgba(0,0,0,0.3)", shadowBlur: 5
    }).center(stopContainer);
    stopButton.on("click", () => {
        gameState.gameActive = false;
        if (gameState.stopwatch) gameState.stopwatch.stop();
        S.off("keydown");
        gameState.gameContainer.visible = false;
        gameState.performanceTracker.saveToLocal();
        gameState.startScreen = createStartScreen(S, S.frame.width, S.frame.height, (level, container) => showLevelScreen(level, container, S, S.frame, showStageScreen, showPracticeScreen, showStatsScreen, showLeaderboardScreen, startStage), showStatsScreen, showLeaderboardScreen, startStage);
        gameState.score = 0;
        gameState.streak = 0;
        gameState.timeLimit = config.initialTimeLimit;
        S.update();
    });

    const helpButton = new zim.Button({
        label: new zim.Label({ text: "?", size: 15, color: config.colors.text }),
        backgroundColor: config.colors.panelBorder,
        width: 40, height: 40, corner: 12
    }).pos(50, 50, "right", "bottom", owlContainer).tap(() => {
        const pane = new zim.Pane({
            width: 600,
            height: 400,
            label: new zim.Label({
                text: "গুণের অভিযানে স্বাগতম!\n\n" +
                      "কীভাবে খেলবেন:\n" +
                      "১. একটি লেভেল এবং স্টেজ বা প্র্যাকটিস মোড বাছাই করুন।\n" +
                      "২. গুণের প্রশ্নের উত্তর বাছাই করুন বা কীবোর্ডে টাইপ করে এন্টার চাপুন।\n" +
                      "৩. সঠিক উত্তরের জন্য ১০ পয়েন্ট এবং পরপর সঠিক উত্তরে বোনাস পয়েন্ট পান।\n" +
                      "৪. ভুল উত্তরে ৫ পয়েন্ট হারান।\n" +
                      "৫. স্টেজ মোডে ২০টি প্রশ্নের মধ্যে ৮০% সঠিক উত্তর দিয়ে পরবর্তী স্টেজ আনলক করুন।\n" +
                      "৬. লেভেল রান বা ওভারঅল রানে সব স্টেজ খেলে উচ্চ স্কোর অর্জন করুন।\n" +
                      "৭. প্র্যাকটিস মোডে নির্দিষ্ট গুণের টেবিল অনুশীলন করুন।\n\n" +
                      "শুভকামনা!",
                size: 30,
                color: config.colors.text,
                align: "center"
            }),
            backgroundColor: config.colors.panel,
            backdropColor: zim.black.toAlpha(0.8),
            close: true,
            closeColor: config.colors.text
        }).show();
        pane.backdrop.alp(0.3);
        pane.on("close", () => {
            pane.backdrop.alp(1);
        }, null, true);
    });

    gameState.typedLabel = new zim.Label({ 
        text: "", 
        size: 50, 
        color: "green" 
    }).center(gameState.qaRegion).mov(0, 150);

    gameState.feedbackLabel = new zim.Label({ 
        text: "সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন", 
        size: 20, 
        color: config.colors.text 
    }).center(statsContainer);

    return gameContainer;
}