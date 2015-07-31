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
 2. collecting context-specific metrics (data events)
 3. segmenting analytics by context, metrics, and dimensions
 4. timing user-initiated transactions, with optional nesting (timers)
 5. timing specific points in the application lifecycle against a common baseline (marks)
 6. measuring the time between any 2 marks, with optional nested marks (measures)
 7. measuring download times for scripts, documents, css, and html (network timings)

All 7 analytics follow a single consistent format, allowing you to specify optional categories, tags, variables, etc.
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

TODO

Okay, now let's look at the fun stuff: how to use the Tracking API in each of the use cases listed above.

### Tracking User Behavior ###
### Collecting Context-Specific Metrics ###
### Segmenting Analytics by Context, Metrics, and Dimensions ###
### Timing User-Initiated Transactions, with Optional Nesting ###
### Timing Specific Points in the Application Lifecycle Against a Common Baseline ###
### Measuring the Time Between Any 2 Marks, with Optional Nested Marks ###
### Measuring Download Times for Scripts, Documents, CSS, and HTML ###
