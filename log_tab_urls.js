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

function linkedTabs(){
  //refactor this to hold an object with one key (visitId) with its value (referringId)
  var newTabs = {};

  function newTabKey(referrer, newTab){
    return referrer.tabId.toString() + newTab.tabId.toString();
  }

  function newLink(referrer, newTab){
    //refactor this to return an object that checks when both referrer and new tab are set
    return newTabs[newTabKey(referrer, newTab)] = {}
  }

  function getLinks(){
    return newTabs;
  }
  
  function getReferrerId(visitId){
    var result;
    result = $H(newTabs).detect(function(hash){
      var link = hash[1];
      if(link.newTabVisitId === visitId){
        return true;
      } else {
        return false;
      }
    });
    return result ? result[1].referrerVisitId : null;
  }

  return {
    newLink: newLink,
    getLinks: getLinks,
    getReferrerId: getReferrerId
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
      var link = links.newLink(referrer, newTab);
      chrome.history.getVisits({url: referrer.url}, function(visitItems){
        visitItemId = findNearestVisitItemId(referrer.timeStamp, visitItems);
        link.referrerVisitId = visitItemId;
      });
      chrome.history.getVisits({url: newTab.url}, function(visitItems){
        visitItemId = findNearestVisitItemId(newTab.timeStamp, visitItems);
        link.newTabVisitId = visitItemId;
      });
    }
  }

  return {
    logNewTab: logNewTab
  }
}