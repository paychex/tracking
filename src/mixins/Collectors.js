/* global define: false */
define([], function() {
    
    'use strict';
    
    return function Collectors() {

        var queue = [],
            isPaused = true,
            
            collectors = [],
            decorators = [],
            
            decorate = function decorate(result, decorate) {
                return result = decorate(result) || result;
            },
            
            persist = function persist(info) {
                collectors.forEach(function doCollection(collector) {
                    collector.collect(info);
                });
            };

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

        Collectors.decorate = function addDecorator(decorator) {
            if (typeof decorator !== 'function') {
                throw new Error('Parameter `decorator` must be a function.');
            }
            decorators.push(decorator);
            return function removeDecorator() {
                decorators.splice(decorators.indexOf(decorator), 1);
            }
        };

        Collectors.enable = function enable() {
            isPaused = false;
            queue.forEach(persist);
            queue = [];
        };

        Collectors.disable = function disable() {
            isPaused = true;
        };

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