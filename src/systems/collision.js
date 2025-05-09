import * as BABYLON from 'babylonjs';

/**
 * Class representing a collision detection system
 */
export class CollisionSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Configuration
        this.usePhysicsEngine = options.usePhysicsEngine || false;
        this.debugColliders = options.debugColliders || false;
        
        // Entity collections
        this.entities = [];
        
        // Babylon physics engine configuration
        if (this.usePhysicsEngine) {
            // Create physics engine if not already created
            if (!scene.getPhysicsEngine()) {
                const gravity = new BABYLON.Vector3(0, 0, 0); // No gravity in space
                const physicsPlugin = new BABYLON.CannonJSPlugin();
                scene.enablePhysics(gravity, physicsPlugin);
            }
        }
    }
    
    /**
     * Adds an entity to the collision system
     * @param {Object} entity - Entity with position, collider info, and optional physics
     */
    addEntity(entity) {
        if (!entity || !entity.position) {
            console.warn('Cannot add entity without position to collision system');
            return;
        }
        
        // Initialize collider if not already present
        if (!entity.collider) {
            this._initializeCollider(entity);
        }
        
        // Add to entities list
        this.entities.push(entity);
    }
    
    /**
     * Removes an entity from the collision system
     * @param {Object} entity - The entity to remove
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
        
        // Clean up collider mesh
        if (entity.collider && entity.collider.mesh) {
            entity.collider.mesh.dispose();
        }
    }
    
    /**
     * Initializes a collider for an entity
     * @param {Object} entity - The entity to initialize collider for
     * @private
     */
    _initializeCollider(entity) {
        if (!entity) return;
        
        // Determine collider type from entity
        let colliderType = 'sphere';
        let colliderSize = 2;
        let colliderMass = 100; // Default mass in arbitrary units
        
        // Use specific collider info if provided
        if (entity.colliderInfo) {
            colliderType = entity.colliderInfo.type || colliderType;
            colliderSize = entity.colliderInfo.size || colliderSize;
            colliderMass = entity.colliderInfo.mass || colliderMass;
        } else {
            // Auto-calculate from mesh bounds
            const childMeshes = entity.getChildMeshes ? entity.getChildMeshes() : [];
            if (childMeshes.length > 0) {
                let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, minZ = Number.MAX_VALUE;
                let maxX = -Number.MAX_VALUE, maxY = -Number.MAX_VALUE, maxZ = -Number.MAX_VALUE;
                
                // Find bounding box
                childMeshes.forEach(mesh => {
                    const boundingInfo = mesh.getBoundingInfo();
                    const min = boundingInfo.minimum;
                    const max = boundingInfo.maximum;
                    
                    minX = Math.min(minX, min.x);
                    minY = Math.min(minY, min.y);
                    minZ = Math.min(minZ, min.z);
                    
                    maxX = Math.max(maxX, max.x);
                    maxY = Math.max(maxY, max.y);
                    maxZ = Math.max(maxZ, max.z);
                });
                
                // Use the largest dimension for sphere radius
                const width = maxX - minX;
                const height = maxY - minY;
                const depth = maxZ - minZ;
                colliderSize = Math.max(width, height, depth) / 2;
                
                // Estimate mass based on volume (assuming uniform density)
                const volume = width * height * depth;
                colliderMass = volume * 10; // Arbitrary density factor
            }
        }
        
        // Create collider object
        entity.collider = {
            type: colliderType,
            size: colliderSize,
            mass: colliderMass,
            restitution: entity.colliderInfo?.restitution || 0.3, // Bounciness
            friction: entity.colliderInfo?.friction || 0.1,       // Surface friction
            mesh: null,
            isColliding: false,
            lastCollision: null,
            collisionResponseEnabled: true // Whether this object responds to collisions
        };
        
        // Create debug visualization if enabled
        if (this.debugColliders) {
            let colliderMesh;
            
            switch (colliderType) {
                case 'sphere':
                    colliderMesh = BABYLON.MeshBuilder.CreateSphere("collider", {
                        diameter: colliderSize * 2,
                        segments: 16
                    }, this.scene);
                    break;
                case 'box':
                    colliderMesh = BABYLON.MeshBuilder.CreateBox("collider", {
                        width: colliderSize,
                        height: colliderSize,
                        depth: colliderSize
                    }, this.scene);
                    break;
                default:
                    colliderMesh = BABYLON.MeshBuilder.CreateSphere("collider", {
                        diameter: colliderSize * 2,
                        segments: 16
                    }, this.scene);
                    break;
            }
            
            // Configure collider mesh - make more visible for debugging
            const material = new BABYLON.StandardMaterial("colliderMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            material.specularColor = new BABYLON.Color3(0, 0, 0);
            material.emissiveColor = new BABYLON.Color3(0.5, 0, 0); // Add emissive color for better visibility
            material.alpha = 0.4; // Slightly more opaque
            material.wireframe = true;
            
            colliderMesh.material = material;
            colliderMesh.parent = entity;
            colliderMesh.position = new BABYLON.Vector3(0, 0, 0);
            colliderMesh.isPickable = false;
            
            entity.collider.mesh = colliderMesh;
        }
        
        // Add physics impostor if using physics engine
        if (this.usePhysicsEngine) {
            let impostor;
            
            switch (colliderType) {
                case 'sphere':
                    impostor = new BABYLON.PhysicsImpostor(
                        entity, 
                        BABYLON.PhysicsImpostor.SphereImpostor, 
                        { mass: 1, restitution: 0.2, friction: 0.1 }, 
                        this.scene
                    );
                    break;
                case 'box':
                    impostor = new BABYLON.PhysicsImpostor(
                        entity, 
                        BABYLON.PhysicsImpostor.BoxImpostor, 
                        { mass: 1, restitution: 0.2, friction: 0.1 }, 
                        this.scene
                    );
                    break;
                default:
                    impostor = new BABYLON.PhysicsImpostor(
                        entity, 
                        BABYLON.PhysicsImpostor.SphereImpostor, 
                        { mass: 1, restitution: 0.2, friction: 0.1 }, 
                        this.scene
                    );
                    break;
            }
            
            entity.physicsImpostor = impostor;
        }
    }
    
    /**
     * Updates the collision system, checking for collisions
     * @param {Number} deltaTime - Time since last update
     * @returns {Array} Array of collision events
     */
    update(deltaTime) {
        const collisions = [];
        
        // Skip if using physics engine (it handles collisions automatically)
        if (this.usePhysicsEngine) {
            return collisions;
        }
        
        // Debug logging - log collision checks every 2 seconds
        this._debugTimer = (this._debugTimer || 0) + deltaTime;
        const shouldLogDebug = this.debugColliders && this._debugTimer > 2;
        if (shouldLogDebug) {
            console.log(`Collision system checking ${this.entities.length} entities`);
            this._debugTimer = 0;
        }
        
        // Enhanced sphere-to-sphere collision check with physics response
        for (let i = 0; i < this.entities.length; i++) {
            const entityA = this.entities[i];
            
            // Update collider position if entity moved
            if (entityA.collider && entityA.collider.mesh) {
                entityA.collider.mesh.position = new BABYLON.Vector3(0, 0, 0);
            }
            
            // Skip entities without colliders
            if (!entityA.collider) continue;
            
            // Reset collision flag
            entityA.collider.isColliding = false;
            
            // Check collisions with other entities
            for (let j = i + 1; j < this.entities.length; j++) {
                const entityB = this.entities[j];
                
                // Skip entities without colliders
                if (!entityB.collider) continue;
                
                // Check if entities should collide based on affiliation
                // Player (confederation) should collide with enemies and buildings
                // Enemy ships should collide with player ships and buildings
                // Buildings should collide with all entities
                // But ships of the same side shouldn't collide with each other
                
                // Check if either entity is a building
                const entityAIsBuilding = entityA.type === 'building' || entityA.affiliation === 'structure';
                const entityBIsBuilding = entityB.type === 'building' || entityB.affiliation === 'structure';
                
                // If either entity is a building, allow collision
                if (entityAIsBuilding || entityBIsBuilding) {
                    // Buildings should collide with everything
                } else {
                    // Apply normal friendly collision skipping for non-building entities
                    const isFriendlyCollision = (
                        // Both friendly (confederation or friendly)
                        ((entityA.affiliation === 'confederation' || entityA.affiliation === 'friendly') &&
                         (entityB.affiliation === 'confederation' || entityB.affiliation === 'friendly')) ||
                        // Both enemies
                        (entityA.affiliation === 'enemy' && entityB.affiliation === 'enemy')
                    );
                    
                    // Skip collision detection between friendly entities
                    if (isFriendlyCollision) continue;
                }
                
                // Calculate distance between entities
                const distance = BABYLON.Vector3.Distance(
                    entityA.position,
                    entityB.position
                );
                
                // Collision occurs when distance is less than sum of collider sizes
                const combinedSize = entityA.collider.size + entityB.collider.size;
                if (distance < combinedSize) {
                    // Calculate collision normal (from A to B)
                    const normal = entityB.position.subtract(entityA.position).normalize();
                    
                    // Calculate collision point (on the surface of object A)
                    const collisionPoint = entityA.position.add(
                        normal.scale(entityA.collider.size)
                    );
                    
                    // Calculate penetration depth
                    const penetration = combinedSize - distance;
                    
                    // Create collision event with enhanced physics data
                    const collision = {
                        entityA: entityA,
                        entityB: entityB,
                        point: collisionPoint,
                        normal: normal,
                        penetration: penetration,
                        relativeVelocity: null, // Will be set if physics available
                        impulse: 0,            // Will be calculated below
                        time: Date.now()
                    };
                    
                    // Extract physics info if available
                    if (entityA.physics && entityB.physics) {
                        // Calculate relative velocity
                        const relativeVelocity = (entityB.physics.velocity || new BABYLON.Vector3(0, 0, 0))
                            .subtract(entityA.physics.velocity || new BABYLON.Vector3(0, 0, 0));
                        
                        // Project relative velocity onto collision normal
                        const velocityAlongNormal = BABYLON.Vector3.Dot(relativeVelocity, normal);
                        
                        // Store for collision event
                        collision.relativeVelocity = relativeVelocity;
                        
                        // Only resolve collision if objects are moving toward each other
                        if (velocityAlongNormal < 0 && 
                            (entityA.collider.collisionResponseEnabled || entityB.collider.collisionResponseEnabled)) {
                            
                            // Calculate restitution (bounciness)
                            const restitution = Math.min(
                                entityA.collider.restitution || 0.3,
                                entityB.collider.restitution || 0.3
                            );
                            
                            // Calculate inverse masses (handles infinite mass objects)
                            const massA = entityA.collider.mass || 100;
                            const massB = entityB.collider.mass || 100;
                            
                            const invMassA = massA === Infinity ? 0 : 1 / massA;
                            const invMassB = massB === Infinity ? 0 : 1 / massB;
                            
                            // If both objects have infinite mass, skip collision response
                            if (invMassA === 0 && invMassB === 0) continue;
                            
                            // Calculate impulse scalar
                            const j = -(1 + restitution) * velocityAlongNormal / (invMassA + invMassB);
                            collision.impulse = j;
                            
                            // Apply impulse if physics enabled for these entities
                            if (entityA.physics && entityA.physics.velocity && entityA.collider.collisionResponseEnabled) {
                                const impulseA = normal.scale(-j * invMassA);
                                entityA.physics.velocity.addInPlace(impulseA);
                            }
                            
                            if (entityB.physics && entityB.physics.velocity && entityB.collider.collisionResponseEnabled) {
                                const impulseB = normal.scale(j * invMassB);
                                entityB.physics.velocity.addInPlace(impulseB);
                            }
                            
                            // Resolve penetration (positional correction to prevent sinking)
                            const percent = 0.8; // penetration correction factor (0-1)
                            const slop = 0.01;   // small slop value to prevent jitter
                            
                            if (penetration > slop && 
                                (entityA.collider.collisionResponseEnabled || entityB.collider.collisionResponseEnabled)) {
                                
                                const correction = normal.scale(
                                    (Math.max(penetration - slop, 0) * percent) / (invMassA + invMassB)
                                );
                                
                                // Apply position correction
                                if (entityA.collider.collisionResponseEnabled && invMassA > 0) {
                                    entityA.position.subtractInPlace(correction.scale(invMassA));
                                }
                                
                                if (entityB.collider.collisionResponseEnabled && invMassB > 0) {
                                    entityB.position.addInPlace(correction.scale(invMassB));
                                }
                            }
                        }
                    }
                    
                    // Set collision flags
                    entityA.collider.isColliding = true;
                    entityB.collider.isColliding = true;
                    entityA.collider.lastCollision = collision;
                    entityB.collider.lastCollision = collision;
                    
                    // Add to collisions list
                    collisions.push(collision);
                    
                    // Debug logging if enabled
                    if (shouldLogDebug) {
                        console.log(`Collision detected: ${entityA.type || 'unknown'} (${entityA.affiliation || 'unknown'}) with ${entityB.type || 'unknown'} (${entityB.affiliation || 'unknown'})`);
                        console.log(`  Distance: ${distance.toFixed(2)}, Combined size: ${combinedSize.toFixed(2)}, Penetration: ${penetration.toFixed(2)}`);
                        if (collision.impulse) {
                            console.log(`  Impulse: ${collision.impulse.toFixed(2)}`);
                        }
                    }
                    
                    // Update collider visualization with brighter colors for debug
                    if (this.debugColliders) {
                        if (entityA.collider.mesh) {
                            entityA.collider.mesh.material.alpha = 0.8;
                            entityA.collider.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
                            entityA.collider.mesh.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0);
                            // Make wireframe more visible
                            entityA.collider.mesh.material.wireframe = false;
                        }
                        if (entityB.collider.mesh) {
                            entityB.collider.mesh.material.alpha = 0.8;
                            entityB.collider.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
                            entityB.collider.mesh.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0);
                            // Make wireframe more visible
                            entityB.collider.mesh.material.wireframe = false;
                        }
                    }
                } else {
                    // Reset collider visualization if not colliding
                    if (this.debugColliders) {
                        if (entityA.collider.mesh && !entityA.collider.isColliding) {
                            entityA.collider.mesh.material.alpha = 0.4;
                            entityA.collider.mesh.material.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
                            entityA.collider.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
                            entityA.collider.mesh.material.wireframe = true;
                        }
                        if (entityB.collider.mesh && !entityB.collider.isColliding) {
                            entityB.collider.mesh.material.alpha = 0.4;
                            entityB.collider.mesh.material.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
                            entityB.collider.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
                            entityB.collider.mesh.material.wireframe = true;
                        }
                    }
                }
            }
        }
        
        return collisions;
    }
    
    /**
     * Gets all collisions involving a specific entity
     * @param {Object} entity - The entity to check collisions for
     * @returns {Array} Array of collision events involving this entity
     */
    getCollisionsForEntity(entity) {
        // Return empty array if entity is not in the system
        if (!entity || !this.entities.includes(entity)) {
            return [];
        }
        
        const entityCollisions = [];
        
        // If using physics engine, get collisions from the physics impostor
        if (this.usePhysicsEngine && entity.physicsImpostor) {
            return entity.physicsImpostor.getCollisionsWithImpostors();
        }
        
        // Otherwise, check each entity for collisions with this one
        for (let i = 0; i < this.entities.length; i++) {
            const otherEntity = this.entities[i];
            
            // Skip the entity itself and entities without colliders
            if (otherEntity === entity || !otherEntity.collider || !entity.collider) continue;
            
            // Check if entities should collide based on affiliation
            // Player (confederation) should collide with enemies and buildings
            // Enemy ships should collide with player ships and buildings
            // Buildings should collide with all entities
            // But ships of the same side shouldn't collide with each other
            
            // Check if either entity is a building
            const entityIsBuilding = entity.type === 'building' || entity.affiliation === 'structure';
            const otherEntityIsBuilding = otherEntity.type === 'building' || otherEntity.affiliation === 'structure';
            
            // If either entity is a building, allow collision
            if (entityIsBuilding || otherEntityIsBuilding) {
                // Buildings should collide with everything
            } else {
                // Apply normal friendly collision skipping for non-building entities
                const isFriendlyCollision = (
                    // Both friendly (confederation or friendly)
                    ((entity.affiliation === 'confederation' || entity.affiliation === 'friendly') &&
                     (otherEntity.affiliation === 'confederation' || otherEntity.affiliation === 'friendly')) ||
                    // Both enemies
                    (entity.affiliation === 'enemy' && otherEntity.affiliation === 'enemy')
                );
                
                // Skip collision detection between friendly entities
                if (isFriendlyCollision) continue;
            }
            
            // Calculate distance
            const distance = BABYLON.Vector3.Distance(
                entity.position,
                otherEntity.position
            );
            
            // Check if collision occurred
            const combinedSize = entity.collider.size + otherEntity.collider.size;
            if (distance < combinedSize) {
                // Create collision event
                const collision = {
                    entityA: entity,
                    entityB: otherEntity,
                    point: entity.position.add(
                        otherEntity.position.subtract(entity.position)
                            .normalize()
                            .scale(entity.collider.size)
                    ),
                    normal: otherEntity.position.subtract(entity.position).normalize(),
                    penetration: combinedSize - distance
                };
                
                entityCollisions.push(collision);
            }
        }
        
        return entityCollisions;
    }
    
    /**
     * Disposes of collision system resources
     */
    dispose() {
        // Dispose of debug colliders
        this.entities.forEach(entity => {
            if (entity.collider && entity.collider.mesh) {
                entity.collider.mesh.dispose();
            }
        });
        
        this.entities = [];
    }
}

/**
 * Creates a collision system
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} options - Configuration options
 * @returns {CollisionSystem} A new collision system
 */
export function createCollisionSystem(scene, options = {}) {
    return new CollisionSystem(scene, options);
}