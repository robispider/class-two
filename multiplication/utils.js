export function toBangla(num) {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, d => banglaDigits[d]);
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createBackgroundDecorations(S, W, H, helpers) {
    const decorContainer = new zim.Container(W, H).addTo(S, 0);
    loop(50, () => {
        const type = helpers.rand(1, 3);
        let item;
        if (type === 1) {
            item = new zim.Label({
                text: helpers.rand(1, 9).toString(),
                size: helpers.rand(20, 80),
                color: "rgba(255,255,255,0.1)",
                italic: true
            });
        } else if (type === 2) {
            item = new zim.Poly({
                radius: helpers.rand(10, 40),
                color: "rgba(255,255,255,0.1)",
                sides: 5,
            });
        } else {
            item = new zim.Squiggle({
                length: helpers.rand(50, 150),
                color: "rgba(255,255,255,0.1)",
                thickness: helpers.rand(20, 40)
            });
        }
        item.pos(helpers.rand(0, W), helpers.rand(0, H)).rot(helpers.rand(0, 360)).addTo(decorContainer);
    });
    return decorContainer;
}