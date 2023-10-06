import Medusa, { Config } from "@medusajs/medusa-js";

const medusa = new Medusa({
  apiKey: process.env.MEDUSA_KEY as string,
} as Config);

export const createOrGetCustomer = async (wallet: string, email: string) => {
  try {
    const { exists } = await medusa.auth.exists(email);
    if (exists) {
      console.log("already has an account now login");
      const { customer } = await medusa.auth.authenticate({
        email,
        password: wallet.slice(25, 35),
      });
      return customer;
    } else {
      console.log("has no customer now create one");
      await medusa.customers.create({
        email,
        first_name: wallet,
        last_name: wallet,
        password: wallet.slice(25, 35),
      });

      const { customer } = await medusa.auth.authenticate({
        email,
        password: wallet.slice(25, 35),
      });
      return customer;
    }
  } catch (error: any) {
    console.log(error.message);
  }
};
