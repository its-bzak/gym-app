export const getCurrentDate = () => {
 const date = new Date();
 const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; // Format: YYYY-MM-DD
 return formattedDate;
};
console.log(getCurrentDate()); // Example Output: "2023-10-10"

export const formatDate = (dateString: string) => {
 const date = new Date(dateString);
 const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
 return date.toLocaleDateString(undefined, options); // Format: Month Day, Year
}