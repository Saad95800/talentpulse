"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Valide un coupon et retourne sa valeur et son type.
 */
export async function validateCouponAction(code: string) {
  if (!code) return { success: false, error: "Code manquant." };

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { 
        code: code.trim().toUpperCase(),
        isActive: true 
      }
    });

    if (!coupon) {
      return { success: false, error: "Code promo invalide ou expiré." };
    }

    return { 
      success: true, 
      coupon: {
        code: coupon.code,
        value: coupon.value,
        type: coupon.type
      }
    };
  } catch (error) {
    console.error("❌ [CouponAction] Erreur validation:", error);
    return { success: false, error: "Erreur technique lors de la validation." };
  }
}

/**
 * Liste tous les coupons (pour l'admin).
 */
export async function getCouponsAction() {
  try {
    return await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("❌ [CouponAction] Erreur getCoupons:", error);
    return [];
  }
}

/**
 * Ajoute un nouveau coupon.
 */
export async function addCouponAction(data: { code: string, value: number, type: string }) {
  try {
    const newCoupon = await prisma.coupon.create({
      data: {
        code: data.code.trim().toUpperCase(),
        value: data.value,
        type: data.type,
        isActive: true
      }
    });
    revalidatePath("/admin-talent-scraper/dashboard");
    return { success: true, coupon: newCoupon };
  } catch (error) {
    console.error("❌ [CouponAction] Erreur addCoupon:", error);
    return { success: false, error: "Impossible d'ajouter le coupon (le code existe peut-être déjà)." };
  }
}

/**
 * Supprime un coupon.
 */
export async function deleteCouponAction(id: string) {
  try {
    await prisma.coupon.delete({
      where: { id }
    });
    revalidatePath("/admin-talent-scraper/dashboard");
    return { success: true };
  } catch (error) {
    console.error("❌ [CouponAction] Erreur deleteCoupon:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
