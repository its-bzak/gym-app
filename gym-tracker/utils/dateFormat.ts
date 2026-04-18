export const getCurrentDate = () => {
 const date = new Date();
 const year = date.getFullYear();
 const month = `${date.getMonth() + 1}`.padStart(2, "0");
 const day = `${date.getDate()}`.padStart(2, "0");

 return `${year}-${month}-${day}`;
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseCalendarDate = (dateString: string) => {
 const dateOnlyMatch = DATE_ONLY_PATTERN.exec(dateString);

 if (dateOnlyMatch) {
  const [, year, month, day] = dateOnlyMatch;
  return new Date(Number(year), Number(month) - 1, Number(day));
 }

 return new Date(dateString);
};

export const formatDate = (dateString: string) => {
 const date = parseCalendarDate(dateString);

 if (Number.isNaN(date.getTime())) {
  return dateString;
 }

 const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
 return date.toLocaleDateString(undefined, options);
};