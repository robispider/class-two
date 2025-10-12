import zim from "https://zimjs.org/cdn/018/zim_game";
import { gameState, config } from "./main.js";
import { rand } from "./utils.js";

export function updateVisualization(a, b, frame) {
    zog("updateVisualization start:", a, "x", b);

    if (gameState.vizRegion.numChildren>1 )
    {
        console.log(gameState.vizRegion.children);
          zim.loop(gameState.vizRegion.children, (item, i) => {
                            // button.alp(1).sca(1);
                            if (item.type==="Container")
                            {
                            item.animate({
                                props: { alpha: 0, scale: 0 },
                                time: 0.5,
        
                            ease: "backOut" // A nice easing for a little bounce effect
                            });
                        }
                            
                        }, false,.1);
                    

    }
    console.log(gameState.vizRegion.children);
    gameState.vizRegion.removeAllChildren();
console.log(gameState.vizRegion.children);
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
        // (size) => new zim.Poly({ radius: size * 0.75, sides: 7, point: 0, color: pickColor(), borderColor: config.colors.panelBorder, borderWidth: 2 })
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