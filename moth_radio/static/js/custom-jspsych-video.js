/* jspsych-video.js
 * Josh de Leeuw
 *
 * This plugin displays a video. The trial ends when the video finishes.
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins.video = (function() {

  var plugin = {};

  plugin.info = {
    name: 'video',
    description: '',
    parameters: {
      sources: {
        type: [jsPsych.plugins.parameterType.VIDEO],
        array: true,
        default: undefined,
        no_function: false,
        description: ''
      },
      width: {
        type: [jsPsych.plugins.parameterType.INT],
        default: undefined,
        no_function: false,
        description: ''
      },
      height: {
        type: [jsPsych.plugins.parameterType.INT],
        default: undefined,
        no_function: false,
        description: ''
      },
      autoplay: {
        type: [jsPsych.plugins.parameterType.BOOL],
        default: true,
        no_function: false,
        description: ''
      },
      controls: {
        type: [jsPsych.plugins.parameterType.BOOL],
        default: false,
        no_function: false,
        description: ''
      },
      prompt: {
        type: [jsPsych.plugins.parameterType.STRING],
        default: '',
        no_function: false,
        description: ''
      },
      start: {
        type: [jsPsych.plugins.parameterType.FLOAT],
        default: false,
        no_function: false,
        description: 'time to start the clip'
      },
      stop: {
        type: [jsPsych.plugins.parameterType.FLOAT],
        default: false,
        no_function: false,
        description: 'time to stop the clip'
      }
    }
  }


  plugin.trial = function(display_element, trial) {

    // set default values for the parameters
    trial.prompt = trial.prompt || "";
    trial.autoplay = typeof trial.autoplay == 'undefined' ? true : trial.autoplay;
    trial.controls = typeof trial.controls == 'undefined' ? false : trial.controls;

    // display stimulus
    var video_html = '<video id="jspsych-video-player" width="'+trial.width+'" height="'+trial.height+'" '
    if(trial.autoplay){
      video_html += "autoplay "
    }
    if(trial.controls){
      video_html +="controls "
    }
    video_html+=">"
    for(var i=0; i<trial.sources.length; i++){
      var s = trial.sources[i];
      if(s.indexOf('?') > -1){
        s = s.substring(0, s.indexOf('?'));
      }
      var type = s.substr(s.lastIndexOf('.') + 1);
      type = type.toLowerCase();

      // adding start stop parameters if specified
      video_html+='<source src="'+trial.sources[i]

      if (trial.start) {
        video_html+= '#t=' + trial.start;
      } else {
        video_html+= '#t=0';
      }

      // if (trial.stop) {
      //   video_html+= ',' + trial.stop
      // }

      video_html+='" type="video/'+type+'">';
    }
    video_html +="</video>"

    //show prompt if there is one
    if (trial.prompt !== "") {
      video_html += trial.prompt;
    }

    display_element.innerHTML = video_html;

    // The `ended` event doesn't fire when a video stops due to a stop time specified
    // in the `src` attribute. The `pause` event does, but it also fires when a user pauses the
    // video (when controls are enabled). This watches the current time and handles pausing / 
    // ending the trial.
    display_element.querySelector('#jspsych-video-player').ontimeupdate = function(target) {
      var videoEl = target.target;
      if (videoEl.currentTime >= trial.stop) {
        videoEl.pause();
        videoEl.ontimeupdate = {};
        end_trial();
      }
    }

    // function to end trial when it is time
    var end_trial = function() {

      // gather the data to store for the trial
      var trial_data = {
        stimulus: JSON.stringify(trial.sources),
        start_time: trial.start,
        stop_time: trial.stop,
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

  };

  return plugin;
})();
