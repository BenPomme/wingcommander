import * as BABYLON from 'babylonjs';
import { EventManager } from './eventManager';
import { MissionObjective } from './missionObjective';

/**
 * Class representing the mission system
 * Manages mission loading, objectives, and state tracking
 */
export class MissionSystem {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.currentMission = null;
        this.missionComplete = false;
        this.missionSuccess = false;
        this.objectives = [];
        this.events = new EventManager();
        this.scoreTracker = {
            enemiesDestroyed: 0,
            damageReceived: 0,
            timeElapsed: 0,
            objectivesCompleted: 0,
            totalObjectives: 0
        };
        
        // Player performance metrics (from 0-100)
        this.performance = {
            combat: 0,     // Based on enemies destroyed vs. ammo used
            piloting: 0,   // Based on hit/miss ratio and damage avoided
            tactics: 0,    // Based on mission objectives completion and time
            overall: 0     // Weighted average of the above
        };
    }
    
    /**
     * Load a mission from a JSON definition
     * @param {Object} missionData - The mission data object
     * @returns {Promise} Promise that resolves when mission is loaded
     */
    loadMission(missionData) {
        return new Promise((resolve, reject) => {
            try {
                this.currentMission = missionData;
                this.missionComplete = false;
                this.missionSuccess = false;
                
                // Reset score tracking
                this.scoreTracker = {
                    enemiesDestroyed: 0,
                    damageReceived: 0,
                    timeElapsed: 0,
                    objectivesCompleted: 0,
                    totalObjectives: 0
                };
                
                // Load mission objectives
                this.objectives = [];
                if (missionData.objectives) {
                    missionData.objectives.forEach(objectiveData => {
                        const objective = new MissionObjective(
                            objectiveData.id,
                            objectiveData.type,
                            objectiveData.description,
                            objectiveData.params,
                            objectiveData.required,
                            objectiveData.order
                        );
                        this.objectives.push(objective);
                    });
                }
                
                // Sort objectives by order if specified
                this.objectives.sort((a, b) => (a.order || 0) - (b.order || 0));
                
                // Update total objectives count
                this.scoreTracker.totalObjectives = this.objectives.length;
                
                // Set up environment if specified in mission data
                if (missionData.environment && this.gameState.environmentManager) {
                    this.gameState.environmentManager.createEnvironment(missionData.environment);
                }
                
                // Set up mission start event triggers
                if (missionData.events && missionData.events.onStart) {
                    this.events.scheduleEvent('missionStart', 0, () => {
                        this._triggerEventActions(missionData.events.onStart);
                    });
                }
                
                resolve(true);
            } catch (error) {
                console.error('Error loading mission:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Updates the mission system
     * @param {Number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.currentMission || this.missionComplete) return;
        
        // Update time elapsed
        this.scoreTracker.timeElapsed += deltaTime;
        
        // Update event manager
        this.events.update(deltaTime);
        
        // Update objectives
        this.objectives.forEach(objective => {
            if (!objective.isCompleted()) {
                objective.update(this.gameState, deltaTime);
                
                // Check if objective was just completed
                if (objective.isCompleted() && !objective.wasTracked) {
                    objective.wasTracked = true;
                    this.scoreTracker.objectivesCompleted++;
                    
                    // Trigger onComplete events for this objective
                    if (this.currentMission.events && 
                        this.currentMission.events.objectives && 
                        this.currentMission.events.objectives[objective.id] && 
                        this.currentMission.events.objectives[objective.id].onComplete) {
                        this._triggerEventActions(this.currentMission.events.objectives[objective.id].onComplete);
                    }
                    
                    // Check if all required objectives are complete
                    if (this._checkMissionCompletion()) {
                        this.missionComplete = true;
                        this.missionSuccess = true;
                        
                        // Trigger mission complete events
                        if (this.currentMission.events && this.currentMission.events.onComplete) {
                            this._triggerEventActions(this.currentMission.events.onComplete);
                        }
                    }
                }
            }
        });
        
        // Check for time-based events
        if (this.currentMission.events && this.currentMission.events.timed) {
            this.currentMission.events.timed.forEach(timedEvent => {
                if (!timedEvent.triggered && this.scoreTracker.timeElapsed >= timedEvent.time) {
                    timedEvent.triggered = true;
                    this._triggerEventActions(timedEvent.actions);
                }
            });
        }
        
        // Check for mission failure conditions
        if (this.currentMission.failureConditions) {
            if (this._checkFailureConditions()) {
                this.missionComplete = true;
                this.missionSuccess = false;
                
                // Trigger mission failure events
                if (this.currentMission.events && this.currentMission.events.onFail) {
                    this._triggerEventActions(this.currentMission.events.onFail);
                }
            }
        }
        
        // Update performance metrics
        this._updatePerformanceMetrics();
    }
    
    /**
     * Checks if all required objectives are completed
     * @returns {Boolean} True if mission is complete
     * @private
     */
    _checkMissionCompletion() {
        const requiredObjectives = this.objectives.filter(obj => obj.required);
        return requiredObjectives.every(obj => obj.isCompleted());
    }
    
    /**
     * Checks mission failure conditions
     * @returns {Boolean} True if any failure condition is met
     * @private
     */
    _checkFailureConditions() {
        if (!this.currentMission.failureConditions) return false;
        
        // Check player death
        if (this.currentMission.failureConditions.playerDeath && 
            this.gameState.player && 
            this.gameState.player.health <= 0) {
            return true;
        }
        
        // Check friendly death
        if (this.currentMission.failureConditions.friendlyDeath && 
            this.gameState.friendlies) {
            const requiredFriendlies = this.gameState.friendlies.filter(
                f => this.currentMission.failureConditions.friendlyDeath.includes(f.id)
            );
            
            if (requiredFriendlies.some(f => f.health <= 0)) {
                return true;
            }
        }
        
        // Check time limit
        if (this.currentMission.failureConditions.timeLimit && 
            this.scoreTracker.timeElapsed > this.currentMission.failureConditions.timeLimit) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Trigger event actions
     * @param {Array} actions - List of actions to trigger
     * @private
     */
    _triggerEventActions(actions) {
        if (!actions || !Array.isArray(actions)) return;
        
        actions.forEach(action => {
            switch (action.type) {
                case 'spawnEnemy':
                    this._spawnEnemy(action.params);
                    break;
                case 'spawnFriendly':
                    this._spawnFriendly(action.params);
                    break;
                case 'message':
                    this._showMessage(action.params);
                    break;
                case 'setObjective':
                    this._setObjectiveState(action.params);
                    break;
                case 'playSound':
                    this._playSound(action.params);
                    break;
                case 'changeEnvironment':
                    this._changeEnvironment(action.params);
                    break;
                case 'endMission':
                    this.missionComplete = true;
                    this.missionSuccess = action.params.success;
                    break;
                default:
                    console.warn('Unknown action type:', action.type);
            }
        });
    }
    
    /**
     * Spawns an enemy or enemy formation at specified position
     * @param {Object} params - Enemy spawn parameters
     * @private
     */
    _spawnEnemy(params) {
        // Check if we have the createEnemyFormation function available
        if (this.gameState.createEnemyFormation) {
            // Convert position to BABYLON.Vector3
            const position = new BABYLON.Vector3(
                params.position.x,
                params.position.y,
                params.position.z
            );
            
            // Create enemy formation with updated options
            this.gameState.createEnemyFormation(
                this.scene,
                params.count || 1,
                {
                    formation: params.formation || 'vee',
                    position: position,
                    squadronType: params.squadronType,
                    leaderType: params.leaderType,
                    leaderDifficulty: params.leaderDifficulty,
                    specificTypes: params.specificTypes,
                    difficulty: params.difficulty || 'medium'
                }
            ).then(enemies => {
                if (this.gameState.enemies) {
                    // Add enemies to the main enemy array
                    this.gameState.enemies = this.gameState.enemies.concat(enemies);
                    
                    // Add to collision system if available
                    if (this.gameState.collisionSystem) {
                        enemies.forEach(enemy => {
                            enemy.colliderInfo = {
                                type: 'sphere',
                                size: 3
                            };
                            this.gameState.collisionSystem.addEntity(enemy);
                        });
                    }
                }
            });
        }
        // Fallback to single enemy if formation isn't available
        else if (this.gameState.enemyFactory) {
            this.gameState.enemyFactory.createEnemy(
                this.scene,
                {
                    position: new BABYLON.Vector3(
                        params.position.x,
                        params.position.y,
                        params.position.z
                    ),
                    shipType: params.shipType || params.type || 'kilrathi_dralthi',
                    difficulty: params.difficulty || 'medium'
                }
            ).then(enemy => {
                if (this.gameState.enemies) {
                    this.gameState.enemies.push(enemy);
                    
                    // Add to collision system if available
                    if (this.gameState.collisionSystem) {
                        enemy.colliderInfo = {
                            type: 'sphere',
                            size: 3
                        };
                        this.gameState.collisionSystem.addEntity(enemy);
                    }
                }
            });
        }
    }
    
    /**
     * Spawns a friendly ship at specified position
     * @param {Object} params - Friendly spawn parameters
     * @private
     */
    _spawnFriendly(params) {
        // Implementation depends on friendly ship factory
        // Similar to enemy spawning but for allies
        console.log('Spawning friendly:', params);
    }
    
    /**
     * Shows a message to the player
     * @param {Object} params - Message parameters
     * @private
     */
    _showMessage(params) {
        // Implementation depends on UI system
        if (this.gameState.ui && this.gameState.ui.showMessage) {
            this.gameState.ui.showMessage(
                params.text,
                params.duration || 5,
                params.sender,
                params.priority || 'normal'
            );
        } else {
            console.log('Mission Message:', params.text);
        }
    }
    
    /**
     * Sets an objective's state
     * @param {Object} params - Objective parameters
     * @private
     */
    _setObjectiveState(params) {
        const objective = this.objectives.find(obj => obj.id === params.id);
        if (objective) {
            if (params.state === 'complete') {
                objective.complete();
            } else if (params.state === 'fail') {
                objective.fail();
            } else if (params.state === 'reset') {
                objective.reset();
            }
        }
    }
    
    /**
     * Changes the space environment
     * @param {Object} params - Environment parameters
     * @private
     */
    _changeEnvironment(params) {
        if (!this.gameState.environmentManager) return;
        
        const environmentType = params.type || 'default';
        const options = params.options || {};
        
        // Create the new environment
        this.gameState.environmentManager.createEnvironment(environmentType, options);
        
        // Show a message if provided
        if (params.message && this.gameState.hud) {
            this.gameState.hud.showMessage(
                params.message,
                params.duration || 3,
                params.sender || 'System',
                params.priority || 'normal'
            );
        }
    }
    
    /**
     * Plays a sound effect or voice
     * @param {Object} params - Sound parameters
     * @private
     */
    _playSound(params) {
        // Implementation depends on audio system
        if (this.gameState.audioSystem && this.gameState.audioSystem.playSound) {
            this.gameState.audioSystem.playSound(
                params.sound,
                params.volume,
                params.loop
            );
        }
    }
    
    /**
     * Updates player performance metrics based on mission progress
     * @private
     */
    _updatePerformanceMetrics() {
        // Calculate combat performance
        // Based on enemies destroyed, accuracy, and damage dealt
        if (this.gameState.playerWeapons) {
            const shotsFired = this.gameState.playerWeapons.shotsFired || 0;
            const hits = this.gameState.playerWeapons.hits || 0;
            const accuracy = shotsFired > 0 ? hits / shotsFired : 0;
            
            this.performance.combat = Math.min(100, Math.floor(
                (this.scoreTracker.enemiesDestroyed * 20) + (accuracy * 50)
            ));
        }
        
        // Calculate piloting performance
        // Based on damage avoided and maneuvers
        const damageAvoidance = 100 - Math.min(100, this.scoreTracker.damageReceived);
        this.performance.piloting = damageAvoidance;
        
        // Calculate tactics performance
        // Based on objectives completed and time efficiency
        const objectiveCompletion = this.scoreTracker.totalObjectives > 0 ? 
            (this.scoreTracker.objectivesCompleted / this.scoreTracker.totalObjectives) * 100 : 0;
        
        let timeEfficiency = 100;
        if (this.currentMission.parTime && this.scoreTracker.timeElapsed > 0) {
            timeEfficiency = Math.max(0, 100 - 
                (this.scoreTracker.timeElapsed / this.currentMission.parTime - 1) * 50);
        }
        
        this.performance.tactics = Math.floor((objectiveCompletion * 0.7) + (timeEfficiency * 0.3));
        
        // Calculate overall performance
        this.performance.overall = Math.floor(
            (this.performance.combat * 0.4) + 
            (this.performance.piloting * 0.3) + 
            (this.performance.tactics * 0.3)
        );
    }
    
    /**
     * Gets the next mission recommendation based on performance
     * @returns {String} The ID of the recommended next mission
     */
    getNextMission() {
        if (!this.currentMission || !this.currentMission.nextMissions) {
            return null;
        }
        
        // Default to the first next mission
        let nextMissionId = this.currentMission.nextMissions[0];
        
        // For branching missions, use performance to determine path
        if (this.currentMission.nextMissions.length > 1 && this.missionSuccess) {
            // If overall performance is above threshold, take the success path
            if (this.performance.overall >= 70) {
                nextMissionId = this.currentMission.nextMissions[0]; // Success path
            } else {
                nextMissionId = this.currentMission.nextMissions[1]; // Failure path
            }
        }
        
        return nextMissionId;
    }
    
    /**
     * Gets all mission objectives
     * @returns {Array} List of mission objectives
     */
    getObjectives() {
        return this.objectives;
    }
    
    /**
     * Gets performance metrics from the mission
     * @returns {Object} Performance metrics
     */
    getPerformance() {
        return this.performance;
    }
    
    /**
     * Track an enemy destroyed
     */
    trackEnemyDestroyed() {
        this.scoreTracker.enemiesDestroyed++;
    }
    
    /**
     * Track damage received by player
     * @param {Number} amount - Amount of damage received
     */
    trackDamageReceived(amount) {
        this.scoreTracker.damageReceived += amount;
    }
    
    /**
     * Disposes resources used by the mission system
     */
    dispose() {
        // Clean up any resources
        this.objectives = [];
        this.events.clearAllEvents();
    }
}

/**
 * Creates a mission system
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} gameState - The game state object
 * @returns {MissionSystem} The mission system
 */
export function createMissionSystem(scene, gameState) {
    return new MissionSystem(scene, gameState);
}