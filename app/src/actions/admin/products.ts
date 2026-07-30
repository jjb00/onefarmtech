/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {baselineProducts} from "@/lib/productCatalogue";
import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {readText, readNumber} from "./shared";

export async function createProductAction(formData: FormData) {
  await requireCapability("manage_products");
  const name = readText(formData, "name");
  const category = readText(formData, "category", "Fresh produce");
  const unit = readText(formData, "unit", "kg");
  const grade = readText(formData, "grade", "Standard");
  const basePrice = readNumber(formData, "basePrice");
  const availability = readText(formData, "availability", "Available");
  const status = readText(formData, "status", "Active");
  const stockType = readText(formData, "stockType", "Fresh sourced");

  if (!name) {
    throw new Error("Product name is required.");
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      unit,
      grade,
      basePrice,
      availability,
      status,
      stockType,
    },
  });

  await createAuditLog({
    action: "Created product",
    entityType: "Product",
    entityId: product.id,
    entityLabel: product.name,
    newValue: product,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/audit-log");
  redirect("/admin/products");
}
export async function seedBaselineProductsAction() {
  await requireCapability("manage_products");
  const createdProducts = [];
  const skippedProducts = [];

  for (const product of baselineProducts) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: product.name,
        category: product.category,
        grade: product.grade,
      },
    });

    if (existingProduct) {
      skippedProducts.push(existingProduct);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: product,
    });

    createdProducts.push(createdProduct);
  }

  await createAuditLog({
    action: "Seeded baseline product catalogue",
    entityType: "Product",
    entityLabel: "Baseline catalogue",
    newValue: {
      created: createdProducts.length,
      skipped: skippedProducts.length,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/create-order");
  revalidatePath("/admin/audit-log");
  redirect("/admin/products");
}
export async function updateProductCatalogueStatusAction(formData: FormData) {
  await requireCapability("manage_products");
  const productId = readText(formData, "productId");
  const name = readText(formData, "name");
  const category = readText(formData, "category", "Fresh produce");
  const unit = readText(formData, "unit", "kg");
  const grade = readText(formData, "grade", "Standard");
  const basePrice = readNumber(formData, "basePrice");
  const availability = readText(formData, "availability", "Available");
  const status = readText(formData, "status", "Active");

  if (!productId) {
    throw new Error("Product ID is required.");
  }

  if (!name) {
    throw new Error("Product name is required.");
  }

  const previousProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  const product = await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      name,
      category,
      unit,
      grade,
      basePrice,
      availability,
      status,
    },
  });

  await createAuditLog({
    action: "Updated product catalogue",
    entityType: "Product",
    entityId: product.id,
    entityLabel: product.name,
    previousValue: previousProduct,
    newValue: product,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/create-order");
  revalidatePath("/admin/group-buys");
  revalidatePath("/admin/audit-log");
  redirect("/admin/products");
}
export async function updateProductDetailsAction(formData: FormData) {
  await requireCapability("manage_products");
  const {revalidatePath} = await import("next/cache");
  const {prisma} = await import("@/lib/prisma");

  const productId = String(formData.get("productId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const grade = String(formData.get("grade") || "").trim();
  const basePrice = Number(formData.get("basePrice") || 0);
  const availability = String(formData.get("availability") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const stockType = String(formData.get("stockType") || "").trim();

  if (!productId || !name || !category || !unit || !grade || !Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error("Product, category, unit, grade and valid price are required.");
  }

  await prisma.product.update({
    where: {id: productId},
    data: {
      name,
      category,
      unit,
      grade,
      basePrice: Math.round(basePrice),
      availability: availability || "Available",
      status: status || "Active",
      stockType: stockType || "Fresh sourced",
    },
  });

  revalidatePath("/admin/products");
}
export async function createSupplierAction(formData: FormData) {
  await requireCapability("manage_suppliers");
  const name = readText(formData, "name");
  const type = readText(formData, "type", "Farm / supply partner");
  const phone = readText(formData, "phone");
  const location = readText(formData, "location");
  const produceFocus = readText(formData, "produceFocus");
  const reliability = readText(formData, "reliability", "Unrated");
  const paymentMethod = readText(formData, "paymentMethod", "Bank transfer");
  const status = readText(formData, "status", "Active");

  if (!name || !location || !produceFocus) {
    throw new Error("Supplier name, location, and produce focus are required.");
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      type,
      phone: phone || null,
      location,
      produceFocus,
      reliability,
      paymentMethod,
      status,
    },
  });

  await createAuditLog({
    action: "Created supplier",
    entityType: "Supplier",
    entityId: supplier.id,
    entityLabel: supplier.name,
    newValue: supplier,
  });

  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/audit-log");
  redirect("/admin/suppliers");
}
