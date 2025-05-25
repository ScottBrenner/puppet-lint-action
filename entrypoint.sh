#!/bin/sh

set -e

# Copy the matcher to the host system; otherwise "add-matcher" can't find it.
cp /puppet-lint.json /github/workflow/puppet-lint.json
echo "::add-matcher::${RUNNER_TEMP}/_github_workflow/puppet-lint.json"

sh -c "puppet-lint $*"
