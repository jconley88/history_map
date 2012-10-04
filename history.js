var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  var hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

function getURLDomain(url) {
    return url.split('/')[2].replace(/^www\./, '');
}

function getGroupedHistory(historyItems){
  groupedHistory = {};
  groupedHistoryOrder = [];
  for(var i = 0; i < historyItems.length; i++) {
    var domain = getURLDomain(historyItems[i].url);
        //TODO link to other visits
        if(!groupedHistory.hasOwnProperty(domain)){
          groupedHistoryOrder.push(domain);
          groupedHistory[domain] = {
            lastVisitTime : historyItems[i].lastVisitTime,
            title : 'domain',
            sites : [] };
        }
        groupedHistory[domain].sites.push(historyItems[i]);
        //TODO insert sites by date
  }
  return { order: groupedHistoryOrder, history: groupedHistory };
}

function initializeOrAddToArray(collection, item) {

}

function getChildren(base, visits) {
  var children = visits[base.visitItem.visitId];
   if(children){
     for(var i = 0; i < children.length; i++) {
       var child = children[i];
       base.children = children;
       getChildren(child, visits);
     }
   } else {
     base.children = [];
   }
}


function getSessionedHistory(historyItems) {
  //ignore, hide or make a note of auto_subframe visits, form_submit, reload
  //I'm not sure what keyword and keyword_generated mean
//  "link"
//  "typed"
//  "auto_bookmark"
//  "auto_subframe"
//  "manual_subframe"
//  "generated"
//  "start_page"
//  "form_submit"
//  "reload"
//  "keyword"
//  "keyword_generated"

  var baseVisits= {};
  var visits = {};
  var indexedReferringVisits= {};
  var indexedHistoryItems = {};
  var last_url = null;
  var getVisitsCallbackCount = 0;
  var baseOrder = [];
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
            baseVisits[visitItem.visitId] = {visitItem: visitItem, url: this.args[0].url, historyItem: indexedHistoryItems[this.args[0].url]};
            baseOrder.push({visitId: visitItem.visitId, visitTime: visitItem.visitTime});
            break;
          case 'reload':
            break;
          default:
            if( indexedReferringVisits[visitItem.referringVisitId] ){
              indexedReferringVisits[visitItem.referringVisitId].push({visitItem: visitItem, url: this.args[0].url, historyItem: indexedHistoryItems[this.args[0].url]});
            } else {
              indexedReferringVisits[visitItem.referringVisitId] = [{visitItem: visitItem, url: this.args[0].url, historyItem: indexedHistoryItems[this.args[0].url]}];
            }
        }
        console.log([visitItem.visitId, visitItem.referringVisitId, this.args[0].url].join(','))
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
        continue_process(newBaseOrder, baseVisits, indexedReferringVisits);
      }
    });
  }
}
function continue_process(baseOrder, baseVisits, indexedReferringVisits){
  //TODO make sure all visits are referenced from indexedReferringVisits.  Any that are leftover should still be shown to the user somehow
  for(var visitId in baseVisits) {
    if (baseVisits.hasOwnProperty(visitId)) {
      var base = baseVisits[visitId];
      getChildren(base, indexedReferringVisits);
    }
  }
//  var history = {};
//  for(visitId in baseVisits) {
//    var base = baseVisits[visitId];
//    var url = base.url;
//    if(history[url]){
//      var children = base.children;
//      for(var i = 0; i < children.length; i++) {
//        var child = children[i];
//        history[url].children.push(child);
//      }
//    } else {
//      history[url] = base;
//    }
//  }
  var domainList = document.getElementById('domainList');
  for(var i = 0; i < baseOrder.length; i++){
      var root = baseVisits[baseOrder[i].visitId];
      var domainElement = createDomainElement(root.historyItem, new Date(root.visitItem.visitTime));
      var siteList = createSiteList();
      outputChildren(root, siteList);
      domainElement.appendChild(siteList);
      domainList.appendChild(domainElement);
  }
}

function insertVisit(groupedVisits, visit){
  visit.visitItem
}

function createTimeElement(date){
  var time = document.createElement('div');
  time.className = 'time';
  time.innerHTML = formatAMPM( date );
  return time;
}

function createDomainListItem(){
  var entry = document.createElement('li');
  entry.className = "domainName";
  return entry;
}

function createDomainTitle(historyItem, firstSite){
  var domainName = historyItem.title;
  var url = historyItem.url;
  var title = document.createElement('span');
  title.className = "title";
  title.setAttribute('style', "background-image: url(\"chrome://favicon/" + firstSite + "\");");

  title.appendChild(document.createTextNode(domainName ));
  title.addEventListener('click', function(){
    this.parentNode.querySelector('ul').classList.toggle('hidden');
  });
  return title;
}

var microsecondsPerYear = 1000 * 60 * 60 * 24 * 365;
var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
var microsecondsPerHour= 1000 * 60 * 60;
var oneHourAgo = (new Date).getTime() - microsecondsPerHour;
var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
var oneYearAgo = (new Date).getTime() - microsecondsPerYear;

//Ideally we want ALL history, but the function is buggy and I couldn't
//get it to return all available history
function createSiteContainer() {
  var siteEntry = document.createElement('div');
  siteEntry.className = 'entry';
  return siteEntry;
}

function createSiteTitle(site) {
  var siteEl = document.createElement('div');
  siteEl.className = "title";
  siteEl.setAttribute('style', "background-image: url(\"chrome://favicon/" + site.url + "\");");
  title = document.createElement('a');
  title.setAttribute('href', site.url);
  title.setAttribute('title', site.title);
  var titleText;
  if (site.title == '') {
    titleText = site.url;
  } else {
    titleText = site.title;
  }
  titleTextNode = document.createTextNode(titleText);
  title.appendChild(titleTextNode);
  siteEl.appendChild(title);
  return siteEl;
}
function createDomainElement(historyItem, visitTime) {
  var domainTime = createTimeElement(visitTime);
  var domainTitle = createDomainTitle(historyItem, historyItem.url);
  var domainEntry = createDomainListItem();
  domainEntry.appendChild(domainTime);
  domainEntry.appendChild(domainTitle);
  return domainEntry;
}
function createSiteElement(site) {
//  var time = createTimeElement(new Date(site.lastVisitTime));
  var siteEl = createSiteTitle(site);
  var siteEntry = createSiteContainer();
//  siteEntry.appendChild(time);
  siteEntry.appendChild(siteEl);
  return siteEntry;
}

function createSiteList() {
  var siteList = document.createElement('ul');
  siteList.className = "siteList";
  return siteList;
}

function createDateHeader(headerTag, date) {
  dateHeader = document.createElement(headerTag);
  dateHeader.className = "dateHeader";

  var today = '';
  if(date.toDateString() == (new Date().toDateString())){
    today = 'Today - '
  }
  dateHeader.innerHTML = today + days[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  return dateHeader;
}

function outputChildren(root, siteList){
  var children = root.children;
  if(children){
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var siteElement = createSiteElement(child.historyItem);
      siteList.appendChild(siteElement);
      outputChildren(child, siteList);
    }
  }
}

chrome.history.search({
    'maxResults': 0,
    'text': '',
    'startTime': oneWeekAgo
  },
  function(historyItems) {
    getSessionedHistory(historyItems);


//      var domainName = history['order'][i];
//      var domainLastVisit = new Date(history['history'][domainName]['lastVisitTime']);
//      var sites = history['history'][domainName].sites;
//
//      if( i == 0 || (domainLastVisit.toDateString() != previousDomainDateString) ) {
//        var dateHeader = createDateHeader('h3', domainLastVisit);
//        domainList.appendChild(dateHeader);
//        previousDomainDateString = domainLastVisit.toDateString();
//      }
//
//      var domainElement = createDomainElement(domainLastVisit, domainName, sites[0]);
//      var siteList = createSiteList();
//
//      var previousSiteDateString = null;
//      for (var j = 0; j < sites.length; j++) {
//        var site = sites[j];
//        var siteLastVisit = new Date(site.lastVisitTime);
//
//        if( j != 0 && (siteLastVisit.toDateString() != previousSiteDateString) ) {
//          var dateHeader = createDateHeader('h4', siteLastVisit);
//          siteList.appendChild(dateHeader);
//          previousSiteDateString = siteLastVisit.toDateString();
//        }
//
//        var siteElement = createSiteElement(site);
//        siteList.appendChild(siteElement);
//      }
//
//      domainElement.appendChild(siteList);
//      domainList.appendChild(domainElement);
  }
);