describe("Visit", function() {

  describe("visitId", function() {
    it("should return the original visitId", function() {
      var visit = new Visit({visitId: 10});
      expect(visit.visitId).toEqual(10);
    });
  });

  describe("transition", function() {
    it("should return the original transition", function() {
      var visit = new Visit({transition: 'link'});
      expect(visit.transition).toEqual('link');
    });
  });

  describe("referringVisitId", function() {
    it("should return the original referringVisitId", function() {
      var visit = new Visit({referringVisitId: 10});
      expect(visit.referringVisitId).toEqual(10);
    });
  });

  describe("visitTime", function() {
    it("should return the original visitTime", function() {
      var visit = new Visit({visitTime: 1000000000000});
      expect(visit.visitTime).toEqual(1000000000000);
    });
  });

  describe("visitDate", function() {
    it("should return the original visitDate", function() {
      var visit = new Visit({visitTime: 1000000000000});
      expect(visit.visitDate).toEqual(new Date(1000000000000));
    });
  });

  describe("url", function() {
    it("should return the original url", function() {
      var visit = new Visit({url: 'http:'});
      expect(visit.url).toEqual('http:');
    });
  });

  describe("title", function() {
    it("should return the original title", function() {
      var visit = new Visit({title: 'title'});
      expect(visit.title).toEqual('title');
    });
  });

  describe("childrenIds", function(){
    it("should return an empty array if no children have been set", function(){
      var visit = new Visit({});
      expect(visit.childrenIds).toEqual([]);
    });
  });

  describe("setChildren", function() {
    it("should save the id of the children in the childrenIds array", function() {
      var visit = new Visit({});
      var child_1 = new Visit({id: 1});
      var child_2 = new Visit({id: 2});
      visit.setChildren([child_1, child_2]);
      expect(visit.childrenIds).toEqual([1, 2]);
    });

    it("should save the children objects in the children attribute", function() {
      var visit = new Visit({});
      var child_1 = new Visit({id: 1});
      var child_2 = new Visit({id: 2});
      visit.setChildren([child_1, child_2]);
      expect(visit.children).toEqual([child_1, child_2]);
    });
  });

  describe("childrenCount", function() {
    it("should return the length of the childrenIds array", function() {
      var visit = new Visit({});
      var child_1 = new Visit({visitTime: 1});
      var child_2 = new Visit({visitTime: 2});
      visit.setChildren([child_1, child_2]);
      expect(visit.childrenCount()).toEqual(2);
    });
  });

  describe("getChildren", function() {
    it("should return an empty array if no children have been set", function(){
      var children;
      var done = false;
      var visit = new Visit({});
      visit.getChildren(function(c){
        children = c;
        done = true;
      });
      waitsFor(function(){
        return done;
      });
      runs(function(){
        expect(children).toEqual([]);
      });
    });

    it("should return an array of the child visit objects when children are already loaded", function() {
      var children;
      var done = false;
      var visit = new Visit({});
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
    describe("save", function(){
      it("should assign an id to the instantiated object", function(){
        visit = new Visit({});
        visit.save();

        waitsFor(function(){
          return visit.id;
        }, "id was never set", 50);
        runs(function(){
          expect(visit.id).toBeTruthy();
        });
      });
    });

    describe("count", function() {
      it("should return the number of items in the objectStore", function(){
        var count;
        var times = 4;
        var done = false;
        for(i = 0; i < times; i++){
          createVisit({});
        }
        Visit.count(function(c){
          count = c;
          done = true;
        });
        waitsFor(function () {
          return done;
        });
        runs(function (){
          expect(count).toEqual(times);
        });
      });
    });

    describe("getByDate", function(){
      it("should return items within the specified dates", function(){
        var visitsByDate, visit2, visit3;
        var start = 1000000000004;
        var end = 1000000000007;

        createVisit({visitTime:1000000000000 });
        visit2 = createVisit({visitTime:1000000000005 });
        visit3 = createVisit({visitTime:1000000000006 });
        createVisit({visitTime:10000000000010 });
        Visit.getByDate(start, end, function(err, result){
          visitsByDate = result;
        });
        waitsFor(function(){
          return visitsByDate;
        });
        runs(function(){
          expect(visitsByDate.some(function(v){
            return v.visitTime === visit2.visitTime})).toBeTruthy();
          expect(visitsByDate.some(function(v){return v.visitTime === visit3.visitTime})).toBeTruthy();
          expect(visitsByDate.length).toEqual(2);
        });
      });
    });

    describe("getChildren", function() {
      it("should return an array of the child visit objects when children have not been loaded", function() {
        var children, visit, visit2, visit3;
        visit2 = createVisit({id: 2});
        visit3 = createVisit({id: 3});
        visit = new Visit({});
        visit.childrenIds = [visit2.id, visit3.id];
        visit.getChildren(function(c){
          children = c;
        });
        waitsFor(function(){
          return children;
        }, "children to be returned from the database", 50);
        runs(function(){
          expect(
            children.some(function(child){
              return child.id === visit2.id;
            })
          ).toBeTruthy();
          expect(
            children.some(function(child){
              return child.id === visit3.id;
            })
          ).toBeTruthy();
        });
      });
    });
  });
});

function createVisit(obj){
  var visit = new Visit(obj);
  visit.save();
  return visit;
}