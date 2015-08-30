/* global define: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    /**
     * Logs errors.
     * @class Errors
     */
    return function Errors(Tracking) {

        /**
         * Records a single error that occurred.
         * @function Errors.log
         * @param {Error} error The error instance to log.
         * @throws An Error instance must be specified.
         * @example
         * try {
         *   undefined.foo = 'bar';
         * } catch (e) {
         *   Tracking.errors.log(e);
         * }
         */
        Errors.log = function logError(error) {

            if (!(error instanceof Error)) {
                throw new Error('An Error instance must be specified.');
            }
            
            Tracking.collectors.collect(new TrackingInfo({
                type: 'error', data: error
            }));
            
        };
        
        return Errors;
        
    };
    
});