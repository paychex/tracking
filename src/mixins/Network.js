/* global define, window, setInterval: false */
define(['../TrackingInfo', './Marks'], function(TrackingInfo, Marks) {
    
    'use strict';
    
    /**
     * Automatically collects and persists resource timing data
     * to any registered collectors. This includes anything
     * downloaded by the site or by the user during his session.
     * @class Network
     */
    return function Network(persist) {
        
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
