import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";

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