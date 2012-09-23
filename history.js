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
            lastAccessed : '',
            title : 'domain',
            sites : [] };
        }
        groupedHistory[domain].sites.push(historyItems[i]);
        //TODO insert sites by date
  }
  return { order: groupedHistoryOrder, history: groupedHistory };
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
    history = getGroupedHistory(historyItems);
    domainList = document.getElementById('domain_list');
    for( var i = 0; i < history['order'].length; i++){
      var group = history['order'][i];
      domainEl = document.createElement('li');
      domainEl.className = "domainName";
      domainEl.appendChild(document.createTextNode(group));
      siteList = document.createElement('ul');
      siteList.className = "hidden";
      domainEl.addEventListener('click', function(){
          this.querySelector('ul').classList.toggle('hidden');
      });
      for( var j = 0; j < history['history'][group].sites.length; j++ ){
        var site = history['history'][group].sites[j];
        var siteEntry = document.createElement('div');
        siteEntry.className = 'entry';

        var time = document.createElement('div');
        time.className = 'time';
        time.innerHTML = formatAMPM( new Date(site.lastVisitTime) );

        var siteEl = document.createElement('span');
        siteEl.innerHTML = site.title;

        siteEntry.appendChild(time);
        siteEntry.appendChild(siteEl);

        siteList.appendChild(siteEntry);
      }
      domainEl.appendChild(siteList);
      domainList.appendChild(domainEl);
    }
  }
);