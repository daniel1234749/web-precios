// precios.js (versión sin Firebase en main, con orden fijo y precioProveedor solo en modal/export)

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
  "cod": ["cod", "codigos", "codigo", "codigoart", "codigo_art"],
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

// Dado un alias "cod" o "productos" intentamos resolver la clave real
// Scanea un array de rows para mayor robustez.
function resolveKeyForAlias(alias, rows = []) {
  const wanted = alias.toString();
  const candidates = [];
  if (aliasMapRaw[wanted]) candidates.push(...aliasMapRaw[wanted]);
  candidates.push(wanted);
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      const nk = normalizarClave(k);
      for (const cand of candidates) {
        if (nk === normalizarClave(cand)) return k;
      }
    }
  }
  // no encontrada
  return null;
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

// ---------- CARGA DESDE JSON LOCAL (rápido) ----------
async function cargarDatos() {
  try {
    const res = await fetch("precios.json?_=" + Date.now()); // evita caché
    if (!res.ok) throw new Error("No se pudo cargar precios.json");
    const data = await res.json();
    datosOriginales = Array.isArray(data) ? data : [];
    console.log(`✅ ${datosOriginales.length} productos cargados desde precios.json`);
    renderTabla(datosOriginales);
  } catch (err) {
    console.error("❌ Error al cargar precios.json:", err);
    theadEl.innerHTML = "<tr><th style='color:red'>⚠️ Error cargando precios.json</th></tr>";
    tbodyEl.innerHTML = "<tr><td style='text-align:center'>Verificá si el archivo precios.json está en la misma carpeta o abrí con Live Server</td></tr>";
  }
}
cargarDatos();

// ---------- ORDEN DE COLUMNAS (TU ORDEN REAL) ----------
const columnasVentas = ["vtafair", "vtaburza", "vtakorn", "vtatucu"].map(lookupAliasForColumn);
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

// ---------- RENDER TABLA ----------
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

  // todas las claves que aparecen en *algún* registro (para posteriores extras)
  const clavesSet = new Set();
  data.forEach(r => Object.keys(r).forEach(k => clavesSet.add(k)));
  const todasClaves = Array.from(clavesSet);

  // Construimos columnasReales respetando ordenColumnas, buscando en todo dataset
  const columnasReales = [];

  // 1) Meter 'cod' primero si existe
  const keyCod = resolveKeyForAlias("cod", data);
  if (keyCod) columnasReales.push(keyCod);

  // 2) Agregar el resto en el orden establecido (si existen) - omitir cod porque ya agregado
  for (const alias of ordenColumnas) {
    if (alias === "cod") continue;
    const key = resolveKeyForAlias(alias, data);
    if (key && !columnasReales.includes(key)) columnasReales.push(key);
  }

  // 3) Agregar cualquier clave extra que no forme parte del orden (mantener consistencia)
  todasClaves.forEach(k => {
    if (!columnasReales.includes(k)) columnasReales.push(k);
  });

  // Crear encabezado usando alias amigables (mostramos nombres amigables)
  const trHead = document.createElement("tr");
  columnasReales.forEach(colKey => {
    const th = document.createElement("th");
    // Mostramos la etiqueta amigable: si existe un alias conocido lo usamos, si no, usamos la clave
    const label = lookupAliasForColumn(colKey);
    th.textContent = label;
    if (["producto", "productos", "descripcion"].includes(normalizarClave(colKey))) {
      th.classList.add("col-productos");
    }
    trHead.appendChild(th);
  });
  const thSel = document.createElement("th");
  thSel.textContent = "Elegir";
  trHead.appendChild(thSel);
  theadEl.appendChild(trHead);

  // Filas (NO mostramos precioProveedor en la tabla principal)
  data.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    columnasReales.forEach(colKey => {
      const td = document.createElement("td");
      const val = row[colKey] ?? "";
const colAlias = lookupAliasForColumn(colKey);

// 🔹 Si es la columna de precios, aplicar formato en pesos argentinos
if (colAlias === "precios") {
  const num = parseFloat(String(val).replace(",", "."));
  td.textContent = !isNaN(num)
    ? num.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
    : val;
} else {
  td.textContent = val;
}

     
      const numVal = parseFloat(String(val).replace(",", "."));
      if (!isNaN(numVal)) {
        if (numVal <= 0) td.style.color = "red";
        else if (columnasVentas.includes(colAlias) && numVal > 0) td.style.color = "#00ff7f";
      }
      if (["producto", "productos", "descripcion"].includes(normalizarClave(colKey))) td.classList.add("productos-col");
      tr.appendChild(td);
    });

    // Botón Elegir
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "btn-elegir";
    const id = getFirstField(row, ["CODIGOS", "codigos", "codigo", "cod", "codigo_art"]) || `fila-${rowIndex}`;
    const isSel = seleccionados.some((s) => {
      const sId = getFirstField(s, ["CODIGOS", "codigos", "codigo", "cod", "codigo_art"]);
      return normalizarClave(String(sId)) === normalizarClave(String(id));
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

// ---------- FORMATO STOCK ----------
function aplicarFormatoStock() {
  const columnasStock = ["fair", "burza", "korn", "tucu"].map(lookupAliasForColumn);
  const filas = tbodyEl.querySelectorAll("tr");
  filas.forEach(tr => {
    const celdas = tr.children;
    columnasStock.forEach(colAlias => {
      const idx = Array.from(theadEl.querySelectorAll("th")).findIndex(th => th.textContent === colAlias);
      if (idx >= 0 && celdas[idx]) {
        const td = celdas[idx];
        const val = parseFloat(String(td.textContent || "").replace(",", ".")) || 0;
        if (val < 0) {
          td.style.backgroundColor = "red";
          td.style.color = "white";
        } else {
          td.style.backgroundColor = "";
          td.style.color = "#ddd";
        }
      }
    });
  });
}

// ---------- TOGGLE SELECCIÓN (NO MUTAR fila original) ----------
function toggleSeleccionByIdAndRow(id, row, btnEl) {
  const idx = seleccionados.findIndex(s => {
    const sId = getFirstField(s, ["CODIGOS","codigos","codigo","cod","codigo_art"]);
    return normalizarClave(String(sId)) === normalizarClave(String(id));
  });

  if (idx === -1) {
    // Pido precio proveedor (uso valor por defecto del precio de venta si existe)
    let precioDef = getFirstField(row, ["precios","precio","precio_vta"]) || "";
    let precioProv = prompt("Ingrese precio del proveedor:", precioDef);
    if (precioProv !== null) {
      precioProv = String(precioProv).trim();
      // Guardamos una COPIA del objeto (no mutamos datosOriginales)
      const copia = Object.assign({}, row);
      copia.precioProveedor = precioProv;
      seleccionados.push(copia);
      btnEl.classList.add("agregado");
      btnEl.textContent = "✓ Agregado";
    }
  } else {
    seleccionados.splice(idx, 1);
    btnEl.classList.remove("agregado");
    btnEl.textContent = "Elegir";
  }

  localStorage.setItem("seleccionados", JSON.stringify(seleccionados));
}

// ---------- MODAL ----------
btnMostrar && btnMostrar.addEventListener("click", mostrarModal);
btnCerrar && btnCerrar.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

function mostrarModal() {
  listaSeleccion.innerHTML = "";
  modal.style.display = "flex";

  if (!seleccionados.length) {
    listaSeleccion.innerHTML = "<p>No hay productos seleccionados.</p>";
    return;
  }

  // Queremos mostrar columnas en el orden real (alias->clave) + precioProveedor + Margen %
  // Para generar orden de columnas en modal usamos resolveKeyForAlias con el primer seleccionado
  const firstSel = seleccionados[0] || {};
  const modalKeys = [];

  for (const alias of ordenColumnas) {
    const key = resolveKeyForAlias(alias, seleccionados) || resolveKeyForAlias(alias, [firstSel]);
    if (key && !modalKeys.includes(key)) modalKeys.push(key);
  }
  // Agregar extras si hay
  Object.keys(firstSel).forEach(k => {
    if (!modalKeys.includes(k) && k !== "precioProveedor") modalKeys.push(k);
  });
  // Finalmente precioProveedor si no existe
  if (!modalKeys.includes("precioProveedor")) modalKeys.push("precioProveedor");
  // Añadimos Margen % y Eliminar
  modalKeys.push("Margen %");
  modalKeys.push("Eliminar");

  // Head
  const tableM = document.createElement("table");
  tableM.className = "tabla-modal";
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  modalKeys.forEach(h => {
    const th = document.createElement("th");
    th.textContent = lookupAliasForColumn(h);
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  tableM.appendChild(thead);

  const tbody = document.createElement("tbody");
  seleccionados.forEach((p, index) => {
    const tr = document.createElement("tr");
    // mostrar en modalKeys orden (excepto 'Margen %' y 'Eliminar' que manejamos abajo)
    modalKeys.forEach(k => {
      if (k === "Margen %" || k === "Eliminar") return;
      const td = document.createElement("td");
      td.textContent = p[k] ?? "";
      tr.appendChild(td);
    });

    // Margen %
    const tdMargen = document.createElement("td");
    const precioVenta = parseFloat(String(getFirstField(p, ["precios","precio","precio_vta"]) || 0).replace(",", ".")) || 0;
    const precioProv = parseFloat(String(p.precioProveedor || 0).replace(",", ".")) || 0;
    if (precioVenta > 0 && !isNaN(precioProv)) {
      const margen = ((precioVenta - precioProv) / precioVenta) * 100;
      tdMargen.textContent = margen.toFixed(2) + " %";
    } else {
      tdMargen.textContent = "";
    }
    tr.appendChild(tdMargen);

    // Eliminar
    const tdEliminar = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "❌";
    btnEliminar.className = "btn-eliminar";
    btnEliminar.addEventListener("click", (ev) => {
  ev.stopPropagation(); // evita conflictos con clicks
  seleccionados.splice(index, 1);
  localStorage.setItem("seleccionados", JSON.stringify(seleccionados));

  // ✅ Elimina la fila directamente sin redibujar toda la tabla
  tr.remove();

  // ✅ Si ya no quedan seleccionados, mostramos un mensaje breve
  if (seleccionados.length === 0) {
    listaSeleccion.innerHTML = "<p>No hay productos seleccionados.</p>";
  }
});


    tdEliminar.appendChild(btnEliminar);
    tr.appendChild(tdEliminar);

    tbody.appendChild(tr);
  });
  tableM.appendChild(tbody);
  listaSeleccion.appendChild(tableM);
}

// ---------- EXPORTAR A EXCEL (incluye precioProveedor y Margen %) ----------
btnExportar && btnExportar.addEventListener("click", () => {
  if (!seleccionados.length) return alert("No hay productos para exportar.");

  // Queremos exportar con el mismo orden de columnas que definiste + precioProveedor + Margen %
  const exportKeys = [];

  // Mapear los alias ordenColumnas a claves reales buscando en los seleccionados
  for (const alias of ordenColumnas) {
    const key = resolveKeyForAlias(alias, seleccionados) || resolveKeyForAlias(alias, datosOriginales);
    if (key && !exportKeys.includes(key)) exportKeys.push(key);
  }

  // añadir cualquier clave extra presente en seleccionados (excepto precioProveedor)
  Object.keys(seleccionados[0] || {}).forEach(k => {
    if (!exportKeys.includes(k) && k !== "precioProveedor") exportKeys.push(k);
  });

  // finalmente agregamos precioProveedor y Margen %
  if (!exportKeys.includes("precioProveedor")) exportKeys.push("precioProveedor");
  exportKeys.push("Margen %");

  // Crear array para exportar respetando headers amigables
  const exportData = seleccionados.map(p => {
    const obj = {};
    for (const k of exportKeys) {
      if (k === "Margen %") {
        const precioVenta = parseFloat(String(getFirstField(p, ["precios","precio","precio_vta"]) || 0).replace(",", ".")) || 0;
        const precioProv = parseFloat(String(p.precioProveedor || 0).replace(",", ".")) || 0;
        obj[lookupAliasForColumn(k)] = (precioVenta > 0 && !isNaN(precioProv)) ? ((precioVenta - precioProv)/precioVenta*100).toFixed(2) + " %" : "";
      } else if (k === "precioProveedor") {
        obj[lookupAliasForColumn(k)] = p.precioProveedor ?? "";
      } else {
        obj[lookupAliasForColumn(k)] = p[k] ?? "";
      }
    }
    return obj;
  });

  // Exportar con sheetjs
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, "seleccion_productos.xlsx");
  alert("Archivo Excel generado correctamente. Se descargará en tu carpeta de descargas.");
});

// ---------- BOTÓN VACIAR ----------
btnVaciar && btnVaciar.addEventListener("click", () => {
  if (!seleccionados.length) return alert("No hay productos para vaciar.");
  if (!confirm("¿Estás seguro que querés vaciar toda la selección?")) return;
  seleccionados = [];
  localStorage.setItem("seleccionados", JSON.stringify(seleccionados));
  listaSeleccion.innerHTML = "<p>No hay productos seleccionados.</p>"; // más rápido
});


// ---------- BUSCADOR ----------
const buscador = document.getElementById("buscador");
if (buscador) {
  buscador.addEventListener("keydown", e => {
   if (e.key === "Enter") {
  const term = normalizarClave(buscador.value);
  if (!term) return; // no hace nada si está vacío

  const palabras = term.split(/\s+/).filter(Boolean);
  const filtrados = datosOriginales.filter(item => {
    const codigo = normalizarClave(getFirstField(item, ["CODIGOS","codigos","codigo","cod","codigo_art"]) || "");
    const producto = normalizarClave(getFirstField(item, ["PRODUCTOS","productos","producto","descripcion"]) || "");
    return palabras.every(p => codigo.includes(p) || producto.includes(p));
  });
  renderTabla(filtrados);
}

  });
}

// ---------- MODO OSCURO ----------
const body = document.body;
const themeToggle = document.getElementById("theme-switch");
if (themeToggle) {
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
    themeToggle.checked = true;
  }
  themeToggle.addEventListener("change", () => {
    body.classList.toggle("dark");
    localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
  });
}
// === Mostrar fecha de última actualización ===
fetch('precios.json')
  .then(response => response.headers.get('last-modified'))
  .then(fecha => {
    if (fecha) {
      const fechaFormateada = new Date(fecha).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      document.getElementById('ultima-actualizacion').textContent = 
        `Última actualización: ${fechaFormateada}`;
    }
  })
  .catch(err => console.error('Error al obtener la fecha de actualización:', err));
