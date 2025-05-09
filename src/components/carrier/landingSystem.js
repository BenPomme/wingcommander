import * as BABYLON from 'babylonjs';
import { createCarrierModel } from './carrierModel';

/**
 * Class that manages the carrier landing and takeoff sequences
 */
export class CarrierLandingSystem {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.carrier = null;
        this.landingApproachActive = false;
        this.takeoffSequenceActive = false;
        this.landingClearanceRequested = false;
        this.landingClearanceGranted = false;
        this.autoLandActive = false;
        this.originalCamera = null;
        this.landingCamera = null;
        this.takeoffCamera = null;
        
        // Landing parameters
        this.landingParameters = {
            maxApproachSpeed: 100, // Max speed in KPS for landing
            approachCorridor: {
                width: 40,
                height: 10,
                centerY: 25
            },
            maxApproachAngle: 10, // Degrees from centerline
            minDistance: 1000, // Min distance to start auto-landing
            maxDistance: 4000 // Max distance to request landing clearance
        };
        
        // Initialize landing system
        this.initialize();
    }
    
    /**
     * Initializes the landing system
     */
    async initialize() {
        // Create carrier model
        this.carrier = await createCarrierModel(this.scene);
        // Position the carrier closer to the player's starting position
        this.carrier.position = new BABYLON.Vector3(0, 0, 200);
        
        // Add a debug message to show the carrier is created
        console.log("Carrier created and positioned at:", this.carrier.position);
        
        // Create cameras for landing/takeoff sequences
        this._createCameras();
        
        // Register detection zones
        this._createDetectionZones();
    }
    
    /**
     * Creates cameras for landing and takeoff sequences
     * @private
     */
    _createCameras() {
        // Store reference to original camera
        this.originalCamera = this.gameState.camera;
        
        // Create landing camera
        this.landingCamera = new BABYLON.ArcRotateCamera(
            'landingCamera',
            -Math.PI / 2,
            Math.PI / 3,
            30,
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );
        this.landingCamera.minZ = 0.1;
        this.landingCamera.inputs.clear(); // Clear default inputs to avoid conflicts
        this.landingCamera.setEnabled(false);
        
        // Create takeoff camera
        this.takeoffCamera = new BABYLON.ArcRotateCamera(
            'takeoffCamera',
            -Math.PI / 2,
            Math.PI / 3,
            20,
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );
        this.takeoffCamera.minZ = 0.1;
        this.takeoffCamera.inputs.clear(); // Clear default inputs to avoid conflicts
        this.takeoffCamera.setEnabled(false);
    }
    
    /**
     * Creates detection zones for landing approach
     * @private
     */
    _createDetectionZones() {
        // Create landing approach zone - a much larger area where landing approach can be initiated
        const approachZone = BABYLON.MeshBuilder.CreateBox("landingApproachZone", {
            width: 500,  // Wider to make it easier to find
            height: 200, // Taller to catch player at different altitudes
            depth: 800  // Much deeper to extend further in front of carrier
        }, this.scene);
        approachZone.position = new BABYLON.Vector3(0, 30, -200); // Position well in front of the carrier
        approachZone.parent = this.carrier;
        
        // Make the approach zone visible during debug
        approachZone.isVisible = true; // Visible for debugging
        approachZone.visibility = 0.2; // Semi-transparent
        
        // Create debug material for the approach zone
        const debugMaterial = new BABYLON.StandardMaterial("approachZoneMaterial", this.scene);
        debugMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
        debugMaterial.alpha = 0.2;
        approachZone.material = debugMaterial;
        
        approachZone.checkCollisions = false;
        
        // Make the approach zone detect the player
        this.scene.registerBeforeRender(() => {
            // Only process if we're not already in landing/takeoff mode
            if (!this.landingApproachActive && !this.takeoffSequenceActive) {
                // Check if player is in the approach zone
                if (this.gameState.player) {
                    const playerPos = this.gameState.player.position;
                    const carrierPos = this.carrier.position;
                    const relativePos = playerPos.subtract(carrierPos);
                    
                    // Calculate distance to carrier
                    const distance = BABYLON.Vector3.Distance(playerPos, carrierPos);
                    
                    // Debug output every few seconds
                    this._landingDebugTimer = (this._landingDebugTimer || 0) + this.scene.getEngine().getDeltaTime() / 1000;
                    if (this._landingDebugTimer > 5) {
                        console.log(`Player distance to carrier: ${distance.toFixed(0)}, relative Z: ${relativePos.z.toFixed(0)}`);
                        this._landingDebugTimer = 0;
                    }
                    
                    // Much more lenient check - player just needs to be somewhat near the carrier
                    if (distance <= this.landingParameters.maxDistance * 2) {  // Doubled detection range
                        // Show landing indicator in HUD continuously
                        if (this.gameState.hud) {
                            this.gameState.hud.showMessage("Press 'L' to request landing clearance", 2, "Nav Computer");
                        }
                        
                        // For debugging, make the approach zone more visible when player is nearby
                        approachZone.visibility = 0.4;
                    } else {
                        // Reset visibility when player is far away
                        approachZone.visibility = 0.2;
                    }
                }
            }
        });
    }
    
    /**
     * Requests landing clearance
     * @returns {Boolean} True if clearance is granted
     */
    requestLandingClearance() {
        if (this.landingClearanceRequested) {
            return this.landingClearanceGranted;
        }
        
        this.landingClearanceRequested = true;
        
        // Check if the player is in a valid position for landing
        const playerPos = this.gameState.player.position;
        const carrierPos = this.carrier.position;
        const relativePos = playerPos.subtract(carrierPos);
        const distance = BABYLON.Vector3.Distance(playerPos, carrierPos);
        
        // More lenient check - just need to be in vicinity of the carrier
        if (distance <= this.landingParameters.maxDistance * 2) {  // Doubled max distance
            
            // Log debug info about landing check
            console.log(`Landing clearance check: Distance: ${distance.toFixed(0)}, Max allowed: ${this.landingParameters.maxDistance * 2}`);
            
            // Always grant clearance in debug mode to make testing easier
            this.landingClearanceGranted = true;
            
            // Activate landing guides on the carrier
            this.carrier.activateLandingMode();
            
            // Show message in HUD
            if (this.gameState.hud) {
                this.gameState.hud.showMessage("Landing clearance granted. Approach when ready.", 5, "Tiger's Claw Control");
            }
            
            return true;
        } else {
            // Clearance denied due to position
            if (this.gameState.hud) {
                this.gameState.hud.showMessage("Landing clearance denied. Move to approach position.", 5, "Tiger's Claw Control");
            }
            
            // Reset request after a few seconds
            setTimeout(() => {
                this.landingClearanceRequested = false;
            }, 5000);
            
            return false;
        }
    }
    
    /**
     * Activates the landing approach mode
     */
    activateLandingApproach() {
        if (!this.landingClearanceGranted) {
            // Need clearance first
            if (this.gameState.hud) {
                this.gameState.hud.showMessage("Request landing clearance first (press 'L')", 3, "Nav Computer");
            }
            return;
        }
        
        this.landingApproachActive = true;
        
        // Switch to approach mode in HUD
        if (this.gameState.hud) {
            this.gameState.hud.showMessage("Approach mode activated. Maintain speed below 100 kps.", 5, "Nav Computer");
        }
    }
    
    /**
     * Checks if player is in the correct position and velocity for auto-landing
     * @returns {Boolean} True if player can auto-land
     */
    canAutoLand() {
        if (!this.landingApproachActive || !this.landingClearanceGranted) {
            return false;
        }
        
        const playerPos = this.gameState.player.position;
        const carrierPos = this.carrier.position;
        const relativePos = playerPos.subtract(carrierPos);
        const distance = BABYLON.Vector3.Distance(playerPos, carrierPos);
        
        // Debug check - just need to be near the carrier and have clearance
        console.log(`Auto-landing check: Distance: ${distance.toFixed(0)}`);
        
        // Make it easy to auto-land from anywhere near the carrier
        if (distance <= this.landingParameters.minDistance * 3) { // Triple the min distance
            // Get player velocity
            const playerVelocity = this.gameState.playerPhysics.velocity;
            const speed = playerVelocity.length();
            
            console.log(`Auto-landing check: Speed: ${speed.toFixed(0)} / ${this.landingParameters.maxApproachSpeed * 2}`);
            
            // More lenient speed check
            if (speed <= this.landingParameters.maxApproachSpeed * 2) { // Double the max speed
                return true;
            } else {
                // Give feedback about speed
                if (this.gameState.hud) {
                    this.gameState.hud.showMessage(`Reduce speed for auto-landing. Current: ${speed.toFixed(0)} KPS`, 2, "Nav Computer");
                }
            }
        }
        
        return false;
    }
    
    /**
     * Starts the auto-landing sequence
     */
    startAutoLanding() {
        if (!this.canAutoLand()) {
            return;
        }
        
        this.autoLandActive = true;
        
        // Message
        if (this.gameState.hud) {
            this.gameState.hud.showMessage("Auto-landing sequence initiated. Stand by.", 3, "Tiger's Claw Control");
        }
        
        // Disable player input
        this._disablePlayerControls();
        
        // Store the original camera parameters
        this.originalCameraPosition = this.gameState.camera.position.clone();
        this.originalCameraTarget = this.gameState.camera.target.clone();
        
        // Setup landing animation
        this._setupLandingAnimation();
    }
    
    /**
     * Sets up the landing animation sequence
     * @private
     */
    _setupLandingAnimation() {
        // Starting position
        const startPosition = this.gameState.player.position.clone();
        const startRotation = this.gameState.player.rotationQuaternion ? 
            this.gameState.player.rotationQuaternion.clone() : 
            BABYLON.Quaternion.RotationYawPitchRoll(
                this.gameState.player.rotation.y,
                this.gameState.player.rotation.x,
                this.gameState.player.rotation.z
            );
        
        // Target position on the carrier deck
        const targetPosition = new BABYLON.Vector3(
            this.carrier.position.x,
            this.carrier.position.y + 25, // Landing deck height
            this.carrier.position.z + 50  // Landing point on the deck
        );
        
        // Calculate total animation time based on distance
        const distance = BABYLON.Vector3.Distance(startPosition, targetPosition);
        const animationTime = Math.max(5, distance / 50); // At least 5 seconds
        
        // Create animation
        const landingAnimation = new BABYLON.Animation(
            "landingAnimation",
            "position",
            30, // FPS
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Define animation keyframes
        const keyFrames = [];
        
        // Start position
        keyFrames.push({
            frame: 0,
            value: startPosition
        });
        
        // Approach point 1 - align with the carrier
        const approach1 = new BABYLON.Vector3(
            this.carrier.position.x,
            startPosition.y,
            startPosition.z
        );
        keyFrames.push({
            frame: 30,
            value: approach1
        });
        
        // Approach point 2 - correct height
        const approach2 = new BABYLON.Vector3(
            this.carrier.position.x,
            targetPosition.y,
            startPosition.z
        );
        keyFrames.push({
            frame: 60,
            value: approach2
        });
        
        // Final approach - glide path
        const final1 = new BABYLON.Vector3(
            targetPosition.x,
            targetPosition.y,
            this.carrier.position.z
        );
        keyFrames.push({
            frame: animationTime * 30 - 30,
            value: final1
        });
        
        // Touchdown
        keyFrames.push({
            frame: animationTime * 30,
            value: targetPosition
        });
        
        // Set keyframes
        landingAnimation.setKeys(keyFrames);
        
        // Create rotation animation
        const rotationAnimation = new BABYLON.Animation(
            "rotationAnimation",
            "rotationQuaternion",
            30,
            BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Target rotation (facing forward on the carrier)
        const targetRotation = BABYLON.Quaternion.RotationYawPitchRoll(
            0, // Facing forward
            0, // Level
            0  // No roll
        );
        
        // Rotation keyframes
        const rotKeyFrames = [];
        
        // Start rotation
        rotKeyFrames.push({
            frame: 0,
            value: startRotation
        });
        
        // Intermediate rotation - aligned with carrier
        const midRotation = BABYLON.Quaternion.Slerp(
            startRotation,
            targetRotation,
            0.5
        );
        rotKeyFrames.push({
            frame: 60,
            value: midRotation
        });
        
        // Final rotation
        rotKeyFrames.push({
            frame: animationTime * 30,
            value: targetRotation
        });
        
        // Set rotation keyframes
        rotationAnimation.setKeys(rotKeyFrames);
        
        // Apply easing
        const easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        landingAnimation.setEasingFunction(easingFunction);
        rotationAnimation.setEasingFunction(easingFunction);
        
        // Add animations to player
        this.gameState.player.animations = [];
        this.gameState.player.animations.push(landingAnimation);
        this.gameState.player.animations.push(rotationAnimation);
        
        // Start landing animation
        this.scene.beginAnimation(
            this.gameState.player,
            0,
            animationTime * 30,
            false, // Not looping
            1.0, // Speed ratio
            () => {
                // Animation completed
                this._onLandingCompleted();
            }
        );
        
        // Switch to landing camera
        this._switchToLandingCamera();
    }
    
    /**
     * Called when landing animation is completed
     * @private
     */
    _onLandingCompleted() {
        // Hide player ship
        this.gameState.player.setEnabled(false);
        
        // Show landing completed message
        if (this.gameState.hud) {
            this.gameState.hud.showMessage("Landing successful. Welcome aboard Tiger's Claw.", 5, "Tiger's Claw Control");
        }
        
        // After a delay, show the debriefing or next mission options
        setTimeout(() => {
            this._completePostLanding();
        }, 2000);
    }
    
    /**
     * Completes the post-landing sequence
     * @private
     */
    _completePostLanding() {
        // Landing has successfully completed
        this.landingApproachActive = false;
        this.autoLandActive = false;
        this.landingClearanceGranted = false;
        this.landingClearanceRequested = false;
        
        // Deactivate landing guides
        this.carrier.deactivateLandingMode();
        
        // Return to main game view with mission complete status
        if (this.gameState.missionSystem) {
            // If mission system is available, mark mission as complete
            // and show debriefing screen
            if (this.gameState.hud) {
                this.gameState.hud.showMessage("Mission completed. Proceed to debriefing.", 5, "Wing Commander");
            }
            
            // Get mission performance
            const performance = this.gameState.missionSystem.getPerformance();
            
            // Show a simple on-screen message about performance
            if (this.gameState.hud) {
                setTimeout(() => {
                    this.gameState.hud.showMessage(
                        `Mission performance: Combat: ${performance.combat}%, Piloting: ${performance.piloting}%, Tactics: ${performance.tactics}%`,
                        10,
                        "Mission Control"
                    );
                }, 3000);
                
                // Ready for new mission message
                setTimeout(() => {
                    this.gameState.hud.showMessage(
                        "Press 'T' to launch for next mission when ready.",
                        5,
                        "Tiger's Claw Control"
                    );
                }, 8000);
            }
        }
    }
    
    /**
     * Initiates takeoff sequence
     */
    startTakeoff() {
        // If we're already in a takeoff or landing sequence, do nothing
        if (this.takeoffSequenceActive || this.landingApproachActive || this.autoLandActive) {
            return;
        }
        
        this.takeoffSequenceActive = true;
        
        // HUD message
        if (this.gameState.hud) {
            this.gameState.hud.showMessage("Takeoff sequence initiated. Stand by.", 3, "Tiger's Claw Control");
        }
        
        // Position player on the carrier
        this.gameState.player.position = new BABYLON.Vector3(
            this.carrier.position.x,
            this.carrier.position.y + 25, // Landing deck height
            this.carrier.position.z + 50  // Starting point on the deck
        );
        
        // Reset rotation
        this.gameState.player.rotation = new BABYLON.Vector3(0, 0, 0);
        if (this.gameState.player.rotationQuaternion) {
            this.gameState.player.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
        
        // Make player visible
        this.gameState.player.setEnabled(true);
        
        // Switch to takeoff camera
        this._switchToTakeoffCamera();
        
        // Disable player controls initially
        this._disablePlayerControls();
        
        // Start takeoff animation
        this._setupTakeoffAnimation();
    }
    
    /**
     * Sets up the takeoff animation sequence
     * @private
     */
    _setupTakeoffAnimation() {
        // Start position
        const startPosition = new BABYLON.Vector3(
            this.carrier.position.x,
            this.carrier.position.y + 25, // Deck height
            this.carrier.position.z + 50  // Start position
        );
        
        // End position (launched from the carrier)
        const endPosition = new BABYLON.Vector3(
            this.carrier.position.x,
            this.carrier.position.y + 30, // Slightly above deck
            this.carrier.position.z - 150 // Front of the carrier
        );
        
        // Create position animation
        const takeoffAnimation = new BABYLON.Animation(
            "takeoffAnimation",
            "position",
            30, // FPS
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Define keyframes
        const keyFrames = [];
        
        // Starting position
        keyFrames.push({
            frame: 0,
            value: startPosition
        });
        
        // Taxi to launch position
        keyFrames.push({
            frame: 60,
            value: new BABYLON.Vector3(
                startPosition.x,
                startPosition.y,
                this.carrier.position.z - 50 // Launch position
            )
        });
        
        // Takeoff
        keyFrames.push({
            frame: 90,
            value: endPosition
        });
        
        // Set keyframes
        takeoffAnimation.setKeys(keyFrames);
        
        // Apply easing
        const easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        takeoffAnimation.setEasingFunction(easingFunction);
        
        // Add animation to player
        this.gameState.player.animations = [];
        this.gameState.player.animations.push(takeoffAnimation);
        
        // Start takeoff animation
        this.scene.beginAnimation(
            this.gameState.player,
            0,
            90, // Frame count
            false, // Not looping
            1.0, // Speed ratio
            () => {
                // Animation completed
                this._onTakeoffCompleted();
            }
        );
    }
    
    /**
     * Called when takeoff animation is completed
     * @private
     */
    _onTakeoffCompleted() {
        // Takeoff sequence completed
        this.takeoffSequenceActive = false;
        
        // Switch back to original camera
        this._switchToOriginalCamera();
        
        // Reset physics
        if (this.gameState.playerPhysics) {
            // Set initial velocity
            this.gameState.playerPhysics.velocity = new BABYLON.Vector3(0, 0, -20);
            
            // Reset angular velocity
            this.gameState.playerPhysics.angularVelocity = new BABYLON.Vector3(0, 0, 0);
        }
        
        // Enable player controls
        this._enablePlayerControls();
        
        // Show message
        if (this.gameState.hud) {
            this.gameState.hud.showMessage("Launch successful. Good hunting, pilot!", 3, "Tiger's Claw Control");
        }
        
        // If there's a mission system, start the mission
        if (this.gameState.missionSystem) {
            // If the previous mission was completed, get the next mission
            const nextMissionId = this.gameState.missionSystem.getNextMission();
            
            if (nextMissionId) {
                // Load the next mission
                // This could trigger a mission briefing or directly start the mission
            }
        }
    }
    
    /**
     * Switches to the landing sequence camera
     * @private
     */
    _switchToLandingCamera() {
        if (!this.landingCamera) return;
        
        // No need to store locked target for the new camera implementation
        
        // Disable original camera
        this.originalCamera.detachControl();
        
        // Position landing camera
        this.landingCamera.setTarget(this.gameState.player.position);
        this.landingCamera.alpha = -Math.PI / 2; // Side view
        this.landingCamera.beta = Math.PI / 3;  // Slightly above
        this.landingCamera.radius = 50;
        
        // Enable landing camera
        this.landingCamera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
        this.scene.activeCamera = this.landingCamera;
        
        // Hide HUD during landing sequence
        if (this.gameState.hud) {
            this.gameState.hud.setVisible(false);
        }
    }
    
    /**
     * Switches to the takeoff sequence camera
     * @private
     */
    _switchToTakeoffCamera() {
        if (!this.takeoffCamera) return;
        
        // Disable original camera
        this.originalCamera.detachControl();
        
        // Position takeoff camera
        this.takeoffCamera.setTarget(this.gameState.player.position);
        this.takeoffCamera.alpha = -Math.PI / 4; // Slight angle
        this.takeoffCamera.beta = Math.PI / 4;   // Above
        this.takeoffCamera.radius = 30;
        
        // Enable takeoff camera
        this.takeoffCamera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
        this.scene.activeCamera = this.takeoffCamera;
        
        // Hide HUD during takeoff sequence
        if (this.gameState.hud) {
            this.gameState.hud.setVisible(false);
        }
    }
    
    /**
     * Switches back to the original camera
     * @private
     */
    _switchToOriginalCamera() {
        if (!this.originalCamera) return;
        
        // Disable current camera
        if (this.scene.activeCamera) {
            this.scene.activeCamera.detachControl();
        }
        
        // The camera will automatically resume its chase behavior in the game loop
        // No specific restoration needed
        
        // Enable original camera
        this.originalCamera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
        this.scene.activeCamera = this.originalCamera;
        
        // Show HUD again
        if (this.gameState.hud) {
            this.gameState.hud.setVisible(true);
        }
    }
    
    /**
     * Disables player controls during automated sequences
     * @private
     */
    _disablePlayerControls() {
        // Store original input state to restore later
        this.originalInputs = { ...this.gameState.inputs };
        
        // Clear inputs
        this.gameState.inputs = {
            keys: {},
            mouse: this.gameState.inputs.mouse
        };
        
        // Store physics state
        if (this.gameState.playerPhysics) {
            this.gameState.playerPhysics.controlsDisabled = true;
            this.gameState.playerPhysics.fullStop();
        }
    }
    
    /**
     * Re-enables player controls after automated sequences
     * @private
     */
    _enablePlayerControls() {
        // Restore original inputs if available
        if (this.originalInputs) {
            this.gameState.inputs = { ...this.originalInputs };
        }
        
        // Re-enable physics controls
        if (this.gameState.playerPhysics) {
            this.gameState.playerPhysics.controlsDisabled = false;
        }
    }
    
    /**
     * Updates the landing system
     * @param {Number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update carrier
        if (this.carrier) {
            // Animate running lights
            if (typeof this.carrier.lightAnimation === 'function') {
                this.carrier.lightAnimation();
            }
            
            // Update landing guides if active
            if (this.carrier.landingMode && this.carrier.landingGuides &&
                typeof this.carrier.landingGuides.update === 'function') {
                this.carrier.landingGuides.update(deltaTime);
            }
            
            // If in landing mode, check for auto-landing
            if (this.landingApproachActive && this.landingClearanceGranted && !this.autoLandActive) {
                if (this.canAutoLand()) {
                    // We can now auto-land
                    if (this.gameState.hud) {
                        this.gameState.hud.showMessage("Auto-landing available. Press 'A' to engage.", 3, "Nav Computer");
                    }
                }
            }
            
            // Update landing camera if active
            if (this.autoLandActive && this.scene.activeCamera === this.landingCamera) {
                this.landingCamera.setTarget(this.gameState.player.position);
            }
            
            // Update takeoff camera if active
            if (this.takeoffSequenceActive && this.scene.activeCamera === this.takeoffCamera) {
                this.takeoffCamera.setTarget(this.gameState.player.position);
            }
        }
    }
    
    /**
     * Handles keyboard input for landing/takeoff controls
     * @param {Object} kbInfo - Keyboard event info
     */
    handleKeyboardInput(kbInfo) {
        // Handle landing/takeoff related keys
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
            if (kbInfo.event.key === 'l' || kbInfo.event.key === 'L') {
                // Request landing clearance
                this.requestLandingClearance();
            }
            
            if (kbInfo.event.key === 'k' || kbInfo.event.key === 'K') {
                // Activate landing approach mode (after clearance)
                this.activateLandingApproach();
            }
            
            if (kbInfo.event.key === 'a' || kbInfo.event.key === 'A') {
                // Start auto-landing sequence (if in approach mode)
                this.startAutoLanding();
            }
            
            if (kbInfo.event.key === 't' || kbInfo.event.key === 'T') {
                // Start takeoff sequence (if landed)
                if (!this.landingApproachActive && !this.autoLandActive && !this.takeoffSequenceActive) {
                    // Only allow takeoff if we're not in any other sequence
                    this.startTakeoff();
                }
            }
        }
    }
    
    /**
     * Disposes resources used by the landing system
     */
    dispose() {
        // Dispose of all resources
        if (this.landingCamera) {
            this.landingCamera.dispose();
        }
        
        if (this.takeoffCamera) {
            this.takeoffCamera.dispose();
        }
        
        // Restore original camera if needed
        if (this.scene.activeCamera !== this.originalCamera) {
            this._switchToOriginalCamera();
        }
    }
}

/**
 * Creates and returns a carrier landing system
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} gameState - The game state
 * @returns {CarrierLandingSystem} The landing system
 */
export function createCarrierLandingSystem(scene, gameState) {
    return new CarrierLandingSystem(scene, gameState);
}