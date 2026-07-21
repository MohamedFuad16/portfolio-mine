# Errors

- System `pdftotext` is not installed. Use bundled Python with `pdfplumber` for CV extraction.
- The shared `adr_index.sh` parser does not understand this repository's `## ADR-001 - date - title` headings; it leaves the date in the title and cannot read `Status:` from the following line. After running it, normalize the generated table manually unless the ADR heading format is migrated first.
