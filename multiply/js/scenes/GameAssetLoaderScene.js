// js/scenes/GameAssetLoaderScene.js
import { loadedAssetKeys, assetManifest } from '../AssetManager.js';
import { config } from '../config.js';

class GameAssetLoaderScene extends Phaser.Scene {
    constructor() {
        super('GameAssetLoaderScene');
        this.assetsToLoad = [];
    }

    init(data) {
        this.gameData = data;
        this.assetsToLoad = [];
    }

    preload() {
        // --- 1. Determine which assets are REQUIRED for the next scene ---
        const requiredGroups = ['common'];
        const stage = this.gameData.stage;
        const mode = this.gameData.mode;
        
        if (mode === 'practice') {
            requiredGroups.push('standard');
        } else if (stage <= 2) {
            requiredGroups.push('standard');
        } else if (stage === 3 || stage === 4) {
            requiredGroups.push('puzzle');
        } else if (stage === 5) {
            requiredGroups.push('shooting');
        }

        // --- 2. Check which required assets are NOT yet loaded ---
        for (const groupName of requiredGroups) {
            const assets = assetManifest[groupName] || [];
            for (const asset of assets) {
                if (!loadedAssetKeys.has(asset.key)) {
                    this.assetsToLoad.push(asset);
                }
            }
        }

        // --- 3. If there's anything to load, show a loading bar ---
        if (this.assetsToLoad.length > 0) {
            console.log(`Gatekeeper: Loading ${this.assetsToLoad.length} remaining assets...`);
            this._showLoadingBar();

            for (const asset of this.assetsToLoad) {
                this.load[asset.type](asset.key, asset.path, asset.options);
                loadedAssetKeys.add(asset.key);
            }
        } else {
            console.log("Gatekeeper: All required assets are already loaded. Proceeding instantly.");
        }
    }
    
    _showLoadingBar() {
        const { width, height } = this.scale;
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8).fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
        const loadingText = this.make.text({ x: width / 2, y: height / 2 - 50, text: 'Getting Ready...', style: { font: '20px monospace', fill: '#ffffff' }}).setOrigin(0.5);
        const percentText = this.make.text({ x: width / 2, y: height / 2 - 5, text: '0%', style: { font: '18px monospace', fill: '#ffffff' }}).setOrigin(0.5);

        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1).fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        });
    }

    create() {
        const targetScene = this.gameData.mode === 'practice' ? 'PracticeScene' : 'GameScene';
        this.scene.start(targetScene, this.gameData);
    }
}

export default GameAssetLoaderScene;