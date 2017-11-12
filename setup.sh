#!/usr/bin/env bash

SCRIPT=`realpath $0`
SCRIPT_DIR=`dirname $SCRIPT`

sudo apt-get install -y nodejs npm pip

# update itself
sudo npm install -g npm

# install local packages
npm install

# Install nodenv
sudo pip install nodeenv

# Install node 8.9.1
nodenv --node=8.9.1 env

# Start and enable auto-start at boot
envsubst < sleep_monitor_pn.service.template | sudo tee /lib/systemd/system/sleep_monitor_pn.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl start sleep_monitor_pn.service
sudo systemctl enable sleep_monitor_pn.service
