#!/usr/bin/env bash

# Install pip
sudo apt-get install -y python-pip

# Install nodenv
sudo pip install nodeenv

# Install node 8.9.1
nodeenv --node=8.9.1 env

# Activate the nodejs environment we just setup
. ./env/bin/activate

# install local packages
npm install

# Start and enable auto-start at boot
envsubst < sleep_monitor_pn.service.template | sudo tee /lib/systemd/system/sleep_monitor_pn.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl start sleep_monitor_pn.service
sudo systemctl enable sleep_monitor_pn.service
