//Visit.count(function(count){
//  if(count === 0){
//    var startTime = (new Date(1960, 0, 1));
//    var endTime = Date.now();
//    getHistory(startTime, endTime);
//  }
//});

var startTime = (new Date()).setHours(0,0,0,0);
var endTime = Date.now();
getHistory(startTime, endTime);

//Ideally we want ALL history, but the function is buggy and I couldn't
//get it to return all available history
function getHistory(startTime, endTime){
  chrome.history.search(
    {
      'maxResults': 0,
      'text': '',
      'startTime': startTime,
      'endTime': endTime
    },
    function (historyItems) {
      new SessionedHistory(historyItems, startTime, endTime, function(){});
      //TODO, set a flag when it is done and don't show data until it is done. instead, show a spinner
    });
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
      base.setChildren(children);
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