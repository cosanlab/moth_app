from moth_radio import db
from moth_radio.models import Stimulus
from os import listdir
from ffprobe import FFProbe

# TODO: Expand to support audio-only modality	

stimLocation = "moth_radio/static/stim/"
stimFiles = listdir(stimLocation)
stimObjs = []
for stimFile in stimFiles:
	durationStr = FFProbe(stimLocation + stimFile).video[0].duration
	duration = int(round(float(durationStr)))
	stimObj = Stimulus(filename = stimFile, modality = "video", duration = duration)
	stimObjs.append(stimObj)
try:
	db.session.add_all(stimObjs)
	db.session.commit()
except Exception as error:
	print "Error adding stimuli to database (probably just duplicates)", error
