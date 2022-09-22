FROM public.ecr.aws/lambda/nodejs:16 as builder
WORKDIR /usr/app

COPY package.json ./
COPY tsconfig.json ./
#COPY index.js ./
COPY src/ ./src
#COPY .env ./
COPY yarn.lock ./
RUN npm install typescript -g
RUN npm install yarn -g
RUN yarn
RUN yarn run build

RUN ls
CMD ["/usr/app/dist/index.handler"]



