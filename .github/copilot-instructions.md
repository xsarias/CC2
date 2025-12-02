# AI Coding Agent Instructions for CC2

## Project Overview
**CC2** is an educational visualization platform for computer science algorithms (searching and sorting structures). It demonstrates search algorithms (sequential, binary, hash) and data structures through an interactive web interface.

**Architecture**: FastAPI backend (Python) + React + Vite frontend, communicating via REST API with CORS enabled for local development.

---

## Backend Structure (FastAPI + Factory Pattern)

### Key Directories
- `Backend/app.py` – Main FastAPI app with CORS middleware for `localhost:5173` and `127.0.0.1:5173`
- `Backend/controller/busqueda_controller.py` – API router for search endpoints
- `Backend/Factory/algoritmo_factory.py` – Factory pattern for algorithm instantiation
- `Backend/Models/busquedas_internas/` – Core search algorithm implementations

### Algorithm Implementation Pattern
All search algorithms must:
1. Implement an `ejecutar(lista, valor)` method (not `buscar()` – naming is inconsistent but follow each impl)
2. Return a **dict** with at least: `{"encontrado": bool, "posicion": int or None, ...}`
3. For binary search: return `{"posicion": idx, "array_ordenado": sorted_array, "encontrado": bool}`
4. For hash: return `{"resultado": hash_idx, "tabla": table_state, "pasos": list_of_steps}`

**Factory instantiation** (in `algoritmo_factory.py`):
```python
algoritmo = AlgoritmoFactory.crear("secuencial")  # lowercased algorithm name
resultado = algoritmo.ejecutar(lista, valor)
```

### Adding New Algorithms
1. Create class in `Backend/Models/busquedas_internas/nueva_busqueda.py`
2. Add case to `AlgoritmoFactory.crear()` with lowercase algorithm name
3. Implement `ejecutar(lista, valor)` returning a dict
4. Update frontend `Busqueda.jsx` button to trigger the new algorithm

---

## Frontend Structure (React Tab-Based Navigation)

### Key Files
- `src/App.jsx` – Main router using `tab` state to switch between views; connects to backend at startup (`GET /`)
- `src/Busqueda.jsx` – Selection menu with buttons for internal/external searches
- `src/internas/` – Components for internal search algorithms (Secuencial.jsx, Binaria.jsx, Hash.jsx, etc.)
- `src/externas/` – Components for external search algorithms

### Component Pattern
Each algorithm component (e.g., `Secuencial.jsx`) typically:
1. Uses `useState` for `datos` (array), `foundIndex`, `currentIndex`, `buscando` (animating flag)
2. Implements `actualizarDatos()` to maintain sorted state
3. Implements `manejarBuscar(target, array)` with **animated step-through** using `setInterval()` (~700ms per step)
4. Renders input component `<IngresarDatos />` for user data entry
5. Displays results via conditional rendering (e.g., `MensajeResultado()`)

**Animation pattern** (see `Secuencial.jsx`):
```javascript
const manejarBuscar = (target, array) => {
  let i = 0;
  const interval = setInterval(() => {
    if (i >= array.length) {
      clearInterval(interval);
      setBuscando(false);
      return;
    }
    setCurrentIndex(i); // highlight current position
    if (array[i] === target) {
      clearInterval(interval);
      setFoundIndex(i);
      return;
    }
    i++;
  }, 700);
};
```

### Navigation Pattern
- Components receive `onBack` prop to return to `Busqueda` view
- Tab state is managed in `App.jsx`: `setTab("secuencial")` renders `<Secuencial />`
- Tab names (keys) must match component selection in `Busqueda.jsx` button callbacks

---

## Development Workflows

### Backend
```bash
cd Backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload  # Auto-reloads on file changes; API at http://127.0.0.1:8000/docs
```

### Frontend
```bash
cd Frontend
npm install
npm run dev  # Dev server at http://127.0.0.1:5173; fast HMR
```

### Running Both
Open two terminals: one for backend, one for frontend. Backend must start first (or frontend will show connection error on load).

---

## Project Conventions & Gotchas

- **Naming inconsistency**: Backend methods use both `buscar()` and `ejecutar()` – always check the specific algorithm class
- **Method names**: `POST /buscar` endpoint uses `AlgoritmoFactory.crear()` but controller uses `ejecutar()`
- **CORS**: Frontend can only connect to explicitly whitelisted origins in `app.add_middleware(CORSMiddleware, ...)`
- **Animation timing**: Frontend uses 700ms intervals for step-through animations – keep consistent for UX
- **Integer sorting**: Frontend sorts arrays numerically/alphabetically depending on data type
- **Spanish conventions**: Comments, function names, and UI text are in Spanish; maintain this for consistency

---

## Key Integration Points

1. **Frontend startup** (`App.jsx`): `axios.get("http://127.0.0.1:8000/")` validates backend connection; failure shows "Error al conectar"
2. **Search execution**: Frontend → `POST /buscar` → Factory creates algo → Returns result dict → Frontend animates
3. **Tab routing**: Button click in `Busqueda.jsx` → `onSelect()` callback → `setTab()` in `App.jsx` → renders corresponding component
4. **Data flow**: `IngresarDatos.jsx` → parent component state → `manejarBuscar()` → animation loop

---

## When Implementing Features

- **New search algorithm**: Add Python class, register in Factory, create React component with animation loop, add button to `Busqueda.jsx`
- **UI changes**: Update corresponding `.jsx` component and `.css` in same folder (e.g., `Binaria.jsx` + `Binaria.css`)
- **Backend endpoint**: Add to `busqueda_controller.py` or create new router in `controller/` and include in `app.py`
- **Testing visualizations**: Use browser DevTools to inspect network requests (`http://127.0.0.1:8000/docs` for API testing)
