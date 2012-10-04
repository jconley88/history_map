var Visit = Class.create({
	initialize: function(visitItem, historyItem){
		this.visitItem = visitItem;
		this.historyItem = historyItem;

    this.visitId = visitItem.visitId;
    this.visitTime = new Date(visitItem.visitTime);
  	this.url = historyItem.url;
  	this.title = historyItem.title;
	},

  setChildren: function(children){
    this.children = children;
  }
});
