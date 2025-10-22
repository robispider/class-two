// js/ui/UserSelectionComponent.js

import { toBangla } from '../utils.js';
import { config, avatars } from '../config.js';
import { gameState } from '../gameState.js';

export class UserSelectionComponent {
    constructor(scene, onUserSelectedCallback) {
        this.scene = scene;
        this.onUserSelectedCallback = onUserSelectedCallback;
        this.modalContainer = null;
        this.contentContainer = null;
        this.selectedAvatarFile = null;
        this.avatarSelectionIndicator = null;
        this.inputElement = null; // To keep track of the DOM element
    }

    show() {
        if (this.modalContainer) return;

        const { width, height } = this.scene.cameras.main;

        this.modalContainer = this.scene.add.container(width / 2, height / 2);
        this.modalContainer.setDepth(1000);

        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000, 0.7).setInteractive();
        
        const modalWidth = width * 0.9;
        const modalHeight = height * 0.9;
        const panel = this.scene.add.graphics()
            .fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.95)
            .fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 32)
            .lineStyle(8, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 1)
            .strokeRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 32);

        this.contentContainer = this.scene.add.container(0, 0);
        this.modalContainer.add([overlay, panel, this.contentContainer]);

        this.showInitialScreen();

        this.modalContainer.setScale(0);
        this.scene.tweens.add({
            targets: this.modalContainer,
            scale: 1,
            duration: 500,
            ease: 'Elastic.easeOut',
            easeParams: [1.1, 0.7]
        });
    }

    // --- Screen 1: Choose Existing User or Add New ---
    showInitialScreen() {
        if (this.contentContainer) this.contentContainer.removeAll(true);
        const { width, height } = this.scene.cameras.main;

        const title = this.scene.add.text(0, -height * 0.35, 'কে খেলবে?', {
            fontSize: '48px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.contentContainer.add(title);
        
        const users = gameState.userManager.getUserList();
        const items = [...users, { isAddButton: true }];
        const itemsPerRow = 4;
        const itemSize = 200; // Larger card size
        const itemSpacing = 40;

        items.forEach((item, index) => {
            const col = index % itemsPerRow;
            const row = Math.floor(index / itemsPerRow);
            const xPos = (col - (itemsPerRow - 1) / 2) * (itemSize + itemSpacing);
            const yPos = -height * 0.1 + row * (itemSize + itemSpacing);

            if (item.isAddButton) {
                const addContainer = this._createAddUserButton(xPos, yPos, itemSize);
                this.contentContainer.add(addContainer);
            } else {
                const userContainer = this._createUserProfileButton(xPos, yPos, itemSize, item);
                this.contentContainer.add(userContainer);
            }
        });
    }
    
    _createUserProfileButton(x, y, size, user) {
        const container = this.scene.add.container(x, y).setSize(size, size).setInteractive({ useHandCursor: true });
        
        const bg = this.scene.add.graphics()
            .fillStyle(0xffffff, 0.4)
            .fillRoundedRect(-size / 2, -size / 2, size, size, 20);

        const avatarImg = this.scene.add.image(0, -20, `avatar-${user.avatar}`).setScale(1); // Large, clear avatar
        const nameText = this.scene.add.text(0, size / 2 - 25, user.name, { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        
        container.add([bg, avatarImg, nameText]);
        container.on('pointerdown', () => this.selectUserAndClose(user.name));
        container.on('pointerover', () => this.scene.tweens.add({ targets: container, y: y-10, duration: 150 }));
        container.on('pointerout', () => this.scene.tweens.add({ targets: container, y: y, duration: 150 }));
        return container;
    }
    
    _createAddUserButton(x, y, size) {
        const container = this.scene.add.container(x, y).setSize(size, size).setInteractive({ useHandCursor: true });
        
        const bg = this.scene.add.graphics()
            .fillStyle(0x000000, 0.2)
            .fillRoundedRect(-size / 2, -size / 2, size, size, 20);
            
        const plusSign = this.scene.add.text(0, -20, '+', { fontSize: '120px', fill: '#FFFFFF' }).setOrigin(0.5);
        const addText = this.scene.add.text(0, size / 2 - 25, 'নতুন প্রোফাইল', { fontSize: '24px',fontFamily: '"Noto Sans Bengali", sans-serif',  fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
        
        container.add([bg, plusSign, addText]);
        container.on('pointerdown', () => this.showCreateUserScreen());
        container.on('pointerover', () => this.scene.tweens.add({ targets: container, y: y-10, duration: 150 }));
        container.on('pointerout', () => this.scene.tweens.add({ targets: container, y: y, duration: 150 }));
        return container;
    }

    // --- Screen 2: Create a New Profile ---
    showCreateUserScreen() {
        if (this.inputElement) this.inputElement.destroy();
        this.contentContainer.removeAll(true);
        const { width, height } = this.scene.cameras.main;
        let nextY = -height * 0.35;

        const title = this.scene.add.text(0, nextY, 'নতুন প্রোফাইল তৈরি করুন', {
            fontSize: '40px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.contentContainer.add(title);
        nextY += 80;
        
        const avatarTitle = this.scene.add.text(0, nextY, 'একটি ছবি বাছাই করুন', { fontSize: '28px',fontFamily: '"Noto Sans Bengali", sans-serif',  fill: config.colors.text }).setOrigin(0.5);
        this.contentContainer.add(avatarTitle);
        nextY += 120;
        
        this.avatarSelectionIndicator = this.scene.add.image(0, 0, 'selection-round').setScale(.2).setVisible(false);
        this.scene.tweens.add({ targets: this.avatarSelectionIndicator, angle: 360, loop: -1, duration: 5000 });
        this.contentContainer.add(this.avatarSelectionIndicator);

        avatars.forEach((avatarFile, index) => {
            const xPos = (index - (avatars.length - 1) / 2) * 140;
            const avatarImg = this.scene.add.image(xPos, nextY, `avatar-${avatarFile}`).setScale(1).setInteractive({ useHandCursor: true });
            
            avatarImg.on('pointerdown', () => {
                this.selectedAvatarFile = avatarFile;
                this.avatarSelectionIndicator.setPosition(avatarImg.x, avatarImg.y).setVisible(true);
                this.validateCreation(); // Check if the create button should be enabled
            });
            this.contentContainer.add(avatarImg);
        });
        nextY += 140;

        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'এখানে আপনার নাম লিখুন';
        inputElement.style.cssText = 'width: 350px; padding: 15px; font-size: 24px; border: 4px solid #5C2626; border-radius: 15px; text-align: center;';
        this.inputElement = this.scene.add.dom(0, nextY, inputElement).setOrigin(0.5);
        this.contentContainer.add(this.inputElement);
        
        // Listen for input to validate the create button
        inputElement.addEventListener('input', () => this.validateCreation());
        nextY += 100;

        const createButton = this._createGameButton( -120, nextY, 'তৈরি করুন', 'button-green', () => {
            const newName = this.inputElement.node.value.trim();
            if (newName && this.selectedAvatarFile) {
                if (gameState.userManager.addUser(newName, this.selectedAvatarFile)) {
                    this.selectUserAndClose(newName);
                }
            }
        });
        
        const backButton = this._createGameButton(120, nextY, 'ফিরে যান', 'button-red', () => {
            if (this.inputElement) this.inputElement.destroy();
            this.inputElement = null;
            this.showInitialScreen();
        });
        
        this.createButton = createButton; // Store reference to enable/disable it
        this.contentContainer.add([createButton, backButton]);
        
        this.validateCreation(); // Initial check
    }

    validateCreation() {
        if (!this.createButton || !this.inputElement) return;

        const newName = this.inputElement.node.value.trim();
        const avatarSelected = !!this.selectedAvatarFile;

        if (newName && avatarSelected) {
            this.createButton.setAlpha(1);
            this.createButton.getAt(0).setInteractive({ useHandCursor: true }); // Enable button
        } else {
            this.createButton.setAlpha(0.5);
            this.createButton.getAt(0).disableInteractive(); // Disable button
        }
    }
    
    _createGameButton(x, y, text, key, onClick) {
        const button = this.scene.add.image(0, 0, key).setScale(0.35);
        const buttonText = this.scene.add.text(0, 0, text, { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
        const container = this.scene.add.container(x, y, [button, buttonText]).setSize(button.displayWidth * 0.35, button.displayHeight * 0.35);
        
        container.getAt(0).setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
        return container;
    }

    selectUserAndClose(name) {
        gameState.userManager.setCurrentUser(name);
        gameState.currentUser = gameState.userManager.getCurrentUser();
        
        if (this.onUserSelectedCallback) {
            this.onUserSelectedCallback();
        }
        this.destroy();
    }

    destroy() {
        if (this.modalContainer) {
            if (this.inputElement) {
                this.inputElement.destroy();
                this.inputElement = null;
            }
            this.modalContainer.destroy();
            this.modalContainer = null;
        }
    }
}