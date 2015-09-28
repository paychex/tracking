/* global define, window, setInterval: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
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
            
            getTimingInfo = function getTimingInfo(timing) {
                return new TrackingInfo({
                    type: 'network',
                    label: timing.name,
                    start: timing.startTime,
                    stop: timing.responseEnd,
                    category: timing.initiatorType,
                    count: resourceCounts[timing.name] = (resourceCounts[timing.name] || 0) + 1,
                    data: {
                        size: timing.transferSize, // NOTE: not all browsers provide transferSize
                        cachedOrLocal: timing.fetchStart === timing.connectEnd,
                        blockTime: Math.max(0, (timing.requestStart || timing.fetchStart) - timing.startTime),
                        stages: {
                            fetch: {
                                start: timing.fetchStart,
                                end: timing.domainLookupStart,
                                duration: timing.domainLookupStart - timing.fetchStart
                            },
                            dns: {
                                start: timing.domainLookupStart,
                                end: timing.domainLookupEnd,
                                duration: timing.domainLookupEnd - timing.domainLookupStart
                            },
                            tcp: {
                                start: timing.connectStart,
                                end: timing.connectEnd,
                                duration: timing.connectEnd - timing.connectStart
                            },
                            request: {
                                start: timing.requestStart,
                                end: timing.responseStart,
                                duration: timing.responseStart - timing.requestStart
                            },
                            response: {
                                start: timing.responseStart,
                                end: timing.responseEnd,
                                duration: timing.responseEnd - timing.responseStart
                            }
                        }
                    }
                });
            },

            collectTimings = function collectNetworkTimings() {

                var entries = Network.getEntries()
                    .slice(lastLength)
                    .map(getTimingInfo);

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
