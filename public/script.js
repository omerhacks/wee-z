// ================= CART =================
function toggleCart() {
  document.getElementById("cartOverlay").classList.toggle("open");
  document.getElementById("cartSidebar").classList.toggle("open");
}

// ================= MODAL (FIXED) =================
function openCheckout() {
  document.getElementById("checkoutOverlay").classList.add("open");
}

function closeCheckout() {
  document.getElementById("checkoutOverlay").classList.remove("open");
}

// Close when clicking outside
document.getElementById("checkoutOverlay").addEventListener("click", function(e) {
  if (e.target === this) {
    closeCheckout();
  }
});

// ================= DELIVERY TIME =================
function checkDeliveryTime() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const cutoff = 22 * 60 + 30;

  const delivery = document.querySelector('input[value="delivery"]');

  if (delivery && currentTime >= cutoff) {
    delivery.disabled = true;
  }
}

window.addEventListener("load", checkDeliveryTime);
