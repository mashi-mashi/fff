#!/bin/bash
set -eux

function version() {
  git config --local user.email "action@github.com"
  git config --local user.name "GitHub Action"
  git config --local push.default current
  local BRANCH_NAME=$1
  if [[ $BRANCH_NAME = "main" ]]; then
    npm version patch
  else
    echo "Error! CI triggered by unsupported branch! [$BRANCH_NAME]"
    exit 1
  fi
  git remote set-url origin https://"${GITHUB_ACTOR}":"${GITHUB_TOKEN}"@github.com/"${GITHUB_REPOSITORY}".git
  git push
}

version "$1"
