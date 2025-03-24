// Level 2 code for the Triwizard Maze game

// Centralized reset function for Level 2
// This function will handle all resets when a player dies, regardless of death cause
function resetLevel2Player(player, maze) {
    console.log('RESET: Centralizing player and level reset');
    
    // Reset player position and movement state
    player.position.set(LEVEL2.PLAYER_START.x, LEVEL2.PLAYER_START.y, LEVEL2.PLAYER_START.z);
    player.rotation = 0;
    player.canMove = true;
    
    // Reset speed boost player state
    player.speedBoostActive = false;
    player.speed = player.originalSpeed || 0.15;
    
    // Reset music speed
    if (window.audioController && typeof window.audioController.reset === 'function') {
        window.audioController.reset();
    }
