# 📖 Character Bible

База знаний для писателей — персонажи, их внешность, характер, связи и галерея изображений.

## Стек
- **Frontend**: Vanilla HTML/CSS/JS → GitHub Pages
- **База данных**: Supabase (PostgreSQL)
- **Хранилище изображений**: Supabase Storage

## Структура файлов
```
BookBible/
├── index.html          # Основная страница
├── style.css           # Стили
├── app.js              # Логика приложения
├── supabase_schema.sql # SQL схема для базы данных
└── README.md
```

## Настройка Supabase

### 1. Создать схему
Открой **SQL Editor** в Supabase и выполни содержимое файла `supabase_schema.sql`.

### 2. Создать Storage bucket
1. Перейди в **Storage** → **New bucket**
2. Название: `character-images`
3. Тип: **Public**
4. Нажми **Create bucket**

### 3. Настроить политики для Storage
В разделе **Storage → Policies** для бакета `character-images` добавь политику:
- Policy name: `Public Access`
- Allowed operation: `SELECT, INSERT, DELETE`
- Target roles: `anon`
- Policy definition: `true`

## Деплой на GitHub Pages
1. Загрузи все файлы в репозиторий
2. Перейди в **Settings → Pages**
3. Source: **Deploy from a branch → main → / (root)**
4. Сохрани — через минуту сайт будет доступен

## Возможности
- Карточки персонажей с фото, описанием, тегами
- Галерея изображений по эмоциям (для AI-генерации)
- Связи между персонажами
- Автоматическая генерация промпта для AI
- Фильтрация по книгам и поиск
