/*
 * Example plugin template
 */
jsPsych.plugins['rating-wheel'] = (function() {

  var plugin = {};
   plugin.info = {
    name: 'rating-wheel',
    description: '',
    parameters: {
       stimulus: {
        type: [jsPsych.plugins.parameterType.STRING],
        default: undefined,
        no_function: false,
        description: ''
      },  
    choices: {
      type: [jsPsych.plugins.parameterType.KEYCODE],
      default: jsPsych.ALL_KEYS,
      no_function: false,
      description: 'Press spacebar to move on'
      },
    // response_ends_trial: {
    //   type: [jsPsych.plugins.parameterType.BOOL],
    //   default: false,
    //   no_function: false,
    //   description: ''
    //   },
    timing_response: {
        type: [jsPsych.plugins.parameterType.INT],
        default: -1,
        no_function: false,
        description: ''
      },
    }
  }

  // trial property added to jspsych rating wheel plugin object
  // two paramters- first is DOM element that will display jsPSych content, 2nd array of rial propeties from create method
  // must call jsPSyc. finsiht rial when is done running
  plugin.trial = function(display_element, trial) {

    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // set default values for parameters
    trial.parameter = trial.parameter || 'default value';
    trial.choices = trial.choices || jsPsych.ALL_KEYS;
    //trial.response_ends_trial = (typeof trial.response_ends_trial == 'undefined') ? true : trial.response_ends_trial;
    // trial.timing_stim = trial.timing_stim || -1;
    trial.timing_response = trial.timing_response || -1;

    // display content display_element. html();
    // allow content to persist for certain amount of time
    //save the data- 
    //then finish trial

    // allow variables as functions
    // this allows any trial variable to be specified as a function
    // that will be evaluated when the trial runs. this allows users
    // to dynamically adjust the contents of a trial as a result
    // of other trials, among other uses. you can leave this out,
    // but in general it should be included
   

    var rw_colors = [["#ED1F24"], ["#F48791"], ["#F29C70"], ["#FFF200"], ["#E7E515"], ["#9ECC3B"], ["#69BD45"], ["#0F733A"], ["#70C493"], ["#00AEEF"], ["#3B8FCD"], ["#0856A7"], ["#2E3192"], ["#5C59A7"], ["#B578B3"], ["#DA4C9B"]];
    var rw_names = [["anger"], ["pride"], ["elation"], ["joy"], ["satisfaction"], ["relief"], ["hope"], ["interest"], ["surprise"], ["sadness"], ["fear"], ["shame"], ["guilt"], ["envy"], ["disgust"], ["contempt"]];
    var rw_catInfo = rating_wheel.etc.categories(rw_names, rw_colors); 
    var rw_fontInfo = rating_wheel.etc.font(20, "Helvetica"); 
    
    //create rating wheel object discrete with these params
    //var wheelDat = rating_wheel.discrete.wheel(260, 16, 3, 0.69, 0.01, 23, 0.25, rw_fontInfo, rw_catInfo);
    //var rw_thisWheel = wheelDat[0];
    //var circleData = wheelDat[1];
    var rw_thisWheel = rating_wheel.discrete.wheel(260, 16, 3, 0.69, 0.01, 23, 0.25, rw_fontInfo, rw_catInfo);
    
    // function that renders rating wheel
    rating_wheel.render.go(rw_thisWheel);
  
    var response = {
      rt: -1,
      key: -1
    };

        // end trial if time limit is set
    if (trial.timing_response > 0) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.timing_response);
    }
    
    // function to end trial when it is time
    var end_trial = function() {
      //console.log('circles', rw_thisWheel.allPoints.circles);
      //console.log('circleData', circleData);
            // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }
      // gather the data to store for the trial
      var trial_data = {
      "rt": response.rt
      //'ratings':JSON.stringify(circleData)
      //'time_submitted': 
      };

      // here we need to create function to save 
      // data parameter should be either the value of jsPsych.data()
      // or the parameter that is passed to the on_data_update callback function for the core library
      // jsPsych.data() contains ALL data
      // the callback function will contain only the most recently written data.
      function save_data(trial_data){
         var data_table = "ratings"; // change this for different experiments
         $.ajax({
            type:'post',
            cache: false,
            url: 'ratings', //"{{url_for('ratings')}}", //his is my API!- 'app/__init__.py' API will give back JSON object fo info you want in/=
            contentType: 'application/json',
            data: JSON.stringify(trial_data),
            success: function(data) { 
              console.log(data); 
            },
            error:  function(data) {
                console.log('service failed!')
            }// write the result to javascript console
                });
      }
      save_data(trial_data);
      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // start the response listener
  if (trial.choices != jsPsych.NO_KEYS) {
    var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: end_trial,
      valid_responses: trial.choices,
      rt_method: 'date',
      persist: false,
      allow_held_key: false 
    });
  }

};
    //if (trial.cont_btn) { display_element.querySelector('#'+trial.cont_btn).addEventListener('click', finish); }
    // data saving
    //
  return plugin;
})();


