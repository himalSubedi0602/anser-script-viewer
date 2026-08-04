import { describe, expect, it } from "vitest";
import { parseXmlString } from "./xmlParser";
import { XmlParseError } from "./xmlParser.types";

describe("parseXmlString - invalid XML handling", () => {
  it("throws a typed XmlParseError for an unclosed tag", () => {
    expect(() => parseXmlString(`<Root><Child></Root>`)).toThrow(XmlParseError);
  });

  it("throws a typed XmlParseError for a mismatched closing tag", () => {
    expect(() => parseXmlString(`<Root></Wrong>`)).toThrow(XmlParseError);
  });

  it("throws a typed XmlParseError for non-XML input", () => {
    expect(() => parseXmlString(`this is not xml at all`)).toThrow(XmlParseError);
  });

  it("throws a typed XmlParseError for empty input", () => {
    expect(() => parseXmlString("")).toThrow(XmlParseError);
  });

  it("carries a non-empty, meaningful message rather than a generic failure", () => {
    try {
      parseXmlString(`<Root><Child></Root>`);
      throw new Error("expected parseXmlString to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(XmlParseError);
      expect((e as XmlParseError).message.length).toBeGreaterThan(0);
    }
  });
});
