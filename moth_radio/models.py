from moth_radio import db

## note: might need to lower precision on Floats
# can add backrefs if need be 
class Users(db.Model):
	__tablename__ = 'users'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	name = db.Column(db.String(64))
	email = db.Column(db.String(64), unique= True)
	def to_json(self):
		json_post = {
		'url': url_for('api.get_post', id = self.id, _external=True),
		'name': self.name,
		'email': self.email
		}
		return json_users

class Stimuli(db.Model):
	__tablename__ = 'stimuli'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	file_name = db.Column(db.String(128))
	duration = db.Column(db.Float)
	modality = db.Column(db.String(32))
	def to_json(self):
		json_stimuli = {
		'url': url_for('api.get_post', id = self.id, _external=True),
		'file_name': self.file_name,
		'duration': self.duration,
		'modality': self.modality
		}
		return json_stimuli

class Trials(db.Model):
	__tablename__ = 'trials'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	user_id= db.Column(db.Integer, db.ForeignKey('users.id'))
	stimuli_id = db.Column(db.Integer, db.ForeignKey('stimuli.id'))
	start_time = db.Column(db.Float)
	stop_time = db.Column(db.Float)
	def to_json(self):
		json_post = {
		'url': url_for('api.get_post', id = self.id, _external=True),
		'user_id': self.user_id,
		'stimuli_id': self.stimuli_id,
		'start_time': self.start_time,
		'stop_time': self.stop_time,
		'reaction_time': self.reaction_time
		}
		return json_trials

class Ratings(db.Model):
	__tablename__ = 'ratings'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	trial_id= db.Column(db.Integer, db.ForeignKey('trials.id'))
	category = db.Column(db.Integer)
	intensity = db.Column(db.Integer)
	selected = db.Column(db.Integer)
	reaction_time= db.Column(db.Float)
	def to_json(self):
		json_post = {
		'url': url_for('api.get_post', id = self.id, _external=True),
		'trial_id': self.trial_id,
		'category': self.category,
		'intensity': self.intensity
		}
		return json_ratings
