from moth_radio import db

## note: might need to lower precision on Floats
# can add backrefs if need be 
class User(db.Model):
	__tablename__ = 'users'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	workerId = db.Column(db.String(64))
	name = db.Column(db.String(64))
	email = db.Column(db.String(64), unique= True)

class Stimulus(db.Model):
	__tablename__ = 'stimuli'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	filename = db.Column(db.String(128))
	duration = db.Column(db.Integer)
	modality = db.Column(db.String(32))
	tags = db.Column(db.String(64))

class Session(db.Model):
	__tablename__ = 'sessions'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	userId = db.Column(db.Integer, db.ForeignKey('users.id'))
	hitId = db.Column(db.String(128))
	assignmentId = db.Column(db.String(128))
	startTime = db.Column(db.Float)
	stopTime = db.Column(db.Float)

class Rating(db.Model):
	__tablename__ = 'ratings'
	id = db.Column(db.Integer, primary_key= True, unique=True)
	sessionId = db.Column(db.Integer, db.ForeignKey('sessions.id'))
	stimulusId = db.Column(db.Integer, db.ForeignKey('stimuli.id'))
	pollSec = db.Column(db.Integer)
	sliceStartSec = db.Column(db.Integer)
	reactionTime = db.Column(db.Float)
	iAnger = db.Column(db.Integer)
	iPride = db.Column(db.Integer)
	iElation = db.Column(db.Integer)
	iJoy = db.Column(db.Integer)
	iSatisfaction = db.Column(db.Integer)
	iRelief = db.Column(db.Integer)
	iHope = db.Column(db.Integer)
	iInterest = db.Column(db.Integer)
	iSurprise = db.Column(db.Integer)
	iSadness = db.Column(db.Integer)
	iFear = db.Column(db.Integer)
	iShame = db.Column(db.Integer)
	iGuilt = db.Column(db.Integer)
	iEnvy = db.Column(db.Integer)
	iDisgust = db.Column(db.Integer)
	iContempt = db.Column(db.Integer)
