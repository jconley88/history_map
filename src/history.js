//"use strict";
var startTime = (new Date()).setHours(0,0,0,0);
var endTime = Date.now();
var microsecondsPerDay = 1000 * 60 * 60 * 24;
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

document.observe('dom:loaded', function(){
  var backgroundPage = chrome.extension.getBackgroundPage();
  var moreHistory = document.getElementsByClassName('moreHistory')[0];
  moreHistory.addEventListener('click', function(e){
    e.preventDefault();
    var start = this.getAttribute('start');
    var end = this.getAttribute('end');
    getHistory(parseInt(start), parseInt(end));
    return false;
  });
  async.waterfall([
    async.apply(backgroundPage.Visit.getByDate, startTime, endTime),
    async.apply(displayHistory, startTime, endTime)
  ])
});

function formatAMPM(date) {
  var strTime, hours = date.getHours(), minutes = date.getMinutes(), ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

function getURLDomain(url) {
  return url.split('/')[2].replace(/^www\./, '');
}

function getGroupedHistory(historyItems) {
  var i, domain, groupedHistory = {}, groupedHistoryOrder = [];
  for (i = 0; i < historyItems.length; i = i + 1) {
    domain = getURLDomain(historyItems[i].url);
    //TODO link to other visits
    if (!groupedHistory.hasOwnProperty(domain)) {
      groupedHistoryOrder.push(domain);
      groupedHistory[domain] = {
        lastVisitTime : historyItems[i].lastVisitTime,
        title : 'domain',
        sites : []
      };
    }
    groupedHistory[domain].sites.push(historyItems[i]);
    //TODO insert sites by date
  }
  return { order: groupedHistoryOrder, history: groupedHistory };
}

function initializeOrAddToArray(collection, item) {

}

function insertVisit(groupedVisits, visit) {

}

function createTimeElement(date) {
  var time = document.createElement('div');
  time.className = 'time';
  time.innerHTML = formatAMPM(date);
  return time;
}

function createArrow() {
  var arrow = document.createElement('div');
  arrow.className = "arrow arrow_collapse";
  arrow.addEventListener('click', function () {
    this.parentNode.querySelector('ul').classList.toggle('hidden');
    arrow.classList.toggle('arrow_collapse');
    arrow.classList.toggle('arrow_expand');
  });
  return arrow;
}

function createDomainListItem() {
  var entry = document.createElement('li');
  entry.className = "domainName";
  return entry;
}

function createChildrenCountEl(childrenCount) {
  var countEl = document.createElement('span'), str = ' (' + childrenCount + ')';
  countEl.appendChild(document.createTextNode(str));
  countEl.className = 'sessionCount';
  return countEl;
}

function createDomainTitle(visit) {
  var domainName, url, title;
  url = visit.url;
  domainName = visit.title || url;
  title = document.createElement('a');
  title.className = "title";
  title.setAttribute('style', "background-image: url(\"chrome://favicon/" + url + "\");");
  title.setAttribute('href', url);
  title.appendChild(document.createTextNode(domainName));
  return title;
}

function createSiteContainer() {
  var siteEntry = document.createElement('div');
  siteEntry.className = 'entry';
  return siteEntry;
}

function createSiteTitle(site) {
  var titleText, title, titleTextNode, siteEl = document.createElement('div');
  siteEl.className = "title";
  siteEl.setAttribute('style', "background-image: url(\"chrome://favicon/" + site.url + "\");");
  title = document.createElement('a');
  title.setAttribute('href', site.url);
  title.setAttribute('title', site.title);
  if (site.title === '') {
    titleText = site.url;
  } else {
    titleText = site.title;
  }
  titleTextNode = document.createTextNode(titleText);
  title.appendChild(titleTextNode);
  siteEl.appendChild(title);
  return siteEl;
}
function createDomainElement(visit) {
  var childrenCountEl, domainTime = createTimeElement(visit.visitDate), domainTitle = createDomainTitle(visit), domainEntry = createDomainListItem(), arrow = createArrow();
  domainEntry.appendChild(domainTime);

  if (visit.childrenCount() === 0) {
    arrow.classList.add('hidden');
  }
  domainEntry.appendChild(arrow);

  domainEntry.appendChild(domainTitle);
  if (visit.childrenCount() > 0) {
    childrenCountEl = createChildrenCountEl(visit.childrenCount());
    domainEntry.appendChild(childrenCountEl);
  }
  return domainEntry;
}
function createSiteElement(site) {
//  var time = createTimeElement(new Date(site.lastVisitTime));
  var siteEl = createSiteTitle(site), siteEntry = createSiteContainer();
//  siteEntry.appendChild(time);
  siteEntry.appendChild(siteEl);
  return siteEntry;
}

function createSiteList(level) {
  var siteList = document.createElement('ul');
  siteList.className = "siteList";
  if(level === 0){
    siteList.className = "siteList hidden";
  } else {
    siteList.className = "childSiteList";
  }
  return siteList;
}

function createDateHeader(headerTag, date) {
  var dateHeader = document.createElement(headerTag), today = '';
  dateHeader.className = "dateHeader";

  if (date.toDateString() === (new Date().toDateString())) {
    today = 'Today - ';
  }
  dateHeader.innerHTML = today + days[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  return dateHeader;
}

function outputChildren(root, level, appendTo) {
  var i, child, siteElement, siteList;
  root.getChildren(function(children){
    if (children) {
      siteList = createSiteList(level);
      for (i = 0; i < children.length; i = i + 1) {
        child = children[i];
        siteElement = createSiteElement(child);
        siteList.appendChild(siteElement);
        outputChildren(child, level + 1, siteList);
      }
      if(appendTo){
        appendTo.appendChild(siteList)
      }
    }
  });
}

function displayHistory(start, end, baseVisits) {
  var previousDate, domainElement, children,
      level = 0,
      domainList = document.getElementById('domainList'),
      moreHistory = document.getElementsByClassName('moreHistory')[0];
  baseVisits.each(function (root, i) {
    if (i === 0 || (root.visitDate.toDateString() !== previousDate)) {
      var dateHeader = createDateHeader('h3', root.visitDate);
      domainList.appendChild(dateHeader);
      previousDate = root.visitDate.toDateString();
    }
    domainElement = createDomainElement(root);
    outputChildren(root, level, domainElement);
    domainList.appendChild(domainElement);
  });
  moreHistory.setAttribute('start', start - microsecondsPerDay);
  moreHistory.setAttribute('end', start);
}



//      var domainName = history['order'][i];
//      var domainLastVisit = new Date(history['history'][domainName]['lastVisitTime']);
//      var sites = history['history'][domainName].sites;
//
//      if ( i === 0 || (domainLastVisit.toDateString() != previousDomainDateString) ) {
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
//        if ( j != 0 && (siteLastVisit.toDateString() != previousSiteDateString) ) {
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