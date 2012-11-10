//"use strict";

var Visit = Class.create({
  initialize: function (obj) {
    this.visitId = obj.visitId;
    this.referringVisitId = obj.referringVisitId;
    this.transition = obj.transition;
    this.visitTime = obj.visitTime;
    this.url = obj.url;
    this.title = obj.title;
    this.childrenIds = obj.childrenIds || [];
    this.visitDate = new Date(obj.visitTime);
  },
  getChildren: function(callback) {
    var self = this;
    if(this.children){
      callback(this.children);
    } else {
      Visit.find(this.childrenIds, function(children){
        self.children = children;
        callback(self.children);
      });
    }
  },
  setChildren: function (children) {
    var self = this;
    if(this.children){

    }else{
      this.children = [];
    }
    $A(children).each(function(child){
      if(child.id && (child.id === self.id)){
        //Do not allow a visit to be a child of itself
      } else {
        self.childrenIds.push(child.id);
        self.children.push(child);
      }
    });
  },
  childrenCount: function () {
    return this.childrenIds.length;
  },
  save: function() {
    //TODO don't save the children attribute to the database
    var self = this;
    Visit.objectStore(function(store){
      var r = store.put(self);
      r.onerror = function(e){
        console.log(e.target.error.name + ": " + self + "cannot be saved");
      };
      r.onsuccess = function(e){
        self.id = e.target.result;
      }
    });
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

Visit.find = function(ids, callback){
  var count = 0;
  var results = [];
  if(ids.length === 0){
    callback([]);
  }
  $A(ids).each(function(id){
    Visit.objectStore(function(store){
      var request = store.get(id);
      request.onsuccess = function(e){
        var result = e.target.result;
        if(result){
          results.push(Visit.load(result));
          count++;
          if(count === ids.length){
            callback(results);
          }
        } else {
          throw "Visit with id of " + id + " could not be found in the database";
        }
      };
      request.onerror = function(e){
        throw "Visit with id of " + id + " could not be found in the database";
        count++;
        if(count === ids.length){
          callback(results);
        }
      };
    });
  });
};

Visit.load = function(obj){
  var visit;
  obj = obj || {};
  visit = new Visit(obj);
  visit.id = obj.id;
  return visit;
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
    store.index('visitTime').openCursor(bounds, 'prev').onsuccess = function(e){
      var result = e.target.result;
      if(!!result === true){
        results.push(Visit.load(result.value));
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