from app import db
from app.models import Stimuli
import glob
import os
import subprocess
import re

# def getLength(input_video):
# 	cmd = "ffprobe -i " + input_video + " -show_entries format=duration -v quiet -of csv='p=0'"
# 	#cmd = " -1" + input_video + " -show_entries format=duration -v quiet -of csv='p=0'"
# 	result = subprocess.Popen([cmd], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
# 	output =result.communicate()
# 	print output[0]
# 	return output[0]

# def get_length(path):
# 	process = subprocess.Popen(['/usr/local/bin/ffmpeg', '-i', path], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
# 	stdout, stderr = process.communicate()
# 	output = process.communicate()
# 	print output[0]
# 	# matches = re.search(r"Duration:\s{1}(?P\d+?):(?P\d+?):(?P\d+\.\d+?),", stdout, re.DOTALL).groupdict()
 
# 	# hours = Decimal(matches['hours'])
# 	# minutes = Decimal(matches['minutes'])
# 	# seconds = Decimal(matches['seconds'])
 
# 	# total = 0
# 	# total += 60 * 60 * hours
# 	# total += 60 * minutes
# 	# total += seconds
	


stim_files = glob.glob("/Users/antoniahoidal/Desktop/Cosan/Projects/Moth/moth_app/app/static/stim/*mp4") # fix this
path_list = []
for stim in stim_files:
	#duration = getLength(stim)
	path = os.path.split(stim)[-1]
	path = os.path.join('static','stim',path)
	print path
	file_path = Stimuli(file_name= path)
	#file_path = Stimuli(file_name= path, duration= duration)
	path_list.append(file_path)
#list of objects circle through and add new row for each item in list
# for each list add new row, and append the rt that is same for all
db.session.add_all(path_list)
db.session.commit()


