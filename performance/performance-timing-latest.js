(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    factory();
  }
})(function() {

  var WebPerf = { t0: new Date().getTime() };
  var perf;
  if (perf = window.performance)
    WebPerf.vendor = ''
  else if (perf = window.webkitPerformance)
    WebPerf.vendor = 'webkit'
  else if (perf = window.msPerformance)
    WebPerf.vendor = 'ms'
  else if (perf = window.mozPerformance)
    WebPerf.vendor = 'moz'
  else {
    WebPerf.vendor = 'p'
    perf = window.performance = { vendor: 'p', timing: {}, navigation: {} };
  }

  // polyfill for performance.now, performance.mark(), performance.measure(), performance.getEntryByType() 
  (function(window) {
    var
      startOffset = Date.now ? Date.now() : +(new Date)
      , performance = window.performance || {}

      , _entries = []
      , _marksIndex = {}

      , _filterEntries = function(key, value) {
        var i = 0, n = _entries.length, result = [];
        for (; i < n; i++) {
          if (_entries[i][key] == value) {
            result.push(_entries[i]);
          }
        }
        return result;
      }

      , _clearEntries = function(type, name) {
        var i = _entries.length, entry;
        while (i--) {
          entry = _entries[i];
          if (entry.entryType == type && (name === void 0 || entry.name == name)) {
            _entries.splice(i, 1);
          }
        }
      }
      ;


    if (!performance.now) {
      performance.now = performance.webkitNow || performance.mozNow || performance.msNow || function() {
        return (Date.now ? Date.now() : +(new Date)) - startOffset;
      };
    }


    if (!performance.mark) {
      performance.mark = performance.webkitMark || function(name) {
        var mark = {
          name: name
          , entryType: 'mark'
          , startTime: performance.now()
          , duration: 0
        };
        _entries.push(mark);
        _marksIndex[name] = mark;
      };
    }


    if (!performance.measure) {
      performance.measure = performance.webkitMeasure || function(name, startMark, endMark) {
        startMark = _marksIndex[startMark].startTime;
        endMark = _marksIndex[endMark].startTime;

        _entries.push({
          name: name
          , entryType: 'measure'
          , startTime: startMark
          , duration: endMark - startMark
        });
      };
    }


    if (!performance.getEntriesByType) {
      performance.getEntriesByType = performance.webkitGetEntriesByType || function(type) {
        return _filterEntries('entryType', type);
      };
    }


    if (!performance.getEntriesByName) {
      performance.getEntriesByName = performance.webkitGetEntriesByName || function(name) {
        return _filterEntries('name', name);
      };
    }


    if (!performance.clearMarks) {
      performance.clearMarks = performance.webkitClearMarks || function(name) {
        _clearEntries('mark', name);
      };
    }


    if (!performance.clearMeasures) {
      performance.clearMeasures = performance.webkitClearMeasures || function(name) {
        _clearEntries('measure', name);
      };
    }


    // exports
    window.performance = performance;

    if (typeof define === 'function' && (define.amd || define.ajs)) {
      define('performance', [], function() { return performance });
    }
  })(window);


  /**
   *  performance.timing polyfill 
   * @copyright  hax 
   */
  function fallback() {

    var dnow = typeof Date.now === 'function' ?
      Date.now : function() { return new Date().getTime() }

    var t0 = WebPerf.t0, t1 = t0

    function now(timeStamp) {
      var t = dnow()
      // ensure monotonic, or returns NaN
      if (t >= t1) t1 = t
      else return [NaN, NaN]

      // timeStamp should never beyond now time
      if (timeStamp && timeStamp <= t) t = timeStamp
      return [t - t0, t]
    }

    var timing = { domLoading: t0 }
    var timing2 = { domLoading: 0 }

    //TODO: should we use setTimeout to capture *End time?
    window.addEventListener('DOMContentLoaded', function(event) {
      var t = now(event.timeStamp)
      timing2.domContentLoadedEventStart = t[0]
      timing.domContentLoadedEventStart = t[1]
    }, true)

    window.addEventListener('DOMContentLoaded', function() {
      var t = now()
      timing2.domContentLoadedEventEnd = t[0]
      timing.domContentLoadedEventEnd = t[1]
    }, false)

    window.addEventListener('load', function(event) {
      var t = now(event.timeStamp)
      timing2.loadEventStart = t[0]
      timing.loadEventStart = t[1]
    }, true)

    window.addEventListener('load', function() {
      var t = now()
      timing2.loadEventEnd = t[0]
      timing.loadEventEnd = t[1]
    }, false)

    window.document.addEventListener('readystatechange', function(event) {
      var t = now(event.timeStamp)
      var s = this.readyState, attr = 'dom' + s[0].toUpperCase() + s.slice(1)
      timing2[attr] = t[0]
      timing[attr] = t[1]
    }, true)

    window.performance.timing = timing;
    window.performance.navigation = {};
    timing2.vendor = WebPerf.vendor;

    return function() {
      return timing2
    }
  }

  // try Navigation Timing API,
  // see http://w3c-test.org/webperf/specs/NavigationTiming/
  function navigationTiming() {
    if (perf.vendor === 'p') {
      // user agent may provide the option of disabling the
      // window.performance.timing, and returns null value,
      // so our interface also returns nothing.
      return fallback();
    } else {
      WebPerf.t0 =
        perf.timing.navigationStart ||
        // IE9 bug: navigationStart is 0 when redirect,
        // so fallback to fetchStart
        perf.timing.fetchStart

      return function() {
        var t0 = WebPerf.t0, t = perf.timing, n = perf.navigation
        var entry = {
          name: 'document',
          entryType: 'navigation',
          startTime: 0,
          duration: (t.loadEventEnd || t.loadEventStart) - t0
        }
        entry.redirectCount = n.redirectCount
        switch (n.type) {
          case n.TYPE_NAVIGATE: entry.type = 'navigate'; break
          case n.TYPE_RELOAD: entry.type = 'reload'; break
          case n.TYPE_BACK_FORWARD: entry.type = 'back_forward'; break
          default: entry.type = n.type
        }
        for (var k in t) {
          if (
            // ignore props on Object.prototype
            !entry[k] &&
            // only navigation attributes,
            // ignore others like toJSON on IE
            typeof t[k] === 'number' &&
            // ignore navigationStart attribute
            k !== 'navigationStart' &&
            // ignore attributes return 0 value
            t[k]
          ) {
            entry[k] = t[k] - t0
          }
        }
        // 
        entry.whiteScreenDuration = (function() {
          var whiteScreenStart = performance.getEntriesByName('white-screen-start')[0],
            whiteScreenEnd = performance.getEntriesByName('white-screen-end')[0];

          return whiteScreenStart && whiteScreenEnd ? (whiteScreenEnd.startTime - whiteScreenStart.startTime).toFixed() : 0;
        })();
        return entry
      }
    }
  }

  window.navigationTiming = navigationTiming();
});