const perfilesPredeterminados = [
  { id: "team-profile-1", nombre: "[Nombre completo]", rol: "[Cargo]", bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro VIAS.]", foto: "", alt: "" },
  { id: "team-profile-2", nombre: "[Nombre completo]", rol: "[Cargo]", bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro VIAS.]", foto: "", alt: "" },
  { id: "team-profile-3", nombre: "[Nombre completo]", rol: "[Cargo]", bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro VIAS.]", foto: "", alt: "" },
  { id: "team-profile-4", nombre: "[Nombre completo]", rol: "[Cargo]", bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro VIAS.]", foto: "", alt: "" },
  { id: "team-profile-5", nombre: "[Nombre completo]", rol: "[Cargo]", bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro VIAS.]", foto: "", alt: "" },
  { id: "team-profile-6", nombre: "[Nombre completo]", rol: "[Cargo]", bio: "[Dos o tres oraciones sobre esta persona y lo que hace en Centro VIAS.]", foto: "", alt: "" },
];

const colores = ["t-g", "t-y", "t-b"];
const icono =
  '<svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#2F6B2A" ' +
  'stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path></svg>';

let perfiles = perfilesPredeterminados.map((perfil) => ({
  ...perfil,
  categoria: "encargado",
}));
let esAdministrador = false;

function normalizarCategoria(perfil) {
  if (
    perfil.categoria === "adjunta-directores" ||
    String(perfil.id || "").startsWith("team-profile-adjunta-directores-")
  ) {
    return "adjunta-directores";
  }
  if (
    perfil.categoria === "voluntario" ||
    String(perfil.id || "").startsWith("team-profile-voluntario-")
  ) {
    return "voluntario";
  }
  return "encargado";
}


async function cargarPerfiles() {
  const rutas = [
    "/api/team",
    "/data/team.json"
  ];

  for (const ruta of rutas) {
    try {
      const response = await fetch(ruta, {
        cache: "no-store"
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (Array.isArray(data.profiles)) {
        perfiles = data.profiles.map((perfil) => ({
          ...perfil,
          categoria: normalizarCategoria(perfil),
        }));

        console.log("Perfiles cargados desde:", ruta);
        break;
      }
    } catch (error) {
      console.warn("No se pudo cargar:", ruta, error);
    }
  }

  try {
    const session = await fetch("/api/session", {
      credentials: "same-origin"
    });

    esAdministrador = session.ok;
  } catch (_error) {
    esAdministrador = false;
  }

  renderizarEquipo();
}

function guardarPerfiles(statusElement) {
  if (statusElement) statusElement.textContent = "Guardando...";
  return fetch("/api/admin/team/save", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profiles: perfiles }),
  }).then(async (response) => {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "No se pudo guardar.");
    if (statusElement) statusElement.textContent = "Guardado";
    return true;
  }).catch((error) => {
    if (statusElement) statusElement.textContent = error.message;
    return false;
  });
}

function crearTarjeta(persona, indice) {
  const color = colores[indice % colores.length];
  const item = document.createElement("li");
  const tarjeta = document.createElement("article");
  tarjeta.className = "card member";

  const foto = document.createElement("div");
  foto.className = "photo " + color;

  if (persona.foto) {
    const img = document.createElement("img");

    img.alt = persona.alt || persona.nombre;
    img.loading = "lazy";

    if (persona.foto.startsWith("Images/photos/")) {
      img.onerror = () => {
        img.onerror = null;
        img.src = "/" + persona.foto;
      };

      img.src = "/api/photo?path=" +
        encodeURIComponent(persona.foto);
    } else {
      img.src = persona.foto.startsWith("/")
        ? persona.foto
        : "/" + persona.foto;
    }

    foto.appendChild(img);
  } else {
    foto.innerHTML = icono;
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

  if (esAdministrador) {
    nombre.contentEditable = "true";
    nombre.classList.add("editable-profile-field");
    rol.contentEditable = "true";
    rol.classList.add("editable-profile-field");
    bio.contentEditable = "true";
    bio.classList.add("editable-profile-field");

    const status = document.createElement("span");
    status.className = "profile-status";
    status.setAttribute("role", "status");

    const actions = document.createElement("div");
    actions.className = "profile-actions";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp,image/gif";
    fileInput.hidden = true;

    const photoButton = document.createElement("button");
    photoButton.type = "button";
    photoButton.className = "profile-action";
    photoButton.textContent = persona.foto ? "Cambiar foto" : "Añadir foto";
    photoButton.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      persona.nombre = nombre.textContent.trim();
      persona.rol = rol.textContent.trim();
      persona.bio = bio.textContent.trim();
      status.textContent = "Guardando foto...";
      const slot = persona.id || "team-profile-" + (Date.now());
      persona.id = slot;
      const formData = new FormData();
      formData.set("slot", slot);
      formData.set("file", file);
      formData.set("alt", persona.nombre);

      const response = await fetch("/api/admin/photos/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.textContent = result.error || "No se pudo guardar la foto.";
        return;
      }
      persona.foto = result.path;
      persona.alt = persona.nombre;
      await guardarPerfiles(status);
      renderizarEquipo();
    });

    const removePhotoButton = document.createElement("button");
    removePhotoButton.type = "button";
    removePhotoButton.className = "profile-action secondary";
    removePhotoButton.textContent = "Eliminar foto";
    removePhotoButton.hidden = !persona.foto;
    removePhotoButton.addEventListener("click", async () => {
      if (!persona.id) return;
      persona.nombre = nombre.textContent.trim();
      persona.rol = rol.textContent.trim();
      persona.bio = bio.textContent.trim();
      status.textContent = "Eliminando foto...";
      await fetch("/api/admin/photos/remove", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: persona.id }),
      });
      persona.foto = "";
      persona.alt = "";
      await guardarPerfiles(status);
      renderizarEquipo();
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "profile-action";
    saveButton.textContent = "Guardar";
    saveButton.addEventListener("click", () => {
      persona.nombre = nombre.textContent.trim();
      persona.rol = rol.textContent.trim();
      persona.bio = bio.textContent.trim();
      guardarPerfiles(status).then(renderizarEquipo);
    });

    const removeProfileButton = document.createElement("button");
    removeProfileButton.type = "button";
    removeProfileButton.className = "profile-action danger";
    removeProfileButton.textContent = "Eliminar perfil";
    removeProfileButton.addEventListener("click", () => {
      if (!window.confirm("¿Eliminar este perfil?")) return;
      perfiles = perfiles.filter((profile) => profile !== persona);
      guardarPerfiles(status).then(renderizarEquipo);
    });

    actions.append(fileInput, photoButton, removePhotoButton, saveButton, removeProfileButton);
    info.append(status, actions);
  }

  info.prepend(nombre, rol, bio);
  tarjeta.append(foto, info);
  item.appendChild(tarjeta);
  return item;
}

function crearBotonAgregar(categoria) {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "add-profile-card";
  button.setAttribute("aria-label", "Añadir perfil");
  button.innerHTML = '<span aria-hidden="true">+</span><strong>Añadir perfil</strong>';
  const status = document.createElement("span");
  status.className = "profile-status";
  status.setAttribute("role", "status");
  button.addEventListener("click", () => {
    const nuevo = {
      id: "team-profile-" +
        (categoria === "adjunta-directores" || categoria === "voluntario"
          ? categoria + "-"
          : "") +
        Date.now(),
      nombre: "[Nombre completo]",
      rol: "[Cargo]",
      bio: "[Dos o tres oraciones sobre esta persona.]",
      foto: "",
      alt: "",
      categoria,
    };
    perfiles.push(nuevo);
    button.disabled = true;
    guardarPerfiles(status).then((saved) => {
      if (saved) {
        renderizarEquipo();
      } else {
        perfiles = perfiles.filter((profile) => profile !== nuevo);
        button.disabled = false;
      }
    });
  });
  item.append(button, status);
  return item;
}

function renderizarEquipo() {
  const encargados = perfiles.filter(
    (persona) => normalizarCategoria(persona) === "encargado",
  );
  const voluntarios = perfiles.filter(
    (persona) => normalizarCategoria(persona) === "voluntario",
  );
  const adjuntas = perfiles.filter(
    (persona) => normalizarCategoria(persona) === "adjunta-directores",
  );

  const encargadosLista = document.getElementById("equipo-lista");
  const voluntariosLista = document.getElementById("voluntarios-lista");
  const adjuntasLista = document.getElementById("adjuntas-lista");
  if (!encargadosLista || !voluntariosLista || !adjuntasLista) return;

  encargadosLista.replaceChildren();
  encargados.forEach((persona, indice) => {
    encargadosLista.appendChild(crearTarjeta(persona, indice));
  });

  voluntariosLista.replaceChildren();
  voluntarios.forEach((persona, indice) => {
    voluntariosLista.appendChild(crearTarjeta(persona, indice));
  });

  adjuntasLista.replaceChildren();
  adjuntas.forEach((persona, indice) => {
    adjuntasLista.appendChild(crearTarjeta(persona, indice));
  });

  if (esAdministrador) {
    encargadosLista.appendChild(crearBotonAgregar("encargado"));
    voluntariosLista.appendChild(crearBotonAgregar("voluntario"));
    adjuntasLista.appendChild(crearBotonAgregar("adjunta-directores"));
  }
}

cargarPerfiles();
