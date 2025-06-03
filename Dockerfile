FROM ruby:3.3-alpine

LABEL name="puppet-lint-action"
LABEL repository="https://github.com/ScottBrenner/puppet-lint-action"
LABEL homepage="https://github.com/ScottBrenner/puppet-lint-action"
LABEL org.opencontainers.image.source="https://github.com/ScottBrenner/puppet-lint-action"

LABEL "com.github.actions.name"="puppet-lint-action"
LABEL "com.github.actions.description"="GitHub Action for puppet-lint"
LABEL "com.github.actions.icon"="share-2"
LABEL "com.github.actions.color"="orange"

LABEL "maintainer"="Scott Brenner <scott@scottbrenner.me>"

RUN apk --no-cache add ruby-libs \
    && gem install puppet-lint --no-document

COPY puppet-lint.json /puppet-lint.json
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["./"]
