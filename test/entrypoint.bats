#!/usr/bin/env bats

@test "entrypoint runs successfully" {
  chmod a+x test/bin/puppet-lint
  run test/bin/puppet-lint
  echo "$output"
  [ "$status" -eq 0 ]
}
