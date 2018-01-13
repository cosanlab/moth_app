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
	
# A generic response to send when a request comes from an invalid origin.
badOriginResponse = app.response_class(
	response = json.dumps({"error": "This is not a public API."}),
	status = 403,
	mimetype = "application/json"
)

# A generic response to send when a request is unsuccessful. Uses code 500 as a
# catch-all, but might also get thrown for other things, e.g. incomplete requests.
# These APIs are meant for internal use by moth_radio; I'm not too worried about
# making them perfectly self-documenting or user-friendly.
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
	
###### Sessions ######

# Create a new session, and set its starTime to now
# Returns the new Session object
def startNewSession(labUserId = None, psiturkUid = None):
	# We need one form of ID or the other
	if not (labUserId or psiturkUid):
		return False
	session = models.Session()
	if labUserId: session.labUserId = labUserId
	if psiturkUid: session.psiturkUid = psiturkUid
	session.startTime = math.floor(time.time())
	db.session.add(session)
	db.session.commit()
	return session

# Endpoint to create a new session and set its starTime to now
# Responds with the session's id
@app.route("/start-new-session", methods = ["POST"])
def startSesh():
	if not checkValidOrigin(request):
		return badOriginResponse
	labUserId = str(request.form.get("labUserId"))
	psiturkUid = str(request.form.get("psiturkUid"))
	session = startNewSession(labUserId, psiturkUid)
	if not session:
		return failureResponse
	respDict = {"sessionId": session.id}
	response = jsonify(respDict)
	return response
