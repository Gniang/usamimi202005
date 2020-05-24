window.onload = function () {
    "use strict";
    var paths = document.getElementsByTagName('path');
    var visualizer = document.getElementById('visualizer');
    var mask = visualizer.getElementById('mask');
    var h = document.getElementsByTagName('h1')[0];
    var path;
    var report = 0;
    

    function createAudioMeter(audioContext) {
        const processor = audioContext.createScriptProcessor(512)
        processor.onaudioprocess = volumeAudioProcess
        processor.clipping = false
        processor.lastClip = 0
        processor.volume = 0
        processor.clipLevel = 0.98
        processor.averaging = 0.95
        processor.clipLag = 750
      
        // this will have no effect, since we don't copy the input to the output,
        // but works around a current Chrome bug.
        processor.connect(audioContext.destination)
      
        processor.checkClipping = function () {
          if (!this.clipping) {
            return false
          }
          if ((this.lastClip + this.clipLag) < window.performance.now()) {
            this.clipping = false
          }
          return this.clipping
        }
      
        processor.shutdown = function () {
          this.disconnect()
          this.onaudioprocess = null
        }
      
        return processor
    }
      
    function volumeAudioProcess(event) {
        const buf = event.inputBuffer.getChannelData(0);
        const bufLength = buf.length;
        let sum = 0;
        let x;
      
        // Do a root-mean-square on the samples: sum up the squares...
        for (var i = 0; i < bufLength; i++) {
          x = buf[i]
          if (Math.abs(x) >= this.clipLevel) {
            this.clipping = true
            this.lastClip = window.performance.now()
          }
          sum += x * x
        }
      
        // ... then take the square root of the sum.
        const rms = Math.sqrt(sum / bufLength);
      
        // Now smooth this out with the averaging factor applied
        // to the previous sample - take the max here because we
        // want "fast attack, slow release."
        this.volume = Math.max(rms, this.volume * this.averaging);
        console.log(this.volume);
    }

    var soundAllowed = function (stream) {
        //Audio stops listening in FF without // window.persistAudioStream = stream;
        //https://bugzilla.mozilla.org/show_bug.cgi?id=965483
        //https://support.mozilla.org/en-US/questions/984179
        window.persistAudioStream = stream;
        h.innerHTML = "Thanks";
        h.setAttribute('style', 'opacity: 0;');
        var audioContent = new AudioContext();
        var audioStream = audioContent.createMediaStreamSource( stream );
        var analyser = audioContent.createAnalyser();
        audioStream.connect(analyser);
        analyser.fftSize = 1024;

        mediaStreamSource = audioContent.createMediaStreamSource(stream)
        createAudioMeter(audioContent);
        mediaStreamSource.connect(meter)



        var frequencyArray = new Uint8Array(analyser.frequencyBinCount);
        visualizer.setAttribute('viewBox', '0 0 255 255');
      
				//Through the frequencyArray has a length longer than 255, there seems to be no
        //significant data after this point. Not worth visualizing.
        for (var i = 0 ; i < 255; i++) {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('stroke-dasharray', '4,1');
            mask.appendChild(path);
        }
        var doDraw = function () {
            requestAnimationFrame(doDraw);
            analyser.getByteFrequencyData(frequencyArray);
          	var adjustedLength;
            for (var i = 0 ; i < 255; i++) {
              	adjustedLength = Math.floor(frequencyArray[i]) - (Math.floor(frequencyArray[i]) % 5);
                paths[i].setAttribute('d', 'M '+ (i) +',255 l 0,-' + adjustedLength);
            }

        }
        doDraw();
    }

    var soundNotAllowed = function (error) {
        h.innerHTML = "You must allow your microphone.";
        console.log(error);
    }

    /*window.navigator = window.navigator || {};
    /*navigator.getUserMedia =  navigator.getUserMedia       ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia    ||
                              null;*/
    navigator.getUserMedia({audio:true}, soundAllowed, soundNotAllowed);

};