/* global define: false */
define([], function() {
    
    'use strict';
    
    function Stopwatch() {}
    
    Stopwatch.now = Date.now || function getTime() {
        return new Date().getTime();
    };
    
    return Stopwatch;
    
});