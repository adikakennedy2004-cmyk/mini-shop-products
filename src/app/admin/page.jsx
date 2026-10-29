"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  deleteProduct,
  updateProduct,
  useProducts,
  createProduct,
} from "../../hooks/useProducts";

const emptyForm = {
  name: "",
  price: "",
  category: "",
  imageUrl: "",
  uploadedImage: "",
  description: "",
};

const maxImageSize = 1.5 * 1024 * 1024;
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const inputClassName =
  "mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

export default function AdminPage() {
  const { products, isReady } = useProducts();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function editItem(product) {
    const isDataUrl = product.image.startsWith("data:image/");
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      imageUrl: isDataUrl ? "" : product.image,
      uploadedImage: isDataUrl ? product.image : "",
      description: product.description,
    });
    setEditingId(product.id);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageSelection(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    if (!acceptedImageTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > maxImageSize) {
      setError("Choose an image smaller than 1.5 MB to fit browser storage.");
      event.target.value = "";
      return;
    }

    setIsReadingImage(true);
    try {
      const uploadedImage = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read the selected image."));
        reader.readAsDataURL(file);
      });
      if (typeof uploadedImage !== "string" || !uploadedImage.startsWith("data:image/")) {
        throw new Error("The selected file could not be converted to an image.");
      }

      setForm((current) => ({
        ...current,
        imageUrl: "",
        uploadedImage,
      }));
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "Could not read the selected image.",
      );
      event.target.value = "";
    } finally {
      setIsReadingImage(false);
    }
  }

  function handleImageUrlChange(event) {
    setForm((current) => ({
      ...current,
      imageUrl: event.target.value,
      uploadedImage: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearUploadedImage() {
    setForm((current) => ({ ...current, uploadedImage: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const image = form.uploadedImage || form.imageUrl.trim();
    if (!image) {
      setError("Upload an image or provide an image URL.");
      return;
    }
    if (!form.uploadedImage) {
      try {
        const imageUrl = new URL(image);
        if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
          throw new Error("Unsupported image URL protocol.");
        }
      } catch {
        setError("Enter a valid HTTP or HTTPS image URL.");
        return;
      }
    }

    const productDetails = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      image,
      description: form.description.trim(),
    };

    setIsSaving(true);
    try {
      if (editingId) {
        updateProduct(editingId, productDetails);
      } else {
        createProduct(productDetails);
      }
      resetForm();
    } catch (submitError) {
      setError(
        submitError?.name === "QuotaExceededError"
          ? "Browser storage is full. Remove products or use smaller image files."
          : submitError instanceof Error
            ? submitError.message
            : "Could not save this product.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(product) {
    setError("");
    try {
      deleteProduct(product.id);
      if (editingId === product.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this product.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-900">
            MINI SHOP
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            View storefront
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <p className="text-sm font-medium text-zinc-500">SHOP MANAGEMENT</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Inventory
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Add products, update details, and keep your catalog up to date.
          </p>
        </div>

        <section
          aria-labelledby="product-form-title"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-6">
            <h2
              id="product-form-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {editingId ? "Edit mode" : "Add a product"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {editingId
                ? "Update the fields below and save your changes."
                : "Fill in the product details to add it to your inventory."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-zinc-700">
                Name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Product name"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-zinc-700">
                Price
                <span className="relative mt-2 block">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-zinc-500">
                    $
                  </span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    placeholder="0.00"
                    className={`${inputClassName} mt-0 pl-8`}
                  />
                </span>
              </label>

              <label className="text-sm font-medium text-zinc-700">
                Category
                <input
                  required
                  name="category"
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  placeholder="e.g. Home"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-zinc-700">
                Image URL
                <input
                  type="url"
                  name="image"
                  value={form.imageUrl}
                  onChange={handleImageUrlChange}
                  disabled={Boolean(form.uploadedImage)}
                  placeholder="https://example.com/image.jpg"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-zinc-700">
                Or upload an image
                <input
                  ref={fileInputRef}
                  type="file"
                  name="imageFile"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelection}
                  className={`${inputClassName} file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700`}
                />
                <span className="mt-1 block text-xs font-normal text-zinc-500">
                  JPEG, PNG, WebP, or GIF · up to 1.5 MB
                </span>
              </label>

              {(form.uploadedImage || form.imageUrl) && (
                <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:col-span-2">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                    <Image
                      src={form.uploadedImage || form.imageUrl}
                      alt="Product image preview"
                      fill
                      unoptimized
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800">
                      Image preview
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {form.uploadedImage ? "Uploaded image" : form.imageUrl}
                    </p>
                  </div>
                  {form.uploadedImage && (
                    <button
                      type="button"
                      onClick={clearUploadedImage}
                      className="rounded-full px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              <label className="text-sm font-medium text-zinc-700 sm:col-span-2">
                Description
                <textarea
                  required
                  rows={3}
                  name="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe this product"
                  className={`${inputClassName} resize-y`}
                />
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isReadingImage || isSaving}
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReadingImage
                  ? "Reading image..."
                  : isSaving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Save"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section
          aria-labelledby="inventory-title"
          className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-7">
            <div>
              <h2
                id="inventory-title"
                className="font-semibold text-zinc-900"
              >
                Showroom
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {isReady ? `${products.length} products` : "Loading inventory..."}
              </p>
            </div>
          </div>

          {!isReady ? (
            <div className="animate-pulse px-6 py-14 text-center text-sm text-zinc-500" role="status">
              Loading saved products...
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium text-zinc-800">No products yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add a product using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-6 py-4">
                        <div className="flex max-w-md items-center gap-4">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-100">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">
                              {product.name}
                            </p>
                            <p className="mt-1 truncate text-xs text-zinc-500">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-zinc-800">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editItem(product)}
                            className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="rounded-full border border-red-100 px-4 py-2 text-xs font-medium text-red-700 transition hover:border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
