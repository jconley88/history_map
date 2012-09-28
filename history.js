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
     return [];
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
  for(var i = 0; i < historyItems.length; i++) {
    var historyItem = historyItems[i];
    chrome.history.getVisits({ url: historyItem.url }, function(visitItems){
      for(var j = 0; j < visitItems.length; j++) {
        var visitItem = visitItems[j];
        visits[visitItem.visitId] = visitItem;
        switch(visitItem.transition){
          case 'generated':
          case 'typed':
          case 'start_page':
          case 'keyword':
            baseVisits[visitItem.visitId] = {visitItem: visitItem, url: this.args[0].url};
          break;
          default:
            if( indexedReferringVisits[visitItem.referringVisitId] ){
              indexedReferringVisits[visitItem.referringVisitId].push({visitItem: visitItem, url: this.args[0].url});
            } else {
              indexedReferringVisits[visitItem.referringVisitId] = [{visitItem: visitItem, url: this.args[0].url}];
            }
        }
      }
    });
  }
  for(var visitId in baseVisits) {
    if (baseVisits.hasOwnProperty(visitId)) {
      var base = baseVisits[visitId];
      getChildren(base, indexedReferringVisits);

//      if(referrer.hasOwnProperty(children)) {
//        referrer.children.push(indexedVisits[visitId]);
//      } else {
//        referrer.children = [indexedVisits[visitId]];
//      }
    }
  }
  return baseVisits;
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

function createDomainTitle(domainName, firstSite){
  var title = document.createElement('span');
  title.className = "title";
  title.setAttribute('style', "background-image: url(\"chrome://favicon/" + firstSite.url + "\");");

  title.appendChild(document.createTextNode(domainName));
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

function createSiteTitle(url) {
  var siteEl = document.createElement('div');
  siteEl.className = "title";
  siteEl.setAttribute('style', "background-image: url(\"chrome://favicon/" + url + "\");");
  title = document.createElement('a');
  title.setAttribute('href', url);
//  title.setAttribute('title', site.title);
  var titleText;
//  if (site.title == '') {
//    titleText = site.url;
//  } else {
    titleText = url;
//  }
  titleTextNode = document.createTextNode(titleText);
  title.appendChild(titleTextNode);
  siteEl.appendChild(title);
  return siteEl;
}
function createDomainElement( domainName, firstSite) {
//  var domainTime = createTimeElement(domainLastVisit);
  var domainTitle = createDomainTitle(domainName, firstSite);
  var domainEntry = createDomainListItem();
//  domainEntry.appendChild(domainTime);
  domainEntry.appendChild(domainTitle);
  return domainEntry;
}
function createSiteElement(url) {
//  var time = createTimeElement(new Date(site.lastVisitTime));
  var siteEl = createSiteTitle(url);
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
      var siteElement = createSiteElement(child.url);
      siteList.appendChild(siteElement);
      outputChildren(child, siteList);
    }
  }
}

chrome.history.search({
    'maxResults': 0,
    'text': '',
    'startTime': oneHourAgo
  },
  function(historyItems) {
    var history = getSessionedHistory(historyItems);
    var domainList = document.getElementById('domainList');
//    var previousDomainDateString = null;
    for( var visitId in history) {
        var root = history[visitId];
        var domainElement = createDomainElement(root.url, root.url);
        var siteList = createSiteList();
        outputChildren(root, siteList);
        domainElement.appendChild(siteList);
        domainList.appendChild(domainElement);
    }

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