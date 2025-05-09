import * as BABYLON from 'babylonjs';

/**
 * Creates the landing guidance system for the carrier
 * This system will help players align correctly for landing
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.TransformNode} carrier - The carrier container
 * @returns {Object} The landing guides object
 */

// Create dummy texture to prevent mipmapping errors
function createSolidColorTexture(scene, color) {
    const texture = new BABYLON.DynamicTexture(
        "solidColorTexture", 
        4, 
        scene, 
        false, // generateMipMaps: false
        BABYLON.Texture.NEAREST_SAMPLINGMODE
    );
    const ctx = texture.getContext();
    
    // Fill with solid color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 4, 4);
    
    texture.update();
    
    return texture;
}
export function createLandingGuides(scene, carrier) {
    // Container for all landing guide elements
    const guides = {
        active: false,
        meshes: [],
        lights: [],
        activate: null,
        deactivate: null,
        update: null
    };
    
    // Create guidance lights along the landing path
    const createGuidanceLights = () => {
        // Landing path light positions (z values relative to carrier center)
        const lightPositions = [
            -300, -250, -200, -150, -100, -50, 0, 50, 100
        ];
        
        // Landing path guide lights
        const guidanceLightMaterial = new BABYLON.StandardMaterial("guidanceLightMaterial", scene);
        guidanceLightMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
        guidanceLightMaterial.disableLighting = true;
        
        lightPositions.forEach((zPos, index) => {
            // Guide light sphere
            const lightSphere = BABYLON.MeshBuilder.CreateSphere(`guidanceLight${index}`, {
                diameter: 2,
                segments: 8
            }, scene);
            lightSphere.position = new BABYLON.Vector3(0, 25, zPos);
            lightSphere.material = guidanceLightMaterial;
            lightSphere.parent = carrier;
            lightSphere.isVisible = false; // Initially invisible
            
            // Add to meshes array
            guides.meshes.push(lightSphere);
            
            // Create actual light source
            const light = new BABYLON.PointLight(`guidancePointLight${index}`, lightSphere.position, scene);
            light.diffuse = new BABYLON.Color3(0, 1, 0);
            light.specular = new BABYLON.Color3(0, 1, 0);
            light.intensity = 0.5;
            light.range = 20;
            light.parent = carrier;
            light.setEnabled(false); // Initially disabled
            
            // Add to lights array
            guides.lights.push(light);
        });
    };
    
    // Create the landing corridor
    const createLandingCorridor = () => {
        // Create glowing lines defining the landing corridor
        const corridorMaterial = new BABYLON.StandardMaterial("corridorMaterial", scene);
        corridorMaterial.emissiveColor = new BABYLON.Color3(0, 0.8, 0);
        corridorMaterial.alpha = 0.6;
        corridorMaterial.disableLighting = true;
        
        // Left corridor line
        const leftCorridor = BABYLON.MeshBuilder.CreateLines("leftCorridor", {
            points: [
                new BABYLON.Vector3(-20, 25, -300),
                new BABYLON.Vector3(-20, 25, 100)
            ],
            updatable: true
        }, scene);
        leftCorridor.color = new BABYLON.Color3(0, 1, 0);
        leftCorridor.parent = carrier;
        leftCorridor.isVisible = false; // Initially invisible
        
        // Right corridor line
        const rightCorridor = BABYLON.MeshBuilder.CreateLines("rightCorridor", {
            points: [
                new BABYLON.Vector3(20, 25, -300),
                new BABYLON.Vector3(20, 25, 100)
            ],
            updatable: true
        }, scene);
        rightCorridor.color = new BABYLON.Color3(0, 1, 0);
        rightCorridor.parent = carrier;
        rightCorridor.isVisible = false; // Initially invisible
        
        // Bottom corridor line
        const bottomCorridor = BABYLON.MeshBuilder.CreateLines("bottomCorridor", {
            points: [
                new BABYLON.Vector3(-20, 20, -300),
                new BABYLON.Vector3(20, 20, -300),
                new BABYLON.Vector3(20, 20, 100),
                new BABYLON.Vector3(-20, 20, 100),
                new BABYLON.Vector3(-20, 20, -300)
            ],
            updatable: true
        }, scene);
        bottomCorridor.color = new BABYLON.Color3(0, 1, 0);
        bottomCorridor.parent = carrier;
        bottomCorridor.isVisible = false; // Initially invisible
        
        // Top corridor line
        const topCorridor = BABYLON.MeshBuilder.CreateLines("topCorridor", {
            points: [
                new BABYLON.Vector3(-20, 30, -300),
                new BABYLON.Vector3(20, 30, -300),
                new BABYLON.Vector3(20, 30, 100),
                new BABYLON.Vector3(-20, 30, 100),
                new BABYLON.Vector3(-20, 30, -300)
            ],
            updatable: true
        }, scene);
        topCorridor.color = new BABYLON.Color3(0, 1, 0);
        topCorridor.parent = carrier;
        topCorridor.isVisible = false; // Initially invisible
        
        // Add to meshes array
        guides.meshes.push(leftCorridor, rightCorridor, bottomCorridor, topCorridor);
    };
    
    // Create landing target indicators
    const createLandingTargets = () => {
        // Landing target material
        const targetMaterial = new BABYLON.StandardMaterial("targetMaterial", scene);
        targetMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0);
        targetMaterial.alpha = 0.8;
        targetMaterial.disableLighting = true;
        
        // Create concentric rings for the landing target
        const createRing = (diameter, height) => {
            const ring = BABYLON.MeshBuilder.CreateTorus("targetRing", {
                diameter: diameter,
                thickness: 0.5,
                tessellation: 32
            }, scene);
            ring.rotation.x = Math.PI / 2;
            ring.position = new BABYLON.Vector3(0, height, 50); // Center on the landing deck
            ring.material = targetMaterial;
            ring.parent = carrier;
            ring.isVisible = false; // Initially invisible
            
            return ring;
        };
        
        // Create rings at different sizes
        const ringLarge = createRing(30, 25);
        const ringMedium = createRing(20, 25);
        const ringSmall = createRing(10, 25);
        
        // Add to meshes array
        guides.meshes.push(ringLarge, ringMedium, ringSmall);
        
        // Create cross at the center of the target
        const createCross = () => {
            const crossMaterial = new BABYLON.StandardMaterial("crossMaterial", scene);
            crossMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
            crossMaterial.disableLighting = true;
            
            // Horizontal line
            const horizontalLine = BABYLON.MeshBuilder.CreateBox("horizontalCross", {
                width: 15,
                height: 0.5,
                depth: 0.5
            }, scene);
            horizontalLine.position = new BABYLON.Vector3(0, 25, 50);
            horizontalLine.material = crossMaterial;
            horizontalLine.parent = carrier;
            horizontalLine.isVisible = false; // Initially invisible
            
            // Vertical line
            const verticalLine = BABYLON.MeshBuilder.CreateBox("verticalCross", {
                width: 0.5,
                height: 0.5,
                depth: 15
            }, scene);
            verticalLine.position = new BABYLON.Vector3(0, 25, 50);
            verticalLine.material = crossMaterial;
            verticalLine.parent = carrier;
            verticalLine.isVisible = false; // Initially invisible
            
            return [horizontalLine, verticalLine];
        };
        
        const cross = createCross();
        
        // Add to meshes array
        guides.meshes.push(...cross);
    };
    
    // Create head-up alignment markers (virtual glide slope indicator)
    const createAlignmentMarkers = () => {
        // Material for alignment markers
        const alignmentMaterial = new BABYLON.StandardMaterial("alignmentMaterial", scene);
        alignmentMaterial.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
        alignmentMaterial.disableLighting = true;
        
        // Left and right brackets
        const createBracket = (isLeft) => {
            const xPos = isLeft ? -25 : 25;
            
            // Vertical line
            const verticalLine = BABYLON.MeshBuilder.CreateBox(`${isLeft ? 'left' : 'right'}Bracket`, {
                width: 0.5,
                height: 15,
                depth: 0.5
            }, scene);
            verticalLine.position = new BABYLON.Vector3(xPos, 25, -200);
            verticalLine.material = alignmentMaterial;
            verticalLine.parent = carrier;
            verticalLine.isVisible = false; // Initially invisible
            
            // Horizontal line
            const horizontalLine = BABYLON.MeshBuilder.CreateBox(`${isLeft ? 'left' : 'right'}BracketHoriz`, {
                width: 5,
                height: 0.5,
                depth: 0.5
            }, scene);
            horizontalLine.position = new BABYLON.Vector3(xPos + (isLeft ? 2.5 : -2.5), 25, -200);
            horizontalLine.material = alignmentMaterial;
            horizontalLine.parent = carrier;
            horizontalLine.isVisible = false; // Initially invisible
            
            return [verticalLine, horizontalLine];
        };
        
        const leftBracket = createBracket(true);
        const rightBracket = createBracket(false);
        
        // Add to meshes array
        guides.meshes.push(...leftBracket, ...rightBracket);
    };
    
    // Create all parts of the landing guidance system
    createGuidanceLights();
    createLandingCorridor();
    createLandingTargets();
    createAlignmentMarkers();
    
    // Function to activate the landing guides
    guides.activate = () => {
        guides.active = true;
        
        // Make all guide elements visible
        guides.meshes.forEach(mesh => {
            mesh.isVisible = true;
        });
        
        // Enable all lights
        guides.lights.forEach(light => {
            light.setEnabled(true);
        });
    };
    
    // Function to deactivate the landing guides
    guides.deactivate = () => {
        guides.active = false;
        
        // Hide all guide elements
        guides.meshes.forEach(mesh => {
            mesh.isVisible = false;
        });
        
        // Disable all lights
        guides.lights.forEach(light => {
            light.setEnabled(false);
        });
    };
    
    // Function to update guide animations
    guides.update = (deltaTime) => {
        if (!guides.active) return;
        
        const time = scene.getEngine().getDeltaTime() / 1000;
        
        // Animate guidance lights sequentially
        guides.lights.forEach((light, index) => {
            // Make lights pulse at different rates
            const pulseRate = 3 + (index % 4) * 0.5;
            const intensity = 0.3 + 0.7 * Math.sin(time * pulseRate + index);
            light.intensity = intensity;
            
            // Adjust the corresponding mesh visibility
            if (guides.meshes[index]) {
                guides.meshes[index].visibility = 0.3 + 0.7 * intensity;
            }
        });
        
        // Animate landing target rings
        const ringIndices = [guides.meshes.length - 5, guides.meshes.length - 4, guides.meshes.length - 3];
        ringIndices.forEach((index, i) => {
            if (guides.meshes[index]) {
                // Rotate the rings
                guides.meshes[index].rotation.z += deltaTime * (0.2 - i * 0.05);
                
                // Pulse scale
                const pulseScale = 1 + 0.1 * Math.sin(time * 2 + i);
                guides.meshes[index].scaling.x = pulseScale;
                guides.meshes[index].scaling.y = 1;
                guides.meshes[index].scaling.z = pulseScale;
            }
        });
    };
    
    // Return the landing guides object
    return guides;
}