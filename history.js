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

function displayHistory( baseVisits){
  var domainList = document.getElementById('domainList');
  var previousDate;
  baseVisits.each(function(root, i){
    if( i == 0 || (root.visitTime.toDateString() != previousDate) ) {
      var dateHeader = createDateHeader('h3', root.visitTime);
      domainList.appendChild(dateHeader);
      previousDate = root.visitTime.toDateString();
    }
    var domainElement = createDomainElement(root.historyItem, root.visitTime, root.childrenCount());
    var siteList = createSiteList();
    outputChildren(root, siteList);
    domainElement.appendChild(siteList);
    domainList.appendChild(domainElement);
  });
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

function createArrow(){
  var arrow = document.createElement('div');
  arrow.className = "arrow arrow_collapse";
  arrow.addEventListener('click', function(){
    this.parentNode.querySelector('ul').classList.toggle('hidden');
    arrow.classList.toggle('arrow_collapse');
    arrow.classList.toggle('arrow_expand');
  });
  return arrow;
}

function createDomainListItem(){
  var entry = document.createElement('li');
  entry.className = "domainName";
  return entry;
}

function createChildrenCount(childrenCount){
  var countEl = document.createElement('span');
  var str = ' (' + childrenCount + ')';
  countEl.appendChild(document.createTextNode(str));
  countEl.className = 'sessionCount';
  return countEl;
}

function createDomainTitle(historyItem, firstSite){
  var domainName = historyItem.title;
  var url = historyItem.url;
  var title = document.createElement('a');
  title.className = "title";
  title.setAttribute('style', "background-image: url(\"chrome://favicon/" + firstSite + "\");");
  title.setAttribute('href', url);
  title.appendChild(document.createTextNode(domainName ));
  return title;
}

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
function createDomainElement(historyItem, visitTime, childrenCount) {
  var domainTime = createTimeElement(visitTime);
  var domainTitle = createDomainTitle(historyItem, historyItem.url);
  var domainEntry = createDomainListItem();
  domainEntry.appendChild(domainTime);

  var arrow = createArrow();
  if(childrenCount == 0) {
    arrow.classList.add('hidden');
  }
  domainEntry.appendChild(arrow);

  domainEntry.appendChild(domainTitle);
  if(childrenCount > 0) {
    var childrenCount = createChildrenCount(childrenCount);
    domainEntry.appendChild(childrenCount);
  }
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
  siteList.className = "siteList hidden";
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

var microsecondsPerYear = 1000 * 60 * 60 * 24 * 365;
var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
var microsecondsPerHour= 1000 * 60 * 60;
var oneHourAgo = (new Date).getTime() - microsecondsPerHour;
var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
var oneYearAgo = (new Date).getTime() - microsecondsPerYear;


//Ideally we want ALL history, but the function is buggy and I couldn't
//get it to return all available history
chrome.history.search({
    'maxResults': 0,
    'text': '',
    'startTime': oneWeekAgo
  },
  function(historyItems) {
    new SessionedHistory(historyItems, displayHistory);


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