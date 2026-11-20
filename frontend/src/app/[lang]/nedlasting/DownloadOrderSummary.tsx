import { Heading } from "@kv-designsystem/react";
import type { DownloadOrderResult } from "@/lib/schemas/download";
import styles from "./DownloadOrderSummary.module.css";
import { filterProducts, groupOrderedProducts } from "./downloadOrderGrouping";
import type { DownloadCard } from "./downloadUtils";
import { ProductGroup } from "./ProductGroup";

export function DownloadOrderSummary({
  orderResult,
  cards,
}: {
  orderResult: DownloadOrderResult;
  cards: DownloadCard[];
}) {
  const products = groupOrderedProducts(orderResult, cards);
  const readyProducts = filterProducts(
    products,
    (format) => format.isReady && format.downloadUrl !== null,
  );
  const failedProducts = filterProducts(products, (format) => format.isFailed);
  const processingProducts = filterProducts(
    products,
    (format) => !format.isReady && !format.isFailed,
  );

  return (
    <div className={styles.summary}>
      {readyProducts.length > 0 ? (
        <section>
          <Heading level={2} data-size="sm">
            Klar til nedlasting ({readyProducts.length})
          </Heading>
          <div className={styles.productList}>
            {readyProducts.map((product) => (
              <ProductGroup key={product.uuid} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {failedProducts.length > 0 ? (
        <section>
          <Heading level={2} data-size="sm">
            Ikke tilgjengelig ({failedProducts.length})
          </Heading>
          <div className={styles.productList}>
            {failedProducts.map((product) => (
              <ProductGroup key={product.uuid} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {processingProducts.length > 0 ? (
        <section>
          <Heading level={2} data-size="sm">
            Under behandling ({processingProducts.length})
          </Heading>
          <div className={styles.productList}>
            {processingProducts.map((product) => (
              <ProductGroup key={product.uuid} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
