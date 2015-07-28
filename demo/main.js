/* global require, define, console: false */
/* jshint browser: true */
require.config({
    baseUrl: '../src'
});

define(['Tracking'], function(Tracking) {

    var removeCollector = Tracking.collectors.add({
        collect: function collect(info) {
            console.log(info.toString());
        }
    });
    
    var removeDecorator = Tracking.collectors.decorate(function(info) {
        info.data.sessionId = 'someSessionId';
        if (info.category === 'metrics') {
            info.tags.push('analytics');
        }
    });

    Tracking.events.fire('click', {label: 'button clicked', misc: 'hello'});
    Tracking.events.fire('load', {category: 'DOM', label: 'site loaded'});

    Tracking.static.setContext('main');
    Tracking.static.setMetric('uid', 'username');

    Tracking.events.fire('count', {
        category: 'metrics',
        label: 'site navigation',
        tags: ['ui', 'navigation'],
        variable: Math.random() * 20 >>> 0
    });

    Tracking.static.setDimension('eligible-for-upgrade', true);

    Tracking.marks.start('setInterval');

    var count = 0,
        parent = Tracking.timers.create('parent'),
        child = parent.add('child'),
        grandchild = child.add('grandchild'),
        token = setInterval(function() {
        
            parent.start();

            Tracking.static.setContext('loop #' + count);
            Tracking.marks.set('timers.started', {category: 'timers'});
            
            if (count === 1) {
                Tracking.collectors.enable();
            } else if (count === 3) {
                Tracking.collectors.disable();
            }
        
            setTimeout(function() {
                child.start();
                setTimeout(function() {
                    grandchild.start();
                    setTimeout(finish, 50);
                }, 200);
            }, 100);
        
            function finish() {
        
                grandchild.stop({custom: 'value'});
                // comment this out to see an error:
                child.stop({variable: 'variable'});
                parent.stop({tags: ['bagged', 'and', 'tagged']});
        
                Tracking.marks.set('timers.stopped', {category: 'timers'});
                Tracking.marks.measure('timers.duration', 'timers.started', 'timers.stopped', {tags: ['performance']});
        
                if (++count >= 5) {
                    Tracking.marks.stop('setInterval');
                    Tracking.collectors.enable();
                    removeCollector();
                    removeDecorator();
                    clearInterval(token);
                }
        
            }
            
        }, 5000);

});