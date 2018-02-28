import os
import glob
from flask import Flask, send_file, make_response, render_template, request
from flask_script import Manager, Shell
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['wave'] = "2.1"
app.config['num_stops'] = 5 # usually ignored
app.config['num_stim'] = 1
app.config['use_tag_order'] = 1
app.config['sample_interval'] = 240
app.config['sample_time_jitter'] = 0.33
app.config['tags'] = "fnl"
app.config['hit_duration_mins'] = 150
app.config['stim_base'] = "static/stim/"
app.config['SQLALCHEMY_DATABASE_URI'] = "mysql://moth_radio:yourPassword@localhost/moth_radio" # DON'T COMMIT PASSWORDS!
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 0
db = SQLAlchemy(app)

from moth_radio import models, views, apis
#creating the database- not going to overwrite preexisting 
db.create_all()

# Force an import of stimuli on startup
apis.fetchStimuli(forceImport = True)

#application instance- web server passes all requests it receives from clients to this object for handling iusing WSGI
#app instance needs to know what to run for each requested URL so route
 
manager = Manager(app)
bootstrap = Bootstrap(app)


#add check to see if database is empty




# #run method that launches Flask's web dev server
# if __name__ == '__main__': #ensure that server started only when script executed directly
#     #app.debug= DEBUG
#     app.run() #once server starts up, goes into a lopp waiting for requests and servicing them