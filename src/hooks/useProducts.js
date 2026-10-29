"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "mini-shop-products";

export const initialProducts = [
  {
    id: "sample-ceramic-vase",
    name: "Ceramic Vase",
    price: 34,
    category: "Home",
    description: "A hand-finished vase for fresh stems or quiet shelves.",
    image:
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-linen-tote",
    name: "Linen Market Tote",
    price: 28,
    category: "Accessories",
    description: "A roomy, reusable carryall made for everyday errands.",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-stoneware-mug",
    name: "Stoneware Mug",
    price: 22,
    category: "Kitchen",
    description: "A comfortable everyday mug with a soft matte glaze.",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
  },
];

const serverSnapshot = {
  products: initialProducts,
  isReady: false,
  error: null,
};

let snapshot = serverSnapshot;
const listeners = new Set();

function isProduct(product) {
  return (
    product !== null &&
    typeof product === "object" &&
    typeof product.id === "string" &&
    product.id.trim() !== "" &&
    typeof product.name === "string" &&
    product.name.trim() !== "" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    typeof product.category === "string" &&
    product.category.trim() !== "" &&
    typeof product.description === "string" &&
    typeof product.image === "string" &&
    product.image.trim() !== ""
  );
}

function notify() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}

function handleStorageChange(event) {
  if (event.key !== STORAGE_KEY && event.key !== null) {
    return;
  }

  if (event.newValue === null) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts));
      snapshot = { products: initialProducts, isReady: true, error: null };
    } catch (error) {
      console.error("Could not restore sample products in localStorage.", error);
      snapshot = {
        products: [],
        isReady: true,
        error: "Product storage is unavailable. Check your browser storage settings.",
      };
    }
    notify();
    return;
  }

  let products;
  try {
    products = JSON.parse(event.newValue);
  } catch (error) {
    console.error("Updated product data is not valid JSON.", error);
    snapshot = {
      products: [],
      isReady: true,
      error: "Saved product data is invalid. Clear the corrupted product data to continue.",
    };
    notify();
    return;
  }

  if (!Array.isArray(products) || !products.every(isProduct)) {
    console.error("Updated product data has an invalid format.");
    snapshot = {
      products: [],
      isReady: true,
      error: "Saved product data has an invalid format.",
    };
    notify();
    return;
  }

  snapshot = { products, isReady: true, error: null };
  notify();
}

function initializeProducts() {
  if (snapshot.isReady) {
    return;
  }

  try {
    const savedProducts = window.localStorage.getItem(STORAGE_KEY);
    if (savedProducts === null) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts));
      snapshot = { products: initialProducts, isReady: true, error: null };
      notify();
      return;
    }

    const parsedProducts = JSON.parse(savedProducts);
    if (!Array.isArray(parsedProducts) || !parsedProducts.every(isProduct)) {
      throw new Error("Saved product data has an invalid format.");
    }

    snapshot = { products: parsedProducts, isReady: true, error: null };
    notify();
  } catch (error) {
    console.error("Could not initialize products from localStorage.", error);
    snapshot = {
      products: [],
      isReady: true,
      error:
        error instanceof SyntaxError
          ? "Saved product data is invalid. Clear the corrupted product data to continue."
          : error instanceof Error && error.message === "Saved product data has an invalid format."
            ? error.message
            : "Product storage is unavailable. Check your browser storage settings.",
    };
    notify();
  }
}

function ensureClientReady() {
  if (typeof window === "undefined") {
    throw new Error("Product data can only be changed in the browser.");
  }
  initializeProducts();
  if (snapshot.error) {
    throw new Error(snapshot.error);
  }
}

function saveProducts(products) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  snapshot = { products, isReady: true, error: null };
  notify();
}

export function createProduct(productDetails) {
  ensureClientReady();
  const product = { ...productDetails, id: crypto.randomUUID() };

  if (!isProduct(product)) {
    throw new Error("A product must have valid name, price, category, description, and image fields.");
  }

  saveProducts([...snapshot.products, product]);
  return product;
}

export function updateProduct(id, updates) {
  ensureClientReady();
  const productIndex = snapshot.products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    throw new Error(`Could not update product "${id}" because it does not exist.`);
  }

  const updatedProduct = {
    ...snapshot.products[productIndex],
    ...updates,
    id,
  };
  if (!isProduct(updatedProduct)) {
    throw new Error("Updated product data is invalid.");
  }

  const products = [...snapshot.products];
  products[productIndex] = updatedProduct;
  saveProducts(products);
  return updatedProduct;
}

export function deleteProduct(id) {
  ensureClientReady();
  const products = snapshot.products.filter((product) => product.id !== id);

  if (products.length === snapshot.products.length) {
    throw new Error(`Could not delete product "${id}" because it does not exist.`);
  }

  saveProducts(products);
}

export function useProducts() {
  const currentSnapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    initializeProducts();
  }, []);

  return {
    products: currentSnapshot.products,
    isReady: currentSnapshot.isReady,
    error: currentSnapshot.error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
