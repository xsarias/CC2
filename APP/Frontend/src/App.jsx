import { useEffect, useState } from "react";
import axios from "axios";
import Busqueda from "./Busqueda";
import Grafos from "./Grafos";
import OperacionesGrafos from "./grafos/OperacionesGrafosClean";
import RepresentacionGrafos from "./grafos/RepresentacionGrafos";
import ArbolesGrafos from "./grafos/ArbolesGrafos";
import Secuencial from "./internas/Secuencial";
import Binaria from "./internas/Binaria";
import Hash from "./internas/Hash";
import ArbolesDigitales from "./internas/ArbolesDigitales";
import Multiples from "./internas/Multiples";
import PorResiduo from "./internas/PorResiduo";
import Huffman from "./internas/Huffman";
import "./App.css"
import "./internas/ArbolesDigitales";
import "./internas/Multiples";
import "./internas/PorResiduo";
import "./internas/Huffman";
import SecuencialEx from "./externas/SecuencialEx";
import BinariaEx from "./externas/BinariaEx";
import HashExpansiones from "./externas/HashExpansiones"
import IndicesSimulador from "./externas/IndicesSimulador";

import HashEx from "./externas/HashEx";
function App() {
  const [message, setMessage] = useState("Cargando...");
  const [tab, setTab] = useState("home");
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/")
      .then((res) => setMessage(res.data.message || "Respuesta recibida"))
      .catch(() => setMessage("Error al conectar con backend"));
  }, []);

  return (
    <div className="contenedor">
      {/* Home */}
      {tab === "home" && (
        <>
          <h1 className="titulo">Ciencias de la Computación II</h1>
          <p className="mensaje">¡Bienvenido!</p>
          <div className="app-container">
            <button onClick={() => setTab("busqueda")} className="botones">Búsquedas</button>
            <button onClick={() => setTab("grafos")} className="botones">Grafos</button>
          </div>
        </>
      )}

      {/* Menú de algoritmos */}
      {tab === "busqueda" && <Busqueda onSelect={(alg) => setTab(alg)} />}

      {/* Menú de grafos */}
      {tab === "grafos" && <Grafos onSelect={(alg) => setTab(alg)} />}

      {/* Componentes de grafos */}
      {tab === "operaciones_grafos" && <OperacionesGrafos onBack={() => setTab("grafos")} />}
      {tab === "representacion_grafos" && <RepresentacionGrafos onBack={() => setTab("grafos")} />}
      {tab === "arboles_grafos" && <ArbolesGrafos onBack={() => setTab("grafos")} />}

      {tab === "secuencial" && <Secuencial array={datos} onBack={() => setTab("busqueda")} />}
      {tab === "binaria" && <Binaria array={datos} onBack={() => setTab("busqueda")} />}
      {tab === "hash" && <Hash onBack={() => setTab("busqueda")} />}
      {tab === "arbol_dig" && <ArbolesDigitales onBack={() => setTab("busqueda")} />}
      {tab === "residuo" && <PorResiduo onBack={() => setTab("busqueda")} />}
      {tab === "multiples" && <Multiples onBack={() => setTab("busqueda")} />}
      {tab === "huffman" && <Huffman onBack={() => setTab("busqueda")} />}

      {tab == "SecuencialEx" && <SecuencialEx onBack={() => setTab("busqueda")} />}
      {tab == "BinariaEx" && <BinariaEx onBack={() => setTab("busqueda")} />}
      {tab == "HashEx" && <HashEx onBack={() => setTab("busqueda")} />}
      {tab == "HashExpansiones" && <HashExpansiones onBack={() => setTab("busqueda")} />}
      {tab === "IndicesSimulador" && <IndicesSimulador onBack={() => setTab("busqueda")} />}



    </div>
  );
}

export default App;
