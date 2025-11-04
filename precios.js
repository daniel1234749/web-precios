// precios.js (completo: selección, modal, eliminar, vaciar y exportar)

// ---------- UTILS ----------
const normalizarClave = s =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const getFirstField = (obj, candidates = []) => {
  for (const cand of candidates) {
    const nc = normalizarClave(cand);
    for (const k of Object.keys(obj)) {
      if (normalizarClave(k) === nc) return obj[k];
    }
  }
  return undefined;
};

// ---------- ALIAS ----------
const aliasMapRaw = {
  "cod.": ["cod", "codigos", "codigo", "codigoart", "codigo_art"],
  productos: ["producto", "productos", "descripcion", "descrip", "detalle"],
  uxb: ["uxb", "unidades", "u_x_b"],
  vtafair: ["vtafair", "fair_ventas", "fairventas", "vta_fair"],
  vtaburza: ["vtaburza", "burzaco_ventas", "burzacoventas", "vta_burzaco"],
  vtakorn: ["vtakorn", "a_korn_ventas", "akorn_ventas", "korn_ventas"],
  vtatucu: ["vtatucu", "tucuman_ventas", "tucumanventas"],
  fair: ["fair", "fair_stock", "fairstock"],
  burza: ["burza", "burzaco_stock", "burzacostock"],
  korn: ["korn", "a_korn_stock", "akorn_stock"],
  tucu: ["tucu", "tucuman_stock", "tucumanstock"],
  cdistrib: ["cdistrib", "c_distrib", "c.distrib", "cdist", "cdistribucion"],
  precios: ["precios", "precio_vta", "precio", "precios_vta"]
};
const aliasMap = {};
for (const [alias, arr] of Object.entries(aliasMapRaw)) {
  for (const key of arr) aliasMap[normalizarClave(key)] = alias;
}
function lookupAliasForColumn(colName) {
  const nk = normalizarClave(colName);
  return aliasMap[nk] || colName;
}

// ---------- ESTADO ----------
let datosOriginales = [];
let seleccionados = JSON.parse(localStorage.getItem("seleccionados") || "[]");

// ---------- ELEMENTOS ----------
const tabla = document.getElementById("tablaPrincipal");
const theadEl = document.getElementById("encabezado");
const tbodyEl = document.getElementById("cuerpo");
const modal = document.getElementById("modalSeleccion");
const listaSeleccion = document.getElementById("listaSeleccion");
const btnMostrar = document.getElementById("btnMostrar");
const btnCerrar = document.getElementById("btnCerrar");
const btnVaciar = document.getElementById("btnVaciar");
const btnExportar = document.getElementById("btnExportar");

// ---------- CARGA ----------
/*async function cargarDatos() {
  try {
    const res = await fetch("precios.json");
    if (!res.ok) throw new Error("No se pudo cargar precios.json");
    const data = await res.json();
    datosOriginales = Array.isArray(data) ? data : [];
    renderTabla(datosOriginales);
  } catch (err) {
    console.error("Error al cargar precios.json:", err);
    theadEl.innerHTML = "<tr><th style='color:red'>⚠️ Error cargando precios.json</th></tr>";
    tbodyEl.innerHTML = "<tr><td style='text-align:center'>Verificá si el archivo precios.json está en la misma carpeta o abrí con Live Server</td></tr>";
  }
}
cargarDatos();*/
// ---------- CARGA DESDE FIRESTORE ----------
async function cargarDatos() {
  try {
    // Importar módulos dinámicamente (compatible con navegador)
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    // Configuración de Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyDb1kRaogv6dORt5tF_9rc6anRka1f312k",
      authDomain: "web-precios.firebaseapp.com",
      projectId: "web-precios",
      storageBucket: "web-precios.firebasestorage.app",
      messagingSenderId: "743488314251",
      appId: "1:743488314251:web:146464f971bf9a13f1ad8e"
    };

    // Inicializar Firebase y Firestore
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("📡 Cargando productos desde Firestore...");
    const snapshot = await getDocs(collection(db, "productos"));
    datosOriginales = snapshot.docs.map(doc => doc.data());
    console.log(`✅ ${datosOriginales.length} productos cargados desde Firestore.`);

    renderTabla(datosOriginales);
  } catch (err) {
    console.error("❌ Error al cargar datos de Firestore:", err);
    theadEl.innerHTML = "<tr><th style='color:red'>⚠️ Error cargando Firestore</th></tr>";
    tbodyEl.innerHTML = "<tr><td style='text-align:center'>Revisá tu configuración de Firebase o la colección 'productos'</td></tr>";
  }
}

cargarDatos();
// ---------- CARGA DESDE FIRESTORE ----------
async function cargarDatos() {
  try {
    // Importar módulos dinámicamente (compatible con navegador)
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    // Configuración de Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyDb1kRaogv6dORt5tF_9rc6anRka1f312k",
      authDomain: "web-precios.firebaseapp.com",
      projectId: "web-precios",
      storageBucket: "web-precios.firebasestorage.app",
      messagingSenderId: "743488314251",
      appId: "1:743488314251:web:146464f971bf9a13f1ad8e"
    };

    // Inicializar Firebase y Firestore
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("📡 Cargando productos desde Firestore...");
    const snapshot = await getDocs(collection(db, "productos"));
    datosOriginales = snapshot.docs.map(doc => doc.data());
    console.log(`✅ ${datosOriginales.length} productos cargados desde Firestore.`);

    renderTabla(datosOriginales);
  } catch (err) {
    console.error("❌ Error al cargar datos de Firestore:", err);
    theadEl.innerHTML = "<tr><th style='color:red'>⚠️ Error cargando Firestore</th></tr>";
    tbodyEl.innerHTML = "<tr><td style='text-align:center'>Revisá tu configuración de Firebase o la colección 'productos'</td></tr>";
  }
}

cargarDatos();



// ---------- RENDER TABLA ----------
// ---------- RENDER TABLA ----------
// Columnas de ventas (alias ya normalizados)
const columnasVentas = ["vtafair", "vtaburza", "vtakorn", "vtatucu"].map(lookupAliasForColumn);

// Orden deseado de columnas
const ordenColumnas = [
  "cod",
  "productos",
  "uxb",
  "vtafair",
  "vtaburza",
  "vtakorn",
  "vtatucu",
  "fair",
  "burza",
  "korn",
  "tucu",
  "cdistrib",
  "precios"
];

function renderTabla(data) {
  theadEl.innerHTML = "";
  tbodyEl.innerHTML = "";

  if (!data || data.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 20;
    td.textContent = "No hay datos para mostrar";
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbodyEl.appendChild(tr);
    return;
  }

  // Detectar todas las claves disponibles en el dataset
  const todasClaves = Object.keys(data[0]);

  // Forzar el orden de columnas según la lista deseada, pero solo si existen
  const columnas = ordenColumnas.filter(c =>
    todasClaves.some(k => normalizarClave(k) === normalizarClave(c))
  );

  // Agregar cualquier campo extra no previsto (para evitar que se pierdan)
  todasClaves.forEach(k => {
    if (!columnas.some(c => normalizarClave(c) === normalizarClave(k))) {
      columnas.push(k);
    }
  });

  // Crear encabezado
  const trHead = document.createElement("tr");
  columnas.forEach((colName) => {
    const th = document.createElement("th");
    th.textContent = lookupAliasForColumn(colName);
    const norm = normalizarClave(colName);
    if (["producto", "productos", "descripcion"].includes(norm)) th.classList.add("col-productos");
    trHead.appendChild(th);
  });
  const thSel = document.createElement("th");
  thSel.textContent = "Elegir";
  trHead.appendChild(thSel);
  theadEl.appendChild(trHead);

  // Crear filas
  data.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    columnas.forEach((colName) => {
      const td = document.createElement("td");
      const val = row[colName] ?? "";
      td.textContent = val;
      const norm = normalizarClave(colName);

      // Color condicional solo para columnas numéricas
      const colAlias = lookupAliasForColumn(colName);
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        if (numVal <= 0) td.style.color = "red";
        else if (columnasVentas.includes(colAlias) && numVal > 0)
          td.style.color = "#00ff7f"; // verde
      }

      if (["producto", "productos", "descripcion"].includes(norm))
        td.classList.add("productos-col");

      tr.appendChild(td);
    });

    // Botón "Elegir"
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "btn-elegir";

    const id = getFirstField(row, ["CODIGOS", "codigos", "codigo", "cod", "codigo_art"]) || `fila-${rowIndex}`;
    const isSel = seleccionados.some((s) => {
      const sId = getFirstField(s, ["CODIGOS", "codigos", "codigo", "cod", "codigo_art"]);
      return normalizarClave(sId) === normalizarClave(id);
    });

    if (isSel) {
      btn.classList.add("agregado");
      btn.textContent = "✓ Agregado";
    } else {
      btn.textContent = "Elegir";
    }

    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      toggleSeleccionByIdAndRow(id, row, btn);
    });

    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    tbodyEl.appendChild(tr);
  });

  aplicarFormatoStock();
}

function aplicarFormatoStock() {
  const columnasStock = ["fair", "burza", "korn", "tucu"].map(lookupAliasForColumn);

  const filas = tbodyEl.querySelectorAll("tr");
  filas.forEach((tr) => {
    const celdas = tr.children;
    columnasStock.forEach((colAlias) => {
      const idx = Array.from(theadEl.querySelectorAll("th")).findIndex(
        (th) => th.textContent === colAlias
      );
      if (idx >= 0) {
        const td = celdas[idx];
        const val = parseFloat(td.textContent) || 0;
        if (val < 0) {
          td.style.backgroundColor = "red";
          td.style.color = "white";
        } else {
          td.style.backgroundColor = "";
          td.style.color = "#ddd"; // color normal de tabla oscura
        }
      }
    });
  });
}

/*hasta aqui*/
function aplicarFormatoStock() {
  const columnasStock = ["fair", "burza", "korn", "tucu"].map(lookupAliasForColumn);

  const filas = tbodyEl.querySelectorAll("tr");
  filas.forEach(tr => {
    const celdas = tr.children;
    columnasStock.forEach(colAlias => {
      // Buscamos el índice de la columna que coincide con el alias
      const idx = Array.from(tr.parentElement.parentElement.querySelectorAll("th"))
                       .findIndex(th => th.textContent === colAlias);
      if (idx >= 0) {
        const td = celdas[idx];
        const val = parseFloat(td.textContent) || 0;
        if (val < 0) {
          td.style.backgroundColor = "red";
          td.style.color = "white";
        } else {
          td.style.backgroundColor = "";
          td.style.color = "#ddd"; // color normal de tabla oscura
        }
      }
    });
  });
}




// ---------- TOGGLE SELECCIÓN ----------
// ---------- TOGGLE SELECCIÓN + PRECIO PROVEEDOR ----------
function toggleSeleccionByIdAndRow(id, row, btnEl) {
  const idx = seleccionados.findIndex(s => {
    const sId = getFirstField(s, ["CODIGOS","codigos","codigo","cod","codigo_art"]);
    return normalizarClave(sId) === normalizarClave(id);
  });

  if (idx === -1) {
    // Pregunta precio del proveedor
    let precioProv = prompt("Ingrese precio del proveedor:", row.precios || "");
    if (precioProv !== null) {
      precioProv = precioProv.trim();
      row.precioProveedor = precioProv; // guardamos en la fila
    }

    seleccionados.push(row);
    btnEl.classList.add("agregado");
    btnEl.textContent = "✓ Agregado";
  } else {
    seleccionados.splice(idx, 1);
    btnEl.classList.remove("agregado");
    btnEl.textContent = "Elegir";
  }

  localStorage.setItem("seleccionados", JSON.stringify(seleccionados));
}

//---hasta aqui--//
// ---------- MODAL ----------
btnMostrar && btnMostrar.addEventListener("click", mostrarModal);
btnCerrar && btnCerrar.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

// ---------- MODAL ----------  
// ---------- MODAL ----------
function mostrarModal() {
  listaSeleccion.innerHTML = "";
  modal.style.display = "flex";

  if (!seleccionados.length) {
    listaSeleccion.innerHTML = "<p>No hay productos seleccionados.</p>";
    return;
  }

  const tableM = document.createElement("table");
  tableM.className = "tabla-modal";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  // Encabezados dinámicos
  const todasClaves = Object.keys(seleccionados[0]);
  if (!todasClaves.includes("precioProveedor")) todasClaves.push("precioProveedor");
  if (!todasClaves.includes("Margen %")) todasClaves.push("Margen %"); // <-- NUEVO
  todasClaves.push("Eliminar");
  todasClaves.forEach(h => {
    const th = document.createElement("th");
    th.textContent = lookupAliasForColumn(h);
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  tableM.appendChild(thead);

  const tbody = document.createElement("tbody");
  seleccionados.forEach((p, index) => {
    const tr = document.createElement("tr");

    // Rellenar columnas existentes
    Object.keys(p).forEach(k => {
      const td = document.createElement("td");
      td.textContent = p[k] ?? "";
      tr.appendChild(td);
    });

    // columna precioProveedor si no existía
    if (!p.hasOwnProperty("precioProveedor")) {
      const tdProv = document.createElement("td");
      tdProv.textContent = "";
      tr.appendChild(tdProv);
    }

    // Columna Margen %
    const tdMargen = document.createElement("td");
    const precioVenta = parseFloat(getFirstField(p, ["precios", "precio", "precio_vta"]) || 0);
    const precioProv = parseFloat(p.precioProveedor || 0);
    if (precioVenta > 0 && precioProv >= 0) {
      const margen = ((precioVenta - precioProv) / precioVenta) * 100;
      tdMargen.textContent = margen.toFixed(2) + " %";
    } else {
      tdMargen.textContent = "";
    }
    tr.appendChild(tdMargen);

    // Botón eliminar
    const tdEliminar = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "❌";
    btnEliminar.className = "btn-eliminar";
    btnEliminar.addEventListener("click", () => {
      seleccionados.splice(index, 1);
      localStorage.setItem("seleccionados", JSON.stringify(seleccionados));
      mostrarModal();
      renderTabla(datosOriginales);
    });
    tdEliminar.appendChild(btnEliminar);
    tr.appendChild(tdEliminar);

    tbody.appendChild(tr);
  });
  tableM.appendChild(tbody);
  listaSeleccion.appendChild(tableM);
}

//---hasta aqui--//
// ---------- EXPORTAR CSV COMPLETO ----------
btnExportar && btnExportar.addEventListener("click", () => {
  if (!seleccionados.length) return alert("No hay productos para exportar.");

  // Creamos array con Margen % y aplicamos alias a los encabezados
  const columnasOriginales = Object.keys(seleccionados[0]);
  const exportData = seleccionados.map(p => {
    const precioVenta = parseFloat(getFirstField(p, ["precios","precio","precio_vta"]) || 0);
    const precioProv = parseFloat(p.precioProveedor || 0);
    const margen = (precioVenta > 0 && precioProv >= 0) 
      ? ((precioVenta - precioProv) / precioVenta * 100).toFixed(2) + " %"
      : "";
    
    const obj = {};
    columnasOriginales.forEach(c => {
      obj[lookupAliasForColumn(c)] = p[c] ?? "";
    });
    obj["Margen %"] = margen;
    return obj;
  });

  // Creamos workbook y sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Auto-ajustar columnas
  const wscols = Object.keys(exportData[0]).map(k => ({ wch: Math.max(k.length + 2, 12) }));
  ws['!cols'] = wscols;

  // Formato de fuente para toda la hoja
  Object.keys(ws).forEach(r => {
    if (r[0] === '!') return;
    if (!ws[r].s) ws[r].s = {};
    ws[r].s.font = { name: "Calibri", sz: 11 };
  });

  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  // Generamos archivo
  XLSX.writeFile(wb, "seleccion_productos.xlsx");

  alert("Archivo Excel generado correctamente. Se descargará en tu carpeta de descargas.");
});




//----hasta aqui----
// ---------- BOTONES VACÍAR Y EXPORTAR ----------
btnVaciar && btnVaciar.addEventListener("click", () => {
  if (!seleccionados.length) return alert("No hay productos para vaciar.");
  if (!confirm("¿Estás seguro que querés vaciar toda la selección?")) return;

  seleccionados = [];
  localStorage.setItem("seleccionados", JSON.stringify(seleccionados));
  mostrarModal();
  renderTabla(datosOriginales);
});



// ---------- BUSCADOR (ENTER, flexible por palabras parciales) ----------
const buscador = document.getElementById("buscador");

if (buscador) {
  buscador.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const term = normalizarClave(buscador.value);

      if (!term) {
        renderTabla(datosOriginales);
        return;
      }

      // Dividimos por espacios, ignorando vacíos (ej: "ac maro" => ["ac","maro"])
      const palabras = term.split(/\s+/).filter(Boolean);

      const filtrados = datosOriginales.filter((item) => {
        const codigo = normalizarClave(
          getFirstField(item, ["CODIGOS","codigos","codigo","cod","codigo_art"])
        );
        const producto = normalizarClave(
          getFirstField(item, ["PRODUCTOS","productos","producto","descripcion"])
        );

        // Verifica que TODAS las palabras estén en el código o producto
        return palabras.every(p =>
          codigo.includes(p) || producto.includes(p)
        );
      });

      renderTabla(filtrados);
    }
  });
}


//---------- Termina buscador----

// ----------------- DEBUG / STATUS -----------------
(function debugCargaYBusqueda() {
  // crea un cartel de estado en la parte superior (temporal)
  const statusEl = document.createElement("div");
  statusEl.id = "debugStatus";
  statusEl.style.cssText = "position:fixed;left:16px;bottom:16px;background:#fff;border:1px solid #ddd;padding:8px 12px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.08);font-size:13px;z-index:9999";
  statusEl.textContent = "Estado: cargando precios.json...";
  document.body.appendChild(statusEl);

  // Función para actualizar estado
  function setStatus(txt) { 
    console.log("[DEBUG STATUS]", txt);
    statusEl.textContent = `Estado: ${txt}`;
  }

  // Espera a que datosOriginales deje de estar vacío (o hasta 5s)
  let checks = 0;
  const interval = setInterval(() => {
    checks += 1;
    if (Array.isArray(datosOriginales) && datosOriginales.length > 0) {
      clearInterval(interval);
      setStatus(`Cargado ${datosOriginales.length} registros.`);
      console.log("[DEBUG] Primer registro:", datosOriginales[0]);
      console.log("[DEBUG] Claves del primer registro:", Object.keys(datosOriginales[0] || {}));
    } else if (checks > 50) { // ~5s si interval=100ms
      clearInterval(interval);
      setStatus("No se cargaron datos (revisá precios.json / Network).");
      console.warn("[DEBUG] datosOriginales está vacío luego de esperar. Verificá precios.json y Network.");
    }
  }, 100);

  // Mejora: bloquear el input del buscador hasta que carguen datos
  const buscadorEl = document.getElementById("buscador");
  if (buscadorEl) {
    buscadorEl.disabled = true;
    const enableWatcher = setInterval(() => {
      if (Array.isArray(datosOriginales) && datosOriginales.length >= 0) {
        buscadorEl.disabled = false;
        clearInterval(enableWatcher);
      }
    }, 100);
  }

  // Añadimos un pequeño registro cuando ejecutes la búsqueda con ENTER para ver qué se compara
  if (buscadorEl) {
    buscadorEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const term = normalizarClave(buscadorEl.value || "");
        console.log("[DEBUG BUSQUEDA] termino raw:", buscadorEl.value, "=> normalizado:", term);
        const palabras = term.split(/\s+/).filter(Boolean);
        console.log("[DEBUG BUSQUEDA] palabras:", palabras);
        // si hay datos, muestro cómo se normaliza el producto 0 a modo ejemplo
        if (Array.isArray(datosOriginales) && datosOriginales.length > 0) {
          const ejemplo = datosOriginales[0];
          const prodEj = normalizarClave(getFirstField(ejemplo, ["PRODUCTOS","productos","producto","descripcion"]) || "");
          console.log("[DEBUG BUSQUEDA] ejemplo primer producto normalizado:", prodEj);
        }
      }
    });
  }
})();

// === MODO OSCURO / CLARO ===
const body = document.body;
const themeToggle = document.getElementById("theme-switch");

if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  themeToggle.checked = true;
}

themeToggle.addEventListener("change", () => {
  body.classList.toggle("dark");
  localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
});

/*import { getFirestore, collection, getDocs } from "firebase/firestore";

// Inicializamos Firestore
const db = getFirestore(app);

// Función para cargar productos desde Firestore
async function cargarDatos() {
  try {
    const snapshot = await getDocs(collection(db, "productos"));
    datosOriginales = snapshot.docs.map(doc => doc.data());
    renderTabla(datosOriginales);
  } catch (err) {
    console.error("Error cargando Firestore:", err);
    theadEl.innerHTML = "<tr><th style='color:red'>⚠️ Error cargando Firestore</th></tr>";
    tbodyEl.innerHTML = "<tr><td style='text-align:center'>Revisá tu configuración de Firebase y la colección 'productos'</td></tr>";
  }
}

cargarDatos();*/
