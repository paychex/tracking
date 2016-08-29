/* global define: false */
define([
    '../Stopwatch',
    '../TrackingInfo'
], function(
    Stopwatch,
    TrackingInfo
) {
    
    'use strict';
    
    var counts = {},
        states = ['PENDING', 'STARTED', 'STOPPED'];
    
    /**
     * Factory class to create {@link Timer} instances.
     * @class Timers
     */
    return function Timers(collect) {

        function validate(timer) {

            function getNonStoppedChildren(timer) {
                return [].concat.apply([],
                    timer.children.filter(function isNotStopped(child) {
                        return child.state !== Timer.States.STOPPED;
                    }).concat(timer.children.map(getNonStoppedChildren)));
            }

            function getString(timer) {
                return timer.label + ': ' + states[timer.state];
            }

            var invalid = getNonStoppedChildren(timer),
                msg = 'The following child timers are in an invalid state:';

            if (!!invalid.length) {
                msg = invalid.reduce(function str(msg, item) {
                    return msg + '\n\t- ' + getString(item);
                }, msg);
                throw new Error(msg);
            }

        }

        /**
         * Class providing start/stop methods to time a business
         * transaction. Timers can be nested.
         * @class Timer
         * @param {String} name The name of the Timer instance.
         */
        function Timer(name) {
            this.label = name;
            this.type = 'timer';
            this.parent = null;
            this.children = [];
            this.state = Timer.States.PENDING;
        }
        
        Timer.States = states.reduce(function creatEnum(obj, name, index) {
            return obj[name] = index, obj;
        }, {});

        /**
         * Adds a child Timer with the specified name to this
         * Timer instance. Child Timers should be started after
         * their parents and stopped before their parents.
         * @function Timer#add
         * @param {String} name The name of the child Timer to
         *  create. NOTE: the child Timer's full name will be
         *  its parent Timer's name, a forward slash, and the
         *  child Timer's name. See the example.
         * @returns {Timer} The child Timer instance.
         * @example
         * var parent = Tracking.Timers.create('parent'),
         *     child = parent.add('child');
         * 
         * // the full name is a combination of the
         * // parent name, a forward slash, and the
         * // child name:
         * console.log(child.label); // "parent/child"
         * 
         * // parents must start BEFORE their children
         * parent.start();
         * child.start();
         * 
         * // parents must stop AFTER their children
         * child.stop();
         * parent.stop();
         */
        Timer.prototype.add = function add(name) {
            var child = Timers.create(this.label + '/' + name);
            child.parent = this;
            this.children.push(child);
            return child;
        };

        /**
         * Removes any children with the specified name from
         * this Timer's child collection. The removed child
         * will not be included in any data persisted to
         * collectors.
         * @function Timer#remove
         * @param {String|Timer} name The name of the child
         *  instance to remove OR a reference to the child
         *  instance. If a string is provided, do NOT use
         *  the full child name. See the example for details.
         * @returns {Timer|undefined} The child Timer instance
         *  that was removed, or `undefined` if no matching
         *  child Timer could be found.
         * @example
         * // removing a child by name:
         * var parent = Tracking.Timers.create('parent'),
         *     child = parent.add('child');
         * assert(parent.remove('child') === child);
         * @example
         * // removing a child by reference:
         * var parent = Tracking.Timers.create('parent'),
         *     child = parent.add('child');
         * assert(parent.remove(child) === child);
         */
        Timer.prototype.remove = function remove(name) {
            
            if (typeof name === 'string') {
                name = this.label + '/' + name;
            }
            
            var results = this.children.reduce(function(prev, curr, index) {
                return (curr.label === name || curr === name) ?
                    {child: curr, index: index} : prev;
            }, {child: undefined, index: -1});
            
            if (!!results.child) {
                results.child.parent = null;
                this.children.splice(results.index, 1);
            }
            
            return results.child;

        };

        /**
         * Resets the Timer and records the current time.
         * @function Timer#start
         * @throws Invalid Operation: Timer `name` already started.
         * @example
         * var timer = Tracking.Timers.create('my timer');
         * timer.start(); // records current epoch time
         * console.log(timer.startTime); // 1438297383232
         */
        Timer.prototype.start = function start() {
            if (this.state === Timer.States.STARTED) {
                throw new Error('Invalid Operation: Timer `' + this.label + '` already started.');
            }
            this.reset();
            this.startTime = Stopwatch.now();
            this.state = Timer.States.STARTED;
        };

        /**
         * Records the current time and places the Timer
         * into a stopped state. If optional data was provided,
         * it will be stored as well and used when constructing
         * the associated {@link TimingInfo} instance. The
         * Timer instance will be converted immediately into a
         * TrackingInfo instance and persisted to any registered
         * collectors.
         * @function Timer#stop
         * @param {Object} [data] Optional data to persist with
         *  the Timer instance; this data will be used to set
         *  properties on the TimingInfo object persisted to any
         *  registered collectors.
         * @throws Invalid Operation: Timer `name` not started.
         * @throws The following child timers are in an invalid state:
         * @example
         * var timer = Tracking.Timers.create('my timer');
         * timer.start();
         * setTimeout(function() {
         *   // do some long-running operation
         *   timer.stop(); // persists the timing data
         * });
         */
        Timer.prototype.stop = function stop(data) {
            if (this.state !== Timer.States.STARTED) {
                throw new Error('Invalid Operation: Timer `' + this.label + '` not started.');
            }
            validate(this);
            this.data = data;
            this.stopTime = Stopwatch.now();
            this.state = Timer.States.STOPPED;
            this.count = counts[this.label] = (counts[this.label] || 0) + 1;
            if (this.parent === null) {
                collect(new TrackingInfo(this));
            }
        };
        
        /**
         * Clears any recorded times and data, so the Timer
         * instance can be started.
         * @function Timer#reset
         * @example
         * var timer = Tracking.Timers.create('my timer');
         * timer.start();
         * setTimeout(function() {
         *   try {
         *     // do some long-running operation
         *     timer.stop(); // persists timing data
         *   } catch (e) {
         *     timer.reset(); // timings cleared; timer 
         *                    // can be started again
         *   }
         * });
         */
        Timer.prototype.reset = function reset() {
            delete this.data;
            delete this.startTime;
            delete this.stopTime;
            this.state = Timer.States.PENDING;
        };

        /**
         * Creates a new top-level {@link Timer} instance (i.e.
         * a parent timer with no children) with the specified
         * name.
         * @function Timers.create
         * @param {String} name The name of the Timer to create.
         * @returns {Timer} A new Timer instance.
         * @throws A timer name must be specified.
         */
        Timers.create = function create(name) {
            if (typeof name !== 'string' || !name.length) {
                throw new Error('A timer name must be specified.');
            }
            return new Timer(name);
        };
        
        /**
         * @private
         */
        Timers.reset = function reset() {
            counts = {};
        };

        return Timers;

    };
    
});
