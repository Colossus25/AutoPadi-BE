export const generateRandomNumber = (min = 999, max = 999999) => ~~(Math.random() * (max - min)) + min;

// export const generateRandomNumberString = (length = 6) => {
//   let result = '';
//   for (let i = 0; i < length; i++) {
//     result += Math.floor(Math.random() * 10).toString();
//   }
//   return result;
// };

export const generateNumericCode = (length = 6): string => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export function generateBatchNumber(prefix = 'BATCH'): string {
  const random = Math.floor(100000 + Math.random() * 900000); 
  const timestamp = new Date().getTime().toString().slice(-4);
  return `${prefix}-${timestamp}-${random}`;
}