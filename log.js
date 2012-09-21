//debugger;\
function log(t){console.log(t)}
a = document.links
for(var i = 0; i < a.length; i++){
    newHandler = function(event) {
      chrome.extension.sendRequest(this.getAttribute("href"), log);
    };
    a[i].addEventListener('click', newHandler, false)
}

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      location = request.referrer;  //TODO Instead of reloading referrer, load it in a js popup with the referring link highlighed
      $(document).ready(function() {
        var link = $("a[href=\"" + request.current + "\"]")[0];
        link.setAttribute("style", "border:0.25em solid red");
        link.scrollIntoView();
      });
      sendResponse({}); // snub them.
    });