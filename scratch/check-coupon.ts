import prisma from "./src/lib/prisma";

async function checkCoupon() {
  const coupon = await prisma.coupon.findUnique({
    where: { code: 'ONE' }
  });
  console.log("Coupon ONE:", coupon);
}

checkCoupon().catch(console.error);
