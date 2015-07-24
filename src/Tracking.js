/* global define: false */
define([
    './mixins/Events',
    './mixins/Timers',
    './mixins/Marks',
    './mixins/Collectors'
], function(
    Events,
    Timers,
    Marks,
    Collectors
) {
    
    'use strict';
    
    function Tracking() {}
    
    function mixin(name, constructor) {
        Tracking[name] = constructor(Tracking);
    }
    
    mixin('events', Events);
    mixin('timers', Timers);
    mixin('marks', Marks);
    mixin('collectors', Collectors);
    
    return Tracking;
    
});