beforeEach(function() {
  this.addMatchers({
    toBePlaying: function(expectedSong) {
      var player = this.actual;
      return player.currentlyPlayingSong === expectedSong && 
             player.isPlaying;
    }
  });
});

beforeEach(function(){
  var done = false;

  runs(function(){
    var request = webkitIndexedDB.open(DB_NAME);
    request.onsuccess = function(e){
      var db = e.target.result;

      $A(db.objectStoreNames).each(function(name){
        var trans = db.transaction(name, 'readwrite');
        var store = trans.objectStore(name);
        var clear = store.clear();

        clear.onsuccess = function(e){
          done = true;
        };
        clear.onerror = function(e){
          console.log("The " + name + " objectStore could not be cleared");
        };
      });
    };
  });
  waitsFor(function(){
    return done;
  }, "the database to clear.", 50);
});
