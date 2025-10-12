// js/utils.js
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

export function createBackgroundDecorations(scene, W, H) {
    const decorContainer = scene.add.container(0, 0);
    for (let i = 0; i < 50; i++) {
        const type = rand(1, 3);
        let item;
        if (type === 1) {
            item = scene.add.text(rand(0, W), rand(0, H), rand(1, 9).toString(), {
                fontSize: rand(20, 80) + 'px',
                fill: 'rgba(255,255,255,0.1)',
                fontStyle: 'italic'
            }).setRotation(rand(0, 360) * Math.PI / 180);
        } else if (type === 2) {
            item = scene.add.graphics();
            item.fillStyle(0xffffff, 0.1);
            item.fillCircle(0, 0, rand(10, 40));
            item.setPosition(rand(0, W), rand(0, H));
            item.rotation = rand(0, 360) * Math.PI / 180;
        } else {
            item = scene.add.graphics();
            item.lineStyle(rand(20, 40), 0xffffff, 0.1);
            item.beginPath();
            item.moveTo(0, 0);
            item.lineTo(rand(50, 150), 0);
            item.strokePath();
            item.setPosition(rand(0, W), rand(0, H));
            item.rotation = rand(0, 360) * Math.PI / 180;
        }
        decorContainer.add(item);
    }
    return decorContainer;
}