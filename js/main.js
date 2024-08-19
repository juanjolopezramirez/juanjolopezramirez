var checkIcon = document.getElementById('check-icon');
var mobileMenuContainer = document.querySelector('.mobile-menu-container');

let currentSlideIndex = 1;


document.addEventListener('DOMContentLoaded', function () {
  
    checkIcon.addEventListener('change', function () {
      if (checkIcon.checked) {
        mobileMenuContainer.style.display = 'block';
      } else {
        mobileMenuContainer.style.display = 'none';
      }
    });
  
    // Cierra el menú al hacer clic en un enlace del menú
    var mobileMenuLinks = document.querySelectorAll('.mobile-menu-container a');
    mobileMenuLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenuContainer.style.display = 'none';
        checkIcon.checked = false;
      });
    });
  });
 
  document.getElementById('translateBtn').addEventListener('click', function() {
    const elements = document.querySelectorAll('.translatable');
    const currentLang = document.documentElement.lang;

    // Alternar entre idiomas
    const newLang = currentLang === 'es' ? 'en' : 'es';
    const newFlagSrc = newLang === 'es' ? './assets/icons/enBtn.svg' : './assets/icons/esBtn.svg';
    this.src = newFlagSrc; // Cambiar la bandera

    // Cambiar el contenido de la página al nuevo idioma
    elements.forEach(function(element) {
        element.textContent = element.getAttribute(`data-${newLang}`);
    });

    // Actualizar el idioma en el atributo lang del documento
    document.documentElement.lang = newLang;
});

