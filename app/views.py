from app import app, db, models
from flask import Flask, render_template, url_for, request

@app.route('/')
def start_exp(name=None):
    return render_template('exp_moth_loop.html', name=name)


@app.route('/ratings', methods =['POST'])
def rating_to_db():
	#ratings= Post.from_json(request.json) 
	print 'received rating!'
	ratings = JSON.parse(request.json)
	for clicked in ratings:
		selected = Ratings(category= ratings[clicked]['cat'], intensity = ratings[clicked]['intens'], selected= ratings[clicked]['selected'])
	#list of objects circle through and add new row for each item in list
	# for each list add new row, and append the rt that is same for all
		db.session.add(selected)
		db.session.commit()
	return jsonify(post.to_json())

@app.route('/videotrial', methods =['POST'])
def trials_to_db():
	#trials = Post.from_json(request.json)
	trials = JSON.parse(request.json)  #data is a stringified object do we need to parse this??
	#list of objects circle through and add new row for each item in list
	# for each list add new row, and append the rt that is same for all
	trial_data= Trials(stimuli_id =trials['stimulus'], start_time= trials['start_time'], stop_time = trials['stop_time'])
	db.session.add(trial_data)
	db.session.commit()
	return jsonify(post.to_json())