(function() {

    'use strict';

    var isTest = function isTest(uri) {
            return uri.match(/\-spec\.js/);
        },

        makeRelative = function relative(uri) {
            return uri.replace(/^\/base/, '..').replace(/\.js$/, '');
        },

        specs = Object
            .keys(window.__karma__.files)
            .filter(isTest)
            .map(makeRelative);

    if (!!specs.length) {

        console.debug('tests:');
        specs.forEach(function(spec) {
            console.debug('\t' + spec);
        });

        Function.prototype.bind = Function.prototype.bind || function bind(context) {
            var fn = this,
                args = [].slice.call(arguments, 1);
            return function fnBound() {
                return fn.apply(context, args.concat([].slice.call(arguments)));
            };
        };

        requirejs.config({
            baseUrl: '/base/src',
            paths: {},
            deps: specs,
            callback: window.__karma__.start
        });

    }

}());
