// onBeforeNavigate -> onCommitted -> tabs.onUpdated -> onCompleted

var tracker = createUrlTimeStampTracker();
var other = createSomethingOrOther();
var links = linkedTabs();

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.openerTabId && changeInfo.status && changeInfo.status == 'complete') {
    other.logNewTab(tracker.getVisit(tab.openerTabId), tracker.getVisit(tabId));
  }
});

function createUrlTimeStampTracker(){
  var visits = {};

  chrome.webNavigation.onCommitted.addListener(function(details) {
    addVisit(details);
  });

  chrome.tabs.onRemoved.addListener(function(tabId) {
    removeVisit(tabId);
  });

  function addVisit(webNavigation){
    visits[webNavigation.tabId] = {timeStamp: webNavigation.timeStamp, url: webNavigation.url, tabId: webNavigation.tabId};
  }
  
  function removeVisit(tabId){
    delete visits[tabId];
  }

  function getVisit(tabId){
    return visits[tabId];
  }

  return {
    getVisit: getVisit
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

  function addLink(link) {
    newTabs[link.destinationVisitId()] = link.sourceVisitId();
  }
  
  function getSourceId(visitId){
    return newTabs[visitId];
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
        visitItemId = findNearestVisitItemId(referrer.timeStamp, visitItems);
        link.addSourceVisitId(visitItemId);
      });
      chrome.history.getVisits({url: newTab.url}, function(visitItems){
        visitItemId = findNearestVisitItemId(newTab.timeStamp, visitItems);
        link.addDestinationVisitId(visitItemId);
      });
    }
  }

  return {
    logNewTab: logNewTab
  }
}