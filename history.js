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
  siteList.className = "hidden";
  return siteList;
}
chrome.history.search({
    'maxResults': 0,
    'text': '',
    'startTime': oneYearAgo
  },
  function(historyItems) {
    history = getGroupedHistory(historyItems);
    domainList = document.getElementById('domain_list');
    for( var i = 0; i < history['order'].length; i++) {
      var domainName = history['order'][i];
      var domainLastVisit = new Date(history['history'][domainName]['lastVisitTime']);
      var sites = history['history'][domainName].sites;

      var domainElement = createDomainElement(domainLastVisit, domainName);
      var siteList = createSiteList();

      for (var j = 0; j < sites.length; j++) {
        var site = sites[j];

        var siteElement = createSiteElement(site);
        siteList.appendChild(siteElement);
      }

      domainElement.appendChild(siteList);
      domainList.appendChild(domainElement);
    }
  }
);