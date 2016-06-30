define([], function() {

    'use strict';

    function getRandomValues(count) {
        var rands, d;
        if (window.crypto && window.crypto.getRandomValues) {
            rands = new Uint8Array(count);
            window.crypto.getRandomValues(rands);
        } else {
            rands = new Array(count);
            d = new Date().getTime();
            while (count--) {
                rands[count] = (d + Math.random() * 16) & 15;
            }
        }
        return rands;
    }

    return function generateUUID() {
        var values = getRandomValues(36);
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, function(c, i) {
                var r = values[i] & 15;
                return (c === 'x' ? r : (r & 0x3|0x8)).toString(16);
            });
    };

});
