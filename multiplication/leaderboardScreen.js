import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";

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