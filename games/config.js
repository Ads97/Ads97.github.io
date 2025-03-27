/**
 * Game Configuration System
 * Centralizes all game settings, constants, and magic numbers
 * for easier maintenance and tweaking
 */

// Global game settings
window.CONFIG = {
    // Debug settings
    DEBUG: {
        SHOW_LOGS: true,
        SHOW_COLLISION_HELPERS: false
    },
    
    // Player settings
    PLAYER: {
        DEFAULT_SPEED: 0.07, // Set to exactly 0.07
        ROTATION_SPEED: 0.09, // Adjusted for better control
        COLLISION_RADIUS: 0.5
    },
    
    // Audio settings
    AUDIO: {
        DEFAULT_MUSIC_VOLUME: 0.7,
        DEFAULT_SFX_VOLUME: 0.8,
        SPEED_BOOST_RATE: 2.0
    },
    
    // UI settings
    UI: {
        GAME_OVER_FADE_TIME: 500,
        MESSAGE_DISPLAY_TIME: 4000
    },
    
    // Mobile settings
    MOBILE: {
        AUTO_MOVE_SPEED: 0.07,       // Set to exactly 0.07
        ROTATION_ANGLE: Math.PI/2,   // 90 degrees rotation for swipes
        ROTATION_DURATION: 260,      // Adjusted for better responsiveness
        SWIPE_THRESHOLD: 50,         // Minimum distance for swipe detection
        HOLD_DURATION: 500           // Milliseconds to hold for pause
    }
};

// Level 1 specific settings
window.LEVEL1 = {
    NAME: 'Level 1 (Tutorial)', // Level name including tutorial designation
    SKY_COLOR: '#87CEEB',
    PLAYER_START: { x: 0, y: 0, z: 15 },
    CUP_POSITION: { x: 20, y: 0.6, z: -8.5 },
    
    // Return portal settings
    PORTAL: {
        POSITION: { x: 0, y: 0, z: 15 }, // Position right in front of starting point
        SIZE: 2.0,                       // Much larger visual size
        COLLISION_SIZE: 2,             // Larger collision area
        COLOR: '#FF00FF'                 // Bright magenta color for better visibility
    },
    
    // Hazards
    SPIKES: {
        CYCLE: 3000,         // Complete cycle time in milliseconds (3 seconds)
        ACTIVE_TIME: 1500    // How long spikes stay up (1.5 seconds)
    }
};

// Level 2 specific settings
window.LEVEL2 = {
    // General
    NAME: 'Level 2',
    
    // Environment
    SKY_COLOR: '#1a237e', // Darker blue for level 2
    
    // Player
    PLAYER_START: { x: 0, y: 0, z: 15 },
    
    // Goal
    CUP_POSITION: { x: -20, y: 0.6, z: -20 },
    
    // Hazards
    TRAPDOOR: {
        POSITION: { x: 10, y: 0, z: -12 },
        SIZE: 1.5,       // Visual size
        COLLISION_SIZE: 0.6  // Effective collision size (TRAPDOOR_SIZE / 2.5)
    },
    
    SPIKES: {
        CYCLE: 3000,         // Complete cycle time in milliseconds (3 seconds)
        ACTIVE_TIME: 1500    // How long spikes stay up (1.5 seconds)
    },
    
    // Power-ups
    SPEEDBOOST: {
        POSITION: { x: -10, y: 0, z: -12.5 },
        SIZE: 0.5,               // Visual size
        COLLISION_SIZE: 0.6,     // Slightly larger than visual (SIZE * 1.2)
        DURATION: 10,            // Duration in seconds
        MULTIPLIER: 3,           // Speed multiplier
        FLOAT_HEIGHT: 0.8        // How high above ground it floats
    },
    
    // Monster
    MONSTER: {
        START_POSITION: { x: -22.5, y: 1.5, z: -2 },
        SIZE: 0.8,                       // Core body size
        DETECTION_RADIUS: 5,             // Distance at which monster detects player
        KILL_RADIUS: 1.2,                // Distance at which monster catches player
        SPEED: 0.06,                     // Movement speed
        EYE_SIZE: 0.15,                  // Size of the monster's eyes
        EYE_OFFSET: 0.35,                // Distance of eyes from center
        EYE_HEIGHT: 0.2                  // Height of eyes relative to center
    }
};

// Using global variables instead of ES6 exports
// No export statement needed
