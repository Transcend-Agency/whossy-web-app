import { describe, expect, it } from "vitest";
import { isIOSDevice } from "./platform";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPADOS = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

describe("isIOSDevice", () => {
  it("an iPhone", () => expect(isIOSDevice(IPHONE, 5)).toBe(true));
  it("an iPad that reports itself as a Mac", () => expect(isIOSDevice(IPADOS, 5)).toBe(true));
  it("a Mac without a touch screen", () => expect(isIOSDevice(IPADOS, 0)).toBe(false));
  it("an Android phone", () => expect(isIOSDevice(ANDROID, 5)).toBe(false));
});
