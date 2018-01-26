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

## Server Setup & Deployment

*Assumes a clean install of Ubuntu 16.04.3 LTS.*

1. Get `apt-get` up to date: `$ sudo apt-get update`
2. Install `nginx`: `$ sudo apt-get install nginx`
3. Tell the firewall to let `nginx` do its thing: `$ sudo ufw allow 'Nginx Full'`  
*Note: if `ufw` isn't enabled, you probably want to enable it. Just make sure it's configured not to block things you need, e.g. `ssh`.*
4. Install Python: `$ sudo apt-get install python`
5. Install `pip`: `$ sudo apt-get install python-pip`  
*Note: if you're ssh'd in from a Mac and get locale-related problems, try `$ export LC_ALL="en_US.UTF-8"`*
6. Install MySQL: `$ sudo apt-get install mysql-server`. Set a password for the root user when prompted.
7. Install the MySQL dev tools: `$ sudo apt-get install libmysqlclient-dev`
8. Create a database `moth_radio` and two users, `moth_radio` and `moth_radio_turk`, both with full privileges on the `moth_radio` database.
9. Install `ffmpeg`: `$ sudo apt-get install ffmpeg`
10. Install `virtualenv`: `$ sudo pip install virtualenv`
11. Create a virtual environment in `/var/www` for the app: `$ virutalenv moth_env`
12. Copy the `moth_app` project folder into `/var/www`: (from your machine) `$ scp -r moth_app user@cosanlabradio:/var/www/`
13. Activate the environment: `$ source moth_env/bin/activate`
14. From the `moth_app` directory, install the moth app and its dependencies: `$ pip install -e .`
15. Add your `moth_radio` MySQL user's password after the `:` in `moth_radio/__init__.py` where `app.config['SQLALCHEMY_DATABASE_URI']` is set.
16. Create an empty socket file: `$ touch moth_app.sock`
17. Make sure `/var/www` has the right permissions to be served: `$ sudo chown -R www-data:www-data /var/www`
18. Install the `moth_app.service` service: `$ sudo mv moth_app.service /etc/systemd/system/`
19. Start the service:  
    ```
    $ sudo systemctl daemon-reload  
    $ sudo systemctl start moth_app  
    $ sudo systemctl enable moth_app  
    ```
20. Install the `moth_app` `nginx` config file: `$ sudo mv moth_app /etc/nginx/sites-available`
21. Symlink the same config file to `sites-enabled`: `$ sudo ln -s /etc/nginx/sites-available/moth_app /etc/nginx/sites-enabled/`
22. Restart `nginx`: `$ sudo systemctl restart nginx`
23. Restart the server: `$ sudo reboot`
