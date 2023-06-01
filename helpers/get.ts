import axios from "axios";
export const get = (url: string) =>
  axios.get(url).then((response) => response.data);
