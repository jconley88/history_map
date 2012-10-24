describe("LinkedTabs", function() {
  var links;

  beforeEach(function() {
    links = linkedTabs();
  });

  describe("getLink", function() {
    var link;

    beforeEach(function() {
      link = tabsLink(function(){});
      link.addSourceVisitId('source');
      link.addDestinationVisitId('destination');
    });

    it("should retrieve the sourceId after the link has been added", function() {
      var sourceId;
      links.addLink(link);
      sourceId = links.getSourceId('destination');
      expect(sourceId).toEqual('source');
    });
  });
});