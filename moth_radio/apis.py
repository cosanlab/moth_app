'''
Helper functions supporting moth_radio and JSON APIs exposing them.

If a JSON API takes parameters, they must be sent as a JSON payload
and the `content-type` on your request should be `application/json`.

JSON APIs must be called from the same origin as the app; i.e. they're
usable as AJAX calls from calls from templates, but not from `curl`
on your machine at home unless you're in debug mode. Note that this
'security' depends on forgable HTTP headers, so it's not bulletproof.
'''

from moth_radio import app, db, models
from flask import request, jsonify
import json, math, time
if app.config["scanning"]: import serial
if app.config["use_biopac"]: from psychopy.hardware.labjacks import U3 

###### Infrastructure / Helpers ######

# Whitelist for origins to accept.
allowedOrigins = ["http://cosanlabradio.dartmouth.edu/", "https://cosanlabradio.dartmouth.edu/"]
# Origins added to the whitelist only while debugging.
if app.debug:
	allowedOrigins.append("http://localhost:5000/")
	allowedOrigins.append("chrome-extension://cokgbflfommojglbmbpenpphppikmonn/") #'REST Console' Chrome app, useful for debugging
	
# A generic response to send when something is wrong with a request.
badRequestResponse = app.response_class(
	response = json.dumps({"error": "Invalid request. Check the docs and make sure you're sending enough info, properly formatted."}),
	status = 400,
	mimetype = "application/json"
)	

# A generic response to send when a request comes from an invalid origin.
badOriginResponse = app.response_class(
	response = json.dumps({"error": "This is not a public API; it is only meant to be accessed via AJAX from within moth_radio."}),
	status = 403,
	mimetype = "application/json"
)

# A generic response to send when a request is unsuccessful. Uses code 500 as a
# catch-all, but might also get thrown for other things. These APIs are meant for
# internal use by moth_radio; I'm not too worried about making them perfectly
# self-documenting or user-friendly.
failureResponse = app.response_class(
	response = json.dumps({"error": "The request failed."}),
	status = 500,
	mimetype = "application/json"
)

# Check if a request's origin is on the whitelist.
def checkValidOrigin(request):
	origin = request.environ.get("HTTP_REFERER")
	if not origin: return False
	for thisOrigin in allowedOrigins:
		if origin.startswith(thisOrigin):
			return True
	return False

###### Stimuli	######

# Load stimuli from the database, optionaly forcing an import of new stimuli first
def fetchStimuli(count = None, modality = None, forceImport = False):
	if forceImport:
		from os import path, listdir
		from ffprobe import FFProbe

		# TODO: Expand to support audio-only modality.
		stimLocation = path.relpath(path.dirname(__file__)) + "/" + app.config["stim_base"]
		stimFiles = listdir(stimLocation)
		stimObjs = []
		for stimFile in stimFiles:
			# Only look at .mp4 files
			# Check if a stimulus with this filename already exists, and add it if not.
			if stimFile.endswith(".mp4") and models.Stimulus.query.filter_by(filename = stimFile).first() is None:
				durationStr = FFProbe(stimLocation + stimFile).video[0].duration
				duration = int(round(float(durationStr)))
				stimObj = models.Stimulus(filename = stimFile, modality = "video", duration = duration)
				stimObjs.append(stimObj)
		try:
			db.session.add_all(stimObjs)
			db.session.commit()
		except Exception as error:
			print "Error adding stimuli to database", error
	
	query = models.Stimulus.query.order_by(models.Stimulus.id)
	if modality:
		query = query.filter_by(modality = modality)
	if app.config.get("tags"):
		query = query.filter_by(tags = app.config["tags"])
	if count:
		query = query.limit(count)
	results = query.all()
	return results

# Find the stimuli that a given user has not already 	rated.
# Requires a labUserId or a psiturkWorkerId.
# Also takes arguments to pass to fetchStimuli().
# Returns an array of Stimulus objects.
def validStimuliForUser(labUserId = None, psiturkWorkerId = None, count = None, modality = None, forceImport = None):
	if not (labUserId or psiturkWorkerId): return False
	
	# Find closed sessions for this user
	query = models.Session.query.filter(models.Session.stopTime != None)
	if labUserId:
		query = query.filter_by(labUserId = labUserId)
	if psiturkWorkerId:
		query = query.filter_by(psiturkWorkerId = psiturkWorkerId)
	sessions = query.all()
	# Grab an open session if there is one and add it to the list
	openSesh = retrieveOpenSession(labUserId = labUserId, psiturkWorkerId = psiturkWorkerId)
	if openSesh: sessions.append(openSesh)
	
	badStims = []
	
	if sessions:
		# Loop through sessions and make a list of stimulus IDs to exclude...
		for sesh in sessions:
			seq = json.loads(sesh.sequence)
			for stimObj in seq:
				badStims.append(stimObj.get("stimulus"))
		# ...but add back anything from the open session that hasn't been finished yet.
		openRemain = remainingSequenceForSession(openSesh)
		if openRemain:
			for stimObj in openRemain:
				badStims.remove(stimObj.get("stimulus"))
	
	# Grab all the relevant stimuli and filter them down
	allStim = fetchStimuli(count = count, modality = modality, forceImport = forceImport)
	validStim = [stim for stim in allStim if stim.id not in badStims]
	
	return validStim
	
###### Lab Users ######

# Create a new lab user
# Requires a name and email
# Returns the new LabUser object, or False if missing info / user already exists
def createLabUser(name = None, email = None):
	if not (name and email): return False
	existing = models.LabUser.query.filter_by(name = name, email = email).first()
	if existing: return False
	user = models.LabUser()
	user.name = name
	user.email = email
	db.session.add(user)
	db.session.commit()
	return user
	
# Look up an existing lab user by name and email
# Requires a name and email
# Returns the relevant LabUser object, or False if none found or missing info
# Note: LabUsers does not currently force unique across name/email, so there could be more than one
# (although there won't be if these APIs are used properly). This method returns the first match encountered.
def lookUpLabUser(name = None, email = None):
	if not (name and email): return False
	user = models.LabUser.query.filter_by(name = name, email = email).first()
	if not user: return False
	return user

# Endpoint to get the id of an existing user based on name and email
# Requires a name and email
# Responds with the id of the user, or a 500 error if the specified user does not exist
@app.route("/login-lab-user", methods = ["POST"])
def loginLabUser():
	if not checkValidOrigin(request): return badOriginResponse
	name = request.form.get("name")
	email = request.form.get("email")
	if not (name and email): return badRequestResponse
	user = lookUpLabUser(name = name, email = email)
	if not user: return failureResponse;
	respDict = {"userId": user.id}
	response = jsonify(respDict)
	return response
	
# Endpoint to get the id of an existing user based on name and email
# Requires a name and email
# Responds with the id of the user, or a 500 error if the specified user already exists
@app.route("/create-lab-user", methods = ["POST"])
def makeLabUser():
	if not checkValidOrigin(request): return badOriginResponse
	name = request.form.get("name")
	email = request.form.get("email")
	if not (name and email): return badRequestResponse
	user = createLabUser(name = name, email = email)
	if not user: return failureResponse;
	respDict = {"userId": user.id}
	response = jsonify(respDict)
	return response
	
###### Sessions ######

# Create a new session, and set its starTime to now.
# Requires either a LabUser ID or PsiTurk UID + worker ID.
# Returns the new Session object, or False if missing info
def startNewSession(labUserId = None, psiturkUid = None, psiturkWorkerId = None, wave = None):
	# We need one form of ID or the other
	if not (labUserId or (psiturkUid and psiturkWorkerId)): return False
	sesh = models.Session()
	if labUserId: sesh.labUserId = labUserId
	if psiturkUid: sesh.psiturkUid = psiturkUid
	if psiturkWorkerId: sesh.psiturkWorkerId = psiturkWorkerId
	if wave: sesh.wave = wave
	sesh.startTime = math.floor(time.time())
	db.session.add(sesh)
	db.session.commit()
	return sesh

# Find the most recent open session for a given user.
# Requires either a LabUser ID or PsiTurk worker ID.
# Returns the relevant Session object, or False if none is found.
# import pdb
def retrieveOpenSession(labUserId = None, psiturkWorkerId = None):
	# We need one form of ID or the other
	if not (labUserId or psiturkWorkerId): return False
	query = models.Session.query
	if labUserId:
		query = query.filter_by(labUserId = labUserId)
	if psiturkWorkerId:
		query = query.filter_by(psiturkWorkerId = psiturkWorkerId)
	# pdb.set_trace()
	# Sessions must have been started within a certain recency to be re-openable
	timeout = 60 * app.config["hit_duration_mins"]
	expDate = math.floor(time.time()) - timeout
	# pdb.set_trace()
	# Get the most recent open session for this user, if one exists
	query = query.filter(\
							models.Session.stopTime == None,\
							models.Session.startTime >= expDate,\
							models.Session.emotions != None,\
							models.Session.sequence != None\
						).order_by(models.Session.startTime.desc())
	session = query.first()
	if not session: return False
	return session

# Compute the portion of sequence that has yet to be completed on a given open session.
# Works by checking the most recent rating associated with the session, matching it to a point
# in the session's sequence, and returning all further points in the sequence.
# Requires a Session object.
# Returns a sequence array.
def remainingSequenceForSession(session = None):
	if session and session.sequence:
		# Get the last rating saved from this session
		lastRating = latestRatingForSession(session)
		# If no ratings have been saved yet, return the entire sequence
		if not lastRating: return json.loads(session.sequence)
		remainingSeq = []
		hitLastStim = False
		seq = json.loads(session.sequence)
		# Iterate through the stimuli in this sequence
		for stimSeq in seq:
			thisStim = stimSeq.get("stimulus")
			if not hitLastStim:
				# If the last stim to be rated hasn't been hit yet and this stim still isn't it,
				# keep going and do nothing with this one; it's already done.
				if thisStim != lastRating.stimulusId:
					print "continuing past "
					print thisStim
					continue
				# If this stim is the last stim to be rated, note that we've reached it
				# and figure out which stops have yet to be reached.
				hitLastStim = True
				query = models.Stimulus.query
				query = query.filter_by(id = int(thisStim))
				duration = query.first().duration
				starts = stimSeq.get("starts", [])
				starts.append(duration)
				# The first start left is the moment the last rating was taken
				firstStartLeftIdx = starts.index(float(lastRating.pollSec))
				startsLeft = starts[firstStartLeftIdx:]
				if len(startsLeft) < 2: continue
				# If at least one start is left for this stim, add it to the remaining sequence
				remainingSeq.append({"stimulus": thisStim, "starts": startsLeft})
			else:
				# If we've alredy hit and dealt with the last stim to be rated, go ahead and add
				# the following ones in their entirety; they haven't been started yet.
				remainingSeq.append(stimSeq)
		return remainingSeq
	return False

# Endpoint to either link up to an open session or create a new one.
# Requires either a LabUser ID or PsiTurk UID + worker ID as `labUserId` or `psiturkUid` + `psiturkWorkerId`,
# and a wave identifier as `wave`.
# Responds with the new session's id and the stimuli valid for this user at this time
# (i.e. that they have not already rated).
# Also responds with emotions and sequence arrays, which are null if the session is new
# and populated if it was already open.
@app.route("/link-session", methods = ["POST"])
def linkSession():
	if not checkValidOrigin(request): return badOriginResponse
	labUserId = request.form.get("labUserId")
	psiturkUid = request.form.get("psiturkUid")
	psiturkWorkerId = request.form.get("psiturkWorkerId")
	wave = request.form.get("wave")
	if not (labUserId or (psiturkUid and psiturkWorkerId)): return badRequestResponse
	resuming = True
	session = retrieveOpenSession(labUserId = labUserId, psiturkWorkerId = psiturkWorkerId)
	print session
	# Start a new session if no open one was found
	if not session:
		resuming = False
		session = startNewSession(labUserId = labUserId, psiturkUid = psiturkUid, psiturkWorkerId = psiturkWorkerId, wave = wave)
	if not session: return failureResponse
	validStim = validStimuliForUser(labUserId = labUserId, psiturkWorkerId = psiturkWorkerId)
	# Make stimuli JSON-serializable
	stimPrims = []
	for thisStim in validStim:
		primObj = {
			"id": thisStim.id,
			"filename": thisStim.filename,
			"duration": thisStim.duration,
			"modality": thisStim.modality,
			"tags": thisStim.tags,
			"tagOrder": thisStim.tagOrder
		}
		stimPrims.append(primObj)
	respDict = {
		"sessionId": session.id,
		"resuming": resuming,
		"validStim": stimPrims,
		"emotions": json.loads(session.emotions) if session.emotions else None, # Avoid trying to JSON-parse nothing
		"sequence": remainingSequenceForSession(session)
	}
	response = jsonify(respDict)
	return response

# Set the details of an open session (i.e. its `emotions` and `sequence` fields).
# Requires a session ID, plus JSON strings for emotions and sequence.
# Returns the Session object that was updated.
def setSessionDetails(sessionId = None, emotions = None, sequence = None):
	if not sessionId and emotions and sequence: return False
	sesh = models.Session.query.get(sessionId)
	if not sesh: return False # Nothing with that ID found
	sesh.emotions = emotions
	sesh.sequence = sequence
	db.session.commit()
	return sesh
	
# Endpoint to set the details of an open session (i.e. its `emotions` and `sequence` fields).
# Requires a session ID as `sessionId`, plus JSON strings for `emotions` and `sequence`.
# Responds with the session's id.
@app.route("/set-session-details", methods = ["POST"])
def setSeshDetails():
	if not checkValidOrigin(request): return badOriginResponse
	sessionId = request.form.get("sessionId")
	emotions = request.form.get("emotions")
	sequence = request.form.get("sequence")
	if not (sessionId and emotions and sequence): return badRequestResponse
	session = setSessionDetails(sessionId, emotions = emotions, sequence = sequence)
	if not session: return failureResponse
	respDict = {"sessionId": session.id}
	response = jsonify(respDict)
	return response
	
# Stop an open session (i.e. set its stopTime to now).
# Requires a session ID.
# Returns the Session object that was ended.
def stopSession(sessionId = None):
	if not sessionId: return False
	sesh = models.Session.query.get(sessionId)
	if not sesh: return False # Nothing with that ID found
	sesh.stopTime = math.floor(time.time())
	db.session.commit()
	return sesh

# Endpoint to stop an open session (i.e. set its stopTime to now).
# Requires a session ID as `sessionId`.
# Optinally accepts an `exitSurvey` JSON string. 
# Responds with the session's id.
import pdb
@app.route("/stop-session", methods = ["GET"])
def stopSesh():
	# if not checkValidOrigin(request): return badOriginResponse
	# pdb.set_trace()
	sessionId = request.args.get("sessionId")
	# exitSurvey = request.form.get("exitSurvey")
	if not sessionId: return badRequestResponse
	session = stopSession(sessionId)
	if not session: return failureResponse
	# session.exitSurvey = exitSurvey
	respDict = {"sessionId": session.id}
	response = jsonify(respDict)
	return response

###### Ratings ######

# Take a Rating object and store it in the database.
# Requires sessionId, stimulusId, pollSec, sliceStartSec, and reactionTime
# Returns the Rating that was stored if successful, or false if not
def storeRating(rating):
	if not (rating.sessionId and rating.stimulusId and rating.pollSec and
			rating.sliceStartSec and rating.reactionTime):
			return False
	db.session.add(rating)
	db.session.commit()
	return rating

# Endpoint to create a Rating object and store it in the database.
# Requires sessionId, stimulusId, pollSec, sliceStartSec, and reactionTime
# Responds with the id of the rating that was stored
@app.route("/save-rating", methods = ["POST"])
def saveRating():
	if not checkValidOrigin(request): return badOriginResponse
	rating = models.Rating()
	rating.sessionId = request.form.get("sessionId")
	rating.stimulusId = request.form.get("stimulusId")
	rating.timestamp = math.floor(time.time())
	rating.pollSec = request.form.get("pollSec")
	rating.sliceStartSec = request.form.get("sliceStartSec")
	rating.reactionTime = request.form.get("reactionTime")
	rating.intensities = request.form.get("intensities")
	rating.ratingHistory = request.form.get("ratingHistory")
	
	rating = storeRating(rating)
	if not rating: return badRequestResponse # Was probably missing some property
	respDict = {"ratingId": rating.id}
	response = jsonify(respDict)
	return response

# Find the most recent rating associated with a given session.
# Requires a Session object.
# Returns the relevant Rating object, or false if none was found.
def latestRatingForSession(session = None):
	if not session and session.id: return False
	rating = models.Rating.query.filter_by(sessionId = session.id).order_by(models.Rating.timestamp.desc()).first()
	if not rating: return False
	return rating

@app.route("/scanner-ready", methods = ["GET"])
def scannerReady():
	print "starting scanner ready: " + str(time.time())
	if not checkValidOrigin(request): return badOriginResponse
	
	validTrigger = '5'
	trigger=''
	if  app.config['scanning']:
		serial_settings = app.config['scanner_settings']
		ser = serial.Serial(serial_settings['mount'], serial_settings['baud'], timeout = serial_settings['timeout'])
		ser.flushInput()
		
	while trigger != validTrigger:
	   # print(trigger)
	   if app.config['scanning']:
		   trigger= ser.read()
	   else:
	   	   # print "sleeping for real"
		   time.sleep(10)
		   trigger = validTrigger	

	print(trigger)
	if app.config['use_biopac']:
	   lj = U3()
	   lj.setFIOState(0,1)
	   lj.close() # Turn trigger on

	respDict = {"scannerReady": True}
	print "finishing scanner ready: " + str(time.time())
	return jsonify(respDict)

@app.route("/cleanup", methods = ["GET"])
def cleanup():
	if app.config['use_biopac']:
	   lj = U3()
	   lj.setFIOState(0,0)
	   lj.close()
	if  app.config['scanning']:
		serial_settings = app.config['scanner_settings']
		ser = serial.Serial(serial_settings['mount'], serial_settings['baud'], timeout = serial_settings['timeout'])
		ser.flushInput()
		ser.close()
	return "Cleaned up."

def storeLog(log):
	if not (log.sessionId and log.timestamp and log.eventCode):
		return False
	db.session.add(log)
	db.session.commit()
	return log
	
@app.route("/save-log", methods = ["POST"])
def saveLog():
	if not checkValidOrigin(request): return badOriginResponse
	log = models.Log()
	log.sessionId = request.form.get("sessionId")
	log.timestamp = math.floor(time.time())
	log.eventCode = request.form.get("eventCode")
	log.meta = request.form.get("meta")
	logObj = storeLog(log)
	if not logObj: return badRequestResponse # Was probably missing some property
	respDict = {"logId": logObj.id}
	response = jsonify(respDict)
	return response
