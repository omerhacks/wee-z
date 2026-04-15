function disableDeliveryIfLate() {
  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const cutoffTime = 22 * 60 + 30;

    if (currentTime >= cutoffTime) {
      const deliveryOption = document.querySelector('input[value="delivery"]');
      const pickupOption = document.querySelector('input[value="pickup"]');

      if (deliveryOption) {
        deliveryOption.disabled = true;
      }

      if (pickupOption) {
        pickupOption.checked = true;
      }

      const msg = document.getElementById("deliveryMsg");
      if (msg) msg.style.display = "block";
    }
  } catch (e) {
    console.error("Delivery check error:", e);
  }
}

window.addEventListener("DOMContentLoaded", disableDeliveryIfLate);
