import * as BABYLON from 'babylonjs';

/**
 * Creates engine particle effects for a spacecraft
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.Mesh} emitter - The mesh to emit particles from
 * @param {Object} options - Configuration options
 * @returns {BABYLON.ParticleSystem} The particle system
 */
export function createEngineParticles(scene, emitter, options = {}) {
    // Configuration with defaults
    const config = {
        capacity: options.capacity || 2000,
        emitRate: options.emitRate || 100,
        minSize: options.minSize || 0.1,
        maxSize: options.maxSize || 0.3,
        minLifeTime: options.minLifeTime || 0.5,
        maxLifeTime: options.maxLifeTime || 1.5,
        minEmitPower: options.minEmitPower || 1,
        maxEmitPower: options.maxEmitPower || 2,
        color1: options.color1 || new BABYLON.Color4(0.7, 0.5, 1.0, 1.0),
        color2: options.color2 || new BABYLON.Color4(0.2, 0.2, 1.0, 1.0),
        colorDead: options.colorDead || new BABYLON.Color4(0, 0, 0.5, 0.0)
    };
    
    // Create particle system
    const particleSystem = new BABYLON.ParticleSystem("engineParticles", config.capacity, scene);
    
    // Use a data URI for a simple particle texture
    particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4QkEDTYKcP0hEAAABLBJREFUWMPll1uIVVUYx3/7nDlzGi/jaJmpqTN5wQRDxLBS8zKZBZFpRIWU+FJ0f8gXfdAoCBF7CCK6QDcqooHIUIpMEgQJNbUUHBxNLaUm8zKOl/Gcvffqobn0eKbOjPkS9KUN+7D3+q3v+6//+i/bOOe4lSZvcSPSWTYBAMGtBHDL92HvTXWJlgGotYhINDnEeTUaTdQBEGsJdnqmbIJaCzmhpnCRbGEWJ87VoWgpqpQA11RLH3wFwzPKxBdvB1MF4RRiL9F15RTdV5Zw8dJcnAZeCVQvbKV+ySaC3HG04zAmdiQXb8IW3jdSgFNADaIRKglimZY5FJd3n2JJQwPTXnqXyGpMiizaxPnBxkbO799H8soVrHOgDqNgdgaY9IcGkv6KjwyASAzxUZJiRNKIjZi+5GnK5r5CJpPhTDpN2jlUQEQoLyujfs0aZlZXk3Rlmf+Ff6ZrCFuGJDm3CUX4yyj1kZkYRDGSJFJLmEyglmR+fbh5M42NjQRBgFGLAWbNmsX69ev57tAhjhw/TqQ5wG42YlxQ+T/3XzsNFSMWUYdGFuIYW0wzVL6O8rkrWbrxDV7ctp2gqJThgVMoQJhKsX3HDuYsWQKZ1IDy3KnuWKd1YmEUw/1D16wCVAxYCFxoaNp/gspFm6lvWMbVXI769et55LHVlM+pY+TGVQVjDPX19Tz93HPMr66mt2sAGwUg5sZ9GBcAVYNYHRIvILxq1tC2N03jx7BktXH21Emu9vWxaPFipr64jFxXJ1JybeI455DQkD32J3u+/ZaxZJL1r65j2rRpxCLgTpPtWYp1kxjqHqDjzAmiXHFovmPRogCiUEdEgMZYusMWRk1fTcWDrxOUlebVRgAxDmkPOfHeB/R8+g1qLQaYCGQHB/nm8GGOHTzI6+++w2NPPMH5n0/S+vlWMl0lmMtFXFnxPGVPfooZnJbP1Vr5wqw+Lf2BbqZuyDpH1+/baVuxgaqamlzXQI4ghNI48v53VDjHqKnVRG4MLIMtgSoG+/s5+sdxbEkJdXV1qCpnm5ro6Gijr+2QX8eaACtFTsgn8gDqNRVjRb3y0EZ0dXRw+OuP+GLvl4RhyIOz5vDClmeZEtaS7TzCYAtY55CcQyXw9zR9fX0cO3aMnp4eRBWxlj179hBFEWV3VXH/gw9RNnUKYfUIUt15Lspm3XQnzCdY/p/4uImEIUEQEKjBZiO2bdtGa2sr3cN9GAT6R8iMRvQP5wg0pGLSJB5/cilhGGJDAxrT3d3Nnj17OHnyJCKQGR0lN5YjNyZkM1lG0qOEYYgxHrK/v5/du3dz+vRpVJVYIqKxKBoLGLWKkQBDGACKUyUMAx9y544d7Nq1i9bWVrLZLKqKqhKJEolDVUil0oCitggxMRjBOTckHjCqqAgDB+Dgz6ZmWlqaEVUsYK33qyrWOi+oMRjnQ6AWRUBVUTFYJ/54YrDOkXOxZC+dZzRfDyJ5/sghXgSxDvUGKi7vqaJqsE5Q57DqO93fU5/e/xCJIKbAs6qoyQPgCmURgzEF4sZgxI3T84X1VllUjJAvy7wr6kYO2QsKkSCFZZB/WxX+AQlh8+JCsQebAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA5LTA0VDEzOjU0OjEwKzAyOjAwYMWsRwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wOS0wNFQxMzo1NDoxMCswMjowMBGYFPsAAAAASUVORK5CYII=", scene);
    
    // Configure particle system
    particleSystem.emitter = emitter;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, 0, 0);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0, 0);
    
    particleSystem.color1 = config.color1;
    particleSystem.color2 = config.color2;
    particleSystem.colorDead = config.colorDead;
    
    particleSystem.minSize = config.minSize;
    particleSystem.maxSize = config.maxSize;
    
    particleSystem.minLifeTime = config.minLifeTime;
    particleSystem.maxLifeTime = config.maxLifeTime;
    
    particleSystem.emitRate = config.emitRate;
    
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    
    particleSystem.gravity = new BABYLON.Vector3(0, 0, -5);
    
    particleSystem.direction1 = new BABYLON.Vector3(0, 0, -1);
    particleSystem.direction2 = new BABYLON.Vector3(0, 0, -1);
    
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;
    
    particleSystem.minEmitPower = config.minEmitPower;
    particleSystem.maxEmitPower = config.maxEmitPower;
    particleSystem.updateSpeed = 0.01;
    
    particleSystem.start();
    
    return particleSystem;
}

/**
 * Updates engine particles based on ship state
 * @param {BABYLON.ParticleSystem} particleSystem - The particle system to update
 * @param {Boolean} afterburnerActive - Whether afterburner is active
 * @param {Number} thrust - Current thrust level (-1 to 1)
 */
export function updateEngineParticles(particleSystem, afterburnerActive, thrust) {
    if (!particleSystem) return;
    
    // Scale emit rate based on thrust
    const baseEmitRate = 100;
    const thrustFactor = Math.max(0, thrust);
    particleSystem.emitRate = baseEmitRate * (0.5 + thrustFactor * 0.5);
    
    // Adjust particle properties based on afterburner
    if (afterburnerActive) {
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 3;
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 1.0;
        
        // More energetic colors for afterburner
        particleSystem.color1 = new BABYLON.Color4(1.0, 0.5, 0.2, 1.0); // Orange
        particleSystem.color2 = new BABYLON.Color4(0.9, 0.2, 0.1, 1.0); // Red-orange
    } else {
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 2;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.5;
        
        // Normal colors for standard engine
        particleSystem.color1 = new BABYLON.Color4(0.7, 0.5, 1.0, 1.0); // Purple
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.2, 1.0, 1.0); // Blue
    }
}

/**
 * Creates a shield effect for a spacecraft
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.Mesh} spacecraftMesh - The mesh to create shield around
 * @returns {Object} Shield object with mesh and control methods
 */
export function createShieldEffect(scene, spacecraftMesh) {
    // Create a sphere slightly larger than the spacecraft
    const shieldSize = 3.5; // Adjust based on spacecraft size
    const shieldMesh = BABYLON.MeshBuilder.CreateSphere("shield", {
        diameter: shieldSize,
        segments: 16
    }, scene);
    
    // Position shield at spacecraft center
    shieldMesh.parent = spacecraftMesh;
    shieldMesh.position = new BABYLON.Vector3(0, 0, 0);
    
    // Create shield material
    const shieldMaterial = new BABYLON.StandardMaterial("shieldMaterial", scene);
    shieldMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.5, 1.0); // Blue
    shieldMaterial.specularColor = new BABYLON.Color3(0.4, 0.8, 1.0);
    shieldMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.6); // Glow
    shieldMaterial.alpha = 0.3; // Transparent
    
    // Add fresnel effect for edge glow
    shieldMaterial.useFresnelEffect = true;
    shieldMaterial.FresnelSafe = true;
    shieldMaterial.fresnelParameters = new BABYLON.FresnelParameters();
    shieldMaterial.fresnelParameters.leftColor = BABYLON.Color3.White();
    shieldMaterial.fresnelParameters.rightColor = BABYLON.Color3.Blue();
    shieldMaterial.fresnelParameters.power = 2;
    shieldMaterial.fresnelParameters.bias = 0.1;
    
    shieldMesh.material = shieldMaterial;
    
    // Initially hide shield
    shieldMesh.isVisible = false;
    
    // Return shield object with control methods
    return {
        mesh: shieldMesh,
        show: function() {
            shieldMesh.isVisible = true;
        },
        hide: function() {
            shieldMesh.isVisible = false;
        },
        impact: function(impactPosition, impactSize = 1.0) {
            // Create shield impact effect
            const impactEffect = new BABYLON.ParticleSystem("shieldImpact", 200, scene);
            
            // Create simple particle texture
            impactEffect.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4QkEDTYKcP0hEAAABLBJREFUWMPll1uIVVUYx3/7nDlzGi/jaJmpqTN5wQRDxLBS8zKZBZFpRIWU+FJ0f8gXfdAoCBF7CCK6QDcqooHIUIpMEgQJNbUUHBxNLaUm8zKOl/Gcvffqobn0eKbOjPkS9KUN+7D3+q3v+6//+i/bOOe4lSZvcSPSWTYBAMGtBHDL92HvTXWJlgGotYhINDnEeTUaTdQBEGsJdnqmbIJaCzmhpnCRbGEWJ87VoWgpqpQA11RLH3wFwzPKxBdvB1MF4RRiL9F15RTdV5Zw8dJcnAZeCVQvbKV+ySaC3HG04zAmdiQXb8IW3jdSgFNADaIRKglimZY5FJd3n2JJQwPTXnqXyGpMiizaxPnBxkbO799H8soVrHOgDqNgdgaY9IcGkv6KjwyASAzxUZJiRNKIjZi+5GnK5r5CJpPhTDpN2jlUQEQoLyujfs0aZlZXk3Rlmf+Ff6ZrCFuGJDm3CUX4yyj1kZkYRDGSJFJLmEyglmR+fbh5M42NjQRBgFGLAWbNmsX69ev57tAhjhw/TqQ5wG42YlxQ+T/3XzsNFSMWUYdGFuIYW0wzVL6O8rkrWbrxDV7ctp2gqJThgVMoQJhKsX3HDuYsWQKZ1IDy3KnuWKd1YmEUw/1D16wCVAxYCFxoaNp/gspFm6lvWMbVXI769et55LHVlM+pY+TGVQVjDPX19Tz93HPMr66mt2sAGwUg5sZ9GBcAVYNYHRIvILxq1tC2N03jx7BktXH21Emu9vWxaPFipr64jFxXJ1JybeI455DQkD32J3u+/ZaxZJL1r65j2rRpxCLgTpPtWYp1kxjqHqDjzAmiXHFovmPRogCiUEdEgMZYusMWRk1fTcWDrxOUlebVRgAxDmkPOfHeB/R8+g1qLQaYCGQHB/nm8GGOHTzI6+++w2NPPMH5n0/S+vlWMl0lmMtFXFnxPGVPfooZnJbP1Vr5wqw+Lf2BbqZuyDpH1+/baVuxgaqamlzXQI4ghNI48v53VDjHqKnVRG4MLIMtgSoG+/s5+sdxbEkJdXV1qCpnm5ro6Gijr+2QX8eaACtFTsgn8gDqNRVjRb3y0EZ0dXRw+OuP+GLvl4RhyIOz5vDClmeZEtaS7TzCYAtY55CcQyXw9zR9fX0cO3aMnp4eRBWxlj179hBFEWV3VXH/gw9RNnUKYfUIUt15Lspm3XQnzCdY/p/4uImEIUEQEKjBZiO2bdtGa2sr3cN9GAT6R8iMRvQP5wg0pGLSJB5/cilhGGJDAxrT3d3Nnj17OHnyJCKQGR0lN5YjNyZkM1lG0qOEYYgxHrK/v5/du3dz+vRpVJVYIqKxKBoLGLWKkQBDGACKUyUMAx9y544d7Nq1i9bWVrLZLKqKqhKJEolDVUil0oCitggxMRjBOTckHjCqqAgDB+Dgz6ZmWlqaEVUsYK33qyrWOi+oMRjnQ6AWRUBVUTFYJ/54YrDOkXOxZC+dZzRfDyJ5/sghXgSxDvUGKi7vqaJqsE5Q57DqO93fU5/e/xCJIKbAs6qoyQPgCmURgzEF4sZgxI3T84X1VllUjJAvy7wr6kYO2QsKkSCFZZB/WxX+AQlh8+JCsQebAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA5LTA0VDEzOjU0OjEwKzAyOjAwYMWsRwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wOS0wNFQxMzo1NDoxMCswMjowMBGYFPsAAAAASUVORK5CYII=", scene);
            
            // Set emitter to impact position
            impactEffect.emitter = impactPosition;
            
            // Configure particle properties
            impactEffect.color1 = new BABYLON.Color4(0.8, 0.8, 1.0, 1.0);
            impactEffect.color2 = new BABYLON.Color4(0.5, 0.5, 1.0, 1.0);
            impactEffect.colorDead = new BABYLON.Color4(0.1, 0.1, 1.0, 0.0);
            
            impactEffect.minSize = 0.1 * impactSize;
            impactEffect.maxSize = 0.3 * impactSize;
            
            impactEffect.minLifeTime = 0.2;
            impactEffect.maxLifeTime = 0.6;
            
            impactEffect.emitRate = 300;
            impactEffect.minEmitPower = 1;
            impactEffect.maxEmitPower = 3;
            
            impactEffect.updateSpeed = 0.01;
            
            // Start the effect
            impactEffect.start();
            
            // Automatically stop and dispose after a short time
            setTimeout(() => {
                impactEffect.stop();
                setTimeout(() => {
                    impactEffect.dispose();
                }, 1000);
            }, 200);
            
            // Highlight the shield briefly
            const originalAlpha = shieldMaterial.alpha;
            shieldMaterial.alpha = 0.7;
            setTimeout(() => {
                shieldMaterial.alpha = originalAlpha;
            }, 300);
        },
        setStrength: function(strength) {
            // Adjust shield appearance based on strength (0-100)
            const normalizedStrength = Math.max(0, Math.min(100, strength)) / 100;
            
            // Fade out if strength is low
            shieldMaterial.alpha = 0.1 + (normalizedStrength * 0.2);
            
            // Change color based on strength (blue to red as it weakens)
            const blueComponent = 0.6 * normalizedStrength;
            const redComponent = 0.6 * (1 - normalizedStrength);
            shieldMaterial.emissiveColor = new BABYLON.Color3(
                redComponent + 0.1, 
                0.1, 
                blueComponent + 0.1
            );
            
            // Update fresnel parameters
            shieldMaterial.fresnelParameters.power = 2 + (1 - normalizedStrength) * 2;
            
            // Show/hide based on threshold
            if (strength <= 5) {
                this.hide();
            } else {
                this.show();
            }
        }
    };
}