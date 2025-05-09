import * as BABYLON from 'babylonjs';
import { createSimpleSpacecraft } from '../components/spacecraft';
import { createSpacecraftPhysics } from '../systems/physics';
import { createEngineParticles, updateEngineParticles, createShieldEffect } from '../components/effects';
import { createWeaponSystem } from '../systems/weapons';
import { createTargetingSystem } from '../systems/targeting';
import { createEnemyFormation } from '../components/enemyFactory';
import { createCollisionSystem } from '../systems/collision';
import { createHUD } from '../components/hud';
import { createPowerManagementSystem } from '../systems/powerManagement';
import { createMissionSystem, getMission } from '../systems/missions';
import { createCarrierLandingSystem } from '../components/carrier';
import { createWingmanSystem } from '../systems/communications';
import { createEnvironmentManager } from '../components/environments';

/**
 * Updates ship systems like shields, energy, etc.
 * @param {Object} ship - The spacecraft to update
 * @param {Number} deltaTime - Time since last update in seconds
 * @param {Object} gameState - The game state
 */
function updateShipSystems(ship, deltaTime, gameState) {
    if (!ship || !gameState) return;
    
    // Get physics system
    const physics = gameState.playerPhysics;
    if (!physics) return;
    
    // Update power management system if available
    if (gameState.powerSystem) {
        // Update power system with current state
        gameState.powerSystem.update(deltaTime, physics.afterburnerActive);
        
        // Apply power system values to ship
        ship.energy = gameState.powerSystem.energy;
        ship.shields = gameState.powerSystem.shields;
        
        // Get engine multipliers and apply to physics
        const engineMultipliers = gameState.powerSystem.getMultipliers().engines;
        physics.maxSpeed = physics.baseMaxSpeed * engineMultipliers.speed;
        physics.acceleration = physics.baseAcceleration * engineMultipliers.acceleration;
        
        // If using afterburner, consume energy
        if (physics.afterburnerActive) {
            const result = gameState.powerSystem.consumeEnergy('engines', 1 * deltaTime);
            
            // Disable afterburner if not enough energy
            if (!result.success) {
                physics.deactivateAfterburner();
            }
        }
    } else {
        // Legacy system (fallback if power system not available)
        // Recharge energy based on time (reduced when afterburner is active)
        const energyRechargeMultiplier = physics.afterburnerActive ? 0.3 : 1.0;
        ship.energy = Math.min(100, ship.energy + (ship.energyRechargeRate * energyRechargeMultiplier * deltaTime));
        
        // Consume energy for afterburner
        if (physics.afterburnerActive && ship.energy > 0) {
            ship.energy = Math.max(0, ship.energy - 1 * deltaTime);
            
            // Disable afterburner if energy is depleted
            if (ship.energy <= 0) {
                physics.deactivateAfterburner();
            }
        }
        
        // Recharge shields if energy is available
        if (ship.shields < 100 && ship.energy > 10) {
            const shieldRecharge = ship.shieldRechargeRate * deltaTime;
            ship.shields = Math.min(100, ship.shields + shieldRecharge);
            ship.energy = Math.max(0, ship.energy - shieldRecharge * 0.5); // Shield recharge consumes energy
        }
    }
    
    // Update shield effect
    if (gameState.playerShield && gameState.playerShield.setStrength) {
        gameState.playerShield.setStrength(ship.shields);
    }
    
    // Update engine particles
    if (ship.particleSystems) {
        // Get thrust input from physics system
        const thrustInput = physics.thrustInput;
        
        // Update engine particles based on thrust and afterburner state
        updateEngineParticles(ship.particleSystems.left, physics.afterburnerActive, thrustInput);
        updateEngineParticles(ship.particleSystems.right, physics.afterburnerActive, thrustInput);
    }
}

// Set up the main game scene
export async function setupScene(gameState, engine, canvas) {
    // Create scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0, 0, 0.05); // Dark blue space background
    
    // Create a camera for our scene (will be modified later)
    const camera = new BABYLON.ArcRotateCamera(
        'playerCamera',
        Math.PI, // Alpha (horizontal rotation)
        Math.PI / 4, // Beta (vertical rotation)
        30, // Radius (distance from target)
        new BABYLON.Vector3(0, 0, 0), // Target
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 50;
    
    // Disable user camera controls - we'll control it with code
    camera.inputs.clear();
    
    // Store camera in game state
    gameState.camera = camera;
    
    // Create a custom chase camera behavior
    gameState.chaseCameraParameters = {
        distance: 30, // Distance behind ship
        height: 8, // Height above ship
        rotationSpeed: 0.03, // How fast camera rotates to follow the ship
        positionLerp: 0.05, // Position interpolation speed (0-1) - lower means smoother
        targetLerp: 0.08, // Target interpolation speed (0-1) - lower means smoother
        minDistance: 20,
        maxDistance: 40,
        cameraInertia: true,
        lookAheadDistance: 20 // Look ahead of the ship this far
    };
    
    // We don't need custom camera controls for the follow camera
    
    // Add hemisphere light for ambient lighting
    const hemisphericLight = new BABYLON.HemisphericLight(
        'hemisphericLight',
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    hemisphericLight.intensity = 0.5;
    
    // Add directional light for sun-like lighting
    const directionalLight = new BABYLON.DirectionalLight(
        'directionalLight',
        new BABYLON.Vector3(-1, -2, -1),
        scene
    );
    directionalLight.intensity = 0.8;
    
    // Create environment manager
    const environmentManager = createEnvironmentManager(scene);
    gameState.environmentManager = environmentManager;
    
    // Create a default environment to start
    environmentManager.createEnvironment('nebula');
    
    // Store reference to the environment manager in gameState for later use
    gameState.environmentManager = environmentManager;
    
    // Create player spacecraft
    const playerShip = await createSimpleSpacecraft(scene);
    playerShip.position = new BABYLON.Vector3(0, 30, 100); // Start higher up and further back
    playerShip.rotation = new BABYLON.Vector3(0.1, 0, 0); // Slight nose-down pitch
    gameState.player = playerShip;
    
    // Create physics system for the player ship
    const playerPhysics = createSpacecraftPhysics({
        maxSpeed: 100, // Changed to 100 KPS as requested
        acceleration: 0.04, // Reduced for progressive acceleration
        accelerationCurve: {
            startSpeed: 0,
            midSpeed: 50,
            endSpeed: 100,
            startAccel: 0.15, // Fast initial acceleration
            midAccel: 0.08,   // Medium acceleration in the middle range
            endAccel: 0.03    // Slow acceleration at high speeds
        },
        deceleration: 0.01,
        rotationSpeed: 0.008, // 2x slower rotation
        dampingFactor: 0.99,
        angularDampingFactor: 0.92,
        afterburnerMultiplier: 1.5 // Reduced multiplier since base speed is higher
    });
    
    // Store base values for multiplier calculations
    playerPhysics.baseMaxSpeed = playerPhysics.maxSpeed;
    playerPhysics.baseAcceleration = playerPhysics.acceleration;
    
    gameState.playerPhysics = playerPhysics;
    
    // Create power management system
    const powerSystem = createPowerManagementSystem({
        maxEnergy: 100,
        maxShields: 100,
        energyRechargeRate: 5,
        shieldRechargeRate: 3,
        shieldRechargeEnergyCost: 0.5,
        onShieldHit: (arc, damage, shieldDamage) => {
            // Trigger shield impact effect at appropriate position
            if (gameState.playerShield && gameState.playerShield.impact) {
                // Determine impact position based on arc
                let position;
                if (arc === 'forward') {
                    position = playerShip.position.add(playerShip.direction.scale(2));
                } else {
                    position = playerShip.position.subtract(playerShip.direction.scale(2));
                }
                
                gameState.playerShield.impact(position, damage / 10);
            }
        }
    });
    gameState.powerSystem = powerSystem;
    
    // Create shield effect for player ship
    const shield = createShieldEffect(scene, playerShip);
    gameState.playerShield = shield;
    
    // Set initial shield state
    shield.setStrength(playerShip.shields);
    
    // Create weapon system for player ship
    const weaponSystem = createWeaponSystem(scene, playerShip, {
        hardpoints: [
            { position: new BABYLON.Vector3(-1.5, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) },
            { position: new BABYLON.Vector3(1.5, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) }
        ]
    });
    gameState.playerWeapons = weaponSystem;
    
    // Create targeting system for player ship
    const targetingSystem = createTargetingSystem(scene, {
        maxRange: 500,
        maxTargets: 10,
        targetLockTime: 1.0
    });
    gameState.playerTargeting = targetingSystem;
    
    // Set initial camera position behind the ship
    const shipDirection = new BABYLON.Vector3(0, 0, 1); // Initial ship direction
    const cameraOffset = shipDirection.scale(-gameState.chaseCameraParameters.distance);
    cameraOffset.y += gameState.chaseCameraParameters.height;
    
    camera.position = playerShip.position.add(cameraOffset);
    camera.target = playerShip.position.add(shipDirection.scale(10));
    
    // Create HUD
    const hud = createHUD(scene, engine, canvas, gameState);
    gameState.hud = hud;
    
    // Create mission system
    const missionSystem = createMissionSystem(scene, gameState);
    gameState.missionSystem = missionSystem;
    
    // Add createEnemyFormation to gameState so mission system can use it
    gameState.createEnemyFormation = createEnemyFormation;
    
    // Load a test mission
    missionSystem.loadMission(getMission('mission1')).then(() => {
        console.log("Mission loaded successfully");
    }).catch(error => {
        console.error("Error loading mission:", error);
    });
    
    // Create carrier landing system
    const carrierLandingSystem = createCarrierLandingSystem(scene, gameState);
    gameState.carrierLandingSystem = carrierLandingSystem;
    
    // Create wingman communication system
    const wingmanSystem = createWingmanSystem(scene, gameState);
    gameState.wingmanSystem = wingmanSystem;
    
    // Create a wingman for the player
    wingmanSystem.createWingman({
        callsign: "Spirit",
        craftType: "friendly",
        position: new BABYLON.Vector3(30, 0, -20), // Position on player's wing
        responseDelay: 1.0,
        personality: "standard"
    }).then(wingman => {
        console.log("Wingman created:", wingman.callsign);
        
        // Add wingman to collision system
        if (gameState.collisionSystem) {
            wingman.spacecraft.colliderInfo = {
                type: 'sphere',
                size: 3
            };
            gameState.collisionSystem.addEntity(wingman.spacecraft);
        }
    });
    
    // Create enemy ships - Kilrathi squadron
    const enemies = await createEnemyFormation(scene, 5, {
        formation: 'claw',
        position: new BABYLON.Vector3(0, 0, -200),
        squadronType: 'mixed_kilrathi',
        leaderType: 'kilrathi_krant',
        leaderDifficulty: 'hard',
        difficulty: 'medium'
    });
    gameState.enemies = enemies;
    
    // Create collision system
    const collisionSystem = createCollisionSystem(scene, {
        debugColliders: true, // Set to true to visualize colliders
        usePhysicsEngine: false,
        enableCollisionResponse: true  // Enable proper physics-based collision response
    });
    gameState.collisionSystem = collisionSystem;
    
    // Add player ship to collision system with physics-based collider
    playerShip.colliderInfo = {
        type: 'sphere',
        size: 4,
        mass: 800,               // Player ship has more mass than enemies
        restitution: 0.2,        // Less bouncy
        friction: 0.1,
        collisionResponseEnabled: true
    };
    collisionSystem.addEntity(playerShip);
    
    // Add enemy ships to collision system with physics properties
    enemies.forEach(enemy => {
        // Different enemies have different masses based on type
        let mass = 600;
        let size = 3.5;
        
        // Adjust collider properties based on ship type
        if (enemy.shipType === 'kilrathi_krant') {
            mass = 1000;  // Heavy fighter
            size = 5;
        } else if (enemy.shipType === 'kilrathi_salthi') {
            mass = 750;   // Medium fighter
            size = 4;
        } else if (enemy.shipType === 'kilrathi_dralthi') {
            mass = 600;   // Light fighter
            size = 3.5;
        }
        
        enemy.colliderInfo = {
            type: 'sphere',
            size: size,
            mass: mass,
            restitution: 0.3,    // Medium bounciness
            friction: 0.1,
            collisionResponseEnabled: true
        };
        collisionSystem.addEntity(enemy);
    });
    
    // Set up basic keyboard controls for the ship
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                gameState.inputs.keys[kbInfo.event.key] = true;
                
                // Handle special keys
                if (kbInfo.event.key === ' ' || kbInfo.event.key === 'f') {
                    // Fire weapon
                    if (gameState.playerWeapons) {
                        if (gameState.powerSystem) {
                            // Use power system for energy
                            const weapon = gameState.playerWeapons.getCurrentWeapon();
                            const result = gameState.powerSystem.consumeEnergy('weapons', weapon.energyCost);
                            
                            if (result.success) {
                                gameState.playerWeapons.fire(100); // Provide full energy for the shot
                            }
                        } else {
                            // Legacy energy system
                            const result = gameState.playerWeapons.fire(gameState.player.energy);
                            if (result.success) {
                                // Deduct energy cost
                                gameState.player.energy -= result.energyCost;
                            }
                        }
                    }
                }
                
                if (kbInfo.event.key === 'Tab') {
                    // Cycle weapon
                    if (gameState.playerWeapons) {
                        gameState.playerWeapons.cycleWeapon();
                    }
                    
                    // Toggle key bindings display
                    if (gameState.hud) {
                        gameState.hud.toggleKeyBindings();
                    }
                    
                    // Prevent default Tab behavior
                    kbInfo.event.preventDefault();
                }
                
                if (kbInfo.event.key === 'c') {
                    // Alternative key to cycle weapon without showing key bindings
                    if (gameState.playerWeapons) {
                        gameState.playerWeapons.cycleWeapon();
                    }
                }
                
                if (kbInfo.event.key === 't') {
                    // Cycle next target
                    if (gameState.playerTargeting) {
                        gameState.playerTargeting.cycleNextTarget();
                    }
                }
                
                if (kbInfo.event.key === 'y') {
                    // Cycle previous target
                    if (gameState.playerTargeting) {
                        gameState.playerTargeting.cyclePreviousTarget();
                    }
                }
                
                if (kbInfo.event.key === 'r') {
                    // Clear targeting
                    if (gameState.playerTargeting) {
                        gameState.playerTargeting.clearTarget();
                    }
                }
                
                // Power management controls
                if (gameState.powerSystem) {
                    // Power distribution
                    if (kbInfo.event.key === 'F1') {
                        gameState.powerSystem.setPowerState('weapons');
                        if (gameState.hud) {
                            gameState.hud.showMessage("Power to weapons", 2, "System");
                        }
                    }
                    
                    if (kbInfo.event.key === 'F2') {
                        gameState.powerSystem.setPowerState('engines');
                        if (gameState.hud) {
                            gameState.hud.showMessage("Power to engines", 2, "System");
                        }
                    }
                    
                    if (kbInfo.event.key === 'F3') {
                        gameState.powerSystem.setPowerState('shields');
                        if (gameState.hud) {
                            gameState.hud.showMessage("Power to shields", 2, "System");
                        }
                    }
                    
                    if (kbInfo.event.key === 'F4') {
                        gameState.powerSystem.setPowerState('balanced');
                        if (gameState.hud) {
                            gameState.hud.showMessage("Power balanced", 2, "System");
                        }
                    }
                    
                    // Shield distribution
                    if (kbInfo.event.key === 'z') {
                        gameState.powerSystem.setShieldState('forward');
                        if (gameState.hud) {
                            gameState.hud.showMessage("Shields forward", 2, "System");
                        }
                    }
                    
                    if (kbInfo.event.key === 'x') {
                        gameState.powerSystem.setShieldState('rear');
                        if (gameState.hud) {
                            gameState.hud.showMessage("Shields rear", 2, "System");
                        }
                    }
                    
                    if (kbInfo.event.key === 'v') {
                        gameState.powerSystem.setShieldState('balanced');
                        if (gameState.hud) {
                            gameState.hud.showMessage("Shields balanced", 2, "System");
                        }
                    }
                }
                
                // Mission system
                if (kbInfo.event.key === 'm') {
                    // Toggle mission objectives visibility
                    if (gameState.hud && gameState.hud.elements.objectivePanel) {
                        const isVisible = gameState.hud.elements.objectivePanel.isVisible;
                        gameState.hud.elements.objectivePanel.isVisible = !isVisible;
                    }
                }
                
                // Pass keyboard input to carrier landing system if available
                if (gameState.carrierLandingSystem) {
                    gameState.carrierLandingSystem.handleKeyboardInput(kbInfo);
                }
                
                // Wingman command system shortcuts
                if (gameState.wingmanSystem) {
                    // Basic commands with number keys
                    if (kbInfo.event.key === '1' && kbInfo.event.altKey) {
                        // Attack my target
                        gameState.wingmanSystem.issueCommand(
                            gameState.wingmanSystem.commandTypes.ATTACK_TARGET
                        );
                    }
                    
                    if (kbInfo.event.key === '2' && kbInfo.event.altKey) {
                        // Attack all enemies
                        gameState.wingmanSystem.issueCommand(
                            gameState.wingmanSystem.commandTypes.ATTACK_ENEMIES
                        );
                    }
                    
                    if (kbInfo.event.key === '3' && kbInfo.event.altKey) {
                        // Form on my wing
                        gameState.wingmanSystem.issueCommand(
                            gameState.wingmanSystem.commandTypes.FORM_UP
                        );
                    }
                    
                    if (kbInfo.event.key === '4' && kbInfo.event.altKey) {
                        // Break and attack
                        gameState.wingmanSystem.issueCommand(
                            gameState.wingmanSystem.commandTypes.BREAK_AND_ATTACK
                        );
                    }
                    
                    if (kbInfo.event.key === '5' && kbInfo.event.altKey) {
                        // Defend yourself
                        gameState.wingmanSystem.issueCommand(
                            gameState.wingmanSystem.commandTypes.DEFEND_SELF
                        );
                    }
                    
                    if (kbInfo.event.key === '6' && kbInfo.event.altKey) {
                        // Cover me
                        gameState.wingmanSystem.issueCommand(
                            gameState.wingmanSystem.commandTypes.COVER_ME
                        );
                    }
                    
                    if (kbInfo.event.key === '7' && kbInfo.event.altKey) {
                        // Return to base
                        gameState.wingmanSystem.issueCommand(
                            gameState.wingmanSystem.commandTypes.RETURN_TO_BASE
                        );
                    }
                    
                    // Cycle active wingman
                    if (kbInfo.event.key === '0' && kbInfo.event.altKey) {
                        gameState.wingmanSystem.cycleWingman();
                        
                        // Update the HUD with the active wingman's callsign
                        const activeWingman = gameState.wingmanSystem.getActiveWingman();
                        if (activeWingman && gameState.hud) {
                            gameState.hud.updateActiveWingman(activeWingman.callsign);
                        }
                    }
                    
                    // Toggle wingman command interface with 'w' key
                    if (kbInfo.event.key === 'w' && kbInfo.event.altKey) {
                        if (gameState.hud) {
                            gameState.hud.toggleWingmanCommands();
                        }
                    }
                }
                break;
                
            case BABYLON.KeyboardEventTypes.KEYUP:
                gameState.inputs.keys[kbInfo.event.key] = false;
                break;
        }
    });
    
    // Game loop function
    scene.registerBeforeRender(() => {
        // Calculate delta time for physics
        const deltaTime = engine.getDeltaTime() / 1000; // Convert to seconds
        
        // Make sure the gameState has the current deltaTime value
        gameState.deltaTime = deltaTime;
        
        // Update physics system
        gameState.playerPhysics.update(playerShip, gameState.inputs, deltaTime);
        
        // Update ship systems (energy, shields, etc)
        updateShipSystems(playerShip, deltaTime, gameState);
        
        // Update weapon systems
        if (gameState.playerWeapons) {
            gameState.playerWeapons.update(deltaTime);
        }
        
        // Update targeting system
        if (gameState.playerTargeting) {
            // Update targeting system with player position and direction
            gameState.playerTargeting.update(
                playerShip.position,
                playerShip.direction,
                deltaTime
            );
            
            // Get current target for weapon aiming
            const currentTarget = gameState.playerTargeting.getCurrentTarget();
            if (currentTarget && gameState.playerTargeting.isTargetLocked()) {
                // Auto-fire at locked target if space is held down
                if (gameState.inputs.keys[' '] && gameState.playerWeapons) {
                    if (gameState.powerSystem) {
                        // Use power system for energy
                        const weapon = gameState.playerWeapons.getCurrentWeapon();
                        const result = gameState.powerSystem.consumeEnergy('weapons', weapon.energyCost);
                        
                        if (result.success) {
                            gameState.playerWeapons.fire(100); // Provide full energy for the shot
                        }
                    } else {
                        // Legacy energy system
                        const result = gameState.playerWeapons.fire(gameState.player.energy);
                        if (result.success) {
                            // Deduct energy cost
                            gameState.player.energy -= result.energyCost;
                        }
                    }
                }
            }
        }
        
        // Update mission system
        if (gameState.missionSystem) {
            gameState.missionSystem.update(deltaTime);
        }
        
        // Update HUD
        if (gameState.hud) {
            gameState.hud.update(deltaTime);
        }
        
        // Update carrier landing system
        if (gameState.carrierLandingSystem) {
            gameState.carrierLandingSystem.update(deltaTime);
        }
        
        // Update wingman system
        if (gameState.wingmanSystem) {
            gameState.wingmanSystem.update(deltaTime);
        }
        
        // Update enemy ships
        if (gameState.enemies) {
            // Create a potential target list for enemies (just the player for now)
            const potentialTargets = [playerShip];
            
            // Update each enemy
            for (let i = gameState.enemies.length - 1; i >= 0; i--) {
                const enemy = gameState.enemies[i];
                
                // Skip if enemy is no longer valid or has been disposed
                if (!enemy || enemy.isDisposed) {
                    continue;
                }
                
                // Log enemy update for debugging
                if (i === 0 && Math.floor(gameState.deltaTime * 60) % 120 === 0) {
                    console.log(`Updating enemy ${i}: Position: ${enemy.position.x.toFixed(1)}, ${enemy.position.y.toFixed(1)}, ${enemy.position.z.toFixed(1)}`);
                    console.log(`AI state: ${enemy.ai ? enemy.ai.getState() : 'No AI'}`);
                }
                
                // Update the enemy
                enemy.update(potentialTargets, deltaTime);
                
                // Check if player weapons hit this enemy
                if (gameState.playerWeapons) {
                    const hitResult = gameState.playerWeapons.checkHits(enemy);
                    if (hitResult.hit) {
                        // Apply damage to enemy
                        const isDead = enemy.damage(hitResult.damage);
                        
                        // Remove projectile
                        gameState.playerWeapons.removeProjectile(hitResult.projectile);
                        
                        // Remove enemy if destroyed
                        if (isDead) {
                            enemy.dispose();
                            gameState.enemies.splice(i, 1);
                        }
                    }
                }
                
                // Check if enemy weapons hit player
                if (enemy.weapons) {
                    const hitResult = enemy.weapons.checkHits(playerShip);
                    if (hitResult.hit) {
                        // Calculate if hit is from rear
                        const toPlayer = playerShip.position.subtract(enemy.position).normalize();
                        const playerDirection = playerShip.direction.normalize();
                        const dotProduct = BABYLON.Vector3.Dot(toPlayer, playerDirection);
                        const isRearHit = dotProduct < 0;
                        
                        if (gameState.powerSystem) {
                            // Use power management system for shield hit
                            const hitResult = gameState.powerSystem.handleShieldHit(hitResult.damage, isRearHit);
                            
                            // Apply hull damage if any
                            if (hitResult.hullDamage > 0) {
                                playerShip.health -= hitResult.hullDamage;
                                
                                // Track damage in mission system
                                if (gameState.missionSystem) {
                                    gameState.missionSystem.trackDamageReceived(hitResult.hullDamage);
                                }
                            }
                        } else {
                            // Legacy shield handling
                            // Apply damage to player (reduce shields first)
                            const shieldDamage = Math.min(playerShip.shields, hitResult.damage);
                            playerShip.shields -= shieldDamage;
                            
                            // Remaining damage goes to hull
                            const hullDamage = hitResult.damage - shieldDamage;
                            if (hullDamage > 0) {
                                playerShip.health -= hullDamage;
                                
                                // Track damage in mission system
                                if (gameState.missionSystem) {
                                    gameState.missionSystem.trackDamageReceived(hullDamage);
                                }
                            }
                            
                            // Shield impact effect
                            if (shieldDamage > 0 && gameState.playerShield && gameState.playerShield.impact) {
                                gameState.playerShield.impact(hitResult.hitPoint, hitResult.damage / 10);
                            }
                        }
                        
                        // Remove projectile
                        enemy.weapons.removeProjectile(hitResult.projectile);
                    }
                }
            }
        }
        
        // Update collision system
        if (gameState.collisionSystem) {
            const collisions = gameState.collisionSystem.update(deltaTime);
            
            // Handle collisions
            collisions.forEach(collision => {
                // Determine damage based on relative velocity and mass
                let damage = 10; // Base collision damage
                
                // Get velocity of entities if available
                const velocityA = collision.entityA.physics ? collision.entityA.physics.velocity : null;
                const velocityB = collision.entityB.physics ? collision.entityB.physics.velocity : null;
                
                // Calculate relative velocity for more realistic damage
                if (velocityA && velocityB) {
                    const relativeVelocity = velocityA.subtract(velocityB);
                    damage = Math.min(50, damage + relativeVelocity.length() * 0.5);
                }
                
                // Apply collision damage to both entities
                if (collision.entityA === playerShip) {
                    // Player collided with something
                    // Calculate direction of impact to determine shield arc
                    const otherPos = collision.entityB.position;
                    const playerPos = playerShip.position;
                    const toOther = otherPos.subtract(playerPos).normalize();
                    const playerDirection = playerShip.direction.normalize();
                    const dotProduct = BABYLON.Vector3.Dot(toOther, playerDirection);
                    const isRearHit = dotProduct < 0;
                    
                    if (gameState.powerSystem) {
                        // Use power management system for shield hit
                        const hitResult = gameState.powerSystem.handleShieldHit(damage, isRearHit);
                        
                        // Apply hull damage if any
                        if (hitResult.hullDamage > 0) {
                            playerShip.health -= hitResult.hullDamage;
                            
                            // Track damage in mission system
                            if (gameState.missionSystem) {
                                gameState.missionSystem.trackDamageReceived(hitResult.hullDamage);
                            }
                        }
                    } else {
                        // Legacy shield handling
                        // Apply damage to shields first
                        const shieldDamage = Math.min(playerShip.shields, damage);
                        playerShip.shields -= shieldDamage;
                        
                        // Remaining damage to hull
                        const hullDamage = damage - shieldDamage;
                        if (hullDamage > 0) {
                            playerShip.health -= hullDamage;
                            
                            // Track damage in mission system
                            if (gameState.missionSystem) {
                                gameState.missionSystem.trackDamageReceived(hullDamage);
                            }
                        }
                        
                        // Shield impact effect
                        if (shieldDamage > 0 && gameState.playerShield && gameState.playerShield.impact) {
                            gameState.playerShield.impact(collision.point, damage / 10);
                        }
                    }
                    
                    // Apply damage to the other entity
                    if (collision.entityB.damage) {
                        const isDestroyed = collision.entityB.damage(damage);
                        
                        // Remove enemy if destroyed
                        if (isDestroyed && gameState.enemies) {
                            const enemyIndex = gameState.enemies.indexOf(collision.entityB);
                            if (enemyIndex !== -1) {
                                collision.entityB.dispose();
                                gameState.enemies.splice(enemyIndex, 1);
                                
                                // Track enemy destroyed in mission system
                                if (gameState.missionSystem) {
                                    gameState.missionSystem.trackEnemyDestroyed();
                                }
                                
                                // Remove from collision system
                                gameState.collisionSystem.removeEntity(collision.entityB);
                            }
                        }
                    }
                }
                else if (collision.entityB === playerShip) {
                    // Player collided with something
                    // Calculate direction of impact to determine shield arc
                    const otherPos = collision.entityA.position;
                    const playerPos = playerShip.position;
                    const toOther = otherPos.subtract(playerPos).normalize();
                    const playerDirection = playerShip.direction.normalize();
                    const dotProduct = BABYLON.Vector3.Dot(toOther, playerDirection);
                    const isRearHit = dotProduct < 0;
                    
                    if (gameState.powerSystem) {
                        // Use power management system for shield hit
                        const hitResult = gameState.powerSystem.handleShieldHit(damage, isRearHit);
                        
                        // Apply hull damage if any
                        if (hitResult.hullDamage > 0) {
                            playerShip.health -= hitResult.hullDamage;
                            
                            // Track damage in mission system
                            if (gameState.missionSystem) {
                                gameState.missionSystem.trackDamageReceived(hitResult.hullDamage);
                            }
                        }
                    } else {
                        // Legacy shield handling
                        // Apply damage to shields first
                        const shieldDamage = Math.min(playerShip.shields, damage);
                        playerShip.shields -= shieldDamage;
                        
                        // Remaining damage to hull
                        const hullDamage = damage - shieldDamage;
                        if (hullDamage > 0) {
                            playerShip.health -= hullDamage;
                            
                            // Track damage in mission system
                            if (gameState.missionSystem) {
                                gameState.missionSystem.trackDamageReceived(hullDamage);
                            }
                        }
                        
                        // Shield impact effect
                        if (shieldDamage > 0 && gameState.playerShield && gameState.playerShield.impact) {
                            gameState.playerShield.impact(collision.point, damage / 10);
                        }
                    }
                    
                    // Apply damage to the other entity
                    if (collision.entityA.damage) {
                        const isDestroyed = collision.entityA.damage(damage);
                        
                        // Remove enemy if destroyed
                        if (isDestroyed && gameState.enemies) {
                            const enemyIndex = gameState.enemies.indexOf(collision.entityA);
                            if (enemyIndex !== -1) {
                                collision.entityA.dispose();
                                gameState.enemies.splice(enemyIndex, 1);
                                
                                // Track enemy destroyed in mission system
                                if (gameState.missionSystem) {
                                    gameState.missionSystem.trackEnemyDestroyed();
                                }
                                
                                // Remove from collision system
                                gameState.collisionSystem.removeEntity(collision.entityA);
                            }
                        }
                    }
                }
                else {
                    // Collision between non-player entities
                    if (collision.entityA.damage) {
                        collision.entityA.damage(damage / 2);
                    }
                    if (collision.entityB.damage) {
                        collision.entityB.damage(damage / 2);
                    }
                }
            });
        }
        
        // Update chase camera
        if (gameState.player && gameState.camera) {
            const params = gameState.chaseCameraParameters;
            const ship = gameState.player;
            const camera = gameState.camera;
            
            // Calculate ideal camera position (behind the ship)
            const shipDirection = ship.direction.clone().normalize();
            const shipUp = BABYLON.Vector3.UpReadOnly.clone();
            
            // Get the ship's velocity vector (if available)
            const velocityDir = gameState.playerPhysics ? 
                gameState.playerPhysics.velocity.clone().normalize() : 
                shipDirection;
                
            // Blend the ship's direction with its velocity vector for smoother turns
            let cameraFollowDir;
            if (gameState.playerPhysics && gameState.playerPhysics.velocity.length() > 1) {
                // Blend between direction and velocity (70% direction, 30% velocity)
                cameraFollowDir = shipDirection.scale(0.7).add(velocityDir.scale(0.3)).normalize();
            } else {
                cameraFollowDir = shipDirection;
            }
            
            // Calculate camera position behind the ship, using the blended direction
            const cameraOffset = cameraFollowDir.scale(-params.distance); // Negative to be behind
            cameraOffset.y += params.height; // Add height
            
            // Calculate target position (ahead of the ship)
            const lookAheadDistance = params.lookAheadDistance || 10;
            const targetOffset = shipDirection.scale(lookAheadDistance);
            const idealTarget = ship.position.add(targetOffset);
            
            // Smooth camera position with lerp interpolation
            if (params.cameraInertia) {
                // If the camera should have inertia (smoother movement)
                camera.position = BABYLON.Vector3.Lerp(
                    camera.position,
                    ship.position.add(cameraOffset),
                    params.positionLerp * deltaTime * 60 // Time-based interpolation
                );
                
                camera.target = BABYLON.Vector3.Lerp(
                    camera.target,
                    idealTarget,
                    params.targetLerp * deltaTime * 60 // Time-based interpolation
                );
            } else {
                // Direct camera positioning without inertia
                camera.position = ship.position.add(cameraOffset);
                camera.target = idealTarget;
            }
            
            // Add a slight roll to the camera based on the ship's rotation
            camera.upVector = BABYLON.Vector3.Lerp(
                camera.upVector,
                BABYLON.Vector3.UpReadOnly,
                0.05 * deltaTime * 60
            );
        }
    });
    
    // Hide loading screen when scene is ready
    engine.hideLoadingUI();
    
    return scene;
}