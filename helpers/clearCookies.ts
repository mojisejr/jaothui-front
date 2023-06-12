import { deleteCookie } from "cookies-next";

export function deleteCookies() {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  deleteCookie("wallet");
}
