import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config, uiColors, emitter } from "./main.js";
import { toBangla, shuffle, rand } from "./utils.js";
import { startStage, endGame,transitionToNextQuestion } from "./game.js";

export function createStartScreen(S, W, H, config, gameState, helpers, showLevelScreen, showStatsScreen, showLeaderboardScreen, startStage) {
    const container = new zim.Container(W, H).addTo(S);
    new zim.Rectangle(W, H, new zim.GradientColor(config.colors.bgGradient))
        .center(container);
    
    const titleLabel = new zim.Label({ 
        text: "গুণের অভিযান", 
        size: 70,
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(container).mov(0, -200);

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
        container.animate({ alpha: 0 }, 0.5, null, () => {
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

    const levelButtons = new zim.Tile({
        obj: gameState.controller.levels.map((lev, i) => {
            const level = i + 1;
            const unlocked = level <= gameState.controller.unlockedLevels;
            return new zim.Button({
                label: new zim.Label({ text: `লেভেল ${helpers.toBangla(level)}${unlocked ? '' : ' (লকড)'}`, color: config.colors.text, bold: true, size: 30 }),
                backgroundColor: unlocked ? config.colors.option2 : zim.grey,
                rollBackgroundColor: unlocked ? config.colors.option2.darken(0.2) : zim.grey,
                borderColor: config.colors.panelBorder,
                borderWidth: 4,
                corner: 20,
                width: 300,
                height: 80
            }).tap(() => {
                if (unlocked) {
                    showLevelScreen(level, container, S, S.frame);
                }
            });
        }),
        cols: 2,
        rows: 2,
        spacingH: 20,
        spacingV: 20,
        clone: false
    }).center(container).mov(0, 100);

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
        showStatsScreen();
    });

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
        showLeaderboardScreen();
    });

    return container;
}

export function showLevelScreen(level, previousContainer, S, frame) {
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
        gameState.startScreen = createStartScreen(S, W, H, config, gameState, { toBangla, shuffle, rand }, (level, container) => showLevelScreen(level, container, S, frame), showStatsScreen, showLeaderboardScreen, startStage);
    });

    S.update();
}

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
        holder: scoreTimerContainer, regions: [
            { object: gameState.scoreContainer, maxHeight: 50, align: "center", valign: "top" },
            { object: gameState.timerContainer, maxHeight: 50, align: "center", valign: "bottom" }
        ], vertical: true
    });

    const headerLayout = new zim.Layout({
        holder: gameState.headerContainer, regions: [
            { object: helpContainer, align: "left", valign: "center", maxWidth: 50 },
            { object: scoreTimerContainer, align: "right", valign: "center", maxWidth: 50 }
        ], vertical: false
    });

    gameState.titleLabel = new zim.Label({ 
        text: `লেভেল ${toBangla(gameState.currentLevel)} - স্টেজ ${toBangla(gameState.currentStage)}`, 
        size: 70, 
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(helpContainer).mov(0, -25);

    gameState.statsContainer = new zim.Container(350, 50).center(helpContainer).mov(0, 25);
    new zim.Rectangle({
        width: 350,
        height: 50,
        color: config.colors.panel,
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 12
    }).center(gameState.statsContainer).sha("rgba(0,0,0,0.2)", 4);

    gameState.statsLabels = {
        question: new zim.Label({ 
            text: "প্রশ্ন: ০", 
            size: 20, 
            color: config.colors.text, 
            backgroundColor: config.colors.option1,
            padding: 5,
            corner: 8 
        }).pos(10, 0, "left", "center", gameState.statsContainer),
        correct: new zim.Label({ 
            text: "সঠিক: ০", 
            size: 20, 
            color: config.colors.text, 
            backgroundColor: config.colors.option2,
            padding: 5,
            corner: 8 
        }).pos(90, 0, "left", "center", gameState.statsContainer),
        incorrect: new zim.Label({ 
            text: "ভুল: ০", 
            size: 20, 
            color: config.colors.text, 
            backgroundColor: config.colors.option3,
            padding: 5,
            corner: 8 
        }).pos(170, 0, "left", "center", gameState.statsContainer),
        bonus: new zim.Label({ 
            text: "বোনাস: ০", 
            size: 20, 
            color: config.colors.text, 
            backgroundColor: config.colors.option4,
            padding: 5,
            corner: 8 
        }).pos(250, 0, "left", "center", gameState.statsContainer)
    };

    const helpLayout = new zim.Layout({
        holder: helpContainer,
        regions: [
            { object: gameState.titleLabel, maxHeight: 50, align: "center", valign: "top" },
            { object: gameState.statsContainer, maxHeight: 50, align: "center", valign: "bottom" }
        ],
        vertical: true
    });

    gameState.contentContainer = new zim.Container(W, H - 250).addTo(layoutHolder);
    gameState.contentContainer.type = "Region";
    gameState.vizRegion = new zim.Container(W * 0.5, gameState.contentContainer.height).addTo(gameState.contentContainer);
    gameState.vizRegion.type = "Region";
    gameState.qaRegion = new zim.Container(W * 0.5, gameState.contentContainer.height).addTo(gameState.contentContainer);
    gameState.qaRegion.type = "Region";

    const contentLayout = new zim.Layout({
        holder: gameState.contentContainer, regions: [
            { object: gameState.vizRegion, maxWidth: 50, marginLeft: 2 },
            { object: gameState.qaRegion, maxWidth: 50, marginLeft: 2 }
        ], vertical: false
    });

    gameState.footerContainer = new zim.Container(W, 100).addTo(layoutHolder);
    gameState.footerContainer.type = "Region";
    const owlContainer = new zim.Container(300, 100).addTo(gameState.footerContainer);
    owlContainer.type = "Region";
    const stopContainer = new zim.Container(200, 100).addTo(gameState.footerContainer);
    stopContainer.type = "Region";
    const statsContainer = new zim.Container(W - 500, 100).addTo(gameState.footerContainer);
    statsContainer.type = "Region";

    const footerLayout = new zim.Layout({
        holder: gameState.footerContainer, regions: [
            { object: owlContainer, align: "left", valign: "center", maxWidth: 30 },
            { object: statsContainer, align: "center", valign: "center", maxWidth: 40 },
            { object: stopContainer, align: "right", valign: "center", maxWidth: 30 }
        ], vertical: false
    });

    gameState.layout = new zim.Layout({
        holder: layoutHolder, regions: [
            { object: gameState.headerContainer, maxHeight: 15 },
            { object: gameState.contentContainer, minHeight: 70 },
            { object: gameState.footerContainer, maxHeight: 15 }
        ], vertical: true
    });

    gameState.layoutManager = new zim.LayoutManager();
    gameState.layoutManager.add(gameState.layout);
    gameState.layoutManager.add(headerLayout);
    gameState.layoutManager.add(helpLayout);
    gameState.layoutManager.add(scoreTimerLayout);
    gameState.layoutManager.add(contentLayout);
    gameState.layoutManager.add(footerLayout);

    new zim.Rectangle({
        width: W * 0.5 - 20, 
        height: gameState.contentContainer.height - 20, 
        color: config.colors.panel, 
        borderColor: config.colors.panelBorder, 
        borderWidth: 8, 
        corner: 30
    }).center(gameState.vizRegion);

    new zim.Rectangle({
        width: W * 0.5 - 20, 
        height: gameState.contentContainer.height - 20, 
        color: config.colors.panel, 
        borderColor: config.colors.panelBorder, 
        borderWidth: 8, 
        corner: 30
    }).center(gameState.qaRegion);

    gameState.scoreLabel = new zim.Label({ 
        text: `স্কোর: ০`, 
        size: 40, 
        color: config.colors.text, 
        bold: true, 
        outlineColor: config.colors.textOutline, 
        outlineWidth: 2 
    }).center(gameState.scoreContainer);

    const leaderboardButton = new zim.Button({
        label: new zim.Label({ text: "লিডার", size: 30, color: config.colors.text }),
        backgroundColor: config.colors.option4,
        rollBackgroundColor: config.colors.option4.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 100,
        height: 50
    }).pos(300, 0, "right", "center", gameState.scoreContainer);

    leaderboardButton.tap(() => {
        showLeaderboardScreen();
    });

    gameState.stopwatch = createStopwatch(gameState.timeLimit, gameState.timerContainer.height, gameState.timerContainer.width, gameState.layoutManager, S).center(gameState.timerContainer);
    gameState.stopwatch.on("done", () => {
        if (gameState.gameActive) {
            const timeTaken = gameState.timeLimit;
            gameState.performanceTracker.logResponse(gameState.currentA, gameState.currentB, null, timeTaken, false);
            gameState.gameActive = false;
            gameState.streak = 0;
            gameState.score = Math.max(0, gameState.score + config.points.incorrect);
            gameState.scoreLabel.text = `স্কোর: ${toBangla(gameState.score)}`;
            const feedback = new zim.Label({
                size: 60,
                color: "red",
                align: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
                padding: 20,
                corner: 15,
                text: `সময় শেষ! সঠিক উত্তর: ${toBangla(gameState.currentAnswer)}`
            }).center(S);
            transitionToNextQuestion(feedback);
        }
    });

    const stopButton = new zim.Button({
        label: new zim.Label({ text: "X", size: 50, color: "white" }),
        backgroundColor: config.colors.stopButton,
        width: 80, height: 80, corner: 40,
        shadowColor: "rgba(0,0,0,0.3)", shadowBlur: 5
    }).center(gameState.footerContainer.getChildAt(1));
    stopButton.on("click", () => {
        gameState.gameActive = false;
        gameState.stopwatch.stop();
        S.off("keydown");
        gameState.gameContainer.visible = false;
        gameState.performanceTracker.saveToLocal();
        gameState.startScreen = createStartScreen(S, frame.width, frame.height, config, gameState, { toBangla, shuffle, rand }, (level, container) => showLevelScreen(level, container, S, frame), showStatsScreen, showLeaderboardScreen, startStage);
        gameState.score = 0;
        gameState.streak = 0;
        gameState.timeLimit = config.initialTimeLimit;
        S.update();
    });

    const helpButton = new zim.Button({
        label: new zim.Label({ text: "?", size: 15, color: config.colors.text }),
        backgroundColor: config.colors.panelBorder,
        width: 40, height: 40, corner: 12
    }).pos(50, 50, "right", "bottom", gameState.footerContainer).tap(() => {
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

    gameState.questionLabel = new zim.Label({ 
        text: "...", 
        size: 60, 
        color: config.colors.text, 
        align: "center", 
        bold: true 
    }).center(gameState.qaRegion).mov(0, -150);

    gameState.typedLabel = new zim.Label({ 
        text: "", 
        size: 50, 
        color: "green" 
    }).center(gameState.qaRegion);

    gameState.feedbackLabel = new zim.Label({ 
        text: "সঠিক উত্তরটি বাছাই করুন অথবা টাইপ করে এন্টার চাপুন", 
        size: 30, 
        color: config.colors.text 
    }).center(gameState.footerContainer);

    return gameContainer;
}

export function showCongratsPane(callback) {
    const pane = new zim.Pane({
        width: 600,
        height: 400,
        label: new zim.Label({
            text: "অভিনন্দন! আপনি এই স্টেজ সম্পূর্ণ করেছেন।\n\nপরবর্তী স্টেজে যেতে চান?",
            size: 30,
            color: config.colors.text,
            align: "center"
        }),
        backgroundColor: config.colors.panel,
        backdropColor: zim.black.toAlpha(0.8),
        close: false
    }).show();

    const advanceButton = new zim.Button({
        label: new zim.Label({ text: "পরবর্তী স্টেজে যান", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option1,
        rollBackgroundColor: config.colors.option1.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(pane).mov(0, 100).tap(() => {
        pane.hide();
        countdownAnimation(callback);
    });

    const replayButton = new zim.Button({
        label: new zim.Label({ text: "পুনরায় খেলুন", color: config.colors.text, bold: true, size: 30 }),
        backgroundColor: config.colors.option2,
        rollBackgroundColor: config.colors.option2.darken(0.2),
        borderColor: config.colors.panelBorder,
        borderWidth: 4,
        corner: 20,
        width: 300,
        height: 80
    }).center(pane).mov(0, 190).tap(() => {
        pane.hide();
        countdownAnimation(startStage);
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
    }).center(pane).mov(0, 280).tap(() => {
        pane.hide();
        endGame();
    });
}

export function countdownAnimation(callback) {
    const S = gameState.gameContainer.stage; // Access stage from gameContainer
    const countdownLabel = new zim.Label({
        text: "৩",
        size: 100,
        color: config.colors.text,
        bold: true
    }).center(S).alp(0).sca(0).animate({alpha: 1, scale: 1}, 0.5, "backOut");

    zim.interval(1000, (i) => {
        if (i === 1) countdownLabel.text = "২";
        if (i === 2) countdownLabel.text = "১";
        if (i === 3) {
            countdownLabel.text = "শুরু!";
            countdownLabel.animate({alpha: 0, scale: 2}, 0.5, null, () => {
                countdownLabel.removeFrom();
                callback();
            });
            return false; // stop interval
        }
    }, 4);
}

export function showStatsScreen() {
    const stats = gameState.performanceTracker.getStatistics();
    const pane = new zim.Pane({
        width: 800,
        height: 600,
        label: new zim.Label({
            text: `পারফরম্যান্স স্ট্যাটিস্টিক্স:\n\nসমস্যাজনক প্রশ্নসমূহ: ${stats.problematicProblems.join(', ') || 'কোনো সমস্যাজনক প্রশ্ন নেই'}\nগড় প্রতিক্রিয়া সময়: ${stats.averageResponseTime.toFixed(2)} সেকেন্ড\nমোট সঠিক: ${stats.totalCorrect}\nমোট ভুল: ${stats.totalIncorrect}`,
            size: 30,
            color: config.colors.text,
            align: "center"
        }),
        backgroundColor: config.colors.panel,
        backdropColor: zim.black.toAlpha(0.8),
        close: true,
        closeColor: config.colors.text
    }).show();
}

export function showLeaderboardScreen() {
    let text = "লিডারবোর্ড:\n\nওভারঅল:\n";
    const overall = gameState.performanceTracker.getOverallLeaderboard();
    text += overall.map((entry, index) => `${index + 1}. ${entry.score} (${new Date(entry.date).toLocaleDateString()})`).join('\n') || 'কোনো স্কোর নেই';

    text += "\n\nলেভেল রান:\n";
    gameState.controller.levels.forEach(lev => {
        text += `লেভেল ${lev.id}:\n`;
        const levelLb = gameState.performanceTracker.getLevelLeaderboard(lev.id);
        text += levelLb.map((entry, index) => `${index + 1}. ${entry.score} (${new Date(entry.date).toLocaleDateString()})`).join('\n') || 'কোনো স্কোর নেই\n';
    });

    text += "\n\nস্টেজ:\n";
    gameState.controller.levels.forEach(lev => {
        text += `লেভেল ${lev.id}:\n`;
        loop(gameState.controller.stagesPerLevel, i => {
            const stageNum = i + 1; // Renamed to avoid shadowing
            text += `  স্টেজ ${stageNum}:\n`;
            const stageLb = gameState.performanceTracker.getStageLeaderboard(lev.id, stageNum);
            text += stageLb.map((entry, index) => `    ${index + 1}. ${entry.score} (${new Date(entry.date).toLocaleDateString()})`).join('\n') || '    কোনো স্কোর নেই\n';
        });
    });

    const pane = new zim.Pane({
        width: 600,
        height: 600,
        label: new zim.Label({
            text: text,
            size: 20,
            color: config.colors.text,
            align: "left"
        }),
        backgroundColor: config.colors.panel,
        backdropColor: zim.black.toAlpha(0.8),
        close: true,
        closeColor: config.colors.text
    }).show();
}

export function updateVisualization(a, b, frame) {
    zog("updateVisualization start:", a, "x", b);

    gameState.vizRegion.removeAllChildren();

    const panelPadding = config.panelPadding || 20;
    const panelMargin = 0;
    const panelW = gameState.vizRegion.width || (frame.width * 0.5);
    const panelH = gameState.vizRegion.height || (gameState.contentContainer ? gameState.contentContainer.height : frame.height * 0.5);

    const panel = new zim.Rectangle({
        width: panelW - 2 * (panelMargin + panelPadding),
        height: panelH - 2 * (panelMargin + panelPadding),
        color: config.colors.panel,
        borderColor: config.colors.panelBorder,
        borderWidth: 8,
        corner: 30
    }).center(gameState.vizRegion);
    zog("Panel bounds:", panel.getBounds().x, panel.getBounds().y, panel.getBounds().width, panel.getBounds().height);

    const optionColors = [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4];
    const pickColor = () => optionColors[rand(0, optionColors.length - 1)];

    const shapeFactories = [
        (size) => new zim.Circle(size / 2, pickColor(), config.colors.panelBorder, 2),
        (size) => new zim.Rectangle(size, size, pickColor(), config.colors.panelBorder, 2, 8),
        (size) => new zim.Triangle(size, size, size, pickColor(), config.colors.panelBorder, 2),
        (size) => new zim.Poly({ radius: size * 0.75, sides: 7, point: 0, color: pickColor(), borderColor: config.colors.panelBorder, borderWidth: 2 })
    ];
    const shapeFactory = shapeFactories[rand(0, shapeFactories.length - 1)];

    const maxCols = Math.min(b, 3);
    const cols = maxCols;
    const rows = Math.ceil(b / cols);
    const spacingH = 18;
    const spacingV = 18;
    const groupMargin = 3;

    const totalSpacingW = (cols - 1) * spacingH + 2 * panelPadding;
    const totalSpacingH = (rows - 1) * spacingV + 2 * panelPadding;
    let groupW = Math.floor((panelW - 2 * (panelMargin + panelPadding) - totalSpacingW) / cols);
    let groupH = Math.floor((panelH - 2 * (panelMargin + panelPadding) - totalSpacingH) / rows);

    const minGroupSize = Math.max(12, Math.min(a, b) * 1.2);
    groupW = Math.max(minGroupSize, groupW);
    groupH = Math.max(minGroupSize, groupH);

    let totalW = cols * groupW + (cols - 1) * spacingH;
    let totalH = rows * groupH + (rows - 1) * spacingV;

    let scaleFactor = 1;
    if (totalW > panelW - 2 * (panelMargin + panelPadding) || totalH > panelH - 2 * (panelMargin + panelPadding)) {
        scaleFactor = Math.min(
            (panelW - 2 * (panelMargin + panelPadding)) / totalW,
            (panelH - 2 * (panelMargin + panelPadding)) / totalH
        );
        groupW = Math.floor(groupW * scaleFactor);
        groupH = Math.floor(groupH * scaleFactor);
        totalW = Math.floor(totalW * scaleFactor);
        totalH = Math.floor(totalH * scaleFactor);
        spacingH = Math.floor(spacingH * scaleFactor);
        spacingV = Math.floor(spacingV * scaleFactor);
    }

    groupW = Math.max(minGroupSize, groupW);
    groupH = Math.max(minGroupSize, groupH);

    totalW = cols * groupW + (cols - 1) * spacingH;
    totalH = rows * groupH + (rows - 1) * spacingV;

    const startX = (panelW - totalW) / 2;
    const startY = (panelH - totalH) / 2;
    zog("Grid bounds: x=", startX, "y=", startY, "width=", totalW, "height=", totalH);

    const groups = [];

    for (let i = 0; i < b; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const gx = startX + col * (groupW + spacingH);
        const gy = startY + row * (groupH + spacingV);

        const group = new zim.Container(groupW, groupH).addTo(gameState.vizRegion);
        group.x = gx;
        group.y = gy;

        new zim.Rectangle({
            width: groupW,
            height: groupH,
            color: config.colors.panel.lighten(0.1),
            borderColor: config.colors.panelBorder,
            borderWidth: 2,
            corner: 12
        }).center(group).sha("rgba(0,0,0,0.1)", 3, 3, 5);

        const innerPad = Math.max(groupMargin, Math.min(groupW * 0.1, groupH * 0.1));
        const innerW = groupW - 2 * innerPad;
        const innerH = groupH - 2 * innerPad;
        const innerCols = Math.ceil(Math.sqrt(a));
        const innerRows = Math.ceil(a / innerCols);
        const gap = Math.min(6, Math.min(innerW / innerCols, innerH / innerRows) * 0.2);
        let shapeSizeW = Math.floor((innerW - (innerCols - 1) * gap) / innerCols);
        let shapeSizeH = Math.floor((innerH - (innerRows - 1) * gap) / innerRows);
        let shapeSize = Math.max(8, Math.min(shapeSizeW, shapeSizeH));

        if (innerCols * shapeSize + (innerCols - 1) * gap > innerW ||
            innerRows * shapeSize + (innerRows - 1) * gap > innerH) {
            shapeSize = Math.floor(Math.min(
                (innerW - (innerCols - 1) * gap) / innerCols,
                (innerH - (innerRows - 1) * gap) / innerRows
            ));
        }

        const totalShapeWidth = innerCols * shapeSize + (innerCols - 1) * gap;
        const totalShapeHeight = innerRows * shapeSize + (innerRows - 1) * gap;
        const offsetX = innerPad + (innerW - totalShapeWidth) / 2;
        const offsetY = innerPad + (innerH - totalShapeHeight) / 2;
        zog(`Group ${i}: offsetX=${offsetX}, offsetY=${offsetY}, shapeSize=${shapeSize}, innerW=${innerW}, innerH=${innerH}`);

        for (let j = 0; j < a; j++) {
            const sc = j % innerCols;
            const sr = Math.floor(j / innerCols);
            const sx = offsetX + sc * (shapeSize + gap);
            const sy = offsetY + sr * (shapeSize + gap);
            const shape = shapeFactory(shapeSize)
                .addTo(group)
                .pos(sx, sy, "left", "top");
        }

        group.alp(0).sca(0.5).animate({
            props: { alpha: 1, scale: 1 },
            time: 0.5 + i * 0.1,
            ease: "backOut",
            events: true
        });

        groups.push(group);
    }

    groups.forEach((group, i) => {
        const bounds = group.getBounds();
        zog(`Group ${i} bounds: x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`);
    });

    gameState.gameContainer.stage.update(); // Use gameContainer's stage
    zog("updateVisualization finished - groups:", groups.length);
}