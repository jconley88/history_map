describe("Visit", function() {
  var visitItem;
  var historyItem;
  var visit;

  beforeEach(function() {
    visitItem = {
      id: "3083",
      referringVisitId: "69346",
      transition: "link",
      visitId: "69347",
      visitTime: 1351628501393.405
    };
    historyItem = {
      id: "3083",
      lastVisitTime: 1351628501393.405,
      title: "craigslist: philadelphia classifieds for jobs, apartments, personals, for sale, services, community, and events",
      typedCount: 2,
      url: "http://philadelphia.craigslist.org/",
      visitCount: 23
    };
    visit = new Visit(visitItem, historyItem);
  });

  describe("visitId", function() {
    it("should return the original visitId", function() {
      expect(visit.visitId).toEqual(visitItem.visitId);
    });
  });

  describe("transition", function() {
    it("should return the original transition", function() {
      expect(visit.transition).toEqual(visitItem.transition);
    });
  });

  describe("referringVisitId", function() {
    it("should return the original referringVisitId", function() {
      expect(visit.referringVisitId).toEqual(visitItem.referringVisitId);
    });
  });

  describe("visitTime", function() {
    it("should return the original visitTime", function() {
      expect(visit.visitTime).toEqual(visitItem.visitTime);
    });
  });

  describe("visitDate", function() {
    it("should return the original visitDate", function() {
      expect(visit.visitDate).toEqual(new Date(visitItem.visitTime));
    });
  });

  describe("url", function() {
    it("should return the original url", function() {
      expect(visit.url).toEqual(historyItem.url);
    });
  });

  describe("title", function() {
    it("should return the original title", function() {
      expect(visit.title).toEqual(historyItem.title);
    });
  });

//  describe("integration", function(){
//    beforeEach(function(){
//      visit_1 = new Visit()
//    });
//
//    describe("count", function() {
//      it("should return the number of items in the objectStore", function(){
//
//      });
//    });
//  });
});