import sys
import gdown
from ITSAS import ITSASModel
import pandas as pd
from darts import TimeSeries
from darts.dataprocessing.transformers import Scaler
import os

# Файл для логгирования 
sys.stderr = open('log.txt', 'w')

ulid = sys.argv[2]

project = sys.argv[3]

path = f"uploads\{ulid}\{project}\model.pkl"

# Загрузка модели
model = ITSASModel.load(path)

# Ссылка на файл для дообучения на Google Диске
google_drive_url = sys.argv[1]

file_id = google_drive_url.split('/d/')[1].split('/view')[0]

download_url = f"https://drive.google.com/uc?id={file_id}"

# Путь для сохранения файла данных
if not os.path.exists('uploads/%s/%s' %(ulid, project)):
    os.makedirs('uploads/%s/%s' %(ulid, project))

local_file_path = "models/user_%s/data.csv" %(sys.argv[3])

# Скачивание файла
gdown.download(download_url, local_file_path, quiet=False)

# Загрузка данных для дообучения
training_data = TimeSeries.from_csv(local_file_path, time_col='date')

train_scaler = Scaler()

scaled_train = train_scaler.fit_transform(training_data)

model.fit(scaled_train, epochs=int(sys.argv[2]))

# Сохранение дообученной модели
model.save("models/user_%s/model.pkl" %(sys.argv[3]))