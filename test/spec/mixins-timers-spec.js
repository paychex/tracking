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

            it('throws if empty or non-string provided for name');
            it('returns Timer instance');
            it('returns distinct instance for same Timer name');
            it('Timer instance has appropriate properties');

        });

        describe('Timer', function() {

            it('has correct States static property values');

            describe('start', function() {

                it('throws if already started');
                it('calls reset method');
                it('sets startTime to current epoch time');
                it('sets state to STARTED');

            });

            describe('stop', function() {

                it('throws if not started');
                it('throws if any children are not stopped');
                it('sets stopTime to current epoch time');
                it('sets state to STOPPED');
                it('auto-increases count by timer name');
                it('does not persist if parent timer exists');
                it('persists when no parent timer exists');

            });

            describe('add', function() {

                it('creates child with parent/child name');
                it('sets parent/child relationship');
                it('returns newly created child');

            });

            describe('remove', function() {

                it('accepts string name');
                it('accepts Timer instance');
                it('returns undefined if child not found');
                it('returns child if found');
                it('removes parent/child relationship');

            });

            describe('reset', function() {

                it('deletes data, startTime, and stopTime properties');
                it('sets state to PENDING');

            });

        });

    });

});
