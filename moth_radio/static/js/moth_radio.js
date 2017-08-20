// video stimuli from database; supplied by template
console.log(videoFiles);

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

	// If sample rate is specified, use that. If not, use the numStops passed in by the template.
	var numStops;
	if (sampleRate) {
		numStops = Math.floor(vidLength*sampleRate);
	} else {
		numStops = window.numStops;
		sampleRate = 1 / numStops;
	}
	
  // if avgDiff not specified will give max avg based on vid length and sample rate
  var avgDiff = avgDiff || (vidLength/(vidLength*sampleRate)) -1;
  var vidRange = _.range(1,vidLength);

  for (var t = 0; t < numTrys; t++) {
	  var starts = _.sample(vidRange, numStops).sort(function(a,b){return a-b});
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
	'and random times and you will be presented with a group of ratings to make.</p> '+
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
	
	console.log("saving video data");
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
};

var saveEmotionData = function(data) {
	
	console.log("saving emotion data");
	console.log(data);
	
	// change this for different experiments
	$.ajax({
		type:'POST',
		cache: false,
		url: 'ratings', 
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(data) { 
			console.log(data); 
		},
		error:	function(data) {
			console.log('service failed!');
		},
	});
	
}


//Loop through each video (one trial) and add the rating obj and video clips for that video
for (var trial = 0; trial < videoFiles.length; trial++) {

  // create stop times for that video 
  var vidLength = videoDurations[trial];
  if (!vidLength) {
	vidLength = 10; // Assume this as default video length if real length not specified  
  }
  var stopTimes= createTimesAvg(vidLength);
  console.log("stop times", stopTimes);

  // creat video objects and put in list
  var vid_objects=[];
  var video_pres;
  for (var time = 1; time < stopTimes.length; time++) { 
	  video_pres = {
		type: 'video',
		sources: [videoFiles[trial]],
		start: stopTimes[time-1],
		stop: stopTimes[time],
		on_finish: saveVideoData,
	  };
	  vid_objects.push(video_pres);
  };
  console.log("vid_objects", vid_objects);

  // create rapid-rate objects and push to list
  var rateObjs = [];
  for (piece = 1; piece < stopTimes.length; piece++){
	  var rateObj = {
	  	type: "rapid-rate",
	  	items: ["Anger", "Pride", "Elation", "Joy", "Satisfaction", "Relief", "Hope", "Interest", "Surprise", "Sadness", "Fear", "Shame", "Guilt", "Envy", "Eisgust", "Contempt",],
	  }
	  rateObjs.push(rateObj);
  };

  // add all the video -objects and rating objects for this trial to the timeline
  for (clip = 0; clip < vid_objects.length; clip++) {
	timeline.push(vid_objects[clip]);
	timeline.push(rateObjs[clip]);
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
