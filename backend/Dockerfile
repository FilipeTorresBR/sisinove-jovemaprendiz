FROM python:3.12-slim

WORKDIR /app

# Copia e já define as permissões
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Garante que as permissões estejam corretas antes de rodar
RUN chmod -R 777 /app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]