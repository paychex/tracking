/* global define: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    return function Static(Tracking) {

        var context,
            metrics = {},
            dimensions = {},

            clone = function clone(obj) {
                return Object.keys(obj).reduce(function copy(result, key) {
                    return result[key] = obj[key], result;
                }, {});
            };

        Tracking.collectors.decorate(function setMetaData(info) {
            info.data.context = context || 'none';
            info.data.metrics = clone(metrics);
            info.data.dimensions = clone(dimensions);
        });

        Static.setContext = function setContext(name) {
            context = name;
            Tracking.collectors.collect(new TrackingInfo({
                type: 'context',
                label: name
            }));
        };

        Static.setMetric = function setMetric(name, value) {
            metrics[name] = value;
            Tracking.collectors.collect(new TrackingInfo({
                label: name,
                type: 'metric',
                variable: value
            }));
        };

        Static.setDimension = function setDimension(name, value) {
            dimensions[name] = value;
            Tracking.collectors.collect(new TrackingInfo({
                label: name,
                type: 'dimension',
                /* jshint -W041 */
                variable: value == null ? value : value.toString()
            }));
        };
        
        return Static;
        
    };
    
});
