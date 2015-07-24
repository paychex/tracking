/* global define: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    return function Events(Tracking) {

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