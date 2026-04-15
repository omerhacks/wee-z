async function loadMenu() {
  const grid = document.getElementById('menuGrid');

  try {
    const res = await fetch('/menu');
    const data = await res.json();

    grid.innerHTML = '';

    data.data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'menu-card';

      card.innerHTML = `
        <img src="${item.image}" />
        <div class="menu-card-body">
          <h4>${item.name}</h4>
          <p>${item.description}</p>
          <strong>Rs. ${item.price}</strong>
          <br/>
          <button>Add</button>
        </div>
      `;

      grid.appendChild(card);
    });

  } catch (e) {
    grid.innerHTML = "Failed to load menu";
  }
}

window.onload = loadMenu;
