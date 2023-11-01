import Medusa, { Config } from "@medusajs/medusa-js";

const medusa = new Medusa({
  baseUrl: "http://localhost:9000",
  apiKey: process.env.MEDUSA_KEY as string,
} as Config);

export const getProductFromHandle = async (handle: string) => {
  try {
    const collection = await getCollectionFromHandle(handle);
    const { products } = await medusa.products.list({
      expand: "collection,variants",
    });

    const { variants } = await medusa.products.variants.list({
      expand: "prices",
    });

    const selectedProducts = products.filter(
      (product) => product.collection?.id == collection[0].id
    );

    const variantMappedProducts = selectedProducts.map((p) => {
      const mappedWithVariants = variants.filter((v) => v.product_id == p.id);
      return {
        ...p,
        variants: mappedWithVariants,
      };
    });

    return variantMappedProducts;
  } catch (error: any) {
    console.log(error);
    return [];
  }
};

export const getCollectionFromHandle = async (handle: string) => {
  try {
    const { collections } = await medusa.collections.list();
    const selectedCollection = collections.filter(
      (collection) => collection.handle == handle
    );

    return selectedCollection;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getProductById = async (id: string) => {
  try {
    const { product } = await medusa.products.retrieve(id);
    return product;
  } catch (error) {
    console.log(error);
  }
};

export const createOrGetCustomer = async (wallet: string, email: string) => {
  try {
    const { exists } = await medusa.auth.exists(email);
    if (exists) {
      console.log("Already has an account now login");
      const { customer } = await medusa.auth.authenticate({
        email,
        password: wallet.slice(25, 35),
      });
      return customer;
    } else {
      console.log("Has no customer, Now create one");
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
