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

var end_msg= {
	type: "html-keyboard-response",
	stimulus: "Thank you for participating! "
  };

var videoBlockForStimAndTimes = function(stim, startTime, stopTime)
{
	var block =
	{
		type: "video",
		sources: [stim.path],
		start: startTime,
		stop: stopTime,
	};
	return block;
};

var ratingBlockForStimAndTimes = function(stim, startTime, stopTime)
{
	var block = {
		type: "rapid-rate",
		items: ["Anger", "Pride", "Elation", "Joy", "Satisfaction", "Relief", "Hope", "Interest", "Surprise", "Sadness", "Fear", "Shame", "Guilt", "Envy", "Disgust", "Contempt",],
		on_finish: function(ratingData)
		{
			var payload =
			{
				sessionId: sessionId,
				stimulusId: stim.id,
				pollSec: stopTime,
				sliceStartSec: startTime,
				reactionTime: ratingData["rt"],
				intensities: ratingData["ratings"],
			};
			$.post(
				"save-rating",
				payload,
				function(data)
				{
					if (!(data && data["ratingId"])) // No action required for success.
					{
						console.log("Error: no rating ID returned from server after request to save rating.")
					}
				},
				"json"
			);
		}
	};
	return block;
};

// Build the timeline
var timeline = [];
timeline.push(welcome_block);
// timeline.push(consent);
timeline.push(instructions_block);
for (var i = 0; i < stimuli.length; i ++)
{
	stim = stimuli[i];
	duration = stim.duration;
	startTimes = createTimesAvg(duration);
	for (var j = 0; j < startTimes.length; j ++)
	{
		var start = startTimes[j];
		var end;
		// Either end the clip when the next one starts, of, if it's the last one, when the whole video is over.
		if (startTimes[j+1]) end = startTimes[j+1];
		else end = duration;
		
		timeline.push(videoBlockForStimAndTimes(stim, start, end));
		timeline.push(ratingBlockForStimAndTimes(stim, start, end));
	}
	
	timeline.push(in_between_block);
}
timeline.push(end_msg);

// Holder for the session ID we get from the server
var sessionId = -1

// Tell the server to start a new session for us, and get its ID
var createSession = function()
{
	$.post(
		"start-new-session",
		{
			// for now, just use a debug id
			psiturkUid: "xDebugUid"
		},
		function(data)
		{
			if (data && data["sessionId"])
			{
				sessionId = Number(data["sessionId"]);
			}
			else
			{
				console.log("Error: no session ID returned from server after request to start session.")
			}
		},
		"json"
	);
};

var stopSession = function()
{
	$.post(
		"stop-session",
		{
			sessionId: sessionId
		},
		function(data)
		{
			if (!(data && data["sessionId"])) // No action required for success.
			{
				console.log("Error: no session ID returned from server after request to stop session.")
			}
		},
		"json"
	);
};

// Start the trial and run the experiment
createSession();
jsPsych.init({
	timeline: timeline,
	on_finish: stopSession,
});
