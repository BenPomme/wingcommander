import * as BABYLON from 'babylonjs';
import { createLandingGuides } from './landingGuides';

/**
 * Creates the TCS Tiger's Claw carrier model
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @returns {Promise<Object>} The carrier object with components
 */
export async function createCarrierModel(scene) {
    // Create a carrier container
    const carrier = new BABYLON.TransformNode("tigersClaw", scene);
    
    // Main carrier body
    const body = BABYLON.MeshBuilder.CreateBox("carrierBody", {
        width: 150,
        height: 40,
        depth: 400
    }, scene);
    body.position = new BABYLON.Vector3(0, 0, 0);
    body.parent = carrier;
    
    // Create materials
    const carrierMaterial = new BABYLON.StandardMaterial("carrierMaterial", scene);
    carrierMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    carrierMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.4);
    carrierMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
    body.material = carrierMaterial;
    
    // Front section (tapered)
    const frontSection = BABYLON.MeshBuilder.CreateBox("frontSection", {
        width: 120,
        height: 30,
        depth: 100
    }, scene);
    frontSection.position = new BABYLON.Vector3(0, -5, -230);
    frontSection.scaling = new BABYLON.Vector3(0.7, 0.8, 1);
    frontSection.material = carrierMaterial;
    frontSection.parent = carrier;
    
    // Bridge section
    const bridge = BABYLON.MeshBuilder.CreateBox("bridge", {
        width: 60,
        height: 20,
        depth: 80
    }, scene);
    bridge.position = new BABYLON.Vector3(0, 30, -80);
    bridge.material = carrierMaterial;
    bridge.parent = carrier;
    
    // Bridge towers
    const leftTower = BABYLON.MeshBuilder.CreateCylinder("leftTower", {
        height: 40,
        diameter: 15
    }, scene);
    leftTower.position = new BABYLON.Vector3(20, 50, -80);
    leftTower.material = carrierMaterial;
    leftTower.parent = carrier;
    
    const rightTower = BABYLON.MeshBuilder.CreateCylinder("rightTower", {
        height: 40,
        diameter: 15
    }, scene);
    rightTower.position = new BABYLON.Vector3(-20, 50, -80);
    rightTower.material = carrierMaterial;
    rightTower.parent = carrier;
    
    // Landing deck
    const landingDeck = BABYLON.MeshBuilder.CreateBox("landingDeck", {
        width: 100,
        height: 2,
        depth: 250
    }, scene);
    landingDeck.position = new BABYLON.Vector3(0, 20, 50);
    
    // Landing deck material with markings
    const deckMaterial = new BABYLON.StandardMaterial("deckMaterial", scene);
    deckMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    
    // Create a dynamic texture for the landing deck markings
    const deckTexture = new BABYLON.DynamicTexture("deckTexture", { width: 1024, height: 2048 }, scene);
    const ctx = deckTexture.getContext();
    
    // Fill with dark gray
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, 1024, 2048);
    
    // Draw landing stripes
    ctx.fillStyle = "#FFFF00"; // Yellow markings
    
    // Center line
    ctx.fillRect(500, 0, 24, 2048);
    
    // Cross markers every 200px
    for (let i = 200; i < 2048; i += 200) {
        ctx.fillRect(300, i, 424, 20);
    }
    
    // Edge markings
    ctx.fillRect(100, 0, 20, 2048);
    ctx.fillRect(904, 0, 20, 2048);
    
    // Update texture
    deckTexture.update();
    
    // Apply texture to deck
    deckMaterial.diffuseTexture = deckTexture;
    landingDeck.material = deckMaterial;
    landingDeck.parent = carrier;
    
    // Side hangar sections
    const leftHangar = BABYLON.MeshBuilder.CreateBox("leftHangar", {
        width: 30,
        height: 25,
        depth: 300
    }, scene);
    leftHangar.position = new BABYLON.Vector3(65, 5, 30);
    leftHangar.material = carrierMaterial;
    leftHangar.parent = carrier;
    
    const rightHangar = BABYLON.MeshBuilder.CreateBox("rightHangar", {
        width: 30,
        height: 25,
        depth: 300
    }, scene);
    rightHangar.position = new BABYLON.Vector3(-65, 5, 30);
    rightHangar.material = carrierMaterial;
    rightHangar.parent = carrier;
    
    // Engine section (rear)
    const engineSection = BABYLON.MeshBuilder.CreateCylinder("engineSection", {
        height: 60,
        diameter: 80,
        tessellation: 24
    }, scene);
    engineSection.rotation.x = Math.PI / 2;
    engineSection.position = new BABYLON.Vector3(0, 0, 200);
    engineSection.material = carrierMaterial;
    engineSection.parent = carrier;
    
    // Engine glow (four main engines)
    const engineGlowMaterial = new BABYLON.StandardMaterial("engineGlowMaterial", scene);
    engineGlowMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.5, 1);
    engineGlowMaterial.disableLighting = true;

    const enginePositions = [
        new BABYLON.Vector3(30, 20, 215),
        new BABYLON.Vector3(-30, 20, 215),
        new BABYLON.Vector3(30, -20, 215),
        new BABYLON.Vector3(-30, -20, 215)
    ];
    
    const engines = [];
    enginePositions.forEach((pos, i) => {
        const engine = BABYLON.MeshBuilder.CreateCylinder(`engine${i}`, {
            height: 5,
            diameter: 15,
            tessellation: 20
        }, scene);
        engine.rotation.x = Math.PI / 2;
        engine.position = pos;
        engine.material = engineGlowMaterial;
        engine.parent = carrier;
        engines.push(engine);
    });
    
    // Add engine glow particle systems
    const engineParticles = [];
    engines.forEach(engine => {
        const particleSystem = new BABYLON.ParticleSystem("engineParticles", 2000, scene);
        
        // Create a dynamic texture for particles with noMipmap option
        const particleTexture = new BABYLON.DynamicTexture(
            "engineParticleTexture", 
            32, 
            scene, 
            false, // generateMipMaps: false
            BABYLON.Texture.NEAREST_SAMPLINGMODE
        );
        const particleContext = particleTexture.getContext();
        
        // Draw a simple white gradient circle for the particle
        const gradient = particleContext.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");
        
        particleContext.fillStyle = gradient;
        particleContext.fillRect(0, 0, 32, 32);
        
        particleTexture.update();
        particleSystem.particleTexture = particleTexture;
        
        // Particle system settings
        particleSystem.emitter = engine;
        particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 0);
        
        // Particle properties
        particleSystem.color1 = new BABYLON.Color4(0.1, 0.3, 1.0, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.1, 0.5, 1.0, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.5, 0.0);
        
        particleSystem.minSize = 1.0;
        particleSystem.maxSize = 5.0;
        
        particleSystem.minLifeTime = 1.0;
        particleSystem.maxLifeTime = 2.0;
        
        particleSystem.emitRate = 100;
        
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        
        particleSystem.direction1 = new BABYLON.Vector3(0, 0, 2);
        particleSystem.direction2 = new BABYLON.Vector3(0, 0, 5);
        
        particleSystem.minEmitPower = 5;
        particleSystem.maxEmitPower = 10;
        particleSystem.updateSpeed = 0.05;
        
        // Start the particle system
        particleSystem.start();
        engineParticles.push(particleSystem);
    });
    
    // Add running lights on edges (red on left, green on right)
    const runningLightMaterials = {
        red: new BABYLON.StandardMaterial("redLightMaterial", scene),
        green: new BABYLON.StandardMaterial("greenLightMaterial", scene),
        yellow: new BABYLON.StandardMaterial("yellowLightMaterial", scene)
    };
    
    runningLightMaterials.red.emissiveColor = new BABYLON.Color3(1, 0, 0);
    runningLightMaterials.red.disableLighting = true;
    
    runningLightMaterials.green.emissiveColor = new BABYLON.Color3(0, 1, 0);
    runningLightMaterials.green.disableLighting = true;
    
    runningLightMaterials.yellow.emissiveColor = new BABYLON.Color3(1, 1, 0);
    runningLightMaterials.yellow.disableLighting = true;
    
    // Create running lights
    const runningLights = [
        { position: new BABYLON.Vector3(75, 5, -150), material: runningLightMaterials.red },
        { position: new BABYLON.Vector3(75, 5, 0), material: runningLightMaterials.red },
        { position: new BABYLON.Vector3(75, 5, 150), material: runningLightMaterials.red },
        { position: new BABYLON.Vector3(-75, 5, -150), material: runningLightMaterials.green },
        { position: new BABYLON.Vector3(-75, 5, 0), material: runningLightMaterials.green },
        { position: new BABYLON.Vector3(-75, 5, 150), material: runningLightMaterials.green },
        { position: new BABYLON.Vector3(0, 20, -230), material: runningLightMaterials.yellow },
        { position: new BABYLON.Vector3(0, 60, -80), material: runningLightMaterials.yellow }
    ];
    
    // Running lights created below with the animation setup
    
    // Add point lights for the running lights to illuminate the carrier
    const pointLights = [
        { position: new BABYLON.Vector3(80, 5, -150), color: new BABYLON.Color3(1, 0, 0) },
        { position: new BABYLON.Vector3(80, 5, 150), color: new BABYLON.Color3(1, 0, 0) },
        { position: new BABYLON.Vector3(-80, 5, -150), color: new BABYLON.Color3(0, 1, 0) },
        { position: new BABYLON.Vector3(-80, 5, 150), color: new BABYLON.Color3(0, 1, 0) }
    ];
    
    pointLights.forEach((lightData, i) => {
        const light = new BABYLON.PointLight(`runningPointLight${i}`, lightData.position, scene);
        light.diffuse = lightData.color;
        light.intensity = 0.5;
        light.range = 50;
        light.parent = carrier;
    });
    
    // Create landing guidance system
    const landingGuides = createLandingGuides(scene, carrier);
    
    // Create landing zone hitbox for collision detection
    const landingZone = BABYLON.MeshBuilder.CreateBox("landingZone", {
        width: 40,
        height: 10,
        depth: 60
    }, scene);
    landingZone.position = new BABYLON.Vector3(0, 25, 50);
    landingZone.isVisible = false; // Invisible hitbox
    landingZone.parent = carrier;
    
    // Flag to track if landing guidance is active
    carrier.landingMode = false;
    
    // Store mesh references with running lights for animation
    const runningLightMeshes = [];
    
    runningLights.forEach((light, i) => {
        const lightSphere = BABYLON.MeshBuilder.CreateSphere(`runningLight${i}`, {
            diameter: 4,
            segments: 8
        }, scene);
        lightSphere.position = light.position;
        lightSphere.material = light.material;
        lightSphere.parent = carrier;
        
        // Store the mesh reference
        runningLightMeshes.push(lightSphere);
    });
    
    // Animation for the running lights
    carrier.lightAnimation = () => {
        const time = scene.getEngine().getDeltaTime() / 1000;
        for (let i = 0; i < runningLightMeshes.length; i++) {
            // Make lights blink at different rates
            const blinkRate = 1 + (i % 3) * 0.5;
            const intensity = 0.5 + 0.5 * Math.sin(time * blinkRate);
            
            // Skip some frames to create blinking pattern
            if (Math.sin(time * blinkRate) > 0.7) {
                runningLightMeshes[i].visibility = 1;
            } else {
                runningLightMeshes[i].visibility = 0.3;
            }
        }
    };
    
    // Method to activate landing guidance
    carrier.activateLandingMode = () => {
        carrier.landingMode = true;
        landingGuides.activate();
    };
    
    // Method to deactivate landing guidance
    carrier.deactivateLandingMode = () => {
        carrier.landingMode = false;
        landingGuides.deactivate();
    };
    
    // Store components
    carrier.body = body;
    carrier.landingDeck = landingDeck;
    carrier.engines = engines;
    carrier.engineParticles = engineParticles;
    carrier.landingGuides = landingGuides;
    carrier.landingZone = landingZone;
    
    // Return the carrier
    return carrier;
}