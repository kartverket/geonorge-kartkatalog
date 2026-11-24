import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownText.module.css";

// Dataeiere skriver ofte "###Overskrift" uten mellomrom, som ikke er gyldig
// markdown. Gammel kartkatalog rettet dette før visning (FixMarkDown).
function fixHeadings(text: string): string {
  return text.replace(/^###(?=[^\s#])/gm, "### ");
}

type MarkdownTextProps = {
  children: string;
  // Uten avsnitt rundt, for tekst som står inne i en setning (f.eks. varsler)
  inline?: boolean;
};

export function MarkdownText({ children, inline = false }: MarkdownTextProps) {
  const markdown = (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={inline ? { p: ({ children }) => <>{children}</> } : undefined}
    >
      {fixHeadings(children)}
    </Markdown>
  );

  return inline ? markdown : <div className={styles.markdown}>{markdown}</div>;
}
