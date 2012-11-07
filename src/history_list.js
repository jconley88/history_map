//"use strict";

function historyData() {
  var self;
  var baseVisits = [],
      indexedReferringVisits = {},
      visits = {};

  function addVisit (visit) {
    var irv;
    switch (visit.transition) {
    case 'generated':
    case 'typed':
    case 'start_page':
    case 'keyword':
      baseVisits.push(visit);
      break;
    default:
      irv = indexedReferringVisits[visit.referringVisitId] = $A(indexedReferringVisits[visit.referringVisitId]);
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
  initialize: function (obj) {
    this.visitId = obj.visitId;
    this.referringVisitId = obj.referringVisitId;
    this.transition = obj.transition;
    this.visitTime = obj.visitTime;
    this.url = obj.url;
    this.title = obj.title;

    this.visitDate = new Date(obj.visitTime);
    this.setChildren(obj.children);
  },
  setChildren: function (children) {
    this.children = children || [];
  },
  childrenCount: function () {
    return this._childrenCount(this);
  },
  save: function() {
    var self = this;
    Visit.objectStore(function(store){
      var r = store.put(self);
      r.onerror = function(e){
        console.log(e.target.error.name + ": " + self + "cannot be saved");
      };
    });
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

Visit.connectToDb = function(callback){
  if(Visit.db){
    if(callback){
      callback();
    }
  } else {
    var dbVersion = 14;
    var request = webkitIndexedDB.open("history_map", dbVersion);
    request.onsuccess = function(e) {
      Visit.db = e.target.result;

      if (Visit.db.version < dbVersion) {
        var setVersion = Visit.db.setVersion(dbVersion);
        setVersion.onsuccess = function (e) {
          console.log(e);
          var store = e.target.result.createObjectStore("visits", {keyPath: "visitTime"});
          store.createIndex("url", "url", { unique: false });
          store.deleteIndex('visitId');
          store.createIndex("visitId", "visitId", { unique: false });
        };
        setVersion.onerror = function(e){
          console.log('There was an error setting the version of the db: ' + e);
        };
        setVersion.onblocked = function(e){
          console.log('The db version cannot be modified because there is an open connection to the db somewhere: ' + e);
        };

      }
      if(callback){
        callback();
      }
    };
  }
};

Visit.getByDate = function(start, end, callback){
  Visit.objectStore( function(store){
    var bounds = webkitIDBKeyRange.bound(start, end, false, true);
    results = [];
    results.eachWithIndex = function(callback){
      var i;
      for (i = 0; i < this.length; i = i + 1) {
        callback(this[i], i);
      }
    };
    store.openCursor(bounds, 'prev').onsuccess = function(e){
      var result = e.target.result;
      if(!!result === true){
        results.push(new Visit(result.value));
        result.continue();
      } else{
        callback(null, results);
      }
    };
  });
};

Visit.count = function(callback){
  Visit.objectStore( function(store){
    var keyRange = webkitIDBKeyRange.lowerBound(0);
    var cursorRequest = store.count(keyRange);
    cursorRequest.onsuccess = function(e){
      callback(e.target.result);
    };
  });
};

Visit.objectStore = function(callback){
  Visit.connectToDb(function(){
    var db = Visit.db;
    var trans = db.transaction(["visits"], 'readwrite');
    var store = trans.objectStore("visits");
    callback(store);
  });
};

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
            visitObj = new Visit(Object.extend(visitItem, indexedHistoryItems[url]));
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