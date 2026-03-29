export const getCurrentDate = () => {
 const date = new Date();
 const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; // Format: YYYY-MM-DD
 return formattedDate;
};
console.log(getCurrentDate()); // Example Output: "2023-10-10"