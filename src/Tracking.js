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
    
    /**
     * Static class that provides access to various
     * tracking methods (events, timers, marks, etc.).
     * @class Tracking
     * @static
     */
    function Tracking() {}
    
    function mixin(name, constructor) {
        Tracking[name] = constructor(Tracking);
    }
    
    /** @member {Collectors} collectors */
    mixin('collectors', Collectors);
    
    /** @member {Events} events */
    mixin('events', Events);
    
    /** @member {Timers} timers */
    mixin('timers', Timers);
    
    /** @member {Marks} marks */
    mixin('marks', Marks);
    
    /** @member {Static} static */
    mixin('static', Static);
    
    /** @member {Network} network */
    mixin('network', Network);
    
    return Tracking;
    
});