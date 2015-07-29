## Tracking ##

The built-in HTML5 Tracking API includes marks, measures, and resource timing data. Unfortunately, the PerformanceEntry
class doesn't have all of the information you might want to accurately gauge performance throughout your application.
For example, it would be nice to break down your timing marks by category, or tag your measures with keywords for later
indexing.

In addition, because it is focused on performance and not user behavior, the HTML5 Tracking API has no built-in support
for event tracking, view contexts, or custom metrics and dimensions.

We wrote the Tracking library to be a single API that covers all of your user behavior and performance tracking needs.

