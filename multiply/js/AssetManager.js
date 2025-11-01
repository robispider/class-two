// js/AssetManager.js
import { config, avatars, planes } from './config.js';

/**
 * A global Set that will store the keys of all assets that have been loaded.
 * This prevents any asset from being loaded more than once per session.
 */
export const loadedAssetKeys = new Set();

/**
 * Defines all game assets, grouped by the part of the game that needs them.
 * This allows for intelligent, lazy loading.
 */
export const assetManifest = {
    // ESSENTIALS: Loaded once in PreloadScene for an instant main menu.
    menu: [
           
        
   
        { type: 'image', key: 'switch-icon', path: 'assets/icons/user-icon.png' },

        { type: 'audio', key: 'button-click', path: 'assets/sounds/button-click.mp3' },
        { type: 'audio', key: 'button-hover', path: 'assets/sounds/button-hover.mp3' },
        { type: 'audio', key: 'game-start-menu', path: 'assets/sounds/game-start-menu.mp3' },
    
        { type: 'image', key: 'selection-round', path: 'assets/icons/round-selection.png' },
        { type: 'image', key: 'medal-gold', path: 'assets/icons/medal_gold.png' },
        { type: 'image', key: 'medal-silver', path: 'assets/icons/medal_silver.png' },
        { type: 'image', key: 'medal-bronze', path: 'assets/icons/medal_bronze.png' },
        { type: 'image', key: 'star-icon', path: 'assets/icons/star.png' },
        { type: 'image', key: 'star-cyan', path: 'assets/icons/star-cyan.png' },
        { type: 'image', key: 'button-cyan', path: 'assets/buttons/button-cyan.png' },
        { type: 'image', key: 'button-gray', path: 'assets/buttons/button-gray.png' },
        { type: 'image', key: 'button-red', path: 'assets/buttons/button-red.png' },
        { type: 'image', key: 'button-green', path: 'assets/buttons/button-green.png' },
        { type: 'image', key: 'button-orange', path: 'assets/buttons/button-orange.png' },
        { type: 'image', key: 'button-violet', path: 'assets/buttons/button-violet.png' },
        ...avatars.map(avatar => ({ type: 'image', key: `avatar-${avatar}`, path: `assets/avatar/${avatar}` }))
    ],
    // GAMEPLAY ASSETS: Loaded in the background from the StartScreenScene.
    common: [
         { type: 'audio', key: 'applause', path: 'assets/sounds/applause.mp3' },
         { type: 'audio', key: 'button-shake', path: 'assets/sounds/button-shake.mp3' }, // ADDED
         { type: 'image', key: 'particle', path: 'assets/particle.png' },
         { type: 'image', key: 'flarewatch', path: 'assets/flarewatch.png' },
         { type: 'image', key: 'green-arrow-start', path: 'assets/arrow/green-arrow-start.png' },
         { type: 'image', key: 'green-arrow-mid', path: 'assets/arrow/green-arrow-mid.png' },
         { type: 'image', key: 'green-arrow-point', path: 'assets/arrow/green-arrow-point.png' }
    ],
    standard: [
        { type: 'spritesheet', key: 'items_spritesheet', path: 'assets/fruitvegeset.png', options: { frameWidth: 64, frameHeight: 64 } },
        { type: 'image', key: 'box_open', path: 'assets/openbox.png' },
        { type: 'image', key: 'box_closed', path: 'assets/closebox.png' },
        { type: 'audio', key: 'practice-music-loop', path: 'assets/sounds/practice-music-loop.mp3' },
        { type: 'audio', key: 'standard-gackground', path: 'assets/sounds/standard-gackground.mp3' },
    ],
    puzzle: [
        { type: 'image', key: 'puzzle1', path: 'assets/puzzle/puzzle1.jpg' },
        { type: 'image', key: 'puzzel1', path: 'assets/puzzel1.jpg' }, // ADDED (with typo)
        { type: 'audio', key: 'puzzle-suspense', path: 'assets/sounds/puzzle-suspense.mp3' },
    ],
    shooting: [
        { type: 'audio', key: 'missile-firing', path: 'assets/sounds/missile-firing.mp3' },
        { type: 'audio', key: 'alarm', path: 'assets/sounds/retro-alarm-02.wav' },
        { type: 'audio', key: 'rocket-loop', path: 'assets/sounds/rocket-loop.mp3' },
        { type: 'audio', key: 'game-music-4', path: 'assets/sounds/game-music-loop-4.mp3' },
        { type: 'audio', key: 'air-raid-siren', path: 'assets/sounds/air-raid-siren.mp3' },
        { type: 'audio', key: 'massive-explosion-3', path: 'assets/sounds/massive-explosion-3.mp3' },
        { type: 'image', key: 'missilebattery', path: 'assets/missilebattery.png' }, // ADDED
        { type: 'image', key: 'missile', path: 'assets/missile.png' }, // ADDED
        // { type: 'image', key: 'crowfly', path: 'assets/crowfly.png' }, // no need any more
        { type: 'image', key: 'crosshair', path: 'assets/crosshair.png' },
        { type: 'image', key: 'airspy', path: 'assets/airspy.png' },
        { type: 'image', key: 'casing', path: 'assets/casing.png' },
        { type: 'image', key: 'smoke', path: 'assets/smoke.png' },
        { type: 'image', key: 'groundcolor', path: 'assets/groundcolor.png' },
        { type: 'image', key: 'tree1', path: 'assets/tree/tree1.png' },
        { type: 'image', key: 'tree2', path: 'assets/tree/tree2.png' },
        { type: 'image', key: 'tree3', path: 'assets/tree/tree3.png' },
        { type: 'image', key: 'plents1', path: 'assets/tree/plents1.png' },
        { type: 'image', key: 'farground_cloud_1', path: 'assets/sky_background/parallax_parts/farground_cloud_1.png' },
        { type: 'image', key: 'farground_cloud_2', path: 'assets/sky_background/parallax_parts/farground_cloud_2.png' }, // ADDED
        { type: 'image', key: 'mid_ground_cloud_1', path: 'assets/sky_background/parallax_parts/mid_ground_cloud_1.png' },
        { type: 'image', key: 'mid_ground_cloud_2', path: 'assets/sky_background/parallax_parts/mid_ground_cloud_2.png' },
        { type: 'image', key: 'sky_color_top', path: 'assets/sky_background/parallax_parts/sky_color_top.png' },
        { type: 'image', key: 'sky_color_1', path: 'assets/sky_background/parallax_parts/sky_color.png' },
        { type: 'image', key: 'farground_mountains', path: 'assets/sky_background/parallax_parts/mountain_with_hills/farground_mountains.png' },
        { type: 'image', key: 'foreground_mountains', path: 'assets/sky_background/parallax_parts/mountain_with_hills/foreground_mountains.png' },
        { type: 'image', key: 'midground_mountains', path: 'assets/sky_background/parallax_parts/mountain_with_hills/midground_mountains.png' },
        ...planes.map(p => ({ type: 'image', key: p, path: `assets/${p}` })),
    ]
};
      