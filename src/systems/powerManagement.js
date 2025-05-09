import * as BABYLON from 'babylonjs';

/**
 * Class for power management system
 * Handles shield and energy distribution for spacecraft
 */
export class PowerManagementSystem {
    constructor(options = {}) {
        // Configuration
        this.maxEnergy = options.maxEnergy || 100;
        this.maxShields = options.maxShields || 100;
        this.energyRechargeRate = options.energyRechargeRate || 5; // Units per second
        this.shieldRechargeRate = options.shieldRechargeRate || 3; // Units per second
        this.shieldRechargeEnergyCost = options.shieldRechargeEnergyCost || 0.5; // Energy per 1 shield point
        
        // System state
        this.energy = this.maxEnergy;
        this.shields = this.maxShields;
        this.shieldState = 'balanced'; // 'forward', 'balanced', 'rear'
        this.powerState = 'balanced'; // 'weapons', 'engines', 'shields', 'balanced'
        
        // Distribution of power
        this.powerDistribution = {
            weapons: 0.33, // Power to weapons (0-1)
            engines: 0.33, // Power to engines (0-1)
            shields: 0.34  // Power to shields (0-1)
        };
        
        // Real-time multipliers based on power distribution
        this.multipliers = {
            weapons: {
                damage: 1.0,
                cooldown: 1.0,
                energyCost: 1.0
            },
            engines: {
                speed: 1.0,
                acceleration: 1.0,
                energyCost: 1.0
            },
            shields: {
                strength: 1.0,
                rechargeRate: 1.0,
                energyCost: 1.0
            }
        };
        
        // Shield distribution (forward/rear)
        this.shieldDistribution = {
            forward: 0.5, // Percentage of shields on forward arc
            rear: 0.5     // Percentage of shields on rear arc
        };
        
        // Optional callbacks for effects
        this.onShieldHit = options.onShieldHit || null;
        this.onShieldDepleted = options.onShieldDepleted || null;
        this.onPowerStateChanged = options.onPowerStateChanged || null;
        this.onShieldStateChanged = options.onShieldStateChanged || null;
    }
    
    /**
     * Updates the power system
     * @param {Number} deltaTime - Time since last update in seconds
     * @param {Boolean} afterburnerActive - Whether afterburner is active
     */
    update(deltaTime, afterburnerActive = false) {
        // Recharge energy based on time (reduced when afterburner is active)
        const energyRechargeMultiplier = afterburnerActive ? 0.3 : 1.0;
        this.energy = Math.min(
            this.maxEnergy, 
            this.energy + (this.energyRechargeRate * energyRechargeMultiplier * deltaTime)
        );
        
        // Recharge shields if energy is available and shields are not full
        if (this.shields < this.maxShields && this.energy > 5) {
            // Calculate shield recharge, adjusted by power distribution
            const baseShieldRecharge = this.shieldRechargeRate * deltaTime;
            const adjustedShieldRecharge = baseShieldRecharge * this.multipliers.shields.rechargeRate;
            
            // Calculate energy cost for shield recharge
            const energyCost = adjustedShieldRecharge * this.shieldRechargeEnergyCost * this.multipliers.shields.energyCost;
            
            // Check if we have enough energy
            if (this.energy >= energyCost) {
                this.shields = Math.min(this.maxShields, this.shields + adjustedShieldRecharge);
                this.energy = Math.max(0, this.energy - energyCost);
            }
        }
    }
    
    /**
     * Sets the power state, redistributing power among systems
     * @param {String} state - Power state ('weapons', 'engines', 'shields', 'balanced')
     */
    setPowerState(state) {
        const oldState = this.powerState;
        this.powerState = state;
        
        // Set power distribution based on state
        switch (state) {
            case 'weapons':
                this.powerDistribution = { weapons: 0.60, engines: 0.20, shields: 0.20 };
                break;
            case 'engines':
                this.powerDistribution = { weapons: 0.20, engines: 0.60, shields: 0.20 };
                break;
            case 'shields':
                this.powerDistribution = { weapons: 0.20, engines: 0.20, shields: 0.60 };
                break;
            case 'balanced':
            default:
                this.powerDistribution = { weapons: 0.33, engines: 0.33, shields: 0.34 };
                break;
        }
        
        // Update multipliers based on power distribution
        this._updateMultipliers();
        
        // Trigger callback if state changed
        if (oldState !== this.powerState && this.onPowerStateChanged) {
            this.onPowerStateChanged(this.powerState, this.powerDistribution);
        }
    }
    
    /**
     * Sets the shield distribution between forward and rear
     * @param {String} state - Shield state ('forward', 'balanced', 'rear')
     */
    setShieldState(state) {
        const oldState = this.shieldState;
        this.shieldState = state;
        
        // Set shield distribution based on state
        switch (state) {
            case 'forward':
                this.shieldDistribution = { forward: 0.75, rear: 0.25 };
                break;
            case 'rear':
                this.shieldDistribution = { forward: 0.25, rear: 0.75 };
                break;
            case 'balanced':
            default:
                this.shieldDistribution = { forward: 0.50, rear: 0.50 };
                break;
        }
        
        // Trigger callback if state changed
        if (oldState !== this.shieldState && this.onShieldStateChanged) {
            this.onShieldStateChanged(this.shieldState, this.shieldDistribution);
        }
    }
    
    /**
     * Handles a hit on the shields
     * @param {Number} damage - Amount of damage received
     * @param {Boolean} isRearHit - Whether the hit was on the rear of the ship
     * @returns {Object} Result of the hit { shieldDamage, hullDamage, shieldsDown }
     */
    handleShieldHit(damage, isRearHit = false) {
        // Determine which shield arc takes the hit
        const shieldArc = isRearHit ? 'rear' : 'forward';
        
        // Calculate effective shields for this arc
        const effectiveShields = this.shields * this.shieldDistribution[shieldArc];
        
        // Calculate damage to shields
        const shieldDamage = Math.min(effectiveShields, damage);
        
        // Calculate remaining damage that passes through to hull
        const hullDamage = damage - shieldDamage;
        
        // Reduce total shields
        this.shields = Math.max(0, this.shields - shieldDamage);
        
        // Check if shields are down
        const shieldsDown = this.shields <= 0;
        
        // Trigger hit effect callback
        if (this.onShieldHit && shieldDamage > 0) {
            this.onShieldHit(shieldArc, damage, shieldDamage);
        }
        
        // Trigger shield depleted callback
        if (shieldsDown && this.onShieldDepleted) {
            this.onShieldDepleted();
        }
        
        return {
            shieldDamage: shieldDamage,
            hullDamage: hullDamage,
            shieldsDown: shieldsDown
        };
    }
    
    /**
     * Consumes energy for a system
     * @param {String} system - System using energy ('weapons', 'engines', 'shields')
     * @param {Number} amount - Base amount of energy required
     * @returns {Object} Result of energy request { success, energyCost }
     */
    consumeEnergy(system, amount) {
        // Apply system-specific energy multiplier
        const adjustedAmount = amount * this.multipliers[system].energyCost;
        
        // Check if enough energy is available
        if (this.energy < adjustedAmount) {
            return {
                success: false,
                energyCost: 0
            };
        }
        
        // Consume energy
        this.energy -= adjustedAmount;
        
        return {
            success: true,
            energyCost: adjustedAmount
        };
    }
    
    /**
     * Gets the current power distribution
     * @returns {Object} Current power distribution
     */
    getPowerDistribution() {
        return { ...this.powerDistribution };
    }
    
    /**
     * Gets the current shield distribution
     * @returns {Object} Current shield distribution
     */
    getShieldDistribution() {
        return { ...this.shieldDistribution };
    }
    
    /**
     * Gets the current system multipliers
     * @returns {Object} Current multipliers for all systems
     */
    getMultipliers() {
        return JSON.parse(JSON.stringify(this.multipliers)); // Deep copy
    }
    
    /**
     * Gets the multiplier for a specific system and property
     * @param {String} system - The system ('weapons', 'engines', 'shields')
     * @param {String} property - The property (e.g., 'damage', 'cooldown', 'speed')
     * @returns {Number} The multiplier value
     */
    getMultiplier(system, property) {
        if (this.multipliers[system] && this.multipliers[system][property] !== undefined) {
            return this.multipliers[system][property];
        }
        return 1.0; // Default multiplier if not found
    }
    
    /**
     * Updates the system multipliers based on current power distribution
     * @private
     */
    _updateMultipliers() {
        // Power to weapons affects damage, cooldown and energy cost
        this.multipliers.weapons.damage = 0.7 + (this.powerDistribution.weapons * 0.9); // 0.7-1.6
        this.multipliers.weapons.cooldown = 1.5 - (this.powerDistribution.weapons * 1.0); // 1.5-0.5
        this.multipliers.weapons.energyCost = 1.2 - (this.powerDistribution.weapons * 0.6); // 1.2-0.6
        
        // Power to engines affects speed, acceleration and energy cost
        this.multipliers.engines.speed = 0.8 + (this.powerDistribution.engines * 0.6); // 0.8-1.4
        this.multipliers.engines.acceleration = 0.7 + (this.powerDistribution.engines * 0.9); // 0.7-1.6
        this.multipliers.engines.energyCost = 1.2 - (this.powerDistribution.engines * 0.6); // 1.2-0.6
        
        // Power to shields affects strength, recharge rate and energy cost
        this.multipliers.shields.strength = 0.7 + (this.powerDistribution.shields * 0.9); // 0.7-1.6
        this.multipliers.shields.rechargeRate = 0.5 + (this.powerDistribution.shields * 1.5); // 0.5-2.0
        this.multipliers.shields.energyCost = 1.3 - (this.powerDistribution.shields * 0.9); // 1.3-0.4
    }
    
    /**
     * Gets the current state of all power systems
     * @returns {Object} Complete power system state
     */
    getState() {
        return {
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            shields: this.shields,
            maxShields: this.maxShields,
            powerState: this.powerState,
            shieldState: this.shieldState,
            powerDistribution: { ...this.powerDistribution },
            shieldDistribution: { ...this.shieldDistribution },
            multipliers: JSON.parse(JSON.stringify(this.multipliers))
        };
    }
    
    /**
     * Fast recharge of shields (e.g., for repair stations, pickups)
     * @param {Number} amount - Amount to recharge
     */
    rechargeShields(amount) {
        this.shields = Math.min(this.maxShields, this.shields + amount);
    }
    
    /**
     * Fast recharge of energy (e.g., for energy pickups)
     * @param {Number} amount - Amount to recharge
     */
    rechargeEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
}

/**
 * Factory function to create a power management system
 * @param {Object} options - Configuration options
 * @returns {PowerManagementSystem} The power management system
 */
export function createPowerManagementSystem(options = {}) {
    return new PowerManagementSystem(options);
}