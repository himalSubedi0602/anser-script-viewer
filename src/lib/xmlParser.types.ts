export interface XmlAttribute {
  name: string; // qualified name exactly as written, e.g. "environment" or "xsi:type"
  namespacePrefix?: string; // e.g. "xsi", absent for unprefixed attributes
  namespaceURI?: string; // resolved URI the prefix points to
  value: string;
}

export type XmlNode = XmlElementNode | XmlTextNode | XmlCommentNode | XmlCDataNode;

export interface XmlElementNode {
  kind: "element";
  name: string; // qualified name, e.g. "ScriptExport" or "xsi:type"
  namespacePrefix?: string;
  namespaceURI?: string;
  attributes: XmlAttribute[]; // in source order
  children: XmlNode[]; // in source order - elements, text, comments, cdata, mixed
}

export interface XmlTextNode {
  kind: "text";
  value: string;
}

export interface XmlCommentNode {
  kind: "comment";
  value: string;
}

export interface XmlCDataNode {
  kind: "cdata";
  value: string;
}

export class XmlParseError extends Error {
  readonly line?: number;
  readonly column?: number;

  constructor(message: string, line?: number, column?: number) {
    super(message);
    this.name = "XmlParseError";
    this.line = line;
    this.column = column;
  }
}
