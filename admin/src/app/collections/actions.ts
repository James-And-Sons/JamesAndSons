"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProductToCollection(
  categoryId: string,
  productId: string,
) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { categoryId },
    });
    revalidatePath("/collections");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeProductFromCollection(
  categoryId: string,
  productId: string,
) {
  try {
    // Find or create default Uncategorized category as fallback for mandatory categoryId relation
    let uncategorized = await prisma.category.findFirst({
      where: { OR: [{ slug: "uncategorized" }, { name: "Uncategorized" }] },
    });

    if (!uncategorized) {
      uncategorized = await prisma.category.create({
        data: {
          name: "Uncategorized",
          slug: "uncategorized",
          description: "Default category for unassigned products",
        },
      });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { categoryId: uncategorized.id },
    });

    revalidatePath("/collections");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
