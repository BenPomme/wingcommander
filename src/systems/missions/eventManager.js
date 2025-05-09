/**
 * Manages timed events for the mission system
 */
export class EventManager {
    constructor() {
        this.events = [];
        this.nextEventId = 1;
    }
    
    /**
     * Schedules an event to occur after a delay
     * @param {String} name - Name of the event
     * @param {Number} delay - Delay in seconds before the event occurs
     * @param {Function} callback - Function to execute when the event occurs
     * @param {Object} data - Additional data to pass to the callback
     * @returns {Number} Event ID that can be used to cancel the event
     */
    scheduleEvent(name, delay, callback, data = null) {
        const eventId = this.nextEventId++;
        
        this.events.push({
            id: eventId,
            name: name,
            remainingTime: delay,
            callback: callback,
            data: data,
            triggered: false
        });
        
        return eventId;
    }
    
    /**
     * Cancels a scheduled event
     * @param {Number} eventId - ID of the event to cancel
     * @returns {Boolean} True if event was found and canceled
     */
    cancelEvent(eventId) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        
        if (eventIndex !== -1) {
            this.events.splice(eventIndex, 1);
            return true;
        }
        
        return false;
    }
    
    /**
     * Cancels all events with a specific name
     * @param {String} name - Name of events to cancel
     * @returns {Number} Number of events canceled
     */
    cancelEventsByName(name) {
        const initialLength = this.events.length;
        
        this.events = this.events.filter(e => e.name !== name);
        
        return initialLength - this.events.length;
    }
    
    /**
     * Updates all scheduled events
     * @param {Number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Process events in a separate array to avoid issues when events schedule new events
        const triggeredEvents = [];
        
        // Update countdown for each event
        this.events.forEach(event => {
            if (!event.triggered) {
                event.remainingTime -= deltaTime;
                
                // Check if it's time to trigger this event
                if (event.remainingTime <= 0) {
                    event.triggered = true;
                    triggeredEvents.push(event);
                }
            }
        });
        
        // Remove triggered events
        this.events = this.events.filter(e => !e.triggered);
        
        // Execute the triggered events' callbacks
        triggeredEvents.forEach(event => {
            try {
                event.callback(event.data);
            } catch (error) {
                console.error(`Error in event ${event.name}:`, error);
            }
        });
    }
    
    /**
     * Gets the number of scheduled events
     * @returns {Number} Number of scheduled events
     */
    getEventCount() {
        return this.events.length;
    }
    
    /**
     * Gets all scheduled events with a specific name
     * @param {String} name - Name of events to find
     * @returns {Array} List of matching events
     */
    getEventsByName(name) {
        return this.events.filter(e => e.name === name);
    }
    
    /**
     * Clears all scheduled events
     */
    clearAllEvents() {
        this.events = [];
    }
}