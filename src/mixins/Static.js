/* global define: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    /**
     * Sets metadata applicable to all {@link TrackingInfo} instances.
     * This metadata will be added to any TrackingInfo instance prior
     * to being persisted to registered collectors.
     * @class Static
     */
    return function Static(Tracking) {

        var metrics = {},
            dimensions = {},
            context = {
                page:   'not set',
                app:    'not set',
                screen: 'not set'
            },

            clone = function clone(obj) {
                return Object.keys(obj).reduce(function copy(result, key) {
                    return result[key] = obj[key], result;
                }, {});
            };

        Tracking.collectors.decorate(function setMetaData(info) {
            info.data.context = context;
            info.data.metrics = clone(metrics);
            info.data.dimensions = clone(dimensions);
        });

        /**
         * Sets the global context on future {@link TrackingInfo}
         * instances before they are sent to any registered collectors.
         * Typically, this would be the current "screen" of your
         * application. Until provided, the default context is "none".
         * @function Static.setContext
         * @param {String} name The name of the context to set.
         * @param {String} type The type of context to set.
         *  Possible values include 'page', 'app', or 'screen'.
         * @param {Object} [data] Any optional data to include with
         *  the TrackingInfo.
         * @example
         * // set page first
         * Tracking.static.setContext('/index', 'page', {
         *   title: 'Home'
         * });
         *
         * // then set app (if applicable)
         * Tracking.static.setContext('myAppName', 'app', {
         *   'appId': 'myAppId',
         *   'appVersion': '1.0'
         * });
         *
         * // then set the screen of the app (if applicable)
         * Tracking.static.setContext('main', 'screen');
         *
         * // subsequent tracking entries will include this data
         * Tracking.events.fire('loading');
         */
        Static.setContext = function setContext(name, type, data) {
            context[type] = name;
            Tracking.collectors.collect(new TrackingInfo({
                type: 'context',
                label: name,
                data: data || {},
                category: type
            }));
        };

        /**
         * Adds a new custom metric to the internal collection.
         * Custom metrics will be added to future {@link TrackingInfo}
         * instances automatically before persisting to collectors.
         * @function Static.setMetric
         * @param {String} name The name of the custom metric to set.
         * @param {*} value The value to associate with the custom
         *  metric. If `undefined`, the metric will no longer appear
         *  in future TrackingInfo instances.
         * @example
         * Tracking.static.setMetric('mode', 'admin');
         * Tracking.events.fire('applications loaded');
         */
        Static.setMetric = function setMetric(name, value) {
            metrics[name] = value;
            Tracking.collectors.collect(new TrackingInfo({
                label: name,
                type: 'metric',
                variable: value
            }));
        };

        /**
         * Adds a new custom dimension to the internal collection. A
         * dimension represents some way you wish to segment your
         * collected tracking data. Common examples are by product
         * availability, geographic region, AB test group, etc.
         * @function Static.setDimension
         * @param {String} name The name of the custom dimension.
         * @param {String|undefined} value The value to associate
         *  with the new custom dimension. If `undefined`, the
         *  dimension will no longer appear in future TrackingInfo
         *  instances.
         * @example
         * Tracking.static.setDimension('region', 'northeast');
         * Tracking.static.setDimension('support-level', 'gold');
         * Tracking.events.fire('user data loaded');
         */
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
