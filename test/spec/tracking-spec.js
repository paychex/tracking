/* global define: false */

define(['Tracking'], function(Tracking) {

    'use strict';

    /* jshint jasmine: true */

    describe('Tracking', function() {

        afterEach(function tearDown() {
            Tracking.collectors.reset();
        });

        it('has expected methods', function() {
            ['generateUUID', 'createChild'].forEach(function verify(methodName) {
                expect(methodName in Tracking).toBe(true);
                expect(typeof Tracking[methodName]).toBe('function');
            });
        });

        describe('.generateUUID', function() {

            it('returns UUID', function() {
                for(var i = 0; i < 10; i++) {
                    expect(Tracking.generateUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
                }
            });

        });

        describe('.createChild', function() {

            it('child is separate instance from parent', function() {
                expect(Tracking.createChild()).not.toBe(Tracking);
            });

            it('child can have decorators separate from parent', function() {
                var called = false,
                    child = Tracking.createChild(),
                    remove1 = child.collectors.decorate(function(info) {
                        info.data.fromChild = true;
                        return info;
                    }),
                    remove2 = child.collectors.add({ collect: function(info) {
                        remove1();
                        remove2();
                        called = true;
                        expect(info.data.fromChild).toBe(true);
                    } });
                child.collectors.enable();
                child.events.fire('event-name');
                expect(called).toBe(true);
            });

            it('parent decorators apply to child', function() {
                var called = false,
                    child = Tracking.createChild(),
                    remove1 = Tracking.collectors.decorate(function(info) {
                        info.data.fromParent = true;
                        return info;
                    }),
                    remove2 = child.collectors.add({ collect: function(info) {
                        remove1();
                        remove2();
                        called = true;
                        expect(info.data.fromParent).toBe(true);
                    } });
                child.collectors.enable();
                child.events.fire('event-name');
                expect(called).toBe(true);
            });

            it('ancestor decorators applied in top-down order', function() {
                var callOrder = [],
                    child = Tracking.createChild(),
                    grandchild = child.createChild(),
                    remove1 = Tracking.collectors.decorate(function(info) {
                        info.data.grandparent = true;
                        callOrder.push('grandparent');
                        return info;
                    }),
                    remove2 = child.collectors.decorate(function(info) {
                        info.data.parent = true;
                        callOrder.push('parent');
                    }),
                    remove3 = grandchild.collectors.decorate(function(info) {
                        info.data.child = true;
                        callOrder.push('child');
                    }),
                    remove4 = grandchild.collectors.add({ collect: function(info) {
                        remove1();
                        remove2();
                        remove3();
                        remove4();
                        expect(callOrder).toEqual(['grandparent', 'parent', 'child']);
                        expect(info.data.grandparent).toBe(true);
                        expect(info.data.parent).toBe(true);
                        expect(info.data.child).toBe(true);
                    } });
                grandchild.collectors.enable();
                grandchild.events.fire('event-name');
            });

            it('static values are inherited and merged', function() {
                var parent = Tracking,
                    child = parent.createChild();
                parent.collectors.enable();
                child.collectors.enable();
                parent.static.setMetric('app', 'cm1', 'parent-metric1');
                parent.static.setMetric('app', 'cm2', 'parent-metric2');
                parent.static.setDimension('cd1', 'parent-dimension1');
                parent.static.setDimension('cd2', 'parent-dimension2');
                child.static.setMetric('app', 'cm2', 'child-metric2');
                child.static.setDimension('cd2', 'child-dimension2');
                var remove1 = parent.collectors.add({ collect: function(info) {
                    expect(info.data.metrics.app.cm1).toBe('parent-metric1');
                    expect(info.data.metrics.app.cm2).toBe('parent-metric2');
                    expect(info.data.dimensions.cd1).toBe('parent-dimension1');
                    expect(info.data.dimensions.cd2).toBe('parent-dimension2');
                }});
                var remove2 = child.collectors.add({ collect: function(info) {
                    expect(info.data.metrics.app.cm1).toBe('parent-metric1');
                    expect(info.data.metrics.app.cm2).toBe('child-metric2');
                    expect(info.data.dimensions.cd1).toBe('parent-dimension1');
                    expect(info.data.dimensions.cd2).toBe('child-dimension2');
                    remove1();
                    remove2();
                }});
                child.events.fire('event-name');
            });

        });

    });

});
