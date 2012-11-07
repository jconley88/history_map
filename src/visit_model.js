//"use strict";

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
    var request = webkitIndexedDB.open(DB_NAME);
    request.onsuccess = function(e) {
      Visit.db = e.target.result;
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
    var trans = db.transaction("visits", 'readwrite');
    var store = trans.objectStore("visits");
    callback(store);
  });
};