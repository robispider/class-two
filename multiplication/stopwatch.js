export function createStopwatch(totalTime = 15, height = 80, width = 400, layoutManager, stage = null) {
    const colors = {
        pink: "#E55B86",
        cream: "#FDF0D5",
        orangeRed: "#F26D5B",
        darkBrown: "#5C2626",
        yellow: "#FDBF5A",
        panel: "rgba(0,0,0,0.1)"
    };
    const stopwatch = new zim.Container(width, height);
 
    const timeHolder = new zim.Container(width * 0.5, height).addTo(stopwatch);

    
     new zim.Rectangle({width:width * 1,height: height * 1, color:colors.pink, corner:10})
        .pos(-17, 0, "left", "middle", timeHolder);

    const timeLabel = new zim.Label({
        text: "সময়: 0:00",
        size: height * 0.7,
        color: colors.darkBrown,
        font: "arial",
        bold: true,
        outlineColor: colors.cream,
        outlineWidth: 1,
    }).pos(10, 0, "left", "middle", timeHolder);
    const scoreHolder = new zim.Container(width * 0.2, height).addTo(stopwatch);
    const scoreLabel = new zim.Label({
        text: "0",
        size: height * 0.3,
        color: colors.darkBrown,
        bold: true,
        outlineColor: colors.cream,
        outlineWidth: 2
    }).pos(0, 0, "center", "center", scoreHolder).mov(0, height * 0.15);
    new zim.Poly({
        points: 5,
        radius: height * 0.22,
        color: colors.yellow,
        sides: 5,
        outlineColor: colors.darkBrown,
        outlineWidth: 2
    }).pos(0, 0, "center", "center", scoreHolder).mov(0, -height * 0.1);


       const dialHolder = new zim.Container(height, height).addTo(stopwatch);
    const dial = new zim.Dial({
        min: 0, max: 100, step: 0, width: height * 0.8,
        backgroundColor: colors.pink,
        indicatorColor: colors.darkBrown,
        indicatorType: "line",
        innerCircle: true,
        innerColor: colors.cream,
        accentSize: height * 0.3,
        accentColor: colors.orangeRed,
        accentBackgroundColor: colors.cream.darken(0.1),
    }).center(dialHolder);
   
    dial.mouseEnabled = false;
    dial.keyArrows = false;
    dial.cursor = "default";

    const layout = new zim.Layout({
        holder: stopwatch,
        regions: [
            { object: dialHolder, minWidth: 20,align: "left", valign: "center" },
            { object: timeHolder, maxWidth: 50, align: "center", valign: "center" },
            { object: scoreHolder, maxWidth: 20, align: "right", valign: "center" }
        ],showRegions:false,
     
        vertical: false,
    });
    if (layoutManager) {
        layoutManager.add(layout);
    }
    let elapsed = 0;
    let interval = null;
    let startTime = null;

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `0${m}:${s < 10 ? "0" : ""}${s}`;
    }

    function update() {
        elapsed++;
        const percent = (elapsed / totalTime) * 100;
        dial.value = percent;
        timeLabel.text = "সময়: " + formatTime(totalTime - elapsed);
        if (stage) stage.update();
        if (elapsed >= totalTime) {
            timeLabel.text = "সময়: 0:00";
            clearInterval(interval);
            stopwatch.dispatchEvent("done");
        }
    }

    stopwatch.setTime = function(seconds) {
        totalTime = seconds;
        stopwatch.reset();
    };

    stopwatch.start = function() {
        stopwatch.reset();
        startTime = Date.now();
        interval = setInterval(update, 1000);
    };

    stopwatch.stop = function() {
        clearInterval(interval);
    };

    stopwatch.reset = function() {
        clearInterval(interval);
        elapsed = 0;
        dial.value = 0;
        timeLabel.text = "সময়: " + formatTime(totalTime);
        if (stage) stage.update();
    };

    stopwatch.getElapsedTime = function() {
        if (startTime) {
            return (Date.now() - startTime) / 1000;
        }
        return elapsed;
    };

    stopwatch.reset();
    return stopwatch;
}