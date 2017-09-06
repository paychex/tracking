/* global define: false */
define([], function() {
    
    'use strict';

    var perf = window.performance || {};
    
    /**
     * Static class that provides access to the current
     * epoch time (number of milliseconds since 1/1/1970).
     * @class Stopwatch
     * @static
     */
    function Stopwatch() {}

    /**
     * The epoch time when the user first navigated to the page.
     * @member {number} Stopwatch.navigationStart
     */
    Stopwatch.navigationStart = (function getNavStart() {
        if (perf.timing) {
            return perf.timing.navigationStart;
        }
        if (Date.now) {
            return Date.now();
        }
        return new Date().getTime();
    })();

    /**
     * Returns the number of milliseconds since the user navigated to the page.
     * @function Stopwatch.elapsed
     * @returns {number}
     */
    Stopwatch.elapsed = function elapsed() {
        if (perf.now) {
            return perf.now();
        }
        return Math.abs(Date.now() - Stopwatch.navigationStart);
    };
    
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
    Stopwatch.now = function getNow() {
        return Stopwatch.navigationStart + Stopwatch.elapsed();
    };
    
    return Stopwatch;
    
});