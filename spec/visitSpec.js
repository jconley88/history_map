describe("Visit", function() {
  var obj;
  var visit;

  beforeEach(function() {
    obj = {
      id: "3083",
      referringVisitId: "69346",
      transition: "link",
      visitId: "69347",
      visitTime: 1351628501393.405,
      title: "craigslist: philadelphia classifieds for jobs, apartments, personals, for sale, services, community, and events",
      url: "http://philadelphia.craigslist.org/"
    };
    visit = new Visit(obj);
  });

  describe("visitId", function() {
    it("should return the original visitId", function() {
      expect(visit.visitId).toEqual(obj.visitId);
    });
  });

  describe("transition", function() {
    it("should return the original transition", function() {
      expect(visit.transition).toEqual(obj.transition);
    });
  });

  describe("referringVisitId", function() {
    it("should return the original referringVisitId", function() {
      expect(visit.referringVisitId).toEqual(obj.referringVisitId);
    });
  });

  describe("visitTime", function() {
    it("should return the original visitTime", function() {
      expect(visit.visitTime).toEqual(obj.visitTime);
    });
  });

  describe("visitDate", function() {
    it("should return the original visitDate", function() {
      expect(visit.visitDate).toEqual(new Date(obj.visitTime));
    });
  });

  describe("url", function() {
    it("should return the original url", function() {
      expect(visit.url).toEqual(obj.url);
    });
  });

  describe("title", function() {
    it("should return the original title", function() {
      expect(visit.title).toEqual(obj.title);
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