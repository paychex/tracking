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
 3. collecting context-specific metrics (data events)
 4. segmenting analytics by context, metrics, and dimensions
 5. timing user-initiated transactions, with optional nesting (timers)
 6. timing specific points in the application lifecycle against a common baseline (marks)
 7. measuring the time between any 2 marks, with optional nested marks (measures)
 8. measuring download times for scripts, documents, css, and html (network timings)

All 8 analytics follow a single consistent format, allowing you to specify optional categories, tags, variables, etc.
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

    require.config({
        paths: {
            Tracking: 'path/to/tracking'
        }
    });

Then you can inject the Tracking library using code like the following:

    define(['Tracking'], function(Tracking) {
        Tracking.marks.set('script loaded', {label: 'my script name'});
    });

Or, for node:

    var Tracking = require('path/to/tracking');
    Tracking.events.fire('script-load', {category: 'server'});

Now that you have the Tracking library in your code base, let's see how you can use it.

### Working with Collectors ###

Any object with a `collect` method can be registered as a tracking collector using the `collectors` API:

    Tracking.collectors.add(collector:Object{collect:Function}) : Function
    
    var removeCollector = Tracking.collectors.add({
        collect: function collect(info) {
            console.log(info.toString());
        }
    });

We provide a Google Analytics collector for you. This collector will convert `TrackingInfo` instances into the correct
calls to the global `ga` method installed by the analytics.js script.

    <script src="/path/to/analytics.js"></script>
    <script>
        Tracking.collectors.add(new GoogleAnalytics({network: false}));
    </script>

The GA collector we provide allows you to specify custom "off switches" to turn off the collection of specific tracking
data types. In the example above, we disable tracking network timings (i.e., resource downloads such as scripts, CSS,
and PDF files).

You can create your own collectors easily. Just provide a method called `collect` that takes a TrackingInfo instance
as its sole argument. See the code for our GoogleAnalytics collector for an example of how you might implement your own
collector.

### Decorating TrackingInfo Instances ###

Before each TrackingInfo instance is sent to collectors, you have an opportunity to decorate it by appending custom
tags and data. Whereas custom metrics and dimensions add metadata to *all* TrackingInfo instances, decorating can be
conditional. For example:

    // tag all network requests over 2 seconds as long-running:
    var removeDecorator = Tracking.collectors.decorate(function myDecorator(info) {
        if (info.type === 'network' && info.duration >= 2000) {
            info.tags.push('long-running'); // so we can query "long-running" in our analysis package
        }
    });

This flexibility enables you to easily construct helpful queries in your analysis tools by placing your conditional
logic in the UI instead of the back-end.

---

Okay, now let's look at the fun stuff: how to use the Tracking API to track various analytics.

### Tracking User Behavior ###
### Tracking Errors ###
### Collecting Context-Specific Data ###

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

### Timing User-Initiated Transactions, with Optional Nesting ###
### Timing Specific Points in the Application Lifecycle Against a Common Baseline ###
### Measuring the Time Between Any 2 Marks, with Optional Nested Marks ###
### Measuring Download Times for Scripts, Documents, CSS, and HTML ###

