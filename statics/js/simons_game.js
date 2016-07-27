$(document).ready(function(){
  //import switch from bootstrap  
  $("[name='my-checkbox']").bootstrapSwitch();
  
  var game = { //game object
    onOrOff : false, //game on or off
    strict: false, // strict on or off
    err: false, // did player miss
    playTurn: false, // true player, false machine
    score: 0, //current score
    shape: '.shape', // cached string for the pad class
    genSeq: [], //array containing the generated/randomized pads
    playerSeq: [], //array containing the users pad selections
    savedTimer: []
  }
  
  //Audio Part, *credict - https://codepen.io/Em-Ant/full/QbRyqq/
  var AudioContext = window.AudioContext || window.webkitAudioContext || false;
  var audioCtx = new AudioContext();
  //var frequencies = [329.63,261.63,220,500.81];
  var frequencies = [220, 320, 420, 520];
  var errOsc = audioCtx.createOscillator();
  errOsc.type = 'triangle';
  errOsc.frequency.value = 110;
  errOsc.start(0.0); //delay optional parameter is mandatory on Safari
  var errNode = audioCtx.createGain();
  errOsc.connect(errNode);
  errNode.gain.value = 0;
  errNode.connect(audioCtx.destination);
  var ramp = 0.1;
  var vol = 0.5;
  // create Oscillators
  var oscillators = frequencies.map(function(frq){
    var osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frq;
    osc.start(0.0); //delay optional parameter is mandatory on Safari
    return osc;
  });
  var gainNodes = oscillators.map(function(osc){
    var g = audioCtx.createGain();
    osc.connect(g);
    g.connect(audioCtx.destination);
    g.gain.value = 0;
    return g;
  });
  
  //Sounds on when pad is pressed or played
  function playGoodTone(num){
    gainNodes[num].gain
      .linearRampToValueAtTime(vol, audioCtx.currentTime + ramp);
  };
  
  //Sounds off when pad is released or finished playing
  function stopGoodTones(){
    gainNodes.forEach(function(g){
      g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
    });
  };
  
  //Error sound on when player making mistakes
  function playErrTone(){
    errNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + ramp);
    document.getElementById("myScore").value = "!!";
  };
  
  //Error sound off when pad is released
  function stopErrTone(){
    errNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
    if (game.score < 10) {
      document.getElementById("myScore").value = "0" + game.score.toString();
    }
    else {
      document.getElementById("myScore").value = game.score.toString();
    }
  };
    
  //Play the generated seqence 
  function playGenSeq() {
    game.playerTurn = false;
    var delay = 500;
    for (var j = 0; j < game.genSeq.length; j++) {
      if (game.onOrOff) {
        var seqIndex = game.genSeq[j];
        var padFlash = "shape" + seqIndex.toString();
        game.savedTimer.push(window.setTimeout(padLightOn_ret(padFlash, seqIndex), delay));
        delay += 1000;
        game.savedTimer.push(window.setTimeout(padLightOff_ret(padFlash), delay));
        delay += 500;
      } 
    }
    window.setTimeout(function() {game.playerTurn = true;}, delay - 500);
  }
  
  //Add a random 1-4 number to game.genSeq
  function addToSeq() {
    var random = Math.floor((Math.random() * 4) + 1);
    game.genSeq.push(random);
  }
  
  //Clear current score, reset it to "--"
  function clearScore() {
    game.score = 0;
    document.getElementById("myScore").value = "--";
  }
  
  //Clear all stored data to initial state
  function resetGame() {
    stopGoodTones();
    stopErrTone();
    clearScore();
    game.genSeq = [];
    game.playerSeq = [];
    game.err = false;
  }
  
  //Switch events, turing socre light on/off, strict light off
  $('input[name="my-checkbox"]').on('switchChange.bootstrapSwitch', function(event, state) {
    if (state) {
      game.onOrOff = true;
      document.getElementsByClassName("score")[0].setAttribute("style", "color: #CC0000");
    }
    else {
      game.onOrOff = false;
      resetGame();
      document.getElementsByClassName("score")[0].setAttribute("style", "color: #610B21");
      document.getElementsByClassName("light-strict")[0].setAttribute("style", "background: #3B0B0B");
      document.getElementById("myScore").value = "--";
    }
  }); 
  
  //Adjust strict or not by pressing STRICT button
  $(".btn-strict").on("click", function(){
    if (game.onOrOff && !game.strict) {
      document.getElementsByClassName('light-strict')[0].setAttribute("style", "background: #FF0040"); 
      game.strict = true;
    }
    else if (game.onOrOff && game.strict) {
      document.getElementsByClassName('light-strict')[0].setAttribute("style", "background: #3B0B0B"); 
      game.strict = false;
    }  
  });   
  
  //Start or restart the game by pressing START button
  $(".btn-start").on("click", function(){
    if (game.onOrOff && game.genSeq.length === 0) {
      addToSeq();
      playGenSeq();
    }
    else if (game.onOrOff) {
      resetGame();
      for (var i = 0; i < game.savedTimer.length; i++)
      {
        clearTimeout(game.savedTimer[i]);
      }
      game.savedTimer = [];
      document.getElementsByClassName("pad")[0].style.opacity = "0.5";
      addToSeq();
      playGenSeq();
    } 
  });  

  //In order to fix the variable scope
  function padLightOn_ret(padFlash, seqIndex) {
      return function() { padLightOn(padFlash, seqIndex) };
  }
  
  //In order to fix the variable scope
  function padLightOff_ret(padFlash) {
      return function() { padLightOff(padFlash) };
  }
  
  //Light up a pad, "pad": shape1-shape4, "padNum": 1-4, 
  function padLightOn(pad, padNum) {
    console.log("inside padLightOn game.playerTurn: " + game.playerTurn);
    if (game.onOrOff) {
      document.getElementsByClassName(pad)[0].style.opacity = "0.9";
      playGoodTone(padNum - 1);
    } 
  }
  
  //Light off a pad, "pad": shape1-shape4, "padNum": 1-4, 
  function padLightOff(pad) {
    document.getElementsByClassName(pad)[0].style.opacity = "0.5";
    stopGoodTones();
  }
  
  //Score increase by 1
  function addToScore() {
    if ($(".score").val() === "--") {
      document.getElementById("myScore").value = "01";
    }
    game.score += 1;
    if (game.score < 10) {
      document.getElementById("myScore").value = "0" + game.score.toString();
    }
    else {
      document.getElementById("myScore").value = game.score.toString();
    } 
  }
  
  //Player's turn mousedown event
  $(".pad").mousedown(function(){
    console.log("inside mousedown game.playerTurn: " + game.playerTurn);
    if (game.onOrOff && game.playerTurn) {
      this.style.opacity = 0.9;
      var padNum = parseInt(this.className.split(" ")[1][5]);
      game.playerSeq.push(padNum);

      if (padNum === game.genSeq[game.playerSeq.length - 1]) {
        playGoodTone(padNum - 1);
      }
      else {
        playErrTone();
        game.err = true;
      }
    }
  });
  
  //Player'turn mouseup event
  $(".pad").mouseup(function(){
    if (game.onOrOff && game.playerTurn) {
      this.style.opacity = 0.5;
      stopGoodTones();
      stopErrTone();
      if (game.err) {
        if (game.strict) {
          clearScore();
          game.genSeq = [];
          game.playerSeq = [];
          game.err = false;
          addToSeq();
          playGenSeq(); 
        }
        else {  
          game.playerSeq = [];
          game.err = false;
          playGenSeq();
        }
      }
      else {
        if (game.playerSeq.length === game.genSeq.length) {
          game.playerSeq = [];
          addToScore();  
          addToSeq();
          playGenSeq(); 
        }    
      } 
    } 
  });   
});
