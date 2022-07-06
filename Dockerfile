# Node version matching the version declared in the package.json
FROM node:16.15.1-slim

# Update O.S.
RUN apt-get update && apt-get upgrade -y

# Install required O.S. packages
RUN apt-get install -y git python make g++

# Create the application workdir
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

# Copy app dependencies
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . ./

RUN npm run build

# Set the container port
EXPOSE 3333

# Start the aplication
CMD ["npm", "run", "start" ]
