beforeEach(function() {
  this.addMatchers({
    toBePlaying: function(expectedSong) {
      var player = this.actual;
      return player.currentlyPlayingSong === expectedSong && 
             player.isPlaying;
    }
  });
});

function asyncHelper(asyncMethod, callback, afterCallback){
   var done = false;

   function wrapper(wrapped){
     return function(){
       wrapped.apply(wrapped, arguments);
       done = true;
     }
   }
   asyncMethod(
     wrapper(
       callback
     )
   );

   var isDone = function(){
     return done;
   };

   waitsFor(function(){
     return isDone();
   });
   runs(function(){
     afterCallback();
   })
 }