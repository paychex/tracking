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
            return function isMatch(mark) {
                return mark.label === label;
            };
        },

        isProvided = function isProvided(value) {
            return value !== undefined && typeof value === 'string' && value.trim().length > 0;
        },

        getCounter = function getCounter(label) {
            return function counter(count, mark) {
                return count + ((mark.label === label) ? 1: 0);
            };
        },

        navStart = Stopwatch.navigationStart,

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

            var i, instance, mark1, mark2, curr,
                isStopMark = hasLabel(stop),
                isStartMark = hasLabel(start),
                startProvided = isProvided(start),
                stopProvided = isProvided(stop),

                shouldSetStartMark = function() {
                    return !mark1 && isStartMark(curr);
                },

                okayToSetStartMark = function() {
                    return !!mark2 || !stopProvided;
                },

                shouldSetStopMark = function() {
                    return !mark2 && isStopMark(curr);
                },

                bothMarksSet = function() {
                    return !!mark1 && !!mark2;
                };

            for (i = marks.length - 1; i >= 0; i--) {
                curr = marks[i];
                if (shouldSetStopMark()) {
                    mark2 = curr;
                } else if (shouldSetStartMark() && okayToSetStartMark()) {
                    mark1 = curr;
                }
                if (bothMarksSet()) {
                    break;
                }
            }

            if (!startProvided) {
                mark1 = { stop: navStart };
            }

            if (!stopProvided) {
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
                    // workaround for some versions of IE
                    // see https://connect.microsoft.com/IE/feedbackdetail/view/1884529/bug-in-html5-performance-api
                    if (!start) {
                        window.performance.measure(name);
                    } else if (!stop) {
                        window.performance.measure(name, start || undefined);
                    } else {
                        window.performance.measure(name, start || undefined, stop || undefined);
                    }
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
                    window.performance[fnName].bind(window.performance) :
                    Function.prototype; // nop

            arr.filter(test).forEach(function remove(item) {
                if (arr !== marks || item.label !== 'navigationStart') {
                    fn(item.label);
                    arr.splice(arr.indexOf(item), 1);
                }
            });

        },

        /**
         * Creates an object whose members are merged in from the arguments, left to right.
         * @param {...Object} objects The objects to merge together
         * @returns {Object} A new object whose members are derived from the objects passed in
         * @example
         * var eyeColor = {eyeColor: 'blue', name: 'eye color'};
         * var hairColor = {hairColor: 'brown', name: 'hair color'};
         * var height = {inches: 72, name: 'height'};
         * var person = {name: 'Mr. T'};
         *
         * var person = merge(eyeColor, hairColor, height, person);
         * // {
         * //   eyeColor: 'blue',
         * //   hairColor: 'brown',
         * //   inches: 72,
         * //   name: 'Mr. T'
         * // }
         *
         */
        merge = function merge(/*Objects...*/){
            // The result to return
            var result = {};

            Array.prototype.slice.call(arguments).reduce(function (previousArgument, currentArgument) {
                if (!!currentArgument && 'object' === typeof currentArgument) {
                    Object.getOwnPropertyNames(currentArgument).reduce(function (previousValue, currentValue) {
                        previousValue[currentValue] = currentArgument[currentValue];
                        return previousValue;
                    }, previousArgument);
                }
                return previousArgument;
            }, result);

            return result;
        };

    /**
     * Provides the ability to mark specific moments in an application's
     * behavior, and to measure the time between any of those marks.
     * @class Marks
     */
    return function Marks(collect) {

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

            collect(new TrackingInfo(polyMark(name, data)));

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
         * @returns {Function} A function which is the equivalent of Marks.stop(name, data);
         * @example
         * Tracking.marks.start('loading data');
         * $.getJSON('path/to/data')
         *   .success(function(data) {
         *     Tracking.marks.stop('loading data');
         *   });
         *  // Or:
         * var stop = Tracking.marks.start('loading data');
         * $.getJSON('path/to/data')
         *   .success(function success() {
         *     stop({result: 'success', data: data});
         *   });
         * // If you prefer promises:
         * var stop = Tracking.marks.start('loading data', {category: 'loading'});
         * return doSomethingAsync().tap(function success(data) {
         *   stop({result: 'success', data: data});
         * });
         */
        Marks.start = function start(name, data) {
            Marks.set('Start: ' + name, data);

            // Convenience function
            return function stop(overrides) {
                return Marks.stop(name, merge(data, overrides));
            };
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
                collect(new TrackingInfo(instance));
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

        Marks.reset();

        return Marks;

    };

});
