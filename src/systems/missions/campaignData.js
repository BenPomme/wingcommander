/**
 * Wing Commander Campaign Structure
 * 
 * This file defines the campaign structure, mission chains, and branching paths
 * based on player performance. Inspired by the original Wing Commander game's mission structure.
 */

/**
 * Vega Sector Campaign
 * A series of missions focused on defending the Vega Sector from Kilrathi incursions
 */
export const vegaCampaign = {
    id: 'vega_campaign',
    title: 'Vega Sector Campaign',
    description: `The Kilrathi Empire has launched an offensive in the Vega Sector. 
    The Confederation carrier Tiger's Claw has been deployed to defend human colonies 
    and drive back Kilrathi forces.`,
    
    // Series structure with branching paths
    // Mission IDs will be defined in missionData.js
    structure: {
        // Intro mission series (linear)
        intro: [
            'vega_intro_1',  // Training mission - basic flight
            'vega_intro_2',  // Training mission - combat
            'vega_intro_3'   // First real combat patrol
        ],
        
        // Main series (branches based on success/failure)
        main: {
            // Series 1: McAuliffe System
            series1: {
                start: 'mcauliffe_1',
                branches: {
                    // Success branch
                    success: [
                        'mcauliffe_2_success',
                        'mcauliffe_3_success'
                    ],
                    // Failure branch
                    failure: [
                        'mcauliffe_2_failure',
                        'mcauliffe_3_failure'
                    ]
                },
                // Missions converge back here regardless of path
                converge: 'mcauliffe_4'
            },
            
            // Series 2: Gimle System
            series2: {
                start: 'gimle_1',
                branches: {
                    // Success branch
                    success: [
                        'gimle_2_success',
                        'gimle_3_success'
                    ],
                    // Failure branch
                    failure: [
                        'gimle_2_failure',
                        'gimle_3_failure'
                    ]
                },
                // Missions converge back here regardless of path
                converge: 'gimle_4'
            },
            
            // Series 3: Gateway System
            series3: {
                start: 'gateway_1',
                branches: {
                    // Success branch
                    success: [
                        'gateway_2_success', 
                        'gateway_3_success'
                    ],
                    // Failure branch
                    failure: [
                        'gateway_2_failure',
                        'gateway_3_failure'
                    ]
                },
                // Missions converge back here regardless of path
                converge: 'gateway_4'
            }
        },
        
        // Final mission series (depends on overall campaign performance)
        finale: {
            // Good campaign performance
            success: [
                'final_1_success',
                'final_2_success',
                'final_3_success'
            ],
            // Poor campaign performance
            failure: [
                'final_1_failure',
                'final_2_failure',
                'final_3_failure'
            ]
        }
    },
    
    // Campaign state tracking
    state: {
        // Overall campaign metrics
        metrics: {
            missionsCompleted: 0,
            missionsSucceeded: 0,
            missionsFailed: 0,
            kilrathiDestroyed: 0,
            friendliesLost: 0,
            overallScore: 0
        },
        
        // System status (changes based on mission results)
        systems: {
            mcauliffe: {
                status: 'contested', // contested, secured, fallen
                kilrathiPresence: 80, // 0-100
                confederationPresence: 60 // 0-100
            },
            gimle: {
                status: 'contested',
                kilrathiPresence: 70,
                confederationPresence: 50
            },
            gateway: {
                status: 'contested',
                kilrathiPresence: 90,
                confederationPresence: 30
            }
        },
        
        // Player status
        player: {
            rank: 'Lieutenant', // Advances based on performance
            callsign: 'Maverick',
            kills: 0,
            medals: []
        }
    }
};

/**
 * Port Hedland Campaign
 * A campaign focused on defending the Port Hedland system from a major Kilrathi offensive
 */
export const portHedlandCampaign = {
    id: 'port_hedland_campaign',
    title: 'Port Hedland Defense',
    description: `The Kilrathi are launching a major offensive against the Port Hedland system, 
    home to several key Confederation shipyards. The Tiger's Claw has been tasked with 
    defending this vital sector at all costs.`,
    
    // Basic structure similar to Vega campaign but with different missions
    structure: {
        intro: [
            'hedland_intro_1',
            'hedland_intro_2'
        ],
        
        main: {
            series1: {
                start: 'hedland_defense_1',
                branches: {
                    success: ['hedland_defense_2_success'],
                    failure: ['hedland_defense_2_failure']
                },
                converge: 'hedland_defense_3'
            },
            
            series2: {
                start: 'shipyard_defense_1',
                branches: {
                    success: ['shipyard_defense_2_success'],
                    failure: ['shipyard_defense_2_failure']
                },
                converge: 'shipyard_defense_3'
            },
            
            series3: {
                start: 'kilrathi_assault_1',
                branches: {
                    success: ['kilrathi_assault_2_success'],
                    failure: ['kilrathi_assault_2_failure']
                },
                converge: 'kilrathi_assault_3'
            }
        },
        
        finale: {
            success: [
                'hedland_final_1_success',
                'hedland_final_2_success'
            ],
            failure: [
                'hedland_final_1_failure',
                'hedland_final_2_failure'
            ]
        }
    },
    
    // Campaign state tracking (similar structure to Vega campaign)
    state: {
        metrics: {
            missionsCompleted: 0,
            missionsSucceeded: 0,
            missionsFailed: 0,
            kilrathiDestroyed: 0,
            friendliesLost: 0,
            overallScore: 0
        },
        
        systems: {
            portHedland: {
                status: 'contested',
                kilrathiPresence: 75,
                confederationPresence: 65
            },
            shipyards: {
                status: 'contested',
                kilrathiPresence: 60,
                confederationPresence: 70
            }
        },
        
        player: {
            rank: 'Lieutenant',
            callsign: 'Maverick',
            kills: 0,
            medals: []
        }
    }
};

// All available campaigns
export const campaigns = {
    vega: vegaCampaign,
    portHedland: portHedlandCampaign
};

/**
 * Gets a campaign by ID
 * @param {String} campaignId - The ID of the campaign to retrieve
 * @returns {Object} The campaign data
 */
export function getCampaign(campaignId) {
    return campaigns[campaignId];
}

/**
 * Determines next mission based on current mission and performance
 * @param {String} currentMissionId - The ID of the completed mission
 * @param {Boolean} success - Whether the mission was successful
 * @param {Object} campaignState - Current state of the campaign
 * @returns {String} The ID of the next mission
 */
export function getNextMission(currentMissionId, success, campaignState) {
    // This would require a full implementation that traces through the campaign structure
    // For now, we'll return a simple next mission based on the currentMissionId and success
    
    // Find which campaign the mission belongs to
    let campaign = null;
    let campaignId = null;
    
    for (const [id, data] of Object.entries(campaigns)) {
        // Search intro missions
        if (data.structure.intro && data.structure.intro.includes(currentMissionId)) {
            campaign = data;
            campaignId = id;
            break;
        }
        
        // Search main series
        for (const seriesKey in data.structure.main) {
            const series = data.structure.main[seriesKey];
            if (series.start === currentMissionId ||
                series.branches.success.includes(currentMissionId) ||
                series.branches.failure.includes(currentMissionId) ||
                series.converge === currentMissionId) {
                campaign = data;
                campaignId = id;
                break;
            }
        }
        
        // Search finale
        if (campaign) break;
        if ((data.structure.finale.success && data.structure.finale.success.includes(currentMissionId)) ||
            (data.structure.finale.failure && data.structure.finale.failure.includes(currentMissionId))) {
            campaign = data;
            campaignId = id;
            break;
        }
    }
    
    if (!campaign) {
        console.warn(`Mission ${currentMissionId} not found in any campaign`);
        return null;
    }
    
    // Handle intro missions (linear)
    if (campaign.structure.intro && campaign.structure.intro.includes(currentMissionId)) {
        const index = campaign.structure.intro.indexOf(currentMissionId);
        if (index < campaign.structure.intro.length - 1) {
            return campaign.structure.intro[index + 1];
        } else {
            // After last intro mission, move to the first main series
            const firstSeries = Object.values(campaign.structure.main)[0];
            return firstSeries.start;
        }
    }
    
    // Handle main series missions
    for (const seriesKey in campaign.structure.main) {
        const series = campaign.structure.main[seriesKey];
        
        // Starting mission in the series
        if (series.start === currentMissionId) {
            // Pick branch based on success
            return success ? series.branches.success[0] : series.branches.failure[0];
        }
        
        // Mission in success branch
        if (series.branches.success.includes(currentMissionId)) {
            const index = series.branches.success.indexOf(currentMissionId);
            if (index < series.branches.success.length - 1) {
                return series.branches.success[index + 1];
            } else {
                return series.converge;
            }
        }
        
        // Mission in failure branch
        if (series.branches.failure.includes(currentMissionId)) {
            const index = series.branches.failure.indexOf(currentMissionId);
            if (index < series.branches.failure.length - 1) {
                return series.branches.failure[index + 1];
            } else {
                return series.converge;
            }
        }
        
        // Convergence mission
        if (series.converge === currentMissionId) {
            // Find index of current series in the campaign
            const seriesKeys = Object.keys(campaign.structure.main);
            const currentIndex = seriesKeys.indexOf(seriesKey);
            
            // Move to next series if available
            if (currentIndex < seriesKeys.length - 1) {
                const nextSeries = campaign.structure.main[seriesKeys[currentIndex + 1]];
                return nextSeries.start;
            } else {
                // After last main series, move to finale
                // Determine which finale branch based on overall performance
                const overallSuccess = campaignState.metrics.missionsSucceeded > 
                                       campaignState.metrics.missionsFailed;
                return overallSuccess ? 
                    campaign.structure.finale.success[0] : 
                    campaign.structure.finale.failure[0];
            }
        }
    }
    
    // Handle finale missions
    if (campaign.structure.finale.success.includes(currentMissionId)) {
        const index = campaign.structure.finale.success.indexOf(currentMissionId);
        if (index < campaign.structure.finale.success.length - 1) {
            return campaign.structure.finale.success[index + 1];
        } else {
            // Campaign complete
            return null;
        }
    }
    
    if (campaign.structure.finale.failure.includes(currentMissionId)) {
        const index = campaign.structure.finale.failure.indexOf(currentMissionId);
        if (index < campaign.structure.finale.failure.length - 1) {
            return campaign.structure.finale.failure[index + 1];
        } else {
            // Campaign complete
            return null;
        }
    }
    
    console.warn(`Could not determine next mission for ${currentMissionId}`);
    return null;
}

/**
 * Updates campaign state based on mission results
 * @param {String} campaignId - The ID of the campaign
 * @param {String} missionId - The ID of the completed mission
 * @param {Object} results - Mission results data
 * @returns {Object} Updated campaign state
 */
export function updateCampaignState(campaignId, missionId, results) {
    const campaign = campaigns[campaignId];
    if (!campaign) {
        console.error(`Campaign ${campaignId} not found`);
        return null;
    }
    
    // Clone current state
    const newState = JSON.parse(JSON.stringify(campaign.state));
    
    // Update metrics
    newState.metrics.missionsCompleted++;
    if (results.success) {
        newState.metrics.missionsSucceeded++;
    } else {
        newState.metrics.missionsFailed++;
    }
    
    newState.metrics.kilrathiDestroyed += results.kilrathiDestroyed || 0;
    newState.metrics.friendliesLost += results.friendliesLost || 0;
    
    // Calculate overall score
    newState.metrics.overallScore = Math.floor(
        (newState.metrics.missionsSucceeded * 1000) +
        (newState.metrics.kilrathiDestroyed * 100) -
        (newState.metrics.friendliesLost * 500)
    );
    
    // Update player status
    newState.player.kills += results.kilrathiDestroyed || 0;
    
    // Update player rank based on overall score
    if (newState.metrics.overallScore >= 15000) {
        newState.player.rank = 'Colonel';
    } else if (newState.metrics.overallScore >= 10000) {
        newState.player.rank = 'Major';
    } else if (newState.metrics.overallScore >= 6000) {
        newState.player.rank = 'Captain';
    } else if (newState.metrics.overallScore >= 3000) {
        newState.player.rank = 'Lieutenant Commander';
    } else if (newState.metrics.overallScore >= 1000) {
        newState.player.rank = 'Lieutenant';
    } else {
        newState.player.rank = '2nd Lieutenant';
    }
    
    // Update systems status based on specific mission outcomes
    // This would be more detailed in a full implementation
    // For example, McAuliffe missions affect McAuliffe system status
    if (missionId.includes('mcauliffe')) {
        if (results.success) {
            newState.systems.mcauliffe.kilrathiPresence = Math.max(0, newState.systems.mcauliffe.kilrathiPresence - 20);
            newState.systems.mcauliffe.confederationPresence = Math.min(100, newState.systems.mcauliffe.confederationPresence + 10);
        } else {
            newState.systems.mcauliffe.kilrathiPresence = Math.min(100, newState.systems.mcauliffe.kilrathiPresence + 10);
            newState.systems.mcauliffe.confederationPresence = Math.max(0, newState.systems.mcauliffe.confederationPresence - 15);
        }
        
        // Update system status
        if (newState.systems.mcauliffe.confederationPresence > newState.systems.mcauliffe.kilrathiPresence) {
            newState.systems.mcauliffe.status = 'secured';
        } else if (newState.systems.mcauliffe.kilrathiPresence > 80 && newState.systems.mcauliffe.confederationPresence < 30) {
            newState.systems.mcauliffe.status = 'fallen';
        } else {
            newState.systems.mcauliffe.status = 'contested';
        }
    }
    
    // Similar updates for other systems
    
    // Award medals based on achievements
    if (results.allObjectivesCompleted && !results.damageTaken && !results.friendliesLost) {
        if (!newState.player.medals.includes('Bronze Star')) {
            newState.player.medals.push('Bronze Star');
        }
    }
    
    if (results.kilrathiAces && results.kilrathiAces > 0) {
        if (!newState.player.medals.includes('Gold Star')) {
            newState.player.medals.push('Gold Star');
        }
    }
    
    return newState;
}