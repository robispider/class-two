// js/scenes/PreloadScene.js
import { loadedAssetKeys, assetManifest } from '../AssetManager.js';

class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        const { width, height } = this.scale;

        // --- UI -------------------------------------------------
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8)
            .fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        const loadingText = this.make.text({
            x: width / 2, y: height / 2 - 50,
            text: 'Loading...', style: { font: '20px monospace', fill: '#ffffff' }
        }).setOrigin(0.5);

        const percentText = this.make.text({
            x: width / 2, y: height / 2 - 5,
            text: '0%', style: { font: '18px monospace', fill: '#ffffff' }
        }).setOrigin(0.5);

        this.load.on('progress', v => {
            percentText.setText(parseInt(v * 100) + '%');
            progressBar.clear()
                .fillStyle(0xffffff, 1)
                .fillRect(width / 2 - 150, height / 2 - 20, 300 * v, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy(); progressBox.destroy();
            loadingText.destroy(); percentText.destroy();
            this.scene.start('StartScreenScene');
        });

        // --- Fonts ------------------------------------------------
        WebFont.load({
            google: { families: ['Noto Sans Bengali:400,700'] },
            active: () => console.log('Fonts loaded successfully!'),
            inactive: () => console.warn('Fonts failed to load.')
        });

        // --- Load menu assets ------------------------------------
        const menuAssets = assetManifest.menu;
        for (const asset of menuAssets) {
            if (!loadedAssetKeys.has(asset.key)) {
                this.load[asset.type](asset.key, asset.path, asset.options);
                loadedAssetKeys.add(asset.key);
            }
        }

        this.load.on('loaderror', file => {
            console.error('ASSET LOAD FAILED:', file.key, '→', file.src);
        });
        
    }

    create() {

        // **Do NOT start the next scene here** – we need the first click first.
        // The click handler is added in StartScreenScene (see below).
    }
}

export default PreloadScene;