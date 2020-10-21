FROM node:12

WORKDIR /docker/app

COPY . ./
COPY package*.json ./

RUN npm install

RUN npm run-script build

COPY . .

EXPOSE 3000

CMD ["serve -s build -l 3000"]
