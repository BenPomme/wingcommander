import * as BABYLON from 'babylonjs';
import { createSimpleSpacecraft } from './spacecraft';
import { createKilrathiDralthi, createKilrathiSalthi, createKilrathiKrant } from './kilrathiCraft';
import { createSpacecraftPhysics } from '../systems/physics';
import { createWeaponSystem } from '../systems/weapons';
import { createAIController } from '../systems/ai';

/**
 * Returns a random ship type with appropriate weighting
 * @returns {String} The ship type identifier
 */
function getRandomShipType() {
    const types = [
        'kilrathi_dralthi',
        'kilrathi_dralthi',  // Added twice for higher probability
        'kilrathi_salthi',
        'kilrathi_krant',
        'human_fighter'      // Rogue human fighter (less common)
    ];
    
    return types[Math.floor(Math.random() * types.length)];
}

/**
 * Creates an enemy spacecraft with AI controller
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} options - Configuration options
 * @returns {Object} The enemy spacecraft with its systems
 */
export async function createEnemy(scene, options = {}) {
    // Default position if not provided
    const position = options.position || new BABYLON.Vector3(
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 300
    );
    
    // Default to random Kilrathi ship type if not specified
    const shipType = options.shipType || getRandomShipType();
    const isKilrathi = options.race === 'kilrathi' || shipType.includes('kilrathi');
    
    // Create the appropriate spacecraft based on type
    let enemyShip;
    
    switch (shipType) {
        case 'kilrathi_dralthi':
            enemyShip = await createKilrathiDralthi(scene);
            break;
        case 'kilrathi_salthi':
            enemyShip = await createKilrathiSalthi(scene);
            break;
        case 'kilrathi_krant':
            enemyShip = await createKilrathiKrant(scene);
            break;
        case 'human_fighter':
        default:
            // Use the original simple spacecraft for human enemies or default
            enemyShip = await createSimpleSpacecraft(scene);
            
            // If this is a human ship being used as enemy, change colors to identify as enemy
            if (!isKilrathi) {
                enemyShip.getChildMeshes().forEach(mesh => {
                    if (mesh.material) {
                        // Store original colors
                        mesh.material._originalDiffuse = mesh.material.diffuseColor?.clone();
                        mesh.material._originalEmissive = mesh.material.emissiveColor?.clone();
                        
                        // Set enemy colors (reddish)
                        if (mesh.material.diffuseColor) {
                            mesh.material.diffuseColor.r = Math.min(1, mesh.material.diffuseColor.r * 1.5);
                            mesh.material.diffuseColor.g = Math.max(0, mesh.material.diffuseColor.g * 0.5);
                            mesh.material.diffuseColor.b = Math.max(0, mesh.material.diffuseColor.b * 0.5);
                        }
                        
                        if (mesh.material.emissiveColor) {
                            mesh.material.emissiveColor.r = Math.min(1, mesh.material.emissiveColor.r * 1.5);
                            mesh.material.emissiveColor.g = Math.max(0, mesh.material.emissiveColor.g * 0.5);
                            mesh.material.emissiveColor.b = Math.max(0, mesh.material.emissiveColor.b * 0.5);
                        }
                    }
                });
            }
            break;
    }
    
    // Position the ship
    enemyShip.position = position;
    
    // Set enemy-specific properties
    enemyShip.affiliation = 'enemy';
    
    // Create physics system
    const physics = createSpacecraftPhysics({
        maxSpeed: 12,
        acceleration: 0.015,
        deceleration: 0.01,
        rotationSpeed: 0.015,
        dampingFactor: 0.99
    });
    
    // Create weapon system
    const weapons = createWeaponSystem(scene, enemyShip, {
        hardpoints: [
            { position: new BABYLON.Vector3(-1.5, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) },
            { position: new BABYLON.Vector3(1.5, 0, 1), direction: new BABYLON.Vector3(0, 0, 1) }
        ]
    });
    
    // Create AI controller
    const ai = createAIController(scene, enemyShip, physics, {
        difficulty: options.difficulty || 'medium',
        personality: options.personality || 'balanced',
        team: 'enemy',
        weapons: weapons,
        patrolPoints: options.patrolPoints,
        debug: options.debug || false
    });
    
    // Store references to systems
    enemyShip.physics = physics;
    enemyShip.weapons = weapons;
    enemyShip.ai = ai;
    
    // Add update function to the enemy ship
    enemyShip.update = function(targets, deltaTime) {
        // Update physics
        physics.update(enemyShip, { keys: {} }, deltaTime);
        
        // Update AI
        ai.update(targets, deltaTime);
        
        // Update weapons
        weapons.update(deltaTime);
    };
    
    // Add damage handling
    enemyShip.damage = function(amount) {
        enemyShip.health = Math.max(0, enemyShip.health - amount);
        
        // Flash red when hit
        const flashIntensity = amount / 20; // Scale flash with damage
        enemyShip.getChildMeshes().forEach(mesh => {
            if (mesh.material && mesh.material.emissiveColor) {
                // Store current color
                const currentColor = mesh.material.emissiveColor.clone();
                
                // Flash bright red
                mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
                
                // Restore original color after flash
                setTimeout(() => {
                    mesh.material.emissiveColor = currentColor;
                }, 100);
            }
        });
        
        return enemyShip.health <= 0;
    };
    
    // Add disposal function
    enemyShip.dispose = function() {
        if (weapons) weapons.dispose();
        if (ai) ai.dispose();
        
        // Explode effect
        const explosion = new BABYLON.ParticleSystem("explosion", 200, scene);
        explosion.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4QkEDTYKcP0hEAAABLBJREFUWMPll1uIVVUYx3/7nDlzGi/jaJmpqTN5wQRDxLBS8zKZBZFpRIWU+FJ0f8gXfdAoCBF7CCK6QDcqooHIUIpMEgQJNbUUHBxNLaUm8zKOl/Gcvffqobn0eKbOjPkS9KUN+7D3+q3v+6//+i/bOOe4lSZvcSPSWTYBAMGtBHDL92HvTXWJlgGotYhINDnEeTUaTdQBEGsJdnqmbIJaCzmhpnCRbGEWJ87VoWgpqpQA11RLH3wFwzPKxBdvB1MF4RRiL9F15RTdV5Zw8dJcnAZeCVQvbKV+ySaC3HG04zAmdiQXb8IW3jdSgFNADaIRKglimZY5FJd3n2JJQwPTXnqXyGpMiizaxPnBxkbO799H8soVrHOgDqNgdgaY9IcGkv6KjwyASAzxUZJiRNKIjZi+5GnK5r5CJpPhTDpN2jlUQEQoLyujfs0aZlZXk3Rlmf+Ff6ZrCFuGJDm3CUX4yyj1kZkYRDGSJFJLmEyglmR+fbh5M42NjQRBgFGLAWbNmsX69ev57tAhjhw/TqQ5wG42YlxQ+T/3XzsNFSMWUYdGFuIYW0wzVL6O8rkrWbrxDV7ctp2gqJThgVMoQJhKsX3HDuYsWQKZ1IDy3KnuWKd1YmEUw/1D16wCVAxYCFxoaNp/gspFm6lvWMbVXI769et55LHVlM+pY+TGVQVjDPX19Tz93HPMr66mt2sAGwUg5sZ9GBcAVYNYHRIvILxq1tC2N03jx7BktXH21Emu9vWxaPFipr64jFxXJ1JybeI455DQkD32J3u+/ZaxZJL1r65j2rRpxCLgTpPtWYp1kxjqHqDjzAmiXHFovmPRogCiUEdEgMZYusMWRk1fTcWDrxOUlebVRgAxDmkPOfHeB/R8+g1qLQaYCGQHB/nm8GGOHTzI6+++w2NPPMH5n0/S+vlWMl0lmMtFXFnxPGVPfooZnJbP1Vr5wqw+Lf2BbqZuyDpH1+/baVuxgaqamlzXQI4ghNI48v53VDjHqKnVRG4MLIMtgSoG+/s5+sdxbEkJdXV1qCpnm5ro6Gijr+2QX8eaACtFTsgn8gDqNRVjRb3y0EZ0dXRw+OuP+GLvl4RhyIOz5vDClmeZEtaS7TzCYAtY55CcQyXw9zR9fX0cO3aMnp4eRBWxlj179hBFEWV3VXH/gw9RNnUKYfUIUt15Lspm3XQnzCdY/p/4uImEIUEQEKjBZiO2bdtGa2sr3cN9GAT6R8iMRvQP5wg0pGLSJB5/cilhGGJDAxrT3d3Nnj17OHnyJCKQGR0lN5YjNyZkM1lG0qOEYYgxHrK/v5/du3dz+vRpVJVYIqKxKBoLGLWKkQBDGACKUyUMAx9y544d7Nq1i9bWVrLZLKqKqhKJEolDVUil0oCitggxMRjBOTckHjCqqAgDB+Dgz6ZmWlqaEVUsYK33qyrWOi+oMRjnQ6AWRUBVUTFYJ/54YrDOkXOxZC+dZzRfDyJ5/sghXgSxDvUGKi7vqaJqsE5Q57DqO93fU5/e/xCJIKbAs6qoyQPgCmURgzEF4sZgxI3T84X1VllUjJAvy7wr6kYO2QsKkSCFZZB/WxX+AQlh8+JCsQebAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA5LTA0VDEzOjU0OjEwKzAyOjAwYMWsRwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wOS0wNFQxMzo1NDoxMCswMjowMBGYFPsAAAAASUVORK5CYII=", scene);
        explosion.emitter = enemyShip.position.clone();
        explosion.minEmitBox = new BABYLON.Vector3(-1, -1, -1);
        explosion.maxEmitBox = new BABYLON.Vector3(1, 1, 1);
        explosion.color1 = new BABYLON.Color4(1, 0.5, 0.2, 1.0);
        explosion.color2 = new BABYLON.Color4(0.85, 0.2, 0.2, 1.0);
        explosion.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
        explosion.minSize = 1;
        explosion.maxSize = 3;
        explosion.minLifeTime = 0.3;
        explosion.maxLifeTime = 1.5;
        explosion.emitRate = 300;
        explosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        explosion.gravity = new BABYLON.Vector3(0, 0, 0);
        explosion.direction1 = new BABYLON.Vector3(-1, -1, -1);
        explosion.direction2 = new BABYLON.Vector3(1, 1, 1);
        explosion.minAngularSpeed = 0;
        explosion.maxAngularSpeed = Math.PI;
        explosion.minEmitPower = 1;
        explosion.maxEmitPower = 3;
        explosion.updateSpeed = 0.01;
        explosion.start();
        
        // Auto-dispose particles after animation completes
        setTimeout(() => {
            explosion.stop();
            setTimeout(() => {
                explosion.dispose();
            }, 2000);
        }, 300);
        
        // Dispose of ship meshes
        enemyShip.getChildMeshes().forEach(mesh => {
            mesh.dispose();
        });
        enemyShip.dispose();
    };
    
    return enemyShip;
}

/**
 * Creates multiple enemies in a formation
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Number} count - The number of enemies to create
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Array of enemy spacecraft
 */
export async function createEnemyFormation(scene, count, options = {}) {
    const enemies = [];
    const formation = options.formation || 'random';
    
    // Calculate formation positions
    const positions = [];
    
    switch (formation) {
        case 'line':
            // Line formation
            for (let i = 0; i < count; i++) {
                positions.push(new BABYLON.Vector3(
                    (i - (count - 1) / 2) * 15,
                    0,
                    0
                ));
            }
            break;
            
        case 'vee':
            // V formation
            for (let i = 0; i < count; i++) {
                const xPos = (i - (count - 1) / 2) * 10;
                const zPos = -Math.abs(xPos) * 1.5;
                positions.push(new BABYLON.Vector3(xPos, 0, zPos));
            }
            break;
            
        case 'claw': 
            // Kilrathi "claw" formation (modified V with extended sides)
            for (let i = 0; i < count; i++) {
                let xPos, zPos;
                if (i === 0) {
                    // Lead ship at the point of the formation
                    xPos = 0;
                    zPos = 10;
                } else if (i % 2 === 1) {
                    // Ships on the left arm of the formation
                    const arm = Math.floor((i+1) / 2);
                    xPos = -arm * 15;
                    zPos = -arm * 5;
                } else {
                    // Ships on the right arm of the formation
                    const arm = Math.floor(i / 2);
                    xPos = arm * 15;
                    zPos = -arm * 5;
                }
                positions.push(new BABYLON.Vector3(xPos, 0, zPos));
            }
            break;
            
        case 'box':
            // Box formation
            const boxSize = Math.ceil(Math.sqrt(count));
            let index = 0;
            for (let x = 0; x < boxSize && index < count; x++) {
                for (let z = 0; z < boxSize && index < count; z++, index++) {
                    positions.push(new BABYLON.Vector3(
                        (x - (boxSize - 1) / 2) * 20,
                        0,
                        (z - (boxSize - 1) / 2) * 20
                    ));
                }
            }
            break;
            
        case 'pincer':
            // Kilrathi pincer attack formation
            for (let i = 0; i < count; i++) {
                if (i === 0) {
                    // Lead ship
                    positions.push(new BABYLON.Vector3(0, 0, 0));
                } else if (i <= 2) {
                    // Rear flanking ships
                    const side = i === 1 ? -1 : 1; 
                    positions.push(new BABYLON.Vector3(side * 30, 0, -30));
                } else if (i <= 4) {
                    // Middle flanking ships
                    const side = i === 3 ? -1 : 1;
                    positions.push(new BABYLON.Vector3(side * 50, 0, -15));
                } else {
                    // Additional ships in line
                    positions.push(new BABYLON.Vector3(
                        (i - 5 - (count - 6) / 2) * 15,
                        0,
                        -40
                    ));
                }
            }
            break;
            
        case 'random':
        default:
            // Random positions
            for (let i = 0; i < count; i++) {
                positions.push(new BABYLON.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 100
                ));
            }
            break;
    }
    
    // Apply formation offset
    const formationOffset = options.position || new BABYLON.Vector3(0, 0, -200);
    positions.forEach(pos => {
        pos.addInPlace(formationOffset);
    });
    
    // Create formation patrol points
    const patrolRadius = options.patrolRadius || 100;
    const patrolPoints = [
        new BABYLON.Vector3(patrolRadius, 0, 0).add(formationOffset),
        new BABYLON.Vector3(0, 0, patrolRadius).add(formationOffset),
        new BABYLON.Vector3(-patrolRadius, 0, 0).add(formationOffset),
        new BABYLON.Vector3(0, 0, -patrolRadius).add(formationOffset)
    ];
    
    // Determine ship types for the formation
    let shipTypes = [];
    
    if (options.squadronType === 'mixed_kilrathi') {
        // Create a mixed squadron of different Kilrathi ship types
        const leaderType = options.leaderType || 'kilrathi_krant'; // Leader is usually heavier
        shipTypes.push(leaderType);
        
        // Fill the rest with a mix of ship types
        for (let i = 1; i < count; i++) {
            const rand = Math.random();
            if (rand < 0.5) {
                shipTypes.push('kilrathi_dralthi');
            } else if (rand < 0.8) {
                shipTypes.push('kilrathi_salthi');
            } else {
                shipTypes.push('kilrathi_krant');
            }
        }
    } else if (options.squadronType === 'dralthi_squadron') {
        // All Dralthi fighters
        shipTypes = Array(count).fill('kilrathi_dralthi');
    } else if (options.squadronType === 'salthi_squadron') {
        // All Salthi heavy fighters
        shipTypes = Array(count).fill('kilrathi_salthi');
    } else if (options.squadronType === 'krant_squadron') {
        // All Krant medium fighters
        shipTypes = Array(count).fill('kilrathi_krant');
    } else if (options.specificTypes) {
        // Use predefined types if provided
        shipTypes = options.specificTypes;
    } else {
        // Default behavior - randomly select types for each ship
        for (let i = 0; i < count; i++) {
            shipTypes.push(getRandomShipType());
        }
    }
    
    // Ensure we have enough ship types
    while (shipTypes.length < count) {
        shipTypes.push(getRandomShipType());
    }
    
    // Create enemy spacecraft
    for (let i = 0; i < count; i++) {
        const enemyOptions = {
            position: positions[i],
            difficulty: options.difficulty,
            shipType: shipTypes[i],
            personality: ['aggressive', 'balanced', 'defensive', 'reckless'][i % 4],
            patrolPoints: patrolPoints,
            debug: options.debug
        };
        
        // Leader gets higher difficulty
        if (i === 0 && options.leaderDifficulty) {
            enemyOptions.difficulty = options.leaderDifficulty;
        }
        
        const enemy = await createEnemy(scene, enemyOptions);
        enemies.push(enemy);
    }
    
    return enemies;
}