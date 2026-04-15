// ✅ YOUR MENU DATA
const menu = [
  { id: 3, name: "Beef Nihari", price: 750, category: "Main Course", description: "Slow-cooked beef nihari", image: "/images/nihari.jpeg" },
  { id: 4, name: "Daal Makhani", price: 450, category: "Main Course", description: "Creamy black lentils", image: "/images/daalmakhni.jpeg" },
  { id: 6, name: "Mutton Pulao", price: 900, category: "Rice", description: "Rice cooked with mutton", image: "/images/Mutton-Pulao.jpeg" },
  { id: 8, name: "Seekh Kabab", price: 600, category: "BBQ & Grills", description: "Minced kababs", image: "/images/seekh-kebab.jpeg" },
  { id: 9, name: "Tandoori Naan", price: 60, category: "Breads", description: "Fresh naan", image: "/images/tandoori-naan.jpeg" },
  { id: 11, name: "Meethi Lassi", price: 250, category: "Beverages", description: "Sweet yogurt drink", image: "/images/lassi.jpeg" },
  { id: 13, name: "Gulab Jamun", price: 200, category: "Desserts", description: "Sweet desi dumplings", image: "/images/gulab-jamun.jpeg" },
  { id: 14, name: "Kheer", price: 220, category: "Desserts", description: "Rice pudding", image: "/images/kheer.jpeg" },
  { id: 16, name: "Samosa Chaat", price: 180, category: "Snacks & Rolls", description: "Chaat with samosa", image: "/images/samosa-chat.jpeg" }
];

// ✅ RENDER FUNCTION
function renderMenu() {
  const container = document.getElementById("menuGrid");

  container.innerHTML = menu.map(item => `
    <div class="menu-card">
      <div class="menu-img">
        <img src="${item.image}" alt="${item.name}">
      </div>

      <div class="menu-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>

        <div class="menu-footer">
          <span>Rs ${item.price}</span>
          <button>+</button>
        </div>
      </div>
    </div>
  `).join("");

  apply3D();
}

// ✅ 3D EFFECT
function apply3D() {
  document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rotateY = (x / rect.width - 0.5) * 20;
      const rotateX = (y / rect.height - 0.5) * -20;

      card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(1.05)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
  });
}

// RUN
renderMenu();
