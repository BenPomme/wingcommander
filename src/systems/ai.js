import * as BABYLON from 'babylonjs';

// AI behavior states
const AI_STATE = {
    IDLE: 'idle',
    PATROL: 'patrol',
    PURSUE: 'pursue',
    ATTACK: 'attack',
    EVADE: 'evade',
    FLEE: 'flee',
    ESCORT: 'escort',
    DAMAGED: 'damaged'
};

// AI difficulty levels
const AI_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    ACE: 'ace'
};

// AI pilot personalities
const AI_PERSONALITY = {
    AGGRESSIVE: 'aggressive',
    DEFENSIVE: 'defensive',
    BALANCED: 'balanced',
    CAUTIOUS: 'cautious',
    RECKLESS: 'reckless'
};

/**
 * Class representing an AI controller for a spacecraft
 */
export class AIController {
    constructor(scene, spacecraft, physics, options = {}) {
        this.scene = scene;
        this.spacecraft = spacecraft;
        this.physics = physics;
        
        // Configuration
        this.difficulty = options.difficulty || AI_DIFFICULTY.MEDIUM;
        this.personality = options.personality || AI_PERSONALITY.BALANCED;
        this.team = options.team || 'enemy';
        
        // State
        this.currentState = AI_STATE.IDLE;
        this.targetShip = null;
        this.patrolPoints = options.patrolPoints || this._generatePatrolPoints();
        this.currentPatrolIndex = 0;
        this.stateTime = 0;
        this.thinkTime = 0;
        this.thinkInterval = 0.5; // seconds between AI decisions
        this.lastFireTime = 0;
        
        // Simple custom random generator instead of BABYLON.RandomEngine
        this.random = {
            seed: (Math.random() * 10000) | 0,
            random: function() {
                // Simple random implementation
                this.seed = (this.seed * 9301 + 49297) % 233280;
                return this.seed / 233280;
            }
        };
        
        // Sensors
        this.detectionRange = options.detectionRange || 300;
        this.attackRange = options.attackRange || 150;
        this.evadeHealthThreshold = options.evadeHealthThreshold || 30;
        
        // Combat parameters
        this.aggressiveness = this._getPersonalityFactor('aggressiveness');
        this.accuracy = this._getDifficultyFactor('accuracy');
        this.reactionTime = this._getDifficultyFactor('reactionTime');
        this.tacticalAwareness = this._getDifficultyFactor('tacticalAwareness');
        
        // Weapons
        this.weapons = options.weapons || null;
        
        // Debug visualization
        this.debugMode = options.debug || false;
        this._initDebugVisuals();
    }
    
    /**
     * Initializes debug visuals
     * @private
     */
    _initDebugVisuals() {
        if (!this.debugMode) return;
        
        // State text
        this.stateText = new BABYLON.GUI.TextBlock();
        this.stateText.text = this.currentState;
        this.stateText.color = "white";
        this.stateText.fontSize = 12;
        
        // Create a plane to display the text
        const plane = BABYLON.MeshBuilder.CreatePlane("stateDisplay", {
            width: 5,
            height: 1
        }, this.scene);
        plane.parent = this.spacecraft;
        plane.position.y = 3;
        
        // Create a dynamic texture
        const textTexture = new BABYLON.DynamicTexture("stateTexture", {
            width: 256,
            height: 64
        }, this.scene);
        
        // Create material
        const material = new BABYLON.StandardMaterial("textMaterial", this.scene);
        material.diffuseTexture = textTexture;
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        material.backFaceCulling = false;
        plane.material = material;
        
        // Save references
        this.debugObjects = {
            plane: plane,
            texture: textTexture
        };
    }
    
    /**
     * Updates debug visuals
     * @private
     */
    _updateDebugVisuals() {
        if (!this.debugMode || !this.debugObjects) return;
        
        const texture = this.debugObjects.texture;
        const textureContext = texture.getContext();
        
        // Clear the texture
        textureContext.clearRect(0, 0, texture.getSize().width, texture.getSize().height);
        
        // Set text properties
        textureContext.font = "bold 24px Arial";
        textureContext.fillStyle = "white";
        textureContext.textAlign = "center";
        textureContext.textBaseline = "middle";
        
        // State text
        const stateColor = this._getStateColor();
        textureContext.fillStyle = stateColor;
        textureContext.fillText(
            this.currentState.toUpperCase(), 
            texture.getSize().width / 2, 
            texture.getSize().height / 2
        );
        
        // Update the texture
        texture.update();
        
        // Make sure the plane faces the camera
        const camera = this.scene.activeCamera;
        if (camera) {
            this.debugObjects.plane.lookAt(camera.position);
        }
    }
    
    /**
     * Gets a color based on the current state
     * @returns {String} CSS color string
     * @private
     */
    _getStateColor() {
        switch (this.currentState) {
            case AI_STATE.IDLE: return "gray";
            case AI_STATE.PATROL: return "blue";
            case AI_STATE.PURSUE: return "yellow";
            case AI_STATE.ATTACK: return "red";
            case AI_STATE.EVADE: return "orange";
            case AI_STATE.FLEE: return "purple";
            case AI_STATE.ESCORT: return "green";
            case AI_STATE.DAMAGED: return "brown";
            default: return "white";
        }
    }
    
    /**
     * Gets a difficulty factor based on the AI's difficulty level
     * @param {String} factor - The factor to get
     * @returns {Number} The difficulty factor value
     * @private
     */
    _getDifficultyFactor(factor) {
        const difficultyFactors = {
            accuracy: {
                [AI_DIFFICULTY.EASY]: 0.5,
                [AI_DIFFICULTY.MEDIUM]: 0.7,
                [AI_DIFFICULTY.HARD]: 0.85,
                [AI_DIFFICULTY.ACE]: 0.95
            },
            reactionTime: {
                [AI_DIFFICULTY.EASY]: 1.5,
                [AI_DIFFICULTY.MEDIUM]: 1.0,
                [AI_DIFFICULTY.HARD]: 0.7,
                [AI_DIFFICULTY.ACE]: 0.4
            },
            tacticalAwareness: {
                [AI_DIFFICULTY.EASY]: 0.3,
                [AI_DIFFICULTY.MEDIUM]: 0.6,
                [AI_DIFFICULTY.HARD]: 0.8,
                [AI_DIFFICULTY.ACE]: 0.95
            }
        };
        
        return difficultyFactors[factor][this.difficulty] || 0.5;
    }
    
    /**
     * Gets a personality factor based on the AI's personality
     * @param {String} factor - The factor to get
     * @returns {Number} The personality factor value
     * @private
     */
    _getPersonalityFactor(factor) {
        const personalityFactors = {
            aggressiveness: {
                [AI_PERSONALITY.AGGRESSIVE]: 0.9,
                [AI_PERSONALITY.DEFENSIVE]: 0.3,
                [AI_PERSONALITY.BALANCED]: 0.5,
                [AI_PERSONALITY.CAUTIOUS]: 0.2,
                [AI_PERSONALITY.RECKLESS]: 1.0
            },
            evasiveness: {
                [AI_PERSONALITY.AGGRESSIVE]: 0.2,
                [AI_PERSONALITY.DEFENSIVE]: 0.8,
                [AI_PERSONALITY.BALANCED]: 0.5,
                [AI_PERSONALITY.CAUTIOUS]: 0.9,
                [AI_PERSONALITY.RECKLESS]: 0.1
            }
        };
        
        return personalityFactors[factor][this.personality] || 0.5;
    }
    
    /**
     * Generates random patrol points around the origin
     * @returns {Array<BABYLON.Vector3>} Array of patrol points
     * @private
     */
    _generatePatrolPoints() {
        const points = [];
        const numPoints = 4 + Math.floor(Math.random() * 3);
        const radius = 100 + Math.random() * 200;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 50;
            
            points.push(new BABYLON.Vector3(x, y, z));
        }
        
        return points;
    }
    
    /**
     * Updates the AI controller
     * @param {Array} potentialTargets - Array of potential target spacecraft
     * @param {Number} deltaTime - Time since last update
     */
    update(potentialTargets, deltaTime) {
        // Update state timing
        this.stateTime += deltaTime;
        this.thinkTime += deltaTime;
        
        // Periodic AI decision making
        if (this.thinkTime >= this.thinkInterval) {
            this._updateTargeting(potentialTargets);
            this._updateState();
            this.thinkTime = 0;
        }
        
        // Execute current state behavior
        this._executeCurrentState(deltaTime);
        
        // Update debug visuals
        this._updateDebugVisuals();
    }
    
    /**
     * Updates targeting based on potential targets
     * @param {Array} potentialTargets - Array of potential target spacecraft
     * @private
     */
    _updateTargeting(potentialTargets) {
        if (!potentialTargets || potentialTargets.length === 0) {
            // No potential targets, clear current target
            this.targetShip = null;
            return;
        }
        
        // Filter for enemy targets
        const enemies = potentialTargets.filter(target => {
            if (!target || !target.affiliation) return false;
            
            // Team-based targeting
            if (this.team === 'enemy') {
                return target.affiliation === 'confederation';
            } else if (this.team === 'confederation') {
                return target.affiliation === 'enemy';
            }
            
            return false;
        });
        
        if (enemies.length === 0) {
            // No enemy targets, clear current target
            this.targetShip = null;
            return;
        }
        
        // Check if current target is still valid
        if (this.targetShip) {
            const currentTargetStillValid = enemies.some(enemy => enemy === this.targetShip);
            if (!currentTargetStillValid) {
                this.targetShip = null;
            }
        }
        
        // Find closest enemy
        if (!this.targetShip) {
            let closestEnemy = null;
            let closestDistance = Number.MAX_VALUE;
            
            enemies.forEach(enemy => {
                const distance = BABYLON.Vector3.Distance(
                    this.spacecraft.position,
                    enemy.position
                );
                
                if (distance < closestDistance && distance < this.detectionRange) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            });
            
            this.targetShip = closestEnemy;
        }
    }
    
    /**
     * Updates the current AI state based on situation
     * @private
     */
    _updateState() {
        const prevState = this.currentState;
        
        // Check health status
        const healthPercent = this.spacecraft.health || 100;
        if (healthPercent < 15) {
            this.currentState = AI_STATE.FLEE;
            return;
        }
        
        if (healthPercent < this.evadeHealthThreshold) {
            this.currentState = AI_STATE.EVADE;
            return;
        }
        
        // Combat behavior
        if (this.targetShip) {
            const distance = BABYLON.Vector3.Distance(
                this.spacecraft.position,
                this.targetShip.position
            );
            
            if (distance <= this.attackRange) {
                this.currentState = AI_STATE.ATTACK;
            } else if (distance <= this.detectionRange) {
                this.currentState = AI_STATE.PURSUE;
            } else {
                // Target exists but is out of range
                this.currentState = AI_STATE.PATROL;
            }
        } else {
            // No target, default to patrol
            this.currentState = AI_STATE.PATROL;
        }
        
        // State changed, reset state timer
        if (prevState !== this.currentState) {
            this.stateTime = 0;
        }
    }
    
    /**
     * Executes the behavior for the current state
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executeCurrentState(deltaTime) {
        switch (this.currentState) {
            case AI_STATE.IDLE:
                this._executeIdleState(deltaTime);
                break;
            case AI_STATE.PATROL:
                this._executePatrolState(deltaTime);
                break;
            case AI_STATE.PURSUE:
                this._executePursueState(deltaTime);
                break;
            case AI_STATE.ATTACK:
                this._executeAttackState(deltaTime);
                break;
            case AI_STATE.EVADE:
                this._executeEvadeState(deltaTime);
                break;
            case AI_STATE.FLEE:
                this._executeFleeState(deltaTime);
                break;
            case AI_STATE.ESCORT:
                this._executeEscortState(deltaTime);
                break;
            default:
                // Default to idle
                this._executeIdleState(deltaTime);
                break;
        }
    }
    
    /**
     * Executes idle state behavior
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executeIdleState(deltaTime) {
        // Slight movement to give appearance of idling
        const time = this.scene.getEngine().getFps() / 10;
        
        // Small random adjustments to position
        const xOffset = Math.sin(time * 0.5) * 0.1;
        const yOffset = Math.cos(time * 0.3) * 0.1;
        const zOffset = Math.sin(time * 0.7) * 0.1;
        
        // Apply a small amount of thrust
        this.physics.thrustInput = 0.1;
        
        // Apply subtle rotation
        this.physics.yawInput = Math.sin(time * 0.2) * 0.1;
        this.physics.pitchInput = Math.cos(time * 0.3) * 0.1;
        this.physics.rollInput = Math.sin(time * 0.4) * 0.1;
    }
    
    /**
     * Executes patrol state behavior
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executePatrolState(deltaTime) {
        if (this.patrolPoints.length === 0) return;
        
        // Get current patrol point
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        
        // Calculate direction to patrol point
        const toTarget = targetPoint.subtract(this.spacecraft.position);
        const distance = toTarget.length();
        
        // Check if we've reached the current patrol point
        if (distance < 10) {
            // Move to next patrol point
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            return;
        }
        
        // Navigate to the patrol point
        this._navigateToPosition(targetPoint, 0.7); // 70% speed for patrol
    }
    
    /**
     * Executes pursue state behavior
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executePursueState(deltaTime) {
        if (!this.targetShip) return;
        
        // Predict target's future position based on its velocity
        const targetVelocity = this.targetShip.physics ? 
            this.targetShip.physics.velocity : 
            new BABYLON.Vector3(0, 0, 0);
        
        // Simple prediction based on current velocity and distance
        const distance = BABYLON.Vector3.Distance(
            this.spacecraft.position,
            this.targetShip.position
        );
        
        // Predict more steps ahead at longer distances
        const predictionSteps = Math.min(3, Math.floor(distance / 50));
        const predictedPosition = this.targetShip.position.add(
            targetVelocity.scale(predictionSteps)
        );
        
        // Navigate to the predicted position
        this._navigateToPosition(predictedPosition, 0.9); // 90% speed for pursuit
        
        // Check if we should fire long-range weapons
        if (distance < this.attackRange * 1.5) {
            this._fireWeapons();
        }
    }
    
    /**
     * Executes attack state behavior
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executeAttackState(deltaTime) {
        if (!this.targetShip) return;
        
        // Get distance to target
        const distance = BABYLON.Vector3.Distance(
            this.spacecraft.position,
            this.targetShip.position
        );
        
        // Maintain optimal attack distance
        const optimalDistance = this.attackRange * 0.6;
        const distanceRatio = distance / optimalDistance;
        
        // Adjust speed based on distance from optimal attack range
        let speed = 0.5; // Default to half speed
        
        if (distanceRatio > 1.2) {
            // Too far away, speed up to close distance
            speed = 0.9;
        } else if (distanceRatio < 0.8) {
            // Too close, slow down or reverse
            speed = -0.3;
        }
        
        // Calculate attack vector - add randomness for strafing behavior
        const attackOffset = new BABYLON.Vector3(
            (this.random.random() - 0.5) * 20,
            (this.random.random() - 0.5) * 10,
            0
        );
        
        const attackPosition = this.targetShip.position.add(attackOffset);
        
        // Navigate to attack position
        this._navigateToPosition(attackPosition, speed);
        
        // Fire weapons while in attack state
        this._fireWeapons();
        
        // Add evasive maneuvers while attacking
        this._performEvasiveManeuvers(0.3); // Subtle evasion during attack
    }
    
    /**
     * Executes evade state behavior
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executeEvadeState(deltaTime) {
        if (!this.targetShip) return;
        
        // Calculate evasion direction - perpendicular to the direction to target
        const toTarget = this.targetShip.position.subtract(this.spacecraft.position);
        const distance = toTarget.length();
        toTarget.normalize();
        
        // Create a perpendicular vector (cross product with world up)
        const worldUp = new BABYLON.Vector3(0, 1, 0);
        let evasionDir = BABYLON.Vector3.Cross(toTarget, worldUp).normalize();
        
        // Randomly reverse direction for unpredictability
        if (this.random.random() > 0.5) {
            evasionDir.scaleInPlace(-1);
        }
        
        // Add some vertical component for 3D evasion
        evasionDir.y = (this.random.random() - 0.5) * 2;
        evasionDir.normalize();
        
        // Calculate evasion target point
        const evasionDistance = 50 + (this.random.random() * 50);
        const evasionTarget = this.spacecraft.position.add(
            evasionDir.scale(evasionDistance)
        );
        
        // Navigate to evasion target
        this._navigateToPosition(evasionTarget, 1.0); // Full speed for evasion
        
        // Perform more aggressive evasive maneuvers
        this._performEvasiveManeuvers(0.8);
        
        // Fire back while evading if target is in sight
        if (this.stateTime > 2 && this._isTargetInSight()) {
            this._fireWeapons();
        }
    }
    
    /**
     * Executes flee state behavior
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executeFleeState(deltaTime) {
        if (!this.targetShip) return;
        
        // Calculate direction away from target
        const awayFromTarget = this.spacecraft.position.subtract(this.targetShip.position);
        awayFromTarget.normalize();
        
        // Target point far away from enemy
        const fleeTarget = this.spacecraft.position.add(
            awayFromTarget.scale(500)
        );
        
        // Navigate away at maximum speed
        this._navigateToPosition(fleeTarget, 1.0);
        
        // Use afterburner if available
        this.physics.activateAfterburner();
        
        // Perform evasive maneuvers while fleeing
        this._performEvasiveManeuvers(0.5);
    }
    
    /**
     * Executes escort state behavior
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _executeEscortState(deltaTime) {
        // Not implemented in this version
        this._executePatrolState(deltaTime);
    }
    
    /**
     * Navigates the spacecraft to a position
     * @param {BABYLON.Vector3} targetPosition - The position to navigate to
     * @param {Number} speedFactor - Factor to apply to speed (0-1)
     * @private
     */
    _navigateToPosition(targetPosition, speedFactor) {
        // Calculate direction to target
        const toTarget = targetPosition.subtract(this.spacecraft.position);
        const distance = toTarget.length();
        
        if (distance < 0.1) return; // Already at target position
        
        // Normalize direction vector
        const direction = toTarget.normalize();
        
        // Get the ship's current orientation
        const forward = this.spacecraft.direction;
        
        // Calculate the dot product to determine alignment
        const dot = BABYLON.Vector3.Dot(forward, direction);
        
        // Calculate the cross product to determine rotation direction
        const cross = BABYLON.Vector3.Cross(forward, direction);
        
        // Apply thrust based on alignment and speed factor
        this.physics.thrustInput = speedFactor * Math.max(0.1, dot);
        
        // Apply rotation to align with target direction
        this.physics.yawInput = Math.sign(cross.y) * Math.min(1, Math.abs(cross.y) * 3);
        this.physics.pitchInput = -Math.sign(cross.x) * Math.min(1, Math.abs(cross.x) * 3);
        
        // Apply roll to level out (try to keep world 'up' aligned with ship 'up')
        const shipUp = new BABYLON.Vector3(0, 1, 0);
        shipUp.applyRotationQuaternion(this.spacecraft.rotationQuaternion);
        const worldUp = new BABYLON.Vector3(0, 1, 0);
        const rollCross = BABYLON.Vector3.Cross(shipUp, worldUp);
        const rollCorrection = BABYLON.Vector3.Dot(rollCross, forward);
        this.physics.rollInput = -Math.sign(rollCorrection) * Math.min(0.5, Math.abs(rollCorrection));
    }
    
    /**
     * Performs random evasive maneuvers
     * @param {Number} intensity - Intensity of maneuvers (0-1)
     * @private
     */
    _performEvasiveManeuvers(intensity) {
        // Skip if intensity is too low
        if (intensity < 0.05) return;
        
        // Determine how frequently to change maneuvers
        const maneuverChangeInterval = 1.0; // seconds
        const randomOffset = (this.random.random() - 0.5) * 2 * intensity;
        
        // Apply random adjustments to controls based on time
        const timeSegment = Math.floor(this.stateTime / maneuverChangeInterval);
        // Use our custom random generator
        this.random.seed = timeSegment * 1000 + (this.spacecraft.id || 0);
        
        // Generate semi-random control inputs
        const yawJink = (this.random.random() - 0.5) * 2 * intensity;
        const pitchJink = (this.random.random() - 0.5) * 2 * intensity;
        const rollJink = (this.random.random() - 0.5) * 2 * intensity;
        
        // Add randomness to control inputs
        this.physics.yawInput += yawJink;
        this.physics.pitchInput += pitchJink;
        this.physics.rollInput += rollJink;
        
        // Clamp control inputs
        this.physics.yawInput = Math.max(-1, Math.min(1, this.physics.yawInput));
        this.physics.pitchInput = Math.max(-1, Math.min(1, this.physics.pitchInput));
        this.physics.rollInput = Math.max(-1, Math.min(1, this.physics.rollInput));
    }
    
    /**
     * Fires weapons at the current target
     * @private
     */
    _fireWeapons() {
        if (!this.weapons || !this.targetShip) return;
        
        // Check if target is in sight
        if (!this._isTargetInSight()) return;
        
        // Attempt to fire
        const result = this.weapons.fire(this.spacecraft.energy || 100);
        
        if (result.success) {
            // Reduce spacecraft energy
            if (this.spacecraft.energy !== undefined) {
                this.spacecraft.energy -= result.energyCost;
            }
            
            // Record last fire time
            this.lastFireTime = this.scene.getEngine().getFps();
        }
    }
    
    /**
     * Checks if the target is in sight (in front of the spacecraft)
     * @returns {Boolean} True if target is in sight
     * @private
     */
    _isTargetInSight() {
        if (!this.targetShip) return false;
        
        // Calculate direction to target
        const toTarget = this.targetShip.position.subtract(this.spacecraft.position);
        toTarget.normalize();
        
        // Get forward direction of ship
        const forward = this.spacecraft.direction;
        
        // Calculate dot product (1 = perfectly aligned, -1 = opposite direction)
        const dot = BABYLON.Vector3.Dot(forward, toTarget);
        
        // Target is in sight if angle is less than 30 degrees (cos(30) ≈ 0.866)
        return dot > 0.866;
    }
    
    /**
     * Sets the AI to a specific state
     * @param {String} state - The state to set
     */
    setState(state) {
        if (AI_STATE[state.toUpperCase()]) {
            this.currentState = state;
            this.stateTime = 0;
        }
    }
    
    /**
     * Sets the target for the AI
     * @param {BABYLON.TransformNode} target - The target to pursue/attack
     */
    setTarget(target) {
        this.targetShip = target;
    }
    
    /**
     * Gets the current state of the AI
     * @returns {String} The current AI state
     */
    getState() {
        return this.currentState;
    }
    
    /**
     * Gets the current target
     * @returns {BABYLON.TransformNode} The current target
     */
    getTarget() {
        return this.targetShip;
    }
    
    /**
     * Disposes of resources
     */
    dispose() {
        if (this.debugMode && this.debugObjects) {
            if (this.debugObjects.plane) {
                this.debugObjects.plane.dispose();
            }
            if (this.debugObjects.texture) {
                this.debugObjects.texture.dispose();
            }
        }
    }
}

/**
 * Creates an AI controller for a spacecraft
 * @param {BABYLON.Scene} scene - The scene
 * @param {BABYLON.TransformNode} spacecraft - The spacecraft to control
 * @param {Object} physics - The physics system for the spacecraft
 * @param {Object} options - Configuration options
 * @returns {AIController} A new AI controller
 */
export function createAIController(scene, spacecraft, physics, options = {}) {
    return new AIController(scene, spacecraft, physics, options);
}