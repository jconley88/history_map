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
    async.series([
      setAbandonedBaseVisits,
      sortBaseVisits,
      nestChildren,
      save
    ],
      function(err, results){
        callback(null, self);
      }
    );
  }
  function nestChildren(callback){
    var i, base;
    //TODO make sure all visits are referenced from indexedReferringVisits.  Any that are leftover should still be shown to the user somehow
    for (i = 0; i < baseVisits.length; i = i + 1) {
      base = baseVisits[i];
      setChildren(base);
    }
//    baseVisits = mergeIdenticalBaseVisits();
    callback(null, self);
  }
  function save(){
    baseVisits.each(function(v){
      v.save()
    });
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
  function each(callback) {
  }
  return self = {
    addVisit: addVisit,
    finalize: finalize,
    each: each,
    baseVisits: baseVisits
  }
}

var Visit = Class.create({
  initialize: function (visitItem, historyItem, children) {
    this.visitId = visitItem.visitId;
    this.referringVisitId = visitItem.referringVisitId;
    this.transition = visitItem.transition;
    this.visitTime = visitItem.visitTime;
    this.url = historyItem.url;
    this.title = historyItem.title;

    this.visitDate = new Date(visitItem.visitTime);
    this.setChildren(children);
  },
  setChildren: function (children) {
    this.children = children || [];
  },
  childrenCount: function () {
    return this._childrenCount(this);
  },
  save: function() {
    var db = Visit.db;
    var trans = db.transaction(["visits"], 'readwrite');
    var store = trans.objectStore("visits");
    console.log(this);
    store.put(this);
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

var dbVersion = 10;
var request = webkitIndexedDB.open("history_map", dbVersion);
request.onsuccess = function(e) {
  console.log(e);
  Visit.db = e.target.result;
  if (Visit.db.setVersion) {
    if (Visit.db.version != dbVersion) {
      var setVersion = Visit.db.setVersion(dbVersion);
      setVersion.onsuccess = function () {
        var store = e.target.result.createObjectStore("visits", {keyPath: "visitTime"});
        store.createIndex("url", "url", { unique: false });
        store.createIndex("visitId", "visitId", { unique: true });
      };
    }
  }
};

Visit.getByDate = function(start, end, callback){
  var db = Visit.db;
  var trans = db.transaction(["visits"], 'readwrite');
  var store = trans.objectStore("visits");
  var bounds = webkitIDBKeyRange.bound(start, end, false, true);
  results = [];
  results.eachWithIndex = function(callback){
    var i;
    for (i = 0; i < this.length; i = i + 1) {
      callback(this[i], i);
    }
  }
  store.openCursor(bounds, webkitIDBCursor.PREV).onsuccess = function(e){
    var result = e.target.result;
    if(!!result === true){
      results.push(new Visit(result.value.visitItem, result.value.historyItem, result.value.children));
      result.continue();
    } else{
      callback(null, results);
    }
  };
};

Visit.count = function(callback){
  var db = Visit.db;
  var trans = db.transaction(["visits"], 'read');
  var store = trans.objectStore("visits");
  store.count.onsuccess = function(e){
    callback(e.target.result);
  };
}

var SessionedHistory = Class.create({
  initialize: function (historyItems, start, end, callback) {
    this.callback = callback.bind(this, start, end);
    this._setVisits(historyItems);
    this.historyData = historyData();
    this.start = start;
    this.end = end;
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
        var j, visitItem, visitObj, url = this.args[0].url;
        visitsCallbackCount = visitsCallbackCount + 1;
        for (j = 0; j < visitItems.length; j = j + 1) {
          visitItem = visitItems[j];
          if(visitItem.visitTime >= that.start && visitItem.visitTime <= that.end){
            visitObj = new Visit(visitItem, indexedHistoryItems[url]);
            that.historyData.addVisit(visitObj);
          }
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