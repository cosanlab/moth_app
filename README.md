# jsPsych and Flask Web App for Moth Study

## Setup

*Adapted from the [Flask docs](http://flask.pocoo.org/docs/0.12/patterns/packages/).*

1. [Install Flask](http://flask.pocoo.org/docs/0.12/installation/) (`$ sudo pip install Flask`)
2. [Install ffmpeg](https://www.ffmpeg.org/) (e.g. `$ brew install ffmpeg`). Required to add stimuli to the database, but not for running trials.
3. [Install MySQL](https://gist.github.com/nrollr/3f57fc15ded7dddddcc4e82fe137b58e)
	1. Install the package (e.g. `$ brew install mysql`).
	2. Create a database `moth_radio`.
	3. Create a user `moth_radio_flask` and give it a password.
	4. Give the user privileges on the `moth_radio` database.
4. Add your MySQL user's password after the `:` in `moth_radio/__init__.py` where `app.config['SQLALCHEMY_DATABASE_URI']` is set.	
5. Navigate to project directory (`$ cd ~/path/to/moth_app`)
6. Tell Flask which app you want (`$ export FLASK_APP=moth_radio`)
7. If you’re debugging, enable debug mode (`$ export FLASK_DEBUG=true`)
8. Set up the app (`$ pip install -e .`)
9. Start the app (`$ flask run`)