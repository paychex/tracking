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
    
    return function Timers(Tracking) {

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

        Timer.prototype.add = function add(name) {
            var child = Timers.create(this.label + '/' + name);
            child.parent = this;
            this.children.push(child);
            return child;
        };

        Timer.prototype.remove = function remove(name) {
            
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

        Timer.prototype.start = function start() {
            if (this.state === Timer.States.STARTED) {
                throw new Error('Invalid Operation: Timer `' + this.label + '` already started.');
            }
            this.reset();
            this.startTime = Stopwatch.now();
            this.state = Timer.States.STARTED;
        };

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
                Tracking.collectors.collect(new TrackingInfo(this));
            }
        };
        
        Timer.prototype.reset = function reset() {
            delete this.data;
            delete this.startTime;
            delete this.stopTime;
            this.state = Timer.States.PENDING;
        };

        Timers.create = function create(name) {
            if (typeof name !== 'string' || !name.length) {
                throw new Error('A timer name must be specified.');
            }
            return new Timer(name);
        };
        
        return Timers;

    };
    
});