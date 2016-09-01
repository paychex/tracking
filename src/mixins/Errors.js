/* global define: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    /**
     * Logs errors.
     * @class Errors
     */
    return function Errors(collect) {

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

            var info = new TrackingInfo({
                type: 'error', data: error
            });

            info.data.stack = error.stack; // need to invoke stack getter
            
            collect(info);
            
        };
        
        return Errors;
        
    };
    
});