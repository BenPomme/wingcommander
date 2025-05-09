/**
 * Mission data definitions
 * This file contains example mission structures
 */

// Example mission with objectives and events
export const exampleMission = {
    id: 'mission1',
    title: 'Patrol the Border',
    description: 'Investigate reports of Kilrathi activity in the border zone.',
    briefing: 'Intel reports suggest increased Kilrathi activity near Nav Point Alpha. Your mission is to patrol the area, investigate any contacts, and eliminate hostile forces.',
    environment: 'nebula', // Type of space environment to use
    
    // Mission branching - IDs of possible next missions based on performance
    nextMissions: ['mission2_success', 'mission2_failure'],
    
    // Par time in seconds for optimal completion
    parTime: 300,
    
    // Mission objectives
    objectives: [
        {
            id: 'nav_alpha',
            type: 'navigate',
            description: 'Navigate to Nav Point Alpha',
            params: {
                position: { x: 0, y: 0, z: -500 },
                radius: 50
            },
            required: true,
            order: 1
        },
        {
            id: 'patrol',
            type: 'time',
            description: 'Patrol the area for 60 seconds',
            params: {
                duration: 60
            },
            required: true,
            order: 2
        },
        {
            id: 'destroy_enemies',
            type: 'destroy',
            description: 'Eliminate all hostiles',
            params: {
                targetType: 'any',
                count: 5
            },
            required: true,
            order: 3
        },
        {
            id: 'return_to_base',
            type: 'navigate',
            description: 'Return to carrier',
            params: {
                position: { x: 0, y: 0, z: 500 },
                radius: 100
            },
            required: true,
            order: 4
        },
        {
            id: 'bonus_objective',
            type: 'destroy',
            description: 'Destroy Kilrathi supply depot',
            params: {
                targetType: 'structure',
                targetId: 'kilrathi_depot'
            },
            required: false,
            order: 5
        }
    ],
    
    // Failure conditions
    failureConditions: {
        playerDeath: true,
        friendlyDeath: ['wingman_alpha'],
        timeLimit: 600 // 10 minutes
    },
    
    // Mission events
    events: {
        // Events triggered at mission start
        onStart: [
            {
                type: 'message',
                params: {
                    text: 'Mission started. Proceed to Nav Point Alpha.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            },
            {
                type: 'spawnFriendly',
                params: {
                    type: 'wingman',
                    id: 'wingman_alpha',
                    callsign: 'Spirit',
                    position: { x: 10, y: 0, z: 20 },
                    behavior: 'escort'
                }
            }
        ],
        
        // Events triggered at mission completion
        onComplete: [
            {
                type: 'message',
                params: {
                    text: 'Mission complete. Return to Tiger\'s Claw for debriefing.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ],
        
        // Events triggered at mission failure
        onFail: [
            {
                type: 'message',
                params: {
                    text: 'Mission failed. Return to Tiger\'s Claw immediately.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ],
        
        // Events triggered when specific objectives are completed
        objectives: {
            nav_alpha: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Nav Point Alpha reached. Commence patrol.',
                            duration: 5,
                            sender: 'Spirit',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 100, y: 0, z: -600 },
                            count: 3,
                            formation: 'claw',
                            squadronType: 'dralthi_squadron',
                            difficulty: 'medium'
                        }
                    }
                ]
            },
            patrol: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Sensors detect incoming Kilrathi fighters!',
                            duration: 5,
                            sender: 'Spirit',
                            priority: 'high'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: -200, y: 50, z: -700 },
                            count: 2,
                            formation: 'line',
                            squadronType: 'salthi_squadron', // Heavy fighters for second wave
                            difficulty: 'hard'
                        }
                    }
                ]
            }
        },
        
        // Timed events that trigger at specific times
        timed: [
            {
                time: 120, // 2 minutes in
                triggered: false,
                actions: [
                    {
                        type: 'message',
                        params: {
                            text: 'Two minutes into the mission. Status report looks good.',
                            duration: 5,
                            sender: 'Tiger\'s Claw Control',
                            priority: 'normal'
                        }
                    }
                ]
            },
            {
                time: 240, // 4 minutes in
                triggered: false,
                actions: [
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 300, y: -50, z: -800 },
                            count: 3,
                            formation: 'pincer',
                            squadronType: 'mixed_kilrathi',
                            leaderType: 'kilrathi_krant',
                            difficulty: 'medium'
                        }
                    },
                    {
                        type: 'message',
                        params: {
                            text: 'Alert! Kilrathi attack force detected approaching Nav Point Alpha! They\'re using a pincer formation!',
                            duration: 5,
                            sender: 'Spirit',
                            priority: 'high'
                        }
                    }
                ]
            }
        ]
    }
};

// Create additional missions with different environments
export const asteroidFieldMission = {
    id: 'mission2_success',
    title: 'Asteroid Ambush',
    description: 'Clear out Kilrathi forces hiding in the Seti Alpha asteroid field',
    briefing: 'Following your successful border patrol, we\'ve tracked Kilrathi forces to the nearby asteroid field. Your mission is to navigate the field and eliminate the enemy presence before they can establish a base.',
    environment: 'asteroid_field',
    
    // Mission branching
    nextMissions: ['mission3'],
    
    // Par time in seconds for optimal completion
    parTime: 400,
    
    // Mission objectives
    objectives: [
        {
            id: 'nav_alpha',
            type: 'navigate',
            description: 'Navigate to the asteroid field perimeter',
            params: {
                position: { x: 0, y: 0, z: -300 },
                radius: 100
            },
            required: true,
            order: 1
        },
        {
            id: 'destroy_scouts',
            type: 'destroy',
            description: 'Eliminate Kilrathi scout ships',
            params: {
                targetType: 'any',
                count: 3
            },
            required: true,
            order: 2
        },
        {
            id: 'nav_beta',
            type: 'navigate',
            description: 'Proceed to asteroid field core',
            params: {
                position: { x: 200, y: 50, z: -600 },
                radius: 80
            },
            required: true,
            order: 3
        },
        {
            id: 'destroy_fighters',
            type: 'destroy',
            description: 'Eliminate Kilrathi fighters',
            params: {
                targetType: 'any',
                count: 4
            },
            required: true,
            order: 4
        },
        {
            id: 'return_to_base',
            type: 'navigate',
            description: 'Return to safe zone',
            params: {
                position: { x: 0, y: 0, z: 500 },
                radius: 100
            },
            required: true,
            order: 5
        }
    ],
    
    // Events similar to example mission
    events: {
        onStart: [
            {
                type: 'message',
                params: {
                    text: 'Entering asteroid field. Proceed with caution.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            },
            {
                type: 'spawnFriendly',
                params: {
                    type: 'wingman',
                    id: 'wingman_alpha',
                    callsign: 'Spirit',
                    position: { x: 10, y: 0, z: 20 },
                    behavior: 'escort'
                }
            }
        ],
        
        objectives: {
            nav_alpha: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Asteroid field perimeter reached. Scanners detecting Kilrathi scouts ahead.',
                            duration: 5,
                            sender: 'Spirit',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 0, y: 0, z: -400 },
                            count: 3,
                            formation: 'line',
                            squadronType: 'dralthi_squadron',
                            difficulty: 'medium'
                        }
                    }
                ]
            },
            nav_beta: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'We\'ve reached the asteroid field core. Heavy Kilrathi presence detected!',
                            duration: 5,
                            sender: 'Spirit',
                            priority: 'high'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: -100, y: 30, z: -650 },
                            count: 4,
                            formation: 'claw',
                            squadronType: 'mixed_kilrathi',
                            leaderType: 'kilrathi_krant',
                            difficulty: 'hard'
                        }
                    }
                ]
            }
        },
        
        onComplete: [
            {
                type: 'message',
                params: {
                    text: 'Mission complete! All Kilrathi forces eliminated from the asteroid field.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            },
            {
                type: 'changeEnvironment',
                params: {
                    type: 'carrier_vicinity',
                    message: 'Navigation beacon locked. Return path to carrier established.',
                    duration: 3,
                    sender: 'OnBoard Computer',
                    priority: 'normal'
                }
            }
        ]
    }
};

export const kilrathiTerritory = {
    id: 'mission3',
    title: 'Enemy Territory',
    description: 'Reconnaissance mission into Kilrathi space',
    briefing: 'You\'re being sent on a reconnaissance mission deep into Kilrathi territory. Your objective is to gather intelligence on enemy fleet movements and return safely. Stealth is recommended when possible.',
    environment: 'kilrathi_territory',
    
    // Mission branching
    nextMissions: ['mission4'],
    
    // Par time in seconds for optimal completion
    parTime: 480,
    
    // Mission objectives
    objectives: [
        {
            id: 'nav_alpha',
            type: 'navigate',
            description: 'Cross border into Kilrathi space',
            params: {
                position: { x: 0, y: 0, z: -400 },
                radius: 80
            },
            required: true,
            order: 1
        },
        {
            id: 'nav_beta',
            type: 'navigate',
            description: 'Locate Kilrathi outpost',
            params: {
                position: { x: 200, y: 100, z: -800 },
                radius: 100
            },
            required: true,
            order: 2
        },
        {
            id: 'recon_time',
            type: 'time',
            description: 'Observe and record enemy activity',
            params: {
                duration: 60
            },
            required: true,
            order: 3
        },
        {
            id: 'nav_gamma',
            type: 'navigate',
            description: 'Investigate Kilrathi supply depot',
            params: {
                position: { x: -200, y: 50, z: -900 },
                radius: 100
            },
            required: true,
            order: 4
        },
        {
            id: 'escape',
            type: 'navigate',
            description: 'Return to Confederation space',
            params: {
                position: { x: 0, y: 0, z: 300 },
                radius: 200
            },
            required: true,
            order: 5
        }
    ],
    
    events: {
        onStart: [
            {
                type: 'message',
                params: {
                    text: 'Entering Kilrathi space. Stay alert and minimize engagement when possible.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ],
        
        objectives: {
            nav_beta: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Outpost located. Commencing scan. Try to avoid detection.',
                            duration: 5,
                            sender: 'OnBoard Computer',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 100, y: 30, z: -850 },
                            count: 2,
                            formation: 'line',
                            squadronType: 'salthi_squadron',
                            difficulty: 'medium'
                        }
                    }
                ]
            },
            nav_gamma: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Kilrathi supply depot located. Detection alert imminent!',
                            duration: 5,
                            sender: 'OnBoard Computer',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'changeEnvironment',
                        params: {
                            type: 'deep_space',
                            message: 'Alert! Enemy reinforcements incoming. Evasive maneuvers recommended.',
                            duration: 5,
                            sender: 'OnBoard Computer',
                            priority: 'high'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: -300, y: 0, z: -900 },
                            count: 3,
                            formation: 'claw',
                            squadronType: 'krant_squadron',
                            difficulty: 'hard'
                        }
                    }
                ]
            },
            recon_time: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Scan complete. We\'ve been detected! Enemy fighters incoming!',
                            duration: 5,
                            sender: 'OnBoard Computer',
                            priority: 'high'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 0, y: 0, z: -700 },
                            count: 5,
                            formation: 'pincer',
                            squadronType: 'mixed_kilrathi',
                            leaderType: 'kilrathi_krant',
                            difficulty: 'hard'
                        }
                    }
                ]
            }
        },
        
        onComplete: [
            {
                type: 'message',
                params: {
                    text: 'Mission successful! The intelligence you\'ve gathered will be invaluable.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ]
    }
};

// Collection of missions for the campaign
export const missionLibrary = {
    mission1: exampleMission,
    mission2_success: asteroidFieldMission,
    mission3: kilrathiTerritory
    // Additional missions can be added here
};

/**
 * Gets a mission by ID
 * @param {String} missionId - The ID of the mission to retrieve
 * @returns {Object} The mission data object
 */
export function getMission(missionId) {
    return missionLibrary[missionId];
}