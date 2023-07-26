export const baseUrl =
  process.env.production == "DEV"
    ? process.env.NEXT_PUBLIC_backend_url_dev
    : process.env.NEXT_PUBLIC_backend_url_prod;
