import os
import glob
from flask import Flask, send_file, make_response, render_template, request
from flask_script import Manager, Shell
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['num_stops'] = 5
app.config['num_stim'] = 5
app.config['stim_base'] = "static/stim/"
app.config['SQLALCHEMY_DATABASE_URI'] =\
	'sqlite:///' + os.path.join(basedir, 'data.sqlite')
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 0
db = SQLAlchemy(app)

from moth_radio import models, views
#creating the database- not going to overwrite preexisting 
db.create_all()

# *** Un-comment the following line to add stimuli to the database. Running this more than once will probably cause
# *** errors when the database rejects duplicate stimuli, so start with a clean `stimuli` table and run the script one time.
# import stim_toDB

#application instance- web server passes all requests it receives from clients to this object for handling iusing WSGI
#app instance needs to know what to run for each requested URL so route
 
manager = Manager(app)
bootstrap = Bootstrap(app)


#add check to see if database is empty




# #run method that launches Flask's web dev server
# if __name__ == '__main__': #ensure that server started only when script executed directly
#     #app.debug= DEBUG
#     app.run() #once server starts up, goes into a lopp waiting for requests and servicing them