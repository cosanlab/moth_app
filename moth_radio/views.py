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

@app.route('/videotrial', methods =['POST'])
def trials_to_db():
	content = request.get_json(silent=True)
	trial_data= Trials(start_time= content["start_time"], stop_time = content["stop_time"])
	#trial_data= Trials(stimuli_id= content["video"], start_time= content["start_time"], stop_time = content["stop_time"])
	db.session.add(trial_data)
	db.session.commit()
	return json.dumps(content)

# @app.route('/stimuli', methods =['POST'])
# def Stimuli_to_db():
# 	#trials = Post.from_json(request.json)
# 	print 'received stimuli'


# 	print(request.json)
# 	#content= json.loads(request.json) 
# 	content = request.get_json(silent = True) #data is a stringified object do we need to parse this??
# 	print content
	
# 	#content = json.loads(trials)
# 	#list of objects circle through and add new row for each item in list
# 	# for each list add new row, and append the rt that is same for all
# 	#trial_data= Trials(stimuli_id =content['stimulus'], start_time= content['start_time'], stop_time = content['stop_time'])
# 	stimuli_data= Stimuli(file_name= content['file_name'])
# 	db.session.add(trial_data)
# 	db.session.commit()
# 	return


