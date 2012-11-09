describe("Visit", function() {
  var obj;
  var visit;

  beforeEach(function() {
    obj = {
      id: "1000",
      referringVisitId: "9999",
      transition: "link",
      visitId: "10000",
      visitTime: 1000000000000,
      title: "craigslist",
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

  describe("setChildren", function() {
    it("should save the visitTime's of the children in the childrenIds array", function() {
      var child_1 = new Visit({visitTime: 1000000000001});
      var child_2 = new Visit({visitTime: 1000000000002});
      visit.setChildren([child_1, child_2]);
      expect(visit.childrenIds).toEqual([1000000000001, 1000000000002]);
    });
  });

  describe("childrenCount", function() {
    it("should return the length of the childrenIds array", function() {
      var child_1 = new Visit({visitTime: 1});
      var child_2 = new Visit({visitTime: 2});
      visit.setChildren([child_1, child_2]);
      expect(visit.childrenCount()).toEqual(2);
    });
  });

  describe("getChildren", function() {
    it("should return an array of the child visit objects when children are already loaded", function() {
      var children;
      var done = false;
      var child_1 = new Visit({visitTime: 1});
      var child_2 = new Visit({visitTime: 2});
      visit.setChildren([child_1, child_2]);
      visit.getChildren(function(c){
        children = c;
        done = true;
      });
      waitsFor(function(){
        return done;
      });
      runs(function(){
        expect(children).toEqual([child_1, child_2]);
      })
    });
  });

  describe("integration", function(){
    var visit2, visit3, visit4;

    beforeEach(function(){
      visit.save();

      obj2 = Object.clone(obj);
      obj2.visitTime = 1000000000005;
      visit2 = new Visit(obj2);
      visit2.save();

      obj3 = Object.clone(obj);
      obj3.visitTime = 1000000000006;
      visit3 = new Visit(obj3);
      visit3.save();

      obj4 = Object.clone(obj);
      obj4.visitTime = 1000000000010;
      visit4 = new Visit(obj4);
      visit4.save();
    });

    describe("count", function() {
      it("should return the number of items in the objectStore", function(){
        var count;
        waitFor = function (c) {
                        count = c;
                      };
        run = function (){
          expect(count).toEqual(4);
        };
        asyncHelper(Visit.count, waitFor, run);
      });
    });

    describe("getByDate", function(){
      it("should return items within the specified dates", function(){
        var waitFor, run, index2, index3, visitsByDate, bound;
        var start = 1000000000004;
        var end = 1000000000007;

        waitFor = function(err, result){
          visitsByDate = result;
        };
        run = function(){
          expect(visitsByDate.some(function(v){
            return v.visitTime === visit2.visitTime})).toBeTruthy();
          expect(visitsByDate.some(function(v){return v.visitTime === visit3.visitTime})).toBeTruthy();
          expect(visitsByDate.length).toEqual(2);
        };

        var bound = Visit.getByDate.bind(Visit, start, end);
        asyncHelper(bound, waitFor, run);
      });
    });

    describe("getChildren", function() {
      it("should return an array of the child visit objects when children have not been loaded", function() {
        var children;
        var done = false;
        visit.childrenIds = [visit2.visitTime, visit3.visitTime];
        visit.getChildren(function(c){
          children = c;
          done = true;
        });
        waitsFor(function(){
          return done;
        });
        runs(function(){
          expect(
            children.some(function(child){
              return child.visitTime === visit2.visitTime;
            })
          ).toBeTruthy();
          expect(
            children.some(function(child){
              return child.visitTime === visit3.visitTime;
            })
          ).toBeTruthy();
        });
      });
    });
  });
});