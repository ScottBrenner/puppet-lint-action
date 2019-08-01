FROM alpine:edge

LABEL name="puppet-lint-action"
LABEL version="1.0.0"
LABEL repository="https://github.com/ScottBrenner/puppet-lint-action"
LABEL homepage="https://github.com/ScottBrenner/puppet-lint-action"

LABEL "com.github.actions.name"="puppet-lint-action"
LABEL "com.github.actions.description"="GitHub Action for puppet-lint"
LABEL "com.github.actions.icon"="share-2"
LABEL "com.github.actions.color"="orange"

LABEL "maintainer"="Scott Brenner <scott@scottbrenner.me>"

RUN apk --no-cache add ruby ruby-json
RUN gem install puppet-lint --no-document

COPY entrypoint.sh /entrypoint.sh
RUN ["chmod", "+x", "/entrypoint.sh"]
ENTRYPOINT ["/entrypoint.sh"]
CMD ["./"]