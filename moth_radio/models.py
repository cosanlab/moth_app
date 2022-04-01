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
	tagOrder = db.Column(db.Integer)

class Session(db.Model):
	__tablename__ = 'sessions'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	labUserId = db.Column(db.Integer, db.ForeignKey('labUsers.id'))
	psiturkUid = db.Column(db.String(64))
	psiturkWorkerId = db.Column(db.String(64))
	wave = db.Column(db.String(32))
	startTime = db.Column(db.Integer)
	stopTime = db.Column(db.Integer)
	emotions = db.Column(db.String(1024))
	sequence = db.Column(db.String(1024))
	exitSurvey = db.Column(db.String(1024))

class Rating(db.Model):
	__tablename__ = 'ratings'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	sessionId = db.Column(db.Integer, db.ForeignKey('sessions.id'))
	stimulusId = db.Column(db.Integer, db.ForeignKey('stimuli.id'))
	timestamp = db.Column(db.BigInteger)
	serverTS = db.Column(db.BigInteger)
	pollSec = db.Column(db.Float)
	sliceStartSec = db.Column(db.Float)
	reactionTime = db.Column(db.Float)
	intensities = db.Column(db.String(2048))
	ratingHistory = db.Column(db.String(8192))

class Log(db.Model):
	__tablename__ = 'logs'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	sessionId = db.Column(db.Integer, db.ForeignKey('sessions.id'))
	timestamp = db.Column(db.BigInteger)
	serverTS = db.Column(db.BigInteger)
	eventCode = db.Column(db.Integer)
	meta = db.Column(db.String(2048))
