const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');
// TODO: COPY ACCESS TOKEN HERE
// const token = ""
const spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(token);
var paused = false;

// Setup Leap loop with frame callback function
var controllerOptions = {enableGestures: true, loopWhileDisconnected: false};

var controller = Leap.loop(controllerOptions, function(frame){
  
  var resultPut = document.getElementById("resultData");
  var gestureOutput = document.getElementById("gestureData");
  var statusOutput = document.getElementById("statusData");
  var resultOutput = "";
  var gestureString = "";
  var statusString = "";


  updateStatus();
  if (paused) {
    statusString = "busy";
    statusOutput.innerHTML = statusString;
    sleep(1000);
    return; // Skip this update
  } else {
    statusString = "READY";
    statusOutput.innerHTML = statusString;
  }


  if (frame.gestures.length > 0){
    for (var i = 0; i < frame.gestures.length; i++) {
      if (paused){
          return;
      }
      var gesture = frame.gestures[i];
      var resultOutput = "";
      resultPut.innerHTML = resultOutput;

      switch (gesture.type) {
        case "circle":
          if (frame.hands.length == 1){
            var hand = frame.hands[0];
            var grabStrength = hand.grabStrength;
            var handExtended = getExtendedFingers(hand);
            if (handExtended == 1 && hand.indexFinger.extended){
              var pointableID = gesture.pointableIds[0];
              var direction = frame.pointable(pointableID).direction;
              var dotProduct = Leap.vec3.dot(direction, gesture.normal);
              statusString = "BUSY";
              statusOutput.innerHTML = statusString;
              updateStatus();
              spotifyApi.getMyCurrentPlaybackState()
              .then(function(data) {
                // Output items
                if (data.body && data.body.device) {
                  var  currentVolume = data.body.device.volume_percent;
                  if (dotProduct > 0) { // clockwise
                    gestureString =  "clockwise circle";
                    gestureOutput.innerHTML = gestureString;
                    var volume = currentVolume + 10;
                  } else { //counterclockwise
                    var volume = currentVolume - 10;
                    gestureString =  "counterclockwise circle";
                    gestureOutput.innerHTML = gestureString; 
                  }

                  if (volume < 0) {
                    volume = 0;
                  } else if (volume > 100) {
                    volume = 100;
                  }

                  // Set Volume For User's Playback
                  spotifyApi.setVolume(volume)
                  .then(function () {
                    console.log('Setting volume to .' + volume);
                    resultOutput += "Volume at " + volume + "%"; 
                    resultPut.innerHTML = resultOutput;
                    updateSymbol();
                  }, function(err) {
                    console.log('Something went wrong!', err);
                  });
                } 
              }, function(err) {
                console.log('Something went wrong!', err);
              });
              togglePause();
            }
            break;
          }
        case "swipe":
          controller.disconnect();
          if (frame.hands.length == 1){
            if (frame.hands[0].getExtendedFingers < 4 || frame.hands[0].pinchStrength > 0.3){
              controller.connect();
              break;
            }
          } else {
            controller.connect();
            break;
          }
          if (paused){
              controller.connect();
              break;
          }
          // right swipe
          if(gesture.direction[0] > 0){
            gestureString =  "right swipe";
            gestureOutput.innerHTML = gestureString;
            statusString = "BUSY";
            statusOutput.innerHTML = statusString;
            updateStatus();
            spotifyApi.skipToNext()
              .then(function() {
                  resultOutput += "Skip to next"; 
                  resultPut.innerHTML = resultOutput;
                  updateSymbol();
                  controller.connect();
               }, function(err) {
                  //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
                  console.log('Something went wrong!', err);
               });
          // left swipe
          } else {  
              gestureString =  "left swipe";
              gestureOutput.innerHTML = gestureString;
              statusString = "BUSY";
              statusOutput.innerHTML = statusString;
              updateStatus();
              spotifyApi.skipToPrevious()
                .then(function() {
                    resultOutput += "Skip to previous"; 
                    resultPut.innerHTML = resultOutput;
                    updateSymbol();
                    controller.connect();
                 }, function(err) {
                    console.log('Something went wrong!', err);
                 });
          }
          togglePause();
          break;

        case "keyTap":
          gestureString =  "key tap";
          gestureOutput.innerHTML = gestureString;
          spotifyApi.getMyCurrentPlaybackState()
          .then(function(data) {
            // Output items
            if (data.body && data.body.item) {
              var songID = data.body.item.id;
              spotifyApi.containsMySavedTracks([songID])
              .then(function(data) {
                // An array is returned, where the first element corresponds to the first track ID in the query
                var trackIsInYourMusic = data.body[0];
                if (trackIsInYourMusic) {
                  console.log('Track was found in the user\'s Your Music library');
                  spotifyApi.removeFromMySavedTracks([songID])
                  .then(function(data) {
                    resultOutput += "Removed from Liked Songs"; 
                    resultPut.innerHTML = resultOutput;
                    updateSymbol();
                  }, function(err) {
                    console.log('Something went wrong!', err);
                  });
                } else {
                  console.log('Track was not found.');
                  // Add tracks to the signed in user's Your Music library
                  spotifyApi.addToMySavedTracks([songID])
                  .then(function(data) {
                    resultOutput += "Added to Liked Songs"; 
                    resultPut.innerHTML = resultOutput;
                    updateSymbol();
                  }, function(err) {
                    console.log('Something went wrong!', err);
                  });
                }
              }, function(err) {
                console.log('Something went wrong!', err);
              });
            } 
          }, function(err) {
            console.log('Something went wrong!', err);
          });
          togglePause();
          break;
        
        default:
         
      }
      resultPut.innerHTML = resultOutput;
    }
  } else {
    if (frame.hands.length == 1){
      var hand = frame.hands[0];
      var grabStrength = hand.grabStrength;
      var handExtended = getExtendedFingers(hand);
      if (grabStrength == 1 && handExtended == 0){
        if (paused){
          return;
        } else {
          controller.disconnect();
          resultOutput += "pause"; 
          gestureString += "fist"
          gestureOutput.innerHTML = gestureString;
          resultPut.innerHTML = resultOutput;
          statusString = "BUSY";
          statusOutput.innerHTML = statusString;
          updateStatus();   
          updateSymbol();
          pauseMusic();
          controller.connect();
        } 
      } 
      
    // two flat hands: play
    } else if (frame.hands.length == 2){
      var hand1 = frame.hands[0];
      var hand2 = frame.hands[1];
      var hand1Extended = getExtendedFingers(hand1);
      var hand2Extended = getExtendedFingers(hand2);
      var grabStrength1 = hand1.grabStrength;
      var grabStrength2 = hand2.grabStrength;
      if(grabStrength1 == 0 && grabStrength2 == 0 && hand1Extended == 5 && hand2Extended == 5){ 
        if (paused){
          return;
        } else {
          resultOutput += "Play"; 
          gestureString += "flat hands"
          gestureOutput.innerHTML = gestureString;
          resultPut.innerHTML = resultOutput;
          resultPut.innerHTML = resultOutput;
          statusString = "BUSY";
          statusOutput.innerHTML = statusString;
          updateStatus();
          updateSymbol();
          playMusic();
        }   
      }
    }
  }
});

function getExtendedFingers(hand){
  var extendedFingers = 0;
    for(var f = 0; f < hand.fingers.length; f++){
         var finger = hand.fingers[f];
        if(finger.extended) extendedFingers++;
  } 
  return extendedFingers;
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
  togglePause();
}

function togglePause() {
  paused = !paused;
}



function pauseMusic(){
  spotifyApi.getMyCurrentPlaybackState()
  .then(function(data) {
    // Output items
    if (data.body && data.body.is_playing) {
      console.log("User is currently playing something!");
      spotifyApi.pause()
      .then(function() {
        console.log('Playback paused');
        //  resultOutput += "Playback paused"; 
        //  resultPut.innerHTML = resultOutput;
      }, function(err) {
        //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
        console.log('Something went wrong!', err);
      });
    } else {
      console.log("User is not playing anything, or doing so in private.");       
    }
    });  
    togglePause();
    
    return;
}

function playMusic(){
  spotifyApi.getMyCurrentPlaybackState()
  .then(function(data) {
    // Output items
    if (data.body && data.body.is_playing) {
      console.log("Playing Already")
    } else {
      spotifyApi.play()
        .then(function() {
        console.log('Playback started');
        }, function(err) {
          //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
          console.log('Something went wrong!', err);
        });      
    }
  });  
  togglePause();
  return;
}

// processSpeech(transcript)
//  Is called anytime speech is recognized by the Web Speech API
// Input: 
//    transcript, a string of possibly multiple words that were recognized
// Output: 
//    processed, a boolean indicating whether the system reacted to the speech or not
var processSpeech = function(transcript) {
  // Helper function to detect if any commands appear in a string
  var userSaid = function(str, commands) {
    for (var i = 0; i < commands.length; i++) {
      if (str.indexOf(commands[i]) > -1)
        return true;
    }
    return false;
  };
  console.log("TRANSCRIPT: ", transcript);



  if (userSaid(transcript, ["command", "Command", "commands", "Commands"])){
    if (userSaid(transcript, ["gesture", "Gesture", "gestures", "Gestures"])){
      const accordion = document.getElementsByClassName('contentHeader');
      accordion[0].classList.toggle('active');
    } else if (userSaid(transcript, ["voice", "Voice", "voices", "Voices"])) {
      const accordion = document.getElementsByClassName('contentHeader');
      accordion[1].classList.toggle('active');
    }
  }


  if (userSaid(transcript, ["queue", "Queue", "q", "Q"])) {
    if (userSaid(transcript, ["happy", "Happy"])) {
      // Search playlists whose name or description contains 'happy'
      updateEmotion("HAPPY");
      spotifyApi.searchPlaylists('happy')
      .then(function(data) {
        console.log('Found playlists are', data.body);
        // Get a playlist
        spotifyApi.getPlaylist(data.body["playlists"]["items"]["0"]["uri"].split(":")[2])
        .then(function(data) {
          console.log('Some information about this playlist', data.body);
          for (i = 0; i < 5; i++) {
            index = Math.floor(Math.random() * data.body["tracks"]["items"]["length"]);
            spotifyApi.addTrackToQueue(data.body["tracks"]["items"][index.toString()]["track"]["uri"])
            .then(function(){
            }, function(err){
            console.log("Something went wrong", err);
            });
          }
        }, function(err) {
          console.log('Something went wrong!', err);
        });
      }, function(err) {
        console.log('Something went wrong!', err);
      });
    } else if (userSaid(transcript, ["sad", "Sad"])) {
      // Search playlists whose name or description contains 'sad'
      updateEmotion("SAD");
      spotifyApi.searchPlaylists('sad')
      .then(function(data) {
        console.log('Found playlists are', data.body);
        // Get a playlist
        spotifyApi.getPlaylist(data.body["playlists"]["items"]["0"]["uri"].split(":")[2])
        .then(function(data) {
          console.log('Some information about this playlist', data.body);
          for (i = 0; i < 5; i++) {
            index = Math.floor(Math.random() * data.body["tracks"]["items"]["length"]);
            spotifyApi.addTrackToQueue(data.body["tracks"]["items"][index.toString()]["track"]["uri"])
            .then(function(){
            }, function(err){
            console.log("something went wrong", err);
            });
          }
        }, function(err) {
          console.log('Something went wrong!', err);
        });
      }, function(err) {
        console.log('Something went wrong!', err);
      });
    } else if (userSaid(transcript, ["angry", "Angry"])) {
      // Search playlists whose name or description contains 'angry'
      updateEmotion("ANGRY");
      spotifyApi.searchPlaylists('angry')
      .then(function(data) {
        console.log('Found playlists are', data.body);
        // Get a playlist
        spotifyApi.getPlaylist(data.body["playlists"]["items"]["1"]["uri"].split(":")[2])
        .then(function(data) {
          console.log('Some information about this playlist', data.body);
          for (i = 0; i < 5; i++) {
            index = Math.floor(Math.random() * data.body["tracks"]["items"]["length"]);
            spotifyApi.addTrackToQueue(data.body["tracks"]["items"][index.toString()]["track"]["uri"])
            .then(function(){
            }, function(err){
            console.log("Something went wrong", err);
            });
          }
        }, function(err) {
          console.log('Something went wrong!', err);
        });
      }, function(err) {
        console.log('Something went wrong!', err);
      });
    } else if (userSaid(transcript, ["surprise", "Surprise"])) {
      // Search playlists whose name or description contains 'surprise'
      updateEmotion("SURPRISE");
      spotifyApi.searchPlaylists('surprise')
      .then(function(data) {
        console.log('Found playlists are', data.body);
        // Get a playlist
        spotifyApi.getPlaylist(data.body["playlists"]["items"]["3"]["uri"].split(":")[2])
        .then(function(data) {
          console.log('Some information about this playlist', data.body);
          for (i = 0; i < 5; i++) {
            index = Math.floor(Math.random() * data.body["tracks"]["items"]["length"]);
            spotifyApi.addTrackToQueue(data.body["tracks"]["items"][index.toString()]["track"]["uri"])
            .then(function(){
            }, function(err){
            console.log("something went wrong", err);
            });
          }
        }, function(err) {
          console.log('Something went wrong!', err);
        });
      }, function(err) {
        console.log('Something went wrong!', err);
      });
    }
  };
};


// speech recognition setup
var debouncedProcessSpeech = _.debounce(processSpeech, 500);

var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.onresult = function(event) {
  // Build the interim transcript, so we can process speech faster
  var transcript = '';
  var hasFinal = false;
  for (var i = event.resultIndex; i < event.results.length; ++i) {
    if (event.results[i].isFinal)
      hasFinal = true;
    else
      transcript += event.results[i][0].transcript;
  }
  debouncedProcessSpeech(transcript);
};
recognition.start();

// Restart recognition if it has stopped
recognition.onend = function(event) {
  setTimeout(function() {
    recognition.start();
  }, 1000);
};


// UI Code: Update Symbols and Gesture Status 
function updateStatus(){
  var status = document.getElementById("statusData");
  if (status.textContent === "BUSY"){
    status.style.color = "red";
  } else{
    status.style.color = "green";
  }
}

function updateEmotion(emotion){
  var status = document.getElementById("emotionData");
  status.innerHTML = emotion;
}

function updateSymbol(){
  var pauseImg = document.getElementById("pausedSymbol");
  var nextImg = document.getElementById("nextSymbol");
  var playImg =  document.getElementById("playSymbol");
  var previousImg = document.getElementById("previousSymbol");
  var volumeImg = document.getElementById("volumeSymbol");
  var likeImg = document.getElementById("likeSymbol");
  var unlikeImg = document.getElementById("unlikeSymbol");
  var symbolView =document.getElementById("resultData").textContent;
  switch(symbolView){
    case "pause":
      pauseImg.style.display = "inline";
      nextImg.style.display = "none";
      playImg.style.display = "none";
      previousImg.style.display = "none";
      volumeImg.style.display = "none";
      likeImg.style.display = "none";
      unlikeImg.style.display = "none";
      break;
    case "Skip to next":
      pauseImg.style.display = "none";
      nextImg.style.display = "inline";
      playImg.style.display = "none";
      previousImg.style.display = "none";
      volumeImg.style.display = "none";
      likeImg.style.display = "none";
      unlikeImg.style.display = "none";
      break;
    case "Skip to previous":
      pauseImg.style.display = "none";
      nextImg.style.display = "none";
      playImg.style.display = "none";
      previousImg.style.display = "inline";
      volumeImg.style.display = "none";
      likeImg.style.display = "none";
      unlikeImg.style.display = "none";
      break;
    case "Play":
      pauseImg.style.display = "none";
      nextImg.style.display = "none";
      playImg.style.display = "inline";
      previousImg.style.display = "none";
      volumeImg.style.display = "none";
      likeImg.style.display = "none";
      unlikeImg.style.display = "none";
      break; 
    default:
      if (symbolView.includes("Volume")){
        pauseImg.style.display = "none";
        nextImg.style.display = "none";
        playImg.style.display = "none";
        previousImg.style.display = "none";
        volumeImg.style.display = "inline";
        likeImg.style.display = "none";
        unlikeImg.style.display = "none";
        
      } else if (symbolView.includes("Removed")){
        pauseImg.style.display = "none";
        nextImg.style.display = "none";
        playImg.style.display = "none";
        previousImg.style.display = "none";
        volumeImg.style.display = "none";
        likeImg.style.display = "none";
        unlikeImg.style.display = "inline";
      
      } else if (symbolView.includes("Added")){
        pauseImg.style.display = "none";
        nextImg.style.display = "none";
        playImg.style.display = "none";
        previousImg.style.display = "none";
        volumeImg.style.display = "none";
        likeImg.style.display = "inline";
        unlikeImg.style.display = "none";

      }
      else {
        pauseImg.style.display = "none";
        nextImg.style.display = "none";
        playImg.style.display = "none";
        previousImg.style.display = "none";
        volumeImg.style.display = "none";
      }
      
      break;
  }
}
