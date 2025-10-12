import zim from "https://zimjs.org/cdn/018/zim_game";
import { createStopwatch } from "./stopwatch.js";
import PerformanceTracker from "./performanceTracker.js";
import QuestionGenerator from "./questionGenerator.js";
import GameplayController from "./GameplayController.js";

import { createBackgroundDecorations, toBangla, shuffle, rand } from "./utils.js";
import { createStartScreen } from "./startScreen.js";
import { showLevelScreen } from "./levelScreen.js";
import { showPracticeScreen } from "./practiceScreen.js";
import { showStageScreen } from "./stageScreen.js";
import { createGameScreen } from "./gameScreen.js";
import { showStatsScreen } from "./statsScreen.js";
import { showLeaderboardScreen } from "./leaderboardScreen.js";
import { updateVisualization } from "./visualization.js";
import { showCongratsPane, countdownAnimation } from "./congratsPane.js";
import { startStage, startQuestionSet, updateStatsLabel, endStage, endGame } from "./game.js";

// Define config, uiColors, gameState, and emitter at module scope
const uiColors = {
    bgGradient: ["#A3D5E5", "#7A9AC9"],
    panel: "#FDF0D5",
    panelBorder: "#5C2626",
    text: "#5C2626",
    textOutline: "#FFFFFF",
    option1: "#FDEB8D",
    option2: "#A8E0D7",
    option3: "#A3D5E5",
    option4: "#F5B7B1",
    stopButton: "#E55B86"
};

const config = {
    colors: uiColors,
    initialTimeLimit: 15,
    minTimeLimit: 3,
    timeReduction: 2,
    numberOfOptions: 4,
    points: { correct: 10, streakBonus: 2, incorrect: -5 },
    shapes: ["rectangle", "circle", "triangle"],
    padding: 0.02,
    panelPadding: 20,
    assets: {
        fileName: "fruitvegeset.png",
        cols: 5,
        rows: 9,
        count: 45,
        itemNames: [
            "নাশপাতি", "টমেটো", "গাজর", "কলা", "লেবু",
        // সারি ২ (ফল/সবজি)
        "মূলা", "আপেল", "কমলা", "তরমুজ", "স্ট্রবেরি",
        // সারি ৩ (সবজি/ফল)
        "মরিচ", "কুমড়া", "বাঁধাকপি", "ফুলকপি", "আনারস",
        // সারি ৪ (রত্ন - ত্রিভুজ)
        "কমলা ত্রিভুজ", "নীল ত্রিভুজ", "বেগুনি ত্রিভুজ", "সবুজ ত্রিভুজ", "লাল ত্রিভুজ",
        // সারি ৫ (রত্ন - বর্গ)
        "কমলা বর্গ", "নীল বর্গ", "বেগুনি বর্গ", "সবুজ বর্গ", "লাল বর্গ",
        // সারি ৬ (রত্ন - পঞ্চভুজ)
        "কমলা পঞ্চভুজ", "নীল পঞ্চভুজ", "বেগুনি পঞ্চভুজ", "সবুজ পঞ্চভুজ", "লাল পঞ্চভুজ",
        // সারি ৭ (রত্ন - ষড়ভুজ)
        "কমলা ষড়ভুজ", "নীল ষড়ভুজ", "বেগুনি ষড়ভুজ", "সবুজ ষড়ভুজ", "লাল ষড়ভুজ",
           // সারি ৮ (জাদুর শরবত)
        "কমলা জাদুর শরবত", "নীল জাদুর শরবত", "বেগুনি জাদুর শরবত", "সবুজ জাদুর শরবত", "লাল জাদুর শরবত",
        // সারি ৯ (গোলক)
        "কমলা তারা গোলক", "নীল তারা গোলক", "বেগুনি তারা গোলক", "সবুজ তারা গোলক", "লাল তারা গোলক"
        ]
    },
    questionsPerSession: 20,


};

const gameState = {
    gameContainer: null, startScreen: null,
    maxNumber: 10, score: 0, streak: 0, gameActive: false,
    currentQuestion: null, questionData: null,
    healthBar: null,
    qaRegion: null, footerContainer: null,
    scoreLabel: null, questionLabel: null, questionTitle: null, questionContainer: null, typedLabel: null,
    feedbackLabel: null, optionTile: null,
    character: null, layoutManager: null, stopwatch: null, timerContainer: null,
    scoreContainer: null,
    performanceTracker: null,
    questionGenerator: null,
    startTime: null,
    controller: null,
    currentLevel: 1,
    currentStage: 1,
    mode: 'stage', // 'stage', 'level_run', 'overall_run', 'practice'
    questionCount: 0,
    correctCount: 0,
    savedTime: 0,
    bonusRemaining: 0,
    isBonus: false,
    sessionScore: 0,
    levelRunScore: 0,
    overallScore: 0,
    mainAnswered: 0,
    fixedMultiplier: 0,
    statsLabel: null,
    titleLabel: null,
    statsLabels: null,
    statsContainer: null,
        openboxTile:null,
    closeboxTile:null,
};
const planes=["plane_pack/planes/plane_1/plane_1_blue.png",
            "plane_pack/planes/plane_1/plane_1_pink.png",
            "plane_pack/planes/plane_1/plane_1_red.png",
            "plane_pack/planes/plane_1/plane_1_yellow.png",
            "plane_pack/planes/plane_2/plane_2_blue.png",
            "plane_pack/planes/plane_2/plane_2_green.png",
            "plane_pack/planes/plane_2/plane_2_red.png",
            "plane_pack/planes/plane_2/plane_2_yellow.png",
            "plane_pack/planes/plane_3/plane_3_blue.png",
            "plane_pack/planes/plane_3/plane_3_green.png",
            "plane_pack/planes/plane_3/plane_3_red.png",
            "plane_pack/planes/plane_3/plane_3_yellow.png",     
            "missilebattery.png"    ,
            "missile.png"           
        ];
const emitter = new zim.Emitter({
    obj: () => new zim.Circle(10, zim.series(config.colors.option1, config.colors.option2, config.colors.option3)),
    startPaused: true, poolMin: 100, force: { min: 2, max: 5 }, life: 1.5
});

const frame = new zim.Frame({
    scaling: zim.FIT, width: 1024, height: 768,
    assets: 
     [config.assets.fileName, "openbox.png", "closebox.png","puzzel1.jpg","crowfly.png","plane_pack/planes/plane_1/plane_1_blue.png"].concat(planes),
    path: "assets/",
    outerColor: "#333333",
    ready: ready
});
frame.on("error", (e) => { zog("Frame initialization error:", e); });

function ready(frame, stage, width, height) {
    const F = frame; const S = stage; const W = width; const H = height;

    F.on("resize", () => {
        if (gameState.layoutManager == null) return;
        gameState.layoutManager.resize();
        S.update();
    });

    const helpers = { toBangla, shuffle, rand };

    gameState.controller = new GameplayController();

    createBackgroundDecorations(S, W, H, helpers);
    gameState.gameContainer = createGameScreen(W, H, S, config, gameState, createStopwatch, showLeaderboardScreen, showStatsScreen, endGame);
    gameState.startScreen = createStartScreen(S, W, H, (level, container) => showLevelScreen(level, container, S, F, showStageScreen, showPracticeScreen, showStatsScreen, showLeaderboardScreen, startStage), showStatsScreen, showLeaderboardScreen, startStage);
    gameState.gameContainer.visible = false;
    gameState.layoutManager.resize();
       gameState.openboxTile = new Bitmap(F.asset("openbox.png")).addBitmapData();
  
    gameState.closeboxTile = new Bitmap(F.asset("closebox.png")).addBitmapData();
     
F.loadAssets("crowfly.png");
       zog("--- Debugging Tiles ---");
    zog("openboxTile object:", gameState.openboxTile);
    zog("openboxTile.bitmapData:", gameState.openboxTile.bitmapData);
    // const testBox = new zim.Bitmap(gameState.openboxTile).center(S);
    
    S.update();
}

export { gameState, config, uiColors, emitter };