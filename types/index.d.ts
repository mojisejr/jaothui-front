export {};

declare global {
  interface Window {
    product_detail: {
      showModal: () => void;
      hasAttribute: (name: string) => boolean;
    };
  }
}
