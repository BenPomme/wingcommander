/**
 * Wing Commander mission systems index
 * Export all mission-related systems
 */

// Core mission systems
import { MissionSystem, createMissionSystem } from './missionSystem';
import { EventManager } from './eventManager';
import { MissionObjective } from './missionObjective';

// Mission and campaign data
import { getMission, missionLibrary } from './missionData';
import { getCampaign, getNextMission, updateCampaignState, campaigns } from './campaignData';
import { getVegaMission, vegaMissions } from './vegaMissions';

// Export core mission systems
export {
    MissionSystem,
    createMissionSystem,
    EventManager,
    MissionObjective,
};

// Export mission data functions
export {
    getMission,
    missionLibrary,
    getCampaign,
    getNextMission,
    updateCampaignState,
    campaigns,
    getVegaMission,
    vegaMissions
};