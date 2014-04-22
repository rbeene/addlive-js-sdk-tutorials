import os
import datetime
import time
import random
import string
from Crypto.Hash import SHA256
from flask import Flask, flash, redirect, render_template, request, url_for

__copyright__ = """
Copyright (C) LiveFoundry Inc. 2013

All rights reserved. Any use, copying, modification, distribution and selling
of this software and it's documentation for any purposes without authors'
written permission is hereby prohibited.
"""

__author__ = 'Juan Docal'
__email__ = 'juan@addlive.com'
__date__ = '17.04.14 16:21'

APP_ID = -1 #Put your app Id here;
API_KEY = '' #Put your API key here;
SCOPE_ID = 'SomeScopePlsChangeMe' #Put your scope here;

app = Flask(__name__)

@app.route('/')
def root():
	return redirect(url_for('index'))

@app.route('/index.html')
def index():
	ctx = {
		'app_id': APP_ID,
		'api_key': API_KEY,
		'scope_id': SCOPE_ID,
		'auth_details': _gen_auth_details(2)
	}
	return render_template('index.html', **ctx)

def _gen_auth_details(userId):
	authDetails = {'userId': userId, 'salt': _gen_random_string(20)}
	now = datetime.datetime.now()
	expires = now + datetime.timedelta(hours=2)
	authDetails['expires'] = int(time.mktime(expires.timetuple()))
	signature_body = '{0}{1}{2}{3}{4}{5}'.format(
		APP_ID,
		SCOPE_ID,
		userId,
		authDetails['salt'],
		authDetails['expires'],
		API_KEY)
	hasher = SHA256.new()
	hasher.update(signature_body)
	authDetails['signature'] = hasher.hexdigest().upper()
	return authDetails

def _gen_random_string(size):
    omega = string.ascii_letters + string.digits
    return ''.join(random.choice(omega) for x in range(size))

if __name__ == '__main__':
	app.debug = True
	app.run()
