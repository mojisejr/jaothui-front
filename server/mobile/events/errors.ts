export class EventError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "EventError";
  }
}
export function invalidFields(): never {
  throw new EventError(422, "INVALID_FIELDS", "กรุณาตรวจสอบข้อมูลให้ครบถ้วนและถูกต้อง");
}
