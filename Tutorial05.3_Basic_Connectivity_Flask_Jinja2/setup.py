import os

from setuptools import setup, find_packages

requires = [
    'sleekxmpp',
    'dnspython',
    'pyasn1',
    'pyasn1_modules',
    'pycrypto',
    'flask',
    'cryptacular',
    'protobuf',
]

setup(name='tutorial05.3',
      version='0.0',
      description='JS - Basic Connectivity',
      long_description='Basic Connectivity using Flask & Jinja2',
      classifiers=[
          "Programming Language :: Python",
          ],
      author='Juan Docal',
      author_email='juan@addlive.com',
      url='',
      keywords='flask jinja2',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='tests',
      install_requires=requires,
      )

