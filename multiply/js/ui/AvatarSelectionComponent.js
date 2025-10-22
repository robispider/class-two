// js/ui/AvatarSelectionComponent.js

import { config, avatars } from '../config.js';

export class AvatarSelectionComponent {
    /**
     * @param {Phaser.Scene} scene The scene to create this component in.
     * @param {object} currentUser The full user object, containing the current avatar.
     * @param {function} onSaveCallback Function to call with the new avatar file when saved.
     */
    constructor(scene, currentUser, onSaveCallback) {
        this.scene = scene;
        this.currentUser = currentUser;
        this.onSaveCallback = onSaveCallback;
        
        this.modalContainer = null;
        this.selectedAvatarFile = currentUser.avatar; // Start with the current avatar selected
        this.selectionIndicator = null;
        this.saveButton = null;
    }

    show() {
        if (this.modalContainer) return;

        const { width, height } = this.scene.cameras.main;
        this.modalContainer = this.scene.add.container(width / 2, height / 2).setDepth(1100);

        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000, 0.7).setInteractive();
        
        const modalWidth = width * 0.8;
        const modalHeight = height * 0.8;
        const panel = this.scene.add.graphics()
            .fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.95)
            .fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 32)
            .lineStyle(8, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 1)
            .strokeRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 32);

        const title = this.scene.add.text(0, -modalHeight / 2 + 60, 'ছবি পরিবর্তন করুন', {
            fontSize: '48px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
        }).setOrigin(0.5);

        this.modalContainer.add([overlay, panel, title]);

        // --- NEW & CORRECTED GRID LAYOUT LOGIC ---

        const avatarDisplaySize = 64; // The target size for each avatar box
        const avatarSpacing = 20;
        const itemsPerRow = 4;
        const padding = 60;

        // The content area for the grid, respecting the panel padding
        const gridAreaWidth = modalWidth - padding * 2;
        
        // Calculate the total width of the grid to center it
        const totalGridWidth = itemsPerRow * avatarDisplaySize + (itemsPerRow - 1) * avatarSpacing;
        const gridStartX = -(totalGridWidth / 2); // Start from the left edge of the centered grid
        const gridStartY = -modalHeight / 2 + 150;

        this.selectionIndicator = this.scene.add.image(0, 0, 'selection-round')
            .setScale(0.2) // Scaled to look good on the 0.5 avatar
            .setVisible(false);
        this.scene.tweens.add({ targets: this.selectionIndicator, angle: 360, loop: -1, duration: 5000 });
        this.modalContainer.add(this.selectionIndicator);

        avatars.forEach((avatarFile, index) => {
            const col = index % itemsPerRow;
            const row = Math.floor(index / itemsPerRow);

            const xPos = gridStartX + col * (avatarDisplaySize + avatarSpacing) + (avatarDisplaySize / 4);
            const yPos = gridStartY + row * (avatarDisplaySize + avatarSpacing) + (avatarDisplaySize /3);

            // Use setScale(0.5) to make avatars large and clear, not setScale(1) which would be huge.
            const avatarImg = this.scene.add.image(xPos, yPos, `avatar-${avatarFile}`).setScale(1).setInteractive({ useHandCursor: true });
            
            avatarImg.on('pointerdown', () => {
                this.selectedAvatarFile = avatarFile;
                this.selectionIndicator.setPosition(avatarImg.x, avatarImg.y).setVisible(true);
                this.validateSelection();
            });
            this.modalContainer.add(avatarImg);

            // Set the initial position of the selection indicator on the user's current avatar
            if (avatarFile === this.currentUser.avatar) {
                this.selectionIndicator.setPosition(avatarImg.x, avatarImg.y).setVisible(true);
            }
        });
        
        // --- Buttons ---
        const buttonY = modalHeight / 2 - 80;
        this.saveButton = this._createGameButton(-120, buttonY, 'সংরক্ষণ করুন', 'button-green', () => {
            if (this.onSaveCallback && this.selectedAvatarFile !== this.currentUser.avatar) {
                this.onSaveCallback(this.selectedAvatarFile);
            }
            this.destroy();
        });
        
        const cancelButton = this._createGameButton(120, buttonY, 'ফিরে যান', 'button-red', () => this.destroy());
        
        this.modalContainer.add([this.saveButton, cancelButton]);
        this.validateSelection(); // Initial check
    }
    
    validateSelection() {
        const isChanged = this.selectedAvatarFile !== this.currentUser.avatar;
        if (this.saveButton) {
            this.saveButton.setAlpha(isChanged ? 1 : 0.5);
            // Get the button image itself to enable/disable interaction
            const buttonImage = this.saveButton.getAt(0); 
            if (isChanged) {
                buttonImage.setInteractive({ useHandCursor: true });
            } else {
                buttonImage.disableInteractive();
            }
        }
    }
    
    _createGameButton(x, y, text, key, onClick) {
        const button = this.scene.add.image(0, 0, key).setScale(0.35);
        const buttonText = this.scene.add.text(0, 0, text, { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
        const container = this.scene.add.container(x, y, [button, buttonText]).setSize(button.displayWidth * 0.35, button.displayHeight * 0.35);
        
        // Make the button image interactive, not the container
        button.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
        return container;
    }

    destroy() {
        if (this.modalContainer) {
            this.modalContainer.destroy();
            this.modalContainer = null;
        }
    }
}