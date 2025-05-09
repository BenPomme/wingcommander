import * as BABYLON from 'babylonjs';
import { createEngineParticles } from './effects';

/**
 * Creates a Kilrathi fighter spacecraft
 * This design reflects the characteristic organic-looking Kilrathi aesthetic
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} options - Configuration options
 * @returns {BABYLON.TransformNode} The created spacecraft
 */
export async function createKilrathiDralthi(scene, options = {}) {
    // Create a container for all spacecraft parts
    const spacecraft = new BABYLON.TransformNode("kilrathi_dralthi", scene);
    
    // Create the main body (fuselage)
    const fuselage = BABYLON.MeshBuilder.CreateSphere("fuselage", { 
        diameterX: 2.5, 
        diameterY: 1.5, 
        diameterZ: 3,
        segments: 16
    }, scene);
    fuselage.parent = spacecraft;
    
    // Create the wings (distinctive curved wing design of the Dralthi)
    // Top wing arch
    const topWing = BABYLON.MeshBuilder.CreateTube("topWing", {
        path: [
            new BABYLON.Vector3(-5, 0, 0),
            new BABYLON.Vector3(-4, 1.5, 0),
            new BABYLON.Vector3(-2, 2.5, 0),
            new BABYLON.Vector3(0, 3, 0),
            new BABYLON.Vector3(2, 2.5, 0),
            new BABYLON.Vector3(4, 1.5, 0),
            new BABYLON.Vector3(5, 0, 0)
        ],
        radius: 0.4,
        tessellation: 24,
        updatable: false
    }, scene);
    topWing.parent = spacecraft;
    topWing.position.y = 0.5;
    
    // Bottom wing arch
    const bottomWing = BABYLON.MeshBuilder.CreateTube("bottomWing", {
        path: [
            new BABYLON.Vector3(-5, 0, 0),
            new BABYLON.Vector3(-4, -1.5, 0),
            new BABYLON.Vector3(-2, -2.5, 0),
            new BABYLON.Vector3(0, -3, 0),
            new BABYLON.Vector3(2, -2.5, 0),
            new BABYLON.Vector3(4, -1.5, 0),
            new BABYLON.Vector3(5, 0, 0)
        ],
        radius: 0.4,
        tessellation: 24,
        updatable: false
    }, scene);
    bottomWing.parent = spacecraft;
    bottomWing.position.y = -0.5;
    
    // Wing connecting plates
    const wingPlateLeft = BABYLON.MeshBuilder.CreateBox("wingPlateLeft", {
        width: 0.5,
        height: 4,
        depth: 3
    }, scene);
    wingPlateLeft.position.x = -5;
    wingPlateLeft.parent = spacecraft;
    
    const wingPlateRight = BABYLON.MeshBuilder.CreateBox("wingPlateRight", {
        width: 0.5,
        height: 4,
        depth: 3
    }, scene);
    wingPlateRight.position.x = 5;
    wingPlateRight.parent = spacecraft;
    
    // Cockpit (set forward, Kilrathi ships often have forward-placed cockpits)
    const cockpit = BABYLON.MeshBuilder.CreateSphere("cockpit", {
        diameterX: 1.5,
        diameterY: 1.2,
        diameterZ: 1.8,
        segments: 16
    }, scene);
    cockpit.position.z = 1.5;
    cockpit.position.y = 0.3;
    cockpit.parent = spacecraft;
    
    // Create engine section 
    const engineHousing = BABYLON.MeshBuilder.CreateCylinder("engineHousing", {
        height: 2,
        diameter: 2.5,
        tessellation: 24
    }, scene);
    engineHousing.rotation.x = Math.PI / 2;
    engineHousing.position.z = -1.5;
    engineHousing.parent = spacecraft;
    
    // Engine nozzles (dual)
    const leftEngine = BABYLON.MeshBuilder.CreateCylinder("leftEngine", {
        height: 1,
        diameterTop: 0.8,
        diameterBottom: 0.6,
        tessellation: 16
    }, scene);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.x = -0.7;
    leftEngine.position.z = -2.5;
    leftEngine.parent = spacecraft;
    
    const rightEngine = BABYLON.MeshBuilder.CreateCylinder("rightEngine", {
        height: 1,
        diameterTop: 0.8,
        diameterBottom: 0.6,
        tessellation: 16
    }, scene);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.x = 0.7;
    rightEngine.position.z = -2.5;
    rightEngine.parent = spacecraft;
    
    // Add weaponry (dual laser cannons)
    const leftCannon = BABYLON.MeshBuilder.CreateCylinder("leftCannon", {
        height: 2.5,
        diameter: 0.3,
        tessellation: 12
    }, scene);
    leftCannon.rotation.x = Math.PI / 2;
    leftCannon.position.x = -1.3;
    leftCannon.position.y = -0.2;
    leftCannon.position.z = 1.5;
    leftCannon.parent = spacecraft;
    
    const rightCannon = BABYLON.MeshBuilder.CreateCylinder("rightCannon", {
        height: 2.5,
        diameter: 0.3,
        tessellation: 12
    }, scene);
    rightCannon.rotation.x = Math.PI / 2;
    rightCannon.position.x = 1.3;
    rightCannon.position.y = -0.2;
    rightCannon.position.z = 1.5;
    rightCannon.parent = spacecraft;
    
    // Create materials
    const kilrathiMaterial = new BABYLON.StandardMaterial("kilrathiMaterial", scene);
    kilrathiMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.2, 0.2); // Reddish-brown
    kilrathiMaterial.specularColor = new BABYLON.Color3(0.3, 0.2, 0.2);
    kilrathiMaterial.specularPower = 32;
    fuselage.material = kilrathiMaterial;
    
    const wingMaterial = new BABYLON.StandardMaterial("wingMaterial", scene);
    wingMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.3); // Darker reddish-brown
    wingMaterial.specularColor = new BABYLON.Color3(0.5, 0.3, 0.3);
    topWing.material = wingMaterial;
    bottomWing.material = wingMaterial;
    wingPlateLeft.material = wingMaterial;
    wingPlateRight.material = wingMaterial;
    
    const cockpitMaterial = new BABYLON.StandardMaterial("cockpitMaterial", scene);
    cockpitMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.3); // Greenish tint
    cockpitMaterial.alpha = 0.7;
    cockpitMaterial.specularPower = 128;
    cockpit.material = cockpitMaterial;
    
    const engineMaterial = new BABYLON.StandardMaterial("engineMaterial", scene);
    engineMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Dark gray
    engineMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    engineHousing.material = engineMaterial;
    leftEngine.material = engineMaterial;
    rightEngine.material = engineMaterial;
    
    const weaponMaterial = new BABYLON.StandardMaterial("weaponMaterial", scene);
    weaponMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Very dark gray
    weaponMaterial.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    leftCannon.material = weaponMaterial;
    rightCannon.material = weaponMaterial;
    
    // Create engine glow effect
    const engineGlowMaterial = new BABYLON.StandardMaterial("engineGlowMaterial", scene);
    engineGlowMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.3, 0.1); // Orange glow
    
    const leftEngineGlow = BABYLON.MeshBuilder.CreateCylinder("leftEngineGlow", {
        height: 0.2,
        diameter: 0.6,
        tessellation: 16
    }, scene);
    leftEngineGlow.rotation.x = Math.PI / 2;
    leftEngineGlow.position.x = -0.7;
    leftEngineGlow.position.z = -3.0;
    leftEngineGlow.material = engineGlowMaterial;
    leftEngineGlow.parent = spacecraft;
    
    const rightEngineGlow = BABYLON.MeshBuilder.CreateCylinder("rightEngineGlow", {
        height: 0.2,
        diameter: 0.6,
        tessellation: 16
    }, scene);
    rightEngineGlow.rotation.x = Math.PI / 2;
    rightEngineGlow.position.x = 0.7;
    rightEngineGlow.position.z = -3.0;
    rightEngineGlow.material = engineGlowMaterial;
    rightEngineGlow.parent = spacecraft;
    
    // Add engine particle effects
    const leftEngineParticles = createEngineParticles(scene, leftEngineGlow, {
        capacity: 2000,
        emitRate: 100,
        minSize: 0.1,
        maxSize: 0.3,
        color1: new BABYLON.Color4(0.9, 0.5, 0.2, 1.0), // Orange/red
        color2: new BABYLON.Color4(0.7, 0.3, 0.1, 1.0)  // Deep orange
    });
    
    const rightEngineParticles = createEngineParticles(scene, rightEngineGlow, {
        capacity: 2000,
        emitRate: 100,
        minSize: 0.1,
        maxSize: 0.3,
        color1: new BABYLON.Color4(0.9, 0.5, 0.2, 1.0), // Orange/red
        color2: new BABYLON.Color4(0.7, 0.3, 0.1, 1.0)  // Deep orange
    });
    
    // Store particle systems for later updates
    spacecraft.particleSystems = {
        left: leftEngineParticles,
        right: rightEngineParticles
    };
    
    // Add properties for the ship
    spacecraft.speed = 0;
    spacecraft.maxSpeed = 12; // Slightly faster than human ships
    spacecraft.health = 90;   // Slightly lower health/hull
    spacecraft.shields = 80;  // Slightly weaker shields
    spacecraft.energy = 100;
    spacecraft.energyRechargeRate = 0.12;
    spacecraft.shieldRechargeRate = 0.04;
    
    // Add a custom direction vector 
    spacecraft.direction = new BABYLON.Vector3(0, 0, 1);
    
    // Add spacecraft type and affiliation
    spacecraft.type = 'fighter';
    spacecraft.affiliation = 'kilrathi';
    spacecraft.name = 'Dralthi Fighter';
    
    // Add metadata for targeting
    spacecraft.metadata = {
        isTargetable: true,
        isProjectile: false,
        type: 'spacecraft',
        class: 'fighter',
        race: 'kilrathi',
        variant: 'dralthi'
    };
    
    // Rotate the spacecraft to face forward (Z axis)
    spacecraft.rotation.y = Math.PI;
    
    return spacecraft;
}

/**
 * Creates a Kilrathi heavy fighter (Salthi)
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} options - Configuration options
 * @returns {BABYLON.TransformNode} The created spacecraft
 */
export async function createKilrathiSalthi(scene, options = {}) {
    // Create a container for all spacecraft parts
    const spacecraft = new BABYLON.TransformNode("kilrathi_salthi", scene);
    
    // Create the main body (fuselage) - more elongated than the Dralthi
    const fuselage = BABYLON.MeshBuilder.CreateSphere("fuselage", { 
        diameterX: 2.0, 
        diameterY: 1.2, 
        diameterZ: 4.5,
        segments: 16
    }, scene);
    fuselage.parent = spacecraft;
    
    // Create distinctive Salthi wing
    // The Salthi has a single large wing that wraps around
    const centralWing = BABYLON.MeshBuilder.CreateTorus("centralWing", {
        diameter: 6,
        thickness: 0.8,
        tessellation: 32
    }, scene);
    centralWing.parent = spacecraft;
    centralWing.rotation.x = Math.PI / 2;
    
    // Cockpit (forward position)
    const cockpit = BABYLON.MeshBuilder.CreateSphere("cockpit", {
        diameterX: 1.3,
        diameterY: 0.9,
        diameterZ: 1.6,
        segments: 16
    }, scene);
    cockpit.position.z = 2.2;
    cockpit.position.y = 0.3;
    cockpit.parent = spacecraft;
    
    // Engine section
    const engineHousing = BABYLON.MeshBuilder.CreateCylinder("engineHousing", {
        height: 2,
        diameter: 2.0,
        tessellation: 20
    }, scene);
    engineHousing.rotation.x = Math.PI / 2;
    engineHousing.position.z = -2.5;
    engineHousing.parent = spacecraft;
    
    // Single large engine for the Salthi
    const mainEngine = BABYLON.MeshBuilder.CreateCylinder("mainEngine", {
        height: 1.5,
        diameterTop: 1.4,
        diameterBottom: 1.0,
        tessellation: 20
    }, scene);
    mainEngine.rotation.x = Math.PI / 2;
    mainEngine.position.z = -3.5;
    mainEngine.parent = spacecraft;
    
    // Add weaponry (heavy triple cannons)
    const leftCannon = BABYLON.MeshBuilder.CreateCylinder("leftCannon", {
        height: 3.0,
        diameter: 0.4,
        tessellation: 12
    }, scene);
    leftCannon.rotation.x = Math.PI / 2;
    leftCannon.position.x = -1.0;
    leftCannon.position.y = -0.2;
    leftCannon.position.z = 2.0;
    leftCannon.parent = spacecraft;
    
    const centerCannon = BABYLON.MeshBuilder.CreateCylinder("centerCannon", {
        height: 3.5, // Slightly longer center cannon
        diameter: 0.5,
        tessellation: 12
    }, scene);
    centerCannon.rotation.x = Math.PI / 2;
    centerCannon.position.y = 0.2;
    centerCannon.position.z = 2.2;
    centerCannon.parent = spacecraft;
    
    const rightCannon = BABYLON.MeshBuilder.CreateCylinder("rightCannon", {
        height: 3.0,
        diameter: 0.4,
        tessellation: 12
    }, scene);
    rightCannon.rotation.x = Math.PI / 2;
    rightCannon.position.x = 1.0;
    rightCannon.position.y = -0.2;
    rightCannon.position.z = 2.0;
    rightCannon.parent = spacecraft;
    
    // Create materials
    const kilrathiMaterial = new BABYLON.StandardMaterial("kilrathiMaterial", scene);
    kilrathiMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.2, 0.3); // Darker red
    kilrathiMaterial.specularColor = new BABYLON.Color3(0.4, 0.2, 0.3);
    kilrathiMaterial.specularPower = 32;
    fuselage.material = kilrathiMaterial;
    
    const wingMaterial = new BABYLON.StandardMaterial("wingMaterial", scene);
    wingMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.2); // Darker brown
    wingMaterial.specularColor = new BABYLON.Color3(0.4, 0.3, 0.3);
    centralWing.material = wingMaterial;
    
    const cockpitMaterial = new BABYLON.StandardMaterial("cockpitMaterial", scene);
    cockpitMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.3); // Greenish tint
    cockpitMaterial.alpha = 0.7;
    cockpitMaterial.specularPower = 128;
    cockpit.material = cockpitMaterial;
    
    const engineMaterial = new BABYLON.StandardMaterial("engineMaterial", scene);
    engineMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25); // Dark gray
    engineMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    engineHousing.material = engineMaterial;
    mainEngine.material = engineMaterial;
    
    const weaponMaterial = new BABYLON.StandardMaterial("weaponMaterial", scene);
    weaponMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15); // Very dark gray
    weaponMaterial.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    leftCannon.material = weaponMaterial;
    centerCannon.material = weaponMaterial;
    rightCannon.material = weaponMaterial;
    
    // Create engine glow effect
    const engineGlowMaterial = new BABYLON.StandardMaterial("engineGlowMaterial", scene);
    engineGlowMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.4, 0.1); // Orange-red glow
    
    const engineGlow = BABYLON.MeshBuilder.CreateCylinder("engineGlow", {
        height: 0.3,
        diameter: 1.0,
        tessellation: 20
    }, scene);
    engineGlow.rotation.x = Math.PI / 2;
    engineGlow.position.z = -4.3;
    engineGlow.material = engineGlowMaterial;
    engineGlow.parent = spacecraft;
    
    // Add engine particle effects
    const engineParticles = createEngineParticles(scene, engineGlow, {
        capacity: 2500,
        emitRate: 150,
        minSize: 0.15,
        maxSize: 0.4,
        color1: new BABYLON.Color4(0.9, 0.4, 0.2, 1.0), // Orange/red
        color2: new BABYLON.Color4(0.6, 0.2, 0.1, 1.0)  // Deep red
    });
    
    // Store particle systems for later updates
    spacecraft.particleSystems = {
        main: engineParticles
    };
    
    // Update method for engine particles
    spacecraft.updateEngineParticles = function(afterburnerActive, thrustInput) {
        if (this.particleSystems.main) {
            const particles = this.particleSystems.main;
            
            // Adjust particle emission rate based on thrust
            const baseEmitRate = 100;
            const thrustFactor = Math.max(0, thrustInput);
            const afterburnerFactor = afterburnerActive ? 2 : 1;
            
            particles.emitRate = baseEmitRate * thrustFactor * afterburnerFactor;
            
            // Modify particle velocities for afterburner effect
            if (afterburnerActive) {
                particles.minEmitPower = 2;
                particles.maxEmitPower = 4;
            } else {
                particles.minEmitPower = 1;
                particles.maxEmitPower = 2;
            }
        }
    };
    
    // Add properties for the ship
    spacecraft.speed = 0;
    spacecraft.maxSpeed = 10;     // Slower but powerful
    spacecraft.health = 110;      // Higher hull strength
    spacecraft.shields = 100;     // Better shields than Dralthi
    spacecraft.energy = 120;      // More power for weapons
    spacecraft.energyRechargeRate = 0.1;
    spacecraft.shieldRechargeRate = 0.05;
    
    // Add a custom direction vector 
    spacecraft.direction = new BABYLON.Vector3(0, 0, 1);
    
    // Add spacecraft type and affiliation
    spacecraft.type = 'heavy_fighter';
    spacecraft.affiliation = 'kilrathi';
    spacecraft.name = 'Salthi Heavy Fighter';
    
    // Add metadata for targeting
    spacecraft.metadata = {
        isTargetable: true,
        isProjectile: false,
        type: 'spacecraft',
        class: 'heavy_fighter',
        race: 'kilrathi',
        variant: 'salthi'
    };
    
    // Rotate the spacecraft to face forward (Z axis)
    spacecraft.rotation.y = Math.PI;
    
    return spacecraft;
}

/**
 * Creates a Kilrathi Krant medium fighter
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} options - Configuration options
 * @returns {BABYLON.TransformNode} The created spacecraft
 */
export async function createKilrathiKrant(scene, options = {}) {
    // Create a container for all spacecraft parts
    const spacecraft = new BABYLON.TransformNode("kilrathi_krant", scene);
    
    // Create the main body - more angular than other Kilrathi designs
    const fuselage = BABYLON.MeshBuilder.CreateBox("fuselage", { 
        width: 3, 
        height: 1.2, 
        depth: 5 
    }, scene);
    fuselage.parent = spacecraft;
    
    // Create nose section (tapered front)
    const nose = BABYLON.MeshBuilder.CreateCylinder("nose", {
        height: 2.5,
        diameterTop: 0.1,
        diameterBottom: 3,
        tessellation: 6 // Hexagonal cross-section
    }, scene);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 3;
    nose.parent = spacecraft;
    
    // Create upper and lower mandibles (distinctive Krant feature)
    const upperMandible = BABYLON.MeshBuilder.CreateBox("upperMandible", {
        width: 1,
        height: 0.4,
        depth: 2.5
    }, scene);
    upperMandible.position.z = 2.5;
    upperMandible.position.y = 0.7;
    upperMandible.parent = spacecraft;
    
    const lowerMandible = BABYLON.MeshBuilder.CreateBox("lowerMandible", {
        width: 1,
        height: 0.4,
        depth: 2.5
    }, scene);
    lowerMandible.position.z = 2.5;
    lowerMandible.position.y = -0.7;
    lowerMandible.parent = spacecraft;
    
    // Angular wing design
    const leftWing = BABYLON.MeshBuilder.CreateBox("leftWing", {
        width: 5,
        height: 0.3,
        depth: 3.5
    }, scene);
    leftWing.position.x = -3.5;
    leftWing.position.y = 0;
    leftWing.position.z = -0.5;
    // Rotate wing slightly for angled look
    leftWing.rotation.z = -0.2; 
    leftWing.parent = spacecraft;
    
    const rightWing = BABYLON.MeshBuilder.CreateBox("rightWing", {
        width: 5,
        height: 0.3,
        depth: 3.5
    }, scene);
    rightWing.position.x = 3.5;
    rightWing.position.y = 0;
    rightWing.position.z = -0.5;
    // Rotate wing slightly for angled look
    rightWing.rotation.z = 0.2;
    rightWing.parent = spacecraft;
    
    // Wing shields (armor plates)
    const leftWingShield = BABYLON.MeshBuilder.CreateBox("leftWingShield", {
        width: 0.4,
        height: 1.5,
        depth: 3
    }, scene);
    leftWingShield.position.x = -5.5;
    leftWingShield.position.y = 0.5;
    leftWingShield.position.z = -0.5;
    leftWingShield.parent = spacecraft;
    
    const rightWingShield = BABYLON.MeshBuilder.CreateBox("rightWingShield", {
        width: 0.4,
        height: 1.5,
        depth: 3
    }, scene);
    rightWingShield.position.x = 5.5;
    rightWingShield.position.y = 0.5;
    rightWingShield.position.z = -0.5;
    rightWingShield.parent = spacecraft;
    
    // Cockpit section
    const cockpit = BABYLON.MeshBuilder.CreateSphere("cockpit", {
        diameterX: 1.5,
        diameterY: 1.0,
        diameterZ: 1.8,
        segments: 16
    }, scene);
    cockpit.position.z = 1;
    cockpit.position.y = 0.5;
    cockpit.parent = spacecraft;
    
    // Engine section 
    const engineHousing = BABYLON.MeshBuilder.CreateBox("engineHousing", {
        width: 3,
        height: 1.5,
        depth: 2
    }, scene);
    engineHousing.position.z = -2.5;
    engineHousing.parent = spacecraft;
    
    // Dual engines
    const leftEngine = BABYLON.MeshBuilder.CreateCylinder("leftEngine", {
        height: 1.2,
        diameterTop: 1.0,
        diameterBottom: 0.8,
        tessellation: 16
    }, scene);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.x = -1;
    leftEngine.position.z = -3.5;
    leftEngine.parent = spacecraft;
    
    const rightEngine = BABYLON.MeshBuilder.CreateCylinder("rightEngine", {
        height: 1.2,
        diameterTop: 1.0,
        diameterBottom: 0.8,
        tessellation: 16
    }, scene);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.x = 1;
    rightEngine.position.z = -3.5;
    rightEngine.parent = spacecraft;
    
    // Add weaponry
    // Wing-mounted cannons
    const leftCannon = BABYLON.MeshBuilder.CreateCylinder("leftCannon", {
        height: 3.0,
        diameter: 0.4,
        tessellation: 8
    }, scene);
    leftCannon.rotation.x = Math.PI / 2;
    leftCannon.position.x = -4.0;
    leftCannon.position.z = 0.5;
    leftCannon.parent = spacecraft;
    
    const rightCannon = BABYLON.MeshBuilder.CreateCylinder("rightCannon", {
        height: 3.0,
        diameter: 0.4,
        tessellation: 8
    }, scene);
    rightCannon.rotation.x = Math.PI / 2;
    rightCannon.position.x = 4.0;
    rightCannon.position.z = 0.5;
    rightCannon.parent = spacecraft;
    
    // Center mandible cannons
    const centerCannon1 = BABYLON.MeshBuilder.CreateCylinder("centerCannon1", {
        height: 3.2,
        diameter: 0.3,
        tessellation: 8
    }, scene);
    centerCannon1.rotation.x = Math.PI / 2;
    centerCannon1.position.x = -0.3;
    centerCannon1.position.y = 0.7;
    centerCannon1.position.z = 3.5;
    centerCannon1.parent = spacecraft;
    
    const centerCannon2 = BABYLON.MeshBuilder.CreateCylinder("centerCannon2", {
        height: 3.2,
        diameter: 0.3,
        tessellation: 8
    }, scene);
    centerCannon2.rotation.x = Math.PI / 2;
    centerCannon2.position.x = 0.3;
    centerCannon2.position.y = 0.7;
    centerCannon2.position.z = 3.5;
    centerCannon2.parent = spacecraft;
    
    // Create materials
    const kilrathiMaterial = new BABYLON.StandardMaterial("kilrathiMaterial", scene);
    kilrathiMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.2); // Brown-red
    kilrathiMaterial.specularColor = new BABYLON.Color3(0.4, 0.3, 0.2);
    kilrathiMaterial.specularPower = 32;
    fuselage.material = kilrathiMaterial;
    nose.material = kilrathiMaterial;
    upperMandible.material = kilrathiMaterial;
    lowerMandible.material = kilrathiMaterial;
    
    const wingMaterial = new BABYLON.StandardMaterial("wingMaterial", scene);
    wingMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.2); // Darker brown
    wingMaterial.specularColor = new BABYLON.Color3(0.5, 0.3, 0.2);
    leftWing.material = wingMaterial;
    rightWing.material = wingMaterial;
    leftWingShield.material = wingMaterial;
    rightWingShield.material = wingMaterial;
    
    const cockpitMaterial = new BABYLON.StandardMaterial("cockpitMaterial", scene);
    cockpitMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.4); // Bluish-green
    cockpitMaterial.alpha = 0.7;
    cockpitMaterial.specularPower = 128;
    cockpit.material = cockpitMaterial;
    
    const engineMaterial = new BABYLON.StandardMaterial("engineMaterial", scene);
    engineMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Dark gray
    engineMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    engineHousing.material = engineMaterial;
    leftEngine.material = engineMaterial;
    rightEngine.material = engineMaterial;
    
    const weaponMaterial = new BABYLON.StandardMaterial("weaponMaterial", scene);
    weaponMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Very dark gray
    weaponMaterial.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    leftCannon.material = weaponMaterial;
    rightCannon.material = weaponMaterial;
    centerCannon1.material = weaponMaterial;
    centerCannon2.material = weaponMaterial;
    
    // Create engine glow effect
    const engineGlowMaterial = new BABYLON.StandardMaterial("engineGlowMaterial", scene);
    engineGlowMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.3, 0.2); // Orange-red glow
    
    const leftEngineGlow = BABYLON.MeshBuilder.CreateCylinder("leftEngineGlow", {
        height: 0.2,
        diameter: 0.8,
        tessellation: 16
    }, scene);
    leftEngineGlow.rotation.x = Math.PI / 2;
    leftEngineGlow.position.x = -1;
    leftEngineGlow.position.z = -4.1;
    leftEngineGlow.material = engineGlowMaterial;
    leftEngineGlow.parent = spacecraft;
    
    const rightEngineGlow = BABYLON.MeshBuilder.CreateCylinder("rightEngineGlow", {
        height: 0.2,
        diameter: 0.8,
        tessellation: 16
    }, scene);
    rightEngineGlow.rotation.x = Math.PI / 2;
    rightEngineGlow.position.x = 1;
    rightEngineGlow.position.z = -4.1;
    rightEngineGlow.material = engineGlowMaterial;
    rightEngineGlow.parent = spacecraft;
    
    // Add engine particle effects
    const leftEngineParticles = createEngineParticles(scene, leftEngineGlow, {
        capacity: 2000,
        emitRate: 120,
        minSize: 0.1,
        maxSize: 0.4,
        color1: new BABYLON.Color4(0.8, 0.4, 0.1, 1.0), // Orange/red
        color2: new BABYLON.Color4(0.6, 0.2, 0.1, 1.0)  // Deep red
    });
    
    const rightEngineParticles = createEngineParticles(scene, rightEngineGlow, {
        capacity: 2000,
        emitRate: 120,
        minSize: 0.1,
        maxSize: 0.4,
        color1: new BABYLON.Color4(0.8, 0.4, 0.1, 1.0), // Orange/red
        color2: new BABYLON.Color4(0.6, 0.2, 0.1, 1.0)  // Deep red
    });
    
    // Store particle systems for later updates
    spacecraft.particleSystems = {
        left: leftEngineParticles,
        right: rightEngineParticles
    };
    
    // Add properties for the ship
    spacecraft.speed = 0;
    spacecraft.maxSpeed = 11;     // Good mix of speed and firepower
    spacecraft.health = 100;      // Standard hull
    spacecraft.shields = 110;     // Better shields
    spacecraft.energy = 130;      // Strong power for weapons
    spacecraft.energyRechargeRate = 0.12;
    spacecraft.shieldRechargeRate = 0.05;
    
    // Add a custom direction vector 
    spacecraft.direction = new BABYLON.Vector3(0, 0, 1);
    
    // Add spacecraft type and affiliation
    spacecraft.type = 'medium_fighter';
    spacecraft.affiliation = 'kilrathi';
    spacecraft.name = 'Krant Medium Fighter';
    
    // Add metadata for targeting
    spacecraft.metadata = {
        isTargetable: true,
        isProjectile: false,
        type: 'spacecraft',
        class: 'medium_fighter',
        race: 'kilrathi',
        variant: 'krant'
    };
    
    // Rotate the spacecraft to face forward (Z axis)
    spacecraft.rotation.y = Math.PI;
    
    return spacecraft;
}