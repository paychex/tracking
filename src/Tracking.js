/* global define: false */
define([
    './mixins/Events',
    './mixins/Timers',
    './mixins/Marks',
    './mixins/Network',
    './mixins/Static',
    './mixins/Collectors'
], function(
    Events,
    Timers,
    Marks,
    Network,
    Static,
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
    mixin('static', Static);
    mixin('network', Network);
    
    return Tracking;
    
});