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

            // need to copy values manually because
            // Error properties are non-enumerable:
            info.data.name = error.name;
            info.data.stack = error.stack;
            info.data.message = error.message;

            collect(info);
            
        };
        
        return Errors;
        
    };
    
});