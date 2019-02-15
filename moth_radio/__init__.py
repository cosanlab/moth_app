import os
import glob
from flask import Flask, send_file, make_response, render_template, request
from flask_script import Manager, Shell
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['wave'] = "1.0"
app.config['num_stops'] = 1 # usually ignored
app.config['num_stim'] = -1
app.config['use_tag_order'] = 1
app.config['sample_interval'] = 60
app.config['sample_time_jitter'] = 0.1
app.config['tags'] = "scan0"
app.config['hit_duration_mins'] = 150
app.config['stim_base'] = "static/stim/"
# app.config['stim_remote'] = "https://prefix.somecdn.com/" # Remote stim path
app.config['SQLALCHEMY_DATABASE_URI'] = "mysql://moth_radio:yourpassword@localhost/moth_radio" # DON'T COMMIT PASSWORDS!
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 0
app.config['scanning'] = False
app.config['scanner_settings'] = {
	'mount': '/dev/tty.KeySerial1',
	'baud': 115200,
	'timeout':0
}
app.config['use_biopac'] = True
db = SQLAlchemy(app)

from moth_radio import models, views, apis
#creating the database- not going to overwrite preexisting 
db.create_all()

# Force an import of stimuli on startup
apis.fetchStimuli(forceImport = True)

if app.config['use_biopac']:
	from psychopy.hardware.labjacks import U3
	lj = U3()
	cal_data = lj.getCalibrationData()
	if lj.getFIOState(0) == 1:
		lj.setFIOState(0,0) #Make sure we start with the trigger off

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
