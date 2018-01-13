'''
Helper functions supporting moth_radio and JSON APIs exposing them.

JSON APIs must be called from the same origin as the app; i.e. they're
usable as AJAX calls from calls from templates, but not from `curl`
on your machine at home unless you're in debug mode. Note that this
'security' depends on forgable HTTP headers, so it's not bulletproof.
'''

from moth_radio import app, db, models
from flask import request, jsonify
import json

###### Origin Control ######

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

# Check if a request's origin is on the whitelist.
def checkValidOrigin(request):
	origin = request.environ.get("HTTP_ORIGIN")
	if origin and origin in allowedOrigins:
		return True
	else:
		return False

####### Stimuli	 ######

# Load stimuli from the database, optionaly forcing an import of new stimuli first
def fetchStimuli(count = None, modality = None, forceImport = False):
	if forceImport:
		from os import path, listdir
		from ffprobe import FFProbe

		# TODO: Expand to support audio-only modality.
		stimLocation = path.relpath(path.dirname(__file__)) + "/" + app.config["stim_base"]
		stimFiles = listdir(stimLocation, )
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
	

	
@app.route("/test", methods = ["POST"])
def testRoute():
	if not checkValidOrigin(request):
		return badOriginResponse
	response = jsonify(test = "successful")
	return response
