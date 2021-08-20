FROM node:16-alpine
WORKDIR /oneshop_monitoring
COPY *.json *.js *.mjs *.env *.html *.csv ./
RUN ["yarn"]
COPY src ./src
COPY collections ./collections
COPY csv ./csv
COPY environements ./environements
RUN ["yarn", "new_reports"]
CMD ["yarn", "start"]
EXPOSE 3001