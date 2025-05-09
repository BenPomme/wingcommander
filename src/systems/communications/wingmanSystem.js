import * as BABYLON from 'babylonjs';
import { createSimpleSpacecraft } from '../../components/spacecraft';
import { createSpacecraftPhysics } from '../physics';
import { createWeaponSystem } from '../weapons';
import { WingmanAI } from './wingmanAI';

/**
 * Class representing the wingman system
 * Manages wingmen behavior, commands, and communications
 */
export class WingmanSystem {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.wingmen = [];
        this.activeWingman = 0;
        this.lastCommandTime = 0;
        
        // Command types and their respective actions
        this.commandTypes = {
            ATTACK_TARGET: 'attack_target',
            ATTACK_ENEMIES: 'attack_enemies',
            DEFEND_SELF: 'defend_self',
            FORM_UP: 'form_up',
            BREAK_AND_ATTACK: 'break_and_attack',
            COVER_ME: 'cover_me',
            RETURN_TO_BASE: 'return_to_base'
        };
        
        // Command messages to display to the player
        this.commandMessages = {
            [this.commandTypes.ATTACK_TARGET]: "Attacking your target!",
            [this.commandTypes.ATTACK_ENEMIES]: "Engaging hostiles!",
            [this.commandTypes.DEFEND_SELF]: "Breaking off to defend!",
            [this.commandTypes.FORM_UP]: "Forming on your wing!",
            [this.commandTypes.BREAK_AND_ATTACK]: "Breaking and attacking!",
            [this.commandTypes.COVER_ME]: "I've got your back!",
            [this.commandTypes.RETURN_TO_BASE]: "Returning to base!"
        };
    }
    
    /**
     * Creates a wingman and adds to the system
     * @param {Object} wingmanData - Wingman initialization data
     * @returns {Promise<Object>} The created wingman
     */
    async createWingman(wingmanData) {
        try {
            // Create the spacecraft
            const spacecraft = await createSimpleSpacecraft(this.scene, {
                type: wingmanData.craftType || 'friendly',
                color: new BABYLON.Color3(0, 0.5, 1) // Blue for friendlies
            });
            
            // Position relative to player if not specified
            if (!wingmanData.position) {
                const playerPos = this.gameState.player.position;
                const playerDirection = this.gameState.player.direction;
                
                // Calculate position on player's wing
                const right = BABYLON.Vector3.Cross(playerDirection, BABYLON.Vector3.Up()).normalize();
                const wingPosition = playerPos.add(right.scale(30)).add(playerDirection.scale(-20));
                
                spacecraft.position = wingPosition;
            } else {
                spacecraft.position = wingmanData.position;
            }
            
            // Setup physics
            const physics = createSpacecraftPhysics({
                maxSpeed: 20,
                acceleration: 0.025,
                deceleration: 0.01,
                rotationSpeed: 0.02,
                dampingFactor: 0.99,
                afterburnerMultiplier: 2.0
            });
            
            // Setup weapons
            const weapons = createWeaponSystem(this.scene, spacecraft, {
                hardpoints: [
                    { position: new BABYLON.Vector3(-1, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) },
                    { position: new BABYLON.Vector3(1, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) }
                ]
            });
            
            // Create AI
            const ai = new WingmanAI(spacecraft, physics, weapons, this.gameState);
            
            // Wingman entity
            const wingman = {
                id: wingmanData.id || `wingman_${this.wingmen.length + 1}`,
                callsign: wingmanData.callsign || `Alpha ${this.wingmen.length + 1}`,
                spacecraft: spacecraft,
                physics: physics,
                weapons: weapons,
                ai: ai,
                health: 100,
                shields: 100,
                energy: 100,
                state: 'idle',
                currentCommand: this.commandTypes.FORM_UP, // Default to forming up
                target: null,
                responseDelay: wingmanData.responseDelay || 1.5, // Seconds to delay responses
                commandQueue: [],
                lastMessageTime: 0,
                portrait: wingmanData.portrait || null,
                personality: wingmanData.personality || 'standard',
                
                // Method to damage the wingman
                damage: function(amount) {
                    // Apply to shields first
                    const shieldDamage = Math.min(this.shields, amount);
                    this.shields -= shieldDamage;
                    
                    // Remaining damage to hull
                    const hullDamage = amount - shieldDamage;
                    if (hullDamage > 0) {
                        this.health -= hullDamage;
                    }
                    
                    // Return true if destroyed
                    return this.health <= 0;
                },
                
                // Method to recharge shields/energy
                recharge: function(deltaTime) {
                    // Shield recharge
                    if (this.shields < 100 && this.energy > 10) {
                        const shieldRecharge = 3 * deltaTime; // 3 points per second
                        this.shields = Math.min(100, this.shields + shieldRecharge);
                        this.energy = Math.max(0, this.energy - shieldRecharge * 0.5);
                    }
                    
                    // Energy recharge
                    this.energy = Math.min(100, this.energy + 5 * deltaTime); // 5 points per second
                }
            };
            
            // Add to wingmen array
            this.wingmen.push(wingman);
            
            return wingman;
        } catch (error) {
            console.error("Error creating wingman:", error);
            throw error;
        }
    }
    
    /**
     * Updates all wingmen
     * @param {Number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.gameState.player) return;
        
        // Potential targets for wingmen
        const potentialTargets = this.gameState.enemies || [];
        
        // Update each wingman
        this.wingmen.forEach(wingman => {
            // Skip destroyed wingmen
            if (wingman.health <= 0) return;
            
            // Recharge systems
            wingman.recharge(deltaTime);
            
            // Process command queue
            if (wingman.commandQueue.length > 0 && 
                (Date.now() - wingman.lastMessageTime) > wingman.responseDelay * 1000) {
                
                const command = wingman.commandQueue.shift();
                this._executeWingmanCommand(wingman, command);
                
                // Mark time of response
                wingman.lastMessageTime = Date.now();
            }
            
            // Update wingman AI based on current command
            wingman.ai.update(deltaTime, potentialTargets, wingman.currentCommand);
            
            // Update physics
            const inputs = wingman.ai.getInputs();
            wingman.physics.update(wingman.spacecraft, { keys: inputs }, deltaTime);
            
            // Update weapons
            if (wingman.weapons) {
                wingman.weapons.update(deltaTime);
                
                // Let AI fire weapons based on its decisions
                if (wingman.ai.shouldFire() && wingman.energy > 0) {
                    const result = wingman.weapons.fire(wingman.energy);
                    if (result.success) {
                        wingman.energy -= result.energyCost;
                    }
                }
                
                // Check for hits on enemies
                potentialTargets.forEach(enemy => {
                    const hitResult = wingman.weapons.checkHits(enemy);
                    if (hitResult.hit) {
                        // Apply damage to enemy
                        const isDestroyed = enemy.damage(hitResult.damage);
                        
                        // Remove projectile
                        wingman.weapons.removeProjectile(hitResult.projectile);
                        
                        // If enemy is destroyed, find a new target
                        if (isDestroyed && wingman.target === enemy) {
                            wingman.target = null;
                            
                            // Report kill
                            this._sendWingmanMessage(wingman, "Enemy down!");
                        }
                    }
                });
            }
            
            // Check for collision with enemies
            if (this.gameState.collisionSystem) {
                const collisions = this.gameState.collisionSystem.getCollisionsForEntity(wingman.spacecraft);
                
                collisions.forEach(collision => {
                    const otherEntity = collision.entityA === wingman.spacecraft ? 
                        collision.entityB : collision.entityA;
                    
                    // Damage calculation based on collision properties
                    const damage = 10; // Base damage
                    
                    // Apply damage to wingman
                    const isDestroyed = wingman.damage(damage);
                    
                    if (isDestroyed) {
                        // Wingman was destroyed, send message
                        this._sendWingmanMessage(wingman, "I'm hit! Ejecting...");
                        
                        // Trigger destruction effects would go here
                    } else if (damage > 0) {
                        // Wingman was damaged but survived
                        this._sendWingmanMessage(wingman, "Taking damage!");
                    }
                });
            }
        });
    }
    
    /**
     * Issues a command to the active wingman
     * @param {String} commandType - Type of command from this.commandTypes
     * @param {Object} params - Additional parameters for the command
     */
    issueCommand(commandType, params = {}) {
        // Get active wingman
        const wingman = this.getActiveWingman();
        if (!wingman) return false;
        
        // Queue command for processing
        wingman.commandQueue.push({
            type: commandType,
            params: params,
            time: Date.now()
        });
        
        // Record command time
        this.lastCommandTime = Date.now();
        
        // Notify player that command was issued
        if (this.gameState.hud) {
            this.gameState.hud.showMessage(
                `Command issued to ${wingman.callsign}`, 
                2, 
                "Comms"
            );
        }
        
        return true;
    }
    
    /**
     * Executes a command for a specific wingman
     * @param {Object} wingman - The wingman to execute the command
     * @param {Object} command - The command to execute
     * @private
     */
    _executeWingmanCommand(wingman, command) {
        // Set current command
        wingman.currentCommand = command.type;
        
        // Store target if provided
        if (command.params.target) {
            wingman.target = command.params.target;
        }
        
        // Send acknowledgement message
        const message = this.commandMessages[command.type] || "Acknowledged.";
        this._sendWingmanMessage(wingman, message);
        
        // Update AI state based on command
        switch (command.type) {
            case this.commandTypes.ATTACK_TARGET:
                // Check if player has a target
                if (this.gameState.playerTargeting && 
                    this.gameState.playerTargeting.getCurrentTarget()) {
                    
                    wingman.target = this.gameState.playerTargeting.getCurrentTarget();
                    wingman.ai.setState('attack', { target: wingman.target });
                } else {
                    // No target, fall back to default
                    this._sendWingmanMessage(wingman, "No target selected, sir!");
                    wingman.currentCommand = this.commandTypes.FORM_UP;
                    wingman.ai.setState('follow', { target: this.gameState.player });
                }
                break;
                
            case this.commandTypes.ATTACK_ENEMIES:
                wingman.ai.setState('attack_all');
                break;
                
            case this.commandTypes.DEFEND_SELF:
                wingman.ai.setState('defend');
                break;
                
            case this.commandTypes.FORM_UP:
                wingman.ai.setState('follow', { target: this.gameState.player });
                break;
                
            case this.commandTypes.BREAK_AND_ATTACK:
                wingman.ai.setState('break_attack');
                break;
                
            case this.commandTypes.COVER_ME:
                wingman.ai.setState('protect', { target: this.gameState.player });
                break;
                
            case this.commandTypes.RETURN_TO_BASE:
                // Find the carrier if available
                let carrier = null;
                if (this.gameState.carrierLandingSystem && 
                    this.gameState.carrierLandingSystem.carrier) {
                    carrier = this.gameState.carrierLandingSystem.carrier;
                }
                
                if (carrier) {
                    wingman.ai.setState('return_to_carrier', { carrier: carrier });
                } else {
                    this._sendWingmanMessage(wingman, "No carrier detected, maintaining position.");
                    wingman.currentCommand = this.commandTypes.FORM_UP;
                    wingman.ai.setState('follow', { target: this.gameState.player });
                }
                break;
        }
    }
    
    /**
     * Sends a message from a wingman to the player
     * @param {Object} wingman - The wingman sending the message
     * @param {String} text - Message text
     * @private
     */
    _sendWingmanMessage(wingman, text) {
        if (this.gameState.hud) {
            this.gameState.hud.showMessage(text, 3, wingman.callsign);
        }
    }
    
    /**
     * Gets the active wingman
     * @returns {Object} The active wingman or null
     */
    getActiveWingman() {
        if (this.wingmen.length === 0) return null;
        
        // Make sure index is valid
        this.activeWingman = Math.min(this.activeWingman, this.wingmen.length - 1);
        
        return this.wingmen[this.activeWingman];
    }
    
    /**
     * Cycles to the next wingman
     */
    cycleWingman() {
        if (this.wingmen.length === 0) return;
        
        this.activeWingman = (this.activeWingman + 1) % this.wingmen.length;
        
        // Notify which wingman is active
        const wingman = this.getActiveWingman();
        if (wingman && this.gameState.hud) {
            this.gameState.hud.showMessage(`${wingman.callsign} active.`, 2, "Comms");
        }
    }
    
    /**
     * Gets a wingman by ID
     * @param {String} id - The wingman ID
     * @returns {Object} The wingman or null if not found
     */
    getWingmanById(id) {
        return this.wingmen.find(w => w.id === id) || null;
    }
    
    /**
     * Adds an existing spacecraft as a wingman
     * @param {Object} spacecraft - The spacecraft to add
     * @param {String} callsign - The wingman's callsign
     * @returns {Object} The created wingman
     */
    addExistingSpacecraftAsWingman(spacecraft, callsign) {
        // Create physics for the spacecraft if it doesn't have one
        const physics = spacecraft.physics || createSpacecraftPhysics({
            maxSpeed: 20,
            acceleration: 0.025,
            deceleration: 0.01,
            rotationSpeed: 0.02,
            dampingFactor: 0.99,
            afterburnerMultiplier: 2.0
        });
        
        // Create weapons for the spacecraft if it doesn't have them
        const weapons = spacecraft.weapons || createWeaponSystem(this.scene, spacecraft, {
            hardpoints: [
                { position: new BABYLON.Vector3(-1, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) },
                { position: new BABYLON.Vector3(1, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) }
            ]
        });
        
        // Create AI
        const ai = new WingmanAI(spacecraft, physics, weapons, this.gameState);
        
        // Wingman entity
        const wingman = {
            id: `wingman_${this.wingmen.length + 1}`,
            callsign: callsign || `Alpha ${this.wingmen.length + 1}`,
            spacecraft: spacecraft,
            physics: physics,
            weapons: weapons,
            ai: ai,
            health: spacecraft.health || 100,
            shields: spacecraft.shields || 100,
            energy: spacecraft.energy || 100,
            state: 'idle',
            currentCommand: this.commandTypes.FORM_UP, // Default to forming up
            target: null,
            responseDelay: 1.5, // Seconds to delay responses
            commandQueue: [],
            lastMessageTime: 0,
            
            // Method to damage the wingman
            damage: function(amount) {
                // Apply to shields first
                const shieldDamage = Math.min(this.shields, amount);
                this.shields -= shieldDamage;
                
                // Remaining damage to hull
                const hullDamage = amount - shieldDamage;
                if (hullDamage > 0) {
                    this.health -= hullDamage;
                }
                
                // Return true if destroyed
                return this.health <= 0;
            },
            
            // Method to recharge shields/energy
            recharge: function(deltaTime) {
                // Shield recharge
                if (this.shields < 100 && this.energy > 10) {
                    const shieldRecharge = 3 * deltaTime; // 3 points per second
                    this.shields = Math.min(100, this.shields + shieldRecharge);
                    this.energy = Math.max(0, this.energy - shieldRecharge * 0.5);
                }
                
                // Energy recharge
                this.energy = Math.min(100, this.energy + 5 * deltaTime); // 5 points per second
            }
        };
        
        // Add to wingmen array
        this.wingmen.push(wingman);
        
        return wingman;
    }
    
    /**
     * Disposes of all resources used by the wingman system
     */
    dispose() {
        // Dispose of wingmen
        this.wingmen.forEach(wingman => {
            if (wingman.spacecraft && wingman.spacecraft.dispose) {
                wingman.spacecraft.dispose();
            }
            
            if (wingman.weapons && wingman.weapons.dispose) {
                wingman.weapons.dispose();
            }
        });
        
        this.wingmen = [];
    }
}

/**
 * Creates a wingman system
 * @param {BABYLON.Scene} scene - The scene
 * @param {Object} gameState - The game state
 * @returns {WingmanSystem} The wingman system
 */
export function createWingmanSystem(scene, gameState) {
    return new WingmanSystem(scene, gameState);
}