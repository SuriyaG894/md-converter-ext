/**
 * Custom lightweight DOCX Generator
 * Converts HTML content to a .docx file using JSZip for packaging.
 * Generates WordprocessingML (Open XML) directly from the DOM.
 */

var DOCXGenerator = (function () {
  "use strict";

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function genContentTypes() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
    '</Types>';
  }

  function genRels() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
    '</Relationships>';
  }

  function genDocumentRels() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';
  }

  function genCoreProps() {
    var now = new Date().toISOString();
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"' +
    ' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"' +
    ' xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<dc:creator>MD Converter</dc:creator>' +
    '<cp:lastModifiedBy>MD Converter</cp:lastModifiedBy>' +
    '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
    '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified>' +
    '</cp:coreProperties>';
  }

  function genAppProps() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"' +
    ' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
    '<Application>MD to Word/PDF Converter</Application>' +
    '<DocSecurity>0</DocSecurity>' +
    '<ScaleCrop>false</ScaleCrop>' +
    '<LinksUpToDate>false</LinksUpToDate>' +
    '<SharedDoc>false</SharedDoc>' +
    '<HyperlinksChanged>false</HyperlinksChanged>' +
    '<AppVersion>16.0000</AppVersion>' +
    '</Properties>';
  }

  function genStyles() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"' +
    ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"' +
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"' +
    ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14">' +
    '<w:docDefaults><w:rPrDefault><w:rPr>' +
    '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Times New Roman"/>' +
    '<w:sz w:val="22"/><w:szCs w:val="22"/>' +
    '<w:lang w:val="en-US" w:eastAsia="en-US"/>' +
    '</w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr>' +
    '<w:spacing w:after="200" w:line="276" w:lineRule="auto"/>' +
    '</w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:styleId="Normal" w:default="1">' +
    '<w:name w:val="Normal"/>' +
    '<w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading1">' +
    '<w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>' +
    '<w:next w:val="Normal"/>' +
    '<w:rPr><w:b/><w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading2">' +
    '<w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>' +
    '<w:next w:val="Normal"/>' +
    '<w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading3">' +
    '<w:name w:val="heading 3"/><w:basedOn w:val="Normal"/>' +
    '<w:next w:val="Normal"/>' +
    '<w:rPr><w:b/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading4">' +
    '<w:name w:val="heading 4"/><w:basedOn w:val="Normal"/>' +
    '<w:next w:val="Normal"/>' +
    '<w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>' +
    '<w:style w:type="character" w:styleId="Hyperlink">' +
    '<w:name w:val="Hyperlink"/>' +
    '<w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>' +
    '</w:styles>';
  }
  function getInlineContent(el) {
    var content = "";
    for (var i = 0; i < el.childNodes.length; i++) {
      var child = el.childNodes[i];
      if (child.nodeType === 3) {
        var text = child.textContent;
        if (text.trim().length > 0) {
          content += "<w:r><w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/>" +
            "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr>" +
            "<w:t xml:space=\"preserve\">" + escapeXml(text) + "</w:t></w:r>";
        }
      } else if (child.nodeType === 1) {
        var tag = child.tagName.toLowerCase();
        var innerText = child.textContent || "";
        switch (tag) {
          case "strong": case "b":
            content += "<w:r><w:rPr><w:b/><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/>" +
              "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr>" +
              "<w:t xml:space=\"preserve\">" + escapeXml(innerText) + "</w:t></w:r>";
            break;
          case "em": case "i":
            content += "<w:r><w:rPr><w:i/><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/>" +
              "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr>" +
              "<w:t xml:space=\"preserve\">" + escapeXml(innerText) + "</w:t></w:r>";
            break;
          case "code":
            content += "<w:r><w:rPr><w:rFonts w:ascii=\"Consolas\" w:hAnsi=\"Consolas\"/>" +
              "<w:sz w:val=\"20\"/><w:szCs w:val=\"20\"/><w:color w:val=\"E01E5A\"/>" +
              "<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F6F8FA\"/></w:rPr>" +
              "<w:t xml:space=\"preserve\">" + escapeXml(innerText) + "</w:t></w:r>";
            break;
          case "a":
            var href = child.getAttribute("href") || "";
            content += "<w:r><w:rPr><w:rStyle w:val=\"Hyperlink\"/>" +
              "<w:color w:val=\"0563C1\"/><w:u w:val=\"single\"/></w:rPr>" +
              "<w:t xml:space=\"preserve\">" + escapeXml(innerText) + "</w:t></w:r>";
            break;
          case "br":
            content += "<w:r><w:br/></w:r>";
            break;
          case "img":
            content += "<w:r><w:rPr><w:sz w:val=\"20\"/><w:szCs w:val=\"20\"/></w:rPr>" +
              "<w:t xml:space=\"preserve\">[Image: " + escapeXml(child.getAttribute("alt") || "") + "]</w:t></w:r>";
            break;
          default:
            if (innerText.trim().length > 0) {
              content += "<w:r><w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/>" +
                "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr>" +
                "<w:t xml:space=\"preserve\">" + escapeXml(innerText) + "</w:t></w:r>";
            }
        }
      }
    }
    return content;
  }

  function processNode(node, counters) {
    if (!node) return "";
    if (node.nodeType === 3) {
      var text = node.textContent;
      if (!text.trim()) return "";
      return "<w:r><w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/>" +
        "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr>" +
        "<w:t xml:space=\"preserve\">" + escapeXml(text) + "</w:t></w:r>";
    }
    if (node.nodeType !== 1) return "";

    var tagName = node.tagName ? node.tagName.toLowerCase() : "";
    var el = node;

    switch (tagName) {
      case "h1": return genHeading(el, "Heading1");
      case "h2": return genHeading(el, "Heading2");
      case "h3": return genHeading(el, "Heading3");
      case "h4": return genHeading(el, "Heading4");
      case "p":  return genParagraph(el);
      case "blockquote": return genBlockquote(el);
      case "pre": return genCodeBlock(el);
      case "ul": return genList(el, "ul");
      case "ol": return genList(el, "ol");
      case "li": return genListItem(el);
      case "hr": return genHorizontalRule();
      case "table": return genTable(el);
      case "div":
        var content = "";
        for (var i = 0; i < el.childNodes.length; i++) {
          content += processNode(el.childNodes[i], counters);
        }
        return content;
      case "body":
        var bodyContent = "";
        for (var i = 0; i < el.childNodes.length; i++) {
          bodyContent += processNode(el.childNodes[i], counters);
        }
        return bodyContent;
      default:
        var defText = el.textContent || "";
        if (defText.trim()) {
          return "<w:r><w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/>" +
            "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr>" +
            "<w:t xml:space=\"preserve\">" + escapeXml(defText) + "</w:t></w:r>";
        }
        return "";
    }
  }
  function genHeading(el, styleId) {
    var children = getInlineContent(el);
    return "<w:p><w:pPr><w:pStyle w:val=\"" + styleId + "\"/>" +
      "<w:spacing w:before=\"240\" w:after=\"120\"/></w:pPr>" + children + "</w:p>";
  }

  function genParagraph(el) {
    var children = getInlineContent(el);
    var align = el.style ? el.style.textAlign : null;
    var alignAttr = align ? " <w:jc w:val=\"" + align + "\"/>" : "";
    return "<w:p><w:pPr><w:spacing w:after=\"120\" w:line=\"276\" w:lineRule=\"auto\"/>" +
      alignAttr + "</w:pPr>" + children + "</w:p>";
  }

  function genBlockquote(el) {
    var children = getInlineContent(el);
    return "<w:p><w:pPr><w:ind w:left=\"720\" w:right=\"720\"/>" +
      "<w:spacing w:after=\"120\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr>" +
      children + "</w:p>";
  }

  function genCodeBlock(el) {
    var text = el.textContent || "";
    var lines = text.split("\n");
    var lineRuns = "";
    for (var i = 0; i < lines.length; i++) {
      lineRuns += "<w:r><w:rPr><w:rFonts w:ascii=\"Consolas\" w:hAnsi=\"Consolas\" w:cs=\"Consolas\"/>" +
        "<w:sz w:val=\"18\"/><w:szCs w:val=\"18\"/><w:color w:val=\"1F1F1F\"/></w:rPr>" +
        "<w:t xml:space=\"preserve\">" + escapeXml(lines[i]) + "</w:t></w:r>";
    }
    return "<w:p><w:pPr><w:spacing w:before=\"120\" w:after=\"120\" w:line=\"240\" w:lineRule=\"auto\"/>" +
      "<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F6F8FA\"/><w:ind w:left=\"240\"/></w:pPr>" +
      lineRuns + "</w:p>";
  }

  function genList(el, type) {
    var items = "";
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      if (child.tagName && child.tagName.toLowerCase() === "li") {
        child._listInfo = { type: type, index: i };
        items += genListItem(child);
      }
    }
    return items;
  }

  function genListItem(el) {
    var info = el._listInfo || { type: "ul", index: 0 };
    var isOrdered = info.type === "ol";
    var children = getInlineContent(el);
    var bullet = isOrdered ? (info.index + 1) + "." : "\u2022";
    return "<w:p><w:pPr><w:ind w:left=\"720\" w:hanging=\"360\"/>" +
      "<w:spacing w:after=\"60\"/></w:pPr>" +
      "<w:r><w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/>" +
      "<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/></w:rPr>" +
      "<w:t xml:space=\"preserve\">" + escapeXml(bullet + " ") + "</w:t></w:r>" +
      children + "</w:p>";
  }

  function genHorizontalRule() {
    return "<w:p><w:pPr><w:pBdr><w:bottom w:val=\"single\" w:sz=\"6\" w:space=\"1\" w:color=\"auto\"/></w:pBdr>" +
      "<w:spacing w:before=\"120\" w:after=\"120\"/></w:pPr></w:p>";
  }
  function genTable(el) {
    var rows = el.querySelectorAll("tr");
    var colCount = 0;
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].querySelectorAll("td, th");
      if (cells.length > colCount) colCount = cells.length;
    }
    if (colCount === 0) colCount = 1;
    var gridCols = "";
    for (var c = 0; c < colCount; c++) {
      gridCols += "<w:gridCol w:w=\"1200\"/>";
    }
    var body = "";
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      body += "<w:tr>";
      var cellList = row.querySelectorAll("td, th");
      for (var c = 0; c < cellList.length; c++) {
        var cell = cellList[c];
        var isHeader = cell.tagName.toLowerCase() === "th";
        var cellText = cell.textContent || "";
        var shading = isHeader ? "<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F2F2F2\"/>" : "";
        body += "<w:tc><w:tcPr>" + shading + "</w:tcPr>" +
          "<w:p><w:pPr><w:spacing w:after=\"60\" w:line=\"240\" w:lineRule=\"auto\"/></w:pPr>" +
          "<w:r><w:rPr>" + (isHeader ? "<w:b/>" : "") +
          "<w:sz w:val=\"20\"/><w:szCs w:val=\"20\"/></w:rPr>" +
          "<w:t xml:space=\"preserve\">" + escapeXml(cellText) + "</w:t></w:r></w:p></w:tc>";
      }
      body += "</w:tr>";
    }
    return "<w:tbl><w:tblPr><w:tblW w:w=\"5000\" w:type=\"pct\"/><w:jc w:val=\"left\"/>" +
      "<w:tblBorders><w:top w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"D0D0D0\"/>" +
      "<w:left w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"D0D0D0\"/>" +
      "<w:bottom w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"D0D0D0\"/>" +
      "<w:right w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"D0D0D0\"/>" +
      "<w:insideH w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"D0D0D0\"/>" +
      "<w:insideV w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"D0D0D0\"/>" +
      "</w:tblBorders></w:tblPr><w:tblGrid>" + gridCols + "</w:tblGrid>" + body + "</w:tbl>";
  }

  function generateDocx(htmlContent, title) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlContent, "text/html");
    var body = doc.body;
    var bodyXml = "";
    for (var i = 0; i < body.childNodes.length; i++) {
      bodyXml += processNode(body.childNodes[i], {});
    }
    if (!bodyXml.trim()) {
      bodyXml = "<w:p><w:r><w:t>No content</w:t></w:r></w:p>";
    }
    var documentXml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
      "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"" +
      " xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"" +
      " xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\"" +
      " mc:Ignorable=\"w14 w15 wp14\">" +
      "<w:body>" + bodyXml +
      "<w:sectPr><w:pgSz w:w=\"12240\" w:h=\"15840\"/>" +
      "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\"" +
      " w:header=\"720\" w:footer=\"720\" w:gutter=\"0\"/></w:sectPr></w:body></w:document>";

    var zip = new JSZip();
    zip.file("[Content_Types].xml", genContentTypes());
    zip.file("_rels/.rels", genRels());
    zip.file("word/document.xml", documentXml);
    zip.file("word/_rels/document.xml.rels", genDocumentRels());
    zip.file("word/styles.xml", genStyles());
    zip.file("docProps/core.xml", genCoreProps());
    zip.file("docProps/app.xml", genAppProps());

    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  return { generateDocx: generateDocx };
})();
