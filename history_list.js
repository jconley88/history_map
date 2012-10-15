//"use strict";

var Visit = Class.create(
  (function () {
    var getChildrenCountOfVisit = function (visit) {
      var count = 0;
      if (visit.children) {
        count = count + visit.children.length;
        if (visit.children.length > 0) {
          visit.children.each(function (child) {
            count = count + getChildrenCountOfVisit(child);
          });
        }
      }
      return count;
    };
    return {
      initialize: function (visitItem, historyItem) {
        this.visitItem = visitItem;
        this.historyItem = historyItem;
        this.visitId = visitItem.visitId;
        this.visitTime = new Date(visitItem.visitTime);
        this.url = historyItem.url;
        this.title = historyItem.title;
      },
      setChildren: function (children) {
        this.children = children;
      },
      childrenCount: function () {
        return getChildrenCountOfVisit(this);
      }
    };
  }())
);

var SessionedHistory = Class.create(
  (function () {
    function setVisits(historyItems) {
        var i, historyItem, visits = {}, indexedHistoryItems = {}, visitsCallbackCount = 0, that = this;
        for (i = 0; i < historyItems.length; i = i + 1) {
          historyItem = historyItems[i];
          indexedHistoryItems[historyItem.url] = historyItem;
          chrome.history.getVisits({ url: historyItem.url}, function (visitItems) {
            var j, irv, visitItem, url = this.args[0].url;
            visitsCallbackCount = visitsCallbackCount + 1;
            for (j = 0; j < visitItems.length; j = j + 1) {
              visitItem = visitItems[j];
              visits[visitItem.visitId] = visitItem;
              switch (visitItem.transition) {
                case 'generated':
                case 'typed':
                case 'start_page':
                case 'keyword':
                  that.baseVisits.push(new Visit(visitItem, indexedHistoryItems[url]));
                  break;
                default:
                  irv = that.indexedReferringVisits[visitItem.referringVisitId] = $A(that.indexedReferringVisits[visitItem.referringVisitId]);
                  irv.push(new Visit(visitItem, indexedHistoryItems[url]));
              }
            }
            if (visitsCallbackCount === historyItems.length) {
              setBaseVisitChildren.call(that);
            }
          });
        }
      };
    function setBaseVisitChildren() {
      var i, base;
      sortBaseVisits.call(this);
      //TODO make sure all visits are referenced from indexedReferringVisits.  Any that are leftover should still be shown to the user somehow
      for (i = 0; i < this.baseVisits.length; i = i + 1) {
        base = this.baseVisits[i];
        setChildren.call(this, base);
      }
      this.baseVisits = mergeIdenticalBaseVisits.call(this);
      this.callback(this);
    };
    function mergeIdenticalBaseVisits() {
      var visitsByUrl = this.baseVisits.inject($H(), function (acc, n) {
        acc.set(n.url, $A(acc.get(n.url)));
        acc.get(n.url).push(n);
        return acc;
      });
      return visitsByUrl.values().inject([], function (acc, n) {
        var i, first = n[0];
        for (i = 1; i < n.length; i = i + 1) {
          first.children.push(n[i].children);
        }
        first.children = first.children.flatten();
        acc.push(first);
        return acc;
      });
    };
    function setChildren(base) {
      var i, child, children = getChildrenOfVisit.call(this, base);
      if (children) {
        for(i = 0; i < children.length; i = i + 1) {
          child = children[i];
          setChildren.call(this, child);
        }
        base.children = children;
      } else {
        base.children = [];
      }
    };
    function sortBaseVisits() {
      //TODO update to sort this by the time of the most recently accessed page in this session
      this.baseVisits = this.baseVisits.sort(function (a, b) {
        if (a.visitTime < b.visitTime) {
          return 1;
        } else if (a.visitTime === b.visitTime) {
          return 0;
        } else {
          return -1;
        }
      });
    };
    function getChildrenOfVisit(visit) {
      var children = this.indexedReferringVisits[visit.visitId];
      delete this.indexedReferringVisits[visit.visitId];
      return children;
    };
    return {
      initialize: function (historyItems, callback) {
        this.baseVisits = [];
        this.indexedReferringVisits = {};
        this.callback = callback;
        setVisits.call(this, historyItems);
      },
      each: function (callback) {
        var i;
        for (i = 0; i < this.baseVisits.length; i = i + 1) {
          callback(this.baseVisits[i], i);
        }
      }
    };
  }())
);