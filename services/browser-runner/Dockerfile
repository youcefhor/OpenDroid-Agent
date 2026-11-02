FROM mcr.microsoft.com/playwright:v1.64.1-noble
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts
COPY server.mjs policy.mjs ./
USER pwuser
EXPOSE 8080
CMD ["node", "server.mjs"]
