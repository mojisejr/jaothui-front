import dayjs from "dayjs";

export const parseThaiDate = (timestamp: number) => {
  if (timestamp <= 0)
    return {
      date: "N/A",
      thaiMonth: "N/A",
      thaiMonth2: "N/A",
      thaiYear: "N/A",
      thaiYear2: "N/A",
    };
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const thaiMonthsAbbreviated = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  // Convert UTC timestamp to Bangkok local time (UTC+7)
  // Database stores dates in UTC, but they represent local Thailand dates
  const utcDate = dayjs(timestamp);
  const bangkokDate = utcDate.subtract(7, "hours");

  const date = bangkokDate.get("date");
  const month = bangkokDate.get("month");
  const year = bangkokDate.get("year");
  const thaiMonth = thaiMonths[month];
  const thaiMonth2 = thaiMonthsAbbreviated[month];
  const thaiYear = year + 543;

  return {
    date,
    thaiMonth,
    thaiMonth2,
    thaiYear,
    thaiYear2: `${thaiYear.toString()[2]}${thaiYear.toString()[3]}`,
  };
};
