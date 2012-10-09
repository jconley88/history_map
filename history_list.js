var Visit = Class.create({
  initialize: function(visitItem, historyItem){
    this.visitItem = visitItem;
    this.historyItem = historyItem;

    this.visitId = visitItem.visitId;
    this.visitTime = new Date(visitItem.visitTime);
    this.url = historyItem.url;
    this.title = historyItem.title;
  },

  setChildren: function(children){
    this.children = children;
  },
  childrenCount: function(){
    return this._childrenCount(this);
  },
  _childrenCount: function(visit){
    var that = this;
    var count = 0;
    if(visit.children){
      count = count + visit.children.length;
      if(visit.children.length > 0) {
        visit.children.each(function(child){
          count = count + that._childrenCount(child);
        });
      }
    }
    return count;
  }
});

var SessionedHistory = Class.create({
  initialize: function(historyItems, callback){
    this.baseVisits= [];
    this.indexedReferringVisits = {};
    this.callback = callback;
    this._setVisits(historyItems);
  },
  each: function(callback){
    for(var i = 0; i < this.baseVisits.length; i++){
      callback(this.baseVisits[i], i);
    }
  },
  _setVisits: function(historyItems){
    var visits = {};
    var indexedHistoryItems = {};
    var visitsCallbackCount = 0;
    var that = this;
    for(var i = 0; i < historyItems.length; i++) {
      var historyItem = historyItems[i];
      indexedHistoryItems[historyItem.url] = historyItem;
      chrome.history.getVisits({ url: historyItem.url}, function(visitItems){
        var url = this.args[0].url;
        visitsCallbackCount++;
        for(var j = 0; j < visitItems.length; j++) {
          var visitItem = visitItems[j];
          visits[visitItem.visitId] = visitItem;
          switch(visitItem.transition){
            case 'generated':
            case 'typed':
            case 'start_page':
            case 'keyword':
              that.baseVisits.push(new Visit(visitItem, indexedHistoryItems[url]));
              break;
            default:
              var irv = that.indexedReferringVisits[visitItem.referringVisitId] = $A(that.indexedReferringVisits[visitItem.referringVisitId]);
              irv.push(new Visit(visitItem, indexedHistoryItems[url]));
          }
        }
        if(visitsCallbackCount == historyItems.length){
          that._setBaseVisitChildren.apply(that);
        }
      });
    }
  },
  _setBaseVisitChildren: function(){
    this._sortBaseVisits();
    //TODO make sure all visits are referenced from indexedReferringVisits.  Any that are leftover should still be shown to the user somehow
    for(var i = 0; i < this.baseVisits.length; i++){
      var base = this.baseVisits[i];
      this._setChildren(base);
    }
    this.baseVisits = this._mergeIdenticalBaseVisits();
    this.callback(this);
  },
  _mergeIdenticalBaseVisits: function(){
    var visitsByUrl = this.baseVisits.inject($H(), function(acc, n, index){
      acc.set(n.url, $A(acc.get(n.url)));
      acc.get(n.url).push(n);
      return acc;
    });
    return visitsByUrl.values().inject([], function(acc, n){
      var first = n[0];
      for(var i = 1; i < n.length; i++){
        first.children.push(n[i].children);
      }
      first.children = first.children.flatten();
      acc.push(first);
      return acc;
    });
  },
  _setChildren: function(base) {
    var children = this._getChildrenOfVisit(base);
    if(children){
      for(var i = 0; i < children.length; i++) {
        var child = children[i];
        this._setChildren(child);
      }
      base.children = children;
    } else {
      base.children = [];
    }
  },
  _sortBaseVisits: function(){
    //TODO update to sort this by the time of the most recently accessed page in this session
    this.baseVisits = this.baseVisits.sort(function(a,b){
      if (a.visitTime < b.visitTime) {
        return 1;
      } else if (a.visitTime == b.visitTime){
        return 0;
      } else {
        return -1;
      }
    });
  },
  _getChildrenOfVisit: function(visit){
    var children = this.indexedReferringVisits[visit.visitId];
    delete this.indexedReferringVisits[visit.visitId];
    return children;
  }
});