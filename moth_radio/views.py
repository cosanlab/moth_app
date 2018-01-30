from moth_radio import app, db, models, apis
from flask import Flask, render_template, url_for, request 
import json
from models import LabUser, Stimulus, Session, Rating
	
@app.route('/')
def start_exp():
	stimuli = apis.fetchStimuli(modality = "video")
	return render_template('exp_moth_loop.html', stimuli = stimuli, stimBase = app.config["stim_base"], num_stops = app.config["num_stops"], num_stim = app.config["num_stim"], sample_interval = app.config["sample_interval"])
