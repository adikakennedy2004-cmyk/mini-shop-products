"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  addToCart,
  removeFromCart,
  setCartQuantity,
  useCart,
} from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";

export default function Home() {
  const { products, isReady, error: productsError } = useProducts();
  const {
    items: cartItems,
    isReady: isCartReady,
  } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    if (!cartOpen) {
      return;
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setCartOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  const cartContents = useMemo(
    () =>
      cartItems
        .map((item) => ({
          ...item,
          product: products.find((product) => product.id === item.productId),
        }))
        .filter((item) => item.product),
    [cartItems, products],
  );
  const cartCount = cartContents.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartContents.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  function handleAddToCart(product) {
    setCartError("");
    try {
      addToCart(product.id);
      setRecentlyAddedId(product.id);
      window.setTimeout(() => setRecentlyAddedId(null), 1200);
    } catch (error) {
      setCartError(
        error instanceof Error ? error.message : "Could not add this item.",
      );
    }
  }

  function updateQuantity(productId, quantity) {
    setCartError("");
    try {
      setCartQuantity(productId, quantity);
    } catch (error) {
      setCartError(
        error instanceof Error ? error.message : "Could not update your cart.",
      );
    }
  }

  function removeItem(productId) {
    setCartError("");
    try {
      removeFromCart(productId);
    } catch (error) {
      setCartError(
        error instanceof Error ? error.message : "Could not remove this item.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="text-sm font-semibold tracking-wide text-zinc-900"
          >
            MINI SHOP
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="rounded-full px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 sm:px-4"
            >
              Admin Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping cart, ${cartCount} items`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="19" r="1.25" fill="currentColor" />
                <circle cx="18" cy="19" r="1.25" fill="currentColor" />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-9">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
            Curated for everyday
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            The collection
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
            Thoughtful finds for home and wherever the day takes you.
          </p>
        </div>

        {!isReady ? (
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="status"
            aria-label="Loading products"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] bg-zinc-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-zinc-200" />
                  <div className="h-5 w-20 rounded-full bg-zinc-200" />
                  <div className="h-3 w-full rounded bg-zinc-100" />
                  <div className="h-3 w-4/5 rounded bg-zinc-100" />
                  <div className="h-10 rounded-full bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div
            className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-12 text-center"
            role="alert"
          >
            <h2 className="text-lg font-medium text-amber-950">
              Products could not be loaded
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-amber-800">
              {productsError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-medium text-zinc-900">
              No products available yet.
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Add some in the Admin Dashboard!
            </p>
            <Link
              href="/admin"
              className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Open Admin Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 transition-colors group-hover:bg-zinc-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-zinc-900">
                      {product.name}
                    </h2>
                    <p className="shrink-0 font-medium text-zinc-900">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                    {product.category}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {product.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={!isCartReady}
                    className="mt-5 w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {recentlyAddedId === product.id ? "Added to cart" : "Add to cart"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {cartError && (
          <p
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {cartError}
          </p>
        )}
      </section>

      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close shopping cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-zinc-950/40 backdrop-blur-[1px] transition-opacity"
          />
          <aside
            aria-label="Shopping cart"
            aria-modal="true"
            role="dialog"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl motion-safe:animate-[cart-slide-in_200ms_ease-out]"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">
                  Your cart
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close shopping cart"
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <span aria-hidden="true" className="text-2xl leading-none">×</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {!isCartReady ? (
                <div className="animate-pulse py-16 text-center text-sm text-zinc-500" role="status">
                  Loading your cart...
                </div>
              ) : cartContents.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                      <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10" cy="19" r="1.25" fill="currentColor" />
                      <circle cx="18" cy="19" r="1.25" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="mt-4 font-medium text-zinc-900">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Add something you love to get started.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {cartContents.map(({ product, quantity }) => (
                    <li key={product.id} className="flex gap-4 py-5 first:pt-0">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-medium text-zinc-900">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-xs text-zinc-500">
                              {product.category}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-zinc-900">
                            ${(product.price * quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-zinc-200">
                            <button
                              type="button"
                              aria-label={`Decrease ${product.name} quantity`}
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-l-full text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-400"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center text-xs font-medium text-zinc-800">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${product.name} quantity`}
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-r-full text-zinc-700 transition hover:bg-zinc-100"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            className="text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition hover:text-red-700 hover:decoration-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {cartError && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {cartError}
                </p>
              )}
            </div>

            {cartContents.length > 0 && (
              <div className="border-t border-zinc-200 bg-white px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Subtotal</span>
                  <span className="text-lg font-semibold text-zinc-950">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Shipping and taxes calculated at checkout.
                </p>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-4 w-full rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
