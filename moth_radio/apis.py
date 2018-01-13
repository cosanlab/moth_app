'''
Helper functions supporting moth_radio and JSON APIs exposing them.

JSON APIs must be called from the same origin as the app; i.e. they're
usable as AJAX calls from calls from templates, but not from `curl`
on your machine at home unless you're in debug mode. Note that this
'security' depends on forgable HTTP headers, so it's not bulletproof.
'''

from moth_radio import app
from flask import request, jsonify
import json

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
	
@app.route("/test", methods = ["POST"])
def testRoute():
	if not checkValidOrigin(request):
		return badOriginResponse
	response = jsonify(test = "successful")
	return response
