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
  