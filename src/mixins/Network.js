/* global define: false */
define(['../TrackingInfo'], function(TrackingInfo) {
    
    'use strict';
    
    return function Network(Tracking) {
        
        Network.getEntries = function getEntries() { return []; };

        var lastLength = 0,
            resourceCounts = {},
            persist = Tracking.collectors.collect.bind(Tracking.collectors),
            
            getTimingInfo = function getTimingInfo(timing) {
                return new TrackingInfo({
                    category: 'network',
                    label: timing.name,
                    type: timing.initiatorType,
                    start: timing.startTime,
                    stop: timing.responseEnd,
                    count: resourceCounts[timing.name] = (resourceCounts[timing.name] || 0) + 1,
                    data: {
                        size: timing.transferSize, // NOTE: not all browsers provide transferSize
                        cachedOrLocal: timing.fetchStart === timing.connectEnd,
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
                lastLength += entries.length;

            };
        
        if (!!performance && !!performance.getEntriesByType) {
            
            Network.getEntries = performance.getEntriesByType.bind(performance, 'resource');

            performance.addEventListener('onresourcetimingbufferfull', function bufferFull() {
                collectTimings();
                lastLength = 0;
            });
            
            setInterval(collectTimings, 1000);

        }
        
        return Network;
        
    };
    
});