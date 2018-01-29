// Globals
var psiturkUid, hasAccount, labUserId, sessionId, shuffledEmotions, selectedStim;

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

// Grab the psiturk UID if we have one
psiturkUid = Turkframe.getUid();

// Start building the timeline
var timeline = [];

// Welcome message
var welcomeBlock =
{
	type: "html-keyboard-response",
	stimulus: "<p>Welcome to the experiment. Press any key to begin.</p>",
};
timeline.push(welcomeBlock);

// Sequence for getting lab users logged in
if (!Turkframe.inTurkframeMode())
{	
	var loginLoopTimeline = []; // Use a nested timeline for this one so we can loop and let users try multiple times
	var accountSuccess = false; // Marks whether we've successful gotten someone logged in / acct created
	
	// Ask if user wants to log in or create acct. Useful b/c it helps avoid create duplicate accts for one user based on typos.
	var accountPrompt =
	{
		type: "html-button-response",
		stimulus: "<p>Would you like to log in to an existing cosanlabradio account or create a new one?</p>",
		choices: ["Log In", "Create Account"],
		on_finish: function(data)
		{
			hasAccount = data["button_pressed"] == 0 ? true : false;
		},
	};
	loginLoopTimeline.push(accountPrompt);
	
	// Prompt for username and email
	var infoBlock =
	{
		type: "survey-text",
		preamble: "Please enter your information.",
		// Have to specify all properties in `questions` because of a bug in the current version of
		// the survey-text plugin (as of Jan 17, 2018).
		questions: [{prompt: "Name:", rows: 1, columns: 40, value: "",}, {prompt: "Email:", rows: 1, columns: 40, value: ""}],
		on_finish: function(data)
		{
			answers = JSON.parse(data.responses);
			var name = answers["Q0"];
			var email = answers["Q1"];
			$.post(
				// Set endpoint based on answer to earlier prompt (both take/return the same fields)
				hasAccount ? "login-lab-user" : "create-lab-user",
				{
					name: name,
					email: email,
				},
				function(data)
				{
					// On success, save the ID, mark that we're successfully set up w/ an account, and move past the loading screen
					if ((data && data["userId"]))
					{
						labUserId = data["userId"];
						accountSuccess = true;
						finishTimeline();
						// Custom flag added to the loading screen so we don't accidentally clear something else
						if (jsPsych.currentTrial()["isLoadScreen"] === true)
						{
							jsPsych.finishTrial(); // Move on!
						}
					}
					else
					{
						console.log("Error: no lab user ID returned from server after request to " + hasAccount ? "log in" : "create" + " lab user.");
						if (jsPsych.currentTrial()["isLoadScreen"] === true)
						{
							jsPsych.finishTrial(); // Move on!
						}
					}
				},
				"json"
			).fail(function(data)
			{
				// If whichever endpoint used returns a 500, it means that the opposite endpoint should have been used.
				// So clear the loading screen, display an error, and let the user start over
				if (data.status == 500 && jsPsych.currentTrial()["isLoadScreen"] === true)
				{
					jsPsych.finishTrial(); // Move on!
				}
			});
		},
	};
	loginLoopTimeline.push(infoBlock);
	
	// Shown while waiting for the AJAX request to finish. User can't do anything; the callbacks clear this screen when appropriate
	var loadingBlock =
	{
		type: "html-keyboard-response",
		stimulus: "<p>Loading...</p>",
		choices: jsPsych.NO_KEYS,
		isLoadScreen: true, // Custom flag so we can make sure we're not clearing something else
	};
	loginLoopTimeline.push(loadingBlock)
	
	// Use a relevant error message based on what the user was trying to do
	var errorBlock =
	{
		type: "html-keyboard-response",
		on_start: function(trial)
		{
			var errorString;
			if (hasAccount) errorString = "We were unable to find this user in our system. Please try again."
			else errorString = "An account matching that information already exists. Please log in."
			var stimulus = "<p>Error: " + errorString + "</p><p>Press any key to continue.</p>";
			trial.stimulus = stimulus;
		}
	};
	// Don't show the error message if there was no error (requires another nested timeline)
	var errorTimeline =
	{
		timeline: [errorBlock],
		conditional_function: function() { return !accountSuccess; },
	}
	loginLoopTimeline.push(errorTimeline);
	
	// Loop the whole login sequence until the user gets it right
	var loginLoop =
	{
		timeline: loginLoopTimeline,
		loop_function: function() { return !accountSuccess; },
	};
	
	// Add the whole loop to the main timeline
	timeline.push(loginLoop);
}
else
{
	finishTimeline();
}

/*var check_consent = function(elem) {
  if ($('#consent_checkbox').is(':checked')) {
    return true;
  }
  else {
    alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
    return false;
  }
  return false;
};

var consent = {
  type:'html',
  url: "consent_page.html",
  cont_btn: "start",
  check_fn: check_consent
}; */

// Function to tell the server to start a new session for us, and get its ID.
// Called after the instructions are dismissed
var createSession = function()
{
	$.post(
		"start-new-session",
		{
			psiturkUid: psiturkUid ? psiturkUid : null,
			labUserId: labUserId ? labUserId : null,
			emotionOrder: JSON.stringify(shuffledEmotions),
		},
		function(data)
		{
			if (data && data["sessionId"])
			{
				sessionId = Number(data["sessionId"]);
			}
			else
			{
				console.log("Error: no session ID returned from server after request to start session.");
			}
		},
		"json"
	).fail(function(data)
	{
		console.log("Error: request to start session failed; the following response was returned:");
		console.log(data.responseJSON);
	});
};

// Tools to build repetitive blocks: videos, ratings, and messages between videos

// Build a video block
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

// Build a rating block
var ratingBlockForStimAndTimes = function(stim, startTime, stopTime)
{
	var block = {
		type: "rapid-rate",
		items: shuffledEmotions,
		logCommits: true,
		topMsg: "Please rate each of the following emotions:",
		bottomMsg: "Press 'space' when finished.",
		on_finish: function(ratingData)
		{
			var payload =
			{
				sessionId: sessionId,
				stimulusId: stim.id,
				pollSec: stopTime,
				sliceStartSec: startTime,
				reactionTime: ratingData["rt"],
				intensities: JSON.stringify(ratingData["ratings"]),
				ratingHistory: JSON.stringify(ratingData["commitLog"]),
			};
			$.post(
				"save-rating",
				payload,
				function(data)
				{
					if (!(data && data["ratingId"])) // No action required for success.
					{
						console.log("Error: no rating ID returned from server after request to save rating.");
					}
				},
				"json"
			).fail(function(data)
			{
				console.log("Error: request to save rating failed; the following response was returned:");
				console.log(data.responseJSON);
			});
		}
	};
	return block;
};

// Canned between-videos message
var inBetweenBlock =
{
	type: "html-keyboard-response",
	stimulus: "<p> Next video will start soon.</p><p>Click the spacebar to begin.</p>",
};

var finishTimeline = function()
{
	var timelineToAdd = [];
	// Instructions message, creating the session when done
	var instructionsBlock =
	{
		type: "html-keyboard-response",
		stimulus: "<p>You are going to watch a video clip. The clip will pause  " +
			"and random times and you will be presented with a group of ratings to make.</p>" +
			"<p>Please rate your emotions at the time of the rating," +
			"and press the spacebar when you are finished to continue watching the video clip.</p>" +
			"<p>Press any key to begin.</p>",
		on_finish: createSession,
	};
	timelineToAdd.push(instructionsBlock);
	
	// Each user will have emotions presented in a random order, but the order will remain consistent for that user
	shuffledEmotions = jsPsych.randomization.shuffle(["Anger", "Pride", "Elation", "Joy", "Satisfaction", "Relief", "Hope", "Interest", "Surprise", "Sadness", "Fear", "Shame", "Guilt", "Envy", "Disgust", "Contempt",]);
	// Randomly select the requested number of stimuli
	selectedStim = jsPsych.randomization.sampleWithoutReplacement(stimuli, numStim);
	// Loop through and build repetitive blocks 
	for (var i = 0; i < selectedStim.length; i ++)
	{
		stim = selectedStim[i];
		duration = stim.duration;
		startTimes = createTimesAvg(duration);
		for (var j = 0; j < startTimes.length; j ++)
		{
			var start = startTimes[j];
			var end;
			// Either end the clip when the next one starts, of, if it's the last one, when the whole video is over.
			if (startTimes[j+1]) end = startTimes[j+1];
			else end = duration;
			
			timelineToAdd.push(videoBlockForStimAndTimes(stim, start, end));
			timelineToAdd.push(ratingBlockForStimAndTimes(stim, start, end));
		}
		
		// Add an in-between block if there is another video to play
		if (i < (selectedStim.length - 1)) timelineToAdd.push(inBetweenBlock);
	}
	
	var endMsg =
	{
		type: "html-keyboard-response",
		stimulus: "Thank you for participating!",
	 };
	timelineToAdd.push(endMsg);
	
	jsPsych.addNodeToEndOfTimeline({timeline: timelineToAdd}, new Function);
};

// Fucntion to tell the server the session is done.
// Also hands control back to PsiTurk if running in Turkframe
// Called at jsPsych's on_finish
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
				console.log("Error: no session ID returned from server after request to stop session.");
			}
		},
		"json"
	).fail(function(data)
	{
		console.log("Error: request to stop session failed; the following response was returned:");
		console.log(data.responseJSON);
	});
	
	// Don't need to wait for a response to the above AJAX; just need to have the request made
	Turkframe.messageFinished({sessionId: sessionId});
};

// Run the experiment
jsPsych.init({
	timeline: timeline,
	on_finish: stopSession,
});
