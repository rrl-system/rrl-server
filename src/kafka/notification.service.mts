import { Kafka, Producer } from 'kafkajs';

import nano from '../couch-db/couch-db.mjs';

import { DocumentGetResponse } from 'nano';

const db = nano.use('rrl-notifications');

const kafka = new Kafka({
  clientId: 'rrl-app',
  brokers: ['cs.rsu.edu.ru:9092']
});

class NotificationService {
    
    producer: Producer;
    
    constructor() {
        this.producer = kafka.producer(); 
    }

    async connectProducer() {
        await this.producer.connect();
    }

    async storeMessageInDB(message) {
        await db.insert(message);
    }

    async sendMessage(ulid, messageContent) {
        const message = {
            ulid,
            messageContent,
            timestamp: new Date().toISOString(),
            isRead: false
        };

        await this.producer.send({
            topic: 'testTopic',
            messages: [{ value: JSON.stringify(message) }]
        });

        await this.storeMessageInDB(message);
    }

    async markMessageAsRead(messageId) {
        const message: DocumentGetResponse & { isRead?: boolean } = await db.get(messageId);
        if (message && message.isRead !== undefined) {
            message.isRead = true;
            await db.insert(message);
        } else {
            throw new Error('Уведомление не найдено или испорчено');
        }
    }

    async getUnreadNotifications(ulid) {
        const query = {
            selector: { ulid, isRead: false },
            fields: ['_id', 'messageContent', 'timestamp']
        };

        const result = await db.find(query);

        return result.docs;
    }
}

const notificationService = new NotificationService();

export default notificationService;