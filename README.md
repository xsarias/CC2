# Estructuras de datos

Este proyecto implementa **búsquedas secuenciales, binarias y funciones hash** con visualización web.  
El sistema está dividido en **backend (FastAPI)** y **frontend (React + Vite)**.

---

## ⚙️ Requisitos

- **Python 3.10+**
- **Node.js 20+** (se recomienda usar `nvm` para instalar la versión correcta)
- Navegador web (Chrome, Firefox, etc.)

---

## 🚀 Instalación

### 1. Clonar repositorio
```bash
git clone <url-del-repo>
cd <carpeta-del-proyecto>
```

### 2. Configuración Backend (FastAPI)

```bash
cd Backend
python3 -m venv env
source env/bin/activate  # Linux / Mac
env\Scripts\activate     # Windows PowerShell
pip install -r requirements.txt
```

📌 Para correr el servidor backend:
```bash
uvicorn app:app --reload
```

- El backend quedará activo en: http://127.0.0.1:8000
- Documentación interactiva: http://127.0.0.1:8000/docs

### 3. Configuración Frontend (React + Vite)
```bash
cd Frontend
npm install
```
📌Para correr el servidor frontend:

```bash
npm run dev
```
El frontend quedará activo en: http://127.0.0.1:5173


