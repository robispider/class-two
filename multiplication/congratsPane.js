
import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { startStage, endGame } from "./game.js";

// Displays a congratulatory pane after completing a stage
export function showCongratsPane(callback) {
    console.log("showCongratsPane: Starting");
    try {
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
        console.log("showCongratsPane: Pane created and shown");

        // Button to advance to the next stage
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
            console.log("showCongratsPane: Advance button tapped");
            pane.hide();
            countdownAnimation(callback, 1); // Use transitionCode 1 for next stage
        });
        console.log("showCongratsPane: Advance button created and positioned");

        // Button to replay the current stage
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
            console.log("showCongratsPane: Replay button tapped");
            pane.hide();
            countdownAnimation(startStage, 2); // Use transitionCode 2 for replay
        });
        console.log("showCongratsPane: Replay button created and positioned");

        // Button to return to the main menu
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
            console.log("showCongratsPane: Back button tapped");
            pane.hide();
            endGame();
        });
        console.log("showCongratsPane: Back button created and positioned");
    } catch (e) {
        console.error("showCongratsPane: Fatal error:", e);
        endGame();
    }
}

// Runs a screen-blocking countdown animation with configurable transition visualization
export function countdownAnimation(callback, transitionCode = 4) {
    const S = gameState.gameContainer.stage;
    console.log(`countdownAnimation: Starting with transitionCode=${transitionCode}`);
    try {
        // Create a screen-blocking foil
        const W = S.frame.width;
        const H = S.frame.height;
        // const foil = new zim.Rectangle(W, H, zim.black.toAlpha(0.8))
        //     .addTo(S)
        //     .alp(0)
        //     .animate({ alpha: 0.8 }, 0.5, "backIn"); // 0.5 seconds
        console.log(`countdownAnimation: Foil created with width=${W}, height=${H}`);

        // Configure primary emitter for transition visualization
        let primaryEmitter;
        let centerArea;
          let rings;
           const emitterColors = series(
                    config.colors.option1,
                    config.colors.option2,
                    config.colors.option3,
                    config.colors.option4,
                    zim.red,
                    zim.blue,
                    zim.green
                );
        switch (transitionCode) {
            case 1:
                // Transition 1: Upward rectangular particles
                console.log("countdownAnimation: Setting up Transition 1 - Upward rectangular particles");
                // new zim.Rectangle(10, 10, [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4])
                primaryEmitter = new zim.Emitter({
                    obj: 
                    series(
                        new zim.Triangle(10, 10, 10, emitterColors),
                        new zim.Rectangle(10, 10, emitterColors),
                        new zim.Label({ text: "×", size: 10, color: emitterColors }),
                        ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০"].map(num => 
                            new zim.Label({ text: num, size: 10, color: emitterColors })
                        )
                    )
                    ,
                    gravity: 0,
                    force: { min: 0.5, max: 1.5 },
                    angle: { min: -90 - 30, max: -90 + 30 }, // Upward direction
                    random: { scale: { min: 1, max: 3 } },
                    width: W - 20,
                    height: 0,
                    interval: 0.05, // Emit every 0.05 seconds
                    num: 10,
                    horizontal: true,
                    life: { min: 1, max: 4 }, // Particle life 1-2 seconds
                    startPaused: false // Start immediately
                }).center(S).mov(0, H / 2 + 10);
                break;
            case 2:
                // Transition 2: Circular particles spiraling from center
                console.log("countdownAnimation: Setting up Transition 2 - Spiraling circular particles");
                primaryEmitter = new zim.Emitter({
                    obj: new zim.Circle(5, [zim.gradient({ colors: ["red", "yellow", "blue"], x1: 0, y1: 0, x2: 10, y2: 10 })]),
                    gravity: 0,
                    force: { min: 1, max: 2 },
                    angle: { min: 0, max: 360 }, // Full circle for spiral effect
                    random: { scale: { min: 0.5, max: 2 }, rotation: { min: -360, max: 360 } },
                    interval: 0.03, // Emit every 0.03 seconds
                    num: 15,
                    horizontal: false,
                    life: { min: 1, max: 2 }, // Particle life 1-2 seconds
                    startPaused: false
                }).center(S);
                break;
            case 3:
                // Transition 3: Starburst with triangular particles
                console.log("countdownAnimation: Setting up Transition 3 - Starburst triangular particles");
                primaryEmitter = new zim.Emitter({
                    obj: new zim.Triangle(10, 10, 10, [config.colors.option1, config.colors.option2, config.colors.option3]),
                    gravity: 0,
                    force: { min: 1.5, max: 3 },
                    angle: { min: 0, max: 360 }, // Radiate outward
                    random: { scale: { min: 0.8, max: 2.5 }, rotation: { min: -180, max: 180 } },
                    interval: 0.02, // Emit every 0.02 seconds
                    num: 20,
                    horizontal: false,
                    life: { min: 0.5, max: 1.5 }, // Particle life 0.5-1.5 seconds
                    startPaused: false
                }).center(S);
                // foil.animate({
                //     props: { color: series(config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4) },
                //     time: 0.5, // Cycle colors every 0.5 seconds
                //     loop: true,
                //     rewind: true
                // });
                break;

            case 4:
                // Transition 4: Concentric rings and mixed shape emitter
                console.log("countdownAnimation: Setting up Transition 4 - Concentric rings and mixed shapes");
                rings = new zim.Container(W, H).center(S);
                const ringColors = series(config.colors.option1,config.colors.option2,config.colors.option3); // Use config colors
                zim.loop(12, i => {
                    new zim.Circle(640 - i * 20, ringColors).alp(.2)
                        .center(rings)
                       
                });
                rings.animate({
                    from: true,
                    props: { scale: 0,alpha:0 },
                    time: 0.7, // 0.7 seconds per ring
                       rewind:true,
                       rewindWait:2.5,
                    sequence: 0.1 // 0.1 seconds delay between rings
                });

               
                const radial=new RadialColor([config.colors.option1,"rgba(0, 0, 0, 0)"]);
                 centerArea=  new zim.Circle(640, radial)
                        .center(rings) 
                        .alp(0)
                        .sca(0)
                        .animate({alpha:1, scale:1}, 1);

                primaryEmitter = new zim.Emitter({
                    obj: series(
                        new zim.Triangle(80, 80, 80, emitterColors),
                        new zim.Rectangle(80, 80, emitterColors),
                        new zim.Label({ text: "×", size: 100, color: emitterColors }),
                        ...["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০"].map(num => 
                            new zim.Label({ text: num, size: 80, color: emitterColors })
                        )
                    ),
                    num: 5,
                    gravity: 0,
                    interval: 0.3, // Emit every 0.2 seconds
                    life: { min: 1, max: 3 }, // Particle life 1-3 seconds
                    random: {
                        scale: { min: 0.5, max: 1.5 },
                        rotation: { min: -90, max: 90 },
                        alpha: { min: 0, max: .2 }
                    },
                     animation:{props:{alpha:0,scale:1.5}, time:6, ease:"linear"},
                    startPaused: false
                }).center(S);
                break;
            default:
                console.warn(`countdownAnimation: Invalid transitionCode=${transitionCode}, falling back to Transition 1`);
                primaryEmitter = new zim.Emitter({
                    obj: new zim.Rectangle(10, 10, [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4]),
                    gravity: 0,
                    force: { min: 0.5, max: 1.5 },
                    angle: { min: -90 - 30, max: -90 + 30 },
                    random: { scale: { min: 1, max: 3 } },
                    width: W - 20,
                    height: 0,
                    interval: 0.05, // Emit every 0.05 seconds
                    num: 10,
                    horizontal: true,
                    life: { min: 1, max: 2 }, // Particle life 1-2 seconds
                    startPaused: false
                }).center(S).mov(0, -H / 2 + 10);
                break;
        }
        console.log(`countdownAnimation: Primary emitter created and positioned for transitionCode=${transitionCode}`);

        // Create floating multiplication signs and numbers emitter
        const banglaNumerals = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        const floatEmitter = new zim.Emitter({
            obj: new zim.Label({
                text: series("×", ...banglaNumerals),
                size: 30,
                color: config.colors.text,
                alpha: 0.5
            }),
            gravity: 0,
            force: { min: 0.3, max: 0.8 },
            angle: { min: -45, max: 45 }, // Diagonal upward motion
            random: {
                scale: { min: 0.5, max: 1.5 },
                rotation: { min: -90, max: 90 },
                x: { min: 0, max: W }, // Random x-position across stage
                y: { min: H, max: H + 100 } // Start below stage, float upward
            },
            interval: 0.2, // Emit every 0.2 seconds
            num: 5,
            horizontal: false,
            life: { min: 2, max: 4 }, // Particle life 2-4 seconds
            startPaused: false
        }).loc(0, H); // Start at bottom of stage
        console.log("countdownAnimation: Floating signs/numbers emitter created and positioned");

        // Create countdown label with contrasting background
        const countdownLabel = new zim.Label({
            text: "৩",
            size: 200,
            color: config.colors.text,
            bold: true,
            backgroundColor: "rgba(0, 0, 0, 0)",
            padding: 20,
            corner: 15
        }).center(S).alp(0).sca(0);
        console.log("countdownAnimation: Countdown label created with text='৩'");

        // Delay countdown start to let background animation establish
        zim.timeout(0.5, () => { // 0.5 seconds
            console.log("countdownAnimation: Starting countdown sequence");
            countdownLabel.animate({ alpha: 1, scale: 1 }, 0.5, "backOut"); // 0.5 seconds
            S.update();

            // Countdown sequence (4 intervals, 1 second each, total 4 seconds)
            zim.interval(1, (i) => {
                console.log(`countdownAnimation: Interval count=${i.count}`);
                if (i.count === 1) {
                    countdownLabel.animate({ alpha: 0, scale: 0.5 }, 0.3, null, () => { // 0.3 seconds
                        countdownLabel.text = "২";
                        countdownLabel.animate({ alpha: 1, scale: 1 }, 0.3, "backOut"); // 0.3 seconds
                        S.update();
                        console.log("countdownAnimation: Updated to text='২'");
                    });
                }
                if (i.count === 2) {
                    countdownLabel.animate({ alpha: 0, scale: 0.5 }, 0.3, null, () => { // 0.3 seconds
                        countdownLabel.text = "১";
                        countdownLabel.animate({ alpha: 1, scale: 1 }, 0.3, "backOut"); // 0.3 seconds
                        S.update();
                        console.log("countdownAnimation: Updated to text='১'");
                    });
                }
                if (i.count === 3) {
                    
                    countdownLabel.animate({ alpha: 0, scale: 0.5 }, 0.3, null, () => { // 0.3 seconds
                        countdownLabel.text = "শুরু!";
                        countdownLabel.size=100;
                        countdownLabel.mov(-50,-50);
                        countdownLabel.animate({ alpha: 1, scale: 1.5 }, 0.3, "backOut", () => { // 0.3 seconds
                            console.log("countdownAnimation: Displaying 'শুরু!'");
                            // Fade out all elements
                            // foil.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
                                // foil.removeFrom();
                                // console.log("countdownAnimation: Foil removed");
                            // });
                            primaryEmitter.pauseEmitter(true);
                            primaryEmitter.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
                                primaryEmitter.removeFrom();
                                rings.removeFrom();
                                console.log("countdownAnimation: Primary emitter removed");
                            });
                            floatEmitter.pauseEmitter(true);
                            floatEmitter.animate({ alpha: 0 }, 0.5, null, () => { // 0.5 seconds
                                floatEmitter.removeFrom();
                                console.log("countdownAnimation: Floating emitter removed");
                            });
                            countdownLabel.animate({ alpha: 0, scale: 2 }, 0.5, null, () => { // 0.5 seconds
                                countdownLabel.removeFrom();
                                console.log("countdownAnimation: Countdown label removed, executing callback");
                                callback();
                                S.update();
                            });
                        });
                        S.update();
                    });
                    return false; // Stop interval
                }
                S.update();
            }, 4); // Total duration: 4 seconds (4 intervals of 1 second)
        });
    } catch (e) {
        console.error("countdownAnimation: Fatal error:", e);
        const errorLabel = new zim.Label({
            text: "অ্যানিমেশন ত্রুটি। খেলা শেষ হচ্ছে।",
            size: 60,
            color: "red",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 20,
            corner: 15
        }).center(S);
        console.log("countdownAnimation: Error label created");
        // Stop background animations on error
        if (typeof foil !== "undefined") {
            // foil.animate({ alpha: 0 }, 0.5, null, () => { foil.removeFrom(); }); // 0.5 seconds
            console.log("countdownAnimation: Foil stopped and removed due to error");
        }
        if (typeof primaryEmitter !== "undefined") {
            primaryEmitter.pauseEmitter(true);
            primaryEmitter.animate({ alpha: 0 }, 0.5, null, () => { 
                   primaryEmitter.removeFrom();
                                rings.removeFrom();

             }); // 0.5 seconds
            console.log("countdownAnimation: Primary emitter stopped and removed due to error");
        }
        if (typeof floatEmitter !== "undefined") {
            floatEmitter.pauseEmitter(true);
            floatEmitter.animate({ alpha: 0 }, 0.5, null, () => { floatEmitter.removeFrom(); }); // 0.5 seconds
            console.log("countdownAnimation: Floating emitter stopped and removed due to error");
        }
        errorLabel.animate({ alpha: 0 }, 1, null, () => { // 1 second
            errorLabel.removeFrom();
            console.log("countdownAnimation: Error label removed, executing callback");
            callback();
            S.update();
        });
    }
}
