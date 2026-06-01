const priceInput = document.querySelector("[data-price-input]");
const stockInput = document.querySelector("[data-stock-input]");
const priceNode = document.querySelector("[data-product-price]");
const stockNode = document.querySelector("[data-product-stock]");

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const price = params.get("price");
  const stock = params.get("stock");

  if (price) {
    priceInput.value = price;
  }

  if (stock) {
    stockInput.checked = stock !== "out";
  }
}

function syncUrl(price, isInStock) {
  const params = new URLSearchParams(window.location.search);
  params.set("price", price);
  params.set("stock", isInStock ? "in" : "out");
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

function updateProductState() {
  const price = Number.parseFloat(priceInput.value || "0").toFixed(2);
  const isInStock = stockInput.checked;

  priceNode.textContent = `${price} EUR`;
  stockNode.textContent = isInStock ? "En stock" : "Rupture";
  stockNode.classList.toggle("in-stock", isInStock);
  stockNode.classList.toggle("out-of-stock", !isInStock);
  syncUrl(price, isInStock);
}

priceInput.addEventListener("input", updateProductState);
stockInput.addEventListener("change", updateProductState);
applyUrlState();
updateProductState();
