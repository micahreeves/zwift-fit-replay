# 1. Use the official Node.js image
FROM node:18

# 2. Install system dependencies (FFmpeg and libvips for sharp)
RUN apt-get update && apt-get install -y \
  ffmpeg \
  libvips-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory
WORKDIR /usr/src/app

# 4. Copy package.json and package-lock.json
COPY package*.json ./

# 5. Install dependencies
RUN npm install

# 6. Copy application files
COPY . .

# 7. Expose the application port
EXPOSE 3000

# 8. Start the application
CMD ["npm", "start"]