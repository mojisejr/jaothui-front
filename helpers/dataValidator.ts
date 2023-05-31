export function isEmpty(input: any | any[]): boolean {
  if (Array.isArray(input)) {
    return (
      input.length <= 0 ||
      input[0] == null ||
      input == undefined ||
      input[0] == undefined
    );
  } else {
    return input == undefined || input == null || input == " " || input == "";
  }
}
