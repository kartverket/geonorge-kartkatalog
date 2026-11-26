import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownText.module.css";

// Dataeiere skriver ofte "###Overskrift" uten mellomrom, som ikke er gyldig
// markdown. Gammel kartkatalog rettet dette før visning (FixMarkDown).
function fixHeadings(text: string): string {
  return text.replace(/^###(?=[^\s#])/gm, "### ");
}

export function MarkdownText({ children }: { children: string }) {
  return (
    <div className={styles.markdown}>
      <Markdown remarkPlugins={[remarkGfm]}>{fixHeadings(children)}</Markdown>
    </div>
  );
}
