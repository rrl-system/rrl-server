from confluent_kafka import Producer
import json
from datetime import datetime
import sys

def acked(err, msg):
    if err is not None:
        print(f"Failed to deliver message: {err}")
    else:
        print(f"Message produced: {msg.topic()} {msg.partition()} {msg.offset()}")

def send_message(ulid, message_content):

    conf = {
        'bootstrap.servers': 'cs.rsu.edu.ru:9092',  # Список брокеров
        'client.id': 'rrl-app'  # ID клиента
    }

    producer = Producer(**conf)
    message = {
        'ulid': ulid,
        'messageContent': message_content,
        'timestamp': int(datetime.now().timestamp() * 1000),
        'isRead': False
    }

    producer.produce('notification', json.dumps(message).encode('utf-8'), callback=acked)
    producer.flush()

ulid = sys.argv[1]
projectID = sys.argv[2]
epochs = int(sys.argv[3])

message_content = f'Проект {projectID} обучился за {epochs} эпох!'
send_message(ulid, message_content)
