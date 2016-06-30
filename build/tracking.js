(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.Tracking = factory();
    }
}(this, function() {

/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});

/* global define: false */
define('Stopwatch',[], function() {
    
    'use strict';
    
    /**
     * Static class that provides access to the current
     * epoch time (number of milliseconds since 1/1/1970).
     * @class Stopwatch
     * @static
     */
    function Stopwatch() {}
    
    /**
     * Returns the current epoch time (the number of
     * milliseconds since 1/1/1970).
     * @function Stopwatch.now
     * @example
     * var start = Stopwatch.now();
     * setTimeout(function() {
     *   var info = new TimingInfo({
     *     type: 'timer',
     *     start: start,
     *     stop: Stopwatch.now(),
     *     label: 'my timing data'
     *   });
     * });
     */
    Stopwatch.now = Date.now || function getTime() {
        return new Date().getTime();
    };
    
    return Stopwatch;
    
});
define('uuid',[], function() {

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

    return function generateUUID() {
        var values = getRandomValues(36);
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, function(c, i) {
                var r = values[i] & 15;
                return (c === 'x' ? r : (r & 0x3|0x8)).toString(16);
            });
    };

});

/* global window, define, Uint8Array: false */
define('TrackingInfo',['./Stopwatch', './uuid'], function(Stopwatch, generateUUID) {
    
    'use strict';

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
        this.label = getValue(params, 'label', 'description', undefined);

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

/* global define: false */
define('mixins/Errors',['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    /**
     * Logs errors.
     * @class Errors
     */
    return function Errors(Tracking) {

        /**
         * Records a single error that occurred.
         * @function Errors.log
         * @param {Error} error The error instance to log.
         * @throws An Error instance must be specified.
         * @example
         * try {
         *   undefined.foo = 'bar';
         * } catch (e) {
         *   Tracking.errors.log(e);
         * }
         */
        Errors.log = function logError(error) {

            if (!(error instanceof Error)) {
                throw new Error('An Error instance must be specified.');
            }

            var info = new TrackingInfo({
                type: 'error', data: error
            });

            info.data.stack = error.stack; // need to invoke stack getter
            
            Tracking.collectors.collect(info);
            
        };
        
        return Errors;
        
    };
    
});
/* global define: false */
define('mixins/Events',['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    /**
     * Tracks user behavior and data in the form of one-time events.
     * @class Events
     */
    return function Events(Tracking) {

        /**
         * Records a single action taken by the user.
         * @function Events.fire
         * @param {String} action The name of the action.
         * @param {Object} [data] Optional data whose members
         *  will be used to set properties on the {@link TrackingInfo}
         *  instance sent to any registered collectors.
         * @throws An event action must be specified.
         * @example
         * Tracking.events.fire('click', {
         *   category: 'ui', label: 'refresh'
         * });
         * @example
         * Tracking.events.fire('message count', {
         *   category: 'metric', variable: 15
         * });
         */
        Events.fire = function fire(action, data) {

            if (typeof action !== 'string' || !action.length) {
                throw new Error('An event action must be specified.');
            }
            
            Tracking.collectors.collect(new TrackingInfo({
                action: action, data: data, type: 'event'
            }));
            
        };
        
        return Events;
        
    };
    
});
/* global define: false */
define('mixins/Timers',[
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
                Tracking.collectors.collect(new TrackingInfo(this));
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

/* global define: false */
/* jshint browser: true */
define('mixins/Marks',[
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

/* global define, window, setInterval: false */
define('mixins/Network',['../TrackingInfo', './Marks'], function(TrackingInfo, Marks) {
    
    'use strict';
    
    /**
     * Automatically collects and persists resource timing data
     * to any registered collectors. This includes anything
     * downloaded by the site or by the user during his session.
     * @class Network
     */
    return function Network(Tracking) {
        
        /**
         * Returns an array any PerformanceTimingEntry instances
         * collected by the web browser during the user's session.
         * @function Network.getEntries
         * @returns {Array} An array of PerformanceTimingEntry instances
         *  collected by the browser. If the browser does not implement
         *  the HTML5 Performance API, the array will always be empty.
         */
        Network.getEntries = function getEntries() { return timings.concat(); };

        var timings = [],
            lastLength = 0,
            resourceCounts = {},
            perf = window.performance,
            persist = Tracking.collectors.collect.bind(Tracking.collectors),
            isInvalidTiming = function isInvalid(timing) {
                return timing.responseEnd < timing.requestStart;
            },
            
            getTimingInfo = function getTimingInfo(timing) {
                return new TrackingInfo({
                    type: 'network',
                    label: timing.name,
                    start: Marks.navigationStart + timing.startTime,
                    stop: Marks.navigationStart + timing.responseEnd,
                    category: timing.initiatorType,
                    count: resourceCounts[timing.name] = (resourceCounts[timing.name] || 0) + 1,
                    data: {
                        size: timing.transferSize, // NOTE: not all browsers provide transferSize
                        cachedOrLocal: timing.fetchStart === timing.connectEnd,
                        blockTime: Math.max(0, (timing.requestStart || timing.fetchStart) - timing.startTime),
                        stages: {
                            fetch: {
                                start: Marks.navigationStart + timing.fetchStart,
                                end: Marks.navigationStart + timing.domainLookupStart,
                                duration: timing.domainLookupStart - timing.fetchStart
                            },
                            dns: {
                                start: Marks.navigationStart + timing.domainLookupStart,
                                end: Marks.navigationStart + timing.domainLookupEnd,
                                duration: timing.domainLookupEnd - timing.domainLookupStart
                            },
                            tcp: {
                                start: Marks.navigationStart + timing.connectStart,
                                end: Marks.navigationStart + timing.connectEnd,
                                duration: timing.connectEnd - timing.connectStart
                            },
                            request: {
                                start: Marks.navigationStart + timing.requestStart,
                                end: Marks.navigationStart + timing.responseStart,
                                duration: timing.responseStart - timing.requestStart
                            },
                            response: {
                                start: Marks.navigationStart + timing.responseStart,
                                end: Marks.navigationStart + timing.responseEnd,
                                duration: timing.responseEnd - timing.responseStart
                            }
                        }
                    }
                });
            },

            collectTimings = function collectNetworkTimings() {

                /*
                 IE 11/Edge will add resource timing entries before
                 the request has completed. This can seriously throw
                 off our data.

                 We need to ignore these entries somehow until they're
                 complete, without ignoring them on subsequent checks
                 once they've finally finished.

                 Also, keeping these values around could cause entries
                 to be dropped once IE reaches its cached resource limit
                 (around 150 entries) and the "resourcetimingbufferfull"
                 event fires.
                 */

                var entries = perf.getEntriesByType('resource').slice(lastLength);
                if (entries.some(isInvalidTiming)) {
                    return; // if any timings are invalid, exit early
                    // NOTE:
                    // this method is invoked every second, so once IE
                    // finally settles down (or the cache limit is
                    // reached), we will eventually send the timings
                }

                entries = entries.map(getTimingInfo);

                entries.forEach(persist);
                timings = timings.concat(entries);
                lastLength += entries.length;

            };
        
        if (!!perf && !!perf.getEntriesByType) {

            var bufferFull = function bufferFull() {
                collectTimings();
                perf.clearResourceTimings && perf.clearResourceTimings();
                perf.webkitClearResourceTimings && perf.webkitClearResourceTimings();
                lastLength = 0;
            };

            perf.onresourcetimingbufferfull = perf.onwebkitresourcetimingbufferfull = bufferFull;

            setInterval(collectTimings, 1000);

        }

        return Network;

    };
    
});

/* global define: false */
define('mixins/Static',['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    /**
     * Sets metadata applicable to all {@link TrackingInfo} instances.
     * This metadata will be added to any TrackingInfo instance prior
     * to being persisted to registered collectors.
     * @class Static
     */
    return function Static(Tracking) {

        var levels = ['page', 'app', 'screen'],

            metrics = {},
            dimensions = {},
            context = {},

            clone = function clone(obj) {
                obj = obj || {};
                return Object.keys(obj).reduce(function copy(result, key) {
                    return result[key] = obj[key], result;
                }, {});
            };

        Tracking.collectors.decorate(function setMetaData(info) {
            info.data.context = clone(context);
            info.data.metrics = clone(metrics);
            info.data.dimensions = clone(dimensions);
        });

        /**
         * Sets the global context on future {@link TrackingInfo}
         * instances before they are sent to any registered collectors.
         * There are 3 built-in context levels: page > app > screen.
         * You can only be in one context at any given level, and
         * setting an outer level will clear any inner levels. See the
         * examples for details.
         * @function Static.setContext
         * @param {String} type The type of context to set.
         *  Possible values include 'page', 'app', or 'screen', or any
         *  custom value you want, such as 'dialog'.
         * @param {String} name The name of the context to set.
         * @param {Object} [data] Any optional data to include with
         *  the TrackingInfo.
         * @example
         * // set page first
         * Tracking.static.setContext('page', '/index', {
         *   title: 'Home'
         * });
         *
         * // then set app (if applicable)
         * Tracking.static.setContext('app', 'myAppName', {
         *   'appId': 'myAppId',
         *   'appVersion': '1.0'
         * });
         *
         * // then set the screen of the app (if applicable)
         * Tracking.static.setContext('screen', 'main');
         *
         * // subsequent tracking entries will include this data
         * Tracking.events.fire('loading');
         *
         * // if we now re-set the app level, the screen will
         * // be un-set for us automatically:
         * Tracking.static.setContext('app', 'anotherApp');
         * Tracking.events.fire('loading'); // page and app values will
         *      // be sent with this and future events, but not the
         *      // previous screen value
         */
        Static.setContext = function setContext(type, name, data) {
            Static.unsetContext(type);
            context[type] = name;
            Tracking.collectors.collect(new TrackingInfo({
                type: 'context',
                label: name,
                data: data || {},
                category: type
            }));
        };

        /**
         * Retrieves the value set for the given context (or 'not set', if
         * no context has yet been set).
         * @function Static.getContext
         * @param {String} type The name of the context (the context type).
         * @example
         * Tracking.static.getContext('screen'); // 'main'
         * Tracking.static.getContext('app'); // 'myAppName'
         */
        Static.getContext = function getContext(type) {
            return context[type] || 'not set';
        };

        /**
         * Clears any custom metrics associated with the specified
         * context type (page, app, screen, or a custom value), then
         * removes that context from the cached list. The context
         * and associated metrics will no longer be added to future
         * TrackingInfo instances.
         * @function Static.unsetContext
         * @param {String} type The type of context whose metrics
         *  should be cleared and which should be removed from the
         *  internal cache and no longer sent with future tracking
         *  data.
         * @param {Boolean} [collect=false] Set to `true` to notify
         *  any collectors that the context has been unset. Otherwise,
         *  no collectors will be notified.
         * @example
         * // automatically unsetting a context:
         * Tracking.static.setContext('screen', 'welcome');
         * // setting a new context at the same level will
         * // clear that context and any "lower" contexts,
         * // excluding any custom contexts, which must be
         * // unset manually
         * Tracking.static.setContext('screen', 'dashboard');
         * @example
         * // manually unsetting a custom context:
         * Tracking.static.setContext('dialog', 'help');
         * Tracking.static.unsetContext('dialog');
         */
        Static.unsetContext = function unsetContext(type, collect) {
            var allLevels = levels.concat(type),
                index = allLevels.indexOf(type);
            allLevels.slice(index).forEach(function clearContext(level) {
                context[level] = 'not set';
                if (levels.indexOf(type) === -1) {
                    delete context[level];
                }
                var mets = clone(metrics[level]);
                for(var metric in mets) {
                    if (mets.hasOwnProperty(metric)) {
                        Static.setMetric(level, metric);
                    }
                }
            });
            if (!!collect && index !== -1) {
                // notify any collectors that the context
                // has been unset
                Tracking.collectors.collect(new TrackingInfo({
                    label: '',
                    type: 'context',
                    category: type
                }));
            }
        };

        /**
         * Adds a new custom metric to the internal collection.
         * Custom metrics will be added to future {@link TrackingInfo}
         * instances automatically before persisting to collectors.
         * @function Static.setMetric
         * @param {String} type The type of metric to set.
         *  Possible values include 'page', 'app', or 'screen', as
         *  well as any custom contexts you may have set.
         * @param {String} name The name of the custom metric to set.
         * @param {*} value The value to associate with the custom
         *  metric. If `undefined` or '', the metric will no longer
         *  appear in future TrackingInfo instances.
         * @example
         * Tracking.static.setMetric('page', 'loginTime', Date.now());
         * Tracking.static.setMetric('app', 'mode', 'admin');
         * Tracking.static.setMetric('screen', 'message count', 6);
         * Tracking.events.fire('applications loaded');
         * @example
         * // to unset a previously set metric, either pass an empty
         * // string or do not specify the value:
         * Tracking.metric.setMetric('app', 'mode');
         * Tracking.metric.setMetric('app', 'mode', '');
         */
        Static.setMetric = function setMetric(type, name, value) {
            metrics[type] = metrics[type] || {};
            metrics[type][name] = value;
            if (typeof value === 'undefined' || value === '') {
                value = '';
                delete metrics[type][name];
            }
            if (levels.indexOf(type) === -1 &&
                !Object.keys(metrics[type]).length) {
                delete metrics[type];
            }
            Tracking.collectors.collect(new TrackingInfo({
                label: name,
                type: 'metric',
                category: type,
                variable: value
            }));
        };

        /**
         * Retrieves the value set for the custom metric under the specified
         * context (or `undefined`, if no metric was set for the specified
         * context).
         * @function Static.getMetric
         * @param {String} type The name of the context (the context type).
         * @param {String} name The name of the metric.
         * @example
         * Tracking.static.getMetric('app', 'mode'); // 'admin'
         * Tracking.static.getMetric('page', 'loginTime'); // [Date]
         */
        Static.getMetric = function getMetric(type, name) {
            return metrics[type] && metrics[type][name];
        };

        /**
         * Adds a new custom dimension to the internal collection. A
         * dimension represents some way you wish to segment your
         * collected tracking data. Common examples are by product
         * availability, geographic region, AB test group, etc.
         * @function Static.setDimension
         * @param {String} name The name of the custom dimension.
         * @param {String|undefined} value The value to associate
         *  with the new custom dimension. If `undefined` or '', the
         *  dimension will no longer appear in future TrackingInfo
         *  instances.
         * @example
         * Tracking.static.setDimension('region', 'northeast');
         * Tracking.static.setDimension('support-level', 'gold');
         * Tracking.events.fire('user data loaded');
         */
        Static.setDimension = function setDimension(name, value) {
            dimensions[name] = value;
            if (value === undefined || value === '') {
                delete dimensions[name];
            }
            Tracking.collectors.collect(new TrackingInfo({
                label: name,
                type: 'dimension',
                /* jshint -W041 */
                variable: value === undefined || value === null ?
                    '' : value.toString()
            }));
        };

        /**
         * Retrieves the value set for the custom dimension (or `undefined`,
         * if no value was set).
         * @function Static.getDimension
         * @param {String} name The name of the custom dimension.
         * @example
         * Tracking.static.getDimension('region'); // 'northeast'
         * Tracking.static.getDimension('support-level'); // 'gold'
         */
        Static.getDimension = function getDimension(name) {
            return dimensions[name];
        };
        
        /**
         * @private
         */
        Static.reset = function reset() {
            metrics = {};
            dimensions = {};
            context = {};
            levels.forEach(function addContext(level) {
                metrics[level] = {};
                context[level] = 'not set';
            });
        };

        Static.reset();

        return Static;
        
    };
    
});

/* global define: false */
define('mixins/Collectors',[], function() {

    'use strict';

    /**
     * Registers the collectors that should receive {@link TrackingInfo}
     * instances. Collectors are responsible for persisting tracking
     * data as they see fit. IMPORTANT: collectors are disabled by
     * default, which means any TrackingInfo instances received will be
     * cached. Once you have registered all the collectors you wish to
     * use, you will need to call {@link Collectors.enable} for the
     * cached TrackingInfo instances to be persisted.
     * @class Collectors
     */
    return function Collectors() {

        var queue = [],
            isPaused = true,
            
            collectors = [],
            decorators = [],
            
            decorate = function decorate(result, decorator) {
                /* jshint -W093 */
                return result = decorator(result) || result;
            },
            
            persist = function persist(info) {
                collectors.forEach(function doCollection(collector) {
                    collector.collect(info);
                });
            };

        /**
         * Adds a new collector to the underlying collection.
         * @function Collectors.add
         * @param {Object} collector The collector to add.
         * @throws Collectors must have a `collect` method.
         * @returns {Function} A method you can invoke to
         *  remove the collector from the underlying collection.
         * @see {@link GoogleAnalytics} for a sample collector.
         * @example
         * var remove = Tracking.collectors.add({
         *   collect: function collect(info) {
         *     console.log(info.toString());
         *   }
         * });
         * @example
         * var collector = new GoogleAnalytics({network: false});
         * Tracking.collectors.add(collector);
         * Tracking.collectors.remove(collector);
         */
        Collectors.add = function add(collector) {
            if (!collector || typeof collector.collect !== 'function') {
                throw new Error('Collectors must have a `collect` method.');
            }
            collectors.push(collector);
            return Collectors.remove.bind(null, collector);
        };

        /**
         * Removes the specified collector from the collection.
         * @function Collectors.remove
         * @param {Object} collector The collector to remove.
         * @example
         * var collector = new GoogleAnalytics();
         * Tracking.collectors.add(collector);
         * Tracking.collectors.remove(collector);
         */
        Collectors.remove = function remove(collector) {
            collectors.splice(collectors.indexOf(collector), 1);
        };

        /**
         * Registers a decorator function. Decorators run when
         * a {@link TrackingInfo} instance is created, which
         * (if collection is disabled) could be long before the
         * instance is sent to collectors. Note that top-level
         * TrackingInfo instance properties are frozen, but you
         * can still modify the `tags` and `data` fields. See
         * the example for details.
         * @function Collectors.decorate
         * @param {Function} decorator The method to call with
         *  each newly created {@link TrackingInfo} instance.
         * @throws Parameter `decorator` must be a function.
         * @returns {Function} A method you can invoke to remove
         *  the decorator from the underlying collection.
         * @example
         * Tracking.collectors.decorate(function(info) {
         *   // only `data` and `tags` can be modified:
         *   info.data.sessionId = getSessionId();
         *   if (info.type === 'timer') {
         *     info.tags.push('timing');
         *   }
         * });
         */
        Collectors.decorate = function addDecorator(decorator) {
            if (typeof decorator !== 'function') {
                throw new Error('Parameter `decorator` must be a function.');
            }
            decorators.push(decorator);
            return function removeDecorator() {
                decorators.splice(decorators.indexOf(decorator), 1);
            };
        };

        /**
         * Turns on persistence. Collectors will be sent any
         * cached {@link TrackingInfo} instances immediately.
         * @function Collectors.enable
         * @example
         * Tracking.collectors.add(googleCollector);
         * Tracking.collectors.add(splunkCollector);
         * Tracking.collectors.add(consoleCollector);
         * Tracking.collectors.enable();
         */
        Collectors.enable = function enable() {
            isPaused = false;
            queue.forEach(persist);
            queue = [];
        };

        /**
         * Turns off persistence. Any {@link TrackingInfo} instances
         * will be cached until {@link Collectors.enable} is called
         * again. This is the default state of the {@link Collectors}
         * instance.
         * @function Collectors.disable
         */
        Collectors.disable = function disable() {
            isPaused = true;
        };

        /**
         * Decorates the given {@link TrackingInfo} instance and then
         * either sends it to any registered collectors (if enabled);
         * otherwise, caches the TrackingInfo instance. It is rare
         * that you will call this method directly. Instead, the Tracking
         * framework calls this method for you at the appropriate times.
         * @function Collectors.collect
         * @param {TrackingInfo} info The TrackingInfo instance to
         *  decorate and either cache or send to collectors.
         */
        Collectors.collect = function collect(info) {
            info = decorators.reduce(decorate, info);
            if (isPaused) {
                queue[queue.length] = info;
            } else {
                persist(info);
            }
        };
        
        /**
         * @private
         */
        Collectors.reset = function reset() {
            queue = [];
            collectors = [];
            isPaused = true;
            // NOTE:
            // we can't reset decorators because
            // the Network mixin depends on having
            // its decorator applied
        };

        return Collectors;
        
    };
    
});

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
define('Tracking',[
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
    function Tracking() {}

    function mixin(name, constructor) {
        Tracking[name] = constructor(Tracking);
    }

    /** @member {Collectors} Tracking.collectors */
    mixin('collectors', Collectors);

    /** @member {Errors} Tracking.errors */
    mixin('errors', Errors);

    /** @member {Events} Tracking.events */
    mixin('events', Events);

    /** @member {Timers} Tracking.timers */
    mixin('timers', Timers);

    /** @member {Marks} Tracking.marks */
    mixin('marks', Marks);

    /** @member {Static} Tracking.static */
    mixin('static', Static);

    /** @member {Network} Tracking.network */
    mixin('network', Network);

    /**
     * @member {Function} Tracking.generateUUID
     * @description Invoke to generate a universally unique identifier.
     */
    Tracking.generateUUID = generateUUID;

    return Tracking;
    
});

    return require('Tracking');

}));