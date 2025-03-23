// Game constants
const COLORS = {
    WALL: '#1b5e20',      // Dark green for maze walls
    FLOOR: '#558b2f',     // Muted green for ground/grass
    SKY: '#0d47a1',       // Dark blue/navy for night sky
    CUP: '#ffca28'        // Golden/yellow for Triwizard Cup
};

// Game variables
let scene, camera, debugCamera, renderer;
let isDebugView = false; // Flag to track if we're in debug view
let gameState = {
    currentLevel: 1,      // Current game level
    maxLevel: 2,          // Maximum available level
    isTransitioning: false // Flag for level transition animations
};
let player = {
    height: 1.8,          // Player height in units
    speed: 0.1,           // Player movement speed
    turnSpeed: 0.03,      // Player rotation speed
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
    left: false,
    right: false
};
// Global audio controller
let audio = {             // Audio elements
    backgroundMusic: null,  // Background music
    originalRate: 1.0     // Original playback rate
};

// Export audio control functions to window object so they can be accessed from any JS file
window.audioController = {
    speedUp: function(rate) {
        if (audio && audio.backgroundMusic) {
            // Store original rate if not already stored
            if (!audio.originalRate) {
                audio.originalRate = audio.backgroundMusic.playbackRate || 1.0;
            }
            audio.backgroundMusic.playbackRate = rate;
            return true;
        }
        return false;
    },
    reset: function() {
        if (audio && audio.backgroundMusic) {
            audio.backgroundMusic.playbackRate = audio.originalRate || 1.0;
            return true;
        }
        return false;
    },
    getCurrentRate: function() {
        if (audio && audio.backgroundMusic) {
            return audio.backgroundMusic.playbackRate;
        }
        return 1.0;
    }
};

// Initialize the game
function init() {
    // Set up background music
    setupBackgroundMusic();
    
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
    const wallGeometry = new THREE.BoxGeometry(1, 3, 22); // Extended length to connect with back wall
    
    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-3, 1.5, 0.5); // Adjusted position to fill gap
    scene.add(leftWall);
    maze.walls.push({
        mesh: leftWall,
        min: new THREE.Vector3(-3.5, 0, -10.5),
        max: new THREE.Vector3(-2.5, 3, 11.5)
    });
    
    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(3, 1.5, 0.5); // Adjusted position to fill gap
    scene.add(rightWall);
    maze.walls.push({
        mesh: rightWall,
        min: new THREE.Vector3(2.5, 0, -10.5),
        max: new THREE.Vector3(3.5, 3, 11.5)
    });
    
    // Back wall (to prevent player from going backwards)
    const backWallGeometry = new THREE.BoxGeometry(7, 3, 1);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 1.5, 11); // Position it just behind the player's starting point
    scene.add(backWall);
    maze.walls.push({
        mesh: backWall,
        min: new THREE.Vector3(-3.5, 0, 10.5),
        max: new THREE.Vector3(3.5, 3, 11.5)
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
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
    }
}

// Set up mobile touch controls
function setupMobileControls() {
    const forwardBtn = document.getElementById('forward-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    // Forward button
    forwardBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        keys.up = true;
    });
    forwardBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        keys.up = false;
    });
    
    // Left button
    leftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        keys.left = true;
    });
    leftBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        keys.left = false;
    });
    
    // Right button
    rightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        keys.right = true;
    });
    rightBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        keys.right = false;
    });
    
    // Also add mouse events for testing on desktop
    forwardBtn.addEventListener('mousedown', function() { keys.up = true; });
    forwardBtn.addEventListener('mouseup', function() { keys.up = false; });
    leftBtn.addEventListener('mousedown', function() { keys.left = true; });
    leftBtn.addEventListener('mouseup', function() { keys.left = false; });
    rightBtn.addEventListener('mousedown', function() { keys.right = true; });
    rightBtn.addEventListener('mouseup', function() { keys.right = false; });
}

// Check if player has reached the Triwizard Cup
function checkWinCondition() {
    const distanceToCup = player.position.distanceTo(maze.cup.position);
    if (distanceToCup < 1.5 && !gameState.isTransitioning) {
        player.canMove = false;
        
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
    
    // Update text if level is not 1
    if (level > 1) {
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
    
    // Move player forward
    if (keys.up) {
        const moveX = -Math.sin(player.rotation) * player.speed;
        const moveZ = -Math.cos(player.rotation) * player.speed;
        
        // Log movement values for debugging
        // console.log(`Movement: rotation=${player.rotation.toFixed(4)}, moveX=${moveX.toFixed(4)}, moveZ=${moveZ.toFixed(4)}`);
        
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

// Setup background music
function setupBackgroundMusic() {
    // Create audio element
    audio.backgroundMusic = new Audio('Whispers in the Hall.mp3');
    audio.backgroundMusic.loop = true;
    audio.backgroundMusic.volume = 0.6; // Set to 60% volume
    audio.backgroundMusic.defaultPlaybackRate = 1.0; // Store default rate
    
    // Try to autoplay immediately
    const playPromise = audio.backgroundMusic.play();
    
    // Handle autoplay blocking (common in modern browsers)
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log('Autoplay prevented by browser, using touch and interaction events as fallback');
            
            // For mobile: add touch event listeners for first interaction
            const startAudio = () => {
                audio.backgroundMusic.play();
                // Remove all event listeners after first successful play
                document.removeEventListener('touchstart', startAudio);
                document.removeEventListener('touchend', startAudio);
                document.removeEventListener('click', startAudio);
                document.removeEventListener('keydown', startAudio);
            };
            
            // Add multiple event listeners to catch any type of interaction
            document.addEventListener('touchstart', startAudio, { once: true });
            document.addEventListener('touchend', startAudio, { once: true });
            document.addEventListener('click', startAudio, { once: true });
            document.addEventListener('keydown', startAudio, { once: true });
        });
    }
    
    // Add global functions to control music speed with extensive logging
    window.speedUpBackgroundMusic = function(rate) {
        console.log('DEBUG: speedUpBackgroundMusic called with rate:', rate);
        console.log('DEBUG: audio object exists:', !!audio);
        
        if (audio) {
            console.log('DEBUG: audio contents:', Object.keys(audio));
            console.log('DEBUG: backgroundMusic exists:', !!audio.backgroundMusic);
        }
        
        if (audio && audio.backgroundMusic) {
            console.log('DEBUG: Current audio element:', audio.backgroundMusic);
            console.log('DEBUG: Current playbackRate before change:', audio.backgroundMusic.playbackRate);
            console.log('DEBUG: playbackRate property descriptor:', 
                         Object.getOwnPropertyDescriptor(audio.backgroundMusic, 'playbackRate'));
            
            try {
                // Store original rate if not already stored
                if (!audio.backgroundMusic.hasOwnProperty('originalRate')) {
                    audio.backgroundMusic.originalRate = audio.backgroundMusic.playbackRate || 1.0;
                    console.log('DEBUG: Stored original rate:', audio.backgroundMusic.originalRate);
                } else {
                    console.log('DEBUG: Original rate already stored:', audio.backgroundMusic.originalRate);
                }
                
                // Set new rate
                console.log('DEBUG: Attempting to set playbackRate to:', rate);
                audio.backgroundMusic.playbackRate = rate;
                
                // Verify the change
                console.log('DEBUG: PlaybackRate after change attempt:', audio.backgroundMusic.playbackRate);
                console.log('DEBUG: Is rate changed?', audio.backgroundMusic.playbackRate === rate);
                
                // Try alternative method if the first method didn't work
                if (audio.backgroundMusic.playbackRate !== rate) {
                    console.log('DEBUG: First attempt failed, trying alternative method');
                    Object.defineProperty(audio.backgroundMusic, 'playbackRate', {
                        value: rate,
                        writable: true
                    });
                    console.log('DEBUG: PlaybackRate after second attempt:', audio.backgroundMusic.playbackRate);
                }
                
                return true;
            } catch (error) {
                console.error('DEBUG: Error changing music speed:', error);
                console.error('DEBUG: Error details:', error.stack);
                return false;
            }
        } else {
            console.log('DEBUG: Audio or backgroundMusic not available');
            return false;
        }
    };
    
    window.resetBackgroundMusicSpeed = function() {
        console.log('DEBUG: resetBackgroundMusicSpeed called');
        
        if (audio && audio.backgroundMusic) {
            try {
                const originalRate = audio.backgroundMusic.originalRate || 1.0;
                console.log('DEBUG: Attempting to reset to original rate:', originalRate);
                
                audio.backgroundMusic.playbackRate = originalRate;
                console.log('DEBUG: PlaybackRate after reset attempt:', audio.backgroundMusic.playbackRate);
                console.log('DEBUG: Is rate reset?', audio.backgroundMusic.playbackRate === originalRate);
                
                return true;
            } catch (error) {
                console.error('DEBUG: Error resetting music speed:', error);
                console.error('DEBUG: Error details:', error.stack);
                return false;
            }
        } else {
            console.log('DEBUG: Audio or backgroundMusic not available for reset');
            return false;
        }
    };
}

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

// Start the game
init();
