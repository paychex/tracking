/* global define: false */
define([
    './mixins/Errors',
    './mixins/Events',
    './mixins/Timers',
    './mixins/Marks',
    './mixins/Network',
    './mixins/Static',
    './mixins/Collectors'
], function(
    Errors,
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

    /** @member {Collectors} Tracking.collectors */
    mixin('collectors', Collectors);

    /** @member {Errors} Tracking.errors */
    mixin('errors', Errors);

    /** @member {Events} Tracking.events */
    mixin('events', Events);

    /** @member {Timers} Tracking.timers */
    mixin('timers', Timers);

    /** @member {Marks} Tracking.marks */
    mixin('marks', Marks);

    /** @member {Static} Tracking.static */
    mixin('static', Static);

    /** @member {Network} Tracking.network */
    mixin('network', Network);

    return Tracking;
    
});