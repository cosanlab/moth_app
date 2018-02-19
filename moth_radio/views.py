from moth_radio import app, db, models, apis
from flask import Flask, render_template, url_for, request 
import json
from models import LabUser, Stimulus, Session, Rating
	
@app.route('/')
def start_exp():
	return render_template('exp_moth_loop.html', stim_base = app.config["stim_base"], num_stops = app.config["num_stops"], num_stim = app.config["num_stim"], sample_interval = app.config["sample_interval"], sample_time_jitter = app.config["sample_time_jitter"], wave = app.config["wave"])
