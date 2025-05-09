import * as BABYLON from 'babylonjs';

/**
 * Physics class for spacecraft
 * Implements a hybrid system between arcade and Newtonian physics
 */
export class SpacecraftPhysics {
    constructor(options = {}) {
        // Configuration
        this.maxSpeed = options.maxSpeed || 20;
        this.acceleration = options.acceleration || 0.05;
        this.deceleration = options.deceleration || 0.02;
        this.rotationSpeed = options.rotationSpeed || 0.03;
        this.dampingFactor = options.dampingFactor || 0.98;
        this.afterburnerMultiplier = options.afterburnerMultiplier || 2.0;
        this.angularDampingFactor = options.angularDampingFactor || 0.95;
        
        // Progressive acceleration curve if provided
        this.accelerationCurve = options.accelerationCurve || null;
        
        // Store base values for reference
        this.baseMaxSpeed = this.maxSpeed;
        this.baseAcceleration = this.acceleration;
        
        // State
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.angularVelocity = new BABYLON.Vector3(0, 0, 0);
        this.afterburnerActive = false;
        this.boost = 1.0; // Normal speed
        this.currentSpeed = 0; // For speed gauge
        
        // Input state
        this.thrustInput = 0;      // -1 to 1 (backward to forward)
        this.strafeInput = 0;      // -1 to 1 (left to right)
        this.verticalInput = 0;    // -1 to 1 (down to up)
        this.pitchInput = 0;       // -1 to 1 (nose down to nose up)
        this.yawInput = 0;         // -1 to 1 (nose left to nose right)
        this.rollInput = 0;        // -1 to 1 (roll left to roll right)
    }
    
    /**
     * Updates the spacecraft's movement based on input and physics simulation
     * @param {BABYLON.TransformNode} spacecraft - The spacecraft to update
     * @param {Object} inputs - The input state 
     * @param {Number} deltaTime - Time since last update
     */
    update(spacecraft, inputs, deltaTime) {
        // Set input based on keyboard state
        this._processInput(inputs);
        
        // Calculate effective acceleration based on afterburner state
        const effectiveAcceleration = this.acceleration * this.boost;
        
        // Update velocity based on inputs and current direction
        this._updateVelocity(spacecraft, effectiveAcceleration, deltaTime);
        
        // Update angular velocity for rotations
        this._updateAngularVelocity(deltaTime);
        
        // Apply velocity to position
        spacecraft.position.addInPlace(
            this.velocity.scale(deltaTime)
        );
        
        // Apply angular velocity to rotation
        this._applyAngularVelocity(spacecraft, deltaTime);
        
        // Update the spacecraft's direction vector
        spacecraft.direction = new BABYLON.Vector3(0, 0, 1);
        spacecraft.direction = BABYLON.Vector3.TransformNormal(
            spacecraft.direction, 
            spacecraft.getWorldMatrix()
        );
    }
    
    /**
     * Process input to set the control state
     * @param {Object} inputs - The input state object
     */
    _processInput(inputs) {
        // Reset all inputs
        this.thrustInput = 0;
        this.strafeInput = 0;
        this.verticalInput = 0;
        this.pitchInput = 0;
        this.yawInput = 0;
        this.rollInput = 0;
        
        // Process keyboard input
        if (inputs.keys['w']) this.thrustInput = 1;
        if (inputs.keys['s']) this.thrustInput = -1;
        if (inputs.keys['a']) this.yawInput = 1;
        if (inputs.keys['d']) this.yawInput = -1;
        if (inputs.keys['q']) this.rollInput = 1;
        if (inputs.keys['e']) this.rollInput = -1;
        if (inputs.keys['ArrowUp']) this.pitchInput = 1;
        if (inputs.keys['ArrowDown']) this.pitchInput = -1;
        if (inputs.keys['ArrowLeft']) this.strafeInput = -1;
        if (inputs.keys['ArrowRight']) this.strafeInput = 1;
        if (inputs.keys['Shift']) {
            this.afterburnerActive = true;
            this.boost = this.afterburnerMultiplier;
        } else {
            this.afterburnerActive = false;
            this.boost = 1.0;
        }
    }
    
    /**
     * Update spacecraft velocity based on inputs and orientation
     * @param {BABYLON.TransformNode} spacecraft - The spacecraft transform
     * @param {Number} baseAcceleration - Base acceleration value
     * @param {Number} deltaTime - Time since last update
     */
    _updateVelocity(spacecraft, baseAcceleration, deltaTime) {
        // Get spacecraft orientation vectors
        const forward = spacecraft.direction;
        const right = BABYLON.Vector3.Cross(forward, BABYLON.Vector3.Up()).normalize();
        const up = BABYLON.Vector3.Cross(right, forward).normalize();
        
        // Get current speed for adaptive acceleration
        const currentSpeed = this.velocity.length();
        this.currentSpeed = currentSpeed; // Store for speed gauge
        
        // Calculate acceleration based on current speed using the acceleration curve
        let acceleration = baseAcceleration;
        
        if (this.accelerationCurve) {
            const curve = this.accelerationCurve;
            
            // Interpolate acceleration based on current speed
            if (currentSpeed <= curve.startSpeed) {
                acceleration = curve.startAccel;
            } else if (currentSpeed >= curve.endSpeed) {
                acceleration = curve.endAccel;
            } else if (currentSpeed <= curve.midSpeed) {
                // Interpolate between start and mid acceleration
                const t = (currentSpeed - curve.startSpeed) / (curve.midSpeed - curve.startSpeed);
                acceleration = curve.startAccel + t * (curve.midAccel - curve.startAccel);
            } else {
                // Interpolate between mid and end acceleration
                const t = (currentSpeed - curve.midSpeed) / (curve.endSpeed - curve.midSpeed);
                acceleration = curve.midAccel + t * (curve.endAccel - curve.midAccel);
            }
        }
        
        // Apply afterburner boost to acceleration
        if (this.afterburnerActive) {
            acceleration *= this.afterburnerMultiplier;
        }
        
        // Scale acceleration by delta time for more consistent movement
        const scaledAcceleration = acceleration * deltaTime * 60;
        
        // Apply thrust acceleration in the appropriate directions
        if (this.thrustInput !== 0) {
            const thrustForce = forward.scale(this.thrustInput * scaledAcceleration);
            this.velocity.addInPlace(thrustForce);
        }
        
        // Apply strafing forces (side-to-side movement)
        if (this.strafeInput !== 0) {
            const strafeForce = right.scale(this.strafeInput * scaledAcceleration * 0.5);
            this.velocity.addInPlace(strafeForce);
        }
        
        // Apply vertical thrust
        if (this.verticalInput !== 0) {
            const verticalForce = up.scale(this.verticalInput * scaledAcceleration * 0.5);
            this.velocity.addInPlace(verticalForce);
        }
        
        // Apply dampening (simulates space drag or control thrusters auto-stabilizing)
        this.velocity.scaleInPlace(Math.pow(this.dampingFactor, deltaTime * 60));
        
        // Limit speed
        const maxAllowedSpeed = this.maxSpeed * this.boost;
        
        if (currentSpeed > maxAllowedSpeed) {
            this.velocity.scaleInPlace(maxAllowedSpeed / currentSpeed);
        }
        
        // Update current speed after all calculations
        this.currentSpeed = this.velocity.length();
        
        // Add a minimum movement threshold to prevent ultra-slow drifting
        if (this.currentSpeed < 0.01) {
            this.velocity.scaleInPlace(0);
            this.currentSpeed = 0;
        }
    }
    
    /**
     * Update angular velocity based on input
     * @param {Number} deltaTime - Time since last update
     */
    _updateAngularVelocity(deltaTime) {
        // Scale rotation speed by delta time for more consistent rotation across frame rates
        const scaledRotationSpeed = this.rotationSpeed * deltaTime * 60;
        
        // Apply rotational inputs to angular velocity - directly for more responsive feel
        if (this.pitchInput !== 0) {
            // More direct control for pitch - less inertia
            const targetPitch = this.pitchInput * this.rotationSpeed * 1.5;
            this.angularVelocity.x = BABYLON.Scalar.Lerp(
                this.angularVelocity.x,
                targetPitch,
                0.3
            );
        }
        
        if (this.yawInput !== 0) {
            // More direct control for yaw - less inertia
            const targetYaw = this.yawInput * this.rotationSpeed * 1.2;
            this.angularVelocity.y = BABYLON.Scalar.Lerp(
                this.angularVelocity.y,
                targetYaw,
                0.25
            );
        }
        
        if (this.rollInput !== 0) {
            // Traditional inertial feel for roll
            this.angularVelocity.z += this.rollInput * scaledRotationSpeed;
        }
        
        // Apply angular dampening (auto-stabilizes rotation)
        this.angularVelocity.scaleInPlace(Math.pow(this.angularDampingFactor, deltaTime * 60));
        
        // Stronger auto-stabilization when no input is applied
        if (this.pitchInput === 0) {
            this.angularVelocity.x *= 0.9;
        }
        
        if (this.yawInput === 0) {
            this.angularVelocity.y *= 0.9;
        }
        
        if (this.rollInput === 0) {
            this.angularVelocity.z *= 0.9;
        }
        
        // Limit angular velocity to prevent excessive spinning
        const maxAngularSpeed = 0.08;
        if (this.angularVelocity.length() > maxAngularSpeed) {
            this.angularVelocity.normalize().scaleInPlace(maxAngularSpeed);
        }
        
        // Stop very small rotations to prevent drift
        if (Math.abs(this.angularVelocity.x) < 0.001) this.angularVelocity.x = 0;
        if (Math.abs(this.angularVelocity.y) < 0.001) this.angularVelocity.y = 0;
        if (Math.abs(this.angularVelocity.z) < 0.001) this.angularVelocity.z = 0;
    }
    
    /**
     * Apply angular velocity to spacecraft's rotation
     * @param {BABYLON.TransformNode} spacecraft - The spacecraft transform
     * @param {Number} deltaTime - Time since last update
     */
    _applyAngularVelocity(spacecraft, deltaTime) {
        // Apply pitch (X-axis rotation)
        spacecraft.rotate(BABYLON.Axis.X, this.angularVelocity.x, BABYLON.Space.LOCAL);
        
        // Apply yaw (Y-axis rotation)
        spacecraft.rotate(BABYLON.Axis.Y, this.angularVelocity.y, BABYLON.Space.LOCAL);
        
        // Apply roll (Z-axis rotation)
        spacecraft.rotate(BABYLON.Axis.Z, this.angularVelocity.z, BABYLON.Space.LOCAL);
    }
    
    /**
     * Activates the afterburner
     */
    activateAfterburner() {
        this.afterburnerActive = true;
        this.boost = this.afterburnerMultiplier;
    }
    
    /**
     * Deactivates the afterburner
     */
    deactivateAfterburner() {
        this.afterburnerActive = false;
        this.boost = 1.0;
    }
    
    /**
     * Immediately stops all velocity and rotation
     */
    fullStop() {
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.angularVelocity = new BABYLON.Vector3(0, 0, 0);
    }
}

/**
 * Factory function to create a spacecraft physics instance
 * @param {Object} options - Configuration options
 * @returns {SpacecraftPhysics} A physics instance
 */
export function createSpacecraftPhysics(options = {}) {
    return new SpacecraftPhysics(options);
}