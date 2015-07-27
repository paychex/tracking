/* global define: false */
define([
    './mixins/Events',
    './mixins/Timers',
    './mixins/Marks',
    './mixins/Network',
    './mixins/Collectors'
], function(
    Events,
    Timers,
    Marks,
    Network,
    Collectors
) {
    
    'use strict';
    
    function Tracking() {}
    
    function mixin(name, constructor) {
        Tracking[name] = constructor(Tracking);
    }
    
    mixin('collectors', Collectors);
    mixin('events', Events);
    mixin('timers', Timers);
    mixin('marks', Marks);
    mixin('network', Network);
    
    return Tracking;
    
});