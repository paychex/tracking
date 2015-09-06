/* global define: false */

define(['Tracking', '../TestCollector'], function(Tracking, TestCollector) {

    'use strict';

    /* jshint jasmine: true */

    function getContexts(page, app, screen) {
        return {
            page: page || 'not set',
            app: app || 'not set',
            screen: screen || 'not set'
        };
    }

    function getMetrics(page, app, screen) {
        return {
            page: page || {},
            app: app || {},
            screen: screen || {}
        };
    }

    function getData(context, metrics, dimensions) {
        return {
            context: context || getContexts(),
            metrics: metrics || getMetrics(),
            dimensions: dimensions || {}
        };
    }

    function setDimension(name, value) {
        /* jshint -W040 */
        this.expectInfo({
            type: 'dimension',
            label: name,
            variable: value === undefined || value === null ?
                '' : value.toString()
        });
        Tracking.static.setDimension(name, value);
    }

    function setContext(type, name) {
        /* jshint -W040 */
        this.expectInfo({
            type: 'context',
            label: name,
            category: type
        });
        Tracking.static.setContext(type, name);
    }

    function setMetric(type, name, value) {
        /* jshint -W040 */
        this.expectInfo({
            type: 'metric',
            label: name,
            category: type,
            variable: value === undefined || value === null ? '' : value
        });
        Tracking.static.setMetric(type, name, value);
    }

    describe('mixins/Static', function() {

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
            Tracking.static.reset();
            Tracking.collectors.disable();
        });

        describe('setDimension', function() {

            it('sends "dimension" type TrackingInfo', function() {
                setDimension.call(this, 'dim0', 'value');
            });

            it('undefined removes previously set dimensions', function() {
                setDimension.call(this, 'dim0', 'value');
                this.expectInfo({
                    type: 'metric',
                    label: 'metric0',
                    variable: 'metric value',
                    data: getData(undefined, getMetrics({metric0: 'metric value'}), {dim0: 'value'})
                });
                this.expectInfo({
                    type: 'dimension',
                    label: 'dim0',
                    variable: '',
                    data: getData(undefined, getMetrics({metric0: 'metric value'}))
                });
                Tracking.static.setMetric('page', 'metric0', 'metric value');
                Tracking.static.setDimension('dim0');
            });

            it('empty string removes previously set dimensions', function() {
                setDimension.call(this, 'dim0', 'value');
                this.expectInfo({
                    type: 'metric',
                    label: 'metric0',
                    variable: 'metric value',
                    data: getData(undefined, getMetrics({metric0: 'metric value'}), {dim0: 'value'})
                });
                this.expectInfo({
                    type: 'dimension',
                    label: 'dim0',
                    variable: '',
                    data: getData(undefined, getMetrics({metric0: 'metric value'}))
                });
                Tracking.static.setMetric('page', 'metric0', 'metric value');
                Tracking.static.setDimension('dim0', '');
            });

            it('adds dimensions to subsequent TrackingInfo instances', function() {
                setDimension.call(this, 'dim1', 'value 1');
                setDimension.call(this, 'dim2', 'value 2');
                var dimensions = {
                    dim1: 'value 1',
                    dim2: 'value 2'
                };
                this.expectInfo({
                    type: 'metric',
                    label: 'metric0',
                    variable: 'met value',
                    data: getData(
                        undefined,
                        getMetrics({metric0: 'met value'}),
                        dimensions
                    )
                });
                this.expectInfo({
                    type: 'context',
                    category: 'app',
                    label: 'app context',
                    data: getData(
                        getContexts(undefined, 'app context'),
                        getMetrics({metric0: 'met value'}),
                        dimensions
                    )
                });
                Tracking.static.setMetric('page', 'metric0', 'met value');
                Tracking.static.setContext('app', 'app context');
            });

        });

        describe('setContext', function() {

            it('sends "context" type TrackingInfo', function() {
                setContext.call(this, 'page', 'page context');
            });

            it('calls unsetContext', function() {
                spyOn(Tracking.static, 'unsetContext');
                setContext.call(this, 'page', 'new page context');
                expect(Tracking.static.unsetContext).toHaveBeenCalledWith('page');
            });

            it('adds context to subsequent TrackingInfo instances', function() {
                setContext.call(this, 'page', 'another page');
                this.expectInfo({
                    type: 'metric',
                    label: 'metric1',
                    variable: 200,
                    data: getData(
                        getContexts('another page'),
                        getMetrics(undefined, undefined, {metric1: 200})
                    )
                });
                Tracking.static.setMetric('screen', 'metric1', 200);
            });

        });

        describe('unsetContext', function() {

            it('sets context back to "not set"', function() {
                setContext.call(this, 'app', 'app name');
                Tracking.static.unsetContext('app');
                this.expectInfo({
                    data: getData(
                        getContexts(undefined, 'not set'),
                        getMetrics(undefined, undefined, {metric: 'value'})
                    )
                });
                Tracking.static.setMetric('screen', 'metric', 'value');
            });

            it('removes metrics for context', function() {
                setContext.call(this, 'page', 'test page');
                setMetric.call(this, 'page', 'custom-metric', 'val');
                this.expectInfo({
                    type: 'metric',
                    category: 'page',
                    label: 'custom-metric',
                    variable: '',
                    data: getData()
                });
                Tracking.static.unsetContext('page');
            });

            it('unsets "lower" contexts', function() {
                setContext.call(this, 'app', 'test app');
                setMetric.call(this, 'app', 'app-metric', 'val');
                setMetric.call(this, 'screen', 'screen-metric', 'val');
                this.expectInfo({
                    type: 'metric',
                    category: 'app',
                    label: 'app-metric',
                    variable: '',
                    data: getData(
                        getContexts(),
                        getMetrics(
                            undefined,
                            undefined,
                            {'screen-metric': 'val'}
                        )
                    )
                });
                this.expectInfo({
                    type: 'metric',
                    category: 'screen',
                    label: 'screen-metric',
                    variable: '',
                    data: getData()
                });
                Tracking.static.unsetContext('page');
            });

            it('does not unset other custom contexts', function() {
                setContext.call(this, 'dialog', 'help');
                setContext.call(this, 'wizard', 'intro');
                setMetric.call(this, 'dialog', 'num-topics', 5);
                setMetric.call(this, 'wizard', 'num-pages', 2);
                this.expectInfo({
                    data: getData({
                        page: 'not set',
                        app: 'not set',
                        screen: 'not set',
                        dialog: 'help'
                    }, {
                        page: {},
                        app: {},
                        screen: {},
                        dialog: {
                            'num-topics': 5
                        }
                    })
                });
                Tracking.static.unsetContext('wizard');
            });

        });

        describe('setMetric', function() {

            it('sends "metric" type TrackingInfo', function() {
                setMetric.call(this, 'app', 'login-date', new Date());
            });

            it('undefined removes previously set metric', function() {
                setMetric.call(this, 'screen', 'item count', 5);
                setMetric.call(this, 'screen', 'item count');
                this.expectInfo({
                    type: 'context',
                    category: 'custom',
                    data: getData({
                        page: 'not set',
                        app: 'not set',
                        screen: 'not set',
                        custom: 'my-custom-context'
                    })
                });
                Tracking.static.setContext('custom', 'my-custom-context');
            });

            it('empty string removes previously set metric', function() {
                setMetric.call(this, 'screen', 'item count', 5);
                setMetric.call(this, 'screen', 'item count', '');
                this.expectInfo({
                    type: 'context',
                    category: 'custom',
                    data: getData({
                        page: 'not set',
                        app: 'not set',
                        screen: 'not set',
                        custom: 'my-custom-context'
                    })
                });
                Tracking.static.setContext('custom', 'my-custom-context');
            });

            it('adds metric to subsequent TrackingInfo instances', function() {
                setMetric.call(this, 'page', 'item count', 5);
                this.expectInfo({
                    type: 'context',
                    category: 'app',
                    label: 'my-app-context',
                    data: getData(
                        getContexts(undefined, 'my-app-context'),
                        getMetrics({'item count': 5})
                    )
                });
                Tracking.static.setContext('app', 'my-app-context');
            });

        });

    });

});
