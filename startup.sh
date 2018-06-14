#!/bin/bash

# Run to deploy on an apache2 server
cd /var/www/spymaster/spymaster
source venv/bin/activate
sudo nohup mongod --dbpath db &
sudo nohup python server.py &
deactivate
