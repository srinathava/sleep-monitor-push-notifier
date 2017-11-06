#!/usr/bin/env bash

SCRIPT=`realpath $0`
SCRIPT_DIR=`dirname $SCRIPT`

sudo apt-get install npm

# update itself
sudo npm install -g npm

# install local packages
npm install

sudo sed -i "/^exit 0$/ i ${SCRIPT_DIR}/init.d/sleep-notifier start\n" /etc/rc.local
