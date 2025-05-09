import * as BABYLON from 'babylonjs';
import { createEngineParticles } from './effects';

// Create a simple spacecraft model using basic shapes
export async function createSimpleSpacecraft(scene) {
    // Create a container for all spacecraft parts
    const spacecraft = new BABYLON.TransformNode("spacecraft", scene);
    
    // Create the main body (fuselage)
    const fuselage = BABYLON.MeshBuilder.CreateBox("fuselage", { 
        width: 2, 
        height: 0.6, 
        depth: 4 
    }, scene);
    fuselage.parent = spacecraft;
    
    // Create cockpit
    const cockpit = BABYLON.MeshBuilder.CreateSphere("cockpit", {
        diameterX: 1.2,
        diameterY: 0.8,
        diameterZ: 1.5,
        segments: 16
    }, scene);
    cockpit.position.z = 1.2;
    cockpit.position.y = 0.2;
    cockpit.parent = spacecraft;
    
    // Create wings
    const leftWing = BABYLON.MeshBuilder.CreateBox("leftWing", {
        width: 3,
        height: 0.2,
        depth: 2
    }, scene);
    leftWing.position.x = -1.8;
    leftWing.position.y = -0.1;
    leftWing.position.z = -0.5;
    leftWing.parent = spacecraft;
    
    const rightWing = BABYLON.MeshBuilder.CreateBox("rightWing", {
        width: 3,
        height: 0.2,
        depth: 2
    }, scene);
    rightWing.position.x = 1.8;
    rightWing.position.y = -0.1;
    rightWing.position.z = -0.5;
    rightWing.parent = spacecraft;
    
    // Create wing tips
    const leftWingTip = BABYLON.MeshBuilder.CreateBox("leftWingTip", {
        width: 0.5,
        height: 0.5,
        depth: 1.2
    }, scene);
    leftWingTip.position.x = -3.2;
    leftWingTip.position.y = 0;
    leftWingTip.position.z = -0.5;
    leftWingTip.parent = spacecraft;
    
    const rightWingTip = BABYLON.MeshBuilder.CreateBox("rightWingTip", {
        width: 0.5,
        height: 0.5,
        depth: 1.2
    }, scene);
    rightWingTip.position.x = 3.2;
    rightWingTip.position.y = 0;
    rightWingTip.position.z = -0.5;
    rightWingTip.parent = spacecraft;
    
    // Create engines
    const leftEngine = BABYLON.MeshBuilder.CreateCylinder("leftEngine", {
        height: 1.5,
        diameter: 0.8
    }, scene);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.x = -1;
    leftEngine.position.y = -0.3;
    leftEngine.position.z = -2;
    leftEngine.parent = spacecraft;
    
    const rightEngine = BABYLON.MeshBuilder.CreateCylinder("rightEngine", {
        height: 1.5,
        diameter: 0.8
    }, scene);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.x = 1;
    rightEngine.position.y = -0.3;
    rightEngine.position.z = -2;
    rightEngine.parent = spacecraft;
    
    // Create tail fin
    const tailFin = BABYLON.MeshBuilder.CreateBox("tailFin", {
        width: 0.2,
        height: 1.2,
        depth: 1.5
    }, scene);
    tailFin.position.y = 0.8;
    tailFin.position.z = -1.5;
    tailFin.parent = spacecraft;
    
    // Create materials
    const fuselageMaterial = new BABYLON.StandardMaterial("fuselageMaterial", scene);
    fuselageMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.6);
    fuselageMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.6);
    fuselage.material = fuselageMaterial;
    leftWing.material = fuselageMaterial;
    rightWing.material = fuselageMaterial;
    tailFin.material = fuselageMaterial;
    
    const cockpitMaterial = new BABYLON.StandardMaterial("cockpitMaterial", scene);
    cockpitMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.8);
    cockpitMaterial.alpha = 0.7;
    cockpitMaterial.specularPower = 128;
    cockpit.material = cockpitMaterial;
    
    const engineMaterial = new BABYLON.StandardMaterial("engineMaterial", scene);
    engineMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    engineMaterial.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    leftEngine.material = engineMaterial;
    rightEngine.material = engineMaterial;
    
    const wingTipMaterial = new BABYLON.StandardMaterial("wingTipMaterial", scene);
    wingTipMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.1, 0.1);
    leftWingTip.material = wingTipMaterial;
    rightWingTip.material = wingTipMaterial;
    
    // Create engine glow
    const engineGlowMaterial = new BABYLON.StandardMaterial("engineGlowMaterial", scene);
    engineGlowMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.9);
    
    const leftEngineGlow = BABYLON.MeshBuilder.CreateCylinder("leftEngineGlow", {
        height: 0.2,
        diameter: 0.7
    }, scene);
    leftEngineGlow.rotation.x = Math.PI / 2;
    leftEngineGlow.position.x = -1;
    leftEngineGlow.position.y = -0.3;
    leftEngineGlow.position.z = -2.8;
    leftEngineGlow.material = engineGlowMaterial;
    leftEngineGlow.parent = spacecraft;
    
    const rightEngineGlow = BABYLON.MeshBuilder.CreateCylinder("rightEngineGlow", {
        height: 0.2,
        diameter: 0.7
    }, scene);
    rightEngineGlow.rotation.x = Math.PI / 2;
    rightEngineGlow.position.x = 1;
    rightEngineGlow.position.y = -0.3;
    rightEngineGlow.position.z = -2.8;
    rightEngineGlow.material = engineGlowMaterial;
    rightEngineGlow.parent = spacecraft;
    
    // Add engine particle effects using our enhanced system
    const leftEngineParticles = createEngineParticles(scene, leftEngineGlow, {
        capacity: 2000,
        emitRate: 100,
        minSize: 0.1,
        maxSize: 0.3,
        color1: new BABYLON.Color4(0.7, 0.5, 1.0, 1.0),
        color2: new BABYLON.Color4(0.2, 0.2, 1.0, 1.0)
    });
    
    // Create right engine particles
    const rightEngineParticles = createEngineParticles(scene, rightEngineGlow, {
        capacity: 2000,
        emitRate: 100,
        minSize: 0.1,
        maxSize: 0.3,
        color1: new BABYLON.Color4(0.7, 0.5, 1.0, 1.0),
        color2: new BABYLON.Color4(0.2, 0.2, 1.0, 1.0)
    });
    
    // Store particle systems for later updates
    spacecraft.particleSystems = {
        left: leftEngineParticles,
        right: rightEngineParticles
    };
    
    // Add properties for the ship
    spacecraft.speed = 0;
    spacecraft.maxSpeed = 10;
    spacecraft.health = 100;
    spacecraft.shields = 100;
    spacecraft.energy = 100;
    spacecraft.energyRechargeRate = 0.1;
    spacecraft.shieldRechargeRate = 0.05;
    
    // Add a custom direction vector instead of using forward
    spacecraft.direction = new BABYLON.Vector3(0, 0, 1);
    
    // Add spacecraft type and affiliation
    spacecraft.type = 'fighter';
    spacecraft.affiliation = 'confederation';
    
    // Add metadata for targeting
    spacecraft.metadata = {
        isTargetable: true,
        isProjectile: false,
        type: 'spacecraft',
        class: 'fighter'
    };
    
    // Rotate the spacecraft to face forward (Z axis)
    spacecraft.rotation.y = Math.PI;
    
    return spacecraft;
}