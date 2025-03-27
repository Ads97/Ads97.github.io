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
    speed: 0.07,          // Player movement speed (set to exactly 0.07)
    turnSpeed: 0.03,      // Player rotation speed adjusted for better control
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
    isStopped: false,    // Whether player movement is paused (S key)
    isRotating: false,   // Whether player is currently in a rotation animation
    targetRotation: null, // Target angle for smooth rotation
    rotationStartTime: null, // When rotation started
    rotationStartAngle: null // Starting angle for interpolation
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
        // Load the original level 2 from external file
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
    
    // Left wall
    createWall(1, 3, 35, -3, 1.5, 0.5, wallMaterial); // Long wall on the left side
    
    // Right wall
    createWall(1, 3, 23, 3, 1.5, 6.0, wallMaterial); // Long wall on the right side
    
    // Back wall (to prevent player from going backwards)
    createWall(7, 3, 1, 0, 1.5, 18, wallMaterial); // Wall behind player's starting point
    
    // Add left turn wall
    createWall(40, 3, 1, 5, 1.5, -11, wallMaterial); 

    // Add left turn wall 2
    createWall(20, 3, 1, 12.5, 1.5, -6, wallMaterial); 

    // wall behind trophy
    createWall(1, 3, 5, 23, 1.5, -8.5, wallMaterial); // Long wall on the right side
    
    // Add spike trap in level 1 path
    createSpikes(1, 3, 5, 17, 1.5, -8.5);

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

// Helper function to create spike trap
function createSpikes(width, height, depth, x, y, z) {
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
            if (timeSinceLastCycle % LEVEL1.SPIKES.CYCLE < LEVEL1.SPIKES.ACTIVE_TIME) {
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
            if (timeSinceLastCycle >= LEVEL1.SPIKES.CYCLE) {
                this.lastCycleTime = currentTime - (timeSinceLastCycle % LEVEL1.SPIKES.CYCLE);
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
    
    // Position the cup using Level 1 configuration
    cupGroup.position.copy(LEVEL1.CUP_POSITION);
    
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
    // For Alt+S debug level skip
    if (event.altKey && event.key.toLowerCase() === 's') {
        // Debug skip to next level with Alt+S
        if (!gameState.isTransitioning && gameState.currentLevel < gameState.maxLevel) {
            console.log('Debug: Skipping to next level');
            skipToNextLevel();
        } else if (gameState.currentLevel >= gameState.maxLevel) {
            console.log('Debug: Already at max level');
        }
        return; // Exit early
    }
    
    // Regular movement controls
    switch (event.key.toLowerCase()) {
        case 'a':
            // Only start rotation if not already rotating
            if (!keys.isRotating) {
                // Rotate left (counter-clockwise) - positive angle
                keys.isRotating = true;
                keys.rotationStartTime = Date.now();
                keys.rotationStartAngle = player.rotation;
                keys.targetRotation = player.rotation + Math.PI/2; // 90 degrees
            }
            break;
        case 'd':
            // Only start rotation if not already rotating
            if (!keys.isRotating) {
                // Rotate right (clockwise) - negative angle
                keys.isRotating = true;
                keys.rotationStartTime = Date.now();
                keys.rotationStartAngle = player.rotation;
                keys.targetRotation = player.rotation - Math.PI/2; // 90 degrees
            }
            break;
        case 's':
            // S key stops movement (like touching the screen on mobile)
            keys.isStopped = true;
            break;
        case '2':
            // Key 2 loads level 3 (identical to level 1)
            if (!gameState.isTransitioning) {
                console.log('Loading Level 3 (identical to Level 1)');
                // Clear the current level
                clearMaze();
                // Load Level 3
                initLevel3(scene, maze, player, showLevelMessage);
                // Update game state
                gameState.currentLevel = 3;
            }
            break;
        case 'm':
            // M key toggles debug view
            isDebugView = !isDebugView;
            console.log('Debug view:', isDebugView ? 'ON' : 'OFF');
            
            // Update debug camera position to follow player's current position
            if (isDebugView) {
                debugCamera.position.set(player.position.x, 40, player.position.z);
                debugCamera.lookAt(player.position.x, 0, player.position.z);
            }
            break;
    }
}

// Handle keyup events
function handleKeyUp(event) {
    // We only need to handle S key release for auto-movement
    if (event.key.toLowerCase() === 's') {
        keys.isStopped = false;
    }
}

// Mobile-specific variables
let isMobile = false;
let isAutoMoving = false;
let isTouching = false;
let isRotating = false;
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let holdTimer = null;
let targetRotation = null;
let rotationStartTime = null;
let rotationStartAngle = null;
let lastHoldTime = 0;
let holdProcessed = false;

// Set up mobile gesture controls
function setupMobileControls() {
    // Only setup mobile controls on touch devices
    if (!('ontouchstart' in window)) return;
    
    // Set mobile detection flag
    isMobile = true;
    
    // Get control elements
    const gestureArea = document.getElementById('mobile-gesture-area');
    const mobileStatus = document.getElementById('mobile-status');
    const mobileControls = document.getElementById('mobile-controls');
    
    // Show mobile controls
    mobileControls.style.display = 'block';
    mobileStatus.style.display = 'block';
    
    // Enable auto-movement by default
    isAutoMoving = true;
    
    // Touch start - detect hold and initialize swipe
    gestureArea.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent default behaviors
        
        // Record touch start time and position for swipe detection
        touchStartTime = Date.now();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTouching = true;
        
        // Pause auto-movement when touching
        isAutoMoving = false;
        updateMobileStatus(mobileStatus);
        
        // Make sure any previous timer is cleared
        if (holdTimer) {
            clearTimeout(holdTimer);
        }
        
        // We no longer need the hold timer for toggling movement
        // as we'll always resume movement when touch ends
    });
    
    // Touch move - detect swipes
    gestureArea.addEventListener('touchmove', function(e) {
        e.preventDefault(); // Prevent scrolling
        
        if (!isTouching || isRotating) return;
        
        // If we've moved significantly, clear the hold timer
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > 10) { // Small threshold to differentiate between hold and swipe
            clearTimeout(holdTimer);
        }
        
        // Check for horizontal swipe
        if (Math.abs(dx) > CONFIG.MOBILE.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            // Clear the hold timer
            clearTimeout(holdTimer);
            
            // Start rotation
            isRotating = true;
            rotationStartTime = Date.now();
            rotationStartAngle = player.rotation;
            
            if (dx > 0) {
                // Swipe right - rotate right (clockwise) - negative angle in our system
                targetRotation = rotationStartAngle - CONFIG.MOBILE.ROTATION_ANGLE;
                mobileStatus.textContent = 'Rotating Right';
            } else {
                // Swipe left - rotate left (counter-clockwise) - positive angle in our system
                targetRotation = rotationStartAngle + CONFIG.MOBILE.ROTATION_ANGLE;
                mobileStatus.textContent = 'Rotating Left';
            }
            
            // Show the status briefly
            mobileStatus.style.opacity = '1';
        }
    });
    
    // Touch end - clean up
    gestureArea.addEventListener('touchend', function(e) {
        e.preventDefault();
        isTouching = false;
        
        // Clear any active timers
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
        
        // ALWAYS resume auto-movement when touch ends
        isAutoMoving = true;
        
        // Update status immediately and fade out
        updateMobileStatus(mobileStatus);
        setTimeout(() => {
            if (!isTouching) {
                updateMobileStatus(mobileStatus, 0.7);
            }
        }, 1000);
    });
    
    // Double tap handler removed
    
    // Update status with the global function
    // Function has been moved to global scope
}

// Helper function to update mobile status display
function updateMobileStatus(statusElement, opacity = 1) {
    if (!statusElement) return;
    
    if (isTouching) {
        statusElement.textContent = 'Holding - Release to Move';
        statusElement.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    } else if (isRotating) {
        // Keep existing rotating messages
    } else {
        statusElement.textContent = 'Auto-Moving (Touch to Stop)';
        statusElement.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
    }
    statusElement.style.opacity = opacity.toString();
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

// Show game message with fade effect
function showMessage(message, color = '#ffffff', duration = 3000) {
    const gameMessage = document.getElementById('game-message');
    
    // Set message content and color
    gameMessage.innerText = message;
    gameMessage.style.color = color;
    
    // For important messages, add a border
    if (color === '#ff4444' || color === '#ffca28') {
        gameMessage.style.border = `2px solid ${color}`;
    } else {
        gameMessage.style.border = 'none';
    }
    
    // Show the message
    gameMessage.style.opacity = '1';
    
    // Clear any existing timeout
    if (window.messageTimeout) {
        clearTimeout(window.messageTimeout);
    }
    
    // Fade out after the specified duration
    window.messageTimeout = setTimeout(() => {
        gameMessage.style.opacity = '0';
    }, duration);
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
    
    // Handle smooth rotation for both mobile and desktop
    if ((isMobile && isRotating && targetRotation !== null) || (!isMobile && keys.isRotating)) {
        // Get the correct variables based on device
        const rotationStartTimeValue = isMobile ? rotationStartTime : keys.rotationStartTime;
        const rotationStartAngleValue = isMobile ? rotationStartAngle : keys.rotationStartAngle;
        const targetRotationValue = isMobile ? targetRotation : keys.targetRotation;
        const duration = CONFIG.MOBILE.ROTATION_DURATION;
        
        // Calculate elapsed time since rotation started
        const elapsed = Date.now() - rotationStartTimeValue;
        
        // Calculate interpolation factor
        let t = Math.min(elapsed / duration, 1.0);
        
        // Apply smooth interpolation (ease in-out)
        t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
        // Interpolate rotation
        player.rotation = rotationStartAngleValue + (targetRotationValue - rotationStartAngleValue) * t;
        
        // Check if rotation is complete
        if (elapsed >= duration) {
            player.rotation = targetRotationValue;
            
            // Reset rotation flags for the appropriate device
            if (isMobile) {
                isRotating = false;
                targetRotation = null;
            } else {
                keys.isRotating = false;
                keys.targetRotation = null;
            }
        }
    }
    
    // Auto-movement for mobile (when not touching) or desktop (when not pressing S)
    // Also handle rotation state
    const shouldMove = (isMobile && !isTouching && !isRotating) || 
                      (!isMobile && !keys.isStopped && !keys.isRotating);
    
    // Handle player movement
    if (shouldMove) {
        // Determine speed based on device
        let moveSpeed = isMobile ? CONFIG.MOBILE.AUTO_MOVE_SPEED : player.speed;
        let directionMultiplier = 1; // Always forward by default
        
        // Calculate movement vector (negative for forward because of coordinate system)
        const moveX = -Math.sin(player.rotation) * moveSpeed * directionMultiplier;
        const moveZ = -Math.cos(player.rotation) * moveSpeed * directionMultiplier;
        
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
        } else if (isMobile && !isTouching) {
            // If we hit a wall, stop auto-movement momentarily
            isAutoMoving = false;
            
            // Update status indicator with collision message
            const mobileStatus = document.getElementById('mobile-status');
            if (mobileStatus) {
                mobileStatus.textContent = 'Blocked - Swipe Left/Right to Turn';
                mobileStatus.style.backgroundColor = 'rgba(255, 165, 0, 0.5)';
                mobileStatus.style.opacity = '1';
            }
            
            // Restart auto-movement after a short delay
            setTimeout(() => {
                isAutoMoving = true;
                
                // Update status indicator
                if (mobileStatus) {
                    updateMobileStatus(mobileStatus, 0.7);
                }
            }, 1500);
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
    
    // Tutorial zones for Level 1
    if (gameState.currentLevel === 1) {
        // Define the tutorial zone for the left turn - area leading up to the turn
        const turnTutorialZone = {
            minX: 0,
            maxX: 3,
            minZ: 0,
            maxZ: 5
        };
        
        // Check if player is in the turn tutorial zone
        if (player.position.x >= turnTutorialZone.minX && 
            player.position.x <= turnTutorialZone.maxX &&
            player.position.z >= turnTutorialZone.minZ && 
            player.position.z <= turnTutorialZone.maxZ && 
            !maze.hasShownTurnTutorial) {
            
            // Show the tutorial message about turning
            const controlText = isMobile ? "swipe left or right" : "press A (left) or D (right)";
            showMessage(`You'll need to turn soon! To rotate, ${controlText}.`, '#ffca28', 5000);
            
            // Set flag so we only show this once
            maze.hasShownTurnTutorial = true;
        }
        
        // Define the tutorial zone for spikes - area leading up to the spikes
        const spikeTutorialZone = {
            minX: 10,
            maxX: 14,
            minZ: -10,
            maxZ: -7
        };
        
        // Check if player is in the spike tutorial zone
        if (player.position.x >= spikeTutorialZone.minX && 
            player.position.x <= spikeTutorialZone.maxX &&
            player.position.z >= spikeTutorialZone.minZ && 
            player.position.z <= spikeTutorialZone.maxZ && 
            !maze.hasShownSpikeTutorial) {
            
            // Show the tutorial message about stopping
            const controlText = isMobile ? "tap and hold the screen" : "hold the S key";
            showMessage(`Dangerous spikes ahead! To stop moving, ${controlText}.`, '#ffca28', 5000);
            
            // Set flag so we only show this once
            maze.hasShownSpikeTutorial = true;
        }
        
        // Update spikes in level 1
        if (maze.spikeTrap) {
            maze.spikeTrap.update();
            
            // Check for player collision with spikes
            if (maze.spikeTrap.checkCollision(player.position) && player.canMove) {
                // Player has stepped on active spikes
                console.log('Player hit spikes!');
                
                // Play sound effect if available
                if (window.audioManager && window.audioManager.soundEffects.hurt) {
                    window.audioManager.playSoundEffect('hurt');
                }
                
                // Disable player movement temporarily
                player.canMove = false;
                
                // Show death popup
                const deathPopup = document.getElementById('death-popup');
                deathPopup.style.display = 'block';
                
                // Wait 2 seconds before hiding popup and resetting player
                setTimeout(() => {
                    // Hide popup
                    deathPopup.style.display = 'none';
                    
                    // Reset player to starting position
                    player.position = new THREE.Vector3(0, 0, 10);
                    player.rotation = 0;
                    player.canMove = true;
                    
                    // Show message
                    showMessage('Watch out for the spikes!', '#ff4444');
                }, 2000);
            }
        }
    }
    
    // Update debug information for mobile testing
    // Mobile debug info removed
    
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
