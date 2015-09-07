/* global define: false */

define(['Tracking'], function(Tracking) {

    'use strict';

    /* jshint jasmine: true */

    describe('mixins/Collectors', function() {

        afterEach(function tearDown() {
            Tracking.collectors.reset();
        });

        describe('add', function() {

            it('throws error if no collect method', function() {
                [
                    undefined,
                    null,
                    NaN,
                    {},
                    {collect: 13}
                ].forEach(function(item) {
                    expect(function() {
                        Tracking.collectors.add(item);
                    }).toThrowError('Collectors must have a `collect` method.');
                });
            });

            it('returns function to remove collector', function() {
                var remove = Tracking.collectors.add({collect:function(){}});
                expect(typeof remove).toBe('function');
                expect(remove()).toBe(undefined);
            });

        });

        describe('remove', function() {

            it('removes collector from internal collection', function() {
                var collector = {collect: function(){
                    throw new Error('not implemented');
                }};
                Tracking.collectors.add(collector);
                Tracking.collectors.remove(collector);
            });

            it('does nothing if collector not in collection', function() {
                Tracking.collectors.remove({collect:function(){}});
            });

        });

        describe('decorate', function() {

            it('throws if non-function provided', function() {
                [
                    undefined,
                    null,
                    {},
                    new Date()
                ].forEach(function(item) {
                    expect(function() {
                        Tracking.collectors.decorate(item);
                    }).toThrowError('Parameter `decorator` must be a function.');
                });
            });

            it('returns function to remove decorator', function() {
                var remove = Tracking.collectors.decorate(function() {});
                expect(typeof remove).toBe('function');
                expect(remove()).toBe(undefined);
            });

            it('is invoked even when paused', function(done) {
                var remove = Tracking.collectors.decorate(function() {
                    remove();
                    done();
                });
                Tracking.collectors.collect({data:{}});
            });

            it('decorators are invoked in order', function() {
                var results = [],
                    remove1 = Tracking.collectors.decorate(function() {
                        results.push(1);
                    }),
                    remove2 = Tracking.collectors.decorate(function() {
                        results.push(2);
                    });
                expect(results).toEqual([]);
                Tracking.collectors.collect({data:{}});
                expect(results).toEqual([1, 2]);
                remove1();
                remove2();
            });

        });

        describe('enable', function() {

            it('items are not persisted by default', function() {
                var remove = Tracking.collectors.add({
                    collect: function() {
                        throw new Error('not implemented');
                    }
                });
                Tracking.collectors.collect({data:{}});
                remove();
            });

            it('queued items are persisted when enabled', function() {
                var items = [],
                    item1 = {data:{}},
                    item2 = {data:{}},
                    remove = Tracking.collectors.add({
                        collect: function(item) {
                            items.push(item);
                        }
                    });
                Tracking.collectors.collect(item1);
                Tracking.collectors.collect(item2);
                expect(items.length).toBe(0);
                Tracking.collectors.enable();
                expect(items.length).toBe(2);
                expect(items[0]).toBe(item1);
                expect(items[1]).toBe(item2);
                Tracking.collectors.disable();
                remove();
            });

        });

        describe('disable', function() {

            it('does not persist subsequent items', function() {
                var items = [],
                    item1 = {data:{}},
                    item2 = {data:{}},
                    remove = Tracking.collectors.add({
                        collect: function(item) {
                            items.push(item);
                        }
                    });
                expect(items.length).toBe(0);
                Tracking.collectors.enable();
                Tracking.collectors.collect(item1);
                expect(items.length).toBe(1);
                expect(items[0]).toBe(item1);
                Tracking.collectors.disable();
                Tracking.collectors.collect(item2);
                expect(items.length).toBe(1);
                expect(items[0]).toBe(item1);
                remove();
            });

        });

        describe('collect', function() {

            it('invokes decorator before collecting', function() {
                var results = [],
                    remove1 = Tracking.collectors.decorate(function() {
                        results.push(1);
                    }),
                    remove2 = Tracking.collectors.add({
                        collect: function() {
                            results.push(2);
                        }
                    });
                expect(results).toEqual([]);
                Tracking.collectors.collect({data:{}});
                expect(results).toEqual([1]);
                Tracking.collectors.enable();
                expect(results).toEqual([1, 2]);
                Tracking.collectors.disable();
                remove1();
                remove2();
            });

        });

    });

});
