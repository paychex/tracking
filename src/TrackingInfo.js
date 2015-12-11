/* global window, define, Uint8Array: false */
define(['./Stopwatch'], function(Stopwatch) {
    
    'use strict';
    
    function getRandomValues(count) {
        var rands, d;
        if (window.crypto && window.crypto.getRandomValues) {
            rands = new Uint8Array(count);
            window.crypto.getRandomValues(rands);
        } else {
            rands = new Array(count);
            d = new Date().getTime();
            while (count--) {
                rands[count] = (d + Math.random() * 16) & 15;
            }
        }
        return rands;
    }

    function generateUUID() {
        var values = getRandomValues(36);
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, function(c, i) {
                var r = values[i] & 15;
                return (c === 'x' ? r : (r & 0x3|0x8)).toString(16);
            });
    }
    
    function firstDefined() {
        var args = [].slice.call(arguments),
            result = args.shift();
        while (args.length && result === undefined) {
            result = args.shift();
        }
        return result;
    }

    function getValue(params) {

        var args = [].slice.call(arguments),
            def = args.pop(),
            names = args.slice(1);
        
        return names.reduce(function (prev, name) {
            return firstDefined((params.data || {})[name], params[name], prev);
        }, def);

    }
    
    function clone(obj) {
        return Object.keys(obj).reduce(function copy(result, key) {
            return result[key] = obj[key], result;
        }, {});
    }
    
    /**
     * Encapsulates the tracking information provided by all
     * tracking sources into a single consistent schema for
     * consumption by collectors.
     * @class TrackingInfo
     * @param {Object} params An object whose properties will
     *  be examined to set properties on the TrackingInfo
     *  instance.
     * @example
     * var info = new TrackingInfo({
     *   type: 'event',
     *   action: 'click',
     *   label: 'custom label'
     * });
     */
    return function TrackingInfo(params) {

        if (!(this instanceof TrackingInfo)) {
            return new TrackingInfo(params);
        }

        /**
         * @member {Object} [TrackingInfo#data] Any optional data
         *  associated with the current instance.
         */
        this.data = clone(params.data || {});

        /**
         * @member {Array} [TrackingInfo#tags] Any optional strings
         *  to associate with the current instance.
         */
        this.tags = getValue(params, 'tags', []);

        /**
         * @member {Number} [TrackingInfo#count=1] Typically used to
         *  indicate the number of times an event,
         *  mark, or measure has been collected.
         */
        this.count = getValue(params, 'count', 1);

        /**
         * @member {String} [TrackingInfo#type="unknown"] The type
         *  of this instance. Built-in types include
         *  'event', 'timer', 'mark', 'measure',
         *  'network', 'context', 'metric', and
         *  'dimension'
         */
        this.type = getValue(params, 'type', 'unknown');

        /**
         * @member {String} [TrackingInfo#id] The unique id to associate
         *  with this instance. If not provided, a universally
         *  unique identifier will be generated automatically.
         */
        this.id = getValue(params, 'id', undefined) || generateUUID();

        /**
         * @member {Number} [TrackingInfo#start] The number of milliseconds since
         *  1/1/1970 before this instance was started. If not
         *  provided, defaults to the current date and time.
         */
        this.start = getValue(params, 'start', 'startTime', Stopwatch.now());

        /**
         * @member {Number} [TrackingInfo#stop] The number of milliseconds since
         *  1/1/1970 before this instance was stopped. If not
         *  provided, defaults to the start time.
         */
        this.stop = getValue(params, 'stop', 'stopTime', 'end', 'endTime', this.start);

        /**
         * @member {Number} [TrackingInfo#duration] The number of milliseconds
         *  between this instance's stop time and start time.
         */
        this.duration = this.stop - this.start;

        /**
         * @member {String} [TrackingInfo#label] The label to associate with
         *  this instance. 
         */
        this.label = getValue(params, 'label', undefined);

        /**
         * @member {String} [TrackingInfo#action] The action to associate with
         *  this instance.
         */
        this.action = getValue(params, 'action', undefined);

        /**
         * @member {String} [TrackingInfo#category] The category to associate
         *  with this instance.
         */
        this.category = getValue(params, 'category', undefined);

        /**
         * @member {*} [TrackingInfo#variable] Some custom value to associate
         *  with this instance. Typically used in conjunction with
         *  data events to register some conditional state of the
         *  application (such as the number of options available
         *  to the user at a given decision point).
         */
        this.variable = getValue(params, 'variable', undefined);

        /**
         * @member {Array} [TrackingInfo#children] Contains any nested TrackingInfo
         *  instances. Timers and measures can both have children, but
         *  technically any custom data object with a `children` array
         *  will be attempted to be converted into TrackingInfo instances.
         */
        this.children = getValue(params, 'children', []).map(TrackingInfo);
        
        Object.keys(this).forEach(function(key) {
            delete this.data[key];
        }.bind(this));
        
        this.toString = function toString() {
            return 'TrackingInfo: ' + JSON.stringify(this, null, 2);
        };
        
        Object.freeze(this);

    };
    
});
