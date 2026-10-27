| What the message includes | What the runtime sends |
| ------------------------- | ---------------------- |
| An `http://` or `https://` link with an `image/` media type | An `input_image` part with the link. |
| An `http://` or `https://` link with any other media type, such as a PDF | An `input_file` part with the link. |
| Inline image bytes | An `input_image` part with the bytes as a `data:` URL. |
| Inline bytes of a PDF, `.docx`, `.xlsx`, or `.pptx` file | An `input_file` part with the bytes as a `data:` URL. The bytes must match the media type. A file that does not, such as a text file labeled `application/pdf`, reaches the model as a note that it could not be read. When the inline PDF and Office files in the Session total more than 50 MB, the runtime sends the newest files and replaces each older file with a note. |
| Inline bytes of any other type | The file's text, or a note when the file cannot be read as text. |

The runtime refuses a link that uses any other scheme. When the newest user message includes such a link, the turn fails with `cannot send link "<uri>" with media type "<type>": this provider integration can only pass http and https links`. A link in an older message does not fail the turn, because the runtime sends links from older messages as bare URLs. A model with a fetch tool can still retrieve the file.

When a link or an inline PDF or Office file has a display name, the runtime adds a text part that reads `File: <name>` immediately before the file part. An inline image does not get this text part. For the file types and sizes that the UI accepts, see [Attach files to a message]({{< link path="observability/launch-ui#attach-files-to-a-message" >}}).
