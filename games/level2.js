// Level 2 code for the Triwizard Maze game

// Direct access to audio object for speed control
function setMusicSpeed(speed) {
    console.log('Direct music speed control - setting speed to:', speed);
    
    // First try to access the audio from the window.audio object
    if (window.audio && window.audio.backgroundMusic) {
        try {
            // Print all properties of the audio object
            console.log('Audio object found, properties:', Object.getOwnPropertyNames(window.audio.backgroundMusic));
            console.log('Audio paused state:', window.audio.backgroundMusic.paused);
            
            // Store original rate if not already stored
            if (typeof window.audio.backgroundMusic._originalRate === 'undefined') {
                window.audio.backgroundMusic._originalRate = window.audio.backgroundMusic.playbackRate || 1.0;
                console.log('Stored original rate:', window.audio.backgroundMusic._originalRate);
            }
            
            // Attempt direct property modification
            const prevRate = window.audio.backgroundMusic.playbackRate;
            window.audio.backgroundMusic.playbackRate = speed;
            
            // Check if it worked
            console.log('Previous rate:', prevRate, 'New rate:', window.audio.backgroundMusic.playbackRate);
            
            // Manual implementation - recreate the audio with the new speed
            if (window.audio.backgroundMusic.playbackRate !== speed) {
                console.log('Property set failed, trying alternate method');
                
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
                console.log('Created new audio with speed:', window.audio.backgroundMusic.playbackRate);
            }
            
            return true;
        } catch (e) {
            console.error('Error setting music speed:', e);
            return false;
        }
    } else {
        console.log('Audio object not found in expected location');
        return false;
    }
}

function resetMusicSpeed() {
    console.log('Direct music speed control - resetting speed');
    
    // First try to access the audio from the window.audio object
    if (window.audio && window.audio.backgroundMusic) {
        try {
            const originalRate = window.audio.backgroundMusic._originalRate || 1.0;
            console.log('Resetting to original rate:', originalRate);
            
            // Attempt direct property modification
            window.audio.backgroundMusic.playbackRate = originalRate;
            
            // Check if it worked
            console.log('New rate after reset:', window.audio.backgroundMusic.playbackRate);
            
            // Similar fallback as in setMusicSpeed if needed
            if (window.audio.backgroundMusic.playbackRate !== originalRate) {
                console.log('Reset failed, trying alternate method');
                
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
                console.log('Created new audio with original speed:', newAudio.playbackRate);
            }
            
            return true;
        } catch (e) {
            console.error('Error resetting music speed:', e);
            return false;
        }
    } else {
        console.log('Audio object not found in expected location');
        return false;
    }
}

// Level 2 constants
const LEVEL2 = {
    SKY_COLOR: '#1a237e', // Darker blue for level 2
    PLAYER_START: new THREE.Vector3(0, 0, 15),
    CUP_POSITION: new THREE.Vector3(-20, 0.6, -20),
    TRAPDOOR_POSITION: new THREE.Vector3(10, 0, -12), // Updated trapdoor position
    TRAPDOOR_SIZE: 1.5, // Smaller trapdoor size for players to walk around
    SPEEDBOOST_POSITION: new THREE.Vector3(-10, 0, -12.5), // Position for speed boost powerup
    SPEEDBOOST_SIZE: 0.5, // Size of the speed boost powerup
    SPEEDBOOST_DURATION: 10, // Duration of speed boost in seconds
    SPIKE_CYCLE: 3000, // Spike cycle time in milliseconds (3 seconds)
    SPIKE_ACTIVE_TIME: 1500 // How long spikes stay up (1.5 seconds)
};

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
            if (timeSinceLastCycle % LEVEL2.SPIKE_CYCLE < LEVEL2.SPIKE_ACTIVE_TIME) {
                // Spikes should be active (up)
                if (!this.active) {
                    this.active = true;
                    
                    // Move spikes up instantly for now
                    this.spikes.forEach(spike => {
                        spike.position.y = -1.5; // Move spike up to floor level
                    });
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
            if (timeSinceLastCycle >= LEVEL2.SPIKE_CYCLE) {
                this.lastCycleTime = currentTime - (timeSinceLastCycle % LEVEL2.SPIKE_CYCLE);
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
        LEVEL2.TRAPDOOR_POSITION.x,
        LEVEL2.TRAPDOOR_POSITION.y,
        LEVEL2.TRAPDOOR_POSITION.z
    );
    
    // Add to scene
    scene.add(trapdoorGroup);
    
    // Store the trapdoor in the maze object
    maze.trapdoor = {
        mesh: trapdoorGroup,
        position: LEVEL2.TRAPDOOR_POSITION,
        size: LEVEL2.TRAPDOOR_SIZE / 2.5 // Reduced collision size to allow walking around it
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
                    showTrapdoorGameOver(scene, player);
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
                    showSpikeGameOver(scene, player);
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
                console.log('Player collected speed boost!');
                
                // Only apply boost if not already active
                if (!player.speedBoostActive) {
                    // Store original speed and apply boost
                    player.originalSpeed = player.speed;
                    player.speed = player.originalSpeed * 3; // Triple the speed
                    player.speedBoostActive = true;
                    
                    // Speed up the music to 2x when speed boost is active
                    if (window.audioController && typeof window.audioController.speedUp === 'function') {
                        window.audioController.speedUp(2.0);
                    }
                    
                    // Hide the speed boost mesh
                    maze.speedBoost.mesh.visible = false;
                    maze.speedBoost.active = false;
                    
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
                    }, LEVEL2.SPEEDBOOST_DURATION * 1000);
                }
            }
        }
    };
}

// Display game over message when player falls into trapdoor
function showTrapdoorGameOver(scene, player) {
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
            
            // Reset player position and allow movement
            player.position.set(LEVEL2.PLAYER_START.x, LEVEL2.PLAYER_START.y, LEVEL2.PLAYER_START.z);
            player.rotation = 0;
            player.canMove = true;
        }, 500);
    });
    
    // Fade in the message
    setTimeout(() => {
        gameOverMsg.style.opacity = '1';
    }, 100);
}

// Show game over message for spike trap death
function showSpikeGameOver(scene, player) {
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
            
            // Reset player position and allow movement
            player.position.set(LEVEL2.PLAYER_START.x, LEVEL2.PLAYER_START.y, LEVEL2.PLAYER_START.z);
            player.rotation = 0;
            player.canMove = true;
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
    // Create the speed boost powerup (floating blue sphere)
    const speedBoostGeometry = new THREE.SphereGeometry(LEVEL2.SPEEDBOOST_SIZE, 16, 16);
    const speedBoostMaterial = new THREE.MeshPhongMaterial({ 
        color: '#1E88E5', // Bright blue
        emissive: '#0D47A1', // Darker blue glow
        shininess: 30,
        transparent: true,
        opacity: 0.8
    });
    
    const speedBoost = new THREE.Mesh(speedBoostGeometry, speedBoostMaterial);
    speedBoost.position.set(
        LEVEL2.SPEEDBOOST_POSITION.x,
        LEVEL2.SPEEDBOOST_POSITION.y + 0.8, // Float a bit above the ground
        LEVEL2.SPEEDBOOST_POSITION.z
    );
    
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
    
    // Store the speed boost in the maze object
    maze.speedBoost = {
        mesh: speedBoost,
        position: LEVEL2.SPEEDBOOST_POSITION,
        size: LEVEL2.SPEEDBOOST_SIZE * 1.2, // Slightly larger collision size than visual
        active: true // Whether powerup is available
    };
    
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
    messageDiv.innerHTML = `<p>Speed Boost Activated!</p><p>Speed boost! Speed increased for ${LEVEL2.SPEEDBOOST_DURATION} seconds</p>`;
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
