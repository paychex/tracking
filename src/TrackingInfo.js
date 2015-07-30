/* global define, crypto, Uint8Array: false */
define(['./Stopwatch'], function(Stopwatch) {
    
    'use strict';
    
    function getRandomValues(count) {
        var rands, d;
        if (crypto && crypto.getRandomValues) {
            rands = new Uint8Array(count);
            crypto.getRandomValues(rands);
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
    
    return function TrackingInfo(params) {

        if (!(this instanceof TrackingInfo)) {
            return new TrackingInfo(params);
        }

        this.data = clone(params.data || {});
        this.tags = getValue(params, 'tags', []);
        this.count = getValue(params, 'count', 1);
        this.type = getValue(params, 'type', 'unknown');
        this.id = getValue(params, 'id', undefined) || generateUUID();
        this.start = getValue(params, 'start', 'startTime', Stopwatch.now());
        this.stop = getValue(params, 'stop', 'stopTime', this.start);
        this.duration = this.stop - this.start;
        this.label = getValue(params, 'label', undefined);
        this.action = getValue(params, 'action', undefined);
        this.category = getValue(params, 'category', undefined);
        this.variable = getValue(params, 'variable', undefined);
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
