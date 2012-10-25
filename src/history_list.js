//"use strict";

function historyData() {
  var self;
  var baseVisits = [],
      indexedReferringVisits = {},
      visits = {};


  function addVisit (visit) {
    var irv;
    switch (visit.visitItem.transition) {
    case 'generated':
    case 'typed':
    case 'start_page':
    case 'keyword':
      baseVisits.push(visit);
      break;
    default:
      irv = indexedReferringVisits[visit.visitItem.referringVisitId] = $A(indexedReferringVisits[visit.visitItem.referringVisitId]);
      irv.push(visit);
    }
    visits[visit.visitId] = visit;
  }

  function finalize(callback) {
    var i, base;
    async.series([
      fixBrokenReferringLinks,
      setAbandonedBaseVisits,
      sortBaseVisits
    ],
      function(err, results){
        //TODO make sure all visits are referenced from indexedReferringVisits.  Any that are leftover should still be shown to the user somehow
        for (i = 0; i < baseVisits.length; i = i + 1) {
          base = baseVisits[i];
          setChildren(base);
        }
//    baseVisits = mergeIdenticalBaseVisits();
        callback(null, self);
      }
    );
  }

  function setAbandonedBaseVisits(callback){
    $H(indexedReferringVisits).each(function(referVisit){
      if(visits[referVisit.key]){
        // Do nothing
      } else {
        referVisit.value.each(function(visit){
          baseVisits.push(visit);
        });
        delete indexedReferringVisits[referVisit.key];
      }
    });
    callback(null);
  }

  function mergeIdenticalBaseVisits() {
    var visitsByUrl = baseVisits.inject($H(), function (acc, n) {
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
  }
  function setChildren(base) {
    var i, child, children = getChildrenOfVisit(base);
    if (children) {
      for(i = 0; i < children.length; i = i + 1) {
        child = children[i];
        setChildren(child);
      }
      base.children = children;
    } else {
      base.children = [];
    }
  }
  function sortBaseVisits(callback) {
    //TODO update to sort this by the time of the most recently accessed page in this session
    baseVisits = baseVisits.sort(function (a, b) {
      if (a.visitTime < b.visitTime) {
        return 1;
      } else if (a.visitTime === b.visitTime) {
        return 0;
      } else {
        return -1;
      }
    });
    callback(null);
  }
  function getChildrenOfVisit(visit) {
    var children = indexedReferringVisits[visit.visitId];
    delete indexedReferringVisits[visit.visitId];
    return children;
  }
  function fixBrokenReferringLinks(callback) {
    var referrerId, fixedLinks, referringVisits, counter;
    counter = 0;
    fixedLinks = chrome.extension.getBackgroundPage().links;
    referringVisits = indexedReferringVisits;

    $A(referringVisits[0]).each(function(visit, index){
      referrerId = fixedLinks.getSourceId(visit.visitId, function(referrerId){
        if(referrerId){
          referringVisits[referrerId] = referringVisits[referrerId] || $A();
          referringVisits[referrerId].push(visit);
          delete referringVisits[0][index];
        }
        counter++;
        if(counter === referringVisits[0].length){
          indexedReferringVisits[0] = $A(indexedReferringVisits[0]).flatten();
          callback(null);
        }
      });
    });
  }
  function each(callback) {
    var i;
    for (i = 0; i < baseVisits.length; i = i + 1) {
      callback(baseVisits[i], i);
    }
  }
  return self = {
    addVisit: addVisit,
    finalize: finalize,
    each: each,
    baseVisits: baseVisits
  }
}

var Visit = Class.create({
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
    return this._childrenCount(this);
  },
  _childrenCount: function (visit) {
    var that = this, count = 0;
    if (visit.children) {
      count = count + visit.children.length;
      if (visit.children.length > 0) {
        visit.children.each(function (child) {
          count = count + that._childrenCount(child);
        });
      }
    }
    return count;
  }
});

var SessionedHistory = Class.create({
  initialize: function (historyItems, callback) {
    this.baseVisits = [];
    this.indexedReferringVisits = {};
    this.callback = callback;
    this._setVisits(historyItems);
    this.historyData = historyData();
  },
  _setVisits: function (historyItems) {
    var i,
        historyItem,
        indexedHistoryItems = {},
        visitsCallbackCount = 0,
        that = this;
    for (i = 0; i < historyItems.length; i = i + 1) {
      historyItem = historyItems[i];
      indexedHistoryItems[historyItem.url] = historyItem;
      chrome.history.getVisits({ url: historyItem.url}, function (visitItems) {
        var j, url = this.args[0].url;
        visitsCallbackCount = visitsCallbackCount + 1;
        for (j = 0; j < visitItems.length; j = j + 1) {
          that.historyData.addVisit(new Visit(visitItems[j], indexedHistoryItems[url]));
        }
        if (visitsCallbackCount === historyItems.length) {
          async.waterfall([
            that.historyData.finalize,
            that.callback
          ]);
        }
      });
    }
  }
});