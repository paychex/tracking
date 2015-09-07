/* global define: false */

define(['Tracking', '../TestCollector'], function(Tracking, TestCollector) {

    'use strict';

    /* jshint jasmine: true */

    describe('mixins/Timers', function() {

        beforeEach(function setUp() {
            this.collector = new TestCollector();
            this.remove = Tracking.collectors.add(this.collector);
            this.expectInfo = function expect(info) {
                this.collector.expectTrackingInfo(info);
            };
            Tracking.collectors.enable();
        });

        afterEach(function tearDown() {
            this.remove();
            this.collector.verifyNoOutstandingExpectations();
            Tracking.timers.reset();
            Tracking.static.reset();
            Tracking.collectors.reset();
        });

        describe('create', function() {

            it('throws if empty or non-string provided for name', function() {
                [
                    '',
                    NaN,
                    null,
                    undefined,
                    new Date()
                ].forEach(function(name) {
                    expect(function() {
                        Tracking.timers.create(name);
                    }).toThrowError('A timer name must be specified.');
                });
            });

            it('returns Timer instance', function() {
                var timer = Tracking.timers.create('name');
                expect(timer.type).toBe('timer');
            });

            it('returns distinct instance for same Timer name', function() {
                var timer1 = Tracking.timers.create('timer'),
                    timer2 = Tracking.timers.create('timer');
                expect(timer1).not.toBe(timer2);
            });

            it('Timer instance has appropriate properties', function() {
                var timer = Tracking.timers.create('my timer');
                expect(timer.type).toBe('timer');
                expect(timer.label).toBe('my timer');
                expect(timer.parent).toBe(null);
                expect(timer.children).toEqual([]);
                expect(timer.state).toBe(0);
            });

        });

        describe('Timer', function() {

            describe('start', function() {

                it('throws if already started', function() {
                    var timer = Tracking.timers.create('timer');
                    timer.start();
                    expect(function() {
                        timer.start();
                    }).toThrowError('Invalid Operation: Timer `timer` already started.');
                });

                it('calls reset method', function() {
                    var timer = Tracking.timers.create('timer');
                    spyOn(timer, 'reset').and.callThrough();
                    timer.start();
                    expect(timer.reset).toHaveBeenCalled();
                });

                it('sets startTime to current epoch time', function() {
                    var timer = Tracking.timers.create('timer');
                    timer.start();
                    expect(timer.startTime).toBeCloseTo(Date.now(), 2);
                });

                it('sets state to STARTED', function() {
                    var timer = Tracking.timers.create('timer');
                    expect(timer.state).toBe(0);
                    timer.start();
                    expect(timer.state).toBe(1);
                });

            });

            describe('stop', function() {

                it('throws if not started', function() {
                    var timer = Tracking.timers.create('timer');
                    expect(function() {
                        timer.stop();
                    }).toThrowError('Invalid Operation: Timer `timer` not started.');
                });

                it('throws if any children are not stopped', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    parent.start();
                    child.start();
                    expect(function() {
                        parent.stop();
                    }).toThrowError(
                        'The following child timers are in an invalid state:\n' +
                        '\t- parent/child: STARTED'
                    );
                });

                it('throws if any children are pending', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    parent.start();
                    expect(function() {
                        parent.stop();
                    }).toThrowError(
                        'The following child timers are in an invalid state:\n' +
                        '\t- parent/child: PENDING'
                    );
                });

                it('sets stopTime to current epoch time', function() {
                    this.expectInfo({type: 'timer'});
                    var timer = Tracking.timers.create('timer');
                    timer.start();
                    timer.stop();
                    expect(timer.stopTime).toBeCloseTo(Date.now(), 2);
                });

                it('sets state to STOPPED', function() {
                    this.expectInfo({type: 'timer'});
                    var timer = Tracking.timers.create('timer');
                    expect(timer.state).toBe(0);
                    timer.start();
                    expect(timer.state).toBe(1);
                    timer.stop();
                    expect(timer.state).toBe(2);
                });

                it('auto-increases count by timer name', function() {
                    this.expectInfo({type: 'timer', count: 1});
                    this.expectInfo({type: 'timer', count: 2});
                    var timer = Tracking.timers.create('my timer');
                    timer.start();
                    timer.stop();
                    timer.start();
                    timer.stop();
                });

                it('does not persist if parent timer exists', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    parent.start();
                    child.start();
                    child.stop();
                });

                it('persists when no parent timer exists', function() {
                    this.expectInfo({type: 'timer', label: 'timer'});
                    var timer = Tracking.timers.create('timer');
                    timer.start();
                    timer.stop();
                });

                it('persists with any custom data provided', function() {
                    this.expectInfo({});
                    var timer = Tracking.timers.create('timer'),
                        remove = Tracking.collectors.add({
                            collect: function(info) {
                                expect(info.data.custom).toBe('value');
                            }
                        });
                    timer.start();
                    timer.stop({custom: 'value'});
                    remove();
                });

            });

            describe('add', function() {

                it('returns newly created child', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    expect(child).toBeDefined();
                    expect(typeof child.start).toBe('function');
                    expect(typeof child.stop).toBe('function');
                });

                it('creates child with parent/child name', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    expect(parent.label).toBe('parent');
                    expect(child.label).toBe('parent/child');
                });

                it('sets parent/child relationship', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    expect(parent.children.length).toBe(1);
                    expect(parent.children[0]).toBe(child);
                    expect(child.parent).toBe(parent);
                });

            });

            describe('remove', function() {

                it('accepts string name', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    expect(parent.children.length).toBe(1);
                    parent.remove('child');
                    expect(parent.children.length).toBe(0);
                });

                it('accepts Timer instance', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    expect(parent.children.length).toBe(1);
                    parent.remove(child);
                    expect(parent.children.length).toBe(0);
                });

                it('returns child if found', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child'),
                        removed = parent.remove('child');
                    expect(removed).toBe(child);
                });

                it('returns undefined if child not found', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child'),
                        removed = parent.remove('dne');
                    expect(removed).not.toBeDefined();
                });

                it('removes parent/child relationship', function() {
                    var parent = Tracking.timers.create('parent'),
                        child = parent.add('child');
                    expect(child.parent).toBe(parent);
                    expect(parent.children[0]).toBe(child);
                    parent.remove('child');
                    expect(child.parent).toBe(null);
                    expect(parent.children.length).toBe(0);
                });

            });

            describe('reset', function() {

                it('deletes data, startTime, and stopTime properties', function() {
                    this.expectInfo({});
                    var timer = Tracking.timers.create('timer');
                    timer.start();
                    timer.stop({});
                    expect(timer.data).toBeDefined();
                    expect(timer.startTime).toBeGreaterThan(0);
                    expect(timer.stopTime).toBeGreaterThan(0);
                    timer.reset();
                    expect(timer.data).not.toBeDefined();
                    expect(timer.startTime).not.toBeDefined();
                    expect(timer.stopTime).not.toBeDefined();
                });

                it('sets state to PENDING', function() {
                    var timer = Tracking.timers.create('timer');
                    expect(timer.state).toBe(0);
                    timer.start();
                    expect(timer.state).toBe(1);
                    timer.reset();
                    expect(timer.state).toBe(0);
                });

            });

        });

    });

});
