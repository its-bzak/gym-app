export const getCurrentDate = () => {
 const date = new Date();
 const year = date.getFullYear();
 const month = `${date.getMonth() + 1}`.padStart(2, "0");
 const day = `${date.getDate()}`.padStart(2, "0");

 return `${year}-${month}-${day}`;
};

export const formatDate = (dateString: string) => {
 const date = new Date(dateString);
 const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
 return date.toLocaleDateString(undefined, options); // Format: Month Day, Year
}