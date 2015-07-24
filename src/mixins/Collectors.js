/* global define: false */
define([], function() {
    
    'use strict';
    
    return function Collectors(Tracking) {

        var collectors = [];
        
        Collectors.add = function add(collector) {
            if (!collector || typeof collector.collect !== 'function') {
                throw new Error('Collectors must have a `collect` method.');
            }
            collectors.push(collector);
            return Collectors.remove.bind(null, collector);
        };
        
        Collectors.remove = function remove(collector) {
            collectors.splice(collectors.indexOf(collector), 1);
        };
        
        Collectors.collect = function collect(info) {
            collectors.forEach(function doCollection(collector) {
                collector.collect(info);
            });
        };
        
        return Collectors;
        
    };
    
});