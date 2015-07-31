/* global define: false */
define([], function() {

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
         * Registers a decorator function. Decorators run after
         * a {@link TrackingInfo} instance is created but before
         * it is sent to any registered collectors. Note that
         * top-level TrackingInfo instance properties are frozen,
         * but you can still modify the `tags` and `data` fields.
         * See the example for details.
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
        
        return Collectors;
        
    };
    
});
