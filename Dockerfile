# Node version matching the version declared in the package.json
FROM node:16.15.1-slim as builder

# Update O.S.
RUN apt-get update && apt-get upgrade -y

# Install required O.S. packages
RUN apt-get install -y git python make g++

# Create the application workdir
RUN mkdir -p /app
WORKDIR /app

# Copy app dependencies
COPY yarm.lock ./

# Install app dependencies
RUN yarn

# Bundle app source
COPY . ./

RUN npm run build

# Set the container port
EXPOSE 3333

# Start the aplication
CMD ["yarn", "run", "start" ]
