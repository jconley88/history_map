referrer = chrome.extension.getBackgroundPage().getReferrer()
//location = referrer

//h = chrome.extension.getBackgroundPage().getHistory();
document.write("<ul>");
//for (var i = 0; i < referrer.length; i++) {
    document.write("<li>" + referrer + "</li>");
//};
document.write("</ul>");
//window.location = "http://www.google.com";