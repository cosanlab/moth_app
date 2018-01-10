# jsPsych and Flask Web App for Moth Study

## Setup

*Adapted from the [Flask docs](http://flask.pocoo.org/docs/0.12/patterns/packages/).*

1. [Install Flask](http://flask.pocoo.org/docs/0.12/installation/) (`$ sudo pip install Flask`)
2. [Install ffmpeg](https://www.ffmpeg.org/) (e.g. `brew install ffmpeg`). Required to add stimuli to the database, but not for running trials.
3. Navigate to project directory (`cd ~/path/to/moth_app`)
4. Tell Flask which app you want (`$ export FLASK_APP=moth_radio`)
5. If you’re debugging, enable debug mode (`$ export FLASK_DEBUG=true`)
6. Set up the app (`$ pip install -e .`)
7. Start the app (`$ flask run`)