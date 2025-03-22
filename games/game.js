// Game constants
const COLORS = {
    WALL: '#1b5e20',      // Dark green for maze walls
    FLOOR: '#558b2f',     // Muted green for ground/grass
    SKY: '#0d47a1',       // Dark blue/navy for night sky
    CUP: '#ffca28'        // Golden/yellow for Triwizard Cup
};

// Game variables
let scene, camera, renderer;
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
    clock: new THREE.Clock() // Clock for animations
};
let keys = {              // Track key presses
    up: false,
    left: false,
    right: false
};

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.SKY);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = player.height;

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

    // Create the maze
    createMaze();

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
function createMaze() {
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.FLOOR });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = 0;
    scene.add(floor);

    // Create maze walls (simple straight path with walls on both sides)
    const wallGeometry = new THREE.BoxGeometry(1, 3, 22); // Extended length to connect with back wall
    const wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.WALL });
    
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

    // Create a glowing Triwizard Cup with particles
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
    
    // Position the cup and add to scene
    cupGroup.position.set(0, 0.6, -9);
    maze.cup = cupGroup;
    scene.add(cupGroup);
    
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

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    if (distanceToCup < 1.5) {
        player.canMove = false;
        document.getElementById('win-popup').style.display = 'block';
    }
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
    renderer.render(scene, camera);
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
    renderer.render(scene, camera);
}

// Start the game
init();
