# GitHub Action for Puppet Lint

This Action for [Puppet Lint](http://puppet-lint.com/) enables arbitrary actions for interacting with Puppet Lint to test Puppet code against the recommended [Puppet language style guide](puppet.com/docs/puppet/latest/style_guide.html). Puppet Lint validates only code style; it does not validate syntax.

## Usage

An example workflow for testing manifests for correct Puppet style - run the `puppet-lint` command with the path to the files you want to test as `args`.

```yaml
name: Puppet Lint

on: [push]

jobs:
  puppet-lint:

    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v1

    - name: puppet-lint
      uses: scottbrenner/puppet-lint-action@master
      with:
        args: ./
```

See [Testing with Puppet Lint](https://github.com/rodjek/puppet-lint#testing-with-puppet-lint) for full usage details.

## License

The Dockerfile and associated scripts and documentation in this project are released under the [MIT License](LICENSE).

Container images built with this project include third party materials. See [THIRD_PARTY_NOTICE.md](THIRD_PARTY_NOTICE.md) for details.
