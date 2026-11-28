// Scripts de la página Contacto y Admisiones.
// Los enlaces oficiales serán proporcionados por Centro VIAS.

const formularios = {
  solicitud: {
    url: "",
    etiqueta: "Abrir el formulario de solicitud"
  },
  voluntariado: {
    url: "",
    etiqueta: "Abrir el formulario de voluntariado"
  }
};

function configurarFormularios() {
  document.querySelectorAll("[data-formulario]").forEach((boton) => {
    const tipo = boton.dataset.formulario;
    const formulario = formularios[tipo];

    const estado = document.querySelector(
      `[data-form-status="${tipo}"]`
    );

    const etiqueta = boton.querySelector("[data-form-label]");
    const aviso = boton.querySelector("[data-nueva]");

    let urlValida = false;

    try {
      urlValida = new URL(formulario?.url).protocol === "https:";
    } catch {
      urlValida = false;
    }

    if (urlValida) {
      boton.href = formulario.url;
      boton.target = "_blank";
      boton.rel = "noopener noreferrer";
      boton.removeAttribute("aria-disabled");

      if (etiqueta) {
        etiqueta.textContent = formulario.etiqueta;
      }

      if (aviso) {
        aviso.textContent = " (se abre en una pestaña nueva)";
      }

      if (estado) {
        estado.hidden = true;
      }
    } else {
      boton.removeAttribute("href");
      boton.removeAttribute("target");
      boton.removeAttribute("rel");
      boton.setAttribute("aria-disabled", "true");

      if (etiqueta) {
        etiqueta.textContent = "Formulario no disponible";
      }

      if (aviso) {
        aviso.textContent = "";
      }

      if (estado) {
        estado.hidden = false;
      }
    }
  });
}

configurarFormularios();