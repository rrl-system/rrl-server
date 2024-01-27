import express from 'express'

import type { Express, Router, Request, Response } from 'express'

import 'dotenv/config'

import routes from './routes/index.mjs'

import cors from 'cors'

import notificationService from './kafka/notification.service.mjs'

const ulid = '01HMTNN1H8521P9SQ7A8J2AZAF';

const main = async () => {
  await notificationService.connectProducer();
  await notificationService.connectConsumer();

  const messageContent = 'Нейросеть завершила обучение!';

  await notificationService.sendMessage(ulid, messageContent);
};

main().catch(console.error);

// import { Kafka } from "kafkajs"

// const kafka = new Kafka({
//   clientId: "test-app",
//   brokers: ["cs.rsu.edu.ru:9092"],
// });

// const producer = kafka.producer({
//   maxInFlightRequests: 1,
//   idempotent: true,
//   transactionalId: "uniqueProducerId",
// });

// async function sendPayload(input: string) {
//   try {
//     await producer.send({
//       topic: "testTopic",
//       messages: [{ key: "test", value: input }],
//     });
//   } catch (e) {
//     console.error("Caught Error while sending:", e);
//   }
// }

// async function main() {
//   await producer.connect();
//   try {
//     await sendPayload('Hello, from Nodejs');
//   } catch (e) {
//     console.error(e);
//   }
// }

// main();

/* const kafka = new Kafka({
  clientId: "test-app",
  brokers: ["cs.rsu.edu.ru:9092"],
});

const consumer = kafka.consumer({ groupId: "test-group" });
const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "testTopic", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("Received: ", {
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });
    },
  });
};
run().catch(console.error); */

const app: Express = express()

const host = process.env.SERVER_HOST

const port = Number(process.env.SERVER_PORT)


// import multer from 'multer'

// const upload = multer({ dest: 'uploads/' })

// // app.post('/upload', upload.single('file'), function (req, res, next) {
// //   console.log(req)
// //   console.log(req.body)
// //   res.status(200).send({a: 1})
// // })

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function setCommonHeaders(req, res, next) {
    res.set("Access-Control-Allow-Private-Network", "true");
    res.set("Permissions-Policy", "interest-cohort=()")
    next();
  });

app.use(cors());

const unreadNotifications = await notificationService.getUnreadNotifications(ulid);

console.log(JSON.stringify(unreadNotifications));

app.use('/api', routes)

app.listen(port, host, () =>
    console.log(`Server listens http://${host}:${port}`)
)