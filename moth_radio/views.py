from moth_radio import app, db, models, apis
from flask import Flask, render_template, url_for, request 
import json
from models import LabUser, Stimulus, Session, Rating
	
@app.route('/')
def start_exp():
	stimuli = apis.fetchStimuli(count = app.config["num_stim"], modality = "video")
	return render_template('exp_moth_loop.html', stimuli = stimuli, stimBase = app.config["stim_base"], num_stops = app.config["num_stops"])

@app.route('/ratings', methods =['POST'])
def rating_to_db():
	#ratings= Post.from_json(request.json) 
	print 'received rating!'
	print(request.data)
	content = request.get_json(silent=True)
	print content
	
	ratingRecords = content['emotionSelections']
	ratingObjs = []
	for emotionName in ratingRecords: # for each dictionary in the list
		# ratingObj = Ratings(category=emotionName, intensity=ratingRecords[emotionName], selected=True, reaction_time=content['rt'])
		# ratingObjs.append(ratingObj)
		pass
	db.session.add_all(ratingObjs)
	db.session.commit()
	return json.dumps(content)
