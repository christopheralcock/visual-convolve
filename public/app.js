

navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);
						  
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var voiceSelect = document.getElementById("voice");
var source;
var stream;

//set up the different audio nodes we will use for the app

var analyser1 = audioCtx.createAnalyser();
analyser1.minDecibels = -90;
analyser1.maxDecibels = -10;

var analyser2 = audioCtx.createAnalyser();
analyser2.minDecibels = -90;
analyser2.maxDecibels = -10;


var gainNode = audioCtx.createGain();
var convolver = audioCtx.createConvolver();

// grab audio track via XHR for convolver node

var soundSource, concertHallBuffer;
ajaxRequest = new XMLHttpRequest();
ajaxRequest.open('GET', 'https://raw.githubusercontent.com/christopheralcock/visual-convolve/master/public/wave-convolve.ogg', true);
ajaxRequest.responseType = 'arraybuffer';

ajaxRequest.onload = function() {
  var audioData = ajaxRequest.response;

  audioCtx.decodeAudioData(audioData, function(buffer) {
      concertHallBuffer = buffer;
      soundSource = audioCtx.createBufferSource();
      soundSource.buffer = concertHallBuffer;
    }, function(e){"Error with decoding audio data" + e.err});
}

ajaxRequest.send();

// set up canvas context for visualizer
var intendedWidth = document.querySelector('.wrapper').clientWidth;

var canvas1 = document.querySelector('.visualizer1');
var canvas1Ctx = canvas1.getContext("2d");
var canvas2 = document.querySelector('.visualizer2');
var canvas2Ctx = canvas2.getContext("2d");

canvas1.setAttribute('width',intendedWidth);
canvas2.setAttribute('width',intendedWidth);

//main block for doing the audio recording

if (navigator.getUserMedia) {
   console.log('getUserMedia supported.');
   navigator.getUserMedia (
      // constraints - only audio needed for this app
      {
         audio: true
      },

      // Success callback
      function(stream) {
         source = audioCtx.createMediaStreamSource(stream);
         source.connect(analyser1);
		 analyser1.connect(convolver);
         convolver.connect(gainNode);
         gainNode.connect(analyser2);
         analyser2.connect(audioCtx.destination);

      	 visualize(analyser1,canvas1,canvas1Ctx);
       	 visualize(analyser2,canvas2,canvas2Ctx);
		 gainNode.gain.value = 0.5;
         convolver.buffer = undefined;
		 convolver.buffer = concertHallBuffer;
      },

      // Error callback
      function(err) {
         console.log('The following gUM error occured: ' + err);
      }
   );
}

function visualize(analyser,canvas,canvasCtx) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;

    analyser.fftSize = 2048;
    var bufferLength = analyser.fftSize;
    console.log(bufferLength);
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {

      drawVisual = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 10;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
   
        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height/2);
      canvasCtx.stroke();
    };
    draw();
}
