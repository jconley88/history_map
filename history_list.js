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
  }
});

var SessionedHistory = Class.create({
  initialize: function(historyItems, callback){
    this.baseVisits= [];
    var visits = {};
    var indexedReferringVisits= {};
    var indexedHistoryItems = {};
    var last_url = null;
    var getVisitsCallbackCount = 0;
    var that = this;
    for(var i = 0; i < historyItems.length; i++) {
      var historyItem = historyItems[i];
      indexedHistoryItems[historyItem.url] = historyItem;
      chrome.history.getVisits({ url: historyItem.url}, function(visitItems){
        getVisitsCallbackCount++;
        for(var j = 0; j < visitItems.length; j++) {
          var visitItem = visitItems[j];
          visits[visitItem.visitId] = visitItem;
          switch(visitItem.transition){
            case 'generated':
            case 'typed':
            case 'start_page':
            case 'keyword':
              that.baseVisits.push(new Visit(visitItem, indexedHistoryItems[this.args[0].url]));
              break;
            default:
              if( indexedReferringVisits[visitItem.referringVisitId] ){
                indexedReferringVisits[visitItem.referringVisitId].push(new Visit(visitItem, indexedHistoryItems[this.args[0].url]));
              } else {
                indexedReferringVisits[visitItem.referringVisitId] = [new Visit(visitItem, indexedHistoryItems[this.args[0].url])];
              }
          }
        }

        if(getVisitsCallbackCount == historyItems.length){
          //TODO update to sort this by the time of the most recently accessed page in this session
          that.baseVisits = that.baseVisits.sort(function(a,b){
            if (a.visitTime < b.visitTime) {
              return 1;
            } else if (a.visitTime == b.visitTime){
              return 0;
            } else {
              return -1;
            }
          });
          that._setBaseVisitChildren.apply(that, [indexedReferringVisits, callback]);
        }
      });

    }
  },
  each: function(callback){
     for(var i = 0; i < this.baseVisits.length; i++){
        callback(this.baseVisits[i]);
     }
  },
  _setBaseVisitChildren: function(indexedReferringVisits, callback){
    //TODO make sure all visits are referenced from indexedReferringVisits.  Any that are leftover should still be shown to the user somehow
   for(var i = 0; i < this.baseVisits.length; i ++){
        var base = this.baseVisits[i];
        this._getChildren(base, indexedReferringVisits);
    }
    callback(this);
  },
  _getChildren: function(base, visits) {
   var children = visits[base.visitId];
    if(children){
      for(var i = 0; i < children.length; i++) {
        var child = children[i];
        base.children = children; //TODO move this below 'getChildren' and out of the for loop
        this._getChildren(child, visits);
      }
    } else {
      base.children = [];
    }
 }
});