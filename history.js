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
    return url.split('/')[2];
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

function createDomainTitle(titleText){
  var title = document.createElement('span');
  title.appendChild(document.createTextNode(titleText));
  title.addEventListener('click', function(){
    this.parentNode.querySelector('ul').classList.toggle('hidden');
  });
  return title;
}

var microsecondsPerYear = 1000 * 60 * 60 * 24 * 365;
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
function createDomainElement(domainLastVisit, domainName) {
  var domainTime = createTimeElement(domainLastVisit);
  var domainTitle = createDomainTitle(domainName);
  var domainEntry = createDomainListItem();
  domainEntry.appendChild(domainTime);
  domainEntry.appendChild(domainTitle);
  return domainEntry;
}
function createSiteElement(site) {
  var time = createTimeElement(new Date(site.lastVisitTime));
  var siteEl = createSiteTitle(site);
  var siteEntry = createSiteContainer();
  siteEntry.appendChild(time);
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

chrome.history.search({
    'maxResults': 0,
    'text': '',
    'startTime': oneYearAgo
  },
  function(historyItems) {
    var history = getGroupedHistory(historyItems);
    var domainList = document.getElementById('domain_list');
    var previousDomainDateString = null;
    for( var i = 0; i < history['order'].length; i++) {
      var domainName = history['order'][i];
      var domainLastVisit = new Date(history['history'][domainName]['lastVisitTime']);
      var sites = history['history'][domainName].sites;

      if( i == 0 || (domainLastVisit.toDateString() != previousDomainDateString) ) {
        var dateHeader = createDateHeader('h3', domainLastVisit);
        domainList.appendChild(dateHeader);
        previousDomainDateString = domainLastVisit.toDateString();
      }

      var domainElement = createDomainElement(domainLastVisit, domainName);
      var siteList = createSiteList();

      var previousSiteDateString = null;
      for (var j = 0; j < sites.length; j++) {
        var site = sites[j];
        var siteLastVisit = new Date(site.lastVisitTime);
        
        if( j != 0 && (siteLastVisit.toDateString() != previousSiteDateString) ) {
          var dateHeader = createDateHeader('h4', siteLastVisit);
          siteList.appendChild(dateHeader);
          previousSiteDateString = siteLastVisit.toDateString();
        }

        var siteElement = createSiteElement(site);
        siteList.appendChild(siteElement);
      }

      domainElement.appendChild(siteList);
      domainList.appendChild(domainElement);
    }
  }
);