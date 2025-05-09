/**
 * Vega Sector Campaign Missions
 * 
 * This file contains the detailed mission definitions for the Vega Sector Campaign.
 * It includes all missions from intro series, McAuliffe system, Gimle system, Gateway system,
 * and finale missions.
 */

// -------------------- INTRO MISSIONS --------------------

/**
 * First intro mission - Basic flight training
 */
export const vegaIntro1 = {
    id: 'vega_intro_1',
    title: 'Basic Flight Training',
    description: 'Demonstrate your flight capabilities in a controlled environment.',
    briefing: "Welcome to the Tiger\'s Claw, pilot. Before we send you into combat, we need to assess your flight skills. This training mission will test your basic maneuvering, formation flying, and targeting abilities. Follow all nav points and complete each objective to move on to combat training.",
    environment: 'training_sector',
    
    // Par time in seconds for optimal completion
    parTime: 240,
    
    // Mission objectives
    objectives: [
        {
            id: 'nav_alpha',
            type: 'navigate',
            description: 'Navigate to Nav Point Alpha',
            params: {
                position: { x: 0, y: 0, z: -300 },
                radius: 50
            },
            required: true,
            order: 1
        },
        {
            id: 'formation_flying',
            type: 'formation',
            description: 'Fly in formation with training squadron',
            params: {
                duration: 30,
                formationType: 'line',
                maxDeviation: 20
            },
            required: true,
            order: 2
        },
        {
            id: 'nav_beta',
            type: 'navigate',
            description: 'Navigate to Nav Point Beta',
            params: {
                position: { x: 200, y: 50, z: -400 },
                radius: 50
            },
            required: true,
            order: 3
        },
        {
            id: 'target_practice',
            type: 'destroy',
            description: 'Destroy practice targets',
            params: {
                targetType: 'practice_drone',
                count: 3
            },
            required: true,
            order: 4
        },
        {
            id: 'return_to_base',
            type: 'navigate',
            description: 'Return to Tiger\'s Claw',
            params: {
                position: { x: 0, y: 0, z: 300 },
                radius: 100
            },
            required: true,
            order: 5
        }
    ],
    
    // Events
    events: {
        onStart: [
            {
                type: 'message',
                params: {
                    text: 'Training mission initiated. Proceed to Nav Point Alpha.',
                    duration: 5,
                    sender: 'Flight Instructor',
                    priority: 'normal'
                }
            },
            {
                type: 'spawnFriendly',
                params: {
                    type: 'wingman',
                    id: 'instructor',
                    callsign: 'Instructor',
                    position: { x: 20, y: 0, z: 20 },
                    behavior: 'instructor'
                }
            }
        ],
        
        objectives: {
            nav_alpha: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Nav Point Alpha reached. Now form up with the training squadron.',
                            duration: 5,
                            sender: 'Flight Instructor',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnFriendly',
                        params: {
                            type: 'squadron',
                            id: 'training_squad',
                            count: 3,
                            shipType: 'hornet',
                            formation: 'line',
                            position: { x: 0, y: 0, z: -350 },
                            behavior: 'formation_lead'
                        }
                    }
                ]
            },
            formation_flying: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Good formation flying. Now proceed to Nav Point Beta for targeting practice.',
                            duration: 5,
                            sender: 'Flight Instructor',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'despawnFriendly',
                        params: {
                            id: 'training_squad'
                        }
                    }
                ]
            },
            nav_beta: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Nav Point Beta reached. Deploying practice drones. Destroy them with your guns.',
                            duration: 5,
                            sender: 'Flight Instructor',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 200, y: 50, z: -500 },
                            count: 3,
                            type: 'practice_drone',
                            formation: 'circle',
                            behavior: 'stationary'
                        }
                    }
                ]
            },
            target_practice: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Target practice complete. Return to Tiger\'s Claw for debriefing.',
                            duration: 5,
                            sender: 'Flight Instructor',
                            priority: 'normal'
                        }
                    }
                ]
            },
            return_to_base: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Basic flight training complete. You show promise, pilot.',
                            duration: 5,
                            sender: 'Flight Instructor',
                            priority: 'normal'
                        }
                    }
                ]
            }
        },
        
        onComplete: [
            {
                type: 'message',
                params: {
                    text: 'Training mission completed successfully. You\'re cleared for combat training.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ],
        
        onFail: [
            {
                type: 'message',
                params: {
                    text: 'Training mission failed. You need more practice before joining combat operations.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ]
    },
    
    // Next mission based on performance
    nextMissions: ['vega_intro_2_success', 'vega_intro_2_failure']
};

/**
 * Second intro mission success path - Combat training
 */
export const vegaIntro2Success = {
    id: 'vega_intro_2_success',
    title: 'Combat Training',
    description: 'Demonstrate your combat capabilities against simulated opponents.',
    briefing: "Now that you\'ve proven your basic flight skills, it\'s time for combat training. You\'ll face simulated Kilrathi fighters of increasing difficulty. Your performance here will determine your readiness for real combat operations.",
    environment: 'training_sector',
    
    // Par time in seconds for optimal completion
    parTime: 360,
    
    // Mission objectives
    objectives: [
        {
            id: 'nav_to_combat_zone',
            type: 'navigate',
            description: 'Navigate to Combat Zone Alpha',
            params: {
                position: { x: 0, y: 0, z: -400 },
                radius: 100
            },
            required: true,
            order: 1
        },
        {
            id: 'engage_easy_fighters',
            type: 'destroy',
            description: 'Destroy light enemy fighters',
            params: {
                targetType: 'simulated_dralthi',
                count: 2
            },
            required: true,
            order: 2
        },
        {
            id: 'nav_to_combat_zone_beta',
            type: 'navigate',
            description: 'Navigate to Combat Zone Beta',
            params: {
                position: { x: 200, y: 50, z: -600 },
                radius: 100
            },
            required: true,
            order: 3
        },
        {
            id: 'engage_medium_fighters',
            type: 'destroy',
            description: 'Destroy medium enemy fighters',
            params: {
                targetType: 'simulated_dralthi',
                count: 3
            },
            required: true,
            order: 4
        },
        {
            id: 'nav_to_combat_zone_gamma',
            type: 'navigate',
            description: 'Navigate to Combat Zone Gamma',
            params: {
                position: { x: -200, y: 100, z: -700 },
                radius: 100
            },
            required: true,
            order: 5
        },
        {
            id: 'engage_heavy_fighter',
            type: 'destroy',
            description: 'Destroy heavy enemy fighter',
            params: {
                targetType: 'simulated_krant',
                count: 1
            },
            required: true,
            order: 6
        },
        {
            id: 'return_to_carrier',
            type: 'navigate',
            description: 'Return to Tiger\'s Claw',
            params: {
                position: { x: 0, y: 0, z: 300 },
                radius: 100
            },
            required: true,
            order: 7
        }
    ],
    
    // Events
    events: {
        onStart: [
            {
                type: 'message',
                params: {
                    text: 'Combat training initiated. Proceed to Combat Zone Alpha.',
                    duration: 5,
                    sender: 'Combat Instructor',
                    priority: 'normal'
                }
            },
            {
                type: 'spawnFriendly',
                params: {
                    type: 'wingman',
                    id: 'combat_instructor',
                    callsign: 'Paladin',
                    position: { x: 20, y: 0, z: 20 },
                    behavior: 'escort'
                }
            }
        ],
        
        objectives: {
            nav_to_combat_zone: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Combat Zone Alpha reached. Deploying simulated Dralthi light fighters.',
                            duration: 5,
                            sender: 'Combat Instructor',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 0, y: 0, z: -500 },
                            count: 2,
                            type: 'simulated_dralthi',
                            formation: 'line',
                            difficulty: 'easy',
                            behavior: 'aggressive'
                        }
                    }
                ]
            },
            engage_easy_fighters: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Excellent flying. Those Dralthi didn\'t stand a chance. Now proceed to Combat Zone Beta.',
                            duration: 5,
                            sender: 'Combat Instructor',
                            priority: 'normal'
                        }
                    }
                ]
            },
            nav_to_combat_zone_beta: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Combat Zone Beta reached. Watch out, these simulated Dralthi are more aggressive.',
                            duration: 5,
                            sender: 'Combat Instructor',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: 250, y: 30, z: -650 },
                            count: 3,
                            type: 'simulated_dralthi',
                            formation: 'claw',
                            difficulty: 'medium',
                            behavior: 'aggressive'
                        }
                    }
                ]
            },
            engage_medium_fighters: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Well done! You\'re handling multiple opponents effectively. Proceed to Combat Zone Gamma for the final test.',
                            duration: 5,
                            sender: 'Combat Instructor',
                            priority: 'normal'
                        }
                    }
                ]
            },
            nav_to_combat_zone_gamma: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Combat Zone Gamma reached. Deploying simulated Krant heavy fighter. This will be a true test of your skills.',
                            duration: 5,
                            sender: 'Combat Instructor',
                            priority: 'normal'
                        }
                    },
                    {
                        type: 'spawnEnemy',
                        params: {
                            position: { x: -250, y: 0, z: -750 },
                            count: 1,
                            type: 'simulated_krant',
                            formation: 'none',
                            difficulty: 'hard',
                            behavior: 'aggressive'
                        }
                    }
                ]
            },
            engage_heavy_fighter: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Impressive! You took down a Krant. You\'re ready for real combat, pilot.',
                            duration: 5,
                            sender: 'Combat Instructor',
                            priority: 'normal'
                        }
                    }
                ]
            },
            return_to_carrier: {
                onComplete: [
                    {
                        type: 'message',
                        params: {
                            text: 'Return to Tiger\'s Claw complete. You\'ve passed combat training with flying colors.',
                            duration: 5,
                            sender: 'Combat Instructor',
                            priority: 'normal'
                        }
                    }
                ]
            }
        },
        
        onComplete: [
            {
                type: 'message',
                params: {
                    text: 'Combat training completed successfully. You\'re cleared for combat operations.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ],
        
        onFail: [
            {
                type: 'message',
                params: {
                    text: 'Combat training failed. Additional training required before joining combat operations.',
                    duration: 5,
                    sender: 'Tiger\'s Claw Control',
                    priority: 'high'
                }
            }
        ]
    },
    
    // Next mission based on performance
    nextMissions: ['vega_intro_3', 'vega_intro_2_retry']
};

// Export mission data
export const vegaMissions = {
    vegaIntro1,
    vegaIntro2Success
};

/**
 * Gets a Vega mission by ID
 * @param {String} missionId - The ID of the mission to retrieve
 * @returns {Object} The mission data object
 */
export function getVegaMission(missionId) {
    return vegaMissions[missionId];
}