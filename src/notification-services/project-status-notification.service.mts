import { Kafka, Producer, Consumer } from 'kafkajs';

import {AsyncDatabase} from 'promised-sqlite3';

import nano from '../couch-db/couch-db.mjs';

// import { DocumentGetResponse } from 'nano';

import sseServer from '../sse/sse.service.mjs';

const db = nano.use('rrl-project-statuses');
// const offsetDb = nano.use('offsets');

const kafka = new Kafka({
  clientId: 'rrl-app',
  brokers: ['cs.rsu.edu.ru:9092']
});

const sqlDb = await AsyncDatabase.open("./db.sqlite");

// (async () => {
//     try {
//       // Create the AsyncDatabase object and open the database.

//       await db.run("INSERT INTO foo (a, b) VALUES (?, ?)", [
//         "Value of a",
//         "Value of b",
//       ]);

//       // Read database.
//       const row1 = await db.get("SELECT * FROM foo WHERE id = ?", 2);


//     //   // Create a async statement
//     //   const statement = await db.prepare("SELECT * FROM foo WHERE id = ?", 2);
//     //   const row = await statement.get();

//       // Close the database.
//       await db.close();
//     } catch (err) {
//       console.error(err);
//     }
// })()

class NotificationService {

    producer: Producer;
    consumer: Consumer;

    constructor() {
        this.producer = kafka.producer();
        this.consumer = kafka.consumer({ groupId: "project-status-group" });
    }

    async connectProducer() {
        await this.producer.connect();
    }

    async connectConsumer() {
        console.log('Start Project Status Consumer');
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: "project-status", fromBeginning: true });
        await this.consumer.run({ eachMessage: this.getMessage });
    }

    async storeMessageInDB(message) {
        await db.insert(message);
    }

    async sendMessage(ulid, content) {
        console.log('sendMessage');
        const message = {
            ulid,
            content,
            timestamp: Number(new Date()),
        };

        await this.producer.send({
            topic: 'project-status',
            messages: [{ value: JSON.stringify(message) }]
        });
    }

    async getMessage({ topic, partition, message }) {
        console.log(message.value);
        const messageObj = JSON.parse(message.value)
        const clientId = messageObj.ulid.split(":")[0]
        const messageDb = {
            _id: `${messageObj.ulid}:${String(message.offset).padStart(19,'0')}`,
            status: messageObj.content,
            timestamp: messageObj.timestamp,
        }
        await db.insert(messageDb, messageDb._id)
        .catch( err =>
            Promise.reject({
                error: `Ошибка создания сообщения: ${err}`,
                status: 500
            })
            )

        const sqlObject = {
            _id: messageObj.ulid,
            status: messageDb.status,
            timestamp: messageDb.timestamp,
            offset: String(message.offset).padStart(19,'0'),
        }

        await sqlDb.run("INSERT INTO 'statuses' (_id, status, timestamp, offset) VALUES (?, ?, ?, ?) ON CONFLICT (_id) DO UPDATE SET status=excluded.status, timestamp=excluded.timestamp, offset=excluded.offset;", [
            sqlObject._id,
            sqlObject.status,
            sqlObject.timestamp,
            sqlObject.offset,
        ]);
        // const row = await sqlDb.get("SELECT * FROM 'offsets' WHERE id = ?",  `${messageObj.ulid}:offset`);
        // console.log('1133')
        // console.log(row);
        // try {
        //     const offsetObj = await offsetDb.get(`${messageObj.ulid}:offset`).then(obj => {
        //             const offset = {
        //                 "_id": `${messageObj.ulid}:offset`,
        //                 "offset":  message.offset,
        //                 "_rev": obj._rev,
        //             }
        //             return offsetDb.insert(offset, `${messageObj.ulid}:offset`).catch( err =>
        //                 Promise.reject({
        //                     error: `Ошибка создания сообщения: ${err}`,
        //                     status: 500
        //                 })
        //             )
        //         }

        //         ).catch(err => {
        //             const offset = {
        //                 "_id": `${messageObj.ulid}:offset`,
        //                 "offset":  message.offset,
        //             }
        //         return offsetDb.insert(offset, `${messageObj.ulid}:offset`)
        //         .catch( err =>
        //             Promise.reject({
        //                 error: `Ошибка создания сообщения: ${err}`,
        //                 status: 500
        //             })
        //         )               }
        //     );
        // console.log('11222')
        // console.log(sseServer)


        console.log(clientId)
        sseServer.sendEventMessageToClient(clientId, 'project-status', JSON.stringify(sqlObject))
        // console.log(offsetObj)

        // catch (err) {
        //     console.log('5555')
        //     return Promise.reject({
        //         error: `Ошибка создания сообщения: ${err}`,
        //         status: 500
        //         })
        // }
        // console.log('444')

        // db.insert(messageDb, `${messageObj.ulid}:${message.offset}`)
        //   .catch( err =>
        //      Promise.reject({
        //       error: `Ошибка создания сообщения: ${err}`,
        //       status: 500
        //       })
        //   )

        // .catch( err =>
        //   Promise.reject({
        //     error: `Не могу найти проект: ${err}`,
        //     status: 403
        //   })
        // )

        // db.insert(offset, `${messageObj.ulid}:offset`)
        // .catch( err =>
        //     Promise.reject({
        //     error: `Ошибка создания сообщения: ${err}`,
        //     status: 500
        //     })
        // )

        // console.log(message);
        //     console.log("Received: ", {
        //         partition,
        //         offset: message.offset,
        //         value: message.value.toString(),
        //     });
    }

    // async markMessageAsRead(messageId) {
    //     const message: DocumentGetResponse & { isRead?: boolean } = await db.get(messageId);
    //     if (message && message.isRead !== undefined) {
    //         message.isRead = true;
    //         await db.insert(message);
    //     } else {
    //         throw new Error('Уведомление не найдено или испорчено');
    //     }
    // }

    // async getUnreadNotifications(ulid) {
    //     const query = {
    //         selector: { ulid, isRead: false },
    //         fields: ['_id', 'messageContent', 'timestamp']
    //     };

    //     const result = await db.find(query);

    //     return result.docs;
    // }
}

const notificationService = new NotificationService();

export default notificationService;