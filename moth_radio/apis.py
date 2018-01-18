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

###### Infrastructure / Helpers ######

# Whitelist for origins to accept.
allowedOrigins = ["http://cosanlabradio.dartmouth.edu"]
# Origins added to the whitelist only while debugging.
if app.debug:
	allowedOrigins.append("http://localhost:5000")
	allowedOrigins.append("chrome-extension://cokgbflfommojglbmbpenpphppikmonn") #'REST Console' Chrome app, useful for debugging
	
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
	origin = request.environ.get("HTTP_ORIGIN")
	if origin and origin in allowedOrigins:
		return True
	else:
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
	if count:
		query = query.limit(count)
	results = query.all()
	return results
	
# Currently no REST endpoint for fetchStimuli(); stimuli get passed to exp_moth_loop.html thru templating engine
	
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
# Requires either a LabUser ID or PsiTurk UID.
# Returns the new Session object, or False if missing info
def startNewSession(labUserId = None, psiturkUid = None):
	# We need one form of ID or the other
	if not (labUserId or psiturkUid): return False
	sesh = models.Session()
	if labUserId: sesh.labUserId = labUserId
	if psiturkUid: sesh.psiturkUid = psiturkUid
	sesh.startTime = math.floor(time.time())
	db.session.add(sesh)
	db.session.commit()
	return sesh

# Endpoint to create a new session and set its starTime to now.
# Requires either a LabUser ID or PsiTurk UID as `labUserId` or `psiturkUid`.
# Responds with the new session's id.
@app.route("/start-new-session", methods = ["POST"])
def startSesh():
	if not checkValidOrigin(request): return badOriginResponse
	labUserId = request.form.get("labUserId")
	psiturkUid = request.form.get("psiturkUid")
	if not (labUserId or psiturkUid): return badRequestResponse
	session = startNewSession(labUserId, psiturkUid)
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
# Responds with the session's id.
@app.route("/stop-session", methods = ["POST"])
def stopSesh():
	if not checkValidOrigin(request): return badOriginResponse
	sessionId = request.form.get("sessionId")
	if not sessionId: return badRequestResponse
	session = stopSession(sessionId)
	if not session: return failureResponse
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
