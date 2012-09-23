console.log('hello');
//referrer = chrome.extension.getBackgroundPage().getReferrer();
////location = referrer
//
////h = chrome.extension.getBackgroundPage().getHistory();
//document.write("<ul>");
////for (var i = 0; i < referrer.length; i++) {
//    document.write("<li>" + referrer + "</li>");
////};
//document.write("</ul>");

//window.location = "http://www.google.com";
function getURLDomain(url) {
    return url.split('/')[2];
}

function getGroupedHistory(historyItems){
  groupedHistory = {};
  for(var i = 0; i < historyItems.length; i++) {
    var domain = getURLDomain(historyItems[i].url);
        //TODO link to other visits
        if(!groupedHistory.hasOwnProperty(domain)){
          groupedHistory[domain] = {
            lastAccessed : '',
            title : 'domain',
            sites : [] };
        }
        groupedHistory[domain].sites.push(historyItems[i]);
        //TODO insert sites by date
        //TODO order domains by date (create an array with references to these objs as well)
  }
  return groupedHistory;
}

var microsecondsPerYear = 1000 * 60 * 60 * 24 * 365;
var oneYearAgo = (new Date).getTime() - microsecondsPerYear;

//Ideally we want ALL history, but the function is buggy and I couldn't
//get it to return all available history
chrome.history.search({
    'maxResults': 0,
    'text': '',
    'startTime': oneYearAgo
  },
  function(historyItems) {
    groupedHistory = getGroupedHistory(historyItems);
    domainList = document.getElementById('domain_list');
    //TODO create a document fragment before inserting
    //TODO paginate results
    for( var group in groupedHistory) {
      if( groupedHistory.hasOwnProperty(group)){
        domainEl = document.createElement('li');
        domainEl.appendChild(document.createTextNode(group));
        siteList = document.createElement('ul');
        for( var i = 0; i < groupedHistory[group].sites.length; i++ ){
          site = groupedHistory[group].sites[i];
          siteEl = document.createElement('li');
          siteEl.appendChild(document.createTextNode(site.title));
          siteList.appendChild(siteEl);
        }
        domainEl.appendChild(siteList);
        domainList.appendChild(domainEl);
      }
    }
  }
);