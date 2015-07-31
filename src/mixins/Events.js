/* global define: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    /**
     * Tracks user behavior and data in the form of one-time events.
     * @class Events
     */
    return function Events(Tracking) {

        /**
         * Records a single action taken by the user.
         * @function Events.fire
         * @param {String} action The name of the action.
         * @param {Object} [data] Optional data whose members
         *  will be used to set properties on the {@see TrackingInfo}
         *  instance sent to any registered collectors.
         * @throws An event action must be specified.
         * @example
         * Tracking.events.fire('click', {
         *   category: 'ui', label: 'refresh'
         * });
         * @example
         * Tracking.events.fire('message count', {
         *   category: 'metric', variable: 15
         * });
         */
        Events.fire = function fire(action, data) {

            if (typeof action !== 'string' || !action.length) {
                throw new Error('An event action must be specified.');
            }
            
            Tracking.collectors.collect(new TrackingInfo({
                action: action, data: data, type: 'event'
            }));
            
        };
        
        return Events;
        
    };
    
});