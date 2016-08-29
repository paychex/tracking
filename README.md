## Tracking ##

The built-in HTML5 Tracking API includes marks, measures, and resource timing data. Unfortunately, the PerformanceEntry
class doesn't have all of the information you might want to accurately gauge performance throughout your application.
For example, it would be nice to break down your timing marks by category, or tag your measures with keywords for later
indexing.

In addition, because it is focused on performance and not user behavior, the HTML5 Tracking API has no built-in support
for event tracking, view contexts, or custom metrics and dimensions.

We wrote the Tracking library to be a single API that covers all of your user behavior and performance tracking needs.
More specifically, there are 7 analytics the Tracking library provides:

 1. tracking user behavior (user events)
 2. tracking errors (error events)
 3. segmenting analytics by context, metrics, and dimensions
 4. timing user-initiated transactions, with optional nesting (timers)
 5. timing specific points in the application lifecycle against a common baseline (marks)
 6. measuring the time between any 2 marks, with optional nested marks (measures)
 7. measuring download times for scripts, documents, css, and html (network timings)

All analytics follow a single consistent format, allowing you to specify optional categories, tags, variables, etc.
This metadata can be used in analysis packages to generate queries with incredible detail and focus.

Finally, all of this data can be persisted to any number of collectors you specify. A *collector* is simply a JavaScript
object with a 'collect' method that receives a single *TrackingInfo* object. The collector can apply filters so it only
processes analytics it cares about, and then convert that data into whatever format is required. We include a **Google
Analytics** collector you can either use immediately or examine before implementing one of your own.

In addition to collecting tracking data, we also provide the ability to *decorate* each TrackingInfo instance. This
lets you append additional, possibly conditional data, that you didn't want to specify as a custom metric or dimension.
Examples might include tagging all 'network' entries over 2 seconds in duration as 'long-running', or appending a user's
session id to the custom data field so it shows in log entries.

### Installation ###

To build the Tracking library, run `npm run-script build` from the command line.

At this point, you can open demo/index.html in a browser, open the developer console, and inspect the output. Output
should appear after about 10 seconds. Look in demo/main.js for sample code.

To include the Tracking library in your own applications, simply reference the built file:

```javascript
    require.config({
        paths: {
            Tracking: 'path/to/tracking'
        }
    });
```

Then you can inject the Tracking library using code like the following:

```javascript
    define(['Tracking'], function(Tracking) {
        Tracking.marks.set('script loaded', {label: 'my script name'});
    });
```

Or, for node:

```javascript
    var Tracking = require('path/to/tracking');
    Tracking.events.fire('script-load', {category: 'server'});
```

To run unit tests:

    npm run-script test
    npm run-script test-single-run

To generate documentation:

    npm run-script doc

Okay, now that you have the Tracking library in your code base, let's see how you can use it.

### Working with Collectors ###

Any object with a `collect` method can be registered as a tracking collector using the `collectors` API:

```javascript
    Tracking.collectors.add(collector:Object{collect:Function}) : Function
    
    var removeCollector = Tracking.collectors.add({
        collect: function collect(info) {
            console.log(info.toString());
        }
    });
```

We provide a Google Analytics collector for you. This collector will convert `TrackingInfo` instances into the correct
calls to the global `ga` method installed by the analytics.js script.

```html
    <script src="/path/to/analytics.js"></script>
    <script>
        Tracking.collectors.add(new GoogleAnalytics({network: false}));
    </script>
```

The GA collector we provide allows you to specify custom "off switches" to turn off the collection of specific tracking
data types. In the example above, we disable tracking network timings (i.e., resource downloads such as scripts, CSS,
and PDF files).

You can create your own collectors easily. Just provide a method called `collect` that takes a TrackingInfo instance
as its sole argument. See the code for our GoogleAnalytics collector for an example of how you might implement your own
collector.

### Decorating TrackingInfo Instances ###

The moment a TrackingInfo instance is created, you have an opportunity to decorate it by appending custom
tags and data. Whereas custom metrics and dimensions are added to *all* TrackingInfo instances, decorating can be
conditional. For example:

```javascript
    // tag all network requests over 2 seconds as long-running:
    var removeDecorator = Tracking.collectors.decorate(function myDecorator(info) {
        if (info.type === 'network' && info.duration >= 2000) {
            info.tags.push('long-running'); // so we can query "long-running" in our analysis package
        }
    });
```

This flexibility enables you to easily construct helpful queries in your analysis tools by placing your conditional
logic in the UI instead of the back-end.

### Creating Child Tracking Instances ###

You can also create nested collectors and decorators. To do this, simply call the `createChild` method on your
Tracking instance, then use the collector methods as usual:

```javascript
    Tracking.collectors.decorate(function parentDecorator(info) {
        info.data.fromParent = true;
    });
    var child = Tracking.createChild();
    child.collectors.decorate(function childDecorator(info) {
        info.data.fromChild = true;
    });
    // will be decorated with BOTH the fromParent and fromChild properties:
    child.events.fire('test-event');
```

Collectors can also be nested. If you want a child Tracking instance to have its own *extra* set of collectors,
you can add them directly to that instance:

```javascript
    var child = Tracking.createChild();
    child.collectors.add({collect: function collect(info) {
        // custom child-specific collection logic here
    }});
```

---

Okay, now let's look at the fun stuff: how to use the Tracking API to track various analytics.

### Tracking User Behavior ###

User behavior is best tracked using *events*. Events help determine how users interact with your application. At its
core, an event is just an action plus any optional data you wish to associate with that event:

```javascript
    Tracking.events.fire('action', {custom: 'data'});
```

Common custom data you might wish to associate with an event include *category* and *label*:

```javascript
    Tracking.events.fire('click', {
        category: 'navigation',
        label: 'open sidebar'
    });
```

In addition to cateogry and label, you may find it useful to *tag* your events with additional information. One useful
event tag is the type of UI element that generated the event (e.g. "button", "menu", "checkbox"):

```javascript
    Tracking.events.fire('click', {
        category: 'navigation',
        label: 'open sidebar',
        tags: ['button']
    });
```

But you aren't limited to the built-in DOM events. For example, if the user is closing a dialog, you may want to call
that out as a unique event type:

```javascript
    $dialog.keypress(function keyPressHandler(e) {
        if (e.which === Keys.ESCAPE) {
            $dialog.close();
            e.stopPropagation();
            Tracking.events.fire('dialogClosed', {
                category: 'dialog',
                label: 'cancel',
                tags: ['keypress']
            });
        }
    });
```

### Tracking Errors ###

It's important to know when an error occurs in your application. The primary reason the Tracking library was created
was to support the diagnosing of performance and error-related issues. Sending these errors to your collectors enables
your analysts to track down potential root causes.

Accordingly, sending errors is incredibly easy:

```javascript
    try {
        someMethodCall();
    } catch (e) {
        Tracking.errors.log(e);
    }
```

To log all *unhandled* errors, use this code:

```javascript
    window.onerror = function uncaughtError(msg, url, line, col, ex) {
        Tracking.errors.log(ex, {
            url: url
        });
        return true; // prevent default handling
    };
```

### Collecting Context-Specific Data ###

#### Contexts ####

Events and errors don't tell you much in isolation. The key to really understanding your users is *context*. In the
Tracking library, there are 3 built-in levels of context (but you can also create any number of custom contexts).

The 3 built-in contexts form a hierarchy: `page > app > screen`.

A **page context** refers to the current page of your web application. In a traditional web app, it would be the current
URL. In a single-page application (SPA), this *might* be the top-level route, unless that route is to a sub-application,
in which case your page context would just be your site name.

You can think of an **app context** as just a collection of **screen contexts**. A screen context is an area of your
application that groups related functionalities together. In a basic TODO application, example screens might include the
"list" screen and the "edit" screen.

```javascript
    // Sample contexts for a TODO app:
    Tracking.static.setContext('page', '/');
    Tracking.static.setContext('app', 'My TODO App', {appVersion: '1.0.0'});
    
    myRouter.on('navigate', function(e) {
        // e.page might be 'index' or 'edit':
        Tracking.static.setContext('screen', e.page);
    });
```

Because the built-in contexts are hierarchical, changing the "page" context will clear the "app" and "screen" contexts
automatically. Changing the "app" context will **not** clear the "page" context but **will** clear the "screen" context.

It is up to you to ensure contexts are set appropriately in your application.

In addition to the built-in contexts, you can create any number of custom contexts which exist in parallel to the
top-level "page" context. These contexts are useful for global UI elements like dialog boxes, slideout panels,
top-sheets, wizards, and more.

```javascript
    Tracking.static.setContext('dialog', 'help');
    Tracking.static.setContext('panel', 'messages');
    Tracking.static.setContext('tour-wizard-step', 'intro');
```

Unlike the hierarchical built-in contexts, custom contexts must be un-set manually:

```javascript
    Tracking.static.unsetContext('dialog');
    Tracking.static.unsetContext('panel');
    Tracking.static.unsetContext('tour-wizard-step');
```

You can also retrieve any set contexts by specifying the context type:

```javascript
    Tracking.static.getContext('dialog'); // 'help'
    Tracking.static.getContext('panel'); // 'messages'
```

#### Metrics and Dimensions ####

There's a lot more to contexts than just tracking a user's flow through your application -- contexts can also have
*metrics* associated with them.

You can think of a metric as a data value that can be aggregated by context. For example:

```javascript
    Tracking.static.setMetric('page', 'visitCount', 5);
    Tracking.static.setMetric('app', 'errorCount', 0);
    Tracking.static.setMetric('screen', 'message count', 34);
```
    
Non-numeric values work just as well:

```javascript
    Tracking.static.setMetric('page', 'deviceType', 'phone');
    Tracking.static.setMetric('app', 'testGroup', 'minimal-ui');
    Tracking.static.setMetric('screen', '', Date.now());
```

Basically, anything that can be grouped or bucketed is useful as a metric.

Retrieve any set metrics by specifying the context type and metric name:

```javascript
    Tracking.static.getMetric('page', 'deviceType'); // 'phone'
    Tracking.static.getMetric('app', 'testGroup'); // 'minimal-ui'
```

Finally, **dimensions** are used to segment your users. You can have any number of dimensions you want, but best
practice is to segment based on marketing data:

```javascript
     Tracking.static.setDimension('region', 'northeast');
     Tracking.static.setDimension('support-level', 'gold');
     Tracking.static.setDimension('client-size', 'medium');
```

Unlike metrics, dimensions should be string values.

You can also retrieve any set dimensions by specifying the name:

```javascript
    Tracking.static.getDimension('region'); // 'northeast'
    Tracking.static.getDimension('support-level'); // 'gold'
```

Dimensions and metrics work together like a pivot table, where a dimension's values act like the column header and
a metric's values acting like rows:

<table>
    <caption>Error Counts by Support Level</caption>
    <thead>
        <th>Support Level</th>
        <th>Silver</th>
        <th>Gold</th>
        <th>Platinum</th>
    </thead>
    <tbody>
        <tr>
            <td>Error Count</td>
            <td>41</td>
            <td>23</td>
            <td>49</td>
        </tr>
    </tbody>
</table>

You can visualize the interplay of contexts, dimensions, and metrics using the following diagram:

    dimensions
    └ context: page
    │ └ page metrics
    │ └ context: app
    │   └ app metrics
    │   └ context: screen
    │     └ screen metrics
    └ context: custom-1
    │ └ custom-1 metrics
    └ context: custom-2
      └ custom-2 metrics

### Transactional Timing ###

It's important to measure long-running transactions in your application (such as performing
a search, loading a record, or saving changes). On occasion, a batch of transactions occur in
parallel or in sequence, and you want to know why the end-to-end transaction might be performing
poorly.

When you have asynchronous, potentially nested transactions, consider using timers:

```javascript
    var saveTimer = Tracking.timers.create('save-record');
    
    function saveCurrentRecord() {
        saveTimer.start();
        return RecordDataService.save(myRecord)
            .finally(function saveComplete() {
                saveTimer.stop({category: 'save', tags: ['record']});
            });
    }
```

Because transactions are sometimes nested, you can also nest timers:

```javascript
    var searchTimer = Tracking.timers.create('search');
    
    function performSearch(input) {
        searchTimer.start();
        return SearchService.findRecord(input)
            .then(function filterResults(results) {
                // create a child timer of search:
                var filterTimer = searchTimer.add('filter');
                return FilterService.process(results)
                    .finally(function filterComplete() {
                        filterTimer.stop();
                    });
            }).finally(function allDone() {
                searchTimer.stop();
            });
    }
```

With timers, a single tracking entry will be persisted when the top-most timer stops. Its `children`
array member will include any nested timers you created.

### Timing Specific Points in the Application Lifecycle Against a Common Baseline ###

If you want to see the *order* of important lifecycle events in your application, use marks. As
opposed to timers, marks have a single common baseline (the point at which the user navigated to your
site), so you can compare them against each other.

    navigationStart......mark1.....mark2................mark3..mark4..........mark5

You can clear all of the marks you've set at any time by calling `Tracking.marks.clearMarks()`. Or
you can pass a regular expression (or string pattern) to `clearMarks` to only clear particular marks.
This can be useful if you expect to be setting the same marks multiple times:

```javascript
    Tracking.marks.clearMarks(/open search/);
    Tracking.marks.start('open search');
    UIManager.loadPanel('search')
        .finally(function panelLoaded() {
            // calling start and stop with the same
            // name will automatically create a measure
            // with that name (see next section below)
            Tracking.marks.stop('open search');
        }).done();
```

### Measuring the Time Between Any 2 Marks, with Optional Nested Marks ###

Once you've set any 2 marks, you can measure the time between them by calling `Tracking.marks.measure`:

```javascript
    // in LoginController.js:
    Tracking.marks.set('login complete', {category: 'auth'});
    
    // in UIManager.js:
    Tracking.marks.set('panel loaded', {label: 'notifications'});
    Tracking.marks.measure(
        'login to notifications shown',
        'login complete',
        'panel loaded'
    );
```

**NOTE 1:** If the same mark has been set multiple times, calling measure will take the *most recent*
mark.

**NOTE 2:** Although the [W3C specification](http://www.w3.org/TR/user-timing/) allows
developers to use a number of built-in mark names in their measure calls, the Tracking
library only allows developers to use `navigationStart`.

```javascript
    Tracking.marks.measure('my measure name', 'navigationStart', 'some other mark');
```

Incidentally, `navigationStart` is also the default start value if you do not specifiy a
starting mark name. The default value if you do not specify a stop mark name is the current
epoch time:

```javascript
    Tracking.marks.measure('nav start until now' /* no start or stop needed */);
```

### Measuring Download Times for Scripts, Documents, CSS, and HTML ###

The Tracking library will automatically create tracking entries for all network requests that
occur during the lifetime of your application. These entries include a lot of detailed information,
such as whether the resource was fetched locally or from cache as well as how much time was spent
blocked (i.e. waiting for an available download thread).

Typical resource entry:

```javascript
    {
        type: 'network',
        label: '<url>',
        start: <epoch time>,
        stop: <epoch time>,
        category: <xhr, script, etc.>,
        count: <request count>,
        data: {
            size: <bytes>, // NOTE: not all browsers provide this
            cachedOrLocal: <true or false>,
            blockTime: <milliseconds blocked>,
            stages: {
                fetch: {
                    start: <epoch time>,
                    end: <epoch time>,
                    duration: <milliseconds>
                },
                dns: {
                    start: <epoch time>,
                    end: <epoch time>,
                    duration: <milliseconds>
                },
                tcp: {
                    start: <epoch time>,
                    end: <epoch time>,
                    duration: <milliseconds>
                },
                request: {
                    start: <epoch time>,
                    end: <epoch time>,
                    duration: <milliseconds>
                },
                response: {
                    start: <epoch time>,
                    end: <epoch time>,
                    duration: <milliseconds>
                }
            }
        }
    }
```
