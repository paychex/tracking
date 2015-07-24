/* global define: false */
define(['./Stopwatch'], function(Stopwatch) {
    
    'use strict';
    
    function getValue(params) {

        var args = [].slice.call(arguments),
            def = args.pop(),
            names = args.slice(1);
        
        return names.reduce(function (prev, name) {
            return (params.data || {})[name] || params[name] || prev;
        }, def);

    }
    
    return function TrackingInfo(params) {

        if (!(this instanceof TrackingInfo)) {
            return new TrackingInfo(params);
        }

        this.data = params.data || {};
        this.tags = getValue(params, 'tags', []);
        this.count = getValue(params, 'count', 1);
        this.type = getValue(params, 'type', 'unknown');
        this.start = getValue(params, 'start', 'startTime', Stopwatch.now());
        this.stop = getValue(params, 'stop', 'stopTime', this.start);
        this.duration = this.stop - this.start;
        this.label = getValue(params, 'label', '');
        this.action = getValue(params, 'action', '');
        this.category = getValue(params, 'category', '');
        this.variable = getValue(params, 'variable', '');
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