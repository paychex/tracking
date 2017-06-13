/* global define: false */

define(['Tracking', '../TestCollector'], function(Tracking, TestCollector) {

    'use strict';

    /* jshint jasmine: true */

    describe('mixins/Errors', function() {

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
            Tracking.collectors.reset();
        });

        describe('log', function() {

            it('throws if non-Error provided', function() {
                [null, undefined, 'abc', 123, /rx/, new Date(), {}, Function.prototype].forEach(function(value) {
                    expect(Tracking.errors.log.bind(null, value))
                        .toThrowError('An Error instance must be specified.');
                });
            });

            it('creates "error" TrackingInfo instance', function() {
                this.collector.expectTrackingInfo({type: 'error'});
                Tracking.errors.log(Error('error message'));
            });

            it('has error prototype members', function() {
                var err = new TypeError('error message');
                this.collector.expectTrackingInfo(function verify(info) {
                    expect(info.data.name).toBe('TypeError');
                    expect(info.data.message).toBe('error message');
                    expect('stack' in info.data).toBe(true);
                });
                Tracking.errors.log(err);
            });

        });

    });

});
