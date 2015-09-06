define([], function() {

    'use strict';

    function TestCollector() {
        this.expected = [];
    }

    TestCollector.prototype.collect = function collect(info) {
        var expected = this.expected.shift();
        if (!expected) {
            throw new Error('No collections expected.');
        } else {
            for(var key in expected) {
                if (expected.hasOwnProperty(key)) {
                    expect(info[key]).toEqual(expected[key]);
                }
            }
        }
    };

    TestCollector.prototype.verifyNoOutstandingExpectations = function verify() {
        if (this.expected.length) {
            throw new Error('There were ' + this.expected.length + ' outstanding expectations.');
        }
    };

    TestCollector.prototype.expectTrackingInfo = function expect(info) {
        this.expected.push(info);
    };

    return TestCollector;

});
