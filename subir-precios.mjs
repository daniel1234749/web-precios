// subir-precios.mjs

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  writeBatch,
  doc,
  collection,
  getDocs,
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// === Resolver ruta absoluta al JSON ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const preciosPath = path.join(__dirname, "precios.json");

// === Leer precios.json ===
const data = fs.readFileSync(preciosPath, "utf-8");
const productos = JSON.parse(data);

// === Configuración Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyDb1kRaogv6dORt5tF_9rc6anRka1f312k",
  authDomain: "web-precios.firebaseapp.com",
  projectId: "web-precios",
  storageBucket: "web-precios.firebasestorage.app",
  messagingSenderId: "743488314251",
  appId: "1:743488314251:web:146464f971bf9a13f1ad8e"
};

// === Inicializar Firebase y Firestore ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Borrar colección "productos" ===
async function borrarColeccion() {
  console.log("🗑️  Borrando colección 'productos' existente...");
  const snapshot = await getDocs(collection(db, "productos"));
  const batch = writeBatch(db);
  let count = 0;

  snapshot.docs.forEach(docSnap => {
    batch.delete(docSnap.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Borrados ${count} documentos existentes.`);
  } else {
    console.log("⚠️ No había documentos para borrar.");
  }
}

// === Subir productos por batches ===
async function subirProductos() {
  console.log(`⬆️  Subiendo ${productos.length} productos...`);
  let batch = writeBatch(db);
  let count = 0;

  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];
    const docId = p.cod?.toString() || `prod-${i}`;
    const docRef = doc(db, "productos", docId);
    batch.set(docRef, p);
    count++;

    if (count === 500) {
      await batch.commit();
      console.log(`   🔹 Subidos ${i + 1} productos...`);
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) await batch.commit();
  console.log(`🎉 Todos los productos (${productos.length}) subidos correctamente.`);
}

// === Ejecución principal ===
async function main() {
  try {
    await borrarColeccion();
    await subirProductos();
    console.log("🚀 Actualización completa.");
  } catch (err) {
    console.error("❌ Error al actualizar productos:", err);
  }
}

main();
