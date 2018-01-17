from moth_radio import db

class LabUser(db.Model):
	__tablename__ = 'labUsers'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	name = db.Column(db.String(64))
	email = db.Column(db.String(64))

class Stimulus(db.Model):
	__tablename__ = 'stimuli'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	filename = db.Column(db.String(128), unique=True)
	duration = db.Column(db.Integer)
	modality = db.Column(db.String(32))
	tags = db.Column(db.String(64))

class Session(db.Model):
	__tablename__ = 'sessions'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	labUserId = db.Column(db.Integer, db.ForeignKey('labUsers.id'))
	psiturkUid = db.Column(db.String(64))
	startTime = db.Column(db.Integer)
	stopTime = db.Column(db.Integer)

class Rating(db.Model):
	__tablename__ = 'ratings'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	sessionId = db.Column(db.Integer, db.ForeignKey('sessions.id'))
	stimulusId = db.Column(db.Integer, db.ForeignKey('stimuli.id'))
	pollSec = db.Column(db.Integer)
	sliceStartSec = db.Column(db.Integer)
	reactionTime = db.Column(db.Float)
	intensities = db.Column(db.String(1024))
