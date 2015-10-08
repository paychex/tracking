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

        polyMark = function mark(name, data, ignoreBuiltIn) {

            var instance = {
                data: data,
                label: name,
                type: 'mark',
                start: navStart,
                stop: Stopwatch.now(),
                count: marks.reduce(getCounter(name), 1)
            };

            if (!ignoreBuiltIn && !!window.performance) {
                window.performance.mark(name);
            }

            marks.push(instance);

            return instance;

        },

        polyMeasure = function measure(name, start, stop, data, between) {

            var instance,
                mark1 = marks.reduce(hasLabel(start), null),
                mark2 = marks.reduce(hasLabel(stop), null);

            if (typeof start !== 'string' || !start.length) {
                mark1 = marks.reduce(hasLabel('navigationStart'), null);
            }

            if (typeof stop !== 'string' || !stop.length) {
                mark2 = { stop: Stopwatch.now() };
            }

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

                if (!!between) {
                    instance.children = marks.filter(function isBetween(mark) {
                        return mark.stop >= mark1.stop && mark.stop <= mark2.stop;
                    });
                }

                if (!!window.performance) {
                    window.performance.measure(name, start || undefined, stop || undefined);
                }

                measures.push(instance);

                return instance;

            }

        },

        clearEntries = function clearEntries(rx, arr, fnName) {

            if (typeof rx === 'string') {
                rx = new RegExp(rx, 'i');
            } else if (rx === undefined) {
                rx = /./;
            } else if (!(rx instanceof RegExp)) {
                throw new Error('Regular expression or string expected.');
            }

            var test = function test(value) {
                    return rx.test(value.label);
                },

                fn = !!window.performance && !!window.performance[fnName] ?
                    window.performance[fnName] : function nop() {};

            arr.filter(test).forEach(function remove(item) {
                if (arr !== marks || item.label !== 'navigationStart') {
                    fn(item.label);
                    arr.splice(arr.indexOf(item), 1);
                }
            });

        };

    /**
     * Provides the ability to mark specific moments in an application's
     * behavior, and to measure the time between any of those marks.
     * @class Marks
     */
    return function Marks(Tracking) {

        /**
         * Identifies a specific moment of time in the application
         * and records that moment as the time between navigation start
         * and the point this method is called. This provides a single
         * common baseline for all marks to be measured against.
         * @function Marks.set
         * @alias Marks.mark
         * @param {String} name The name of the mark to set.
         * @param {Object} [data] Optional properties to associate with
         *  the mark. This data will be used to provide properties to
         *  the {@link TrackingInfo} instance persisted to collectors.
         * @throws A mark name must be specified.
         * @example
         * Tracking.marks.set('app initialized');
         * Tracking.marks.set('generating DOM');
         */
        Marks.set = Marks.mark = function set(name, data) {

            if (typeof name !== 'string' || !name.length) {
                throw new Error('A mark name must be specified.');
            }

            Tracking.collectors.collect(new TrackingInfo(polyMark(name, data)));

        };

        /**
         * Creates a new mark whose name is prepended with "Start: ".
         * This method is meant to be called in conjunction with
         * {@link Marks.stop} to create a pair of marks along with a
         * measure between them.
         * @function Marks.start
         * @param {String} name The name of the mark to set.
         * @param {Object} [data] Optional data to use to set properties
         *  on the {@link TrackingInfo} instance persisted to collectors.
         * @example
         * Tracking.marks.start('loading data');
         * $.getJSON('path/to/data')
         *   .success(function(data) {
         *     Tracking.marks.stop('loading data');
         *   });
         */
        Marks.start = function start(name, data) {
            Marks.set('Start: ' + name, data);
        };

        /**
         * Creates a new mark whose name is prepended with "Stop: ".
         * This method is meant to be called in conjunction with
         * {@link Marks.start} to create a pair of marks along with a
         * measure between them.
         * @function Marks.stop
         * @param {String} name The name of the mark to set. This should
         *  match the name you passed to {@link Marks.start}.
         * @param {Object} [data] Optional data to use to set properties
         *  on the {@link TrackingInfo} instance persisted to collectors.
         * @param {Boolean} [between=false] Whether or not to include
         *  any marks set between calls to start() and stop() as children
         *  of the TrackingInfo measure that will be sent to collectors.
         * @example
         * Tracking.marks.start('loading data');
         * $.getJSON('path/to/data')
         *   .success(function(data) {
         *     Tracking.marks.stop('loading data', data, true);
         *   });
         */
        Marks.stop = function stop(name, data, between) {
            Marks.set('Stop: ' + name, data);
            Marks.measure(name, 'Start: ' + name, 'Stop: ' + name, data, between);
        };

        /**
         * Measures the time between 2 marks.
         * @function Marks.measure
         * @param {String} name The name of the measure to create.
         * @param {String} [start] The name of the first mark. If not
         *  specified, "navigationStart" will be used.
         * @param {String} [stop] The name of the second mark. If not
         *  specified, the current epoch time will be used.
         * @param {Object} [data] Optional object whose members will be
         *  used to set properties on the {@link TrackingInfo} instance
         *  sent to any registered collectors.
         * @param {Boolean} [between=false] Whether or not to include any
         *  marks set between the start and stop marks as children of the
         *  {@link TrackingInfo} measure that will be sent to collectors.
         * @throws Parameters `name`, `start`, and `stop` are required.
         * @example
         * Tracking.marks.set('begin load');
         * setTimeout(function() {
         *   // some long-running operation
         *   Tracking.marks.set('end load');
         *   Tracking.marks.measure('load time', 'begin load', 'end load', {
         *     category: 'loading', tags: ['network']
         *   })
         * });
         * @example
         * // navigationStart used as start mark if none specified:
         * Tracking.marks.measure('between navigation and stop mark', null, 'stop mark');
         * @example
         * // the current time will be used if no stop mark is specified:
         * Tracking.marks.measure('between start mark and now', 'start mark');
         * @example
         * // leave out start and stop marks to get navigation start to now:
         * Tracking.marks.measure('between navigationStart and now');
         */
        Marks.measure = function measure(name, start, stop, data, between) {

            if (typeof name !== 'string' || !name.length) {
                throw new Error('Parameter `name` is required.');
            }

            var instance = polyMeasure(name, start, stop, data, between);
            if (!!instance) {
                Tracking.collectors.collect(new TrackingInfo(instance));
            }

        };

        /**
         * @function Marks.getMarks
         * @returns {Array} An array of mark instances.
         */
        Marks.getMarks = function getMarks() {
            return marks.concat();
        };

        /**
         * @function Marks.getMeasures
         * @returns {Array} An array of measure instances.
         */
        Marks.getMeasures = function getMeasures() {
            return measures.concat();
        };

        /**
         * Removes all marks matching the specified regular expression.
         * If no expression is provided, all marks will be removed.
         * @function Marks.clearMarks
         * @param {RegExp|String} [rx] Optional RegExp instance or
         *  regular expression pattern to use to narrow the list of
         *  marks to remove.
         * @example
         * Tracking.marks.clearMarks(/load/);
         * Tracking.marks.clearMarks('my-feature-name');
         */
        Marks.clearMarks = function clearMarks(rx) {
            clearEntries(rx, marks, 'clearMarks');
        };

        /**
         * Removes all measures matching the specified regular expression.
         * If no expression is provided, all measures will be removed.
         * @function Marks.clearMeasures
         * @param {RegExp|String} [rx] Optional RegExp instance or
         *  regular expression pattern to use to narrow the list of
         *  measures to remove.
         * @example
         * Tracking.marks.clearMeasures(/load/);
         * Tracking.marks.clearMeasures('my-feature-name');
         */
        Marks.clearMeasures = function clearMarks(rx) {
            clearEntries(rx, measures, 'clearMeasures');
        };

        /**
         * @private
         */
        Marks.reset = function reset() {
            measures = [];
            marks = [{
                data: {},
                count: 1,
                type: 'mark',
                stop: navStart,
                start: navStart,
                label: 'navigationStart'
            }];
        };

        Marks.navigationStart = navStart;

        Marks.reset();

        return Marks;

    };

});
