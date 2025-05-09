import * as BABYLON from 'babylonjs';

/**
 * AI class for wingmen that handles movement, targeting, and combat
 */
export class WingmanAI {
    constructor(spacecraft, physics, weapons, gameState) {
        this.spacecraft = spacecraft;
        this.physics = physics;
        this.weapons = weapons;
        this.gameState = gameState;
        
        // AI state
        this.state = 'idle'; // idle, follow, attack, defend, protect, return_to_carrier, break_attack
        this.stateParams = {};
        
        // Target info
        this.currentTarget = null;
        this.targetLockTime = 0;
        this.isTargetLocked = false;
        
        // Movement parameters
        this.formationOffset = new BABYLON.Vector3(30, 0, -20); // Offset from player when in formation
        this.maxTargetingRange = 500;
        this.minAttackDistance = 100;
        this.maxAttackDistance = 300;
        this.avoidanceDistance = 50;
        
        // Combat parameters
        this.aggressiveness = 0.7; // 0-1, how aggressive in combat
        this.accuracy = 0.8; // 0-1, accuracy when firing
        this.evasiveness = 0.6; // 0-1, how much it evades enemy fire
        
        // Input state for physics
        this.inputs = {
            thrustInput: 0,
            strafeInput: 0,
            verticalInput: 0,
            pitchInput: 0,
            yawInput: 0,
            rollInput: 0,
            fireWeapon: false,
            afterburnerActive: false
        };
    }
    
    /**
     * Sets the AI state
     * @param {String} state - New AI state
     * @param {Object} params - Parameters for the state
     */
    setState(state, params = {}) {
        this.state = state;
        this.stateParams = params;
        
        // Handle state-specific initialization
        switch (state) {
            case 'attack':
                this.currentTarget = params.target || null;
                this.isTargetLocked = false;
                this.targetLockTime = 0;
                break;
                
            case 'follow':
                this.currentTarget = null;
                this.isTargetLocked = false;
                break;
                
            case 'protect':
                this.currentTarget = null;
                this.protectTarget = params.target || this.gameState.player;
                this.searchTime = 0;
                break;
                
            case 'return_to_carrier':
                this.currentTarget = null;
                this.carrier = params.carrier;
                break;
        }
    }
    
    /**
     * Updates the AI based on current state and environment
     * @param {Number} deltaTime - Time since last update
     * @param {Array} potentialTargets - List of potential targets
     * @param {String} command - Current command from the wingman system
     */
    update(deltaTime, potentialTargets, command) {
        // Reset inputs
        this._resetInputs();
        
        // Update based on state
        switch (this.state) {
            case 'idle':
                this._updateIdleState(deltaTime);
                break;
                
            case 'follow':
                this._updateFollowState(deltaTime);
                break;
                
            case 'attack':
                this._updateAttackState(deltaTime, potentialTargets);
                break;
                
            case 'attack_all':
                this._updateAttackAllState(deltaTime, potentialTargets);
                break;
                
            case 'defend':
                this._updateDefendState(deltaTime, potentialTargets);
                break;
                
            case 'protect':
                this._updateProtectState(deltaTime, potentialTargets);
                break;
                
            case 'return_to_carrier':
                this._updateReturnToCarrierState(deltaTime);
                break;
                
            case 'break_attack':
                this._updateBreakAndAttackState(deltaTime, potentialTargets);
                break;
        }
        
        // Collision avoidance
        this._performCollisionAvoidance(potentialTargets);
    }
    
    /**
     * Updates idle state - just hover in place
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _updateIdleState(deltaTime) {
        // In idle state, stabilize the ship
        const velocity = this.physics.velocity.length();
        
        if (velocity > 0.1) {
            // Apply deceleration to stop
            this.inputs.thrustInput = -Math.sign(velocity) * 0.5;
        } else {
            this.inputs.thrustInput = 0;
        }
        
        // Level out if rotated
        this._levelOut();
    }
    
    /**
     * Updates follow state - follow the player or specified target
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _updateFollowState(deltaTime) {
        const targetToFollow = this.stateParams.target || this.gameState.player;
        if (!targetToFollow) return;
        
        // Calculate desired formation position
        const targetDirection = targetToFollow.direction.clone().normalize();
        const targetRight = BABYLON.Vector3.Cross(targetDirection, BABYLON.Vector3.Up()).normalize();
        
        // Position on the wing of the leader
        const formationPosition = targetToFollow.position.clone()
            .add(targetRight.scale(this.formationOffset.x))
            .add(new BABYLON.Vector3(0, this.formationOffset.y, 0))
            .add(targetDirection.scale(this.formationOffset.z));
        
        // Calculate vector to formation position
        const toFormation = formationPosition.subtract(this.spacecraft.position);
        const distanceToFormation = toFormation.length();
        
        // If far from formation, use afterburner to catch up
        if (distanceToFormation > 100) {
            this.inputs.afterburnerActive = true;
        }
        
        // Fly to formation position
        this._flyToPosition(formationPosition, targetDirection);
        
        // Match leader's speed when close to formation position
        if (distanceToFormation < 20) {
            // Match target velocity if available
            if (targetToFollow.physics && targetToFollow.physics.velocity) {
                this.physics.velocity = targetToFollow.physics.velocity.clone();
            }
        }
    }
    
    /**
     * Updates attack state - attack a specific target
     * @param {Number} deltaTime - Time since last update
     * @param {Array} potentialTargets - List of potential targets
     * @private
     */
    _updateAttackState(deltaTime, potentialTargets) {
        // If no current target, find one
        if (!this.currentTarget) {
            // Try to get the player's target first
            if (this.gameState.playerTargeting && 
                this.gameState.playerTargeting.getCurrentTarget()) {
                this.currentTarget = this.gameState.playerTargeting.getCurrentTarget();
            }
            // Otherwise pick the closest valid target
            else {
                this.currentTarget = this._findBestTarget(potentialTargets);
            }
            
            if (!this.currentTarget) {
                // No target found, switch to follow state
                this.setState('follow', { target: this.gameState.player });
                return;
            }
        }
        
        // Check if target is still valid
        if (this.currentTarget.health <= 0 || 
            !potentialTargets.includes(this.currentTarget)) {
            this.currentTarget = null;
            this.isTargetLocked = false;
            return;
        }
        
        // Attack the target
        this._attackTarget(this.currentTarget, deltaTime);
    }
    
    /**
     * Updates attack all state - attack any enemy in range
     * @param {Number} deltaTime - Time since last update
     * @param {Array} potentialTargets - List of potential targets
     * @private
     */
    _updateAttackAllState(deltaTime, potentialTargets) {
        // If no current target or current target is destroyed, find a new one
        if (!this.currentTarget || this.currentTarget.health <= 0 || 
            !potentialTargets.includes(this.currentTarget)) {
            this.currentTarget = this._findBestTarget(potentialTargets);
            this.isTargetLocked = false;
            
            if (!this.currentTarget) {
                // No targets available, switch to following player
                this.setState('follow', { target: this.gameState.player });
                return;
            }
        }
        
        // Attack the current target
        this._attackTarget(this.currentTarget, deltaTime);
        
        // Switch targets occasionally for more dynamic combat
        if (Math.random() < 0.005) { // Approximately every 200 frames
            this.currentTarget = this._findBestTarget(potentialTargets);
            this.isTargetLocked = false;
        }
    }
    
    /**
     * Updates defend state - defensive evasive maneuvers
     * @param {Number} deltaTime - Time since last update
     * @param {Array} potentialTargets - List of potential targets
     * @private
     */
    _updateDefendState(deltaTime, potentialTargets) {
        // Find nearest threat
        const nearestThreat = this._findNearestThreat(potentialTargets);
        
        if (nearestThreat) {
            // Execute evasive maneuvers
            this._performEvasiveManeuvers(nearestThreat, deltaTime);
            
            // Fire at threat if it's in front of us
            const threatDirection = nearestThreat.position.subtract(this.spacecraft.position).normalize();
            const dot = BABYLON.Vector3.Dot(this.spacecraft.direction, threatDirection);
            
            if (dot > 0.8) { // Target is roughly in front of us
                this.inputs.fireWeapon = true;
                this.currentTarget = nearestThreat;
            }
        } else {
            // No threats, maintain position and scan for enemies
            this._performScanningPattern(deltaTime);
        }
    }
    
    /**
     * Updates protect state - protect another ship from enemies
     * @param {Number} deltaTime - Time since last update
     * @param {Array} potentialTargets - List of potential targets
     * @private
     */
    _updateProtectState(deltaTime, potentialTargets) {
        // Get the ship to protect
        const protectTarget = this.protectTarget || this.gameState.player;
        if (!protectTarget) {
            this.setState('follow', { target: this.gameState.player });
            return;
        }
        
        // Find the nearest threat to the protected ship
        const nearestThreat = this._findNearestThreatTo(protectTarget, potentialTargets);
        
        if (nearestThreat) {
            // Attack the threat
            this.currentTarget = nearestThreat;
            this._attackTarget(nearestThreat, deltaTime);
        } else {
            // No immediate threats, position for protection
            this._positionForProtection(protectTarget, deltaTime);
            
            // Increment search time
            this.searchTime += deltaTime;
            
            // Periodically scan for threats
            if (this.searchTime > 3) { // Every 3 seconds
                this.searchTime = 0;
                
                // Look for any enemies in the vicinity
                const newThreat = this._findBestTarget(potentialTargets);
                if (newThreat) {
                    this.currentTarget = newThreat;
                }
            }
        }
    }
    
    /**
     * Updates return to carrier state - return to carrier for landing
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _updateReturnToCarrierState(deltaTime) {
        if (!this.carrier) {
            this.setState('follow', { target: this.gameState.player });
            return;
        }
        
        // Calculate vector to carrier
        const toCarrier = this.carrier.position.subtract(this.spacecraft.position);
        const distanceToCarrier = toCarrier.length();
        
        // If close to carrier, slow down for landing
        if (distanceToCarrier < 300) {
            // Reduce speed as we get closer
            const desiredSpeed = Math.min(15, distanceToCarrier / 10);
            this._controlSpeed(desiredSpeed);
            
            // If very close, request landing
            if (distanceToCarrier < 100) {
                // Landing logic would go here in a real implementation
                // For now, just hold position near the carrier
                this._flyToPosition(this.carrier.position.add(new BABYLON.Vector3(0, 30, 100)));
            } else {
                // Approach the carrier landing approach path
                this._flyToPosition(this.carrier.position.add(new BABYLON.Vector3(0, 30, 200)));
            }
        } else {
            // Use afterburner for long distances
            if (distanceToCarrier > 500) {
                this.inputs.afterburnerActive = true;
            }
            
            // Fly directly to carrier
            this._flyToPosition(this.carrier.position);
        }
    }
    
    /**
     * Updates break and attack state - break formation and attack nearby enemies
     * @param {Number} deltaTime - Time since last update
     * @param {Array} potentialTargets - List of potential targets
     * @private
     */
    _updateBreakAndAttackState(deltaTime, potentialTargets) {
        // If no current target or current target is destroyed, find a new one
        if (!this.currentTarget || this.currentTarget.health <= 0 || 
            !potentialTargets.includes(this.currentTarget)) {
            this.currentTarget = this._findBestTarget(potentialTargets);
            this.isTargetLocked = false;
            
            if (!this.currentTarget) {
                // No targets available, switch to following player
                this.setState('follow', { target: this.gameState.player });
                return;
            }
        }
        
        // Execute a more aggressive attack pattern
        this._attackTarget(this.currentTarget, deltaTime, true);
    }
    
    /**
     * Attacks a specific target
     * @param {Object} target - The target to attack
     * @param {Number} deltaTime - Time since last update
     * @param {Boolean} aggressive - Whether to use aggressive tactics
     * @private
     */
    _attackTarget(target, deltaTime, aggressive = false) {
        if (!target) return;
        
        // Calculate vector to target
        const toTarget = target.position.subtract(this.spacecraft.position);
        const distanceToTarget = toTarget.length();
        
        // Determine attack tactics based on distance
        if (distanceToTarget > this.maxAttackDistance) {
            // Too far, approach target
            this._flyToPosition(target.position);
            
            // Use afterburner to close distance quickly
            this.inputs.afterburnerActive = true;
        }
        else if (distanceToTarget < this.minAttackDistance && !aggressive) {
            // Too close, maintain distance
            this._flyToPosition(this.spacecraft.position.subtract(toTarget.normalize().scale(50)));
        }
        else {
            // In attack range, engage
            
            // Update target lock
            if (!this.isTargetLocked) {
                this.targetLockTime += deltaTime;
                
                // It takes 0.5 seconds to lock
                if (this.targetLockTime >= 0.5) {
                    this.isTargetLocked = true;
                }
            }
            
            // Calculate ideal attack vector
            const attackPosition = this._calculateAttackPosition(target, aggressive);
            
            // Fly to attack position
            this._flyToPosition(attackPosition);
            
            // Aim at target for firing
            const targetDirection = target.position.subtract(this.spacecraft.position).normalize();
            this._aimAtDirection(targetDirection);
            
            // Fire when aiming at target and locked
            if (this.isTargetLocked) {
                const dot = BABYLON.Vector3.Dot(this.spacecraft.direction, targetDirection);
                
                // Fire if we're pointing at the target
                // Accuracy factor determines how precise the aim needs to be
                if (dot > (0.9 - (1 - this.accuracy) * 0.2)) {
                    this.inputs.fireWeapon = true;
                }
            }
        }
    }
    
    /**
     * Calculates an ideal attack position for engaging a target
     * @param {Object} target - The target to attack
     * @param {Boolean} aggressive - Whether to use aggressive tactics
     * @returns {BABYLON.Vector3} The ideal attack position
     * @private
     */
    _calculateAttackPosition(target, aggressive = false) {
        // Get target velocity if available
        const targetVelocity = target.physics ? target.physics.velocity : new BABYLON.Vector3(0, 0, 0);
        
        // Predict target position
        const predictionTime = 0.5; // Predict 0.5 seconds ahead
        const predictedPosition = target.position.add(targetVelocity.scale(predictionTime));
        
        // Calculate attack vectors
        const toTarget = predictedPosition.subtract(this.spacecraft.position).normalize();
        
        // Generate a random offset for variety in attack patterns
        let attackOffsetFactor = 0.6; // Default offset factor
        
        if (aggressive) {
            // Aggressive mode uses closer, more direct attacks
            attackOffsetFactor = 0.3;
        } else {
            // Vary attack vector based on evasiveness
            attackOffsetFactor = 0.3 + (this.evasiveness * 0.5);
        }
        
        // Create offset vector for attack angle
        const up = BABYLON.Vector3.Up();
        let right = BABYLON.Vector3.Cross(toTarget, up).normalize();
        
        // Make sure right vector is valid (not zero)
        if (right.lengthSquared() < 0.1) {
            right = BABYLON.Vector3.Cross(toTarget, new BABYLON.Vector3(1, 0, 0)).normalize();
        }
        
        // Generate random offset within the attack angle range
        const randomAngle = (Math.random() * 2 - 1) * Math.PI; // -PI to PI
        const randomOffset = new BABYLON.Vector3(
            Math.cos(randomAngle) * right.x + Math.sin(randomAngle) * up.x,
            Math.cos(randomAngle) * right.y + Math.sin(randomAngle) * up.y,
            Math.cos(randomAngle) * right.z + Math.sin(randomAngle) * up.z
        ).scale(attackOffsetFactor);
        
        // Calculate the attack position
        // This creates a position that's a certain distance from the target
        // with a slight offset for a more interesting attack vector
        const attackDistance = this.minAttackDistance + 
                              (this.maxAttackDistance - this.minAttackDistance) * (aggressive ? 0.3 : 0.6);
        
        return predictedPosition.subtract(toTarget.add(randomOffset).normalize().scale(attackDistance));
    }
    
    /**
     * Performs evasive maneuvers to avoid a threat
     * @param {Object} threat - The threat to evade
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _performEvasiveManeuvers(threat, deltaTime) {
        if (!threat) return;
        
        // Calculate vector to threat
        const toThreat = threat.position.subtract(this.spacecraft.position);
        const distanceToThreat = toThreat.length();
        
        // Determine evasion direction
        const up = BABYLON.Vector3.Up();
        const threatDirection = toThreat.normalize();
        const right = BABYLON.Vector3.Cross(threatDirection, up).normalize();
        
        // Create random evasion vector that changes periodically
        const timeValue = Date.now() / 1000; // Use time for variation
        const evasionDirection = new BABYLON.Vector3(
            Math.sin(timeValue * 2.0) * right.x + Math.cos(timeValue * 1.5) * up.x,
            Math.sin(timeValue * 2.0) * right.y + Math.cos(timeValue * 1.5) * up.y,
            Math.sin(timeValue * 2.0) * right.z + Math.cos(timeValue * 1.5) * up.z
        ).normalize();
        
        // Calculate evasion position
        const evasionPosition = this.spacecraft.position.add(
            evasionDirection.scale(100 + Math.sin(timeValue) * 50)
        );
        
        // Fly to evasion position
        this._flyToPosition(evasionPosition);
        
        // Use afterburner for quicker evasion
        this.inputs.afterburnerActive = true;
        
        // Occasionally look back at the threat
        if (Math.sin(timeValue * 3.0) > 0.7) {
            this._aimAtDirection(threatDirection);
        }
    }
    
    /**
     * Performs scanning pattern to look for enemies
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _performScanningPattern(deltaTime) {
        // Create a circular scanning pattern
        const timeValue = Date.now() / 1000;
        const scanRadius = 100;
        
        // Calculate position around current position
        const scanPosition = this.spacecraft.position.add(
            new BABYLON.Vector3(
                Math.sin(timeValue * 0.5) * scanRadius,
                Math.sin(timeValue * 0.3) * scanRadius * 0.5,
                Math.cos(timeValue * 0.5) * scanRadius
            )
        );
        
        // Fly to scanning position
        this._flyToPosition(scanPosition);
        
        // Look ahead in various directions
        const lookDirection = new BABYLON.Vector3(
            Math.sin(timeValue * 1.0),
            Math.sin(timeValue * 0.7) * 0.3,
            Math.cos(timeValue * 1.0)
        ).normalize();
        
        this._aimAtDirection(lookDirection);
    }
    
    /**
     * Positions the wingman for optimal protection of a target
     * @param {Object} target - The target to protect
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _positionForProtection(target, deltaTime) {
        if (!target) return;
        
        // Position slightly behind and above the protected ship
        const protectDirection = target.direction ? target.direction.clone().normalize() : 
                                new BABYLON.Vector3(0, 0, 1);
        
        // Get right vector
        const right = BABYLON.Vector3.Cross(protectDirection, BABYLON.Vector3.Up()).normalize();
        
        // Oscillate position to create a protective orbit
        const timeValue = Date.now() / 1000;
        const orbitFactor = Math.sin(timeValue * 0.5) * 30;
        
        // Position offset from protected ship
        const protectPosition = target.position.clone()
            .add(protectDirection.scale(-30)) // Behind
            .add(new BABYLON.Vector3(0, 20, 0)) // Above
            .add(right.scale(orbitFactor)); // Orbit around
        
        // Fly to protection position
        this._flyToPosition(protectPosition);
        
        // Look in the same general direction as protected ship,
        // but scan ahead for threats
        const lookDirection = protectDirection.clone().add(
            new BABYLON.Vector3(
                Math.sin(timeValue * 1.2) * 0.3,
                Math.sin(timeValue * 0.8) * 0.2,
                0
            )
        ).normalize();
        
        this._aimAtDirection(lookDirection);
    }
    
    /**
     * Performs collision avoidance with other entities
     * @param {Array} entities - List of entities to avoid
     * @private
     */
    _performCollisionAvoidance(entities) {
        // Calculate avoidance vector
        let avoidanceVector = new BABYLON.Vector3(0, 0, 0);
        
        // Check distance to each entity
        entities.forEach(entity => {
            // Skip self
            if (entity === this.spacecraft) return;
            
            // Calculate vector from entity to this spacecraft
            const toSelf = this.spacecraft.position.subtract(entity.position);
            const distance = toSelf.length();
            
            // If too close, add to avoidance vector
            if (distance < this.avoidanceDistance) {
                // Strength inversely proportional to distance
                const avoidStrength = (this.avoidanceDistance - distance) / this.avoidanceDistance;
                
                // Add normalized vector scaled by avoidance strength
                avoidanceVector.addInPlace(toSelf.normalize().scale(avoidStrength));
            }
        });
        
        // If avoidance vector has magnitude, adjust course
        if (avoidanceVector.lengthSquared() > 0.1) {
            // Normalize and scale avoidance vector
            avoidanceVector.normalize();
            
            // Blend current direction with avoidance direction
            const blendedDirection = this.spacecraft.direction.add(avoidanceVector).normalize();
            
            // Aim in the blended direction
            this._aimAtDirection(blendedDirection);
            
            // Add some vertical movement to avoid collisions
            this.inputs.verticalInput = avoidanceVector.y;
        }
    }
    
    /**
     * Finds the best target to attack from a list of potential targets
     * @param {Array} potentialTargets - List of potential targets
     * @returns {Object} The best target or null if none found
     * @private
     */
    _findBestTarget(potentialTargets) {
        if (!potentialTargets || potentialTargets.length === 0) return null;
        
        let bestTarget = null;
        let bestScore = -Infinity;
        
        potentialTargets.forEach(target => {
            // Skip invalid targets
            if (!target || target.health <= 0) return;
            
            // Calculate distance
            const distance = BABYLON.Vector3.Distance(
                this.spacecraft.position,
                target.position
            );
            
            // Skip targets out of range
            if (distance > this.maxTargetingRange) return;
            
            // Calculate dot product to determine if in front
            const toTarget = target.position.subtract(this.spacecraft.position).normalize();
            const dot = BABYLON.Vector3.Dot(this.spacecraft.direction, toTarget);
            
            // Score based on distance and angle (prefer closer targets and those in front)
            let score = (this.maxTargetingRange - distance) / this.maxTargetingRange; // 0-1 based on distance
            score += Math.max(0, dot) * 0.5; // Add 0-0.5 based on angle
            
            // Prefer targets already targeted by the player
            if (this.gameState.playerTargeting && 
                this.gameState.playerTargeting.getCurrentTarget() === target) {
                score += 2.0; // Strong bonus for player's target
            }
            
            // Prioritize targets threatening the player
            if (this._isTargetThreateningPlayer(target)) {
                score += 1.0;
            }
            
            // Update best target if this one has a better score
            if (score > bestScore) {
                bestScore = score;
                bestTarget = target;
            }
        });
        
        return bestTarget;
    }
    
    /**
     * Finds the nearest threat to the wingman
     * @param {Array} potentialThreats - List of potential threats
     * @returns {Object} The nearest threat or null if none found
     * @private
     */
    _findNearestThreat(potentialThreats) {
        if (!potentialThreats || potentialThreats.length === 0) return null;
        
        let nearestThreat = null;
        let nearestDistance = Infinity;
        
        potentialThreats.forEach(threat => {
            // Skip invalid threats
            if (!threat || threat.health <= 0) return;
            
            // Calculate distance
            const distance = BABYLON.Vector3.Distance(
                this.spacecraft.position,
                threat.position
            );
            
            // Determine if threat is actively targeting us
            // This would require the threat to have targeting info
            const isTargetingUs = threat.ai && 
                                threat.ai.currentTarget === this.spacecraft;
            
            // Adjust perceived distance based on targeting
            const adjustedDistance = isTargetingUs ? distance * 0.5 : distance;
            
            // Update nearest threat
            if (adjustedDistance < nearestDistance) {
                nearestDistance = adjustedDistance;
                nearestThreat = threat;
            }
        });
        
        // Only return threats within range
        return nearestDistance <= this.maxTargetingRange ? nearestThreat : null;
    }
    
    /**
     * Finds the nearest threat to a specific target
     * @param {Object} target - The target to find threats for
     * @param {Array} potentialThreats - List of potential threats
     * @returns {Object} The nearest threat or null if none found
     * @private
     */
    _findNearestThreatTo(target, potentialThreats) {
        if (!target || !potentialThreats || potentialThreats.length === 0) return null;
        
        let nearestThreat = null;
        let nearestDistance = Infinity;
        
        potentialThreats.forEach(threat => {
            // Skip invalid threats
            if (!threat || threat.health <= 0) return;
            
            // Calculate distance to the protected target
            const distance = BABYLON.Vector3.Distance(
                target.position,
                threat.position
            );
            
            // Check if the threat is targeting our protectee
            const isTargetingProtectee = threat.ai && 
                                        threat.ai.currentTarget === target;
            
            // Adjust perceived distance based on targeting
            const adjustedDistance = isTargetingProtectee ? distance * 0.3 : distance;
            
            // Update nearest threat
            if (adjustedDistance < nearestDistance) {
                nearestDistance = adjustedDistance;
                nearestThreat = threat;
            }
        });
        
        // Only return threats within range of the target
        return nearestDistance <= this.maxTargetingRange * 1.5 ? nearestThreat : null;
    }
    
    /**
     * Checks if a target is threatening the player
     * @param {Object} target - The target to check
     * @returns {Boolean} True if the target is threatening the player
     * @private
     */
    _isTargetThreateningPlayer(target) {
        if (!target || !this.gameState.player) return false;
        
        // Calculate distance to player
        const distanceToPlayer = BABYLON.Vector3.Distance(
            this.gameState.player.position,
            target.position
        );
        
        // Check if the target is targeting the player
        const isTargetingPlayer = target.ai && 
                                target.ai.currentTarget === this.gameState.player;
        
        // Consider targets close to the player or targeting them as threatening
        return isTargetingPlayer || distanceToPlayer < 200;
    }
    
    /**
     * Flies to a specific position with appropriate input controls
     * @param {BABYLON.Vector3} position - The target position
     * @param {BABYLON.Vector3} desiredDirection - Optional desired facing direction
     * @private
     */
    _flyToPosition(position, desiredDirection = null) {
        // Calculate vector to target position
        const toPosition = position.subtract(this.spacecraft.position);
        const distance = toPosition.length();
        
        // Normalize the direction vector
        const directionToFly = toPosition.normalize();
        
        // Default desired direction is toward the position
        if (!desiredDirection) {
            desiredDirection = directionToFly;
        }
        
        // Calculate dot product to see if we're facing the right way
        const dot = BABYLON.Vector3.Dot(this.spacecraft.direction, directionToFly);
        
        // Aim toward the position
        this._aimAtDirection(directionToFly);
        
        // Adjust thrust based on facing and distance
        if (dot > 0.7) { // Roughly facing the right direction
            // Adjust thrust based on distance
            if (distance > 100) {
                this.inputs.thrustInput = 1.0; // Full speed ahead
            } else {
                // Reduce thrust as we get closer
                this.inputs.thrustInput = Math.min(1.0, distance / 100);
            }
        } else if (dot < -0.3) { // Facing away
            // Slow down when facing significantly away from target
            this.inputs.thrustInput = -0.5;
        }
        
        // Adjust strafe to fine-tune position
        if (distance < 30) {
            // Calculate right vector
            const right = BABYLON.Vector3.Cross(
                this.spacecraft.direction,
                BABYLON.Vector3.Up()
            ).normalize();
            
            // Calculate vertical vector
            const up = BABYLON.Vector3.Cross(
                right,
                this.spacecraft.direction
            ).normalize();
            
            // Calculate lateral and vertical offsets
            const lateralOffset = BABYLON.Vector3.Dot(toPosition, right);
            const verticalOffset = BABYLON.Vector3.Dot(toPosition, up);
            
            // Apply strafe inputs
            this.inputs.strafeInput = Math.sign(lateralOffset) * Math.min(1.0, Math.abs(lateralOffset) / 10);
            this.inputs.verticalInput = Math.sign(verticalOffset) * Math.min(1.0, Math.abs(verticalOffset) / 10);
        }
    }
    
    /**
     * Aims the spacecraft in a specific direction
     * @param {BABYLON.Vector3} direction - The direction to aim at
     * @private
     */
    _aimAtDirection(direction) {
        // Normalize the target direction
        const targetDirection = direction.normalize();
        
        // Current spacecraft direction
        const currentDirection = this.spacecraft.direction.normalize();
        
        // Calculate right vector based on current direction
        const right = BABYLON.Vector3.Cross(
            currentDirection,
            BABYLON.Vector3.Up()
        ).normalize();
        
        // Calculate up vector
        const up = BABYLON.Vector3.Cross(right, currentDirection).normalize();
        
        // Calculate pitch and yaw errors
        const yawError = BABYLON.Vector3.Dot(targetDirection, right);
        const pitchError = BABYLON.Vector3.Dot(targetDirection, up);
        
        // Calculate roll correction to level out
        const idealUp = BABYLON.Vector3.Up();
        const currentUp = BABYLON.Vector3.Cross(currentDirection, right).normalize();
        const rollError = BABYLON.Vector3.Dot(idealUp, right);
        
        // Apply inputs based on errors
        this.inputs.yawInput = Math.sign(yawError) * Math.min(1.0, Math.abs(yawError) * 3.0);
        this.inputs.pitchInput = Math.sign(pitchError) * Math.min(1.0, Math.abs(pitchError) * 3.0);
        this.inputs.rollInput = Math.sign(rollError) * Math.min(1.0, Math.abs(rollError) * 3.0);
    }
    
    /**
     * Controls the spacecraft's speed
     * @param {Number} desiredSpeed - The desired speed
     * @private
     */
    _controlSpeed(desiredSpeed) {
        // Get current speed
        const currentSpeed = this.physics.velocity.length();
        
        // Calculate speed error
        const speedError = desiredSpeed - currentSpeed;
        
        // Apply thrust based on error
        if (Math.abs(speedError) > 0.5) {
            this.inputs.thrustInput = Math.sign(speedError) * Math.min(1.0, Math.abs(speedError) / 10);
        } else {
            this.inputs.thrustInput = 0;
        }
    }
    
    /**
     * Levels out the spacecraft (roll and pitch to horizontal)
     * @private
     */
    _levelOut() {
        // Get current orientation vectors
        const currentDirection = this.spacecraft.direction.normalize();
        
        // Calculate right vector based on current direction
        const right = BABYLON.Vector3.Cross(
            currentDirection,
            BABYLON.Vector3.Up()
        ).normalize();
        
        // Calculate roll correction to level out
        const idealUp = BABYLON.Vector3.Up();
        const currentUp = BABYLON.Vector3.Cross(currentDirection, right).normalize();
        const rollError = BABYLON.Vector3.Dot(idealUp, right);
        
        // Calculate pitch correction to level out
        const pitchError = BABYLON.Vector3.Dot(currentDirection, BABYLON.Vector3.Up());
        
        // Apply roll and pitch inputs
        this.inputs.rollInput = Math.sign(rollError) * Math.min(1.0, Math.abs(rollError) * 2.0);
        this.inputs.pitchInput = -Math.sign(pitchError) * Math.min(0.5, Math.abs(pitchError));
    }
    
    /**
     * Reset input controls to neutral
     * @private
     */
    _resetInputs() {
        this.inputs = {
            thrustInput: 0,
            strafeInput: 0,
            verticalInput: 0,
            pitchInput: 0,
            yawInput: 0,
            rollInput: 0,
            fireWeapon: false,
            afterburnerActive: false
        };
    }
    
    /**
     * Gets the input controls for physics system
     * @returns {Object} Input state for physics
     */
    getInputs() {
        const result = {
            'w': this.inputs.thrustInput > 0,
            's': this.inputs.thrustInput < 0,
            'a': this.inputs.yawInput > 0,
            'd': this.inputs.yawInput < 0,
            'ArrowUp': this.inputs.pitchInput > 0,
            'ArrowDown': this.inputs.pitchInput < 0,
            'ArrowLeft': this.inputs.strafeInput < 0,
            'ArrowRight': this.inputs.strafeInput > 0,
            'Shift': this.inputs.afterburnerActive,
            'q': this.inputs.rollInput > 0,
            'e': this.inputs.rollInput < 0,
            ' ': this.inputs.fireWeapon
        };
        
        return result;
    }
    
    /**
     * Determines if the AI should fire weapons
     * @returns {Boolean} True if the AI should fire
     */
    shouldFire() {
        return this.inputs.fireWeapon;
    }
}