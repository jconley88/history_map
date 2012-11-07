//To update the database:
// 1. increment dbVersion
// 2. Add code at the bottom of the onupgradeneeded callback
// 3. Uncomment the line in SpecRunner.html which loads this script

updateDb = function(){
  var dbVersion = 18;  // (1) increment this when an update is needed
  var request = webkitIndexedDB.open(DB_NAME, dbVersion);
  request.onupgradeneeded = function(e) {
    var store = e.target.result.createObjectStore("visits", {keyPath: "visitTime"});
    store.createIndex("url", "url", { unique: false });
    store.createIndex("visitId", "visitId", { unique: false });
    // (2) if possible, leave the existing db modifying code above and add additional code below
  };
  request.onsuccess = function(e){
    e.target.result.close();
  };
  request.onerror = function(e){
    console.log("A connection could not be made to " + DB_NAME);
    console.log(e.target);
  };
};

updateDb();