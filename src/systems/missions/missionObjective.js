/**
 * Represents a single mission objective
 * Objectives can be of different types (destroy, defend, navigate, etc.)
 */
export class MissionObjective {
    constructor(id, type, description, params, required = true, order = 0) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.params = params || {};
        this.required = required;
        this.order = order;
        this.state = 'pending'; // pending, completed, failed
        this.progress = 0; // 0-100%
        this.wasTracked = false; // Has this objective been counted in score
    }
    
    /**
     * Updates the objective's state based on game state
     * @param {Object} gameState - Current game state
     * @param {Number} deltaTime - Time since last update
     */
    update(gameState, deltaTime) {
        // Skip update if objective is already completed or failed
        if (this.isCompleted() || this.isFailed()) return;
        
        // Update progress based on objective type
        switch (this.type) {
            case 'destroy':
                this._updateDestroyObjective(gameState);
                break;
            case 'defend':
                this._updateDefendObjective(gameState, deltaTime);
                break;
            case 'navigate':
                this._updateNavigateObjective(gameState);
                break;
            case 'escort':
                this._updateEscortObjective(gameState, deltaTime);
                break;
            case 'time':
                this._updateTimeObjective(gameState, deltaTime);
                break;
            default:
                // Custom objectives don't auto-update; they must be completed via events
                break;
        }
        
        // Auto-complete if progress reaches 100%
        if (this.progress >= 100 && !this.isCompleted()) {
            this.complete();
        }
    }
    
    /**
     * Update for destroy-type objectives (destroy X enemies)
     * @param {Object} gameState - Current game state
     * @private
     */
    _updateDestroyObjective(gameState) {
        const targetType = this.params.targetType || 'any';
        const targetCount = this.params.count || 1;
        
        // Check historical destroyed count (from score tracker)
        let destroyedCount = 0;
        
        if (gameState.missionSystem && gameState.missionSystem.scoreTracker) {
            // For simple total count
            if (targetType === 'any') {
                destroyedCount = gameState.missionSystem.scoreTracker.enemiesDestroyed;
            }
            // For specific target type, would need to track in more detail
        }
        
        // Calculate progress
        this.progress = Math.min(100, Math.floor((destroyedCount / targetCount) * 100));
    }
    
    /**
     * Update for defend-type objectives (defend X for Y time)
     * @param {Object} gameState - Current game state
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _updateDefendObjective(gameState, deltaTime) {
        const targetId = this.params.targetId;
        const duration = this.params.duration || 60; // Default 60 seconds
        
        // If target doesn't exist or is destroyed, fail the objective
        let targetExists = false;
        
        if (targetId === 'player') {
            targetExists = gameState.player && gameState.player.health > 0;
        } else if (gameState.friendlies) {
            // Check in friendlies
            targetExists = gameState.friendlies.some(f => f.id === targetId && f.health > 0);
        } else if (gameState.structures) {
            // Check in structures
            targetExists = gameState.structures.some(s => s.id === targetId && s.health > 0);
        }
        
        if (!targetExists) {
            this.fail();
            return;
        }
        
        // Initialize timer if not set
        if (this.params.elapsedTime === undefined) {
            this.params.elapsedTime = 0;
        }
        
        // Update timer
        this.params.elapsedTime += deltaTime;
        
        // Calculate progress
        this.progress = Math.min(100, Math.floor((this.params.elapsedTime / duration) * 100));
    }
    
    /**
     * Update for navigate-type objectives (go to location)
     * @param {Object} gameState - Current game state
     * @private
     */
    _updateNavigateObjective(gameState) {
        const targetPosition = this.params.position;
        const radius = this.params.radius || 50; // Default 50 units
        
        if (!targetPosition || !gameState.player) return;
        
        // Calculate distance to target
        const playerPos = gameState.player.position;
        const distance = Math.sqrt(
            Math.pow(playerPos.x - targetPosition.x, 2) +
            Math.pow(playerPos.y - targetPosition.y, 2) +
            Math.pow(playerPos.z - targetPosition.z, 2)
        );
        
        // Player is within target radius
        if (distance <= radius) {
            // If we need to stay in the area for a duration
            if (this.params.duration) {
                if (!this.params.timeInArea) {
                    this.params.timeInArea = 0;
                }
                
                this.params.timeInArea += gameState.deltaTime;
                this.progress = Math.min(100, Math.floor((this.params.timeInArea / this.params.duration) * 100));
            } else {
                // Just need to reach the area
                this.progress = 100;
            }
        } else {
            // Reset timer if we left the area
            if (this.params.duration) {
                this.params.timeInArea = 0;
            }
            
            // Calculate progress based on distance
            const maxDistance = this.params.maxDistance || 1000;
            const distanceProgress = Math.max(0, 100 - Math.floor((distance / maxDistance) * 100));
            this.progress = distanceProgress;
        }
    }
    
    /**
     * Update for escort-type objectives
     * @param {Object} gameState - Current game state
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _updateEscortObjective(gameState, deltaTime) {
        const targetId = this.params.targetId;
        const destinationPosition = this.params.destination;
        const radius = this.params.radius || 50;
        
        // Check if target exists
        let targetEntity = null;
        
        if (gameState.friendlies) {
            targetEntity = gameState.friendlies.find(f => f.id === targetId);
        }
        
        if (!targetEntity) {
            // Target destroyed, fail objective
            this.fail();
            return;
        }
        
        // Check if target reached destination
        if (destinationPosition) {
            const distance = Math.sqrt(
                Math.pow(targetEntity.position.x - destinationPosition.x, 2) +
                Math.pow(targetEntity.position.y - destinationPosition.y, 2) +
                Math.pow(targetEntity.position.z - destinationPosition.z, 2)
            );
            
            if (distance <= radius) {
                this.progress = 100;
            } else {
                // Calculate progress based on starting distance
                const startDistance = this.params.startDistance || 1000;
                const distanceProgress = Math.max(0, 100 - Math.floor((distance / startDistance) * 100));
                this.progress = distanceProgress;
            }
        } else {
            // Time-based escort (protect for X seconds)
            if (!this.params.elapsedTime) {
                this.params.elapsedTime = 0;
            }
            
            this.params.elapsedTime += deltaTime;
            const duration = this.params.duration || 60;
            
            this.progress = Math.min(100, Math.floor((this.params.elapsedTime / duration) * 100));
        }
    }
    
    /**
     * Update for time-based objectives
     * @param {Object} gameState - Current game state
     * @param {Number} deltaTime - Time since last update
     * @private
     */
    _updateTimeObjective(gameState, deltaTime) {
        // Survive for X time
        if (!this.params.elapsedTime) {
            this.params.elapsedTime = 0;
        }
        
        this.params.elapsedTime += deltaTime;
        const duration = this.params.duration || 60;
        
        this.progress = Math.min(100, Math.floor((this.params.elapsedTime / duration) * 100));
    }
    
    /**
     * Marks the objective as completed
     */
    complete() {
        this.state = 'completed';
        this.progress = 100;
    }
    
    /**
     * Marks the objective as failed
     */
    fail() {
        this.state = 'failed';
    }
    
    /**
     * Resets the objective to pending state
     */
    reset() {
        this.state = 'pending';
        this.progress = 0;
        this.wasTracked = false;
        
        // Reset any cached data
        delete this.params.elapsedTime;
        delete this.params.timeInArea;
    }
    
    /**
     * Checks if the objective is completed
     * @returns {Boolean} True if the objective is completed
     */
    isCompleted() {
        return this.state === 'completed';
    }
    
    /**
     * Checks if the objective is failed
     * @returns {Boolean} True if the objective is failed
     */
    isFailed() {
        return this.state === 'failed';
    }
    
    /**
     * Gets the objective's description
     * @returns {String} The objective description
     */
    getDescription() {
        return this.description;
    }
    
    /**
     * Gets the objective's progress
     * @returns {Number} Progress from 0-100
     */
    getProgress() {
        return this.progress;
    }
}