# jsPsych and Flask Web App for Moth Study

## Setup

*Adapted from the [Flask docs](http://flask.pocoo.org/docs/0.12/patterns/packages/).*

1. [Install Flask](http://flask.pocoo.org/docs/0.12/installation/) (`$ sudo pip install Flask`)
2. Navigate to project directory (`cd ~/path/to/moth_app`)
3. Tell Flask which app you want (`$ export FLASK_APP=moth_radio`)
4. If you’re debugging, enable debug mode (`$ export FLASK_DEBUG=true`)
5. Set up the app (`$ pip install -e .`)
6. Start the app (`$ flask run`)