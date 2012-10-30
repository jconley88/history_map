// onBeforeNavigate -> onCommitted -> tabs.onUpdated -> onCompleted

var tabTimeStamps = tabTimeStampTracker();
var other = createSomethingOrOther();
var links = linkedTabs();

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



tabTimeStamps.startTracking();

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.openerTabId && changeInfo.status && changeInfo.status == 'complete') {
    //Don't log blank new tabs - you can check if it is a new tab by checking to see if tab.title = "New Tab" or if tab.url = "chrome://newtab/"
    other.logNewTab(tabTimeStamps.getTabInfo(tab.openerTabId), tabTimeStamps.getTabInfo(tabId));
  }
});

function tabTimeStampTracker(){
  var tabInfo = {};

  function startTracking(){
    chrome.webNavigation.onCommitted.addListener(function(details) {
      if(details.frameId === 0){
        addVisit(details);
      }
    });

    chrome.tabs.onRemoved.addListener(function(tabId) {
      removeVisit(tabId);
    });
  }

  function addVisit(webNavigation){
    tabInfo[webNavigation.tabId] = {timeStamp: webNavigation.timeStamp, url: webNavigation.url, tabId: webNavigation.tabId};
  }
  
  function removeVisit(tabId){
    delete tabInfo[tabId];
  }

  function getTabInfo(tabId){
    return tabInfo[tabId];
  }

  return {
    startTracking: startTracking,
    getTabInfo: getTabInfo
  }
}

function tabsLink(callback) {
  var sourceId;
  var destinationId;

  function sourceVisitId(){
    return sourceId;
  }

  function destinationVisitId(){
    return destinationId;
  }

  function addSourceVisitId(visitId) {
    sourceId = visitId;
    finalize.call(this);
  }

  function addDestinationVisitId(visitId) {
    destinationId = visitId;
    finalize.call(this);
  }

  function finalize() {
    if (this.sourceVisitId() && this.destinationVisitId()) {
      callback(this);
    }
  }

  return {
    sourceVisitId: sourceVisitId,
    destinationVisitId: destinationVisitId,
    addSourceVisitId: addSourceVisitId,
    addDestinationVisitId: addDestinationVisitId
  }
}

function linkedTabs(){
  var newTabs = {};

  function toKey(visitId){
    return "_" + visitId; //2012-10-25 JC: chrome storage does not support an all number key, of which visitId's solely consist
  }

  function addLink(link) {
    var storageObj = {},
        key = toKey(link.destinationVisitId()),
        value = link.sourceVisitId();

    newTabs[key] = value;
    storageObj[key] = value;
    chrome.storage.local.set(storageObj);
  }
  
  function getSourceId(visitId, callback){
    var key = toKey(visitId);
    return newTabs[key] ||
        chrome.storage.local.get(key, function(item){
          if(item[key]){
            callback(item[key]);
          } else {
            callback(null);
          }
        });
  }

  return {
    addLink: addLink,
    getSourceId: getSourceId
  }
}

function createSomethingOrOther(){

  function findNearestVisitItemId(timeStamp, visitItems){
    var result;
    result = $A(visitItems).inject({diff: Infinity, visitItem: null}, function(closest, visitItem){
      diff = Math.abs(visitItem.visitTime - timeStamp);
      if(diff < closest.diff){
        closest.visitItem = visitItem;
        closest.diff = diff;
      }
      return closest;
    });
    return result.visitItem.visitId;
  }

  function logNewTab(referrer, newTab){
    if(referrer && newTab) {
      var link = tabsLink(links.addLink);
      chrome.history.getVisits({url: referrer.url}, function(visitItems){
        var visitItemId = findNearestVisitItemId(referrer.timeStamp, visitItems);
        link.addSourceVisitId(visitItemId);
      });
      chrome.history.getVisits({url: newTab.url}, function(visitItems){
        var visitItemId = findNearestVisitItemId(newTab.timeStamp, visitItems);
        link.addDestinationVisitId(visitItemId);
      });
    }
  }

  return {
    logNewTab: logNewTab
  }
}