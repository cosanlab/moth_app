from setuptools import setup

setup(
	name='moth_radio',
	packages=['moth_radio'],
	include_package_data=True,
	install_requires=[
		'flask',
		'flask-script',
		'Flask-SQLAlchemy',
		'mysql-python',
		'Flask-Bootstrap',
		'ffprobe',
		'uwsgi',
	],
)
