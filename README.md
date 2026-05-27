# LUNE Studio — Fashion Shop Frontend

## Cách chạy

```bash
# 1. Cài thư viện
npm install

# 2. Tạo file môi trường
copy .env.example .env

# 3. Chạy dev server
npm run dev
```

Mở trình duyệt theo địa chỉ hiện trong terminal (thường là http://localhost:5173)

## Cấu trúc thư mục

```
src/
├── hooks/
│   └── useAuth.js          ← Hook gọi API login/register
├── pages/
│   └── Auth/
│       ├── AuthPage.jsx    ← Giao diện đăng nhập / đăng ký
│       ├── AuthPage.module.css
│       └── index.js
├── App.jsx
├── main.jsx
└── index.css
```

## Kết nối backend

Mở `.env`, sửa URL backend:
```
VITE_API_URL=http://localhost:8080
```

Trong `AuthPage.jsx`, bỏ comment phần gọi API để kết nối thực.
