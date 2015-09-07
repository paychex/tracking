/* global define: false */

define(['TrackingInfo'], function(TrackingInfo) {

    'use strict';

    /* jshint jasmine: true */

    describe('TrackingInfo', function() {

        it('returns new instance if invoked directly', function() {
            /* jshint -W064 */
            expect(TrackingInfo({}) instanceof TrackingInfo).toBe(true);
        });

        it('creates a random UUID', function() {
            var uuid1 = new TrackingInfo({}).id,
                uuid2 = new TrackingInfo({}).id,
                rxUID = /^[0-9a-f]{8}\-[0-9a-f]{4}\-4[0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}$/i;
            expect(uuid1).toMatch(rxUID);
            expect(uuid2).toMatch(rxUID);
            expect(uuid1).not.toBe(uuid2);
        });

        it('sets appropriate default values', function() {
            var info = new TrackingInfo({});
            expect(info.data).toEqual({});
            expect(info.tags).toEqual([]);
            expect(info.count).toBe(1);
            expect(info.type).toBe('unknown');
            expect(typeof info.start).toBe('number');
            expect(typeof info.stop).toBe('number');
            expect(typeof info.duration).toBe('number');
            expect(info.start).toBeGreaterThan(0);
            expect(info.stop).toBeGreaterThan(0);
            expect(info.duration).not.toBeLessThan(0);
            expect(info.label).toBe(undefined);
            expect(info.action).toBe(undefined);
            expect(info.category).toBe(undefined);
            expect(info.variable).toBe(undefined);
            expect(info.children).toEqual([]);
        });

        it('uses values provided directly', function() {
            var values = {
                    label: 'label',
                    start: 15,
                    stop: 20,
                    count: 2,
                    tags: ['a', 'b']
                },
                info = new TrackingInfo(values);
            expect(info.label).toBe(values.label);
            expect(info.start).toBe(values.start);
            expect(info.stop).toBe(values.stop);
            expect(info.count).toBe(values.count);
            expect(info.tags).toEqual(values.tags);
        });

        it('uses data for values not provided directly', function() {
            var values = {
                    data: {
                        label: 'label',
                        tags: ['a', 'b'],
                        id: 'hello'
                    }
                },
                info = new TrackingInfo(values);
            expect(info.label).toBe(values.data.label);
            expect(info.tags).toEqual(values.data.tags);
            expect(info.id).toBe(values.data.id);
        });

        it('overwrites direct values with data values', function() {
            var values = {
                    label: 'hello',
                    tags: ['c', 'd'],
                    data: {
                        label: 'label',
                        tags: ['a', 'b'],
                        id: 'hello'
                    }
                },
                info = new TrackingInfo(values);
            expect(info.label).toBe(values.data.label);
            expect(info.tags).toEqual(values.data.tags);
            expect(info.id).toBe(values.data.id);
        });

        it('calculates duration instead of using direct value', function() {
            var info = new TrackingInfo({
                start: 40,
                stop: 60,
                duration: 10
            });
            expect(info.duration).toBe(20);
        });

        it('converts children into TrackingInfo instances', function() {
            var info = new TrackingInfo({
                children: [
                    {label: 'child 1'},
                    {label: 'child 2'}
                ]
            });
            expect(info.children.length).toBe(2);
            expect(info.children[0] instanceof TrackingInfo).toBe(true);
            expect(info.children[1] instanceof TrackingInfo).toBe(true);
            expect(info.children[0].label).toBe('child 1');
            expect(info.children[1].label).toBe('child 2');
        });

        it('removes data values used for built-in members', function() {
            var values = {
                    label: 'hello',
                    tags: ['c', 'd'],
                    data: {
                        label: 'label',
                        tags: ['a', 'b'],
                        custom: 'hello'
                    }
                },
                info = new TrackingInfo(values);
            expect(info.data.tags).toBe(undefined);
            expect(info.data.label).toBe(undefined);
            expect(info.data.custom).toBe('hello');
        });

        it('freezes non-reference members', function() {
            var info = new TrackingInfo({});
            expect(Object.isFrozen(info)).toBe(true);
            expect(Object.isFrozen(info.tags)).toBe(false);
            expect(Object.isFrozen(info.data)).toBe(false);
            expect(Object.isFrozen(info.children)).toBe(false);
        });

    });

});
