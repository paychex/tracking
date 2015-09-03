/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Dan Barnes
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

/* global define: false */
define([
    'mixins/Errors',
    'mixins/Events',
    'mixins/Timers',
    'mixins/Marks',
    'mixins/Network',
    'mixins/Static',
    'mixins/Collectors'
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