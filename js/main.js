var checkIcon = document.getElementById('check-icon');
var mobileMenuContainer = document.querySelector('.mobile-menu-container');

const slider = document.querySelector(".skills-container--slider");
const arrows = document.querySelectorAll(".arrow");
const indicators = document.querySelectorAll(".indicator");
let currentIndex = 0;


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
  

  document.addEventListener("DOMContentLoaded", function () {
    arrows.forEach((arrow) => {
      arrow.addEventListener("click", () => {
        if (arrow.classList.contains("left-arrow")) {
          currentIndex = Math.max(currentIndex - 1, 0);
        } else {
          currentIndex = Math.min(currentIndex + 1, slider.children.length - 1);
        }
  
        updateSlider();
      });
    });
  
    indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => {
        currentIndex = index;
        updateSlider();
      });
    });
  
    function updateSlider() {
      slider.style.transform = `translateX(${-currentIndex * 100}%)`;
  
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle("active", index === currentIndex);
      });
    }
  });
  