/* global define: false */
define([], function() {
    
    'use strict';
    
    /**
     * Static class that provides access to the current
     * epoch time (number of milliseconds since 1/1/1970).
     * @class Stopwatch
     * @static
     */
    function Stopwatch() {}
    
    /**
     * Returns the current epoch time (the number of
     * milliseconds since 1/1/1970).
     * @function Stopwatch.now
     * @example
     * var start = Stopwatch.now();
     * setTimeout(function() {
     *   var info = new TimingInfo({
     *     type: 'timer',
     *     start: start,
     *     stop: Stopwatch.now(),
     *     label: 'my timing data'
     *   });
     * });
     */
    Stopwatch.now = Date.now || function getTime() {
        return new Date().getTime();
    };
    
    return Stopwatch;
    
});