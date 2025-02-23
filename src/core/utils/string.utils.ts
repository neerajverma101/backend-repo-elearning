export const PAN_VERIFICATION_REGEX = /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/;
export const GST_VERIFICATION_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/i;

export const SKU_VERIFICATION_REGEX = /^[a-zA-Z0-9.]+$/;

export const OTP_VERIFICATION_REGEX = /^\d{6}$/;

import * as _ from "lodash";
import { marked } from "marked";
import { BinaryToTextEncoding, createHmac, timingSafeEqual } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { UrlParser } from "./url-parser/url-parser";

const imageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".svg",
  ".webp",
];
const videoExtensions = [
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mkv",
  ".webm",
];

export class StringUtils {
  static isValidPhoneNumber(value: string, region?: string): boolean {
    const phoneRegex = /^[0-9]{10}$/;
    if (phoneRegex.test(value)) {
      return true;
    }
    return false;
  }

  static isValidGstinNumber(gstin: string): boolean {
    const isGstinValid =
      gstin && gstin.trim().length === 15 && GST_VERIFICATION_REGEX.test(gstin);

    return isGstinValid;
  }

  isValidGSTNumber(number: string) {
    return;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      return true;
    }
    return false;
  }

  jsonToKeyValueString(
    jsonData: Record<string, any>,
    prefix: string = "",
  ): string {
    return Object.keys(jsonData)
      .map((key) => {
        const value = jsonData[key];
        if (typeof value === "object" && value !== null) {
          return this.jsonToKeyValueString(value, `${prefix}${key}.`);
        } else {
          return `${prefix}${key}=${value}`;
        }
      })
      .join(";");
  }

  static generateOtp(): number {
    let otp = Math.floor(Math.random() * 900000 + 100000); // Random 6-digit number
    return otp;
  }

  /**
   * The `formatString` function in TypeScript takes a template string and replaces placeholders with
   * corresponding arguments.
   * @param {string} template - The `template` parameter is a string that contains placeholders in the
   * format `{0}`, `{1}`, `{2}`, and so on, which will be replaced by the corresponding arguments passed
   * to the `formatString` function.
   * @param {string[]} args - The `args` parameter in the `formatString` function is an array of strings
   * that represent the values to be inserted into the template string at the corresponding placeholders.
   * @returns The `formatString` function takes a template string and an array of arguments, replaces
   * placeholders in the template string with the corresponding arguments, and returns the formatted
   * string.
   */
  static format(template: string, ...args: string[]): string {
    return template.replace(/{([0-9]+)}/g, function (match, index) {
      return typeof args[index] === "undefined" ? match : args[index];
    });
  }

  /**
   * The function `isEmpty` in TypeScript checks if a value is empty by comparing it to null, undefined,
   * an empty string, an empty array, or an object with no keys.
   * @param {any} value - The `value` parameter can be of any type, as indicated by the `any` type
   * annotation in the function signature. It can be a primitive value (such as a string, number,
   * boolean, etc.), an array, an object, `null`, or `undefined`. The `isEmpty`
   * @returns The `isEmpty` function is returning a boolean value indicating whether the provided
   * `value` is considered empty.
   */
  static isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" && Object.keys(value).length === 0)
    );
  }

  static getUniqueString(): string {
    const uniqueId = uuidv4().replace(/-/g, "").substring(0, 5); // Extracting 5 characters from the UUID
    const timestamp = Date.now().toString().substring(0, 10); // Extracting first 10 characters from the timestamp (seconds)
    return StringUtils.format("{0}{1}", timestamp, uniqueId);
  }

  static splitString(stringToSplit: string, splitCharacter: string): string[] {
    return stringToSplit.split(splitCharacter);
  }

  static capitalize(input: string): string {
    return _.capitalize(input);
  }

  static getLastSplit(stringToSplit: string, splitCharacter: string): string {
    return stringToSplit.slice(
      stringToSplit.lastIndexOf(splitCharacter) + 1,
      stringToSplit.length,
    );
  }

  static extractVideoId(url: string): string {
    // i to ignore case sensitive matching
    const youtubeVideoRegExp = new RegExp(
      ".*(?:(?:youtu\\.be\\/|v\\/|vi\\/|u\\/\\w\\/|embed\\/)|(?:(?:watch)?\\?v(?:i)?=|\\&v(?:i)?=))([^#\\&\\?]*).*",
      "i",
    );

    const match = url.match(youtubeVideoRegExp);
    const videoId = match ? match[1] : null;

    return videoId;
  }

  static getVideoThumbnail(url: string): string {
    //TODO: Handled for youtube video to handle and add Video Types for Youtube | Dailymotion | GoogleDrive to be added from admin.
    if (url) {
      return (
        "https://i.ytimg.com/vi/" +
        url.slice(url.indexOf("embed/") + 6) +
        "/ib.jpg"
      );
    }

    return null;
  }

  static base64Decode(encoded: string): string {
    return Buffer.from(encoded, "base64").toString("binary");
  }

  static base64Encode(text: string): string {
    return Buffer.from(text, "binary").toString("base64");
  }

  static getFileTypeFromUrl(url: string): string | null {
    const urlObj = new UrlParser(url, false);
    const pathname = urlObj.getPathParams().toLowerCase();
    const urlExtension = pathname.split(".").pop() || "";

    if (imageExtensions.includes(`.${urlExtension}`)) {
      return;
    }

    if (videoExtensions.includes(`.${urlExtension}`)) {
      return;
    }

    return null;
  }

  static appendNextUrl(pageUri: string, redirectUrl: string): string {
    const url: UrlParser = new UrlParser(pageUri);
    const requestPath: string = url.getPathParams();
    const queryParams = url.getQueryParams().toString();
    let nextUrl;

    if (queryParams) {
      nextUrl = `${requestPath}?${queryParams}`;
    } else {
      nextUrl = `${requestPath}`;
    }

    return `${redirectUrl}?next=${nextUrl}`;
  }

  static markdownToHTML(content): string {
    const withBreaks = content.replace(/\n/g, "<br> \n");
    const withBold = withBreaks.replace(/\*\*(.*?)\*\*/gi, (match, content) => {
      return `<strong>${content}</strong>`;
    });

    return marked.parse(withBold) as string;
  }

  static checkRoutes = (routes: string[], path: string) =>
    routes.some((route) => path.includes(route));

  /**
   * Filters an array of GSTIN objects to exclude those where the 14th character of the gstin is 'C'.
   * @param {Array} gstinObject - The array of GSTIN objects.
   * @returns {Array} - The filtered array of GSTIN objects.
   */
  static filterGstinObjects(gstinObject) {
    return gstinObject.filter((gstinObject) => gstinObject.gstin[13] !== "C");
  }

  static updateBaseUrl(url: string): string {
    const urlObj = new URL(url);
    return url.replace(urlObj.origin, process.env.BASE_URL);
  }

  static generateHmac(
    payload: string,
    secret: string = process.env.HMAC_SECRET_KEY,
    encodingFormat: BinaryToTextEncoding = "hex",
  ) {
    return createHmac("sha256", secret).update(payload).digest(encodingFormat);
  }

  static verifyHmac(
    data: string,
    hmac: string,
    secret: string = process.env.HMAC_SECRET_KEY,
  ): boolean {
    const calculatedHmac: string = this.generateHmac(secret, data);
    return timingSafeEqual(Buffer.from(calculatedHmac), Buffer.from(hmac));
  }

}

export const DEFAULT_BRANCH_ID = { branchId: '66cb9b846b0566074b381f85' }

export const DEFAULT_TEACHER = { teacherId: '66d4184c19ae0021814112d7' }
