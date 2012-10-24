describe("Link", function() {
  var link, callback;

  beforeEach(function() {
    callback = jasmine.createSpy();
    link = tabsLink(callback);
  });

  describe("addSourceVisitId", function(){
    it("should set the sourceVisitId", function(){
      link.addSourceVisitId('sourceVisitId');
      expect(link.sourceVisitId()).toEqual('sourceVisitId');
    });

    it("should NOT invoke the callback if it is called before the destinationVisitId is set", function(){
      link.addSourceVisitId('sourceVisitId');
      expect(callback).not.toHaveBeenCalled();
    });

    it("should invoke the callback with self if destinationVisitId is set first", function(){
      link.addDestinationVisitId('destinationVisitId');
      link.addSourceVisitId('sourceVisitId');
      expect(callback).toHaveBeenCalledWith(link);
    });
  });

  describe("addDestinationVisitId", function(){
    it("should set the destinationVisitId", function(){
      link.addDestinationVisitId('destinationVisitId');
      expect(link.destinationVisitId()).toEqual('destinationVisitId');
    });

    it("should NOT invoke the callback if it is called before the destinationVisitId is set", function(){
      link.addDestinationVisitId('destinationVisitId');
      expect(callback).not.toHaveBeenCalled();
    });

    it("should invoke the callback with self if sourceVisitId is set first", function(){
      link.addSourceVisitId('sourceVisitId');
      link.addDestinationVisitId('destinationVisitId');
      expect(callback).toHaveBeenCalledWith(link);
    });
  });
});