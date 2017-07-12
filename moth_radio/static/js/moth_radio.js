// video stimuli from database; supplied by template
console.log(video_stim);
var video_stim = ["static/stim/Burns_Fameishness.mp4"];
/*experiment parameters*/

var video_stim=['http://clips.vorwaerts-gmbh.de/VfE_html5.mp4'];

//Global variables to determine stopping points; numStop supplied by template
console.log(numStop);
var vidLength=20;
var max=vidLength;
var min=2;

// sample rate is percent of time stops as proportion
var createTimes = function(vidLength, minDiff, sampleRate, numTrys= 1000) {
  var numStops = Math.floor(vidLength*sampleRate);

  var vidRange = _.range(1,vidLength);

  for (var t = 0; t < numTrys; t++) {
	  var starts = _.sample(vidRange,numStops).sort(function(a,b){return a-b});
	  starts.unshift(0);

  // sample from all possible times and sort in ascending order
	  var zipped = _.zip(starts.slice(1), starts.slice(0,starts.length-1))
	  var check = _.map(zipped, function(pair) {return (pair[0]- pair[1]) >= minDiff})
	  var allTrue= check.every(function(elem){return elem===true})
	  if (allTrue){
		break;
	  }
  } 

  if (allTrue) {
	return starts;
  } else {
	console.log('could not find solution');
  }
}
// creates list of times with the maxium average distance between determined by length tand the sample rate= remember sample rate avgDiff tradeoff
var createTimesAvg = function(vidLength, sampleRate, avgDiff , numTrys= 10000, minDiff=2) {

  var numStops = Math.floor(vidLength*sampleRate);
  // if avgDiff not specified will give max avg based on vid length and sample rate
  var avgDiff = avgDiff || (vidLength/(vidLength*sampleRate)) -1;
  var vidRange = _.range(1,vidLength);

  for (var t = 0; t < numTrys; t++) {
	  var starts = _.sample(vidRange,numStops).sort(function(a,b){return a-b});
	  starts.unshift(0);

  // sample from all possible times and sort in ascending order
	  var zipped = _.zip(starts.slice(1), starts.slice(0,starts.length-1));
	  var check = _.map(zipped, function(pair) {return (pair[0]- pair[1]) >= minDiff});
	  var allTrue= check.every(function(elem){return elem===true});
	  var allDiff =_.map(zipped, function(pair) {return pair[0] - pair[1]});
	  var avg = allDiff.reduce(function(a,b) {return a+b})/allDiff.length;
	  if (allTrue && avg >= avgDiff){
		break;
	  }
  } 

  if (allTrue && avg >= avgDiff) {
	return starts;
  } else {
	console.log('could not find solution');
  }
}

/* define welcome message block */
var welcome_block = {
	type: "html-keyboard-response",
	stimulus: "<p>Welcome to the experiment. Press any key to begin.</p>"
};

// var check_consent = function(elem) {
//   if ($('#consent_checkbox').is(':checked')) {
//     return true;
//   }
//   else {
//     alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
//     return false;
//   }
//   return false;
// };

// var consent = {
//   type:'html',
//   url: "consent_page.html",
//   cont_btn: "start",
//   check_fn: check_consent
// };



var instructions_block = {
	type: "html-keyboard-response",
	stimulus: "<p>You are going to watch a video clip. The clip will pause  " +
	'and random times and you will be presented with a rating wheel.</p> '+
	'<p>Please rate your emotions at the time of the rating, '+
	'and press the spacebar when you are finished to continue watching the video clip.</p>'+
	'<p>Press any key to begin.</p>' 
};

var in_between_block = {
	type: "html-keyboard-response",
	stimulus: "<p> Next video will start soon.</p><p>Click the spacebar to begin.</p>" 
};

/*end message*/
var end_msg= {
	type: "html-keyboard-response",
	stimulus: "Thank you for participating! "
  };

/* create timeline and push objects to timeline*/
var timeline = [];
timeline.push(welcome_block);
// timeline.push(consent);
timeline.push(instructions_block);

var saveVideoData = function(data) {
	
	var dataToStore = {
		'video': JSON.parse(data.stimulus),
		'start_time': data.start_time,
		'stop_time': data.stop_time,
	};
	
	console.log(dataToStore);
	
	$.ajax({
		type:'POST',
		cache: false,
		url: "videotrial", 
		contentType: 'application/json',
		data: JSON.stringify(dataToStore), //{json_str: JSON.stringify(trial_data)}, //,
		success: function(output) {
		},
		error: function(error) {
			console.log('service failed!')
		} 
	});
}

//Loop through each video (one trial) and add the wheel obj and video clips for that video
for (var trial = 0; trial < video_stim.length; trial++) {

  // create stop times for that video 
  var sampleRate = 0.2; // [NGREENSTEIN] I just hard-coded this number for now since it was undefined. I'm not sure why we're specifying numStops then ignoring it. Which approach do we want to take?
  var stopTimes= createTimesAvg(vidLength, sampleRate);
  console.log("stop times", stopTimes);

  // creat video objects and put in list
  var vid_objects=[];
  var video_pres;
  for (var time = 1; time < stopTimes.length; time++) { 
	  video_pres = {
		type: 'video',
		sources: [video_stim[trial]],
		start: 0, //stop_times[time-1],
		stop: 2, //stop_times[time]
		on_finish: saveVideoData,
	  };
	  vid_objects.push(video_pres);
  };
  console.log("vid_objects", vid_objects);

  // create wheel objects and push to list
  var wheel_objects = [];
  var wheel_obj;
  for (piece = 1; piece < stopTimes.length; piece++){
	  wheelobj = {
		type:'rating-wheel',
		// timing_response: 1500,
		choices: [32], // spacebar ends trial
		// response_ends_trial: true
	  };
	  wheel_objects.push(wheelobj);
  };

  // add all the video -objects and rating wheel objects for this trial to the timeline
  for (clip = 0; clip < vid_objects.length; clip++) {
	timeline.push(vid_objects[clip]);
	timeline.push(wheel_objects[clip]);
  };

  // add an in_between block between movies
  timeline.push(in_between_block);
}
console.log("timeline", timeline)
// add final end message to the timeline
timeline.push(end_msg);

/*run the experiment*/
jsPsych.init({
  //display_element: $('#jspsych-target'),
  //TODO: why doesn't the above actually work?
  timeline: timeline,
  on_finish: function() {
	  jsPsych.data.displayData();
	}
});
