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
         * @example
         * // automatically unsetting a context:
         * Tracking.static.setContext('screen', 'welcome');
         * // setting a new context at the same level will
         * // clear that context and any "lower" contexts,
         * // exclusing any custom contexts, which must be
         * // unset manually
         * Tracking.static.setContext('screen', 'dashboard');
         * @example
         * // manually unsetting a custom context:
         * Tracking.static.setContext('dialog', 'help');
         * Tracking.static.unsetContext('dialog');
         */
        Static.unsetContext = function unsetContext(type) {
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
        };

        /**
         * Adds a new custom metric to the internal collection.
         * Custom metrics will be added to future {@link TrackingInfo}
         * instances automatically before persisting to collectors.
         * @function Static.setMetric
         * @param {String} type The type of metric to set.
         *  Possible values include 'page', 'app', or 'screen'.
         * @param {String} name The name of the custom metric to set.
         * @param {*} value The value to associate with the custom
         *  metric. If `undefined`, the metric will no longer appear
         *  in future TrackingInfo instances.
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
