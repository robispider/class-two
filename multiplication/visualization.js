import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { rand } from "./utils.js";
/**
 * Animates the removal of all visual elements from the visualization region.
 * This is an independent function and can be called anytime to clear the vizRegion.
 * @param {function} [callback] - An optional function to call after all elements have finished animating out.
 */
export function clearVisualization(callback) {
    zog("clearVisualization called.",gameState.vizRegion.children);

    // Find all container groups that need to be animated out.
    // The background panel is a Rectangle, so it won't be included.
    const containersToRemove = gameState.vizRegion.children.filter(child => child.type === "Container");
 zog("containers to remove: ",containersToRemove);
    // If there's nothing to remove, just empty the region and call the callback.
    if (containersToRemove.length === 0) {
        zog("No containers found to clear.");
      //  gameState.vizRegion.removeAllChildren(); // Ensure it's fully empty
        gameState.gameContainer.stage.update();
        if (callback) callback();
        return;
    }

    zog(`Found ${containersToRemove.length} containers to clear. Starting animation.`);

    // Use a countdown to know when all animations have finished.
    let animationsRemaining = containersToRemove.length;

    // Loop through each container and start its "disappear" animation.
    zim.loop(containersToRemove, (container) => {
        container.animate({
            props: { alpha: 0, scale: 0 },
            time: 0.3,
            ease: "backIn",
               
                    sequence: 0.1 ,
            // The 'call' function runs when this specific animation is complete.
            call: () => {
                animationsRemaining--; // Decrement the counter

                // If the counter is zero, all animations are done.
                if (animationsRemaining === 0) {
                    zog("All clearing animations complete.");
                   // gameState.vizRegion.removeAllChildren(); // Final, definitive cleanup
                    gameState.gameContainer.stage.update();
                    if (callback) callback(); // Execute the callback if it exists
                }
            }
        });
    });
}

/**
 * Main controller function for the visualization.
 * It first removes any existing content with an animation before drawing new content.
 */
export function updateVisualization(a, b, frame,shapeIndex) {
    zog("updateVisualization start:", a, "x", b);

    // Find only the container groups that need to be animated out.
    // We filter to avoid trying to animate the background panel if it's not a container.
    const containersToRemove = gameState.vizRegion.children.filter(child => child.type === "Container");

    // If there are no containers to remove, we can immediately draw the new visualization.
    if (containersToRemove.length === 0) {
        zog("No old containers found. Drawing new visualization immediately.",shapeIndex);
        drawNewVisualization(a, b, frame,shapeIndex);
        return;
    }

    // --- If we are here, it means there is old content to remove. ---
    zog(`Found ${containersToRemove.length} containers to remove. Starting animation.`);

    // 1. Set up a countdown. This is our mechanism to know when all animations are done.
    let animationsRemaining = containersToRemove.length;

    // 2. Loop through each container and start its "disappear" animation.
    zim.loop(containersToRemove, (container) => {
        container.animate({
            props: { alpha: 0, scale: 0 },
            time: 0.3,
            ease: "backIn", // "backIn" is a good ease for disappearing objects
            // 3. The 'call' function is a callback that runs when THIS animation is complete.
            call: () => {
                animationsRemaining--; // Decrement the counter
                // 4. If the counter is zero, all animations have finished.
                if (animationsRemaining === 0) {
                    zog("All removal animations complete. Now drawing new visualization.");
                    drawNewVisualization(a, b, frame,shapeIndex);
                }
            }
        });
    });
}

/**
 * Handles the creation and animation of the new visualization elements.
 * This function should only be called after the vizRegion is clear.
 */
/**
 * Handles the creation and animation of the new visualization elements.
 * This function should only be called after the vizRegion is clear.
 */
/**
 * Handles the creation and animation of the new visualization elements.
 * This function should only be called after the vizRegion is clear.
 */
function drawNewVisualization(a, b, frame,shapeIndex) {
    // We can now safely remove all children. The old ones are invisible and their animation is done.
    gameState.vizRegion.removeAllChildren();

    const panelPadding = config.panelPadding || 20;
    const panelMargin = 0;
    const panelW = gameState.vizRegion.width || (frame.width * 0.5);
    const panelH = gameState.vizRegion.height || (gameState.contentContainer ? gameState.contentContainer.height : frame.height * 0.5);

    // The rest of your drawing logic remains the same...
    const panel = new zim.Rectangle({
        width: panelW - 2 * (panelMargin + panelPadding),
        height: panelH - 2 * (panelMargin + panelPadding),
        color: config.colors.panel,
        borderColor: config.colors.panelBorder,
        borderWidth: 8,
        corner: 30
    }).center(gameState.vizRegion);

    const optionColors = [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4];
    const pickColor = () => optionColors[rand(0, optionColors.length - 1)];

    // const shapeFactories = [
    //     (size) => new zim.Circle(size / 2, pickColor(), config.colors.panelBorder, 2),
    //     (size) => new zim.Rectangle(size, size, pickColor(), config.colors.panelBorder, 2, 8),
    //     (size) => new zim.Triangle(size, size, size, pickColor(), config.colors.panelBorder, 2),
    //     (size) => {  // New vegetable factory (index 3)
    //         const randomFrame = Math.floor(Math.random() * 12);  // 0-14 for frames
    //         const veggieImage = frame.asset("assets/Vegetables.png"); // Corrected path
    //         if (!veggieImage) {
    //             zog("Warning: Vegetables.png asset not loaded. Falling back to default shape.");
    //             return new zim.Circle(size / 2, pickColor(), config.colors.panelBorder, 2); // Fallback
    //         }
    //         // const randomFrame = Math.floor(Math.random() * 15); // 0-14 for 15 frames
    //         const veggie = new zim.Sprite({
    //             image: veggieImage,
    //             cols: 4,
    //             rows: 7,
    //             count: 28
    //         });
    //         veggie.gotoAndStop(randomFrame); 
    //         veggie.siz(size, size, true); // Fit within size x size
    //         veggie.centerReg(); // Center registration
    //         return veggie;
    //     }
    // ];
    // // const shapeFactory = shapeFactories[rand(0, shapeFactories.length - 1)];
    // const shapeFactory = shapeFactories[shapeIndex || rand(0, shapeFactories.length - 1)];
    const shapeFactory = (size) => {
        const assetImage = frame.asset(config.assets.fileName);
        if (!assetImage) {
            zog(`Warning: ${config.assets.fileName} not loaded. Falling back to default shape.`);
            return new zim.Circle(size / 2, "gray"); // Fallback
        }

        const itemSprite = new zim.Sprite({
            image: assetImage,
            cols: config.assets.cols,
            rows: config.assets.rows,
            count: config.assets.count
        });

        itemSprite.gotoAndStop(shapeIndex); // Use the selected item index
        itemSprite.siz(size, size, true); // Fit sprite within the calculated size
        itemSprite.centerReg();
        return itemSprite;
    };
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
    const groups = [];

    for (let i = 0; i < b; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const gx = startX + col * (groupW + spacingH);
        const gy = startY + row * (groupH + spacingV);

        const group = new zim.Container(groupW, groupH); // Note: Not added to stage yet
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
        let shapeSize = Math.max(8, Math.min(
            Math.floor((innerW - (innerCols - 1) * gap) / innerCols),
            Math.floor((innerH - (innerRows - 1) * gap) / innerRows)
        ));

        const totalShapeWidth = innerCols * shapeSize + (innerCols - 1) * gap;
        // ----------- THE FIX IS HERE -----------
        const totalShapeHeight = innerRows * shapeSize + (innerRows - 1) * gap;
        // -------------------------------------
        const offsetX = innerPad + (innerW - totalShapeWidth) / 2;
        const offsetY = innerPad + (innerH - totalShapeHeight) / 2;

        for (let j = 0; j < a; j++) {
            const sc = j % innerCols;
            const sr = Math.floor(j / innerCols);
            const sx = offsetX + sc * (shapeSize + gap);
            const sy = offsetY + sr * (shapeSize + gap);
            shapeFactory(shapeSize).addTo(group).pos(sx, sy, "left", "top").alp(0);

        }
        groups.push(group);
    }
    
    // Animate the new groups into view
    const newContainerForGroups = new zim.Container().addTo(gameState.vizRegion);
    groups.forEach(g => g.addTo(newContainerForGroups));
    
    newContainerForGroups.children.forEach(item => item.alp(0).sca(0.5));
//    zim.loop(newContainerForGroups.children, (group, i) => {
//         // 1. Make the group container itself invisible and scaled down.
//         group.alp(0).sca(0.5);

//         // 2. Animate the container into view. The 'wait' property staggers the start time.
//         group.animate({
//             props: { alpha: 1, scale: 1 },
//             time: 0.4,
//             wait:  0.2, // Stagger the start of each container's animation.
//             ease: "backOut",
//             // 3. When THIS specific container's animation is complete, this 'call' function runs.
//             call: () => {
//                 // Get all children of the group EXCEPT the first one (which is the background rectangle).
//                 const shapesInGroup = group.children.slice(1);

//                 // Now, animate only the shapes within this group to fade them in.
//                 zim.animate({
//                     target: shapesInGroup,
//                     props: { alpha: 1 },
//                     time: 0.3,
//                     sequence: 0.2, // A fast stagger for a nice cascade effect inside the group.
//                     ease: "linear"
//                 });
//             }
//         });
//     });
 // visualization.js -> drawNewVisualization() ফাংশশনের শেষে

    // zim.loop এর মাধ্যমে প্রতিটি group এর জন্য আলাদা অ্যানিমেশন সেট করা হবে
    zim.loop(newContainerForGroups.children, (group, i) => {
        // ১. প্রতিটি group container কে অদৃশ্য এবং ছোট করে রাখা হয়েছে
        group.alp(0).sca(0.5);

        // ২. wait property ব্যবহার করে প্রতিটি group এর অ্যানিমেশন শুরু হতে দেরি করানো হয়েছে
        group.animate({
            props: { alpha: 1, scale: 1 },
            time: 0.4,
            wait: i * 0.1, // প্রতিটি group এর অ্যানিমেশন শুরু হওয়ার মধ্যে ০.১ সেকেন্ডের ব্যবধান
            ease: "backOut",
            // ৩. যখন এই group এর অ্যানিমেশন শেষ হবে, তখন এই call ফাংশনটি চলবে
            call: () => {
                // group এর ভেতরের আইটেমগুলোকে (background বাদে) নেওয়া হচ্ছে
                const shapesInGroup = group.children.slice(1);

                // ৪. প্রথমে আইটেমগুলোকে দৃশ্যমান করার জন্য অ্যানিমেট করা হচ্ছে
                zim.animate({
                    target: shapesInGroup,
                    props: { alpha: 1 },
                    time: 0.3,
                    sequence: 0.02, // গ্রুপ এর ভেতরের আইটেমগুলো একের পর এক আসবে
                    ease: "linear",
                    // ৫. দৃশ্যমান হওয়ার অ্যানিমেশন শেষ হলে, wiggle() শুরু হবে
                    call: () => {
                        // গ্রুপ এর প্রতিটি আইটেমের জন্য wiggle() মেথড ব্যবহার করা হচ্ছে
                        shapesInGroup.forEach(shape => {
                            // rotation property-কে -5 থেকে 5 ডিগ্রির মধ্যে wiggle করা হচ্ছে
                            shape.wiggle("rotation", 0, -5, 5, 0.4, 0.8);

                            // --- START: পরিবর্তন এখানে ---
                            // scale property-কে তার বেস ভ্যালু 1 থেকে wiggle করা হচ্ছে
                            // *** ভুল এখানে ছিল: shape.wiggle("scale", shapeSize, ...);
                            // *** সঠিক কোড:
                            // shape.wiggle("alpha", 1, 0.02, .05, 0.05, 1);
                            // --- END: পরিবর্তন এখানে ---
                        });
                    }
                });
            }
        });
    });

    gameState.gameContainer.stage.update();
    zog("updateVisualization finished - new groups:", groups.length);
}