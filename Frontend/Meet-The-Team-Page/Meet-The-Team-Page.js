// Scripts de la página Conoce al Equipo.
// Las tarjetas se generan a partir de la lista "equipo". Para agregar, cambiar
// o quitar a una persona, solo se edita esta lista; el diseño no cambia.
// "foto" es la ruta de la imagen (por ejemplo "fotos/nombre.jpg").
// Si "foto" está vacía se muestra un espacio reservado.
// "alt" describe la foto para lectores de pantalla.
 
const equipo = [
  {
    nombre: "[Nombre completo]",
    rol: "[Cargo]",
    bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro Vías.]",
    foto: "",
    alt: ""
  },
  {
    nombre: "[Nombre completo]",
    rol: "[Cargo]",
    bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro Vías.]",
    foto: "",
    alt: ""
  },
  {
    nombre: "[Nombre completo]",
    rol: "[Cargo]",
    bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro Vías.]",
    foto: "",
    alt: ""
  },
  {
    nombre: "[Nombre completo]",
    rol: "[Cargo]",
    bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro Vías.]",
    foto: "",
    alt: ""
  },
  {
    nombre: "[Nombre completo]",
    rol: "[Cargo]",
    bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro Vías.]",
    foto: "",
    alt: ""
  },
  {
    nombre: "[Nombre completo]",
    rol: "[Cargo]",
    bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro Vías.]",
    foto: "",
    alt: ""
  }
];
 
const colores = ["t-g", "t-y", "t-b"];
const icono =
  '<svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#2F6B2A" ' +
  'stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path></svg>';
 
function crearTarjeta(persona, indice) {
  const color = colores[indice % colores.length];
  const item = document.createElement("li");
  const tarjeta = document.createElement("article");
  tarjeta.className = "card member";
 
  const foto = document.createElement("div");
  foto.className = "photo " + color;
  if (persona.foto) {
    const img = document.createElement("img");
    img.src = persona.foto;
    img.alt = persona.alt || "Foto de " + persona.nombre;
    img.loading = "lazy";
    foto.appendChild(img);
  } else {
    foto.setAttribute("role", "img");
    foto.setAttribute("aria-label", "Espacio reservado para la foto de " + persona.nombre);
    foto.innerHTML = icono;
    const etiqueta = document.createElement("span");
    etiqueta.className = "tag";
    etiqueta.textContent = "Foto";
    foto.appendChild(etiqueta);
  }
 
  const info = document.createElement("div");
  info.className = "info";
 
  const nombre = document.createElement("h2");
  nombre.textContent = persona.nombre;
 
  const rol = document.createElement("p");
  rol.className = "role " + color;
  rol.textContent = persona.rol;
 
  const bio = document.createElement("p");
  bio.textContent = persona.bio;
 
  info.append(nombre, rol, bio);
  tarjeta.append(foto, info);
  item.appendChild(tarjeta);
  return item;
}
 
const lista = document.getElementById("equipo-lista");
if (lista) {
  equipo.forEach(function (persona, i) {
    lista.appendChild(crearTarjeta(persona, i));
  });
}