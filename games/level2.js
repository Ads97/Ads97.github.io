// Level 2 code for the Triwizard Maze game
// Level 2 code uses the global CONFIG and LEVEL2 objects from config.js

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
    
    // Reset speed boost powerup
    if (maze.speedBoost) {
        maze.speedBoost.active = true;
        if (maze.speedBoost.mesh) {
            maze.speedBoost.mesh.visible = true;
        }
    }
    
    // Reset monster if it exists
    if (maze.monster) {
        maze.monster.mesh.position.set(-22.5, 1.5, -2);
        maze.monster.awakened = false;
        maze.monster.warningShown = false;
        maze.monster.gameOver = false;
    }
    
}

// Direct access to audio object for speed control
function setMusicSpeed(speed) {
    
    // First try to access the audio from the window.audio object
    if (window.audio && window.audio.backgroundMusic) {
        try {
            // Store original rate if not already stored
            if (typeof window.audio.backgroundMusic._originalRate === 'undefined') {
                window.audio.backgroundMusic._originalRate = window.audio.backgroundMusic.playbackRate || 1.0;
            }
            
            // Attempt direct property modification
            const prevRate = window.audio.backgroundMusic.playbackRate;
            window.audio.backgroundMusic.playbackRate = speed;
            
            // Manual implementation - recreate the audio with the new speed
            if (window.audio.backgroundMusic.playbackRate !== speed) {
                
                // Remember audio state
                const wasPlaying = !window.audio.backgroundMusic.paused;
                const currentTime = window.audio.backgroundMusic.currentTime || 0;
                const volume = window.audio.backgroundMusic.volume || 0.6;
                const src = window.audio.backgroundMusic.src;
                
                // Create new audio with the desired speed
                const newAudio = new Audio(src);
                newAudio.playbackRate = speed;
                newAudio.volume = volume;
                newAudio.loop = true;
                newAudio._originalRate = window.audio.backgroundMusic._originalRate;
                
                // Replace the old audio
                if (wasPlaying) {
                    window.audio.backgroundMusic.pause();
                    newAudio.currentTime = currentTime;
                    newAudio.play();
                }
                
                window.audio.backgroundMusic = newAudio;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    } else {
        return false;
    }
}

function resetMusicSpeed() {
    
    // First try to access the audio from the window.audio object
    if (window.audio && window.audio.backgroundMusic) {
        try {
            const originalRate = window.audio.backgroundMusic._originalRate || 1.0;
            
            // Attempt direct property modification
            window.audio.backgroundMusic.playbackRate = originalRate;
            
            // Check if it worked
            
            // Similar fallback as in setMusicSpeed if needed
            if (window.audio.backgroundMusic.playbackRate !== originalRate) {
                
                // Remember audio state
                const wasPlaying = !window.audio.backgroundMusic.paused;
                const currentTime = window.audio.backgroundMusic.currentTime || 0;
                const volume = window.audio.backgroundMusic.volume || 0.6;
                const src = window.audio.backgroundMusic.src;
                
                // Create new audio with the original speed
                const newAudio = new Audio(src);
                newAudio.playbackRate = originalRate;
                newAudio.volume = volume;
                newAudio.loop = true;
                
                // Replace the old audio
                if (wasPlaying) {
                    window.audio.backgroundMusic.pause();
                    newAudio.currentTime = currentTime;
                    newAudio.play();
                }
                
                window.audio.backgroundMusic = newAudio;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    } else {
        return false;
    }
}

// Level 2 constants are now defined in config.js and accessed via the global LEVEL2 object
// The original LEVEL2 constant has been removed to avoid naming conflicts

// Create Level 2 maze with a simple path: straight, left turn, right turn
function createLevel2Maze(scene, maze, wallMaterial) {
    // Create a simpler maze for level 2 with specific turns
    
    // Back wall (behind player start)
    createWall(scene, maze, 12, 3, 1, 0, 1.5, 16, wallMaterial);
    
    // Initial straight corridor
    createWall(scene, maze, 1, 3, 25, -5, 1.5, 3, wallMaterial);  // Left wall of straight section
    createWall(scene, maze, 1, 3, 25, 5, 1.5, 3, wallMaterial);   // Right wall of straight section
    
    // Deadend section
    createWall(scene, maze, 15, 3, 1, -12.5, 1.5, -10, wallMaterial);  // Extended wall past left turn
    createWall(scene, maze, 20, 3, 1, 15, 1.5, -10, wallMaterial);  // Extended wall past right turn
    createWall(scene, maze, 45, 3, 1, -2.5, 1.5, -15, wallMaterial);   // Deadend wall that forces turns
    
    // left of deadend
    createWall(scene, maze, 1, 3, 25, -20, 1.5, 3, wallMaterial);  // Left turn deadend side
    createWall(scene, maze, 5, 3, 1, -22.5, 1.5, 3, wallMaterial); // left turn deadend 
    createWall(scene, maze, 1, 3, 50, -25, 1.5, 0, wallMaterial); 

    // right of deadend
    createWall(scene, maze, 1, 3, 25, 25, 1.5, -12, wallMaterial);   // Right turn deadend

    // second deadend
    createWall(scene, maze, 50, 3, 1, 0, 1.5, -25, wallMaterial);   // Deadend wall that forces turns

    // Create deadly spike trap
    createSpikes(scene, maze, 1, 3, 10, 0, 1.5, -20);

    // The cup position is already defined in the LEVEL2 constants at the top
    // No need to override it here
}

// Helper function to create deadly spikes trap
function createSpikes(scene, maze, width, height, depth, x, y, z) {
    // Create a group to hold all the spike objects
    const spikeGroup = new THREE.Group();
    spikeGroup.position.set(x, y, z);
    scene.add(spikeGroup);
    
    // Create spike base
    const baseGeometry = new THREE.BoxGeometry(width, 0.1, depth);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A4A }); // Dark gray base
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -1.5, 0); // Position just below floor level
    spikeGroup.add(base);
    
    // Create individual spikes
    const spikeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B0000,  // Dark red
        metalness: 0.8,
        roughness: 0.2
    });
    
    // Calculate number of spikes based on area
    const spikeSpacing = 1.0;
    const spikesPerRow = Math.max(2, Math.floor(depth / spikeSpacing));
    const spikesPerCol = Math.max(2, Math.floor(width / spikeSpacing));
    
    // Create spike meshes
    const spikes = [];
    const spikeHeight = 1;
    
    for (let i = 0; i < spikesPerRow; i++) {
        for (let j = 0; j < spikesPerCol; j++) {
            // Create pyramid geometry for each spike
            const spikeGeometry = new THREE.ConeGeometry(0.2, spikeHeight, 4);
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Position spikes evenly
            const xPos = (j - spikesPerCol/2 + 0.5) * spikeSpacing;
            const zPos = (i - spikesPerRow/2 + 0.5) * spikeSpacing;
            
            spike.position.set(xPos, -2.5, zPos); // Start fully hidden below the floor
            // No rotation needed - cones point up by default
            
            spikeGroup.add(spike);
            spikes.push(spike);
        }
    }
    
    // Store spike data for collision detection
    maze.spikeTrap = {
        position: new THREE.Vector3(x, y, z),
        width: width,
        depth: depth,
        active: false,
        lastCycleTime: Date.now(),
        spikes: spikes,
        spikeHeight: spikeHeight,
        group: spikeGroup,
        update: function() {
            const currentTime = Date.now();
            const timeSinceLastCycle = currentTime - this.lastCycleTime;
            
            // Determine if spikes should be active based on cycle time
            if (timeSinceLastCycle % LEVEL2.SPIKES.CYCLE < LEVEL2.SPIKES.ACTIVE_TIME) {
                // Spikes should be active (up)
                if (!this.active) {
                    this.active = true;
                    
                    // Move spikes up so they extend above the floor
                    this.spikes.forEach(spike => {
                        spike.position.y = -1.0; // Extend the spikes above the floor level
                    });
                    console.log('SPIKES: Extended above floor');
                }
            } else {
                // Spikes should be inactive (down)
                if (this.active) {
                    this.active = false;
                    
                    // Move spikes down instantly for now
                    this.spikes.forEach(spike => {
                        spike.position.y = -3.0; // Move spike fully below floor
                    });
                }
            }
            
            // Start a new cycle if needed
            if (timeSinceLastCycle >= LEVEL2.SPIKES.CYCLE) {
                this.lastCycleTime = currentTime - (timeSinceLastCycle % LEVEL2.SPIKES.CYCLE);
            }
        },
        checkCollision: function(playerPosition) {
            // Only check collision if spikes are active
            if (!this.active) return false;
            
            // Calculate horizontal distance (ignoring height)
            const dx = Math.abs(playerPosition.x - this.position.x);
            const dz = Math.abs(playerPosition.z - this.position.z);
            
            // Check if player is within the spike area
            const isWithinX = dx < this.width / 2;
            const isWithinZ = dz < this.depth / 2;
            
            return isWithinX && isWithinZ;
        }
    };
}

// Helper function to create a wall
function createWall(scene, maze, width, height, depth, x, y, z, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    scene.add(wall);
    
    // Calculate collision boundaries
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;
    
    maze.walls.push({
        mesh: wall,
        min: new THREE.Vector3(x - halfWidth, y - halfHeight, z - halfDepth),
        max: new THREE.Vector3(x + halfWidth, y + halfHeight, z + halfDepth)
    });
    
    return wall;
}

// Load Level 2
function loadLevel2(scene, maze, player, showLevelMessage) {
    // Set sky color for level 2
    scene.background = new THREE.Color(LEVEL2.SKY_COLOR);
    
    // Clear any existing maze.originalCoreUpdatePlayer reference 
    // to ensure we don't have stale references
    maze.originalCoreUpdatePlayer = null;
    
    // Reset player position for level 2
    player.position.set(LEVEL2.PLAYER_START.x, LEVEL2.PLAYER_START.y, LEVEL2.PLAYER_START.z);
    player.rotation = 0;
    player.canMove = true;
    
    // Reset any active power-ups
    player.speedBoostActive = false;
    player.originalSpeed = player.speed;
    
    // Create wall material
    const wallMaterial = new THREE.MeshStandardMaterial({ color: '#1b5e20' }); // Dark green walls
    
    // Create the level 2 maze
    createLevel2Maze(scene, maze, wallMaterial);
    
    // Create the Triwizard Cup for level 2
    createTriwizardCupLevel2(scene, maze);
    
    // Create the trapdoor
    createTrapdoor(scene, maze);
    
    // Create speed boost powerup
    createSpeedBoost(scene, maze);
    
    // Create monster
    createMonster(scene, maze);
    
    // Set up check for trapdoor and speed boost collisions
    // The speed boost check is integrated in the same override
    setupTrapdoorCheck(player, scene, maze);
    
    // This is now just a placeholder since we've merged the functionality
    setupSpeedBoostCheck(player, scene, maze);
    
    // Setup level 2 specific controls, including debug keys
    setupLevel2Controls(scene, camera, player, maze);
    
    // Show level 2 message
    showLevelMessage(2);
}

// Create trapdoor in the maze
function createTrapdoor(scene, maze) {
    // Create a trapdoor with a different material approach to avoid z-fighting
    const trapdoorGroup = new THREE.Group();
    
    // Main trapdoor surface - using a completely different material type
    const trapdoorGeometry = new THREE.BoxGeometry(LEVEL2.TRAPDOOR_SIZE, 0.05, LEVEL2.TRAPDOOR_SIZE);
    
    // Using MeshPhongMaterial instead of MeshStandardMaterial for distinct rendering
    const trapdoorMaterial = new THREE.MeshPhongMaterial({ 
        color: '#0F5F22', // Slightly different shade of green compared to floor (assumed floor is #0F6626)
        shininess: 30, // Adds some shine to differentiate
        specular: 0x111111 // Very subtle specular highlight
    });
    
    const trapdoorSurface = new THREE.Mesh(trapdoorGeometry, trapdoorMaterial);
    // Position it slightly ABOVE the floor instead of sinking it
    trapdoorSurface.position.y = 0.02; 
    trapdoorGroup.add(trapdoorSurface);
    
    // Add a very subtle thin line around the edge for definition
    const edgeGeometry = new THREE.EdgesGeometry(trapdoorGeometry);
    // Using a very dark green for the outline instead of black
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x053010, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    wireframe.position.y = 0.02;
    trapdoorGroup.add(wireframe);
    
    // Position the entire trapdoor group
    trapdoorGroup.position.set(
        LEVEL2.TRAPDOOR.POSITION.x,
        LEVEL2.TRAPDOOR.POSITION.y,
        LEVEL2.TRAPDOOR.POSITION.z
    );
    
    // Add to scene
    scene.add(trapdoorGroup);
    
    // Store the trapdoor in the maze object
    maze.trapdoor = {
        mesh: trapdoorGroup,
        position: LEVEL2.TRAPDOOR.POSITION,
        size: LEVEL2.TRAPDOOR.COLLISION_SIZE // Using the predefined collision size from config
    };
}



// Setup function for level 2 specific game mechanics (trapdoor and speed boost)
function setupTrapdoorCheck(player, scene, maze) {
    // Store reference to the original core updatePlayer function
    // This should only be stored once in level 2
    if (!maze.originalCoreUpdatePlayer) {
        maze.originalCoreUpdatePlayer = window.updatePlayer;
    }
    
    // Create a new custom update function to handle all level 2 mechanics
    window.updatePlayer = function() {
        // Only proceed if player can move
        if (!player.canMove) return;
        
        // First call the core game movement logic
        maze.originalCoreUpdatePlayer();
        
        // Update the spike trap animation if it exists
        if (maze.spikeTrap) {
            maze.spikeTrap.update();
        }
        
        // Now check for trapdoor collision
        if (maze.trapdoor && player.canMove) {
            const distance = Math.sqrt(
                Math.pow(player.position.x - maze.trapdoor.position.x, 2) + 
                Math.pow(player.position.z - maze.trapdoor.position.z, 2)
            );
            
            // If player is on the trapdoor
            if (distance < maze.trapdoor.size) {
                console.log('Player fell into trapdoor!');
                // Prevent further movement
                player.canMove = false;
                
                // Visual effect - slowly sink the player
                const sinkInterval = setInterval(() => {
                    if (player.position.y > -3) {
                        player.position.y -= 0.1;
                    } else {
                        clearInterval(sinkInterval);
                    }
                }, 50);
                
                // Show game over message after a short delay
                setTimeout(() => {
                    showTrapdoorGameOver(scene, player, maze);
                }, 800);
            }
        }
        
        // Check for spike trap collision
        if (maze.spikeTrap && player.canMove) {
            if (maze.spikeTrap.checkCollision(player.position)) {
                console.log('Player hit spikes!');
                // Prevent further movement
                player.canMove = false;
                
                // Simple visual effect - make player jump up slightly
                player.position.y = 0.3; // Move up slightly
                
                // Show game over message with a small delay
                setTimeout(() => {
                    // Reset height before showing game over
                    player.position.y = 0;
                    showSpikeGameOver(scene, player, maze);
                }, 300);
            }
        }
        
        // Check for speed boost collision if it's active
        if (maze.speedBoost && maze.speedBoost.active && player.canMove) {
            const distance = Math.sqrt(
                Math.pow(player.position.x - maze.speedBoost.position.x, 2) + 
                Math.pow(player.position.z - maze.speedBoost.position.z, 2)
            );
            
            // If player collects the speed boost
            if (distance < maze.speedBoost.size) {
                console.log('SPEEDBOOST: Player collected speed boost!');
                console.log('SPEEDBOOST: Current state before collection - active:', maze.speedBoost.active, 'visible:', maze.speedBoost.mesh.visible);
                
                // Only apply boost if not already active
                if (!player.speedBoostActive) {
                    // Store original speed and apply boost
                    player.originalSpeed = player.speed;
                    player.speed = player.originalSpeed * LEVEL2.SPEEDBOOST.MULTIPLIER; // Apply configured multiplier
                    player.speedBoostActive = true;
                    console.log('SPEEDBOOST: Applied speed multiplier. New speed:', player.speed);
                    
                    // Speed up the music when speed boost is active
                    if (window.audioController && typeof window.audioController.speedUp === 'function') {
                        window.audioController.speedUp(CONFIG.AUDIO.SPEED_BOOST_RATE);
                    }
                    
                    // Hide the speed boost mesh
                    maze.speedBoost.mesh.visible = false;
                    maze.speedBoost.active = false;
                    console.log('SPEEDBOOST: After collection - active:', maze.speedBoost.active, 'visible:', maze.speedBoost.mesh.visible);
                    
                    // Show activation message
                    showSpeedBoostMessage();
                    
                    // No particle effects - removed to avoid conflicts
                    
                    // Reset speed after duration
                    setTimeout(() => {
                        if (player.speedBoostActive) {
                            // Reset player speed
                            player.speed = player.originalSpeed;
                            player.speedBoostActive = false;
                            
                            // Reset music speed when speed boost ends
                            if (window.audioController && typeof window.audioController.reset === 'function') {
                                window.audioController.reset();
                            }
                            
                            showSpeedBoostEndMessage();
                        }
                    }, LEVEL2.SPEEDBOOST.DURATION * 1000);
                }
            }
        }
    };
}

/**
 * Centralized function to respawn the player and reset all game elements
 * This ensures consistent respawn behavior across all death scenarios
 */
function respawnPlayer(player, maze) {
    console.log('RESPAWN: Resetting player and game state');
    
    // Reset player position and allow movement
    player.position.set(LEVEL2.PLAYER_START.x, LEVEL2.PLAYER_START.y, LEVEL2.PLAYER_START.z);
    player.rotation = 0;
    player.canMove = true;
    
    // Reset any active power-ups
    player.speedBoostActive = false;
    player.speed = player.originalSpeed || CONFIG.PLAYER.DEFAULT_SPEED;
    
    // Reset speed boost powerup
    if (maze && maze.speedBoost) {
        console.log('SPEEDBOOST: Resetting speedboost state on respawn');
        maze.speedBoost.active = true;
        if (maze.speedBoost.mesh) {
            maze.speedBoost.mesh.visible = true;
        } else {
            console.error('SPEEDBOOST: Mesh is missing during respawn');
        }
    } else {
        console.error('SPEEDBOOST: Speed boost object missing during respawn');
    }
    
    // Reset monster state and position
    if (maze && maze.monster) {
        console.log('MONSTER: Resetting monster state and position on respawn');
        // Use config values for monster position
        maze.monster.mesh.position.set(
            LEVEL2.MONSTER.START_POSITION.x, 
            LEVEL2.MONSTER.START_POSITION.y, 
            LEVEL2.MONSTER.START_POSITION.z
        );
        maze.monster.awakened = false;
        maze.monster.warningShown = false;
        maze.monster.gameOver = false;
    } else {
        console.log('MONSTER: No monster object found during respawn');
    }
    
    // Reset music to default using AudioManager
    if (window.audioManager) {
        console.log('AUDIO: Resetting music on respawn');
        window.audioManager.playMusic('default');
    } else if (window.audioController && typeof window.audioController.reset === 'function') {
        // Legacy fallback
        console.log('AUDIO: Using legacy audio controller for respawn');
        window.audioController.reset();
    }
    
    console.log('RESPAWN: Complete');
}

function showTrapdoorGameOver(scene, player, maze) {
    // Create and show game over message
    const gameOverMsg = document.createElement('div');
    gameOverMsg.id = 'game-over-message';
    gameOverMsg.innerHTML = `
        <p>Game Over!</p>
        <p>A trapdoor swings open beneath your feet!</p>
        <p>You tumble into darkness...</p>
        <button id="restart-btn" class="game-button">Restart Level</button>
    `;
    gameOverMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 24px;
        font-family: 'MedievalSharp', cursive;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(gameOverMsg);
    
    // Add button styling
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.style.cssText = `
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 10px 2px;
        cursor: pointer;
        border-radius: 5px;
        font-family: 'MedievalSharp', cursive;
    `;
    
    // Add click event to restart button
    restartBtn.addEventListener('click', () => {
        // Fade out message
        gameOverMsg.style.opacity = '0';
        
        // Remove message after fade out
        setTimeout(() => {
            document.body.removeChild(gameOverMsg);
            
            // Call the centralized respawnPlayer function
            respawnPlayer(player, maze);
        }, 500);
    });
    
    // Fade in the message
    setTimeout(() => {
        gameOverMsg.style.opacity = '1';
    }, 100);
}      


// Show game over message for spike trap death
function showSpikeGameOver(scene, player, maze) { // Added maze parameter
    // Create and show game over message
    const gameOverMsg = document.createElement('div');
    gameOverMsg.id = 'game-over-message';
    gameOverMsg.innerHTML = `
        <p>Game Over!</p>
        <p>You were impaled by deadly spikes!</p>
        <p>Watch your step next time...</p>
        <button id="restart-btn" class="game-button">Restart Level</button>
    `;
    gameOverMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 24px;
        font-family: 'MedievalSharp', cursive;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(gameOverMsg);
    
    // Add button styling
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.style.cssText = `
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 10px 2px;
        cursor: pointer;
        border-radius: 5px;
        font-family: 'MedievalSharp', cursive;
    `;
    
    // Add click event to restart button
    restartBtn.addEventListener('click', () => {
        // Fade out message
        gameOverMsg.style.opacity = '0';
        
        // Remove message after fade out
        setTimeout(() => {
            document.body.removeChild(gameOverMsg);
            
            // Call the centralized respawnPlayer function
            respawnPlayer(player, maze);
        }, 500);
    });
    
    // Fade in the message
    setTimeout(() => {
        gameOverMsg.style.opacity = '1';
    }, 100);
}


// Create the Triwizard Cup for Level 2
function createTriwizardCupLevel2(scene, maze) {
    const cupGroup = new THREE.Group();
    
    // Cup main body with emissive glow
    const cupGeometry = new THREE.CylinderGeometry(0.5, 0.8, 1.2, 12);
    const cupMaterial = new THREE.MeshStandardMaterial({ 
        color: '#ffca28', 
        emissive: '#ffb300',
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
    });
    const cupMesh = new THREE.Mesh(cupGeometry, cupMaterial);
    cupGroup.add(cupMesh);
    
    // Add a point light inside the cup for glow
    const cupLight = new THREE.PointLight('#ffb300', 1, 5);
    cupLight.position.set(0, 0.8, 0);
    cupGroup.add(cupLight);
    
    // Create particles around the cup
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
        color: '#ffb300',
        size: 0.1,
        transparent: true,
        opacity: 0.8
    });
    
    // Create random positions for particles in a sphere around the cup
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        // Random position in a sphere
        const radius = 1 + Math.random() * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta) + 0.6; // Offset to cup height
        const z = radius * Math.cos(phi);
        
        positions.push(x, y, z);
        
        // Random velocity for animation
        velocities.push(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
        );
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    cupGroup.add(particles);
    
    // Store particles data for animation
    maze.particles.push({
        points: particles,
        geometry: particleGeometry,
        velocities: velocities,
        initialPositions: [...positions]
    });
    
    // Position the cup at Level 2 position
    cupGroup.position.copy(LEVEL2.CUP_POSITION);
    
    maze.cup = cupGroup;
    scene.add(cupGroup);
}

// Create speed boost powerup
function createSpeedBoost(scene, maze) {
    console.log('SPEEDBOOST: Creating new speed boost');
    
    // Create the speed boost powerup (floating blue sphere)
    const speedBoostGeometry = new THREE.SphereGeometry(LEVEL2.SPEEDBOOST.SIZE, 16, 16);
    const speedBoostMaterial = new THREE.MeshPhongMaterial({ 
        color: '#1E88E5', // Bright blue
        emissive: '#0D47A1', // Darker blue glow
        shininess: 30,
        transparent: true,
        opacity: 0.8
    });
    
    const speedBoost = new THREE.Mesh(speedBoostGeometry, speedBoostMaterial);
    speedBoost.position.set(
        LEVEL2.SPEEDBOOST.POSITION.x,
        LEVEL2.SPEEDBOOST.POSITION.y + LEVEL2.SPEEDBOOST.FLOAT_HEIGHT, // Float above the ground using config value
        LEVEL2.SPEEDBOOST.POSITION.z
    );
    console.log('SPEEDBOOST: Position set to:', speedBoost.position.x, speedBoost.position.y, speedBoost.position.z);
    
    // Add a point light to make it glow
    const speedBoostLight = new THREE.PointLight(0x1E88E5, 1, 3);
    speedBoostLight.position.set(0, 0, 0);
    speedBoost.add(speedBoostLight);
    
    // Store the original position for the hover animation
    speedBoost.userData.originalY = speedBoost.position.y;
    speedBoost.userData.hoverSpeed = 0.5; // Speed of hover animation
    speedBoost.userData.rotationSpeed = 0.01; // Speed of rotation
    speedBoost.userData.active = true; // Whether powerup is available
    
    // Add to scene
    scene.add(speedBoost);
    console.log('SPEEDBOOST: Added to scene');
    
    // Store the speed boost in the maze object
    maze.speedBoost = {
        mesh: speedBoost,
        position: LEVEL2.SPEEDBOOST.POSITION,
        size: LEVEL2.SPEEDBOOST.COLLISION_SIZE, // Using predefined collision size from config
        active: true // Whether powerup is available
    };
    console.log('SPEEDBOOST: Stored in maze object, active:', maze.speedBoost.active, 'visible:', maze.speedBoost.mesh.visible);
    
    // Add animation for the speed boost
    const originalAnimateFunction = maze.animate || function() {};
    maze.animate = function(deltaTime) {
        // Call original animation if it exists
        if (originalAnimateFunction) {
            originalAnimateFunction.call(this, deltaTime);
        }
        
        // Animate the speed boost if it's active
        if (this.speedBoost && this.speedBoost.active) {
            const speedBoost = this.speedBoost.mesh;
            
            // Hover up and down
            speedBoost.position.y = speedBoost.userData.originalY + 
                Math.sin(Date.now() * 0.002) * 0.2;
            
            // Rotate
            speedBoost.rotation.y += 0.02;
            
            // Log visibility check every 3 seconds
            if (Math.floor(Date.now() / 3000) % 2 === 0 && !this._lastLogTime || (Date.now() - this._lastLogTime > 3000)) {
                console.log('SPEEDBOOST ANIMATE: active:', this.speedBoost.active, 'visible:', this.speedBoost.mesh.visible);
                this._lastLogTime = Date.now();
            }
        }
    };
}

// This function is empty since we've merged the trapdoor and speed boost checks
function setupSpeedBoostCheck(player, scene, maze) {
    // The actual functionality has been merged into setupTrapdoorCheck
    // to avoid multiple function overrides that caused the movement bug
    console.log('Speed boost check setup (integrated with trapdoor check)');
}

// Setup controls for level 2
function setupLevel2Controls(scene, camera, player, maze) {
    // Add debug teleport key
    window.addEventListener('keydown', function(event) {
        // Key '1' teleports player to position near the cup
        if (event.key === '1') {
            player.position.set(24, 1.5, -20);
            camera.position.set(24, 4.5, -15); // Move camera as well
            console.log('DEBUG: Teleported to position (24, 1.5, -20)');
        }
    });
}

// Show message when speed boost is activated
function showSpeedBoostMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'speed-boost-message';
    messageDiv.innerHTML = `<p>Speed Boost Activated!</p><p>Speed boost! Speed increased for ${LEVEL2.SPEEDBOOST.DURATION} seconds</p>`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, 0);
        background-color: rgba(33, 150, 243, 0.7);
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 20px;
        font-family: 'MedievalSharp', cursive;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Fade in
    setTimeout(() => {
        messageDiv.style.opacity = '1';
    }, 10);
    
    // Fade out after 3 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
            }
        }, 500);
    }, 3000);
}

// Show message when speed boost ends
function showSpeedBoostEndMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'speed-boost-end-message';
    messageDiv.innerHTML = `<p>Speed Boost Expired!</p>`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, 0);
        background-color: rgba(66, 66, 66, 0.7);
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 20px;
        font-family: 'MedievalSharp', cursive;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Fade in
    setTimeout(() => {
        messageDiv.style.opacity = '1';
    }, 10);
    
    // Fade out after 2 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
            }
        }, 500);
    }, 2000);
}

// Empty function that doesn't create any particles to avoid conflicts
function createSpeedBoostParticles(scene, position) {
    // No particles - just log that it was called
    console.log('Speed boost activated - particles disabled');
    // Function is kept for API compatibility but doesn't do anything
}

// Create a highly visible smoke texture for the monster particles
function createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Much larger texture for visibility
    canvas.height = 128;
    
    const context = canvas.getContext('2d');
    
    // Fill with solid black background
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create a bold circular pattern
    const gradient = context.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    // Use high contrast white-to-black for maximum visibility
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');   // White center
    gradient.addColorStop(0.2, 'rgba(150, 0, 0, 0.9)');    // Strong red
    gradient.addColorStop(0.5, 'rgba(50, 0, 0, 0.8)');     // Dark red
    gradient.addColorStop(0.8, 'rgba(20, 0, 0, 0.6)');     // Very dark red
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');          // Transparent edge
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some strong white specks for contrast
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 1 + Math.random() * 3;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.fill();
    }
    
    // Add more red specks
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 1 + Math.random() * 2;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 0, 0, 0.6)';
        context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Create monster that follows the player
function createMonster(scene, maze) {
    // Create a monster group to hold the mesh and effects
    const monsterGroup = new THREE.Group();
    // Use config values for monster position
    monsterGroup.position.set(
        LEVEL2.MONSTER.START_POSITION.x,
        LEVEL2.MONSTER.START_POSITION.y,
        LEVEL2.MONSTER.START_POSITION.z
    );
    scene.add(monsterGroup);
    
    // Create a sinister looking monster with pure black body
    const monsterGeometry = new THREE.SphereGeometry(LEVEL2.MONSTER.SIZE, 32, 32);
    const monsterMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x000000,          // Pure black
        emissive: 0x000000,        // No emissive
        specular: 0x222222,        // Minimal highlight
        shininess: 80,
        transparent: true,
        opacity: 1.0               // Fully opaque
    });
    
    const monsterMesh = new THREE.Mesh(monsterGeometry, monsterMaterial);
    monsterGroup.add(monsterMesh);
    
    // Add glowing red eyes
    const eyeGeometry = new THREE.SphereGeometry(LEVEL2.MONSTER.EYE_SIZE, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,          // Bright red
        emissive: 0xff5555,        // Glowing effect
        emissiveIntensity: 1.5,    // Stronger glow
        transparent: true,
        opacity: 0.9
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.2, -0.6);
    monsterGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.2, -0.6);
    monsterGroup.add(rightEye);
    
    // Create intense sinister smoke particles around the monster
    const particleCount = 800; // Still plenty of particles, but slightly reduced
    const particleGeometry = new THREE.BufferGeometry();
    
    // Create arrays for particle attributes
    const positions = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    // Create random positions for particles in a larger sphere around the monster
    for (let i = 0; i < particleCount; i++) {
        // Random positions in a much larger sphere
        const radius = 0.6 + Math.random() * 2.4; // Between 0.6 and 3.0 - much larger radius
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Save initial positions
        initialPositions[i * 3] = x;
        initialPositions[i * 3 + 1] = y;
        initialPositions[i * 3 + 2] = z;
        
        // Random velocities - much more active movement
        velocities[i * 3] = (Math.random() - 0.5) * 0.03;
        velocities[i * 3 + 1] = (Math.random() - 0.3) * 0.03; // Bias upward
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create a more intense visual effect using multiple layers of particles
    // First layer - large dark cloud particles
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x000000,          // Pure black smoke
        size: 1.8,                // Large but not overwhelming particles
        transparent: true,
        opacity: 0.7,             // Slightly less opaque to allow layering
        map: createSmokeTexture(),
        blending: THREE.NormalBlending, // Normal blending instead of additive
        depthWrite: false,
        sizeAttenuation: true     // Size changes with distance for more realistic effect
    });
    
    // Add a second layer of red glowing particles for a sinister effect
    const redParticleGeometry = new THREE.BufferGeometry();
    const redPositions = new Float32Array(particleCount/2 * 3);
    
    for (let i = 0; i < particleCount/2; i++) {
        const radius = 0.9 + Math.random() * 1.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        redPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        redPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        redPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    redParticleGeometry.setAttribute('position', new THREE.BufferAttribute(redPositions, 3));
    
    const redParticleMaterial = new THREE.PointsMaterial({
        color: 0x330000,          // Dark red
        size: 0.8,                // Large particles
        transparent: true,
        opacity: 0.5,
        map: createSmokeTexture(),
        blending: THREE.AdditiveBlending, // Additive for glow effect
        depthWrite: false,
        sizeAttenuation: true
    });
    
    const redParticles = new THREE.Points(redParticleGeometry, redParticleMaterial);
    monsterGroup.add(redParticles);
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    monsterGroup.add(particles);
    
    // Add a third layer of GIANT smoke particles to create an unmistakable cloud
    const giantParticleGeometry = new THREE.BufferGeometry();
    const giantPositions = new Float32Array(200 * 3); // Fewer but much larger particles
    
    for (let i = 0; i < 200; i++) {
        // Position these in a larger sphere around the monster
        const radius = 1.5 + Math.random() * 3.0; // 1.5 to 4.5 units from center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        giantPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        giantPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        giantPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    giantParticleGeometry.setAttribute('position', new THREE.BufferAttribute(giantPositions, 3));
    
    const giantParticleMaterial = new THREE.PointsMaterial({
        color: 0x330000,           // Dark red
        size: 3.5,                 // Large particles, but slightly reduced
        transparent: true,
        opacity: 0.6,
        map: createSmokeTexture(),
        blending: THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: true
    });
    
    const giantParticles = new THREE.Points(giantParticleGeometry, giantParticleMaterial);
    monsterGroup.add(giantParticles);
    
    // Store particle data for animation
    const particleSystem = {
        points: particles,
        geometry: particleGeometry,
        velocities: velocities,
        initialPositions: initialPositions
    };
    
    if (!maze.particles) {
        maze.particles = [];
    }
    maze.particles.push(particleSystem);
    
    console.log('Enhanced monster created at position:', monsterGroup.position);
    
    // Store monster data in the maze object
    maze.monster = {
        mesh: monsterGroup,
        coreMesh: monsterMesh,
        position: monsterGroup.position,
        awakened: false,           // Starts dormant until player gets close
        detectionRadius: LEVEL2.MONSTER.DETECTION_RADIUS,  // Using config value
        killRadius: 1.6,           // Increased kill radius to ensure collision works
        speed: 0.035,              // Movement speed (reduced for better gameplay balance)
        warningShown: false,       // Track if warning has been shown
        sceneRef: scene,           // Store references for the global update function
        playerRef: player,         // Store references for the global update function
        mazeRef: maze,             // Store references for the global update function
        particleSystem: particleSystem, // Reference to the particle system
        eyes: { left: leftEye, right: rightEye } // Reference to the eyes for animation
    };
    
    // Make monster update function accessible globally
    window.updateMonsterLevel2 = function() {
        if (maze.monster) {
            updateMonster(scene, player, maze);
        }
    };
    
    console.log('Monster initialized with global update function: updateMonsterLevel2');
    console.log('Monster initial position:', maze.monster.position.x, maze.monster.position.y, maze.monster.position.z);
    console.log('Detection radius:', maze.monster.detectionRadius);
}

// Update monster position and check for player collision
function updateMonster(scene, player, maze) {
    // Skip if no monster or player can't move (already game over)
    if (!maze.monster || !player.canMove || (maze.monster && maze.monster.gameOver)) {
        return;
    }
    
    // Store references in monster object to ensure they're available for game over
    maze.monster.sceneRef = scene || maze.monster.sceneRef;
    maze.monster.playerRef = player;
    maze.monster.mazeRef = maze;
    
    const monster = maze.monster;
    const monsterPos = monster.mesh.position;
    
    // Calculate distance to player
    const distanceToPlayer = monsterPos.distanceTo(player.position);
    
    // Check if monster should wake up
    if (!monster.awakened && distanceToPlayer < monster.detectionRadius) {
        monster.awakened = true;
        console.log('Monster awakened! Distance to player:', distanceToPlayer);
        
        // Change music to sinister when monster awakens
        console.log('Monster detected player - changing to sinister music');
        
        // Use AudioManager to play the sinister music
        try {
            if (window.audioManager) {
                console.log('Using AudioManager to change music');
                window.audioManager.playMusic('sinister');
            } else {
                console.error('AudioManager not available');
                
                // Fallback to legacy approach if AudioManager is not available
                console.log('Falling back to legacy audio approach');
                
                // First, stop current background music
                if (typeof audio !== 'undefined' && audio.backgroundMusic) {
                    console.log('Stopping audio.backgroundMusic');
                    audio.backgroundMusic.pause();
                    audio.backgroundMusic.currentTime = 0;
                }
                
                // Create and play new sinister music
                const sinisterMusic = new Audio('sinister_background_score.mp3');
                sinisterMusic.loop = true;
                sinisterMusic.volume = 0.7;
                sinisterMusic.play().catch(e => {
                    console.error('Error playing sinister music:', e);
                });
                
                // Update the global audio reference
                if (typeof audio !== 'undefined') {
                    audio.backgroundMusic = sinisterMusic;
                }
            }
        
        } catch (error) {
            console.error('Exception changing music:', error);
        }
        
        // Show warning if not already shown
        if (!monster.warningShown) {
            showMonsterWarning();
            monster.warningShown = true;
            console.log('Monster warning shown to player');
        } else {
            console.log('Warning already shown, not showing again');
        }
    }
    
    // Move monster toward player if awakened
    if (monster.awakened) {
        // Calculate direction toward player
        const direction = new THREE.Vector3().subVectors(player.position, monsterPos).normalize();
        
        // Move monster in that direction
        monsterPos.x += direction.x * monster.speed;
        monsterPos.y = 1.5; // Keep at consistent height
        monsterPos.z += direction.z * monster.speed;
        
        // Animate the monster's eyes for a more menacing effect
        if (monster.eyes) {
            // Make eyes pulse with intensity based on distance to player
            const pulseFactor = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
            const intensityFactor = Math.max(0.6, Math.min(1.5, 4 / distanceToPlayer));
            
            // Left eye animation
            if (monster.eyes.left) {
                monster.eyes.left.scale.set(
                    pulseFactor * intensityFactor,
                    pulseFactor * intensityFactor,
                    pulseFactor * intensityFactor
                );
                monster.eyes.left.material.opacity = 0.7 + Math.sin(Date.now() * 0.003) * 0.3;
            }
            
            // Right eye animation
            if (monster.eyes.right) {
                monster.eyes.right.scale.set(
                    pulseFactor * intensityFactor,
                    pulseFactor * intensityFactor,
                    pulseFactor * intensityFactor
                );
                monster.eyes.right.material.opacity = 0.7 + Math.sin(Date.now() * 0.003) * 0.3;
            }
        }
        
        // Check if monster caught player
        // Special calculation for Y-axis since player height is different from monster
        const horizontalDistance = Math.sqrt(
            Math.pow(player.position.x - monsterPos.x, 2) +
            Math.pow(player.position.z - monsterPos.z, 2)
        );
        
        if (horizontalDistance < monster.killRadius) {
            // Prevent further movement
            player.canMove = false;
            
            // Create a simple game over message directly
            const gameOverMsg = document.createElement('div');
            gameOverMsg.id = 'monster-game-over';
            gameOverMsg.innerHTML = `
                <p>Game Over!</p>
                <p>The dark entity has consumed you!</p>
                <button id="monster-restart-btn">Restart Level</button>
            `;
            gameOverMsg.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                font-size: 24px;
                font-family: Arial, sans-serif;
                text-align: center;
                z-index: 1000;
            `;
            document.body.appendChild(gameOverMsg);
            
            // Style the button
            const restartBtn = document.getElementById('monster-restart-btn');
            restartBtn.style.cssText = `
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 15px 32px;
                text-align: center;
                display: inline-block;
                font-size: 16px;
                margin: 10px 2px;
                cursor: pointer;
                border-radius: 5px;
            `;
            
            // Add restart functionality
            restartBtn.addEventListener('click', function() {
                // Remove the game over message
                if (document.body.contains(gameOverMsg)) {
                    document.body.removeChild(gameOverMsg);
                }
                
                console.log('Calling centralized respawn function from inline monster handler');
                // Call the centralized respawnPlayer function
                respawnPlayer(player, maze);
            });
            
            // Disable further monster updates until restart
            monster.gameOver = true;
        }
    }
}

// Show warning when monster first detects player
function showMonsterWarning() {
    console.log('FUNCTION CALLED: showMonsterWarning()');
    
    // Check if a warning is already showing
    const existingWarning = document.getElementById('monster-warning');
    if (existingWarning) {
        console.log('Warning already exists, removing old one');
        document.body.removeChild(existingWarning);
    }
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'monster-warning';
    warningDiv.innerHTML = `<p>RUN! A dark creature has spotted you!</p>`;
    console.log('Created warning div with id:', warningDiv.id);
    warningDiv.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(128, 0, 0, 0.7);
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        font-size: 20px;
        font-family: 'MedievalSharp', cursive;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(warningDiv);
    
    // Fade in
    setTimeout(() => {
        warningDiv.style.opacity = '1';
    }, 100);
    
    // Fade out and remove after 4 seconds
    setTimeout(() => {
        warningDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(warningDiv)) {
                document.body.removeChild(warningDiv);
            }
        }, 500);
    }, 4000);
}

// Show game over message when caught by monster
function showMonsterGameOver(scene, player, maze) {
    // Create and show game over message
    const gameOverMsg = document.createElement('div');
    gameOverMsg.id = 'game-over-message';
    gameOverMsg.innerHTML = `
        <p>Game Over!</p>
        <p>The dark entity has consumed you!</p>
        <p>Next time, keep your distance...</p>
        <button id="restart-btn" class="game-button">Restart Level</button>
    `;
    gameOverMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 24px;
        font-family: 'MedievalSharp', cursive;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(gameOverMsg);
    
    // Add button styling
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.style.cssText = `
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 10px 2px;
        cursor: pointer;
        border-radius: 5px;
        font-family: 'MedievalSharp', cursive;
    `;
    
    // Add click event to restart button
    restartBtn.addEventListener('click', () => {
        console.log('Restart button clicked');
        // Fade out message
        gameOverMsg.style.opacity = '0';
        
        // Remove message after fade out
        setTimeout(() => {
            if (document.body.contains(gameOverMsg)) {
                document.body.removeChild(gameOverMsg);
            }
            
            console.log('Calling centralized respawn function');
            // Call the centralized respawnPlayer function
            respawnPlayer(player, maze);
        }, 500);
    });
    
    // Fade in the message
    setTimeout(() => {
        gameOverMsg.style.opacity = '1';
    }, 100);
}