import * as BABYLON from 'babylonjs';

/**
 * Class representing a targeting system for a spacecraft
 */
export class TargetingSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Configuration
        this.maxTargetingRange = options.maxRange || 1000;
        this.maxTargets = options.maxTargets || 10;
        
        // State
        this.targets = [];
        this.currentTargetIndex = -1;
        this.currentTarget = null;
        this.targetLockTime = 0;
        this.targetLockRequired = options.targetLockTime || 1.0; // seconds to acquire lock
        
        // Visual elements
        this._initializeVisuals();
    }
    
    /**
     * Initializes the targeting visuals
     * @private
     */
    _initializeVisuals() {
        // Target indicator
        this.targetIndicator = BABYLON.MeshBuilder.CreateTorus("targetIndicator", {
            diameter: 5,
            thickness: 0.2,
            tessellation: 32
        }, this.scene);
        
        const indicatorMaterial = new BABYLON.StandardMaterial("targetIndicatorMaterial", this.scene);
        indicatorMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
        indicatorMaterial.alpha = 0.6;
        this.targetIndicator.material = indicatorMaterial;
        
        // Hide until target is selected
        this.targetIndicator.isVisible = false;
        
        // Set to rendering group that renders on top of regular objects
        this.targetIndicator.renderingGroupId = 1;
        
        // Animate the indicator
        const rotationAnimation = new BABYLON.Animation(
            "targetIndicatorAnimation",
            "rotation.z",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const rotationKeys = [];
        rotationKeys.push({ frame: 0, value: 0 });
        rotationKeys.push({ frame: 100, value: Math.PI * 2 });
        rotationAnimation.setKeys(rotationKeys);
        
        this.targetIndicator.animations = [rotationAnimation];
        this.scene.beginAnimation(this.targetIndicator, 0, 100, true);
        
        // Lock indicator
        this.lockIndicator = BABYLON.MeshBuilder.CreateTorus("lockIndicator", {
            diameter: 6,
            thickness: 0.3,
            tessellation: 32
        }, this.scene);
        
        const lockMaterial = new BABYLON.StandardMaterial("lockIndicatorMaterial", this.scene);
        lockMaterial.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2);
        lockMaterial.alpha = 0.7;
        this.lockIndicator.material = lockMaterial;
        
        // Hide until target is locked
        this.lockIndicator.isVisible = false;
        
        // Set to rendering group that renders on top of regular objects
        this.lockIndicator.renderingGroupId = 1;
    }
    
    /**
     * Updates the targeting system
     * @param {BABYLON.Vector3} observerPosition - Position of the observer
     * @param {BABYLON.Vector3} observerDirection - Direction the observer is facing
     * @param {Number} deltaTime - Time since last update
     */
    update(observerPosition, observerDirection, deltaTime) {
        // Update target data and sort by distance
        this._updateTargets(observerPosition, observerDirection);
        
        // Update current target if one is selected
        if (this.currentTargetIndex >= 0 && this.currentTargetIndex < this.targets.length) {
            const targetData = this.targets[this.currentTargetIndex];
            this.currentTarget = targetData.target;
            
            // Update targeting indicators
            this._updateIndicators(targetData);
            
            // Update target lock
            if (targetData.inFOV) {
                this.targetLockTime += deltaTime;
                if (this.targetLockTime >= this.targetLockRequired) {
                    // Target locked!
                    this.lockIndicator.isVisible = true;
                    
                    // Pulse animation once lock is achieved
                    this.lockIndicator.scaling = new BABYLON.Vector3(
                        1 + Math.sin(this.scene.getEngine().getFps() / 10) * 0.1,
                        1 + Math.sin(this.scene.getEngine().getFps() / 10) * 0.1,
                        1
                    );
                }
            } else {
                // Reset lock if target moves out of FOV
                this.targetLockTime = 0;
                this.lockIndicator.isVisible = false;
            }
        } else {
            // No valid target
            this.currentTarget = null;
            this.targetIndicator.isVisible = false;
            this.lockIndicator.isVisible = false;
            this.targetLockTime = 0;
        }
    }
    
    /**
     * Updates targeting indicators
     * @param {Object} targetData - Data about the current target
     * @private
     */
    _updateIndicators(targetData) {
        if (!targetData || !targetData.target) {
            this.targetIndicator.isVisible = false;
            this.lockIndicator.isVisible = false;
            return;
        }
        
        // Position indicators around target
        this.targetIndicator.position = targetData.target.position.clone();
        this.targetIndicator.isVisible = true;
        
        // Adjust indicator size based on distance (further = smaller)
        const baseSize = 1;
        const scaleFactor = Math.min(1.5, Math.max(0.5, 30 / targetData.distance));
        this.targetIndicator.scaling = new BABYLON.Vector3(
            baseSize * scaleFactor,
            baseSize * scaleFactor,
            1
        );
        
        // Position lock indicator
        this.lockIndicator.position = targetData.target.position.clone();
        
        // Update lock indicator scaling to match target indicator
        this.lockIndicator.scaling = new BABYLON.Vector3(
            baseSize * scaleFactor,
            baseSize * scaleFactor,
            1
        );
        
        // Set target indicator color based on target type
        const indicatorMaterial = this.targetIndicator.material;
        if (targetData.target.affiliation === 'enemy') {
            indicatorMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2); // Red for enemies
        } else if (targetData.target.affiliation === 'friendly') {
            indicatorMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1); // Blue for friendlies
        } else {
            indicatorMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0.2); // Yellow for neutral/unknown
        }
        
        // Billboard the indicators to face the camera
        const camera = this.scene.activeCamera;
        if (camera) {
            this.targetIndicator.lookAt(camera.position);
            this.lockIndicator.lookAt(camera.position);
        }
    }
    
    /**
     * Updates the list of potential targets
     * @param {BABYLON.Vector3} observerPosition - Position of the observer
     * @param {BABYLON.Vector3} observerDirection - Direction the observer is facing
     * @private
     */
    _updateTargets(observerPosition, observerDirection) {
        // Clear targets list
        this.targets = [];
        
        // Find all potential targets in the scene
        const potentialTargets = this.scene.meshes.filter(mesh => 
            mesh.metadata && 
            mesh.metadata.isTargetable && 
            !mesh.metadata.isProjectile
        );
        
        // Process each potential target
        potentialTargets.forEach(target => {
            // Calculate distance to target
            const toTarget = target.position.subtract(observerPosition);
            const distance = toTarget.length();
            
            // Skip if beyond max range
            if (distance > this.maxTargetingRange) return;
            
            // Calculate angle to target
            const direction = toTarget.normalize();
            const dot = BABYLON.Vector3.Dot(direction, observerDirection);
            const angleRad = Math.acos(dot);
            const angleDeg = angleRad * 180 / Math.PI;
            
            // Check if target is in front of observer (FOV check)
            const inFOV = angleDeg < 60; // 120 degree FOV
            
            // Add to targets list
            this.targets.push({
                target: target,
                distance: distance,
                direction: direction,
                angleDeg: angleDeg,
                inFOV: inFOV
            });
        });
        
        // Sort targets by distance
        this.targets.sort((a, b) => a.distance - b.distance);
        
        // Limit to maximum number of trackable targets
        if (this.targets.length > this.maxTargets) {
            this.targets = this.targets.slice(0, this.maxTargets);
        }
        
        // If current target is no longer in list, reset targeting
        if (this.currentTargetIndex >= 0) {
            const currentTargetStillValid = this.targets.some(
                t => t.target === this.currentTarget
            );
            
            if (!currentTargetStillValid) {
                this.currentTargetIndex = -1;
                this.currentTarget = null;
            }
        }
    }
    
    /**
     * Cycles to the next target
     * @returns {Object} The newly selected target or null
     */
    cycleNextTarget() {
        if (this.targets.length === 0) {
            this.currentTargetIndex = -1;
            this.currentTarget = null;
            this.targetLockTime = 0;
            return null;
        }
        
        this.currentTargetIndex = (this.currentTargetIndex + 1) % this.targets.length;
        this.currentTarget = this.targets[this.currentTargetIndex].target;
        this.targetLockTime = 0; // Reset lock when switching targets
        
        return this.currentTarget;
    }
    
    /**
     * Cycles to the previous target
     * @returns {Object} The newly selected target or null
     */
    cyclePreviousTarget() {
        if (this.targets.length === 0) {
            this.currentTargetIndex = -1;
            this.currentTarget = null;
            this.targetLockTime = 0;
            return null;
        }
        
        this.currentTargetIndex--;
        if (this.currentTargetIndex < 0) {
            this.currentTargetIndex = this.targets.length - 1;
        }
        
        this.currentTarget = this.targets[this.currentTargetIndex].target;
        this.targetLockTime = 0; // Reset lock when switching targets
        
        return this.currentTarget;
    }
    
    /**
     * Gets the current target
     * @returns {BABYLON.TransformNode} The current target or null
     */
    getCurrentTarget() {
        return this.currentTarget;
    }
    
    /**
     * Gets whether the current target is locked
     * @returns {Boolean} True if the target is locked
     */
    isTargetLocked() {
        return this.currentTarget !== null && this.targetLockTime >= this.targetLockRequired;
    }
    
    /**
     * Gets the lock progress as a value between 0 and 1
     * @returns {Number} Lock progress (0-1)
     */
    getTargetLockProgress() {
        if (!this.currentTarget) return 0;
        return Math.min(1, this.targetLockTime / this.targetLockRequired);
    }
    
    /**
     * Clears the current target
     */
    clearTarget() {
        this.currentTargetIndex = -1;
        this.currentTarget = null;
        this.targetLockTime = 0;
        this.targetIndicator.isVisible = false;
        this.lockIndicator.isVisible = false;
    }
    
    /**
     * Disposes of targeting system resources
     */
    dispose() {
        if (this.targetIndicator) {
            this.targetIndicator.dispose();
        }
        
        if (this.lockIndicator) {
            this.lockIndicator.dispose();
        }
    }
}

/**
 * Creates a targeting system for a spacecraft
 * @param {BABYLON.Scene} scene - The scene
 * @param {Object} options - Configuration options
 * @returns {TargetingSystem} A new targeting system
 */
export function createTargetingSystem(scene, options = {}) {
    return new TargetingSystem(scene, options);
}