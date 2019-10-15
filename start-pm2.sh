#!/bin/bash
RUNPATH=$(dirname "$(readlink -f "$BASH_SOURCE")")
cd $RUNPATH
pm2 start ecosystem.config.js
