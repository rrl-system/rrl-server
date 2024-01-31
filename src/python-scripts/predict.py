import sys
from ITSAS import ITSASModel
import logging
import pandas as pd

sys.stderr = open('error_log.txt', 'w')

steps = int(sys.argv[1])

ulid = sys.argv[2]

project = sys.argv[3]

path = f"uploads\{ulid}\{project}\model.pkl"

model = ITSASModel.load(path)

df = model.predict(n = steps)

# Преобразование TimeSeries в DataFrame
df = df.pd_dataframe()

# Преобразование DataFrame в JSON
#out = df.to_json(orient='records')

df = df.reset_index()

# Преобразование всех столбцов DataFrame, которые не могут быть сериализованы в JSON
for col in df.columns:
    if isinstance(df[col].iloc[0], pd.Timestamp):
        # Преобразование Timestamp в строку или в UNIX время в миллисекундах
        df[col] = df[col].apply(lambda x: x.timestamp() * 1000)

# Преобразование DataFrame в список словарей
data = df.to_dict(orient='records')

# Преобразование списка словарей в JSON
import json

out = json.dumps(data)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)
logger.addHandler(handler)
logger.info(out)