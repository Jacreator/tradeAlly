import { customAlphabet } from "nanoid";

export const generateRandomString = async (strength: number) => {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength);
  return await nanoid().toUpperCase();
}