// performanceTracker.js
export default class PerformanceTracker {
    constructor() {
        this.responses = [];
        this.stageHighs = [];
        this.levelHighs = [];
        this.overallHighs = [];
        this.totalCorrect = 0;
        this.totalIncorrect = 0;
        this.loadFromLocal();
    }

    logResponse(a, b, given, timeTaken, correct) {
        this.responses.push({a, b, given, timeTaken, correct, timestamp: Date.now()});
        if (correct) {
            this.totalCorrect++;
        } else {
            this.totalIncorrect++;
        }
    }

    saveStageHigh(level, stage, score) {
        this.stageHighs.push({level, stage, score, date: new Date().toISOString()});
        this.stageHighs.sort((a, b) => b.score - a.score);
        this.stageHighs = this.stageHighs.filter((s, i, arr) => {
            return arr.findIndex(s2 => s2.level === s.level && s2.stage === s.stage) === i;
        }).slice(0, 10);
    }

    saveLevelHigh(level, score) {
        this.levelHighs.push({level, score, date: new Date().toISOString()});
        this.levelHighs.sort((a, b) => b.score - a.score);
        this.levelHighs = this.levelHighs.filter((s, i, arr) => {
            return arr.findIndex(s2 => s2.level === s.level) === i;
        }).slice(0, 10);
    }

    saveOverallHigh(score) {
        this.overallHighs.push({score, date: new Date().toISOString()});
        this.overallHighs.sort((a, b) => b.score - a.score);
        this.overallHighs = this.overallHighs.slice(0, 10);
    }

    getStatistics() {
        const problemMap = {};
        let totalTime = 0;
        let count = 0;

        this.responses.forEach(res => {
            const key = `${res.a}x${res.b}`;
            if (!problemMap[key]) {
                problemMap[key] = {correct: 0, incorrect: 0, times: []};
            }
            if (res.correct) {
                problemMap[key].correct++;
            } else {
                problemMap[key].incorrect++;
            }
            problemMap[key].times.push(res.timeTaken);
            totalTime += res.timeTaken;
            count++;
        });

        const problematicProblems = Object.keys(problemMap)
            .filter(key => problemMap[key].incorrect > problemMap[key].correct)
            .map(key => key);

        const averageResponseTime = count > 0 ? totalTime / count : 0;

        return {
            problematicProblems,
            averageResponseTime,
            totalCorrect: this.totalCorrect,
            totalIncorrect: this.totalIncorrect
        };
    }

    getStageLeaderboard(level, stage) {
        return this.stageHighs.filter(s => s.level === level && s.stage === stage).sort((a, b) => b.score - a.score).slice(0, 10);
    }

    getLevelLeaderboard(level) {
        return this.levelHighs.filter(s => s.level === level).sort((a, b) => b.score - a.score).slice(0, 10);
    }

    getOverallLeaderboard() {
        return this.overallHighs.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    saveToLocal() {
        localStorage.setItem('multiplicationGameData', JSON.stringify({
            responses: this.responses,
            stageHighs: this.stageHighs,
            levelHighs: this.levelHighs,
            overallHighs: this.overallHighs,
            totalCorrect: this.totalCorrect,
            totalIncorrect: this.totalIncorrect
        }));
    }

    loadFromLocal() {
        const data = localStorage.getItem('multiplicationGameData');
        if (data) {
            const parsed = JSON.parse(data);
            this.responses = parsed.responses || [];
            this.stageHighs = parsed.stageHighs || [];
            this.levelHighs = parsed.levelHighs || [];
            this.overallHighs = parsed.overallHighs || [];
            this.totalCorrect = parsed.totalCorrect || 0;
            this.totalIncorrect = parsed.totalIncorrect || 0;
        }
    }
}