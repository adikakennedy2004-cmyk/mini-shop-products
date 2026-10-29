"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "mini-shop-cart";
const serverSnapshot = { items: [], isReady: false };
let snapshot = serverSnapshot;
const listeners = new Set();

function isCartItem(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.productId === "string" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
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

function updateSnapshot(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  snapshot = { items, isReady: true };
  notify();
}

function readStorage(value) {
  if (value === null) {
    return [];
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
    throw new Error("Saved cart data has an invalid format.");
  }
  return parsed;
}

function handleStorageChange(event) {
  if (event.key !== STORAGE_KEY && event.key !== null) {
    return;
  }

  try {
    snapshot = {
      items: readStorage(event.newValue),
      isReady: true,
    };
    notify();
  } catch (error) {
    console.error("Could not sync saved cart data.", error);
  }
}

function initializeCart() {
  if (snapshot.isReady) {
    return;
  }

  try {
    const savedItems = readStorage(window.localStorage.getItem(STORAGE_KEY));
    snapshot = { items: savedItems, isReady: true };
    if (window.localStorage.getItem(STORAGE_KEY) === null) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
    }
    notify();
  } catch (error) {
    console.error("Could not load cart from localStorage.", error);
    throw new Error("Could not load the saved cart.");
  }
}

export function addToCart(productId) {
  initializeCart();
  const existingItem = snapshot.items.find(
    (item) => item.productId === productId,
  );

  const items = existingItem
    ? snapshot.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      )
    : [...snapshot.items, { productId, quantity: 1 }];

  updateSnapshot(items);
}

export function setCartQuantity(productId, quantity) {
  initializeCart();
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Cart quantity must be a non-negative whole number.");
  }

  const items =
    quantity === 0
      ? snapshot.items.filter((item) => item.productId !== productId)
      : snapshot.items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        );
  updateSnapshot(items);
}

export function removeFromCart(productId) {
  initializeCart();
  updateSnapshot(
    snapshot.items.filter((item) => item.productId !== productId),
  );
}

export function useCart() {
  const currentSnapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    initializeCart();
  }, []);

  return {
    items: currentSnapshot.items,
    isReady: currentSnapshot.isReady,
    addToCart,
    setCartQuantity,
    removeFromCart,
  };
}
