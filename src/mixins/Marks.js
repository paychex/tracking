/* global define: false */
/* jshint browser: true */
define([
    '../Stopwatch',
    '../TrackingInfo'
], function(
    Stopwatch,
    TrackingInfo
) {
    
    'use strict';
    
    var marks = [],
        measures = [],
        
        hasLabel = function hasLabel(label) {
            return function isMatch(prev, mark) {
                return mark.label === label ? mark : prev;
            };
        },
        
        getCounter = function getCounter(label) {
            return function counter(count, mark) {
                return count + ((mark.label === label) ? 1: 0);
            };
        },
        
        navStart = (function() {

            function exists(prev, key) {
                return !!prev && !!prev[key] ? prev[key] : null;
            }
            
            return ['performance', 'timing', 'navigationStart']
                .reduce(exists, window) || Stopwatch.now();
            
        })(),

        polyMark = function mark(name, data) {

            var instance = {
                data: data,
                label: name,
                type: 'mark',
                start: navStart,
                stop: Stopwatch.now(),
                count: marks.reduce(getCounter(name), 1)
            };
            
            marks.push(instance);
            
            if (!!window.performance) {
                window.performance.mark(name);
            }
            
            return instance;

        },

        polyMeasure = function measure(name, start, stop, data) {

            var instance,
                mark1 = marks.reverse().reduce(hasLabel(start), null),
                mark2 = marks.reverse().reduce(hasLabel(stop), null);
            
            if (!!mark1 && !!mark2) {
            
                instance = {
                    data: data,
                    label: name,
                    type: 'measure',
                    start: mark1.stop,
                    stop: mark2.stop,
                    duration: mark2.stop - mark1.stop,
                    count: measures.reduce(getCounter(name), 1)
                };
                
                measures.push(instance);
                
                if (!!window.performance) {
                    window.performance.measure(name, start, stop);
                }
                
                return instance;

            }

        };
    
    return function Marks(Tracking) {

        Marks.set = Marks.mark = function set(name, data) {

            if (typeof name !== 'string' || !name.length) {
                throw new Error('A mark name must be specified.');
            }
            
            Tracking.collectors.collect(new TrackingInfo(polyMark(name, data)));

        };
        
        Marks.start = function start(name, data) {
            Marks.set('Start: ' + name, data);
        };

        Marks.stop = function stop(name, data) {
            Marks.set('Stop: ' + name, data);
            Marks.measure(name, 'Start: ' + name, 'Stop: ' + name);
        };
        
        Marks.measure = function measure(name, start, stop, data) {

            [name, start, stop].forEach(function validateArgument(value) {
                if (typeof value !== 'string' || !value.length) {
                    throw new Error('All arguments must be provided.');
                }
            });
            
            var instance = polyMeasure(name, start, stop, data);
            if (!!instance) {
                Tracking.collectors.collect(new TrackingInfo(instance));
            }

        };
        
        Marks.getMarks = function getMarks() {
            return marks.concat();
        };
        
        Marks.getMeasures = function getMeasures() {
            return measures.concat();
        };
        
        return Marks;
        
    };
    
});