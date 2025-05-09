import * as BABYLON from 'babylonjs';

// Weapon types and their properties
const WEAPON_TYPES = {
    LASER: {
        name: 'Laser Cannon',
        damage: 5,
        range: 300,
        speed: 300,
        energyCost: 5,
        cooldown: 0.2,
        color: new BABYLON.Color3(1, 0.2, 0.2), // Red
        projectileSize: 0.1,
        sound: 'laser.wav',
        hitSound: 'laserHit.wav'
    },
    NEUTRON: {
        name: 'Neutron Gun',
        damage: 15,
        range: 200,
        speed: 250,
        energyCost: 10,
        cooldown: 0.4,
        color: new BABYLON.Color3(0.2, 1, 0.2), // Green
        projectileSize: 0.15,
        sound: 'neutron.wav',
        hitSound: 'neutronHit.wav'
    },
    ION: {
        name: 'Ion Cannon',
        damage: 3,
        range: 350,
        speed: 400,
        energyCost: 3,
        cooldown: 0.1,
        color: new BABYLON.Color3(0.2, 0.2, 1), // Blue
        projectileSize: 0.08,
        sound: 'ion.wav',
        hitSound: 'ionHit.wav'
    },
    MASS: {
        name: 'Mass Driver',
        damage: 25,
        range: 400,
        speed: 200,
        energyCost: 3,
        cooldown: 0.5,
        color: new BABYLON.Color3(1, 1, 0.2), // Yellow
        projectileSize: 0.2,
        sound: 'mass.wav',
        hitSound: 'massHit.wav'
    }
};

/**
 * Class representing a weapons system on a spacecraft
 */
export class WeaponSystem {
    constructor(scene, parentMesh, options = {}) {
        this.scene = scene;
        this.parentMesh = parentMesh;
        
        // Weapon hardpoints (positions and orientations)
        this.hardpoints = options.hardpoints || [
            { position: new BABYLON.Vector3(-1, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) },
            { position: new BABYLON.Vector3(1, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) }
        ];
        
        // Available weapons on the ship
        this.availableWeapons = options.weapons || [
            WEAPON_TYPES.LASER, 
            WEAPON_TYPES.NEUTRON,
            WEAPON_TYPES.ION,
            WEAPON_TYPES.MASS
        ];
        
        // Currently selected weapon
        this.currentWeaponIndex = 0;
        
        // Weapon state
        this.cooldownRemaining = 0;
        this.nextFireHardpoint = 0;
        
        // Active projectiles
        this.projectiles = [];
    }
    
    /**
     * Updates the weapon system
     * @param {Number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update cooldown
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining -= deltaTime;
        }
        
        // Update all active projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.position.addInPlace(
                projectile.direction.scale(projectile.speed * deltaTime)
            );
            
            // Check range
            projectile.distanceTraveled += projectile.speed * deltaTime;
            if (projectile.distanceTraveled >= projectile.range) {
                // Dispose projectile if it exceeds range
                projectile.mesh.dispose();
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    /**
     * Gets the currently selected weapon
     * @returns {Object} The current weapon
     */
    getCurrentWeapon() {
        return this.availableWeapons[this.currentWeaponIndex];
    }
    
    /**
     * Cycles to the next weapon
     */
    cycleWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.availableWeapons.length;
    }
    
    /**
     * Attempts to fire the current weapon
     * @param {Number} energy - Current energy level of the ship
     * @returns {Object} Result of the firing attempt { success, energyCost, error }
     */
    fire(energy) {
        const weapon = this.getCurrentWeapon();
        
        // Check cooldown
        if (this.cooldownRemaining > 0) {
            return { 
                success: false, 
                energyCost: 0, 
                error: 'Weapon is cooling down' 
            };
        }
        
        // Check energy
        if (energy < weapon.energyCost) {
            return { 
                success: false, 
                energyCost: 0, 
                error: 'Not enough energy' 
            };
        }
        
        // Fire weapon
        this._createProjectile(weapon);
        
        // Reset cooldown
        this.cooldownRemaining = weapon.cooldown;
        
        // Advance to next hardpoint for next shot
        this.nextFireHardpoint = (this.nextFireHardpoint + 1) % this.hardpoints.length;
        
        return { 
            success: true, 
            energyCost: weapon.energyCost,
            error: null
        };
    }
    
    /**
     * Creates a projectile for the weapon
     * @param {Object} weapon - The weapon definition
     * @private
     */
    _createProjectile(weapon) {
        // Get hardpoint to fire from
        const hardpoint = this.hardpoints[this.nextFireHardpoint];
        
        // Create projectile mesh
        const projectileMesh = BABYLON.MeshBuilder.CreateSphere('projectile', {
            diameter: weapon.projectileSize * 2,
            segments: 8
        }, this.scene);
        
        // Get world position and direction for the hardpoint
        const worldMatrix = this.parentMesh.getWorldMatrix();
        const worldPosition = BABYLON.Vector3.TransformCoordinates(
            hardpoint.position,
            worldMatrix
        );
        const worldDirection = BABYLON.Vector3.TransformNormal(
            hardpoint.direction,
            worldMatrix
        ).normalize();
        
        // Position projectile at hardpoint position
        projectileMesh.position = worldPosition;
        
        // Create material for projectile
        const material = new BABYLON.StandardMaterial('projectileMaterial', this.scene);
        material.emissiveColor = weapon.color;
        material.diffuseColor = weapon.color;
        material.specularColor = new BABYLON.Color3(1, 1, 1);
        material.alpha = 0.7;
        
        // Apply material to projectile
        projectileMesh.material = material;
        
        // Add glow layer if not already created
        let glowLayer = this.scene.getGlowLayerByName('weaponGlow');
        if (!glowLayer) {
            glowLayer = new BABYLON.GlowLayer('weaponGlow', this.scene);
            glowLayer.intensity = 0.5;
        }
        glowLayer.addIncludedOnlyMesh(projectileMesh);
        
        // Create trail for projectile
        const trail = new BABYLON.TrailMesh('trail', projectileMesh, this.scene, 0.05, 30, true);
        const trailMaterial = new BABYLON.StandardMaterial('trailMaterial', this.scene);
        trailMaterial.emissiveColor = weapon.color;
        trailMaterial.diffuseColor = weapon.color;
        trailMaterial.alpha = 0.3;
        trailMaterial.backFaceCulling = false;
        trail.material = trailMaterial;
        
        // Create projectile object
        const projectile = {
            mesh: projectileMesh,
            trail: trail,
            position: projectileMesh.position,
            direction: worldDirection,
            speed: weapon.speed,
            damage: weapon.damage,
            range: weapon.range,
            distanceTraveled: 0,
            weapon: weapon
        };
        
        // Add to active projectiles
        this.projectiles.push(projectile);
        
        return projectile;
    }
    
    /**
     * Checks if a projectile hit a target
     * @param {BABYLON.Mesh} target - The target mesh
     * @param {Function} onHit - Callback for when a hit occurs
     */
    checkHits(target) {
        if (!target) return { hit: false };
        if (!target.position) return { hit: false };
        
        // Check if target has a spacecraft property (enemies are often wrapped objects)
        const targetMesh = target.spacecraft || target;
        const center = target.position;
        
        // Determine radius for hit detection
        let radius = 5; // Default fallback radius
        
        // Try to get more accurate radius if bounding info is available
        if (targetMesh.getBoundingInfo) {
            try {
                const boundingInfo = targetMesh.getBoundingInfo();
                if (boundingInfo && boundingInfo.boundingBox) {
                    const extent = boundingInfo.boundingBox.extendSize;
                    radius = Math.max(extent.x, extent.y, extent.z) * 1.5; // Use a slightly larger radius for better hit detection
                }
            } catch (e) {
                console.log("Unable to get bounding info, using default radius");
                // Use default radius
            }
        }
        
        // Check each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Skip if projectile is from the same parent
            if (targetMesh === this.parentMesh) continue;
            
            // Simple sphere intersection test
            const distance = BABYLON.Vector3.Distance(projectile.position, center);
            if (distance < radius) {
                // Hit!
                return {
                    hit: true,
                    projectile: projectile,
                    hitPoint: projectile.position.clone(),
                    damage: projectile.damage
                };
            }
        }
        
        return { hit: false };
    }
    
    /**
     * Removes a projectile from the scene
     * @param {Object} projectile - The projectile to remove
     */
    removeProjectile(projectile) {
        // Remove from projectiles array
        const index = this.projectiles.indexOf(projectile);
        if (index !== -1) {
            this.projectiles.splice(index, 1);
        }
        
        // Dispose of meshes
        if (projectile.trail) {
            projectile.trail.dispose();
        }
        
        if (projectile.mesh) {
            projectile.mesh.dispose();
        }
    }
    
    /**
     * Disposes of all resources used by the weapon system
     */
    dispose() {
        // Dispose of all projectiles
        this.projectiles.forEach(projectile => {
            if (projectile.trail) {
                projectile.trail.dispose();
            }
            if (projectile.mesh) {
                projectile.mesh.dispose();
            }
        });
        
        this.projectiles = [];
    }
}

/**
 * Creates a weapon system for a spacecraft
 * @param {BABYLON.Scene} scene - The scene
 * @param {BABYLON.Mesh} parentMesh - The parent spacecraft mesh
 * @param {Object} options - Configuration options
 * @returns {WeaponSystem} A new weapon system
 */
export function createWeaponSystem(scene, parentMesh, options = {}) {
    return new WeaponSystem(scene, parentMesh, options);
}