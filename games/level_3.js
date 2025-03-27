// Level 3 code for the Triwizard Maze game
// This level is identical to Level 1

// Initialize Level 3
function initLevel3(scene, maze, player, showLevelMessage) {
    console.log('Initializing Level 3 (identical to Level 1)...');
    
    // Set sky color 
    scene.background = new THREE.Color(COLORS.SKY);
    
    // Show level 3 message
    if (typeof showLevelMessage === 'function') {
        showLevelMessage(3);
    }
    
    // Create maze for level 3 (identical to level 1)
    createLevel3Maze(scene, maze, COLORS.WALL);
    
    // Create the Triwizard Cup
    createLevel3Cup(scene, maze);
    
    // Reset player position to level 3 start (same as level 1)
    player.position.set(LEVEL1.PLAYER_START.x, LEVEL1.PLAYER_START.y, LEVEL1.PLAYER_START.z);
    player.rotation = 0;
}

// Create Level 3 maze (identical to Level 1)
function createLevel3Maze(scene, maze, wallMaterial) {
    // Create maze walls (simple straight path with walls on both sides)
    
    // Left wall
    createWall(scene, maze, 1, 3, 35, -3, 1.5, 0.5, wallMaterial); // Long wall on the left side
    
    // Right wall
    createWall(scene, maze, 1, 3, 23, 3, 1.5, 6.0, wallMaterial); // Long wall on the right side
    
    // Back wall (to prevent player from going backwards)
    createWall(scene, maze, 7, 3, 1, 0, 1.5, 18, wallMaterial); // Wall behind player's starting point
    
    // Add left turn wall
    createWall(scene, maze, 40, 3, 1, 5, 1.5, -11, wallMaterial); 

    // Add left turn wall 2
    createWall(scene, maze, 20, 3, 1, 12.5, 1.5, -6, wallMaterial); 

    // wall behind trophy
    createWall(scene, maze, 1, 3, 5, 23, 1.5, -8.5, wallMaterial); // Long wall on the right side
    
    // Add spike trap in level 3 path
    createLevel3Spikes(scene, maze, 1, 3, 5, 17, 1.5, -8.5);
}

// Helper function to create a wall for Level 3
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

// Helper function to create spike trap for Level 3
function createLevel3Spikes(scene, maze, width, height, depth, x, y, z) {
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

// Create the Triwizard Cup for Level 3
function createLevel3Cup(scene, maze) {
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
    if (!maze.particles) {
        maze.particles = [];
    }
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

// Export the init function
window.initLevel3 = initLevel3;
