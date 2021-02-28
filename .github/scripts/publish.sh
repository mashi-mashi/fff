  
#!/bin/bash
set -eux

function publish() {
  local BRANCH_NAME=$1
  if [[ $BRANCH_NAME = "main" ]]; then
    npm publish --tag=latest
  else
    echo "Branch $BRANCH_NAME is not supported to publish."
    exit 1
  fi
}

publish "$1"
