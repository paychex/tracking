/* global define: false */

define(['TrackingInfo'], function(TrackingInfo) {

    'use strict';

    /* jshint jasmine: true */

    describe('TrackingInfo', function() {

        it('returns new instance if invoked directly');
        it('creates a random UUID');
        it('sets appropriate default values');
        it('uses data for values not provided directly');
        it('overwrites direct values with data values');
        it('calculates duration instead of using direct value');
        it('converts children into TrackingInfo instances');
        it('removes data values used for built-in members');
        it('freezes non-reference members');

    });

});
