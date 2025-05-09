import * as BABYLON from 'babylonjs';

/**
 * Environment manager for creating different space scenes and environments
 */
export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;
        this.current = null;
        this.skybox = null;
        this.environmentObjects = [];
        this.particleSystems = [];
        this.size = 2000; // Default skybox size
    }
    
    /**
     * Creates a basic skybox with stars
     * @param {String} name - Identifier for this environment
     * @param {Object} options - Configuration options
     * @returns {BABYLON.Mesh} The created skybox
     */
    createStarfield(name = 'default', options = {}) {
        // Clear any existing environment
        this.dispose();
        
        // Create new skybox
        this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: this.size }, this.scene);
        const skyboxMaterial = new BABYLON.StandardMaterial('skyboxMaterial', this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        this.skybox.material = skyboxMaterial;
        
        // Size of the texture (higher for more detail)
        const resolution = options.resolution || 1024;
        const starCount = options.starCount || 2000;
        const starSize = options.starSize || { min: 0.5, max: 2.5 };
        const starColor = options.starColor || { r: 255, g: 255, b: 255 };
        
        // Create the dynamic texture
        const spaceTexture = new BABYLON.DynamicTexture('spaceTexture', resolution, this.scene);
        const context = spaceTexture.getContext();
        
        // Background color (deep space)
        context.fillStyle = options.backgroundColor || 'black';
        context.fillRect(0, 0, resolution, resolution);
        
        // Add stars with varying sizes and brightness
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * resolution;
            const y = Math.random() * resolution;
            const size = Math.random() * (starSize.max - starSize.min) + starSize.min;
            
            // Randomize brightness
            const brightness = Math.random() * 200 + 55;
            
            // Create a star (small circle)
            context.beginPath();
            context.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 1)`;
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
            
            // Add glow to brighter stars
            if (brightness > 200 && size > 1.5) {
                const glow = context.createRadialGradient(x, y, size * 0.5, x, y, size * 4);
                glow.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness}, 0.3)`);
                glow.addColorStop(1, 'transparent');
                
                context.beginPath();
                context.fillStyle = glow;
                context.arc(x, y, size * 4, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        // Update the texture
        spaceTexture.update();
        
        // Apply to skybox
        skyboxMaterial.emissiveTexture = spaceTexture;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        
        // Make skybox render behind everything else
        this.skybox.renderingGroupId = 0;
        
        this.current = name;
        return this.skybox;
    }
    
    /**
     * Creates a nebula environment with colorful gas clouds
     * @param {String} name - Identifier for this environment
     * @param {Object} options - Configuration options
     * @returns {BABYLON.Mesh} The created skybox
     */
    createNebula(name = 'nebula', options = {}) {
        // Create base starfield first
        this.createStarfield(name, {
            starCount: options.starCount || 1500,
            resolution: options.resolution || 2048
        });
        
        // Get the current texture context
        const material = this.skybox.material;
        const texture = material.emissiveTexture;
        const context = texture.getContext();
        const resolution = texture.getSize().width;
        
        // Nebula colors
        const colors = options.colors || [
            { h: 280, s: 100, l: 60 }, // Purple
            { h: 200, s: 100, l: 50 }, // Blue
            { h: 30, s: 100, l: 60 },  // Orange
            { h: 120, s: 60, l: 50 }   // Green
        ];
        
        // Number of nebula clouds
        const cloudCount = options.cloudCount || 8;
        
        // Create multiple nebula clouds with different colors and sizes
        for (let i = 0; i < cloudCount; i++) {
            const x = Math.random() * resolution;
            const y = Math.random() * resolution;
            const radius = Math.random() * 300 + 150;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Create gradient for the cloud
            const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.3)`);
            gradient.addColorStop(0.4, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.15)`);
            gradient.addColorStop(0.8, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.05)`);
            gradient.addColorStop(1, 'transparent');
            
            // Draw cloud
            context.beginPath();
            context.fillStyle = gradient;
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            
            // Add some smaller detail clouds within the larger cloud
            const detailCount = Math.floor(Math.random() * 5) + 3;
            for (let j = 0; j < detailCount; j++) {
                const dx = x + (Math.random() * radius * 0.8) - (radius * 0.4);
                const dy = y + (Math.random() * radius * 0.8) - (radius * 0.4);
                const dradius = Math.random() * 100 + 30;
                
                // Slightly modify the color
                const hShift = Math.random() * 30 - 15;
                const detailColor = {
                    h: (color.h + hShift) % 360,
                    s: color.s - 10,
                    l: color.l + 10
                };
                
                // Create gradient for detail cloud
                const detailGradient = context.createRadialGradient(dx, dy, 0, dx, dy, dradius);
                detailGradient.addColorStop(0, `hsla(${detailColor.h}, ${detailColor.s}%, ${detailColor.l}%, 0.2)`);
                detailGradient.addColorStop(1, 'transparent');
                
                context.beginPath();
                context.fillStyle = detailGradient;
                context.arc(dx, dy, dradius, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        // Update the texture
        texture.update();
        
        return this.skybox;
    }
    
    /**
     * Creates a planet in the environment
     * @param {String} name - Name of the planet
     * @param {Object} options - Planet options
     * @returns {BABYLON.Mesh} The created planet mesh
     */
    createPlanet(name = 'planet', options = {}) {
        const position = options.position || new BABYLON.Vector3(500, 0, -1000);
        const diameter = options.diameter || 300;
        const segments = options.segments || 32;
        
        // Create the planet sphere
        const planet = BABYLON.MeshBuilder.CreateSphere(name, {
            diameter: diameter,
            segments: segments
        }, this.scene);
        
        planet.position = position;
        
        // Create material for the planet
        const planetMaterial = new BABYLON.StandardMaterial(`${name}Material`, this.scene);
        
        // Apply texture if specified, otherwise use procedural texture
        if (options.texturePath) {
            planetMaterial.diffuseTexture = new BABYLON.Texture(options.texturePath, this.scene);
        } else {
            // Create procedural planet texture
            const resolution = options.resolution || 1024;
            const planetTexture = new BABYLON.DynamicTexture(`${name}Texture`, resolution, this.scene);
            const context = planetTexture.getContext();
            
            // Planet type
            const planetType = options.type || Math.random() > 0.5 ? 'terrestrial' : 'gas';
            
            if (planetType === 'terrestrial') {
                // Create a terrestrial planet (earth-like or mars-like)
                const isEarthLike = options.isEarthLike !== undefined ? options.isEarthLike : (Math.random() > 0.5);
                
                // Base colors
                const landColor = isEarthLike ? 
                    { h: 80, s: 70, l: 40 } : // Earth-like (greenish-brown)
                    { h: 20, s: 70, l: 45 };  // Mars-like (reddish)
                    
                const waterColor = isEarthLike ?
                    { h: 210, s: 70, l: 50 } : // Earth-like (blue)
                    { h: 30, s: 80, l: 20 };   // Mars-like (dark brown)
                
                // Create the base planet color
                context.fillStyle = `hsl(${waterColor.h}, ${waterColor.s}%, ${waterColor.l}%)`;
                context.fillRect(0, 0, resolution, resolution);
                
                // Create continents using Perlin-like noise (simplified version)
                const continentCount = Math.floor(Math.random() * 5) + 3;
                for (let i = 0; i < continentCount; i++) {
                    const x = Math.random() * resolution;
                    const y = Math.random() * resolution;
                    const size = Math.random() * 300 + 100;
                    
                    // Continent shape
                    const gradient = context.createRadialGradient(x, y, 0, x, y, size);
                    gradient.addColorStop(0, `hsla(${landColor.h}, ${landColor.s}%, ${landColor.l}%, 1)`);
                    gradient.addColorStop(0.7, `hsla(${landColor.h}, ${landColor.s}%, ${landColor.l}%, 0.5)`);
                    gradient.addColorStop(1, 'transparent');
                    
                    context.beginPath();
                    context.fillStyle = gradient;
                    context.arc(x, y, size, 0, Math.PI * 2);
                    context.fill();
                    
                    // Add some terrain variation
                    const terrainVariationCount = Math.floor(Math.random() * 10) + 5;
                    for (let j = 0; j < terrainVariationCount; j++) {
                        const tx = x + (Math.random() * size * 0.8) - (size * 0.4);
                        const ty = y + (Math.random() * size * 0.8) - (size * 0.4);
                        const tsize = Math.random() * 50 + 20;
                        
                        // Adjust color for terrain variation
                        const lShift = Math.random() * 20 - 10;
                        
                        const terrainGradient = context.createRadialGradient(tx, ty, 0, tx, ty, tsize);
                        terrainGradient.addColorStop(0, `hsla(${landColor.h}, ${landColor.s}%, ${landColor.l + lShift}%, 0.7)`);
                        terrainGradient.addColorStop(1, 'transparent');
                        
                        context.beginPath();
                        context.fillStyle = terrainGradient;
                        context.arc(tx, ty, tsize, 0, Math.PI * 2);
                        context.fill();
                    }
                }
                
                // Add cloud layer if earth-like
                if (isEarthLike) {
                    const cloudCount = Math.floor(Math.random() * 15) + 10;
                    for (let i = 0; i < cloudCount; i++) {
                        const x = Math.random() * resolution;
                        const y = Math.random() * resolution;
                        const size = Math.random() * 80 + 40;
                        
                        const cloudGradient = context.createRadialGradient(x, y, 0, x, y, size);
                        cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                        cloudGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
                        cloudGradient.addColorStop(1, 'transparent');
                        
                        context.beginPath();
                        context.fillStyle = cloudGradient;
                        context.arc(x, y, size, 0, Math.PI * 2);
                        context.fill();
                    }
                }
                
                // Add polar ice caps
                for (let pole = 0; pole < 2; pole++) {
                    const y = pole === 0 ? 0 : resolution;
                    const height = resolution * 0.15;
                    
                    const polarGradient = context.createLinearGradient(
                        0, 
                        pole === 0 ? 0 : resolution - height,
                        0,
                        pole === 0 ? height : resolution
                    );
                    
                    polarGradient.addColorStop(pole === 0 ? 0 : 1, 'rgba(255, 255, 255, 0.9)');
                    polarGradient.addColorStop(pole === 0 ? 1 : 0, 'transparent');
                    
                    context.fillStyle = polarGradient;
                    context.fillRect(0, pole === 0 ? 0 : resolution - height, resolution, height);
                }
            } 
            else if (planetType === 'gas') {
                // Create a gas giant planet (like Jupiter or Saturn)
                // Choose base color hue
                const baseHue = options.hue || Math.floor(Math.random() * 360);
                const saturation = options.saturation || 70;
                const lightness = options.lightness || 60;
                
                // Fill the base color
                context.fillStyle = `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
                context.fillRect(0, 0, resolution, resolution);
                
                // Create bands across the planet
                const bandCount = Math.floor(Math.random() * 10) + 5;
                const bandWidth = resolution / bandCount;
                
                for (let i = 0; i < bandCount; i++) {
                    const y = i * bandWidth;
                    const bandHueShift = Math.random() * 30 - 15;
                    const bandSatShift = Math.random() * 20 - 10;
                    const bandLightShift = Math.random() * 30 - 15;
                    
                    const bandColor = `hsla(${baseHue + bandHueShift}, ${saturation + bandSatShift}%, ${lightness + bandLightShift}%, 0.4)`;
                    
                    context.fillStyle = bandColor;
                    context.fillRect(0, y, resolution, bandWidth);
                    
                    // Add some swirls or storms within the bands
                    const stormCount = Math.floor(Math.random() * 3) + 1;
                    for (let j = 0; j < stormCount; j++) {
                        const sx = Math.random() * resolution;
                        const sy = y + Math.random() * bandWidth;
                        const stormSize = Math.random() * 40 + 10;
                        
                        const stormGradient = context.createRadialGradient(sx, sy, 0, sx, sy, stormSize);
                        stormGradient.addColorStop(0, `hsla(${baseHue + 30}, ${saturation - 20}%, ${lightness + 20}%, 0.8)`);
                        stormGradient.addColorStop(1, 'transparent');
                        
                        context.beginPath();
                        context.fillStyle = stormGradient;
                        context.arc(sx, sy, stormSize, 0, Math.PI * 2);
                        context.fill();
                    }
                }
                
                // Add a big storm (like Jupiter's Great Red Spot) with small probability
                if (Math.random() < 0.3) {
                    const spotX = resolution * (0.3 + Math.random() * 0.4);
                    const spotY = resolution * (0.3 + Math.random() * 0.4);
                    const spotSize = resolution * (0.1 + Math.random() * 0.15);
                    
                    const spotColor = Math.random() < 0.5 ? 
                        `hsla(0, 80%, 60%, 0.7)` : // Red spot
                        `hsla(${baseHue + 60}, 80%, 70%, 0.7)`; // Other color spot
                    
                    const spotGradient = context.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotSize);
                    spotGradient.addColorStop(0, spotColor);
                    spotGradient.addColorStop(1, 'transparent');
                    
                    context.beginPath();
                    context.fillStyle = spotGradient;
                    context.ellipse(spotX, spotY, spotSize, spotSize * 0.6, Math.PI / 4, 0, Math.PI * 2);
                    context.fill();
                }
                
                // Add rings with some probability (like Saturn)
                if (options.hasRings || (options.hasRings === undefined && Math.random() < 0.3)) {
                    // We'll create rings as a separate mesh later
                    planet.hasRings = true;
                    planet.ringColor = {
                        h: baseHue,
                        s: saturation,
                        l: lightness
                    };
                }
            }
            
            // Update and apply the texture
            planetTexture.update();
            planetMaterial.diffuseTexture = planetTexture;
        }
        
        // Apply material to planet
        planetMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        planet.material = planetMaterial;
        
        // Add rotation animation
        const rotationSpeed = options.rotationSpeed || 0.002;
        this.scene.registerBeforeRender(() => {
            planet.rotation.y += rotationSpeed;
        });
        
        // Add atmosphere glow if specified
        if (options.atmosphere) {
            const atmosphereColor = options.atmosphereColor || new BABYLON.Color3(0.1, 0.6, 1.0);
            const glowLayer = new BABYLON.GlowLayer("planetGlow", this.scene);
            glowLayer.intensity = 0.7;
            glowLayer.addIncludedOnlyMesh(planet);
            
            // Store reference to glow layer for disposal
            planet.glowLayer = glowLayer;
        }
        
        // Create rings if this is a ringed planet
        if (planet.hasRings) {
            const ringDiameter = diameter * 2.5;
            const innerDiameter = diameter * 1.3;
            
            const rings = BABYLON.MeshBuilder.CreateDisc("rings", {
                radius: ringDiameter / 2,
                tessellation: 64,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE
            }, this.scene);
            
            // Position rings around planet
            rings.parent = planet;
            rings.rotation.x = Math.PI / 2;
            
            // Create ring material
            const ringMaterial = new BABYLON.StandardMaterial("ringMaterial", this.scene);
            
            // Create procedural ring texture
            const ringResolution = 1024;
            const ringTexture = new BABYLON.DynamicTexture("ringTexture", ringResolution, this.scene);
            const ringContext = ringTexture.getContext();
            
            // Draw ring bands
            const bandCount = Math.floor(Math.random() * 8) + 4;
            const ringColor = planet.ringColor || { h: 30, s: 30, l: 80 };
            
            // Clear the texture (transparent)
            ringContext.clearRect(0, 0, ringResolution, ringResolution);
            
            // Calculate center and outer/inner radiuses
            const center = ringResolution / 2;
            const outerRadius = ringResolution / 2;
            const innerRadius = outerRadius * (innerDiameter / ringDiameter);
            
            // Draw ring bands
            for (let i = 0; i < bandCount; i++) {
                const bandWidth = (outerRadius - innerRadius) / bandCount;
                const bandInner = innerRadius + i * bandWidth;
                const bandOuter = bandInner + bandWidth;
                
                // Vary the opacity and color slightly for each band
                const opacity = 0.3 + Math.random() * 0.5;
                const hueShift = Math.random() * 20 - 10;
                const satShift = Math.random() * 20 - 10;
                const lightShift = Math.random() * 20 - 10;
                
                const bandColor = `hsla(${ringColor.h + hueShift}, ${ringColor.s + satShift}%, ${ringColor.l + lightShift}%, ${opacity})`;
                
                // Draw the ring band
                ringContext.beginPath();
                ringContext.fillStyle = bandColor;
                ringContext.arc(center, center, bandOuter, 0, Math.PI * 2);
                ringContext.arc(center, center, bandInner, 0, Math.PI * 2, true);
                ringContext.fill();
            }
            
            // Update the texture
            ringTexture.update();
            
            // Apply the texture to the rings
            ringMaterial.diffuseTexture = ringTexture;
            ringMaterial.diffuseTexture.hasAlpha = true;
            ringMaterial.useAlphaFromDiffuseTexture = true;
            ringMaterial.backFaceCulling = false;
            ringMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            
            rings.material = ringMaterial;
            
            // Store rings reference with the planet
            planet.rings = rings;
        }
        
        // Store reference to clean up later
        this.environmentObjects.push(planet);
        
        return planet;
    }
    
    /**
     * Creates a distant star
     * @param {String} name - Name of the star
     * @param {Object} options - Star options
     * @returns {BABYLON.Mesh} The created star mesh
     */
    createStar(name = 'star', options = {}) {
        const position = options.position || new BABYLON.Vector3(-1000, 200, -1500);
        const diameter = options.diameter || 100;
        
        // Create the star sphere
        const star = BABYLON.MeshBuilder.CreateSphere(name, {
            diameter: diameter,
            segments: 16
        }, this.scene);
        
        star.position = position;
        
        // Create material for the star with emissive properties
        const starMaterial = new BABYLON.StandardMaterial(`${name}Material`, this.scene);
        starMaterial.emissiveColor = options.color || new BABYLON.Color3(1, 0.8, 0.6); // Default to yellow-orange
        starMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        starMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        star.material = starMaterial;
        
        // Add glow effect
        const glowIntensity = options.glowIntensity || 0.7;
        const glowLayer = new BABYLON.GlowLayer(`${name}Glow`, this.scene);
        glowLayer.intensity = glowIntensity;
        glowLayer.addIncludedOnlyMesh(star);
        
        // Store references for cleanup
        star.glowLayer = glowLayer;
        this.environmentObjects.push(star);
        
        // Create lens flare effect if enabled
        if (options.lensFlare !== false) {
            const lensFlareSystem = new BABYLON.LensFlareSystem(`${name}LensFlareSystem`, star, this.scene);
            
            // Main flare
            const mainFlare = new BABYLON.LensFlare(
                0.5, // size
                0, // position
                starMaterial.emissiveColor, // color
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NTkzRTUxNEIyMjc4MTFFNDg1OUJGQTFGNkE0NTQ2MDQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NTkzRTUxNEMyMjc4MTFFNDg1OUJGQTFGNkE0NTQ2MDQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo1OTNFNTE0OTIyNzgxMUU0ODU5QkZBMUY2QTQ1NDYwNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo1OTNFNTE0QTIyNzgxMUU0ODU5QkZBMUY2QTQ1NDYwNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pl9WpEEAAADxSURBVHjaYvz//z8DMYAJm8TkKdP+YxNnZGJkxKmZEZsBIANIsQSbJoh+7IagGQIzpN8nCi5mheJIoM0OQOwKxN+B+BUQf0EWt1Q3g4cpEGHQV/NlYGK2u7cHbMBrYnwQgDUD8UEg5gLiH0jyj4H4lLK+FZZQBxkCMWQfEH9Hk38GxPuQ5EFO+QvEP4GYH4qRXXQPiLVRDPgGMuA7VBCEQfG9HuQcbDEAwkuhCc0JZgAobgWhSpCIUEcRbgQaYAINUzE0Ax7DFRPQiGwgDkEzQBVqCC+SATA1X4B4IchgdAOQFYCiThiq+RjQQD60WAG5BFkdQIABAFSuJAmfhCLUAAAAAElFTkSuQmCC", 
                lensFlareSystem
            );
            
            // Additional flares
            const numFlares = Math.floor(Math.random() * 5) + 2;
            for (let i = 0; i < numFlares; i++) {
                const size = 0.1 + Math.random() * 0.3;
                const position = (Math.random() * 1.2) - 0.6; // -0.6 to 0.6
                const color = new BABYLON.Color3(
                    Math.random() * 0.5 + 0.5, // Red
                    Math.random() * 0.5 + 0.2, // Green
                    Math.random() * 0.3 + 0.1  // Blue
                );
                
                const flare = new BABYLON.LensFlare(size, position, color, null, lensFlareSystem);
            }
            
            // Store reference for cleanup
            star.lensFlareSystem = lensFlareSystem;
        }
        
        // Add particle effect for star corona
        const corona = new BABYLON.ParticleSystem(`${name}Corona`, 1000, this.scene);
        corona.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NTkzRTUxNEIyMjc4MTFFNDg1OUJGQTFGNkE0NTQ2MDQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NTkzRTUxNEMyMjc4MTFFNDg1OUJGQTFGNkE0NTQ2MDQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo1OTNFNTE0OTIyNzgxMUU0ODU5QkZBMUY2QTQ1NDYwNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo1OTNFNTE0QTIyNzgxMUU0ODU5QkZBMUY2QTQ1NDYwNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pl9WpEEAAADxSURBVHjaYvz//z8DMYAJm8TkKdP+YxNnZGJkxKmZEZsBIANIsQSbJoh+7IagGQIzpN8nCi5mheJIoM0OQOwKxN+B+BUQf0EWt1Q3g4cpEGHQV/NlYGK2u7cHbMBrYnwQgDUD8UEg5gLiH0jyj4H4lLK+FZZQBxkCMWQfEH9Hk38GxPuQ5EFO+QvEP4GYH4qRXXQPiLVRDPgGMuA7VBCEQfG9HuQcbDEAwkuhCc0JZgAobgWhSpCIUEcRbgQaYAINUzE0Ax7DFRPQiGwgDkEzQBVqCC+SATA1X4B4IchgdAOQFYCiThiq+RjQQD60WAG5BFkdQIABAFSuJAmfhCLUAAAAAElFTkSuQmCC", this.scene);
        corona.emitter = star;
        corona.minSize = 1;
        corona.maxSize = 5;
        corona.minLifeTime = 1;
        corona.maxLifeTime = 5;
        corona.emitRate = 300;
        corona.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        corona.direction1 = new BABYLON.Vector3(-1, -1, -1);
        corona.direction2 = new BABYLON.Vector3(1, 1, 1);
        corona.minEmitPower = 1;
        corona.maxEmitPower = 3;
        
        // Set star color with some random variation
        const baseColor = starMaterial.emissiveColor;
        corona.color1 = new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 0.9);
        corona.color2 = new BABYLON.Color4(Math.min(baseColor.r + 0.2, 1), Math.min(baseColor.g + 0.2, 1), Math.min(baseColor.b + 0.2, 1), 0.5);
        corona.colorDead = new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 0);
        
        corona.start();
        
        // Store reference for cleanup
        this.particleSystems.push(corona);
        star.corona = corona;
        
        return star;
    }
    
    /**
     * Creates a debris or asteroid field
     * @param {String} name - Name for the asteroid field
     * @param {Object} options - Configuration options
     * @returns {Array} Array of asteroid meshes
     */
    createAsteroidField(name = 'asteroidField', options = {}) {
        const count = options.count || 100;
        const radius = options.radius || 500;
        const center = options.center || new BABYLON.Vector3(0, 0, -500);
        const minSize = options.minSize || 5;
        const maxSize = options.maxSize || 30;
        const rotation = options.rotation || true;
        
        const asteroids = [];
        
        // Create asteroids
        for (let i = 0; i < count; i++) {
            // Create random position within field radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const height = (Math.random() - 0.5) * radius * 0.3;
            
            const position = new BABYLON.Vector3(
                center.x + distance * Math.cos(angle),
                center.y + height,
                center.z + distance * Math.sin(angle)
            );
            
            // Random size
            const size = minSize + Math.random() * (maxSize - minSize);
            
            // Create asteroid mesh - use low-poly for performance
            // We'll randomly select between different shapes for variety
            let asteroid;
            const shape = Math.floor(Math.random() * 4);
            
            switch (shape) {
                case 0:
                    // Sphere
                    asteroid = BABYLON.MeshBuilder.CreateSphere(`asteroid_${i}`, {
                        diameter: size,
                        segments: 6 // Low poly
                    }, this.scene);
                    break;
                case 1:
                    // Box
                    asteroid = BABYLON.MeshBuilder.CreateBox(`asteroid_${i}`, {
                        size: size * 0.8,
                    }, this.scene);
                    break;
                case 2:
                    // Dodecahedron (using polyhedron)
                    asteroid = BABYLON.MeshBuilder.CreatePolyhedron(`asteroid_${i}`, {
                        type: 2, // Dodecahedron
                        size: size * 0.5
                    }, this.scene);
                    break;
                case 3:
                    // Icosahedron (using polyhedron)
                    asteroid = BABYLON.MeshBuilder.CreatePolyhedron(`asteroid_${i}`, {
                        type: 3, // Icosahedron
                        size: size * 0.5
                    }, this.scene);
                    break;
            }
            
            // Position the asteroid
            asteroid.position = position;
            
            // Create material for the asteroid
            const asteroidMaterial = new BABYLON.StandardMaterial(`asteroidMaterial_${i}`, this.scene);
            
            // Randomly select color (gray to brown)
            const r = 0.3 + Math.random() * 0.2;
            const g = 0.2 + Math.random() * 0.2;
            const b = 0.1 + Math.random() * 0.1;
            
            asteroidMaterial.diffuseColor = new BABYLON.Color3(r, g, b);
            asteroidMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            asteroid.material = asteroidMaterial;
            
            // Add random rotation
            if (rotation) {
                asteroid.rotation = new BABYLON.Vector3(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );
                
                // Add constant rotation animation
                const rotationAxis = new BABYLON.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize();
                
                const rotationSpeed = Math.random() * 0.01;
                
                this.scene.registerBeforeRender(() => {
                    asteroid.rotate(rotationAxis, rotationSpeed, BABYLON.Space.LOCAL);
                });
            }
            
            // Store reference for cleanup
            asteroids.push(asteroid);
            this.environmentObjects.push(asteroid);
        }
        
        return asteroids;
    }
    
    /**
     * Creates a distant space station
     * @param {String} name - Name for the space station
     * @param {Object} options - Configuration options
     * @returns {BABYLON.Mesh} The created space station mesh
     */
    createSpaceStation(name = 'spaceStation', options = {}) {
        const position = options.position || new BABYLON.Vector3(300, 50, -800);
        const scale = options.scale || 1.0;
        
        // Create space station root
        const station = new BABYLON.TransformNode(name, this.scene);
        station.position = position;
        station.scaling = new BABYLON.Vector3(scale, scale, scale);
        
        // Create main station body (cylinder)
        const body = BABYLON.MeshBuilder.CreateCylinder(`${name}_body`, {
            height: 100,
            diameter: 40,
            tessellation: 24
        }, this.scene);
        body.parent = station;
        
        // Create central hub (sphere)
        const hub = BABYLON.MeshBuilder.CreateSphere(`${name}_hub`, {
            diameter: 50,
            segments: 16
        }, this.scene);
        hub.parent = station;
        
        // Create rings around the station
        const ring1 = BABYLON.MeshBuilder.CreateTorus(`${name}_ring1`, {
            diameter: 80,
            thickness: 8,
            tessellation: 32
        }, this.scene);
        ring1.parent = station;
        ring1.rotation.x = Math.PI / 2;
        
        // Create secondary ring
        const ring2 = BABYLON.MeshBuilder.CreateTorus(`${name}_ring2`, {
            diameter: 100,
            thickness: 5,
            tessellation: 24
        }, this.scene);
        ring2.parent = station;
        ring2.rotation.z = Math.PI / 2;
        
        // Create docking arms
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2);
            const arm = BABYLON.MeshBuilder.CreateBox(`${name}_arm_${i}`, {
                width: 60,
                height: 8,
                depth: 8
            }, this.scene);
            arm.parent = station;
            arm.position.x = Math.cos(angle) * 40;
            arm.position.z = Math.sin(angle) * 40;
            arm.rotation.y = angle;
        }
        
        // Create solar panels
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3);
            const panel = BABYLON.MeshBuilder.CreateBox(`${name}_panel_${i}`, {
                width: 40,
                height: 1,
                depth: 20
            }, this.scene);
            panel.parent = station;
            panel.position.x = Math.cos(angle) * 70;
            panel.position.z = Math.sin(angle) * 70;
            panel.position.y = (i % 2 === 0) ? 30 : -30;
            panel.rotation.y = angle + Math.PI / 4;
        }
        
        // Create materials
        const stationMaterial = new BABYLON.StandardMaterial(`${name}_material`, this.scene);
        stationMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        stationMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        const hubMaterial = new BABYLON.StandardMaterial(`${name}_hub_material`, this.scene);
        hubMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.6);
        
        const panelMaterial = new BABYLON.StandardMaterial(`${name}_panel_material`, this.scene);
        panelMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
        panelMaterial.specularColor = new BABYLON.Color3(0.6, 0.6, 0.8);
        
        // Apply materials
        body.material = stationMaterial;
        hub.material = hubMaterial;
        ring1.material = stationMaterial;
        ring2.material = stationMaterial;
        
        // Apply materials to all children
        station.getChildMeshes().forEach(mesh => {
            if (mesh.name.includes('panel')) {
                mesh.material = panelMaterial;
            } else if (!mesh.material) {
                mesh.material = stationMaterial;
            }
        });
        
        // Add rotation animation
        const rotationSpeed = options.rotationSpeed || 0.0005;
        this.scene.registerBeforeRender(() => {
            station.rotation.y += rotationSpeed;
        });
        
        // Add running lights
        const createLight = (parent, position, color) => {
            const light = new BABYLON.PointLight(`${name}_light`, position, this.scene);
            light.diffuse = color;
            light.specular = color;
            light.intensity = 0.5;
            light.range = 20;
            
            // Create glowing sphere for the light
            const sphere = BABYLON.MeshBuilder.CreateSphere(`${name}_light_sphere`, {
                diameter: 2
            }, this.scene);
            sphere.position = position;
            sphere.parent = parent;
            
            // Create emissive material
            const lightMaterial = new BABYLON.StandardMaterial(`${name}_light_material`, this.scene);
            lightMaterial.emissiveColor = color;
            lightMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            lightMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            sphere.material = lightMaterial;
            
            // Add blinking animation
            let time = 0;
            this.scene.registerBeforeRender(() => {
                time += this.scene.getEngine().getDeltaTime() / 1000;
                const pulse = (Math.sin(time * 2) + 1) / 2; // 0 to 1
                light.intensity = 0.2 + (pulse * 0.3);
            });
            
            return { light, sphere };
        };
        
        // Create multiple running lights
        const lights = [
            createLight(ring1, new BABYLON.Vector3(40, 0, 0), new BABYLON.Color3(1, 0, 0)),
            createLight(ring1, new BABYLON.Vector3(-40, 0, 0), new BABYLON.Color3(1, 0, 0)),
            createLight(ring1, new BABYLON.Vector3(0, 0, 40), new BABYLON.Color3(0, 1, 0)),
            createLight(ring1, new BABYLON.Vector3(0, 0, -40), new BABYLON.Color3(0, 1, 0)),
            createLight(body, new BABYLON.Vector3(0, 50, 0), new BABYLON.Color3(0, 0.5, 1)),
            createLight(body, new BABYLON.Vector3(0, -50, 0), new BABYLON.Color3(0, 0.5, 1))
        ];
        
        // Store all parts for cleanup
        station.allMeshes = station.getChildMeshes();
        station.lights = lights;
        this.environmentObjects.push(station);
        
        return station;
    }
    
    /**
     * Creates space dust particles for visual effect
     * @param {Object} options - Dust configuration options
     * @returns {BABYLON.ParticleSystem} The created particle system
     */
    createSpaceDust(options = {}) {
        const particleCount = options.count || 5000;
        const radius = options.radius || 1000;
        const center = options.center || new BABYLON.Vector3(0, 0, 0);
        const speed = options.speed || 0.5;
        
        // Create particle system
        const dust = new BABYLON.ParticleSystem("spaceDust", particleCount, this.scene);
        dust.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NTkzRTUxNEIyMjc4MTFFNDg1OUJGQTFGNkE0NTQ2MDQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NTkzRTUxNEMyMjc4MTFFNDg1OUJGQTFGNkE0NTQ2MDQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo1OTNFNTE0OTIyNzgxMUU0ODU5QkZBMUY2QTQ1NDYwNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo1OTNFNTE0QTIyNzgxMUU0ODU5QkZBMUY2QTQ1NDYwNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pl9WpEEAAADxSURBVHjaYvz//z8DMYAJm8TkKdP+YxNnZGJkxKmZEZsBIANIsQSbJoh+7IagGQIzpN8nCi5mheJIoM0OQOwKxN+B+BUQf0EWt1Q3g4cpEGHQV/NlYGK2u7cHbMBrYnwQgDUD8UEg5gLiH0jyj4H4lLK+FZZQBxkCMWQfEH9Hk38GxPuQ5EFO+QvEP4GYH4qRXXQPiLVRDPgGMuA7VBCEQfG9HuQcbDEAwkuhCc0JZgAobgWhSpCIUEcRbgQaYAINUzE0Ax7DFRPQiGwgDkEzQBVqCC+SATA1X4B4IchgdAOQFYCiThiq+RjQQD60WAG5BFkdQIABAFSuJAmfhCLUAAAAAElFTkSuQmCC", this.scene);
        
        // Set up particle system properties
        dust.emitter = center;
        dust.minEmitBox = new BABYLON.Vector3(-radius, -radius, -radius);
        dust.maxEmitBox = new BABYLON.Vector3(radius, radius, radius);
        
        dust.color1 = new BABYLON.Color4(0.8, 0.8, 0.9, 0.1);
        dust.color2 = new BABYLON.Color4(0.9, 0.9, 1.0, 0.2);
        dust.colorDead = new BABYLON.Color4(0.7, 0.7, 0.7, 0.0);
        
        dust.minSize = 0.1;
        dust.maxSize = 0.5;
        dust.minLifeTime = 2;
        dust.maxLifeTime = 8;
        dust.emitRate = 1000;
        
        dust.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        dust.gravity = new BABYLON.Vector3(0, 0, 0);
        dust.direction1 = new BABYLON.Vector3(-speed, -speed, -speed);
        dust.direction2 = new BABYLON.Vector3(speed, speed, speed);
        dust.minAngularSpeed = 0;
        dust.maxAngularSpeed = 0.1;
        dust.minEmitPower = 0.5;
        dust.maxEmitPower = 1.5;
        dust.updateSpeed = 0.01;
        
        // Start the particle system
        dust.start();
        
        // Store reference for cleanup
        this.particleSystems.push(dust);
        
        return dust;
    }
    
    /**
     * Creates a specific environment based on the mission type
     * @param {String} environmentType - Type of environment to create
     * @param {Object} options - Optional configuration
     */
    createEnvironment(environmentType = 'default', options = {}) {
        // Clear any existing environment
        this.dispose();
        
        // Create environment based on type
        switch (environmentType) {
            case 'nebula':
                // Create colorful nebula environment with a planet
                this.createNebula('nebula_environment', {
                    colors: [
                        { h: 290, s: 100, l: 60 }, // Purple
                        { h: 210, s: 100, l: 50 }, // Blue
                        { h: 50, s: 100, l: 60 }   // Amber
                    ],
                    cloudCount: 12
                });
                
                // Add a habitable planet
                this.createPlanet('habitable_planet', {
                    position: new BABYLON.Vector3(400, -100, -900),
                    diameter: 200,
                    type: 'terrestrial',
                    isEarthLike: true,
                    atmosphere: true
                });
                
                // Add a star
                this.createStar('distant_star', {
                    position: new BABYLON.Vector3(-800, 200, -1500),
                    color: new BABYLON.Color3(1.0, 0.8, 0.5) // Yellowish
                });
                
                // Add dust particles
                this.createSpaceDust({
                    count: 3000
                });
                break;
                
            case 'asteroid_field':
                // Create a darker starfield
                this.createStarfield('asteroid_starfield', {
                    starCount: 3000,
                    backgroundColor: '#000005'
                });
                
                // Create asteroid field
                this.createAsteroidField('asteroid_belt', {
                    count: 200,
                    radius: 600,
                    center: new BABYLON.Vector3(0, 0, -300)
                });
                
                // Add a gas giant planet
                this.createPlanet('gas_giant', {
                    position: new BABYLON.Vector3(-600, 0, -1200),
                    diameter: 350,
                    type: 'gas',
                    hasRings: true
                });
                
                // Add subtle dust
                this.createSpaceDust({
                    count: 8000,
                    radius: 800
                });
                break;
                
            case 'deep_space':
                // Create dense starfield
                this.createStarfield('deep_space', {
                    starCount: 4000,
                    resolution: 2048
                });
                
                // Add distant star
                this.createStar('blue_star', {
                    position: new BABYLON.Vector3(-1500, -200, -2000),
                    color: new BABYLON.Color3(0.5, 0.7, 1.0), // Bluish star
                    glowIntensity: 0.9
                });
                
                // Add a space station
                this.createSpaceStation('outpost_station', {
                    position: new BABYLON.Vector3(500, 100, -1000),
                    scale: 2.0
                });
                
                // Add minimal dust
                this.createSpaceDust({
                    count: 2000,
                    radius: 1200,
                    speed: 0.2
                });
                break;
                
            case 'kilrathi_territory':
                // Red-tinted nebula environment
                this.createNebula('kilrathi_nebula', {
                    colors: [
                        { h: 0, s: 100, l: 60 },   // Red
                        { h: 30, s: 100, l: 50 },  // Orange
                        { h: 330, s: 90, l: 40 }   // Dark red
                    ],
                    cloudCount: 10
                });
                
                // Add a rocky, inhospitable planet
                this.createPlanet('kilrathi_planet', {
                    position: new BABYLON.Vector3(500, 50, -1000),
                    diameter: 250,
                    type: 'terrestrial',
                    isEarthLike: false
                });
                
                // Add a bright, hot star
                this.createStar('kilrathi_star', {
                    position: new BABYLON.Vector3(-900, 300, -1800),
                    color: new BABYLON.Color3(1.0, 0.6, 0.2) // Orange-red
                });
                
                // Add some dust
                this.createSpaceDust({
                    count: 3500
                });
                break;
                
            case 'carrier_vicinity':
                // Create standard starfield
                this.createStarfield('carrier_space');
                
                // Add the carrier in the distance
                this.createSpaceStation('tiger_claw', {
                    position: new BABYLON.Vector3(0, 0, 1000),
                    scale: 5.0
                });
                
                // Add minimal dust
                this.createSpaceDust({
                    count: 1500,
                    radius: 600
                });
                break;
                
            case 'default':
            default:
                // Simple starfield with a planet and minimal features
                this.createStarfield('default_space');
                
                if (Math.random() > 0.3) {
                    // Add a planet with 70% probability
                    this.createPlanet('random_planet', {
                        position: new BABYLON.Vector3(
                            (Math.random() - 0.5) * 800,
                            (Math.random() - 0.5) * 200,
                            -800 - Math.random() * 500
                        ),
                        diameter: 150 + Math.random() * 200
                    });
                }
                
                // Add some dust
                this.createSpaceDust();
                break;
        }
        
        return this;
    }
    
    /**
     * Disposes all resources used by the environment manager
     */
    dispose() {
        // Dispose skybox
        if (this.skybox) {
            if (this.skybox.material) {
                if (this.skybox.material.emissiveTexture) {
                    this.skybox.material.emissiveTexture.dispose();
                }
                this.skybox.material.dispose();
            }
            this.skybox.dispose();
            this.skybox = null;
        }
        
        // Dispose all environment objects
        this.environmentObjects.forEach(obj => {
            // Handle special objects with additional resources
            if (obj.glowLayer) {
                obj.glowLayer.dispose();
            }
            
            if (obj.lensFlareSystem) {
                obj.lensFlareSystem.dispose();
            }
            
            if (obj.corona) {
                obj.corona.dispose();
            }
            
            if (obj.rings) {
                if (obj.rings.material) {
                    if (obj.rings.material.diffuseTexture) {
                        obj.rings.material.diffuseTexture.dispose();
                    }
                    obj.rings.material.dispose();
                }
                obj.rings.dispose();
            }
            
            // Handle space station with all its parts
            if (obj.allMeshes) {
                obj.allMeshes.forEach(mesh => {
                    if (mesh.material) {
                        mesh.material.dispose();
                    }
                    mesh.dispose();
                });
                
                if (obj.lights) {
                    obj.lights.forEach(light => {
                        light.light.dispose();
                        if (light.sphere && light.sphere.material) {
                            light.sphere.material.dispose();
                        }
                    });
                }
            }
            
            // Finally dispose the object itself
            if (obj.dispose) {
                obj.dispose();
            }
        });
        
        this.environmentObjects = [];
        
        // Dispose all particle systems
        this.particleSystems.forEach(particles => {
            particles.dispose();
        });
        
        this.particleSystems = [];
        this.current = null;
    }
}

/**
 * Creates an environment manager instance
 * @param {BABYLON.Scene} scene - The scene to create the environment in
 * @returns {EnvironmentManager} The environment manager
 */
export function createEnvironmentManager(scene) {
    return new EnvironmentManager(scene);
}