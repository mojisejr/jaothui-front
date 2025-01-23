import dayjs from "dayjs";

export const calculateBuffaloAge = (birthdate: string | number) => {
  const start = dayjs(birthdate);
  const end = dayjs(new Date());
  let diff = end.diff(start, "month");
  const remainderDays = end.diff(start.add(diff, "month"), "day");

  if (remainderDays > 0) {
    diff += 1;
  }

  return diff;
};
