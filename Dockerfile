FROM node:8

# app dir
WORKDIR /usr/src/app

# app dependencies
COPY package*.json ./

RUN npm install

# bundle app source
COPY . .

# open port
EXPOSE 3000
CMD [ "npm", "run", "devstart" ]
