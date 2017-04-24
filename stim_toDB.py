from app import db
from app.models import Stimuli
import glob
import os

stim_files = glob.glob("/Users/antoniahoidal/Desktop/Cosan/Projects/Moth/moth_app/app/static/stim/*mp4") # fix this
path_list = []
for stim in stim_files:
	path = os.path.split(stim)[-1]
	path = os.path.join('static','stim',path)
	print path
	file_path = Stimuli(file_name= path)
	path_list.append(file_path)
#list of objects circle through and add new row for each item in list
# for each list add new row, and append the rt that is same for all
db.session.add_all(path_list)
db.session.commit()
