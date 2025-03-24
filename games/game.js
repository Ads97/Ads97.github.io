// Game constants
const COLORS = {
    WALL: '#1b5e20',      // Dark green for maze walls
    FLOOR: '#558b2f',     // Muted green for ground/grass
    SKY: '#0d47a1',       // Dark blue/navy for night sky
    CUP: '#ffca28'        // Golden/yellow for Triwizard Cup
};

// Parse URL parameters for portal functionality
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get('ref');
const portalParam = urlParams.get('portal');
const showPortal = refParam && portalParam === 'true';

// Debug log URL parameters
console.log('URL Parameters:', {
    ref: refParam,
    portal: portalParam,
    showPortal: showPortal
});

// Game variables
let scene, camera, debugCamera, renderer;
let isDebugView = false; // Flag to track if we're in debug view
let gameState = {
    currentLevel: 1,      // Current game level
    maxLevel: 2,          // Maximum available level
    isTransitioning: false, // Flag for level transition animations
    hasPortal: showPortal, // Whether to show the return portal
    portalDestination: refParam || '', // Where the portal should send the player
    portalCooldown: false, // Whether the portal is in cooldown after clicking No
    portalCooldownTime: 3000 // Cooldown time in milliseconds (3 seconds)
};
let player = {
    height: 1.8,          // Player height in units
    speed: 0.1,           // Player movement speed
    turnSpeed: 0.015,     // Reduced player rotation speed for smoother joystick control
    position: new THREE.Vector3(0, 0, 10), // Start position
    rotation: 0,          // Current rotation angle
    canMove: true         // Whether player can move
};
let maze = {
    walls: [],            // Array to store wall objects for collision
    cup: null,            // Reference to the Triwizard Cup
    particles: [],        // Particles for special effects
    floor: null,          // Reference to the floor
    clock: new THREE.Clock() // Clock for animations
};
let keys = {              // Track key presses
    up: false,
    down: false,
    left: false,
    right: false
};
// Note: Audio is now managed by AudioManager in audio.js
// This is kept for backward compatibility
let audio = {};


// Initialize the game
function init() {
    // Initialize the audio system
    window.audioManager.init();
    
    // Setup tutorial popup
    setupTutorial();
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.SKY);

    // Create main camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = player.height;
    
    // Create debug camera (top-down view)
    debugCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    debugCamera.position.set(0, 40, 0); // Position high above the maze
    debugCamera.lookAt(0, 0, 0);       // Look down at the center

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Create the maze for the current level
    createMaze(gameState.currentLevel);

    // Set up event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Add mobile touch controls
    setupMobileControls();

    // Start game loop
    animate();
}

// Create the maze environment
// Main function to create a maze based on level
function createMaze(level = 1) {
    // Clear any existing maze elements
    clearMaze();
    
    // Create common floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50); // Larger floor to accommodate different levels
    const floorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.FLOOR });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = 0;
    scene.add(floor);
    maze.floor = floor;
    
    // Create wall material - shared by all walls
    const wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.WALL });
    
    // Create the appropriate level
    if (level === 1) {
        // Set sky color for level 1
        scene.background = new THREE.Color(COLORS.SKY);
        
        // Create Level 1 maze
        createLevel1Maze(wallMaterial);
        
        // Create the Triwizard Cup for level 1
        createTriwizardCup();
    } else if (level === 2) {
        // Load level 2 from external file
        loadLevel2(scene, maze, player, showLevelMessage);
    }
}

// Clear existing maze elements
function clearMaze() {
    // Remove existing walls
    for (const wall of maze.walls) {
        scene.remove(wall.mesh);
    }
    maze.walls = [];
    
    // Remove existing cup
    if (maze.cup) {
        scene.remove(maze.cup);
        maze.cup = null;
    }
    
    // Remove existing particles
    maze.particles = [];
    
    // Remove existing floor
    if (maze.floor) {
        scene.remove(maze.floor);
        maze.floor = null;
    }
    
    // Reset player position based on current level
    if (gameState.currentLevel === 1) {
        player.position = new THREE.Vector3(0, 0, 10);
    } else {
        player.position = new THREE.Vector3(0, 0, 15); // Different starting position for level 2
    }
    
    player.rotation = 0;
    player.canMove = true;
}

// Create Level 1 maze
function createLevel1Maze(wallMaterial) {
    // Create maze walls (simple straight path with walls on both sides)
    const wallGeometry = new THREE.BoxGeometry(1, 3, 35); // Extended length to connect with back wall
    
    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-3, 1.5, 0.5); // Adjusted position to fill gap
    scene.add(leftWall);
    maze.walls.push({
        mesh: leftWall,
        min: new THREE.Vector3(-3.5, 0, -10.5),
        max: new THREE.Vector3(-2.5, 3, 17.5)
    });
    
    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(3, 1.5, 0.5); // Adjusted position to fill gap
    scene.add(rightWall);
    maze.walls.push({
        mesh: rightWall,
        min: new THREE.Vector3(2.5, 0, -10.5),
        max: new THREE.Vector3(3.5, 3, 17.5)
    });
    
    // Back wall (to prevent player from going backwards)
    const backWallGeometry = new THREE.BoxGeometry(7, 3, 1);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 1.5, 18); // Position it just behind the player's starting point
    scene.add(backWall);
    maze.walls.push({
        mesh: backWall,
        min: new THREE.Vector3(-3.5, 0, 17.5),
        max: new THREE.Vector3(3.5, 3, 18.5)
    });
    
    // Add end wall (behind the trophy)
    const endWallGeometry = new THREE.BoxGeometry(7, 3, 1);
    const endWall = new THREE.Mesh(endWallGeometry, wallMaterial);
    endWall.position.set(0, 1.5, -11); // Position it just behind the trophy
    scene.add(endWall);
    maze.walls.push({
        mesh: endWall,
        min: new THREE.Vector3(-3.5, 0, -11.5),
        max: new THREE.Vector3(3.5, 3, -10.5)
    });
    
    // Create return portal if URL parameters indicate it should be shown
    if (gameState.hasPortal) {
        createReturnPortal();
    }
}

// Helper function to create a wall for Level 1
function createWall(width, height, depth, x, y, z, material) {
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

// Create the Triwizard Cup for Level 1
function createTriwizardCup() {
    const cupGroup = new THREE.Group();
    
    // Cup main body with emissive glow
    const cupGeometry = new THREE.CylinderGeometry(0.5, 0.8, 1.2, 12);
    const cupMaterial = new THREE.MeshStandardMaterial({ 
        color: COLORS.CUP, 
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
    
    // Position the cup for level 1
    cupGroup.position.set(0, 0.6, -9);
    
    maze.cup = cupGroup;
    scene.add(cupGroup);
}

// Handle window resize
function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update main camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update debug camera
    debugCamera.aspect = window.innerWidth / window.innerHeight;
    debugCamera.updateProjectionMatrix();
}

// Handle keydown events
function handleKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
            keys.up = true;
            break;
        case 'ArrowDown':
            keys.down = true;
            break;
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'd':
        case 'D':
            // Toggle debug view
            isDebugView = !isDebugView;
            console.log('Debug view:', isDebugView ? 'ON' : 'OFF');
            
            // Update debug camera position to follow player's current position
            if (isDebugView) {
                debugCamera.position.set(player.position.x, 40, player.position.z);
                debugCamera.lookAt(player.position.x, 0, player.position.z);
            }
            break;
        case 's':
        case 'S':
            // Debug skip to next level
            if (!gameState.isTransitioning && gameState.currentLevel < gameState.maxLevel) {
                console.log('Debug: Skipping to next level');
                skipToNextLevel();
            } else if (gameState.currentLevel >= gameState.maxLevel) {
                console.log('Debug: Already at max level');
            }
            break;
    }
}

// Handle keyup events
function handleKeyUp(event) {
    switch (event.key) {
        case 'ArrowUp':
            keys.up = false;
            break;
        case 'ArrowDown':
            keys.down = false;
            break;
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
    }
}

// Set up mobile joystick controls
function setupMobileControls() {
    // Only setup joystick on touch devices
    if (!('ontouchstart' in window)) return;
    
    // Check if nipplejs is loaded (try both possible names)
    if (typeof window.nipplejs === 'undefined' && typeof window.nipple === 'undefined') {
        console.error('nipplejs library not loaded. Mobile controls will be disabled.');
        return;
    }
    
    // Get the nipplejs object (different libraries might expose it differently)
    const nippleJS = window.nipplejs || window.nipple;
    
    const joystickOptions = {
        zone: document.getElementById('joystick-zone'),
        mode: 'static',
        position: { left: '50%', bottom: '0' },
        color: 'rgba(255, 255, 255, 0.5)',  // Subtle white color
        size: 120,
        restOpacity: 0.5,          // Semi-transparent when not in use
        fadeTime: 100,
        lockX: false,              // Allow both X and Y movement
        lockY: false,
        catchDistance: 100          // More forgiving catch distance
    };
    
    // Create the joystick
    const manager = nippleJS.create(joystickOptions);
    
    // Handle joystick movement
    manager.on('move', function(evt, data) {
        if (data.angle) {
            const angle = data.angle.radian;
            const distance = data.distance || 0;
            
            // Minimum distance threshold to do anything
            const minThreshold = 20;
            
            // Clear all keys first
            keys.up = false;
            keys.down = false;
            keys.left = false;
            keys.right = false;
            
            if (distance >= minThreshold) {
                // Very narrow angle ranges for forward/backward movement
                // Forward - strict south position (around 0.5π)
                if (angle > Math.PI * 0.45 && angle < Math.PI * 0.55) {
                    keys.up = true;     // Move forward
                } 
                // Backward - strict north position (around 1.5π)
                else if (angle > Math.PI * 1.45 && angle < Math.PI * 1.55) {
                    keys.down = true;    // Move backward
                }
                // Any other angle = rotation
                else {
                    // Use the vector data from the joystick (more reliable than angle)
                    const vector = data.vector || {};
                    
                    // Left/right based on x component of the vector
                    if (vector.x < 0) {
                        // Negative x = left side of joystick
                        keys.left = true;   // Turn left
                    } else {
                        // Positive x = right side of joystick 
                        keys.right = true;  // Turn right
                    }
                }
            }
        }
    });
    
    // Reset all keys when joystick is released
    manager.on('end', function() {
        keys.up = false;
        keys.down = false;
        keys.left = false;
        keys.right = false;
    });
    
    // Handle any errors or joystick being destroyed
    manager.on('destroyed', function() {
        keys.up = false;
        keys.down = false;
        keys.left = false;
        keys.right = false;
    });
}

// Check if player has reached the Triwizard Cup
function checkWinCondition() {
    const distanceToCup = player.position.distanceTo(maze.cup.position);
    if (distanceToCup < 1.5 && !gameState.isTransitioning) {
        player.canMove = false;
        
        // Play success fanfare and mute background music using AudioManager
        if (window.audioManager) {
            // Stop all other music and play the fanfare sound
            window.audioManager.stopAll();
            window.audioManager.playSound('fanfare');
            console.log('Playing victory fanfare via AudioManager');
        } else {
            // Fallback to legacy approach
            console.log('Falling back to legacy audio approach for fanfare');
            
            // Pause background music
            if (audio.backgroundMusic) {
                audio.backgroundMusic.pause();
            }
            
            // Play the fanfare sound
            if (audio.fanfare) {
                audio.fanfare.currentTime = 0;
                audio.fanfare.play().catch(e => console.log('Could not play fanfare:', e));
            }
        }
        
        // Check if there's a next level
        if (gameState.currentLevel < gameState.maxLevel) {
            // Start level transition
            startLevelTransition();
        } else {
            // This is the final level - show win popup
            document.getElementById('win-popup').style.display = 'block';
        }
    }
}

// Skip directly to next level (debug feature)
function skipToNextLevel() {
    // Prevent movement during transition
    player.canMove = false;
    gameState.isTransitioning = true;
    
    // Increment level
    gameState.currentLevel++;
    
    // Reset player position 
    player.position.set(0, player.height, 15);
    player.rotation = 0;
    
    // Create new maze for next level
    createMaze(gameState.currentLevel);
    
    // Reset transition flag
    gameState.isTransitioning = false;
    
    // Allow player to move again after slight delay
    setTimeout(() => {
        player.canMove = true;
    }, 100);
}

// Handle transition between levels
function startLevelTransition() {
    gameState.isTransitioning = true;
    
    // Create and show level complete message with continue button
    const levelCompleteMsg = document.createElement('div');
    levelCompleteMsg.id = 'level-complete';
    levelCompleteMsg.innerHTML = `
        <p>Level ${gameState.currentLevel} Complete!</p>
        <button id="continue-btn" class="game-button">Continue to Level ${gameState.currentLevel + 1}</button>
    `;
    levelCompleteMsg.style.cssText = `
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
    document.body.appendChild(levelCompleteMsg);
    
    // Add button styling
    const continueBtn = document.getElementById('continue-btn');
    continueBtn.style.cssText = `
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
    
    // Add click event to continue button
    continueBtn.addEventListener('click', () => {
        // Fade out message
        levelCompleteMsg.style.opacity = '0';
        
        // Remove message after fade out
        setTimeout(() => {
            document.body.removeChild(levelCompleteMsg);
            
            // Increment level
            gameState.currentLevel++;
            
            // Reset player position to initial position for Level 2
            player.position.set(0, player.height, 15);
            player.rotation = 0;
            
            // Create new maze for next level
            createMaze(gameState.currentLevel);
            
            // Reset transition flag
            gameState.isTransitioning = false;
            
            // Restart background music for the next level using AudioManager
            if (window.audioManager) {
                console.log('Restarting level music with AudioManager');
                window.audioManager.playMusic('default');
            } else {
                // Fallback to legacy approach
                console.log('Falling back to legacy audio for level transition');
                if (audio.backgroundMusic) {
                    audio.backgroundMusic.currentTime = 0;
                    audio.backgroundMusic.play().catch(e => console.log('Could not restart music:', e));
                }
            }
            
            // Allow player to move again after slight delay to ensure level is loaded
            setTimeout(() => {
                player.canMove = true;
            }, 100);
        }, 500);
    });
    
    // Fade in the message
    setTimeout(() => {
        levelCompleteMsg.style.opacity = '1';
    }, 100);
}

// Show level message with fade effect
function showLevelMessage(level = 1) {
    const levelMessage = document.getElementById('level-message');
    
    // Get level name from config
    if (level === 1) {
        levelMessage.innerText = LEVEL1.NAME; // 'Level 1 (Tutorial)'
    } else if (level === 2) {
        levelMessage.innerText = LEVEL2.NAME; // 'Level 2'
    } else {
        levelMessage.innerText = `Level ${level}`;
    }
    
    // Show the level message
    levelMessage.style.opacity = '1';
    
    // Fade out after 2 seconds
    setTimeout(() => {
        levelMessage.style.opacity = '0';
    }, 2000);
}

// Check collisions with maze walls
function checkCollisions(newPosition) {
    // Simple AABB collision detection
    const playerRadius = 0.5;
    const playerMin = new THREE.Vector3(
        newPosition.x - playerRadius,
        newPosition.y,
        newPosition.z - playerRadius
    );
    const playerMax = new THREE.Vector3(
        newPosition.x + playerRadius,
        newPosition.y + player.height,
        newPosition.z + playerRadius
    );

    // Check each wall
    for (const wall of maze.walls) {
        if (
            playerMin.x <= wall.max.x && 
            playerMax.x >= wall.min.x &&
            playerMin.y <= wall.max.y && 
            playerMax.y >= wall.min.y &&
            playerMin.z <= wall.max.z && 
            playerMax.z >= wall.min.z
        ) {
            return true; // Collision detected
        }
    }
    
    return false; // No collision
}

// Update player movement and camera
function updatePlayer() {
    if (!player.canMove) return;
    
    // Rotate player
    if (keys.left) {
        player.rotation += player.turnSpeed;
    }
    if (keys.right) {
        player.rotation -= player.turnSpeed;
    }
    
    // Move player forward/backward
    if (keys.up || keys.down) {
        // Determine direction (forward or backward)
        const directionMultiplier = keys.up ? 1 : -1;
        
        // Calculate movement vector (negative for forward because of coordinate system)
        const moveX = -Math.sin(player.rotation) * player.speed * directionMultiplier;
        const moveZ = -Math.cos(player.rotation) * player.speed * directionMultiplier;
        
        // Calculate new position
        const newPosition = new THREE.Vector3(
            player.position.x + moveX,
            player.position.y,
            player.position.z + moveZ
        );
        
        // Check for collisions
        const collision = checkCollisions(newPosition);
        if (!collision) {
            player.position.copy(newPosition);
        }
    }
    
    // Update camera position and rotation
    camera.position.x = player.position.x;
    camera.position.z = player.position.z;
    camera.rotation.y = player.rotation;
    
    // Update debug camera if in debug mode
    if (isDebugView) {
        debugCamera.position.x = player.position.x;
        debugCamera.position.z = player.position.z;
        debugCamera.lookAt(player.position.x, 0, player.position.z);
    }
    
    // Check if player has reached the cup
    checkWinCondition();
    
    // Check if player has entered the return portal in Level 1
    if (gameState.currentLevel === 1 && gameState.hasPortal && maze.returnPortal) {
        const inPortal = maze.returnPortal.checkCollision(player.position);
        
        if (inPortal && !gameState.portalCooldown) {
            // Only show portal confirmation if not already showing and not in cooldown
            const confirmationDialog = document.getElementById('portal-confirmation');
            if (confirmationDialog.style.display !== 'block') {
                maze.returnPortal.showConfirmation();
            }
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = maze.clock.getDelta();
    
    // Update particles
    updateParticles(deltaTime);
    
    // Make the cup glow pulse
    if (maze.cup) {
        // Pulse the point light in the cup
        const pulseFactor = (Math.sin(maze.clock.getElapsedTime() * 2) + 1) / 2;
        const cupLight = maze.cup.children.find(child => child instanceof THREE.PointLight);
        if (cupLight) {
            cupLight.intensity = 0.5 + pulseFactor * 0.8;
        }
    }
    
    updatePlayer();
    
    // Update monster if we're in level 2 and the update function exists
    if (gameState.currentLevel === 2 && typeof window.updateMonsterLevel2 === 'function') {
        window.updateMonsterLevel2();
    }
    
    // Render with the appropriate camera based on debug mode
    renderer.render(scene, isDebugView ? debugCamera : camera);
}

// Update particle positions for animation
function updateParticles(deltaTime) {
    maze.particles.forEach(particleSystem => {
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Apply velocity to position
            positions[i] += velocities[i/3*3] * Math.sin(maze.clock.getElapsedTime() * 0.5); 
            positions[i+1] += velocities[i/3*3+1] + Math.sin(maze.clock.getElapsedTime() * 2) * 0.01;
            positions[i+2] += velocities[i/3*3+2] * Math.cos(maze.clock.getElapsedTime() * 0.5);
            
            // Reset particles that go too far
            const distance = Math.sqrt(
                Math.pow(positions[i], 2) + 
                Math.pow(positions[i+1] - 0.6, 2) + 
                Math.pow(positions[i+2], 2)
            );
            
            if (distance > 2) {
                // Reset to initial position
                const initIndex = Math.floor(i/3) * 3;
                positions[i] = particleSystem.initialPositions[initIndex];
                positions[i+1] = particleSystem.initialPositions[initIndex+1];
                positions[i+2] = particleSystem.initialPositions[initIndex+2];
            }
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
    });
}

// Setup background music - functionality moved to AudioManager in audio.js
function setupBackgroundMusic() {
    // This function is preserved for backward compatibility
    // It now forwards to the AudioManager
    console.log('setupBackgroundMusic called - delegating to AudioManager');
    
    if (window.audioManager) {
        // The audio manager will automatically handle autoplay restrictions and user interaction
        
        // Set the audio object references for backward compatibility
        audio.backgroundMusic = window.audioManager.tracks['default'];
        audio.fanfare = window.audioManager.soundEffects['fanfare'];
    } else {
        console.error('AudioManager not initialized');
    }
}

// Speed control functions are now handled by AudioManager

window.resetBackgroundMusicSpeed = function() {
        
        if (audio && audio.backgroundMusic) {
            try {
                const originalRate = audio.backgroundMusic.originalRate || 1.0;
                
                audio.backgroundMusic.playbackRate = originalRate;                
                return true;
            } catch (error) {
                return false;
            }
        } else {
            return false;
        }
    };

// Setup tutorial popup
function setupTutorial() {
    const tutorialPopup = document.getElementById('tutorial-popup');
    const closeButton = document.getElementById('tutorial-close');
    
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('hasSeenMazeTutorial');
    
    // Show tutorial if first visit
    if (!hasSeenTutorial) {
        tutorialPopup.style.display = 'block';
        
        // Pause game while tutorial is open (optional)
        if (maze.controls) {
            maze.controls.enabled = false;
        }
    } else {
        tutorialPopup.style.display = 'none';
        // Show level message immediately if tutorial was previously seen
        showLevelMessage(gameState.currentLevel);
    }
    
    // Close tutorial when button is clicked
    closeButton.addEventListener('click', () => {
        tutorialPopup.style.display = 'none';
        
        // Save that user has seen tutorial
        localStorage.setItem('hasSeenMazeTutorial', 'true');
        
        // Enable controls
        if (maze.controls) {
            maze.controls.enabled = true;
        }
        
        // Show level message after tutorial closes
        showLevelMessage(gameState.currentLevel);
        
        // Start background music when tutorial is closed
        if (audio.backgroundMusic) {
            audio.backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
        }
    });
}

// Setup portal button for GameJam redirect
function setupPortalButton() {
    const portalButton = document.getElementById('portal-button');
    portalButton.addEventListener('click', function() {
        // Redirect to the GameJam portal with ref parameter
        window.location.href = 'https://portal.pieter.com?ref=https://advaithsridhar.blog/games/maze.html';
    });
}

// Create a portal that allows players to return to the previous game
function createReturnPortal() {
    console.log('Creating return portal to:', gameState.portalDestination);
    
    // Create a more visible portal
    console.log('Creating portal at position:', LEVEL1.PORTAL.POSITION);
    
    // Create a floating disc for the portal
    const portalGeometry = new THREE.CylinderGeometry(LEVEL1.PORTAL.SIZE, LEVEL1.PORTAL.SIZE, 0.2, 32);
    const portalMaterial = new THREE.MeshPhongMaterial({ 
        color: LEVEL1.PORTAL.COLOR, 
        emissive: LEVEL1.PORTAL.COLOR,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
    });
    
    const portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
    portalMesh.rotation.x = Math.PI / 2; // Rotate to be flat
    portalMesh.position.set(
        LEVEL1.PORTAL.POSITION.x,
        LEVEL1.PORTAL.POSITION.y + 1.0, // Float 1 meter above the ground
        LEVEL1.PORTAL.POSITION.z
    );
    scene.add(portalMesh);
    
    // Add a stronger point light to make portal glow
    const portalLight = new THREE.PointLight(LEVEL1.PORTAL.COLOR, 2, 10);
    portalLight.position.set(
        LEVEL1.PORTAL.POSITION.x,
        LEVEL1.PORTAL.POSITION.y + 1.0,
        LEVEL1.PORTAL.POSITION.z
    );
    scene.add(portalLight);
    
    // Add a second portal ring for better visibility
    const outerRingGeometry = new THREE.TorusGeometry(LEVEL1.PORTAL.SIZE + 0.2, 0.1, 16, 32);
    const outerRingMaterial = new THREE.MeshPhongMaterial({
        color: '#FFFFFF', 
        emissive: '#FFFFFF',
        emissiveIntensity: 1.0
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.position.set(
        LEVEL1.PORTAL.POSITION.x,
        LEVEL1.PORTAL.POSITION.y + 1.0,
        LEVEL1.PORTAL.POSITION.z
    );
    scene.add(outerRing);
    
    // No particle system for the portal
    
    // Store portal information for collision detection
    maze.returnPortal = {
        position: new THREE.Vector3(
            LEVEL1.PORTAL.POSITION.x,
            LEVEL1.PORTAL.POSITION.y + 1.0, // Match the floating height
            LEVEL1.PORTAL.POSITION.z
        ),
        size: LEVEL1.PORTAL.COLLISION_SIZE,
        mesh: portalMesh,
        light: portalLight,
        outerRing: outerRing,
        destination: gameState.portalDestination,
        checkCollision: function(playerPosition) {
            // Calculate horizontal distance only (ignoring height difference since it's floating)
            const dx = Math.abs(playerPosition.x - this.position.x);
            const dz = Math.abs(playerPosition.z - this.position.z);
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            console.log('Player distance to portal:', distance, 'Required:', this.size);
            
            // Check if player is within portal radius
            return distance < this.size;
        },
        showConfirmation: function() {
            // Pause player movement
            player.canMove = false;
            
            // Show the portal confirmation dialog
            const confirmationDialog = document.getElementById('portal-confirmation');
            confirmationDialog.style.display = 'block';
            
            // Setup button listeners
            const yesButton = document.getElementById('portal-yes');
            const noButton = document.getElementById('portal-no');
            
            // Remove any existing event listeners to prevent duplicates
            const newYesButton = yesButton.cloneNode(true);
            const newNoButton = noButton.cloneNode(true);
            yesButton.parentNode.replaceChild(newYesButton, yesButton);
            noButton.parentNode.replaceChild(newNoButton, noButton);
            
            // Make sure the button text is correct
            newYesButton.textContent = 'Yes';
            newNoButton.textContent = 'No';
            
            // Setup new event listeners
            newYesButton.addEventListener('click', () => {
                confirmationDialog.style.display = 'none';
                // Redirect to the original game URL
                window.location.href = this.destination;
            });
            
            newNoButton.addEventListener('click', () => {
                confirmationDialog.style.display = 'none';
                // Resume player movement
                player.canMove = true;
                
                // Set portal cooldown to prevent immediate reactivation
                gameState.portalCooldown = true;
                console.log('Portal on cooldown for ' + (gameState.portalCooldownTime/1000) + ' seconds');
                
                // After cooldown period, allow portal activation again
                setTimeout(() => {
                    gameState.portalCooldown = false;
                    console.log('Portal cooldown ended');
                    
                    // Only if player is far enough away from the portal
                    if (maze.returnPortal && maze.returnPortal.checkCollision(player.position)) {
                        console.log('Player still in portal - keeping cooldown active');
                        gameState.portalCooldown = true;
                        
                        // Check every half second if player has moved away
                        const checkInterval = setInterval(() => {
                            if (!maze.returnPortal.checkCollision(player.position)) {
                                gameState.portalCooldown = false;
                                console.log('Player moved away from portal - cooldown ended');
                                clearInterval(checkInterval);
                            }
                        }, 500);
                    }
                }, gameState.portalCooldownTime);
            });
        }
    };
}

// Call portal button setup
setupPortalButton();

// Start the game
init();
