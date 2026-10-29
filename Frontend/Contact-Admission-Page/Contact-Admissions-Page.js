// Scripts de la página Contacto y Admisiones.
// Aquí se pegan los enlaces de los formularios de Google. Mientras estén
// vacíos, los botones no llevan a ningún lugar.

const formularios = {
  solicitud: "", // Formulario del participante y su encargado
  voluntariado: "" // Formulario de interés para voluntarios
};

document.querySelectorAll("[data-formulario]").forEach(function (boton) {
  const url = formularios[boton.dataset.formulario];
  if (url) {
    boton.href = url;
    boton.target = "_blank";
    boton.rel = "noopener noreferrer";
    const aviso = boton.querySelector("[data-nueva]");
    if (aviso) {
      aviso.textContent = " (se abre en una pestaña nueva)";
    }
  } else {
    boton.setAttribute("aria-disabled", "true");
    boton.addEventListener("click", function (evento) {
      evento.preventDefault();
    });
  }
});