import os
import glob
from flask import Flask, send_file, make_response, render_template, request
from flask_script import Manager, Shell
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)

app.config['wave'] = #SET ME
app.config['num_stops'] = 1 # usually ignored
app.config['num_stim'] = -1 # set me
app.config['use_tag_order'] = 0
app.config['sample_interval'] = 60
app.config['sample_time_jitter'] = 0.33 # set me
app.config['tags'] = "scan0"
app.config['hit_duration_mins'] = 150 # SET ME
app.config['stim_base'] = "static/stim/"
#app.config['stim_remote'] = "https://prefix.somecdn.com/" # Remote stim path
app.config['SQLALCHEMY_DATABASE_URI'] = "mysql://moth_radio:password@localhost/moth_radio" # DON'T COMMIT PASSWORDS!
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 0
app.config['scanning'] = False
app.config['use_biopac'] = False
db = SQLAlchemy(app)

if app.config['scanning']:
	import logging
	import sys
	logging.basicConfig(filename='error.log',level=logging.DEBUG)
	logging.getLogger().addHandler(logging.StreamHandler(sys.stdout))

from moth_radio import models, views, apis
#creating the database- not going to overwrite preexisting 
db.create_all()

# Force an import of stimuli on startup
apis.fetchStimuli(forceImport = True)

if app.config['use_biopac']:
	from psychopy.hardware.labjacks import U3
	lj = U3()
	cal_data = lj.getCalibrationData()
	# mkae sure pins are configured to digital
	lj.configIO(FIOAnalog=0,EIOAnalog=0)
	#Make sure we start with the triggers off
	if lj.getFIOState(0) == 1:
		lj.setFIOState(0,0) 
	if lj.getFIOState(1) == 1:
		lj.setFIOState(1,0)

	lj.close()

#application instance- web server passes all requests it receives from clients to this object for handling iusing WSGI
#app instance needs to know what to run for each requested URL so route
 
manager = Manager(app)
bootstrap = Bootstrap(app)


#add check to see if database is empty




# #run method that launches Flask's web dev server
# if __name__ == '__main__': #ensure that server started only when script executed directly
#     #app.debug= DEBUG
#     app.run() #once server starts up, goes into a lopp waiting for requests and servicing them
