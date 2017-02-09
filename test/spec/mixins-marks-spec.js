/* global define: false */

define(['Tracking', '../TestCollector'], function(Tracking, TestCollector) {

    'use strict';

    /* jshint jasmine: true */

    describe('mixins/Marks', function() {

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
            Tracking.marks.reset();
            Tracking.static.reset();
            Tracking.collectors.reset();
        });

        describe('set', function() {

            it('is alias of mark', function() {
                expect(Tracking.marks.set).toBe(Tracking.marks.mark);
            });

            it('throws if empty or non-string provided for name', function() {
                [
                    undefined,
                    null,
                    '',
                    new Date(),
                    {}
                ].forEach(function(name) {
                    expect(function() {
                        Tracking.marks.set(name);
                    }).toThrowError('A mark name must be specified.');
                });
            });

            it('sends "mark" type TrackingInfo to collectors', function() {
                this.expectInfo({
                    type: 'mark',
                    label: 'mark name'
                });
                Tracking.marks.set('mark name');
            });

            it('sets mark properties correctly', function() {
                var remove = Tracking.collectors.add({
                        collect: function(info) {
                            expect(info.stop).not.toBeLessThan(before);
                            expect(info.start).toBeLessThan(info.stop);
                            expect(info.count).toBe(1);
                            expect(info.data.custom).toBe('value');
                        }
                    }),
                    data = {custom: 'value'},
                    before = Date.now();
                this.expectInfo({});
                Tracking.marks.set('test mark', data);
                remove();
            });

            it('works with undefined data parameter', function() {
                this.expectInfo({label: 'testing'});
                Tracking.marks.set('testing');
            });

            it('auto-increases count based on mark name', function() {
                this.expectInfo({count: 1});
                this.expectInfo({count: 2});
                this.expectInfo({count: 3});
                Tracking.marks.set('mark');
                Tracking.marks.set('mark');
                Tracking.marks.set('mark');
            });

            it('adds POJO mark to internal collection', function() {
                this.expectInfo({});
                Tracking.marks.set('marky');
                var marks = Tracking.marks.getMarks();
                expect(marks.length).toBe(2);
                expect(marks[1].label).toBe('marky');
            });

            it('calls window.performance.mark if it exists', function() {
                /* jshint -W117 */
                window.performance = window.performance || {};
                window.performance.mark = window.performance.mark || function mark(){};
                spyOn(window.performance, 'mark');
                expect(window.performance.mark).not.toHaveBeenCalled();
                this.expectInfo({label: 'go'});
                Tracking.marks.set('go');
                expect(window.performance.mark).toHaveBeenCalledWith('go');
            });

        });

        describe('start', function() {

            it('calls set with "Start: " prepending the mark name', function() {
                var args = ['name', {custom: 'value'}];
                spyOn(Tracking.marks, 'set');
                Tracking.marks.start.apply(null, args);
                expect(Tracking.marks.set).toHaveBeenCalledWith('Start: ' + args[0], args[1]);
            });

            describe('returned "stop" function', function() {

                it('returns a "stop" function with the same parameters passed in (no/undefined overrides)', function() {
                    var args = ['name', {custom: 'value'}],
                        stopFn;

                    // Setup some spies
                    //
                    // Ignore any setup by ignoring set()
                    spyOn(Tracking.marks, 'set').and.returnValue(null);
                    //
                    // Need to spy on stop() to be sure it is called
                    spyOn(Tracking.marks, 'stop');

                    // Get a reference to the stop function
                    stopFn = Tracking.marks.start.apply(null, args);

                    // Check the type of the stop function
                    expect(stopFn).toEqual(jasmine.any(Function));

                    // Execute the stop function
                    stopFn();

                    // Check that Tracking.marks.stop was called with the correct parameters
                    expect(Tracking.marks.stop).toHaveBeenCalledWith(args[0], args[1]);
                });

                it('returns a "stop" function with the same parameters passed in (null overrides)', function() {
                    var args = ['name', {custom: 'value'}],
                        stopFn;

                    // Setup some spies
                    //
                    // Ignore any setup by ignoring set()
                    spyOn(Tracking.marks, 'set').and.returnValue(null);
                    //
                    // Need to spy on stop() to be sure it is called
                    spyOn(Tracking.marks, 'stop');

                    // Get a reference to the stop function
                    stopFn = Tracking.marks.start.apply(null, args);

                    // Check the type of the stop function
                    expect(stopFn).toEqual(jasmine.any(Function));

                    // Execute the stop function
                    stopFn(null);

                    // Check that Tracking.marks.stop was called with the correct parameters
                    expect(Tracking.marks.stop).toHaveBeenCalledWith(args[0], args[1]);
                });

                it('returns a "stop" function with the same parameters passed in (empty overrides)', function() {
                    var args = ['name', {custom: 'value'}],
                        stopFn;

                    // Setup some spies
                    //
                    // Ignore any setup by ignoring set()
                    spyOn(Tracking.marks, 'set').and.returnValue(null);
                    //
                    // Need to spy on stop() to be sure it is called
                    spyOn(Tracking.marks, 'stop');

                    // Get a reference to the stop function
                    stopFn = Tracking.marks.start.apply(null, args);

                    // Check the type of the stop function
                    expect(stopFn).toEqual(jasmine.any(Function));

                    // Execute the stop function
                    stopFn({});

                    // Check that Tracking.marks.stop was called with the correct parameters
                    expect(Tracking.marks.stop).toHaveBeenCalledWith(args[0], args[1]);
                });

                it('returns a "stop" function with the same parameters passed in (additional overrides)', function() {
                    var name = 'name',
                        data = {custom: 'value'},
                        overrideData = {override: 'otherValue'},
                        combinedData = {
                            custom: 'value',
                            override: 'otherValue'
                        },
                        stopFn;

                    // Setup some spies
                    //
                    // Ignore any setup by ignoring set()
                    spyOn(Tracking.marks, 'set').and.returnValue(null);
                    //
                    // Need to spy on stop() to be sure it is called
                    spyOn(Tracking.marks, 'stop');

                    // Get a reference to the stop function
                    stopFn = Tracking.marks.start.apply(null, [name, data]);

                    // Check the type of the stop function
                    expect(stopFn).toEqual(jasmine.any(Function));

                    // Execute the stop function
                    stopFn(overrideData);

                    // Check that Tracking.marks.stop was called with the correct parameters
                    expect(Tracking.marks.stop).toHaveBeenCalledWith(name, combinedData);
                });

                it('returns a "stop" function with the same parameters passed in (proper overrides)', function() {
                    var name = 'name',
                        data = {custom: 'value'},
                        overrideData = {custom: 'otherValue'},
                        combinedData = {
                            custom: 'otherValue'
                        },
                        stopFn;

                    // Setup some spies
                    //
                    // Ignore any setup by ignoring set()
                    spyOn(Tracking.marks, 'set').and.returnValue(null);
                    //
                    // Need to spy on stop() to be sure it is called
                    spyOn(Tracking.marks, 'stop');

                    // Get a reference to the stop function
                    stopFn = Tracking.marks.start.apply(null, [name, data]);

                    // Check the type of the stop function
                    expect(stopFn).toEqual(jasmine.any(Function));

                    // Execute the stop function
                    stopFn(overrideData);

                    // Check that Tracking.marks.stop was called with the correct parameters
                    expect(Tracking.marks.stop).toHaveBeenCalledWith(name, combinedData);
                });

                it('returns a "stop" function with the same parameters passed in (undefined override values)', function() {
                    var name = 'name',
                        data = {custom: 'value'},
                        overrideData = {custom: undefined},
                        combinedData = {
                            custom: undefined
                        },
                        stopFn;

                    // Setup some spies
                    //
                    // Ignore any setup by ignoring set()
                    spyOn(Tracking.marks, 'set').and.returnValue(null);
                    //
                    // Need to spy on stop() to be sure it is called
                    spyOn(Tracking.marks, 'stop');

                    // Get a reference to the stop function
                    stopFn = Tracking.marks.start.apply(null, [name, data]);

                    // Check the type of the stop function
                    expect(stopFn).toEqual(jasmine.any(Function));

                    // Execute the stop function
                    stopFn(overrideData);

                    // Check that Tracking.marks.stop was called with the correct parameters
                    expect(Tracking.marks.stop).toHaveBeenCalledWith(name, combinedData);
                });

            });

        });

        describe('stop', function() {

            it('calls set with "Stop: " prepending the mark name', function() {
                var args = ['name', {custom: 'value'}, true];
                spyOn(Tracking.marks, 'set');
                Tracking.marks.stop.apply(null, args);
                expect(Tracking.marks.set).toHaveBeenCalledWith('Stop: ' + args[0], args[1]);
            });

            it('calls measure with appropriate arguments', function() {
                var args = ['name', {custom: 'value'}, true];
                spyOn(Tracking.marks, 'set');
                spyOn(Tracking.marks, 'measure');
                Tracking.marks.stop.apply(null, args);
                expect(Tracking.marks.measure).toHaveBeenCalledWith(
                    args[0], 'Start: ' + args[0], 'Stop: ' + args[0], {custom: 'value'}, args[2]
                );
            });

        });

        describe('measure', function() {

            beforeEach(function() {
                /* jshint -W117 */
                window.performance = window.performance || {};
                window.performance.measure = window.performance.measure || function nop(){};
                spyOn(window.performance, 'measure');
            });

            it('throws if empty or non-string provided for name', function() {
                [
                    undefined,
                    null,
                    '',
                    NaN,
                    new Date()
                ].forEach(function(value) {
                    expect(function() {
                        Tracking.marks.measure(value);
                    }).toThrowError('Parameter `name` is required.');
                });
            });

            it('uses navigationStart if start name not specified', function() {
                var navMark = Tracking.marks.getMarks()[0];
                this.expectInfo({ label: 'stop' });
                this.expectInfo({ start: navMark.stop });
                Tracking.marks.set('stop');
                Tracking.marks.measure('nav to stop', null, 'stop');
            });

            it('uses current time if stop name not specified', function() {
                var before = Date.now(),
                    remove = Tracking.collectors.add({
                        collect: function(info) {
                            expect(info.start).toBeLessThan(info.stop);
                            expect(info.stop).not.toBeLessThan(before);
                        }
                    });
                this.expectInfo({});
                Tracking.marks.measure('nav to now', 'navigationStart');
                remove();
            });

            it('uses navigationStart and current time if names not specified', function() {
                var now = Date.now(),
                    navStart = Tracking.marks.getMarks()[0],
                    remove = Tracking.collectors.add({
                        collect: function(info) {
                            expect(info.start).toBe(navStart.stop);
                            expect(info.stop).not.toBeLessThan(now);
                            expect(info.start).not.toBeGreaterThan(info.stop);
                        }
                    });
                this.expectInfo({label: 'nav to now'});
                Tracking.marks.measure('nav to now');
                remove();
            });

            it('does not persist if stop mark does not exist', function() {
                this.expectInfo({label: 'start'});
                Tracking.marks.set('start');
                Tracking.marks.measure('no collections expected', 'start', 'stop');
            });

            it('does not persist if start mark does not exist', function() {
                this.expectInfo({label: 'stop'});
                Tracking.marks.set('stop');
                Tracking.marks.measure('no collections expected', 'start', 'stop');
            });

            it('does not persist if both start and stop marks do not exist', function() {
                Tracking.marks.measure('no collections expected', 'start', 'stop');
            });

            it('uses last mark when multiple with same name exist', function() {

                this.expectInfo({label: 'start', count: 1});
                this.expectInfo({label: 'stop', count: 1});
                this.expectInfo({label: 'start', count: 2});
                this.expectInfo({label: 'stop', count: 2});

                Tracking.marks.set('start');
                Tracking.marks.set('stop');
                Tracking.marks.set('start');
                Tracking.marks.set('stop');

                // fuzzy matching for Phantom; we can't use
                // the mock clock because Stopwatch is created
                // before the mock clock can be installed
                function withinDelta(expected, actual, amount) {
                    return actual >= expected - amount &&
                        actual <= expected + amount;
                }

                var remove = Tracking.collectors.add({
                    collect: function(info) {
                        var marks = Tracking.marks.getMarks(),
                            lastStart = marks[marks.length - 2],
                            lastStop = marks[marks.length - 1];
                        expect(marks.length).toBe(5);
                        expect(withinDelta(info.start, lastStart.stop, 5)).toBe(true);
                        expect(withinDelta(info.stop, lastStop.stop, 5)).toBe(true);
                        remove();
                    }
                });

                this.expectInfo({label: 'measure'});
                Tracking.marks.measure('measure', 'start', 'stop');

            });

            it('correctly pairs out-of-sequence marks', function(done) {

                function setter(label) {
                    return function timeout() {
                        Tracking.marks.set(label);
                    }
                }

                this.expectInfo({label: 'start', count: 1});
                this.expectInfo({label: 'stop', count: 1});
                this.expectInfo({label: 'start', count: 2});
                this.expectInfo({label: 'measure'});

                setTimeout(setter('start'), 10);
                setTimeout(setter('stop'),  20);
                setTimeout(setter('start'), 30);

                setTimeout(function verify() {
                    Tracking.marks.measure('measure', 'start', 'stop');
                    expect(Tracking.marks.getMeasures('measure')[0].duration).toBeGreaterThan(0);
                    done();
                }, 40);

            });

            it('correctly pairs out-of-sequence marks', function(done) {

                function setter(label) {
                    return function timeout() {
                        Tracking.marks.set(label);
                    }
                }

                this.expectInfo({label: 'stop', count: 1});
                this.expectInfo({label: 'start', count: 1});
                this.expectInfo({label: 'stop', count: 2});
                this.expectInfo({label: 'measure'});

                setTimeout(setter('stop'), 10);
                setTimeout(setter('start'),  20);
                setTimeout(setter('stop'), 30);

                setTimeout(function verify() {
                    Tracking.marks.measure('measure', 'start', 'stop');
                    expect(Tracking.marks.getMeasures('measure')[0].duration).toBeGreaterThan(0);
                    done();
                }, 40);

            });

            it('auto-increases count based on measure name', function() {
                this.expectInfo({count: 1});
                this.expectInfo({count: 2});
                this.expectInfo({count: 3});
                Tracking.marks.measure('measure');
                Tracking.marks.measure('measure');
                Tracking.marks.measure('measure');
            });

            it('adds POJO measure to internal collection', function() {
                this.expectInfo({});
                expect(Tracking.marks.getMeasures()).toEqual([]);
                Tracking.marks.measure('measure', null, null, {hello: 'world'});
                expect(Tracking.marks.getMeasures().length).toBe(1);
                expect(Tracking.marks.getMeasures()[0].data.hello).toBe('world');
            });

            it('calls down to window.performance.measure', function() {
                this.expectInfo({});
                /* jshint -W117 */
                expect(window.performance.measure).not.toHaveBeenCalled();
                Tracking.marks.measure('nav start to now');
                expect(window.performance.measure).toHaveBeenCalled();
            });

            it('adds custom data if provided', function() {
                var remove = Tracking.collectors.add({
                    collect: function(info) {
                        expect(info.data.hello).toBe('world');
                    }
                });
                this.expectInfo({label: 'measure'});
                Tracking.marks.measure('measure', null, null, {hello: 'world'});
                remove();
            });

            it('includes between marks as children if requested', function() {

                jasmine.clock().install();

                this.expectInfo({label: 'first'});
                Tracking.marks.set('first');

                jasmine.clock().tick(20);
                this.expectInfo({label: 'second'});
                Tracking.marks.set('second');

                jasmine.clock().tick(20);
                this.expectInfo({label: 'third'});
                Tracking.marks.set('third');

                var remove = Tracking.collectors.add({
                    collect: function(info) {
                        expect(info.children.length).toBe(3);
                        expect(info.children[0].label).toBe('first');
                        expect(info.children[1].label).toBe('second');
                        expect(info.children[2].label).toBe('third');
                    }
                });

                this.expectInfo({label: 'all'});
                Tracking.marks.measure('all', 'first', 'third', null, true);

                remove();
                jasmine.clock().uninstall();

            });

        });

        ['clearMeasures', 'clearMarks'].forEach(function(method) {

            describe(method, function() {

                it('throws if defined non-string, non-RegExp specified', function() {
                    [
                        123,
                        null,
                        new Date(),
                        {}
                    ].forEach(function(rx) {
                        expect(function() {
                            Tracking.marks[method](rx);
                        }).toThrowError('Regular expression or string expected.');
                    });
                });

                it('converts strings into regular expressions', function() {
                    [
                        '',
                        'hello',
                        '.+?',
                        '^^',
                        '^$'
                    ].forEach(function(rx) {
                        expect(function() {
                            Tracking.marks[method](rx);
                        }).not.toThrow();
                    });
                });

                it('removes matching entries', function() {
                    this.expectInfo({});
                    this.expectInfo({});
                    this.expectInfo({});
                    Tracking.marks.set('special mark 1');
                    Tracking.marks.set('special mark 2');
                    Tracking.marks.measure('special measure', 'special mark 1', 'special mark 2');
                    expect(Tracking.marks.getMarks().length).toBe(3);
                    expect(Tracking.marks.getMeasures().length).toBe(1);
                    Tracking.marks.clearMarks(/^special/);
                    expect(Tracking.marks.getMarks().length).toBe(1);
                    expect(Tracking.marks.getMeasures().length).toBe(1);
                    Tracking.marks.clearMeasures('special measure');
                    expect(Tracking.marks.getMarks().length).toBe(1);
                    expect(Tracking.marks.getMeasures().length).toBe(0);
                });

                it('removes all entries but navigationStart if called with no parameters', function() {
                    this.expectInfo({});
                    this.expectInfo({});
                    Tracking.marks.set('mark');
                    Tracking.marks.measure('mark');
                    expect(Tracking.marks.getMarks().length).toBe(2);
                    expect(Tracking.marks.getMeasures().length).toBe(1);
                    expect(Tracking.marks.getMarks()[0].label).toBe('navigationStart');
                    Tracking.marks.clearMarks();
                    Tracking.marks.clearMeasures();
                    expect(Tracking.marks.getMarks().length).toBe(1);
                    expect(Tracking.marks.getMeasures().length).toBe(0);
                    expect(Tracking.marks.getMarks()[0].label).toBe('navigationStart');
                });

                it('does nothing if no entries match', function() {
                    this.expectInfo({});
                    this.expectInfo({});
                    Tracking.marks.set('mark');
                    Tracking.marks.measure('measure');
                    var beforeMarks = Tracking.marks.getMarks(),
                        beforeMeasures = Tracking.marks.getMeasures();
                    Tracking.marks.clearMarks('nope');
                    Tracking.marks.clearMeasures('nope');
                    expect(Tracking.marks.getMarks()).toEqual(beforeMarks);
                    expect(Tracking.marks.getMeasures()).toEqual(beforeMeasures);
                });

            });

        });

        describe('clearMarks', function() {

            it('does not remove "navigationStart" mark', function() {
                var before = Tracking.marks.getMarks();
                expect(before[0].label).toBe('navigationStart');
                Tracking.marks.clearMarks('navigationStart');
                expect(Tracking.marks.getMarks()).toEqual(before);
            });

        });

        describe('getMarks', function() {

            it('contains navigationStart initially', function() {
                var marks = Tracking.marks.getMarks();
                expect(marks.length).toBe(1);
                expect(marks[0].label).toBe('navigationStart');
            });

            it('returns shallow clone of internal marks collection', function() {
                var first = Tracking.marks.getMarks(),
                    second = Tracking.marks.getMarks();
                expect(first).not.toBe(second);
                expect(first).toEqual(second);
            });

        });

        describe('getMeasures', function() {

            it('returns empty array initially', function() {
                expect(Tracking.marks.getMeasures()).toEqual([]);
            });

            it('returns shallow clone of internal marks collection', function() {
                var first = Tracking.marks.getMeasures(),
                    second = Tracking.marks.getMeasures();
                expect(first).not.toBe(second);
                expect(first).toEqual(second);
            });

        });

    });

});
