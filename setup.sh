#!/usr/bin/env bash

SCRIPT=`realpath $0`
SCRIPT_DIR=`dirname $SCRIPT`

sudo apt-get install -y nodejs npm

# update itself
sudo npm install -g npm

# install local packages
npm install

# Start and enable auto-start at boot
sudo cp sleep_monitor_pn.service /lib/systemd/system/
sudo systemctl start sleep_monitor_pn.service
sudo systemctl enable sleep_monitor_pn.service
