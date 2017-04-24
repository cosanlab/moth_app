from app import app, db, models
from flask import Flask, render_template, url_for, request 
import json
from models import Trials, Users, Stimuli, Ratings


print app.config['num_stops']

@app.route('/')
def start_exp():
	num_stim= app.config['num_stim'] #change this later
	num_stops= app.config['num_stops']
	data = [Stimuli.query.get(i+1).__dict__['file_name'] for i in xrange(num_stim)]
	# for i in xrange(num_stim):
	# 	data = Stimuli.query.get(i).__dict__['file_name']
	# select1= Stimuli.query.get(1).__dict__
	# print select1 #Stimuli.query.filter_by(id='1')
	# select2 = Stimuli.query.get(2).__dict__ #Stimuli.query.filter_by(id='2')
	# selected_stim = [select1, select2]
	#print selected_stim
	return render_template('exp_moth_loop.html', stim_names = json.dumps(data), num_stops= json.dumps(num_stops))


@app.route('/ratings', methods =['POST'])
def rating_to_db():
	#ratings= Post.from_json(request.json) 
	print 'received rating!'
	content = request.get_json(silent=True)
	print content;
	# ratings = JSON.parse(request.json)
	#ratings = json.loads(request.json)
	for clicked in ratings:
		selected = Ratings(category= content[clicked]['cat'], intensity = content[clicked]['intens'], selected= content[clicked]['selected'])
	#list of objects circle through and add new row for each item in list
	# for each list add new row, and append the rt that is same for all
		db.session.add(selected)
		db.session.commit()
	#return
	return jsonify(post.to_json())

@app.route('/videotrial', methods =['POST'])
def trials_to_db():
	#trials = Post.from_json(request.json)
	print 'received rating'


	print(request.json)
	#content= json.loads(request.json) 
	content = request.get_json(silent = True) #data is a stringified object do we need to parse this??
	print content
	
	#content = json.loads(trials)
	#list of objects circle through and add new row for each item in list
	# for each list add new row, and append the rt that is same for all
	#trial_data= Trials(stimuli_id =content['stimulus'], start_time= content['start_time'], stop_time = content['stop_time'])
	trial_data= Trials(start_time= content['start_time'], stop_time = content['stop_time'])
	db.session.add(trial_data)
	db.session.commit()
	#return 'hello'
	#return jsonify(post.to_json())

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


