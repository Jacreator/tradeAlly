import { customAlphabet } from "nanoid";

export const generateRandomString = async (strength: number) => {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength);
  return await nanoid().toUpperCase();
}

export const randomDate = async () => {
  // Define the start and end dates
  const startDate = new Date('2021-01-01');
  const endDate = new Date('2023-09-01');

  const timeDifference = endDate.getTime() - startDate.getTime();
  const randomTime = Math.random() * timeDifference;

  return new Date(startDate.getTime() + randomTime);
}