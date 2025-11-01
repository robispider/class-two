// js/scenes/LoaderScene.js
import { loadedAssetKeys, assetManifest } from '../AssetManager.js';

class LoaderScene extends Phaser.Scene {
    constructor() {
        super('LoaderScene');
    }

    init(data) {
        this.assetGroupsToLoad = data.assetGroups || [];
        this.targetScene = data.targetScene;
        this.gameData = data.gameData || {};
    }

    preload() {
        // --- FIX: ADD THE LOADING BAR UI ---
        const { width, height } = this.scale;
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8).fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Getting Ready...',
            style: { font: '20px monospace', fill: '#ffffff' }
        }).setOrigin(0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: { font: '18px monospace', fill: '#ffffff' }
        }).setOrigin(0.5);

        // This event listener updates the progress bar during the loading process.
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        });
        
        // This event listener cleans up the UI elements once loading is complete.
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        // --- END OF LOADING BAR UI ---


        // --- Load the specified asset groups ---
        console.log(`LoaderScene: Loading groups - ${this.assetGroupsToLoad.join(', ')}`);
        
        for (const groupName of this.assetGroupsToLoad) {
            const assets = assetManifest[groupName] || [];
            for (const asset of assets) {
                if (!loadedAssetKeys.has(asset.key)) {
                    this.load[asset.type](asset.key, asset.path, asset.options);
                    loadedAssetKeys.add(asset.key);
                    console.log(`Queueing asset for loading: ${asset.key}`);
                }
            }
        }
    }

    create() {
        // This 'create' method will now correctly wait until the 'preload' method's
        // loading queue is fully complete before executing.
        console.log(`LoaderScene: Loading complete. Starting scene: ${this.targetScene}`);
        this.scene.start(this.targetScene, this.gameData);
    }
}

export default LoaderScene;