/* global define: false */
define([], function() {

    'use strict';

    var ga = window.ga,

        nop = function nop() {},

        merge = function merge(result) {
            var sources = [].slice.call(arguments, 1);
            sources.reduce(function copyProperties(out, obj) {
                Object.keys(obj).forEach(function copyProperty(key) {
                    out[key] = obj[key];
                });
            }, result);
            return result;
        },

        setValue = function setValue(info) {
            ga('set', info.label, info.variable);
        },

        setContext = function setContext(info) {
            ga('send', 'pageview', merge({
                'title': info.label
            }, info.data));
        },

        sendEvent = function sendEvent(info) {
            ga('send', merge({
                'hitType': 'event',
                'eventCategory': info.category || info.type,
                'eventAction': info.action,
                'eventLabel': info.label,
                'eventValue': info.count
            }, info.data));
        },

        sendException = function sendException(info) {
            ga('send', merge({
                'hitType': 'exception',
                'exDescription': info.data.message,
                'exFatal': info.data.severity === 'FATAL'
            }, info.data));
        },

        sendTimer = function sendTimer(info) {
            ga('send', merge({
                'hitType': 'timer',
                'timingCategory': info.category || info.type,
                'timingValue': info.duration,
                'timingLabel': info.label,
                'timingVar': info.variable
            }, info.data));
        };

    /**
     * @class GoogleAnalytics
     * @param {Object} [switches] An optional map of which
     *  {@link TrackingInfo#type} values should be switched
     *  off. By default, all timings will be persisted as
     *  the most applicable GA hitType. See the examples.
     * @example
     * // all TrackingInfo types will be sent to GA
     * var collector = new GoogleAnalytics();
     * @example
     * // network types (download timings) will NOT be persisted
     * var collector = new GoogleAnalytics({ network: false });
     */
    function GoogleAnalytics(switches) {

        this.methods = {
            'context': setContext,
            'metric': setValue,
            'dimension': setValue,
            'error': sendException,
            'event': sendEvent,
            'timer': sendTimer,
            'mark': sendTimer,
            'measure': sendTimer,
            'network': sendTimer
        };

        switches = switches || {};

        Object.keys(this.methods).forEach(function toggle(key) {
            if ((key in switches) && !switches[key]) {
                this.methods[key] = nop;
            }
        }.bind(this));

    }

    GoogleAnalytics.prototype.collect = function collect(info) {
        (this.methods[info.type] || nop)(info);
    };

    return GoogleAnalytics;

});