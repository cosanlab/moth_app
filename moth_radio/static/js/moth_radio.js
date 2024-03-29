// Globals
var psiturkUid,
	psiturkWorkerId,
	hasAccount,
	labUserId,
	sessionId,
	resumedSession,
	stimuli,
	emotions,
	sequence,
	humanFails = 0,
	maxHumanFails = 2,
	passedHuman,
	visibilityListener,
	trialNum,
	exitSurvey;

// Grab the stimulus with a given id from the jumble of stimuli sent from the server,
// which aren't necessarily in any particular order.
var stimWithId = function(id)
{
	var matches = $.grep(stimuli, function(obj, i)
	{
		return obj["id"] == id;
	});
	return matches[0];
};

// Create start times given a video's duration, a base sample interval in seconds,
// the proportion of the sample interval by which to vary each stop point,
// and the minimum offset between the beginning of the video and the first stop.
// Returns an array of floats representing video segment start times.
var createTimesForDurationAndSampleInterval = function(duration, sampleInterval, jitterRatio = 0.33, minOffset = 30)
{
	
	var roundToTenths = function(number)
	{
		return Math.round(number * 10) / 10;
	};
	
	var numStops = duration / sampleInterval -1 , // First stop is the offset
		jitterSeconds = jitterRatio * sampleInterval,
		minDuration = roundToTenths(sampleInterval - jitterSeconds / 2),
		maxDuration = roundToTenths(sampleInterval + jitterSeconds / 2),
		possibleDurations = _.range(minDuration, maxDuration, 0.1).map(function(duration){return roundToTenths(duration)}),
		possibleOffsets = _.range(minOffset, minOffset + sampleInterval, 0.1).map(function(duration){return roundToTenths(duration)}),
		offset = _.sample(possibleOffsets);

	var starts = [0, offset];
	for (var i = 0; i < numStops; i ++)
	{
		var lastStart = starts[i + 1],
			timeRemaining = duration - lastStart;

		// If the time remaining is within the acceptable range for clip durations, just finish out the video.
		// This also prevents ending up with a start point beyond the video duration.
		if (timeRemaining < maxDuration)
		{
			break;
		}
		
		var sliceDuration = _.sample(possibleDurations),
			thisStart = roundToTenths(lastStart + sliceDuration);
		starts.push(thisStart);
	}
	
	return starts;
};

// Split a video into bins of a given length and sample once from a uniform distribution of times within each bin.
var createTimesForDurationAndBinLength = function(duration, binLength = 90, binPadding = 5)
{
	// Round up because the last bin can be less than the full bin length
	var numBins = Math.ceil(duration / binLength);
	// Allow padding on the edge of each bin to prevent stops too close together
	var possibleOffsets = _.range(binPadding, binLength - binPadding);

	// Loop through all but the last stop (which we treat separately)
	var starts = [0];
	for (var i = 0; i < numBins - 1; i ++)
	{
		// Pick an offset within this bin, and add to the left edge of the bin to get an actual timestamp
		var thisOffset = _.sample(possibleOffsets);
		var thisTimestamp = i * binLength + thisOffset;
		starts.push(thisTimestamp)
	}

	// We need at least 4 times the padding to add a last stop, otherwise one or both of the last clips
	// (the one leading up to the last stop and the one between it and the end) will be less than the padding demands.
	// So, if less than padding*4 seconds reamin, don't add a last stop and just have the last clip be longer than usual
	var remainingTime = duration - (i * binLength);
	if (remainingTime > binPadding * 4)
	{
		// If we do have time for a last stop, add it, making sure that the time between it and the
		// end of the video is at least padding * 2
		var lastPossibleOffsets = _.range(binPadding, remainingTime - binPadding * 2);
		var lastTimestamp = i * binLength + _.sample(lastPossibleOffsets);
		starts.push(lastTimestamp);
	}

	return starts;
}

var visualizeTimes = function(width, height, duration)
{
	var tests = "";
	
	for (var i = 0; i < height; i ++)
	{
		var scale = function(num) { return Math.round(num / (duration/width)) };
		var times = createTimesForDurationAndSampleInterval(duration, 30),
			scaled = _.map(times, scale),
			row = "";
		scaled.push(scale(duration));
		for (var j = 0; j < scaled.length - 1; j ++)
		{
			var thisStop = scaled[j],
				nextStop = scaled[j + 1],
				length = nextStop - thisStop;
			row += "-".repeat(length);
			row += "#";
		}
		tests += row + "\n";
	}
	return tests;
};

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

// Build the sequence (i.e. which stimuli to use and when to poll for ratings)
// Returns true if successful or false if a failure occurred
// Sets the `sequence` global variable
// Called by finishTimeline() for new sessions
var buildSequence = function()
{
	if (stimuli.length < numStim) return false;
	
	var newSeq = [],
		selectedStim = stimuli;
	
	// Sort stimuli by tag if requested
	if (useTagOrder)
	{
		selectedStim.sort(function(a, b)
		{
			if (a.tagOrder < b.tagOrder) return -1;
			if (a.tagOrder > b.tagOrder) return 1;
			return 0;
		});
	}
	// Or, otherwise, randomize the order of stimuli
	else
	{
		selectedStim = jsPsych.randomization.shuffle(selectedStim);
	}
	
	// If a positive number of stimuli is requested, select that number (they're already sorted into random order).
	// Otherwise, if -1 is passed, use all valid stimuli, however many there are.
	if (numStim >= 0)
	{
		selectedStim = selectedStim.slice(0, numStim);
	}
	
	// Loop through the stimuli and generate stop times
	for (var i = 0; i < selectedStim.length; i ++)
	{
		var stim = selectedStim[i],
			starts = createTimesForDurationAndBinLength(stim.duration, sampleInterval);
			stimObj = 
			{
				"stimulus": stim.id,
				"starts": starts,
			};
		newSeq.push(stimObj);
	}
	
	sequence = newSeq;
	// if (scanning) console.log(sequence);
	
	return true;
	
}

// Grab the psiturk UID if we have one
psiturkUid = Turkframe.getUid();
psiturkWorkerId = Turkframe.getWorkerId();

// Start building the timeline
var timeline = [];

// Welcome message
welcomeMessage = "<p>Welcome to the study.</p><p>You may reload this window at any point, or bookmark and return to it, and the task will resume approximately where you left off. Feel free to take breaks, provided you finish the task within the time window provided (see the HIT ad for details).</p><p>If you encounter any issues while completing this HIT, please try reloading the page. If the error persists, contact the requesters (<a href='mailto:cosanlab@gmail.com'>cosanlab@gmail.com</a>), and <strong>rest assured that you will be fully compensated for your time</strong>.<p>Thank you in advance for your participation!</p><p>Press any key to begin.</p>";
if (scanning) welcomeMessage = "<p>Setting up the study...</p><p><p>Press any key to begin.</p>";
var welcomeBlock =
{
	type: "html-keyboard-response",
	stimulus: welcomeMessage,
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
		stimulus: "<p>Is this an existing participant or a new one?</p>",
		choices: ["Log In", "Register Participant"],
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
		preamble: "Please enter user information.",
		// Have to specify all properties in `questions` because of a bug in the current version of
		// the survey-text plugin (as of Jan 17, 2018).
		questions: [{prompt: "ID:", rows: 1, columns: 40, value: "",}, {prompt: "Study:", rows: 1, columns: 40, value: ""}],
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
						continuePreTrialTimeline();
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
				// If the endpoint returns a 400, it means something was missing from the request (a user probably left a field blank).
				// So clear the loading screen, display an error, and let the user start over
				if ((data.status == 500 || data.status == 400) && jsPsych.currentTrial()["isLoadScreen"] === true)
				{
					jsPsych.finishTrial(); // Move on!
				}
				// If the error was something else, die.
				else
				{
					failOurFault();
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

var fixationPointBlockForSeconds = function(seconds)
{
	return {
		type: "html-keyboard-response",
		stimulus: "<h1>+</h1>",
		choices: [jsPsych.NO_KEYS,],
		trial_duration: seconds*1000,
		on_start: function()
		{
			sendLogEntry({"eventCode": 200});
		},
		on_finish: function()
		{
			sendLogEntry({"eventCode": 299});
		},
	}
};

var sendLogEntry = function(entry)
{
	TS = new Date();
	$.post(
		"save-log",
		{
			sessionId: sessionId,
			eventCode: entry["eventCode"],
			clientTS: TS.getTime(),
			meta: JSON.stringify(entry["meta"]),
		},
		function(data)
		{
			if (!(data && data["logId"])) // No action required for success.
			{
				console.log("Error: no log ID returned from server after request to save log.");
			}
		},
		"json"
	).fail(function(data)
	{
		console.log("Error: request to save log failed; the following response was returned:");
		console.log(data.responseJSON);
	});
}

var continuePreTrialTimeline = function()
{
	var timelineToAdd = [];
	
	// Make mturk users prove they're not bots
	
	if (Turkframe.inTurkframeMode())
	{
		var numerals = [1, 2, 3, 4],
			words = ["one", "two", "three", "four"],
			numIds = _.sample(_.range(0, 4), 2);
		
		// Check if someone is human or not
		var humanTestBlock =
		{
			type: "survey-text",
			preamble: "Just to make sure you're human, what is <strong>" + words[numIds[0]] +"</strong> plus <strong>" + words[numIds[1]] + "</strong>? Answer with a single numeral.",
			// Have to specify all properties in `questions` because of a bug in the current version of
			// the survey-text plugin (as of Jan 17, 2018).
			questions: [{prompt: "Answer:", rows: 1, columns: 20, value: "",}],
			on_finish: function(data)
			{
				answers = JSON.parse(data.responses);
				var answer = answers["Q0"];
				if (answer == numerals[numIds[0]] + numerals[numIds[1]])
				{
					passedHuman = true;
				}
				else
				{
					humanFails += 1;
				}
				jsPsych.finishTrial();
			},
		};
		
		// If the test is failed, either tell the user to try again or that they're getting booted.
		var humanErrorBlock =
		{
			type: "html-keyboard-response",
			on_start: function(trial)
			{
				var errorString;
				if (humanFails <= maxHumanFails) errorString = "<p>Sorry, that was not the correct answer. Please try again.</p><p>Press any key to continue.</p>"
				else errorString = "<p>Sorry, too many incorrect answers were entered. This trial will not continue.</p>"
				trial.stimulus = errorString;
			},
			on_finish: function()
			{
				if (humanFails > maxHumanFails)
				{
					jsPsych.endExperiment("Sorry, too many incorrect answers were entered. This trial will not continue.");
				}
			},
		};
		
		var humanErrConditional = 
		{
			timeline: [humanErrorBlock],
			conditional_function: function()
			{
				return !passedHuman;
			},
		}
		var humanTestLoop =
		{
			timeline: [humanTestBlock, humanErrConditional],
			loop_function: function()
			{
				return !passedHuman;
			},
		};
		timelineToAdd.push(humanTestLoop);
	}
	
	// Shown while waiting for the AJAX request to finish. User can't do anything; the callbacks clear this screen when appropriate
	var loadingBlock =
	{
		type: "html-keyboard-response",
		stimulus: "<p>Loading...</p>",
		choices: jsPsych.NO_KEYS,
		isLoadScreen: true, // Custom flag so we can make sure we're not clearing something else
		on_start: linkSession,
	};
	timelineToAdd.push(loadingBlock);

	// Instructions message, creating the session when done
	var instructionsMessage = "<p>You are going to watch a series of video clips. The clips will pause \nat random times and you will be presented with a group of ratings to make.</p>\n<p>Please rate your emotions at the time of the rating,\nand spress the spacebar when you are finished to continue watching.</p>\n<p>Press any key to begin.</p>";
	if (scanning) instructionsMessage = "<p>You are going to watch a series of video clips. The clips will pause \nat random times and you will be presented with a group of ratings to make.</p>\n<p>Please rate your emotions at the time of the rating,\nand right click when you are finished to continue watching.</p>";
	var instructionsBlock =
	{
		type: "html-keyboard-response",
		stimulus: instructionsMessage,
	};
	timelineToAdd.push(instructionsBlock);
	
	if (scanning)
	{
		var waitScannerBlock =
		{
			type: "html-keyboard-response",
			stimulus: "<p>Waiting for scanner...</p>",
			choices: ['5'],
	
			on_start: function()
			{
				$.get(
				"biopac",
				function()
				{
					metaObj = {"stimId": NaN, "stimName": "BiopacSuccess", "startStamp": NaN, "stopTime": NaN};
					sendLogEntry({"eventCode": 600, "meta": metaObj});
				}).fail(function()
				{
					console.log("Error: first call to `biopac` failed.");
					metaObj = {"stimId": NaN, "stimName": "BiopacFail", "startStamp": NaN, "stopTime": NaN};
					sendLogEntry({"eventCode": 600, "meta": metaObj});
					$.get(
					"biopac",
					function()
					{
						metaObj = {"stimId": NaN, "stimName": "BiopacSuccess", "startStamp": NaN, "stopTime": NaN};
						sendLogEntry({"eventCode": 600, "meta": metaObj});
					}).fail(function()
					{
						console.log("Error: second call to `biopac` failed.");
						metaObj = {"stimId": NaN, "stimName": "BiopacFail", "startStamp": NaN, "stopTime": NaN};
						sendLogEntry({"eventCode": 600, "meta": metaObj});
						$.get(
						"biopac",
						function()
						{
							metaObj = {"stimId": NaN, "stimName": "BiopacSuccess", "startStamp": NaN, "stopTime": NaN};
							sendLogEntry({"eventCode": 600, "meta": metaObj});
						}).fail(function()
						{
							console.log("Error: third call to `biopac` failed. Giving up.");
							metaObj = {"stimId": NaN, "stimName": "BiopacFail", "startStamp": NaN, "stopTime": NaN};
							sendLogEntry({"eventCode": 600, "meta": metaObj});
						});
					});
				});
	
				metaObj = {"stimId": "ScanWait", "stimName": "ScanWait", "startStamp": NaN, "stopTime": NaN};
				sendLogEntry({"eventCode": 99, "meta": metaObj});
			},
			on_finish: function()
			{
				metaObj = {"stimId": "Scan", "stimName": "ScanStart", "startStamp": NaN, "stopTime": NaN};
				sendLogEntry({"eventCode": 100, "meta": metaObj});	

				$.get(
				"biopac-run-on",
				function()
				{
					metaObj = {"stimId": NaN, "stimName": "Biopac_run_on", "startStamp": NaN, "stopTime": NaN};
					sendLogEntry({"eventCode": 610, "meta": metaObj});
				}).fail(function()
				{
					metaObj = {"stimId": NaN, "stimName": "Biopac_run_on_fail", "startStamp": NaN, "stopTime": NaN};
					sendLogEntry({"eventCode": 611, "meta": metaObj});
				});	
			},
		};
		timelineToAdd.push(waitScannerBlock);
		
		timelineToAdd.push(fixationPointBlockForSeconds(10));
	}
	
	jsPsych.addNodeToEndOfTimeline({timeline: timelineToAdd}, new Function); // Apparent bug as of Feb 3, 2018 requires empty callback
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

// Tell server to make new sesh or link to existing
// Called after the instructions are dismissed and the loading screen is displayed
// Calls finishTimeline() when done
var linkSession = function()
{
	$.post(
		"link-session",
		{
			psiturkUid: psiturkUid ? psiturkUid : null,
			psiturkWorkerId: psiturkWorkerId ? psiturkWorkerId : null,
			labUserId: labUserId ? labUserId : null,
			wave: wave,
		},
		function(data)
		{
			if (data && data["sessionId"])
			{
				sessionId = Number(data["sessionId"]); // Always sent
				resumedSession = Boolean(data["resuming"]); // Always sent
				stimuli = data["validStim"]; // Always sent
				emotions = data["emotions"]; // Empty when not resuming open session
				sequence = data["sequence"]; // Empty when not resuming open session
				finishTimeline();
				if (scanning) console.log(sequence);
			}
			else
			{
				console.log("Error: no session ID returned from server after request to start session.");
				failOurFault();
			}
		},
		"json"
	).fail(function(data)
	{
		console.log("Error: request to start session failed; the following response was returned:");
		console.log(data.responseJSON);
		failOurFault();
	});
};

// Tools to build repetitive blocks: videos, ratings, and messages between videos

// Build a video block
var videoBlockForStimAndTimes = function(stimId, startTime, stopTime)
{
	var block =
	{
		type: "video",
		sources: [(stimRemote.length > 0 ? stimRemote : stimBase) + stimWithId(stimId).filename],
		start: startTime > 5 ? startTime - 5 : 0,
		stop: stopTime,
		indicateLoading: true,
		promptEnableAutoplay: true,
		width: 850,
		height: 650,
		on_start: function() {
			if (scanning)
			{
				trialNum = startTime>5 ? trialNum + 1 : 1,
				$(document).on("visibilitychange");
				metaObj = {"stimId": stimId, "stimName": stimWithId(stimId).filename, "trial":trialNum, "startStamp": startTime, "stopTime": stopTime};
				sendLogEntry({"eventCode": 300, "meta": metaObj});
			}
			else
			{
				$(document).on("visibilitychange", visibilityListener);
			}
				

		},
		on_finish: function()
		{
			$(document).off("visibilitychange", visibilityListener);
			metaObj = {"stimId": stimId, "stimName": stimWithId(stimId).filename, "trial":trialNum, "startStamp": startTime, "stopTime": stopTime};
			if (scanning) sendLogEntry({"eventCode": 399, "meta": metaObj});
		},
	};
	return block;
};

// Build a rating block
var ratingBlockForStimAndTimes = function(stimId, startTime, stopTime)
{
	var block = {
		type: "rapid-rate",
		items: emotions,
		logCommits: true,
		topMsg: "Please rate how you're feeling on the following emotions:",
		bottomMsg: scanning ? "Right click when finished." : "Press 'space' when finished.",
		rightClickSubmit: scanning,
		defaultNone: true,
		showShadows: true,
		darkTheme: scanning,
		submitTimeout: scanning ? 90 : -1,
		on_start: function()
		{
			if (scanning)
			{
				metaObj = {"stimId": stimId, "stimName": stimWithId(stimId).filename, "trial":trialNum, "startStamp": startTime, "stopTime": stopTime};
				sendLogEntry({"eventCode": 400, "meta": metaObj});
			}
		},
		on_finish: function(ratingData)
		{
			metaObj = {"stimId": stimId, "stimName": stimWithId(stimId).filename, "trial":trialNum, "startStamp": startTime, "stopTime": stopTime};
			if (scanning) sendLogEntry({"eventCode": 499, "meta": metaObj});
			TS = new Date();
			var payload =
			{
				sessionId: sessionId,
				stimulusId: stimId,
				pollSec: stopTime,
				sliceStartSec: startTime,
				reactionTime: ratingData["rt"],
				clientTS: TS.getTime(),
				intensities: JSON.stringify(ratingData["ratings"]),
				ratingHistory: JSON.stringify(ratingData["commitLog"]),
			};
			if (!payload["reactionTime"])
			{
				payload["reactionTime"] = -1 // If we don't have a reaction time, send -1 instead of nothing so the server accepts it
			}
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

// Build timeline for between videos; either scanner stuff or just a message
var buildBetweenBlocks = function()
{
	var thisTimeline = [];

	if (scanning)
	{
		var crossBlock = fixationPointBlockForSeconds(10);
		thisTimeline.push(crossBlock);
		
		var waitBlock =
		{
			type: "html-keyboard-response",
			stimulus: "Preparing next video...",
			choices: ['1'],
		
			on_start: function()
			{
				$.get(
				"biopac-run-off",
				function()
				{
					metaObj = {"stimId": NaN, "stimName": "Biopac_run_off", "startStamp": NaN, "stopTime": NaN};
					sendLogEntry({"eventCode": 620, "meta": metaObj});
				}).fail(function()
				{
					metaObj = {"stimId": NaN, "stimName": "Biopac_run_off_fail", "startStamp": NaN, "stopTime": NaN};
					sendLogEntry({"eventCode": 621, "meta": metaObj});
				});	

				sendLogEntry({"eventCode": 500});
			},
			on_finish: function()
			{
				sendLogEntry({"eventCode": 599});
			},
		};
		thisTimeline.push(waitBlock);
		
		var loadBlock =
		{
			type: "html-keyboard-response",
			choices: ['5'],
			// isWaitingScreen: true,
			stimulus: "Please wait, scanner loading...",
		
			on_start: function()
			{
				metaObj = {"stimId": "ScanWait", "stimName": "ScanWait", "startStamp": NaN, "stopTime": NaN};
				sendLogEntry({"eventCode": 99, "meta": metaObj});
			},
			on_finish: function()
			{
				metaObj = {"stimId": "Scan", "stimName": "ScanStart", "startStamp": NaN, "stopTime": NaN};
				sendLogEntry({"eventCode": 100, "meta": metaObj});

				$.get(
					"biopac-run-on",
					function()
					{
						metaObj = {"stimId": NaN, "stimName": "Biopac_run_on", "startStamp": NaN, "stopTime": NaN};
						sendLogEntry({"eventCode": 610, "meta": metaObj});
					}).fail(function()
					{
						metaObj = {"stimId": NaN, "stimName": "Biopac_run_on_fail", "startStamp": NaN, "stopTime": NaN};
						sendLogEntry({"eventCode": 611, "meta": metaObj});
					});	
			},
		};
		
		thisTimeline.push(loadBlock)
		thisTimeline.push(crossBlock);
	}
	else
	{
		// Canned between-videos message
		var inBetweenBlock =
		{
			type: "html-keyboard-response",
			stimulus: "<p> Next video will start soon.</p><p>Click the spacebar to begin.</p>",
		};
		thisTimeline.push(inBetweenBlock);
	}

	return thisTimeline;
}

// Finish constructing the timeline by adding the actual videos and ratings
// Called by linkSession()
var finishTimeline = function()
{	
	// Make sure that users are actually watching the video
	visibilityListener = function(event)
	{
		if (document.visibilityState == "hidden")
		{
			var videoEl = document.getElementById("jspsych-video-player");
			videoEl.pause();
			alert("To complete this trial, all videos must remain visible and audible.");
			videoEl.play();
		}
	};
	
	// If this is a new session, generate `emotions` and `sequence` values for it and send them to the server
	if (!resumedSession)
	{
		// Each user will have emotions presented in a random order, but the order will remain consistent for that user
		emotions = jsPsych.randomization.shuffle(['Angry', 'Amused', 'Hopeful', 'Anxious', 'Sad', 'Bored', 'Uncomfortable', 'Disgusted', 'Moved', 'Relieved', 'Proud', 'Surprised', 'Happy', 'Frustrated', 'Afraid', 'Inspired',]);
		
		// Build the sequence (sets the `sequence` global)
		var seqSuccess = buildSequence();
		if (!seqSuccess) 
		{
			jsPsych.endExperiment("Sorry, you have already watched all available videos. Thank you for your participation.");
			return;
		}
	}
	else if (scanning)
	{
		sendLogEntry({"eventCode": 110});
	}
	
	var timelineToAdd = [];
	
	// Loop through and build repetitive blocks 
	for (var i = 0; i < sequence.length; i ++)
	{
		var stimObj = sequence[i],
			thisStim = stimObj["stimulus"],
			starts = stimObj["starts"];

		if (scanning) console.log("STIM: " + stimWithId(thisStim).filename + " #" + thisStim);
		
		for (var j = 0; j < starts.length; j ++)
		{
			var thisStart = starts[j],
					stop;
			// Stop at the next start time if there is one, or the end of the video if not
			if (j < (starts.length - 1)) stop = starts[j + 1];
			// Avoid edge case where last stop is end of video
			else if (starts[j] < stimWithId(thisStim).duration) stop = stimWithId(thisStim).duration;
			if (stop)
			{
				timelineToAdd.push(videoBlockForStimAndTimes(thisStim, thisStart, stop));
				var ratingBlock = ratingBlockForStimAndTimes(thisStim, thisStart, stop);
				if (j == 0) ratingBlock["showShadows"] = false;
				timelineToAdd.push(ratingBlock);
			}
		}
		
		// Add an in-between block if there is another video to play
		if (i < (sequence.length -1 ))
		{
			timelineToAdd = timelineToAdd.concat(buildBetweenBlocks());
		}
		// Clean up after the last video if scanning
		else if (scanning)
		{
			var afterLastVideoBlocks = [];
			afterLastVideoBlocks.push(fixationPointBlockForSeconds(10));
			var cleanupBlock =
			{
				type: "html-keyboard-response",
				stimulus: "<p></p>",
				choices: [jsPsych.NO_KEYS,],
				isWaitingScreen: true,
				on_start: function()
				{
					$.get(
					"cleanup",
					function()
					{
						// Clear the loading screen now and move on
						if (jsPsych.currentTrial()["isWaitingScreen"] === true)
						{
							jsPsych.finishTrial();
						}
					}).fail(function()
					{
					console.log("Error: call to `cleanup` failed.");
						failOurFault();
					});
				},
			};
			afterLastVideoBlocks.push(cleanupBlock);
			timelineToAdd = timelineToAdd.concat(afterLastVideoBlocks);
		}
	}
	
	if (!scanning)
	{
		var surveyBlock =
		{
			type: "survey-text",
			preamble: "Thank you for finishing this video. Before you go, please answer the following questions.<br /><em>Note: if you have completed this task before, you are not required to answer these questions again.</em>",
			// Have to specify all properties in `questions` because of a bug in the current version of
			// the survey-text plugin (as of Jan 17, 2018).
			questions: [{prompt: "<strong>Your Gender:</strong>", rows: 1, columns: 20, value: "",},
						{prompt: "<strong>Your Age:</strong>", rows: 1, columns: 20, value: "",},
						{prompt: "<p><strong>Your Ethnicity</strong><br />(Please copy and paste one item into the following text box)<ul style='display:inline-block;'><li>Hispanic</li><li>Not Hispanic</li><li>Other</li></ul></p>", rows: 1, columns: 20, value: "",},
						{prompt: "<p><strong>Your Race:</strong><br />(Please copy and paste one item into the following text box)<ul style='display:inline-block;'><li>American Indian / Alaksan Native</li><li>Asian / Asian American</li><li>Black / African American</li><li>Native Hawaiian / Other Pacific Islander</li><li>White</li><li>Multi</li><li>Other</li></ul></p>", rows: 1, columns: 20, value: "",},
						{prompt: "Feedback on this Task:", rows: 6, columns: 40, value: "",}],
			on_finish: function(data)
			{
				var answers = JSON.parse(data.responses),
					questions = this.questions,
					surveyData = {};
				// Necessary b/c the jsPsych plugin returns something like {Q0: "answer", Q1: "answer"} without actual question names
				Object.keys(answers).forEach(function(key)
				{
					var questionNum = parseInt(key.slice(1)), // Strip the leading 'Q' and get the numeric index
						question = questions[questionNum].prompt,
						answer = answers[key];
					surveyData[question] = answer;
				});
				exitSurvey = JSON.stringify(surveyData);
			},
		};
		timelineToAdd.push(surveyBlock);
	}
	
	var endMsgText = "Thank you for participating! Please wait a moment and press 'space' if this HIT is not automatically submitted. If you encounter any errors during submission, do not worry; contact <a href='mailto:cosanlab@gmail.com'>cosanlab@gmail.com</a> and you will be fully compensated for completing this HIT.";
	if (scanning) endMsgText = "<p>This is the end of the run.</p>Please stay still and wait for the experimenter to contact you</p><ul><li><a href='cleanup/'>cleanup</a></li><li><a href = '/stop-session?sessionId=" + sessionId + "'>stop session</a></li></ul>";
	var endMsg =
	{
		type: "html-keyboard-response",
		stimulus: endMsgText,
		on_start: stopSession,
		on_finish: function() { Turkframe.messageFinished({sessionId: sessionId}) }, // Extra fallback just in case.
	 };
	timelineToAdd.push(endMsg);
	
	jsPsych.addNodeToEndOfTimeline({timeline: timelineToAdd}, new Function); // Apparent bug as of Feb 3, 2018 requires empty callback
	
	if (!resumedSession)
	{
		// Send the session details to the server, then clear the loading screen and move on
		$.post(
			"set-session-details",
			{
				sessionId: sessionId,
				emotions: JSON.stringify(emotions),
				sequence: JSON.stringify(sequence),
			},
			function(data)
			{
				if ((data && data["sessionId"]))
				{
					// Clear the loading screen now and move on
					if (jsPsych.currentTrial()["isLoadScreen"] === true)
					{
						jsPsych.finishTrial();
					}
				}
				else
				{
					console.log("Error: couldn't set session details: no sessionId returned by server.");
					failOurFault();
				}
			},
			"json"
		).fail(function(data)
		{
			console.log("Error: couldn't set session details:");
			console.log(data.responseJSON);
			failOurFault();
		});
	}
	else
	{
		// Clear the loading screen now and move on
		if (jsPsych.currentTrial()["isLoadScreen"] === true)
		{
			jsPsych.finishTrial();
		}
	}
};

// Fucntion to tell the server the session is done.
// Also hands control back to PsiTurk if running in Turkframe
// Called at jsPsych's on_finish
var stopSession = function()
{
	$.post(
		"stop-session",
		{
			sessionId: sessionId,
			exitSurvey: exitSurvey,
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

var failOurFault = function()
{
	var errMsg = "We're sorry, an error occured. This task will be ended.";
	if (Turkframe.inTurkframeMode()) errMsg += " You WILL be paid in full for this HIT.";
	alert(errMsg);
	jsPsych.endExperiment(errMsg);
	Turkframe.messageFinished({sessionId: sessionId});
}

// Run the experiment
jsPsych.init({
	timeline: timeline,
});

if (scanning) {
	var scannerTheme = document.createElement("style");
	scannerTheme.innerHTML = "body{color: white; background-color: black;}";
	document.body.appendChild(scannerTheme);
}

// If no login work needs to be done, start the rest of the pre-trial timeline
if (Turkframe.inTurkframeMode())
{
	continuePreTrialTimeline();
}


var test = function(subjects, duration, interval)
{
	var stops = [];
	for (var i = 0; i < subjects; i ++)
	{
		var times = createTimesForDurationAndSampleInterval(duration, interval),
			roundedTimes = [];
		for (var j = 0; j < times.length; j ++)
		{
			roundedTimes.push(Math.round(times[j]));
		}
		stops = stops.concat(roundedTimes);
	}
	var sums = {};
	for (var i = 0; i < stops.length; i ++)
	{
		var thisStop = stops[i];
		if (sums[thisStop]) sums[thisStop] = sums[thisStop] + 1;
		else sums[thisStop] = 1;
	}
	var strings = [];
	for (var i = 0; i < duration; i ++)
	{
		if (!sums[i]) sums[i] = 0;
		strings.push(i.toString() + ": " + "#".repeat(sums[i]));
	}
	strings.shift();
	console.log(strings.join("\n"));
}




