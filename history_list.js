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
    var baseVisits= {};
    var visits = {};
    var indexedReferringVisits= {};
    var indexedHistoryItems = {};
    var last_url = null;
    var getVisitsCallbackCount = 0;
    var baseOrder = [];
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
              baseVisits[visitItem.visitId] = new Visit(visitItem, indexedHistoryItems[this.args[0].url]);
              baseOrder.push({visitId: visitItem.visitId, visitTime: visitItem.visitTime});
              break;
            default:
              if( indexedReferringVisits[visitItem.referringVisitId] ){
                indexedReferringVisits[visitItem.referringVisitId].push(new Visit(visitItem, indexedHistoryItems[this.args[0].url]));
              } else {
                indexedReferringVisits[visitItem.referringVisitId] = [new Visit(visitItem, indexedHistoryItems[this.args[0].url])];
              }
          }
          //        console.log([visitItem.visitId, visitItem.referringVisitId, this.args[0].url].join(','))
        }

        if(getVisitsCallbackCount == historyItems.length){
          var newBaseOrder = baseOrder.sort(function(a,b){
            if (a.visitTime < b.visitTime) {
              return 1;
            } else if (a.visitTime == b.visitTime){
              return 0;
            } else {
              return -1;
            }
          });
          that.baseOrder = baseOrder;
          that._setBaseVisitChildren.apply(that, [baseVisits, indexedReferringVisits, callback]);
        }
      });

    }
  },
  _setBaseVisitChildren: function(baseVisits, indexedReferringVisits, callback){
    this.baseVisits = baseVisits;
    //TODO make sure all visits are referenced from indexedReferringVisits.  Any that are leftover should still be shown to the user somehow
    for(var visitId in baseVisits) {
      if (baseVisits.hasOwnProperty(visitId)) {
        var base = baseVisits[visitId];
        getChildren(base, indexedReferringVisits);
      }
    }
    callback(this);
  },
  each: function(callback){
     for(var i = 0; i < this.baseOrder.length; i++){
        callback(this.baseVisits[this.baseOrder[i].visitId]);
     }
  }
});