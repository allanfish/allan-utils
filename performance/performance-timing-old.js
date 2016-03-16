(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    factory();
  }
})(function() {
  /**
 * performance-timing.js: Polyfill for performance.timing object
 * For greatest accuracy, this needs to be run as soon as possible in the page, preferably inline.
 * The values returned are necessarily not absolutely accurate, but are close enough for general purposes.
 * @author ShirtlessKirk. Copyright (c) 2014.
 * @license WTFPL (http://www.wtfpl.net/txt/copying)
 */
  (function(window) {
    'use strict';

    window.performance = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance;
    var _timing = {
      domComplete: 0,
      domContentLoadedEventEnd: 0,
      domContentLoadedEventStart: 0,
      domInteractive: 0,
      domLoading: 0,
      legacyNavigationStart: 0,
      loadEventEnd: 0,
      loadEventStart: 0,
      navigationStart: 0,
      unloadEventEnd: 0,
      unloadEventStart: 0
    };
    if (window.performance === undefined) {
      window.performance = { polyfill: true };
      window.performance.timing = _timing;
    } else if (window.performance.timing === undefined) {
      window.performance.timing = _timing;
    }

    var
      document = window.document,
      loadParams,
      setTimeout = window.setTimeout,
      D = Date,
      dateNow = D.now ? function() { return D.now(); } : function() { return (new D()).getTime(); },
      M = Math,
      min = M.min,
      start = dateNow(); // this is the earliest time we can get without built-in timing

    function domLoad() {
      var
        time = dateNow(),
        timing = window.performance.timing;

      /* DOMContentLoadedEventEnd value is set via domReady function.
       * However, this function may run before domReady does (making the value 0), so we check for the falsey value
       */
      timing.domContentLoadedEventEnd = timing.domContentLoadedEventStart = min(timing.domContentLoadedEventEnd, time) || time;
      /* If this function runs before domReady then DOMComplete will equal DOMContentLoadedEventStart
       * Otherwise there will be a few ms difference
       */
      timing.domComplete = timing.loadEventEnd = timing.loadEventStart = M.max(timing.domContentLoadedEventEnd, time);
      try {
        window.removeEventListener.apply(window, loadParams);
      } catch (e) {
        try {
          window.detachEvent('onload', domLoad);
        } catch (ignore) { }
      }
    }

    function domReady() {
      var
        readyState = document.readyState,
        time = dateNow(),
        timing = window.performance.timing;

      if (readyState === 'uninitialized' || readyState === 'loading' || readyState === 'interactive') {
        if (readyState === 'loading') {
          timing.domLoading = timing.domLoading || time;
        } else if (readyState === 'interactive') {
          timing.domInteractive = timing.domInteractive || time;
        }

        setTimeout(domReady, 9);

        return;
      }

      timing.domInteractive = timing.domInteractive || timing.domComplete || time;
      timing.domLoading = timing.domLoading || min(timing.navigationStart, time);
      timing.domContentLoadedEventEnd = timing.domContentLoadedEventStart = min(timing.domInteractive, time);
      if (window.history.length) {
        timing.unloadEventEnd = timing.unloadEventStart = timing.navigationStart;
      }
    }

    if (window.performance.polyfill) {
      var timing = window.performance.timing;
      timing.legacyNavigationStart = timing.navigationStart = start;
      loadParams = ['load', domLoad, false];

      if (document.readyState !== 'complete') {
        try {
          window.addEventListener.apply(window, loadParams);
        } catch (e) {
          try {
            window.attachEvent('onload', domLoad);
          } catch (ignore) { }
        }
      }

      setTimeout(domReady, 0);
    }
  } (window));

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
   * Timing.js 1.0.4
   * Copyright 2015 Addy Osmani
   */
  (function(window) {
    'use strict';

    var performance = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance,
      timing = performance.timing;

    /**
     * 获取白屏时间
     */
    window.getWhiteScreenDuration = function() {
      var whiteScreenStart = performance.getEntriesByName('white-screen-start')[0],
        whiteScreenEnd = performance.getEntriesByName('white-screen-end')[0];

      return whiteScreenStart && whiteScreenEnd ? whiteScreenEnd.startTime - whiteScreenStart.startTime : 0;
    }

    /**
     * 获取首屏时间
     */
    window.getFirstScreenDuration = function() {
      return timing.domInteractive - timing.navigationStart;
    }

    /**
     * 获取页面总的加载时间
     */
    window.getTotalLoadDuration = function() {
      return timing.loadEventEnd - timing.navigationStart;
    }
  })(window);
});