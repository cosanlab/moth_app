# jsPsych and Flask Web App for Moth Study

## Dev/Debug Setup

1. Clone this repository
2. Navigate to project directory: `$ cd ~/path/to/moth_app`
3. Install virtualenv: `$ sudo pip install virtualenv`
4. Create a virtual environment for the app somewhere handy, e.g. `$ virtualenv venv/`
5. Activate the virtual environment, e.g. `$ . venv/bin/activate`
6. [Install Flask](http://flask.pocoo.org/docs/0.12/installation/) in the virutal environment: `(venv)$ sudo pip install Flask`
7. Install the moth app and its dependencies: from the `moth_app` directory, `(venv)$ pip install -e .`
8. Tell Flask which app you want: `(venv)$ export FLASK_APP=moth_radio`
9. Enable debug mode: `(venv)$ export FLASK_DEBUG=true`
10. [Install ffmpeg](https://www.ffmpeg.org/) (e.g. `(venv)$ brew install ffmpeg`). Required to add stimuli to the database, but not for running trials
11. [Install MySQL](https://gist.github.com/nrollr/3f57fc15ded7dddddcc4e82fe137b58e)
	1. Install the package (e.g. `(venv)$ brew install mysql`)
	2. Create a database `moth_radio`
	3. Create a user `moth_radio_flask` and give it a password
	4. Give the user privileges on the `moth_radio` database
12. Add your MySQL user's password after the `:` in `moth_radio/__init__.py` where `app.config['SQLALCHEMY_DATABASE_URI']` is set.
13. Start the app: `(venv)$ flask run`
14. Deactivate the virtual environment when finished: `(venv)$ deactivate`
