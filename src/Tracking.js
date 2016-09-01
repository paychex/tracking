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
    'mixins/Collectors',
    './uuid'
], function(
    Errors,
    Events,
    Timers,
    Marks,
    Network,
    Static,
    Collectors,
    generateUUID
) {

    'use strict';

    /**
     * Static class that provides access to various
     * tracking methods (events, timers, marks, etc.).
     * @class Tracking
     * @static
     */
    function Tracking(parent) {

        /** @member {Collectors} Tracking#collectors */
        this.collectors = new Collectors(this, parent);

        var collect = this.collectors.collect.bind(this.collectors),
            decorate = this.collectors.decorate.bind(this.collectors);

        /** @member {Errors} Tracking#errors */
        this.errors = Errors(collect);

        /** @member {Events} Tracking#events */
        this.events = Events(collect);

        /** @member {Timers} Tracking#timers */
        this.timers = Timers(collect);

        /** @member {Marks} Tracking#marks */
        this.marks = Marks(collect);

        /** @member {Static} Tracking#static */
        this.static = new Static(collect, decorate);

        /** @member {Network} Tracking#network */
        this.network = Network(collect);

        /**
         * @member {Function} Tracking#generateUUID
         * @description Invoke to generate a universally unique identifier.
         */
        this.generateUUID = generateUUID;

    }

    /**
     * Create a new Tracking instance that inherits any decorators applied
     * to the parent instance. Children can be created to any depth -- every
     * TrackingInfo instance created by a child will be decorated by each of
     * its ancestors, starting with the top-most ancestor and working down.
     * @function Tracking#createChild
     * @returns {Tracking} A new child Tracking instance that inherits any
     *  decorators attached to the parent instance.
     * @example
     * var parent = Tracking;
     * var child = Tracking.createChild();
     * parent.collectors.decorate(function decorator(info) {
     *   info.data.decoratedByParent = true;
     * });
     * child.events.fire('event label', {category: 'child event'});
     * // the event TrackingInfo will be given a 'decoratedByParent'
     * // property because a decorator was added to the parent instance
     */
    Tracking.prototype.createChild = function createChild() {
        return new Tracking(this);
    };

    return new Tracking();
    
});