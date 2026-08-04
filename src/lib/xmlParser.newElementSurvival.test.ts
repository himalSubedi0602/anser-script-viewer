import { describe, expect, it } from "vitest";
import { parseXmlString } from "./xmlParser";
import { asElement, elementChildren, readFixtureXml } from "./xmlParser.testHelpers";

// The mandated test: prove that an element and attribute which do not exist in the
// supplied fixture survive XML-to-JSON conversion, including their name, value,
// parent-child relationship, and sibling order - without any change to the parser.
//
// Per the fixture-protection rules, the file on disk is only ever read here. The
// "new" XML is produced by splicing a string into an in-memory copy of its contents.

const NEW_ELEMENT_NAME = "TelemetryBeacon";
const NEW_ATTRIBUTE_NAME = "signalStrength";
const NEW_ATTRIBUTE_VALUE = "87";
const NEW_ELEMENT_TEXT = "Injected for the mandated survival test";

describe("parseXmlString - mandated new element/attribute survival test", () => {
  const originalXml = readFixtureXml();

  it("confirms the new element and attribute genuinely do not exist in the supplied fixture", () => {
    expect(originalXml).not.toContain(NEW_ELEMENT_NAME);
    expect(originalXml).not.toContain(NEW_ATTRIBUTE_NAME);
  });

  it("proves a brand-new element and attribute survive conversion with relationship and order intact", () => {
    // Splice the new element in, between the real <Source> and <Developers> siblings.
    const anchor = "<Developers>";
    expect(originalXml.split(anchor)).toHaveLength(2); // anchor must be unique to splice safely

    const injected = `<${NEW_ELEMENT_NAME} ${NEW_ATTRIBUTE_NAME}="${NEW_ATTRIBUTE_VALUE}">${NEW_ELEMENT_TEXT}</${NEW_ELEMENT_NAME}>\n\n  `;
    const modifiedXml = originalXml.replace(anchor, injected + anchor);

    const originalRoot = asElement(parseXmlString(originalXml));
    const modifiedRoot = asElement(parseXmlString(modifiedXml));

    const originalSiblings = elementChildren(originalRoot);
    const modifiedSiblings = elementChildren(modifiedRoot);

    // Nothing else in the tree was disturbed - exactly one new element child appeared.
    expect(modifiedSiblings).toHaveLength(originalSiblings.length + 1);

    const newIndex = modifiedSiblings.findIndex((c) => c.name === NEW_ELEMENT_NAME);
    expect(newIndex).toBeGreaterThanOrEqual(0);
    const newNode = modifiedSiblings[newIndex];

    // New element name survives.
    expect(newNode.name).toBe(NEW_ELEMENT_NAME);

    // New attribute name and value survive.
    expect(newNode.attributes).toEqual([
      {
        name: NEW_ATTRIBUTE_NAME,
        value: NEW_ATTRIBUTE_VALUE,
        namespacePrefix: undefined,
        namespaceURI: undefined,
      },
    ]);

    // Parent-child relationship survives: the new element's own text child.
    expect(newNode.children).toEqual([{ kind: "text", value: NEW_ELEMENT_TEXT }]);

    // Sibling order survives: correct real neighbors on both sides of the insertion point.
    expect(modifiedSiblings[newIndex - 1]?.name).toBe("Source");
    expect(modifiedSiblings[newIndex + 1]?.name).toBe("Developers");

    // Every other real sibling, in order, is unchanged by the injection.
    const modifiedWithoutNew = modifiedSiblings.filter((_, i) => i !== newIndex);
    expect(modifiedWithoutNew.map((c) => c.name)).toEqual(originalSiblings.map((c) => c.name));
  });
});
