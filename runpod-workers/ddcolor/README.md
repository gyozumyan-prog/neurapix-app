# DDColor RunPod Serverless Worker

Колоризация чёрно-белых фотографий с помощью DDColor.

## Как задеплоить

### 1. Сборка Docker образа

```bash
# Клонируйте репозиторий или скопируйте файлы
cd runpod-workers/ddcolor

# Сборка образа
docker build --platform linux/amd64 -t YOUR_DOCKERHUB_USERNAME/ddcolor-runpod:v1 .

# Загрузка в Docker Hub
docker login
docker push YOUR_DOCKERHUB_USERNAME/ddcolor-runpod:v1
```

### 2. Создание Serverless Endpoint в RunPod

1. Зайдите на https://www.runpod.io/console/serverless
2. Нажмите "New Endpoint"
3. Выберите "Docker Image"
4. Введите: `YOUR_DOCKERHUB_USERNAME/ddcolor-runpod:v1`
5. Настройки:
   - **GPU**: 16GB+ (RTX 4000 Ada или выше)
   - **Container Disk**: 20GB
   - **Active Workers**: 0 (автомасштабирование)
   - **Max Workers**: 2
6. Нажмите "Deploy"

### 3. Получите Endpoint ID

После создания скопируйте Endpoint ID (например: `abc123xyz`)

### 4. Добавьте в NeuraPix

Добавьте секрет в Replit:
```
RUNPOD_DDCOLOR_ENDPOINT_ID=abc123xyz
```

## API формат

### Request
```json
{
  "input": {
    "image": "base64_encoded_image_or_url"
  }
}
```

### Response
```json
{
  "image": "base64_encoded_colorized_image",
  "status": "success"
}
```

## Стоимость

- ~$0.0005-0.001 за изображение
- GPU время: ~2-5 секунд на изображение
